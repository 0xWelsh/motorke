// src/app/api/cars/search/route.js
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { runGoSearchShadow } from "@/lib/go-search";
import { GO_SEARCH_ACTIVE_ENABLED } from "@/lib/feature-flags";
import { trackRequest } from "@/lib/telemetry";

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
  const started = Date.now();
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";

  if (query.length < 2) {
    trackRequest({
      route: "/api/cars/search",
      method: "GET",
      status: 200,
      durationMs: Date.now() - started,
      ok: true,
    });
    return NextResponse.json([]);
  }

  try {
    const normalized = query.trim();
    const terms = normalized.split(/\s+/).filter(Boolean);
    const results = await getSearchResults(normalized);

    const ranked = [...results].sort((a, b) => {
      const score = (item) => {
        const haystack = `${item.make} ${item.model}`.toLowerCase();
        const exact = haystack === normalized.toLowerCase() ? 10 : 0;
        const starts = haystack.startsWith(normalized.toLowerCase()) ? 5 : 0;
        const tokenHits = terms.reduce((sum, t) => (haystack.includes(t.toLowerCase()) ? sum + 1 : sum), 0);
        return exact + starts + tokenHits;
      };
      return score(b) - score(a);
    });

    // Safe migration path:
    // - Shadow mode compares Node vs Go without changing response payload.
    // - Active mode can be enabled later once shadow mismatch rate is low.
    if (!GO_SEARCH_ACTIVE_ENABLED) {
      const requester =
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        request.headers.get("user-agent") ||
        "unknown";
      void runGoSearchShadow({ query: normalized, nodeResults: ranked, requester });
    }

    trackRequest({
      route: "/api/cars/search",
      method: "GET",
      status: 200,
      durationMs: Date.now() - started,
      ok: true,
    });
    return NextResponse.json(ranked);
  } catch (error) {
    console.error("Search error:", error);
    trackRequest({
      route: "/api/cars/search",
      method: "GET",
      status: 500,
      durationMs: Date.now() - started,
      ok: false,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
