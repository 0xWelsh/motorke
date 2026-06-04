// src/app/api/cars/search/route.js
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { withDbRetry } from "@/lib/db-retry";
import { runGoSearchShadow } from "@/lib/go-search";
import { GO_SEARCH_ACTIVE_ENABLED, PUBLIC_ONLY_VERIFIED_DEALERS } from "@/lib/feature-flags";
import { trackRequest } from "@/lib/telemetry";

const getSearchResults = unstable_cache(
  async (normalizedQuery) => {
    const tokens = normalizedQuery.split(/\s+/).filter(t => t.length >= 2);
    if (!tokens.length) return [];

    // Search logic: Match cars that contain ANY of the search tokens in key fields
    const cars = await withDbRetry(() => db.car.findMany({
      where: {
        available: true,
        ...(PUBLIC_ONLY_VERIFIED_DEALERS && { dealer: { verified: true } }),
        OR: tokens.flatMap(token => ([
          { make:    { contains: token, mode: "insensitive" } },
          { model:   { contains: token, mode: "insensitive" } },
          { variant: { contains: token, mode: "insensitive" } },
          { color:   { contains: token, mode: "insensitive" } },
        ])),
      },
      include: {
        images: { where: { isPrimary: true }, take: 1 },
      },
      take: 20, // Take more for better in-memory ranking
    }));

    return cars.map(car => ({
      id: car.id,
      make: car.make,
      model: car.model,
      year: car.year,
      price: car.price, 
      engineCC: car.engineCC, 
      fuelType: car.fuelType,
      variant: car.variant,
      image: car.images[0]?.url || null,
    }));
  },
  ["car-search-v2"],
  { revalidate: 600, tags: ["cars"] }
);

export async function GET(request) {
  const started = Date.now();
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";

  if (query.trim().length < 2) {
    return NextResponse.json([]);
  }

  try {
    const normalized = query.trim();
    const terms = normalized.toLowerCase().split(/\s+/).filter(Boolean);
    const rawResults = await getSearchResults(normalized);

    // Smarter Weighted Ranking
    const ranked = rawResults.map(item => {
      const make = item.make.toLowerCase();
      const model = item.model.toLowerCase();
      const variant = (item.variant || "").toLowerCase();
      const fullName = `${make} ${model} ${variant}`.trim();
      
      // Aggressive normalization for "cx5" vs "cx-5"
      const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
      const normFullName = normalize(fullName);
      const normQuery = normalize(normalized);
      const normTerms = terms.map(normalize).filter(Boolean);

      let score = 0;

      // 1. Exact full name match (highest priority)
      if (normFullName === normQuery) score += 100;
      
      // 2. Exact make match
      if (normTerms.includes(normalize(make))) score += 40;
      
      // 3. Exact model match
      if (normTerms.includes(normalize(model))) score += 30;

      // 4. Token hits
      normTerms.forEach(term => {
        if (normFullName.includes(term)) score += 10;
        if (normalize(make).startsWith(term) || normalize(model).startsWith(term)) score += 5;
      });

      return { ...item, _score: score };
    })
    .sort((a, b) => b._score - a._score)
    .slice(0, 8); // Return top 8 best matches

    // Shadow mode for Go Search optimization
    if (!GO_SEARCH_ACTIVE_ENABLED) {
      const requester = request.headers.get("x-forwarded-for") || "unknown";
      void runGoSearchShadow({ query: normalized, nodeResults: ranked, requester });
    }

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
