// src/app/api/cars/list/route.js
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";
import { PUBLIC_ONLY_VERIFIED_DEALERS } from "@/lib/feature-flags";
import { publicDetailVisibilityClause } from "@/lib/car-sold-status";
import { buildMakeWhere } from "@/lib/make-filter";
import { buildCarsOrderBy } from "@/lib/cars-inventory-sort";

const PER_PAGE = 36;
const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
};

// Bucket the sold-grace cutoff to the hour so identical filter sets share a cache entry
const VISIBILITY_BUCKET_MS = 60 * 60 * 1000;

function stableVisibilityNow() {
  return new Date(Math.floor(Date.now() / VISIBILITY_BUCKET_MS) * VISIBILITY_BUCKET_MS);
}

// Generate stable cache key from search params (not full where clause)
function buildCacheKey(params) {
  const {
    page, make, model, bodyType, fuelType, transmission, steering,
    county, minPrice, maxPrice, minYOM, maxYOM, vehicleType,
    condition, search, featured, sort, color, sunroof, seats
  } = params;

  return [
    page || 1,
    make || "", model || "", bodyType || "", fuelType || "", transmission || "",
    steering || "", county || "", minPrice || "", maxPrice || "",
    minYOM || "", maxYOM || "", vehicleType || "", condition || "",
    search || "", featured || "", sort || "", color || "", sunroof || "", seats || ""
  ].join("|");
}

// Cached page fetch - keyed by normalized search params
const getCarPage = unstable_cache(
  async (cacheKey, where, sort, page) => {
    const orderBy = buildCarsOrderBy(sort);
    const skip = (page - 1) * PER_PAGE;
    
    // Run findMany and count in parallel
    const [cars, total] = await Promise.all([
      db.car.findMany({
        where,
        select: {
          id: true,
          publicSlug: true,
          make: true,
          model: true,
          variant: true,
          year: true,
          price: true,
          engineCC: true,
          mileage: true,
          vehicleType: true,
          bodyType: true,
          fuelType: true,
          transmission: true,
          featured: true,
          featuredWeight: true,
          spotlightUntil: true,
          hotBadgeUntil: true,
          views: true,
          createdAt: true,
          badges: true,
          description: true,
          available: true,
          soldAt: true,
          location: true,
          dutyPaid: true,
          negotiable: true,
          condition: true,
          images: { orderBy: [{ isPrimary: "desc" }, { order: "asc" }], take: 5 },
          dealer: {
            select: {
              id: true,
              name: true,
              slug: true,
              location: true,
              type: true,
              verificationStatus: true,
            },
          },
        },
        orderBy,
        skip,
        take: PER_PAGE,
      }),
      db.car.count({ where }),
    ]);
    return { cars, total };
  },
  ["cars-list"],
  { revalidate: 300, tags: ["cars", "cars-listing"] }
);

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const make = searchParams.get("make") || "";
    const model = searchParams.get("model") || "";
    const bodyType = searchParams.get("bodyType") || "";
    const fuelType = searchParams.get("fuelType") || "";
    const transmission = searchParams.get("transmission") || "";
    const steering = searchParams.get("steering") || "";
    const county = searchParams.get("county") || "";
    const minPrice = parseInt(searchParams.get("minPrice") || "", 10) || undefined;
    const maxPrice = parseInt(searchParams.get("maxPrice") || "", 10) || undefined;
    const minYOM = parseInt(searchParams.get("minYOM") || "", 10) || undefined;
    const maxYOM = parseInt(searchParams.get("maxYOM") || "", 10) || undefined;
    const vehicleType = searchParams.get("vehicleType") || "";
    const condition = searchParams.get("condition") || "";
    const search = searchParams.get("search") || "";
    const featured = searchParams.get("featured") === "1";
    const sort = searchParams.get("sort") || "";
    const color = searchParams.get("color") || "";
    const sunroof = searchParams.get("sunroof") === "1";
    const seats = parseInt(searchParams.get("seats") || "", 10) || undefined;

    // Build where clause - use verificationStatus consistently
    const dealerVerificationFilter = PUBLIC_ONLY_VERIFIED_DEALERS
      ? { dealer: { verificationStatus: "VERIFIED" } }
      : {};

    const where = {
      ...publicDetailVisibilityClause(stableVisibilityNow()),
      ...dealerVerificationFilter,
      ...buildMakeWhere(make),
      ...(featured && { featured: true }),
      ...(model && { model: { equals: model, mode: "insensitive" } }),
      ...(steering && { steering }),
      ...(minYOM || maxYOM ? { year: { ...(minYOM && { gte: minYOM }), ...(maxYOM && { lte: maxYOM }) } } : {}),
      ...(bodyType && { bodyType: { in: bodyType.split(",").filter(Boolean) } }),
      ...(fuelType && { fuelType: { in: fuelType.split(",").filter(Boolean) } }),
      ...(transmission && { transmission }),
      ...(minPrice || maxPrice ? { price: { ...(minPrice && { gte: minPrice }), ...(maxPrice && { lte: maxPrice }) } } : {}),
      ...(vehicleType && { vehicleType }),
      ...(condition && { condition }),
      ...(county && {
        dealer: {
          ...dealerVerificationFilter.dealer,
          county: { equals: county, mode: "insensitive" },
        },
      }),
      ...(search ? {
        OR: ["make", "model", "variant", "description"].map(field => ({
          [field]: { contains: search, mode: "insensitive" },
        })),
      } : {}),
      ...(color ? { color: { contains: color, mode: "insensitive" } } : {}),
      ...(sunroof ? { sunroof: true } : {}),
      ...(seats ? { seats: { gte: seats } } : {}),
    };

    // Generate stable cache key from search params
    const cacheKey = buildCacheKey({
      page, make, model, bodyType, fuelType, transmission, steering,
      county, minPrice, maxPrice, minYOM, maxYOM, vehicleType,
      condition, search, featured, sort, color, sunroof, seats
    });

    const { cars, total } = await getCarPage(cacheKey, where, sort, page);

    return NextResponse.json(
      {
        cars,
        total,
        page,
        hasMore: (page - 1) * PER_PAGE + cars.length < total,
      },
      { headers: CACHE_HEADERS }
    );
  } catch (err) {
    console.error("cars/list error:", err);
    return NextResponse.json({ error: "Failed to fetch cars." }, { status: 500 });
  }
}