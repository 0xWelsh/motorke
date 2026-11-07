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
        SELECT DISTINCT user_id, session_key
        FROM car_views
        WHERE car_id = ${id}
          AND viewed_at >= ${since}
      ),
      co_views AS (
        SELECT cv.car_id, COUNT(DISTINCT cv.user_id || ':' || cv.session_key) as co_view_count
        FROM car_views cv
        JOIN viewers v ON (cv.user_id = v.user_id OR cv.session_key = v.session_key)
        WHERE cv.car_id != ${id}
          AND cv.viewed_at >= ${since}
          AND cv.car_id IS NOT NULL
        GROUP BY cv.car_id
        ORDER BY co_view_count DESC
        LIMIT 8
      )
      SELECT c.id, c.make, c.model, c.variant, c.year, c.price, c.mileage,
             c.body_type, c.fuel_type, c.transmission, c.color, c.location,
             c.available, c.created_at,
             c.dealer_id,
             d.name as dealer_name, d.location as dealer_location,
             d.type as dealer_type, d.verification_status as dealer_verification_status,
             (SELECT json_agg(json_build_object('url', ci.url, 'alt', ci.alt, 'is_primary', ci.is_primary, 'order', ci."order"))
              FROM car_images ci
              WHERE ci.car_id = c.id
              ORDER BY ci.is_primary DESC, ci."order"
              LIMIT 1) as images,
             cv.co_view_count
      FROM co_views cv
      JOIN cars c ON c.id = cv.car_id
      JOIN dealers d ON d.id = c.dealer_id
      WHERE c.available = true
      ORDER BY cv.co_view_count DESC;
    `;

    return relatedCars;
  },
  ["related-views"],
  { revalidate: 300, tags: ["cars"] }
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