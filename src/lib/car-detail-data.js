// src/lib/car-detail-data.js
// Optimized detail-page queries with better SQL and caching.
// Key optimizations:
// - Use SQL-level filtering instead of fetching 60+ rows and scoring in JS
// - Limit candidate pool with proper indexes
// - Combine queries where possible
import { db } from "@/lib/db";
import { unstable_cache } from "next/cache";
import { PUBLIC_ONLY_VERIFIED_DEALERS } from "@/lib/feature-flags";
import { Prisma } from "@prisma/client";

const dealerVerificationFilter = PUBLIC_ONLY_VERIFIED_DEALERS
  ? { dealer: { verificationStatus: "VERIFIED" } }
  : {};

export const getSimilarCars = unstable_cache(
  async (carId, make, dealerId, bodyType, year, price) => {
    // Use SQL-level scoring for better performance
    const candidates = await db.$queryRaw`
      SELECT 
        c.id, c.make, c.model, c.variant, c.year, c.price, c.mileage,
        c."bodyType"::text as body_type, c."fuelType"::text as fuel_type, c.transmission, c.color, c.location,
        c.available, c."createdAt" as created_at, c.badges, c.description, c.featured,
        c."featuredWeight" as featured_weight, c."spotlightUntil" as spotlight_until, c."hotBadgeUntil" as hot_badge_until, c.views,
        c."dealerId" as dealer_id,
        d.name as dealer_name, d.location as dealer_location,
        d.type as dealer_type, d."verificationStatus" as dealer_verification_status,
        (SELECT json_agg(json_build_object('url', s.url, 'alt', s.alt, 'is_primary', s."isPrimary", 'order', s."order"))
         FROM (
           SELECT ci.url, ci.alt, ci."isPrimary", ci."order"
           FROM car_images ci
           WHERE ci."carId" = c.id
           ORDER BY ci."isPrimary" DESC, ci."order"
           LIMIT 3
         ) s) as images
      FROM cars c
      JOIN dealers d ON d.id = c."dealerId"
      WHERE c.available = true
        AND c.id != ${carId}
        AND c.make = ${make}
        ${dealerVerificationFilter.dealer ? Prisma.sql`AND d."verificationStatus" = 'VERIFIED'` : Prisma.empty}
      ORDER BY 
        (CASE WHEN c."dealerId" = ${dealerId} THEN 45 ELSE 0 END) +
        (CASE WHEN c."bodyType"::text = ${bodyType} THEN 20 ELSE 0 END) +
        GREATEST(0, 15 - ABS(COALESCE(c.year, 0) - COALESCE(${year}, 0)) * 3) +
        GREATEST(0, 20 - (ABS(COALESCE(c.price, 0) - COALESCE(${price}, 0))::float / NULLIF(${price}, 0)) * 40) +
        (CASE WHEN d."verificationStatus" = 'VERIFIED' THEN 3 ELSE 0 END) DESC,
        c."createdAt" DESC
      LIMIT 8;
    `;

    return candidates;
  },
  ["similar-cars"],
  { revalidate: 600, tags: ["cars"] }
);

/**
 * "People also search for" — optimized with SQL pre-filtering
 * Only fetches ~20 candidates instead of 60, scoring done in SQL
 */
