import { db } from "./db";

/**
 * Basic Price Analysis for a vehicle
 * @param {object} car - The car object containing make, model, year, price
 * @returns {Promise<object>} - { label: 'Great Price'|'Fair Price'|'Market Price', color: string, comparison: number }
 */
export async function analyzePrice(car) {
  if (!car?.make || !car?.model || !car?.price) return null;

  try {
    // Find sample of similar cars (same make, model)
    const similar = await db.car.findMany({
      where: {
        make: car.make,
        model: car.model,
        year: { gte: car.year - 1, lte: car.year + 1 },
        available: true,
      },
      select: { price: true },
      take: 20
    });

    if (similar.length < 3) {
      // Not enough data for specific year, broaden to all years for that model
      const broader = await db.car.findMany({
        where: { make: car.make, model: car.model, available: true },
        select: { price: true },
        take: 50
      });
      if (broader.length < 3) return null;
      return calculateMetric(car.price, broader.map(s => s.price));
    }

    return calculateMetric(car.price, similar.map(s => s.price));
  } catch (error) {
    console.error("[market] Price analysis failed:", error);
    return null;
  }
}

function calculateMetric(price, prices) {
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
  
  if (price <= avg * 0.90) return { label: "Great Deal", color: "emerald", comparison: -10 };
  if (price <= avg * 1.05) return { label: "Fair Price", color: "blue", comparison: 0 };
  return { label: "Good Value", color: "slate", comparison: 5 };
}
