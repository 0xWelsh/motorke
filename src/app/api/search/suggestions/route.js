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

/** One search token → OR clause on make/model/variant/year (if token is a year). */
function tokenWhere(token) {
  const trimmed = token.trim();
  if (!trimmed) return null;
  const asNum = parseInt(trimmed, 10);
  const isYear =
    !Number.isNaN(asNum) &&
    String(asNum) === trimmed &&
    asNum >= 1980 &&
    asNum <= new Date().getFullYear() + 1;

  const textOr = [
    { make: { contains: trimmed, mode: "insensitive" } },
    { model: { contains: trimmed, mode: "insensitive" } },
    { variant: { contains: trimmed, mode: "insensitive" } },
  ];
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
    return { AND: tokenClauses };
  }
  return {
    OR: [
      { make: { contains: query, mode: "insensitive" } },
      { model: { contains: query, mode: "insensitive" } },
      { variant: { contains: query, mode: "insensitive" } },
    ],
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
        make: { contains: normalizedQuery, mode: "insensitive" },
      }),
      select: { make: true },
      distinct: ["make"],
      take: limit,
    }),
    db.car.findMany({
      where: verifiedWhere({
        model: { contains: normalizedQuery, mode: "insensitive" },
      }),
      select: { model: true },
      distinct: ["model"],
      take: limit,
    }),
    db.car.findMany({
      where: verifiedWhere({
        variant: { contains: normalizedQuery, mode: "insensitive" },
        NOT: { variant: null },
      }),
      select: { variant: true },
      distinct: ["variant"],
      take: Math.floor(limit / 2),
    }),
  ]);

  const carSuggestions = cars.map((car) => ({
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
  }));

  const attributeSuggestions = [
    ...makes.map((car) => ({ type: "make", value: car.make })),
    ...models.map((car) => ({ type: "model", value: car.model })),
    ...variants.map((car) => ({ type: "variant", value: car.variant })),
  ];

  const uniqueAttributes = [
    ...new Map(attributeSuggestions.map((s) => [s.value.toLowerCase(), s])).values(),
  ];

  return [...carSuggestions, ...uniqueAttributes].slice(0, limit);
}

const getCachedSuggestions = unstable_cache(
  loadSuggestions,
  ["search-suggestions-v1"],
  { revalidate: 90, tags: ["cars-listing", "search-suggestions"] },
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

  return NextResponse.json({
    query,
    suggestions,
  });
}