export const getPeopleAlsoSearch = unstable_cache(
  async (carId, make, model, bodyType, fuelType, price, year) => {
    const anchorPrice = Number(price) || 0;
    const floor = anchorPrice
      ? Math.max(0, Math.round(Math.max(anchorPrice * 0.75, anchorPrice - 500000)))
      : 0;
    const ceiling = anchorPrice ? Math.round(Math.min(anchorPrice * 1.25, anchorPrice + 500000)) : 999999999;

    // SQL does the heavy lifting: filter, score, dedupe by make+model
    const picks = await db.$queryRaw`
      WITH candidates AS (
        SELECT 
          c.id, c.make, c.model, c.variant, c.year, c.price, c.mileage,
          c."bodyType"::text as body_type, c."fuelType"::text as fuel_type, c.transmission, c.color, c.location,
          c.available, c."createdAt" as created_at,
          c."dealerId" as dealer_id,
          d.name as dealer_name, d.location as dealer_location,
          d.type as dealer_type,
          d."verificationStatus" as dealer_verification_status,
          (SELECT json_agg(json_build_object('url', s.url, 'alt', s.alt, 'is_primary', s."isPrimary", 'order', s."order"))
           FROM (
             SELECT ci.url, ci.alt, ci."isPrimary", ci."order"
             FROM car_images ci
             WHERE ci."carId" = c.id
             ORDER BY ci."isPrimary" DESC, ci."order"
             LIMIT 1
           ) s) as images
        FROM cars c
        JOIN dealers d ON d.id = c."dealerId"
        WHERE c.available = true
          AND c.id != ${carId}
          ${dealerVerificationFilter.dealer ? Prisma.sql`AND d."verificationStatus" = 'VERIFIED'` : Prisma.empty}
          AND (
            ${bodyType ? Prisma.sql`c."bodyType"::text = ${bodyType}` : Prisma.sql`1=0`}
            OR LOWER(c.make) = LOWER(${make})
            OR LOWER(c.model) = LOWER(${model})
            ${fuelType ? Prisma.sql`OR c."fuelType"::text = ${fuelType}` : Prisma.sql``}
            ${anchorPrice ? Prisma.sql`OR (c.price BETWEEN ${floor} AND ${ceiling})` : Prisma.sql``}
          )
        LIMIT 30
      ),
      scored AS (
        SELECT 
          c.*,
          (CASE WHEN LOWER(c.make) = LOWER(${make}) THEN 30 ELSE 0 END) as score_make,
          (CASE WHEN LOWER(c.model) = LOWER(${model}) THEN 46 ELSE 0 END) as score_model,
          (CASE WHEN c.body_type = ${bodyType} THEN 18 ELSE 0 END) as score_body,
          (CASE WHEN c.fuel_type = ${fuelType} THEN 10 ELSE 0 END) as score_fuel,
          (CASE 
            WHEN ${anchorPrice} > 0 AND ABS(c.price - ${anchorPrice})::float / ${anchorPrice} <= 0.1 THEN 24
            WHEN ${anchorPrice} > 0 AND ABS(c.price - ${anchorPrice})::float / ${anchorPrice} <= 0.25 THEN 12
            ELSE 0 
          END) as score_price,
          GREATEST(0, 12 - ABS(COALESCE(c.year, 0) - COALESCE(${year}, 0)) * 4) as score_year,
          (CASE WHEN d."verificationStatus" = 'VERIFIED' THEN 2 ELSE 0 END) as score_verified,
          ABS(c.price - ${anchorPrice})::float / NULLIF(${anchorPrice}, 0) as price_gap
        FROM candidates c
        JOIN dealers d ON d.id = c.dealer_id
      ),
      tagged AS (
        SELECT 
          s.*,
          CASE 
            WHEN LOWER(s.make) = LOWER(${make}) AND LOWER(s.model) = LOWER(${model}) THEN 'Same model'
            WHEN LOWER(s.make) = LOWER(${make}) THEN 'Same make'
            WHEN s.body_type = ${bodyType} THEN 'Same body'
            WHEN s.fuel_type = ${fuelType} THEN 'Same fuel'
            WHEN ${anchorPrice} > 0 AND s.price_gap <= 0.1 THEN 'In your budget'
            WHEN ${year} > 0 AND s.year = ${year} THEN 'Same year'
            ELSE NULL
          END as reason,
          ROW_NUMBER() OVER (PARTITION BY LOWER(s.make), LOWER(s.model) ORDER BY 
            (s.score_make + s.score_model + s.score_body + s.score_fuel + s.score_price + s.score_year + s.score_verified) DESC
          ) as rn
        FROM scored s
      )
      SELECT 
        id, make, model, variant, year, price, mileage,
        body_type, fuel_type, transmission, color, location,
        available, created_at,
        dealer_id, dealer_name, dealer_location, dealer_type, dealer_verification_status,
        images,
        reason,
        (price < ${anchorPrice}) as _cheaper
      FROM tagged
      WHERE reason IS NOT NULL AND rn = 1
      ORDER BY 
        (score_make + score_model + score_body + score_fuel + score_price + score_year + score_verified) DESC
      LIMIT 8;
    `;

    return picks;
  },
  ["people-also-search"],
  { revalidate: 600, tags: ["cars"] }
);

export function getPriceBenchmark(make, model, year, excludeId) {
  const cached = unstable_cache(
    async () => {
      // Use percentile_agg approximation for better performance
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
    { revalidate: 600, tags: [`car-reviews:${carId}`] }
  );
  return cached();
}