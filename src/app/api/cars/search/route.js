// src/app/api/cars/search/route.js
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { runGoSearchShadow } from "@/lib/go-search";
import { GO_SEARCH_ACTIVE_ENABLED } from "@/lib/feature-flags";

const getSearchResults = unstable_cache(
  async (query) => {
    const cars = await db.car.findMany({
      where: {
        available: true,
        OR: [
          { make:  { contains: query, mode: "insensitive" } },
          { model: { contains: query, mode: "insensitive" } },
        ],
      },
      include: {
        images: { where: { isPrimary: true }, take: 1 },
      },
      take: 5,
    });

    return cars.map(car => ({
      id: car.id,
      make: car.make,
      model: car.model,
      year: car.year,
      price: car.price, engineCC: car.engineCC, fuelType: car.fuelType,
      image: car.images[0]?.url || null,
    }));
  },
  ["car-search"],
  { revalidate: 600, tags: ["cars"] }
);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";

  if (query.length < 2) {
    return NextResponse.json([]);
  }

  try {
    const results = await getSearchResults(query);

    // Safe migration path:
    // - Shadow mode compares Node vs Go without changing response payload.
    // - Active mode can be enabled later once shadow mismatch rate is low.
    if (!GO_SEARCH_ACTIVE_ENABLED) {
      const requester =
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        request.headers.get("user-agent") ||
        "unknown";
      void runGoSearchShadow({ query, nodeResults: results, requester });
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
