// src/app/api/cars/[id]/related-views/route.js
// Returns cars that were also viewed by people who viewed the current car.
// Optimized: single query with subquery, uses new composite index.
import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// Fired on every detail page after hydration; co-occurrence only moves slowly.
const getRelatedViews = unstable_cache(
  async (id) => {
    const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    // Single optimized query using subquery:
    // 1. Find viewer sessions (userId + sessionKey) for this car
    // 2. Find other cars viewed by those sessions
    // 3. Count co-occurrences and rank
    // 4. Join car data in one round trip
    
    const relatedCars = await db.$queryRaw`
      WITH viewers AS (
        SELECT DISTINCT "userId", "sessionKey"
        FROM car_views
        WHERE "carId" = ${id}
          AND "viewedAt" >= ${since}
      ),
      co_views AS (
        SELECT cv."carId" as car_id, COUNT(DISTINCT COALESCE(cv."userId", '') || ':' || COALESCE(cv."sessionKey", '')) as co_view_count
        FROM car_views cv
        JOIN viewers v ON (cv."userId" = v."userId" OR cv."sessionKey" = v."sessionKey")
        WHERE cv."carId" != ${id}
          AND cv."viewedAt" >= ${since}
          AND cv."carId" IS NOT NULL
        GROUP BY cv."carId"
        ORDER BY co_view_count DESC
        LIMIT 8
      )
      SELECT c.id, c.make, c.model, c.variant, c.year, c.price, c.mileage,
             c."bodyType" as body_type, c."fuelType" as fuel_type, c.transmission, c.color, c.location,
             c.available, c."createdAt" as created_at,
             c."dealerId" as dealer_id,
             d.name as dealer_name, d.location as dealer_location,
             d.type as dealer_type, d."verificationStatus" as dealer_verification_status,
             (SELECT json_agg(json_build_object('url', s.url, 'alt', s.alt, 'is_primary', s."isPrimary", 'order', s."order"))
              FROM (
                SELECT ci.url, ci.alt, ci."isPrimary", ci."order"
                FROM car_images ci
                WHERE ci."carId" = c.id
                ORDER BY ci."isPrimary" DESC, ci."order"
                LIMIT 1
              ) s) as images,
             cv.co_view_count
      FROM co_views cv
      JOIN cars c ON c.id = cv.car_id
      JOIN dealers d ON d.id = c."dealerId"
      WHERE c.available = true
      ORDER BY cv.co_view_count DESC;
    `;

    return relatedCars;
  },
  ["related-views"],
  { revalidate: 600, tags: ["cars"] }
);

export async function GET(req, { params }) {
  const { id } = await params;
  if (!id) return NextResponse.json({ cars: [] });
  
  try {
    const cars = await getRelatedViews(id);
    return NextResponse.json(
      { cars },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900" } }
    );
  } catch (err) {
    console.error("[related-views] error:", err);
    return NextResponse.json({ cars: [] }, { status: 200 }); // Return empty on error to not break page
  }
}