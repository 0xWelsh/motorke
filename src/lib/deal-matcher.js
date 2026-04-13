import { db } from "./db";

/**
 * Find "better deals" for a car that was recently viewed
 * Better deal = similar car (make/model), lower price, different car
 * @param {string} carId - Original car that was viewed
 * @param {object} options - { maxPriceDrop: 50000, maxAgeDays: 7 }
 * @returns {Promise<object|null>} - Matched car or null if no good match
 */
export async function findBetterDeal(carId, options = {}) {
  const { maxPriceDrop = 500000, maxAgeDays = 7 } = options;

  try {
    // Get the car that was viewed
    const viewedCar = await db.car.findUnique({
      where: { id: carId },
    });

    if (!viewedCar) return null;

    // Find similar cars in stock (same make/model, different ID)
    // Sort by price (lowest first), then by year (newest first)
    const betterDeals = await db.car.findMany({
      where: {
        id: { not: carId }, // Different car
        make: viewedCar.make,
        model: viewedCar.model,
        price: {
          // Price must be at least 5% cheaper (or maxPriceDrop, whichever is less)
          lt: viewedCar.price * 0.95,
        },
        active: true, // Only active listings
        status: "available", // Not sold
      },
      orderBy: [
        { price: "asc" }, // Cheapest first
        { year: "desc" }, // Then newest
      ],
      take: 3, // Top 3 matches
    });

    // Return best match (cheapest)
    return betterDeals.length > 0 ? betterDeals[0] : null;
  } catch (error) {
    console.error("[deal-matcher] Error finding better deal:", error);
    return null;
  }
}

/**
 * For a user, find all their recent car views and corresponding better deals
 * Returns grouped deals for weekly digest email
 * @param {string} userId - User ID
 * @param {number} daysBack - How many days back to look (default 7)
 * @returns {Promise<Array>} - Array of { viewedCar, betterDeal } objects
 */
export async function findBetterDealsForUser(userId, daysBack = 7) {
  try {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - daysBack);

    // Get this user's recent car views
    const recentViews = await db.carView.findMany({
      where: {
        userId,
        viewedAt: {
          gte: sinceDate,
        },
      },
      include: {
        car: true, // Get the car they viewed
      },
      orderBy: { viewedAt: "desc" },
    });

    if (recentViews.length === 0) return [];

    // For each view, find better deals
    const dealsWithMatches = [];

    for (const view of recentViews) {
      const betterDeal = await findBetterDeal(view.carId);

      if (betterDeal) {
        dealsWithMatches.push({
          viewedCar: view.car,
          viewedAt: view.viewedAt,
          betterDeal,
          savings: view.car.price - betterDeal.price,
          savingsPercent: Math.round(
            ((view.car.price - betterDeal.price) / view.car.price) * 100
          ),
        });
      }
    }

    // Sort by savings amount (largest first)
    dealsWithMatches.sort((a, b) => b.savings - a.savings);

    return dealsWithMatches;
  } catch (error) {
    console.error("[deal-matcher] Error finding deals for user:", error);
    return [];
  }
}

/**
 * Get all users who viewed cars in the past N days
 * Returns user details needed for sending emails
 * @param {number} daysBack - Days to look back (default 7)
 * @returns {Promise<Array>} - Array of { userId, email, name, viewCount }
 */
export async function getUsersWithRecentViews(daysBack = 7) {
  try {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - daysBack);

    // Group views by user
    const viewsByUser = await db.carView.groupBy({
      by: ["userId"],
      where: {
        userId: { not: null }, // Only logged-in users
        viewedAt: {
          gte: sinceDate,
        },
      },
      _count: {
        id: true,
      },
    });

    if (viewsByUser.length === 0) return [];

    // Get full user details
    const usersWithCounts = await Promise.all(
      viewsByUser.map(async (group) => {
        const user = await db.user.findUnique({
          where: { id: group.userId },
          select: { id: true, email: true, name: true },
        });

        return {
          userId: group.userId,
          email: user?.email,
          name: user?.name || "Valued Customer",
          viewCount: group._count.id,
        };
      })
    );

    // Filter out users without email
    return usersWithCounts.filter((u) => u.email);
  } catch (error) {
    console.error("[deal-matcher] Error getting users with recent views:", error);
    return [];
  }
}
