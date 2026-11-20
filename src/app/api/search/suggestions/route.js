import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { z } from "zod";
import { PUBLIC_ONLY_VERIFIED_DEALERS } from "@/lib/feature-flags";
import { logSearchQuery } from "@/lib/seo-trending";

const querySchema = z.object({
  query: z.string().min(1).max(50),
  limit: z.coerce.number().positive().max(20).optional().default(12),
  includeCarListings: z.enum(["true", "false"]).optional().default("true"),
});

/** Generate hyphen-inserted variants so "cx5" matches "CX-5" */
function expandToken(trimmed) {
  if (trimmed.length < 3 || trimmed.includes("-")) return [trimmed];
  const variants = [trimmed];
  for (let i = 1; i < trimmed.length; i++) {
    variants.push(trimmed.slice(0, i) + "-" + trimmed.slice(i));
  }
  return variants;
}

/** One search token → OR clause on multiple fields. */
function tokenWhere(token) {
  const trimmed = token.trim();
  if (!trimmed) return null;
  const asNum = parseInt(trimmed, 10);
  const isYear =
    !Number.isNaN(asNum) &&
    String(asNum) === trimmed &&
    asNum >= 1980 &&
    asNum <= new Date().getFullYear() + 1;

  const tokens = expandToken(trimmed);
  const textOr = tokens.flatMap(t => [
    { make:     { contains: t, mode: "insensitive" } },
    { model:    { contains: t, mode: "insensitive" } },
    { variant:  { contains: t, mode: "insensitive" } },
    { color:    { contains: t, mode: "insensitive" } },
  ]);
  if (isYear) {
    return { OR: [{ year: asNum }, ...textOr] };
  }
  return { OR: textOr };
}

function buildCarTextFilter(query) {
  const words = query
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4);
  const tokenClauses = words.map(tokenWhere).filter(Boolean);

  if (tokenClauses.length > 0) {
    // For suggestions, we use OR to be more discoverable, 
    // but the ranking in loadSuggestions will prioritize better matches.
    return { OR: tokenClauses };
  }
  const tokens = expandToken(query);
  return {
    OR: tokens.flatMap(t => [
      { make: { contains: t, mode: "insensitive" } },
      { model: { contains: t, mode: "insensitive" } },
      { variant: { contains: t, mode: "insensitive" } },
    ]),
  };
}

function verifiedWhere(extra = {}) {
  return {
    available: true,
    ...(PUBLIC_ONLY_VERIFIED_DEALERS && { dealer: { verified: true } }),
    ...extra,
  };
}

async function loadSuggestions(normalizedQuery, limit, showCars) {
  const carTextFilter = buildCarTextFilter(normalizedQuery);

  const [cars, makes, models, variants] = await Promise.all([
    showCars
      ? db.car.findMany({
          where: verifiedWhere(carTextFilter),
          include: {
            images: { where: { isPrimary: true }, take: 1 },
            dealer: { select: { name: true, location: true, verified: true } },
          },
          take: 8,
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
    db.car.findMany({
      where: verifiedWhere({
        OR: expandToken(normalizedQuery).map(t => ({ make: { contains: t, mode: "insensitive" } })),
      }),
      select: { make: true },
      distinct: ["make"],
      take: limit,
    }),
    db.car.findMany({
      where: verifiedWhere({
        OR: expandToken(normalizedQuery).map(t => ({ model: { contains: t, mode: "insensitive" } })),
      }),
      select: { model: true },
      distinct: ["model"],
      take: limit,
    }),
    db.car.findMany({
      where: verifiedWhere({
        OR: expandToken(normalizedQuery).map(t => ({ variant: { contains: t, mode: "insensitive" } })),
        NOT: { variant: null },
      }),
      select: { variant: true },
      distinct: ["variant"],
      take: Math.floor(limit / 2),
    }),
  ]);

  const carSuggestions = cars.map((car) => {
    const make = car.make.toLowerCase();
    const model = car.model.toLowerCase();
    const variant = (car.variant || "").toLowerCase();
    const fullName = `${car.year} ${make} ${model} ${variant}`.toLowerCase();
    const terms = normalizedQuery.split(/\s+/).filter(Boolean);
    
    // Aggressive normalization for "cx5" vs "cx-5"
    const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
    const normFullName = normalize(fullName);
    const normTerms = terms.map(normalize).filter(Boolean);

    let score = 0;
    let matchCount = 0;
    
    normTerms.forEach(term => {
      let termMatched = false;
      if (normFullName.includes(term)) {
        score += 10;
        termMatched = true;
      }
      if (normalize(make) === term) score += 30;
      if (normalize(model) === term) score += 20;
      if (termMatched) matchCount++;
    });

    const coverage = matchCount / (normTerms.length || 1);
    const finalScore = score * coverage;

    return {
      type: "car",
      id: car.id,
      publicSlug: car.publicSlug,
      value: [car.year, car.make, car.model, car.variant].filter(Boolean).join(" "),
      year: car.year,
      make: car.make,
      model: car.model,
      price: car.price,
      mileage: car.mileage,
      image: car.images[0]?.url || null,
      dealerName: car.dealer?.name,
      dealerVerified: car.dealer?.verified,
      location: car.dealer?.location,
      _relevance: finalScore,
    };
  }).sort((a, b) => b._relevance - a._relevance);

  const attributeSuggestions = [
    ...makes.map((car) => ({ type: "make", value: car.make, _relevance: car.make.toLowerCase() === normalizedQuery ? 100 : 50 })),
    ...models.map((car) => ({ type: "model", value: car.model, _relevance: car.model.toLowerCase() === normalizedQuery ? 90 : 40 })),
    ...variants.map((car) => ({ type: "variant", value: car.variant, _relevance: 30 })),
  ];

  const uniqueAttributes = [
    ...new Map(attributeSuggestions.map((s) => [s.value.toLowerCase(), s])).values(),
  ].sort((a, b) => b._relevance - a._relevance);

  // Interleave cars and attributes, but keep highly relevant attributes at top
  return [...carSuggestions.slice(0, 4), ...uniqueAttributes, ...carSuggestions.slice(4)].slice(0, limit);
}

const getCachedSuggestions = unstable_cache(
  loadSuggestions,
  ["search-suggestions-v1"],
  { revalidate: 300, tags: ["cars-listing", "search-suggestions"] },
);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const rawParams = Object.fromEntries(searchParams.entries());

  const parsed = querySchema.safeParse(rawParams);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid parameters", details: parsed.error.issues }, { status: 400 });
  }

  const { query, limit, includeCarListings } = parsed.data;
  const showCars = includeCarListings === "true";
  const normalizedQuery = query.trim().toLowerCase();

  const suggestions = await getCachedSuggestions(normalizedQuery, limit, showCars);

  logSearchQuery({ query, resultCount: suggestions.length }).catch(() => {});

  return NextResponse.json(
    { query, suggestions },
    {
      headers: {
        "Cache-Control": "public, max-age=45, s-maxage=90, stale-while-revalidate=300",
      },
    },
  );
}
