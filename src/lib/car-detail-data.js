// src/lib/car-detail-data.js
// Slow, cacheable detail-page queries isolated from the render shell so
// the listing can stream: gallery/price/reviews render first, deep
// inventory scans (similar cars, market benchmark) fill in after.
import { db } from "@/lib/db";
import { unstable_cache } from "next/cache";
import { PUBLIC_ONLY_VERIFIED_DEALERS } from "@/lib/feature-flags";

export const getSimilarCars = unstable_cache(
  async (carId, make, dealerId, bodyType, year, price) => {
    const candidates = await db.car.findMany({
      where: {
        available: true,
        ...(PUBLIC_ONLY_VERIFIED_DEALERS && { dealer: { verificationStatus: "VERIFIED" } }),
        id: { not: carId },
        make,
      },
      include: {
        images: { take: 3, orderBy: { isPrimary: "desc" } },
        dealer: { select: { name: true, location: true, type: true, verificationStatus: true } },
      },
      take: 12,
    });

    return candidates
      .map((candidate) => {
        let score = 0;

        if (candidate.dealerId === dealerId) score += 45;
        if (candidate.bodyType === bodyType) score += 20;

        const yearGap = Math.abs((candidate.year || 0) - (year || 0));
        score += Math.max(0, 15 - yearGap * 3);

        const priceGap = Math.abs((candidate.price || 0) - (price || 0));
        const priceGapRatio = price ? priceGap / price : 1;
        score += Math.max(0, 20 - priceGapRatio * 40);

        if (candidate.dealer?.verified) score += 3;

        return { candidate, score };
      })
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return (b.candidate.createdAt?.getTime?.() || 0) - (a.candidate.createdAt?.getTime?.() || 0);
      })
      .slice(0, 8)
      .map((entry) => entry.candidate);
  },
  ["similar-cars"],
  { revalidate: 600, tags: ["cars"] }
);

export function getPriceBenchmark(make, model, year, excludeId) {
  const cached = unstable_cache(
    async () => {
      const rows = await db.car.findMany({
        where: {
          make,
          model,
          year: { gte: year - 2, lte: year + 2 },
          available: true,
          price: { gt: 0 },
          id: { not: excludeId },
        },
        select: { price: true },
      });

      if (rows.length < 2) return null;

      const prices = rows.map((r) => r.price).sort((a, b) => a - b);
      const low = prices[Math.floor(prices.length * 0.15)];
      const high = prices[Math.floor(prices.length * 0.85)];
      const avg = Math.round(prices.reduce((s, p) => s + p, 0) / prices.length);
      const count = prices.length;

      return { low, high, avg, count };
    },
    ["price-benchmark", make, model, String(year), excludeId],
    { revalidate: 600, tags: ["cars"] }
  );
  return cached();
}

export function getCarReviews(carId) {
  const cached = unstable_cache(
    async () => {
      const reviews = await db.carReview.findMany({
        where: { carId },
        include: {
          user: { select: { name: true, avatarUrl: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      });

      const avgRating = reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : null;

      return { reviews, avgRating, count: reviews.length };
    },
    ["car-reviews", carId],
    { revalidate: 300, tags: [`car-reviews:${carId}`] }
  );
  return cached();
}