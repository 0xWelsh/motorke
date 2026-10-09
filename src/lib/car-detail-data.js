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

/**
 * "People also search for" — what a buyer would plausibly click next.
 *
 * Unlike getSimilarCars (same make, dealer-weighted) this deliberately looks
 * across the whole inventory: the most common follow-up after a listing is
 * "something in my budget, but a different badge". Each pick carries the
 * reason it surfaced so the UI can say why instead of showing an unexplained
 * grid of cars.
 *
 * Scored in SQL with an OR of cheap pre-filters, then ranked in JS so the
 * explanation and the ranking can never disagree.
 */
export const getPeopleAlsoSearch = unstable_cache(
  async (carId, make, model, bodyType, fuelType, price, year) => {
    const anchorPrice = Number(price) || 0;
    // Same budget band: +/-25%, or a fixed KES 500k either side of a cheap car.
    const floor = anchorPrice
      ? Math.max(0, Math.round(Math.max(anchorPrice * 0.75, anchorPrice - 500000)))
      : 0;
    const ceiling = anchorPrice ? Math.round(Math.min(anchorPrice * 1.25, anchorPrice + 500000)) : Number.MAX_SAFE_INTEGER;

    const candidates = await db.car.findMany({
      where: {
        available: true,
        id: { not: carId },
        ...(PUBLIC_ONLY_VERIFIED_DEALERS && { dealer: { verificationStatus: "VERIFIED" } }),
        OR: [
          bodyType ? { bodyType } : null,
          { make },
          { model: { equals: model, mode: "insensitive" } },
          ...(fuelType ? [{ fuelType }] : []),
          ...(anchorPrice ? [{ price: { gte: floor, lte: ceiling } }] : []),
        ].filter(Boolean),
      },
      select: {
        id: true,
        make: true,
        model: true,
        variant: true,
        year: true,
        price: true,
        mileage: true,
        bodyType: true,
        fuelType: true,
        transmission: true,
        color: true,
        location: true,
        available: true,
        createdAt: true,
        images: { select: { url: true, alt: true, isPrimary: true, order: true }, orderBy: { order: "asc" }, take: 1 },
        dealer: { select: { name: true, location: true, verificationStatus: true } },
      },
      take: 60,
    });

    const lower = (s) => String(s || "").trim().toLowerCase();

    const scored = candidates.map((candidate) => {
      let score = 0;
      const tags = [];

      const priceGap = anchorPrice ? Math.abs((candidate.price || 0) - anchorPrice) / anchorPrice : 0;

      if (lower(candidate.make) === lower(make)) {
        score += 30;
        tags.push({ rank: 4, label: "Same make" });
      }
      if (lower(candidate.model) === lower(model)) {
        score += 46;
        tags.push({ rank: 0, label: "Same model" });
      }
      if (bodyType && candidate.bodyType === bodyType) {
        score += 18;
        tags.push({ rank: 3, label: "Same body" });
      }
      if (fuelType && candidate.fuelType === fuelType) {
        score += 10;
        tags.push({ rank: 5, label: "Same fuel" });
      }
      if (anchorPrice && priceGap <= 0.1) {
        score += 24;
        tags.push({ rank: 1, label: "In your budget" });
      } else if (anchorPrice && priceGap <= 0.25) {
        score += 12;
      }

      const yearGap = Math.abs((candidate.year || 0) - (year || 0));
      score += Math.max(0, 12 - yearGap * 4);

      if (yearGap === 0 && year) tags.push({ rank: 2, label: "Same year" });
      if (candidate.dealer?.verificationStatus === "VERIFIED") score += 2;

      return { candidate, score, tags, priceGap };
    });

    // One card per make+model so the strip shows variety instead of five
    // near-identical trims of the same car.
    const ranked = scored
      .filter((entry) => entry.tags.length > 0)
      .sort((a, b) => (b.score !== a.score ? b.score - a.score : (b.candidate.price || 0) - (a.candidate.price || 0)));

    const seenModel = new Set();
    const unique = ranked.filter((entry) => {
      const key = `${lower(entry.candidate.make)}|${lower(entry.candidate.model)}`;
      if (seenModel.has(key)) return false;
      seenModel.add(key);
      return true;
    });

    // A strip where every card says "Same body" tells the buyer nothing. Take
    // the best-scoring card for each reason first, then backfill by score, so
    // the labels actually differ while the ranking still holds.
    const usedReasons = new Set();
    const byReason = [];
    const rest = [];
    for (const entry of unique) {
      const top = entry.tags.slice().sort((a, b) => a.rank - b.rank)[0].label;
      if (!usedReasons.has(top)) {
        usedReasons.add(top);
        byReason.push(entry);
      } else {
        rest.push(entry);
      }
    }
    const picks = [...byReason, ...rest].slice(0, 8).map((entry) => ({
      ...entry.candidate,
      _reason: entry.tags.slice().sort((a, b) => a.rank - b.rank)[0].label,
      _cheaper: Boolean(anchorPrice && entry.priceGap > 0 && entry.candidate.price < anchorPrice),
    }));

    return picks;
  },
  ["people-also-search"],
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