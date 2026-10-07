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

// Cached page fetch: the same searchParams combo is hit by many users + every
// infinite-scroll page, so memoize findMany+count for 60s. `where` is serialized
// to a stable JSON key; the result payload mirrors what the client already got
// (ISO date strings), so nothing downstream changes shape.
const getCarPage = unstable_cache(
  async (whereJson, sort, page) => {
    const where = JSON.parse(whereJson);
    const orderBy = buildCarsOrderBy(sort);
    const skip = (page - 1) * PER_PAGE;
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
          images: { take: 1, orderBy: { isPrimary: "desc" } },
          dealer: {
            select: {
              id: true,
              name: true,
              slug: true,
              location: true,
              type: true,
              verificationStatus: true,
              verified: true,
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
  { revalidate: 60, tags: ["cars", "cars-listing"] }
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

    const where = {
      ...publicDetailVisibilityClause(),
      ...(PUBLIC_ONLY_VERIFIED_DEALERS && { dealer: { verified: true } }),
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
          ...(PUBLIC_ONLY_VERIFIED_DEALERS && { verified: true }),
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

    const skip = (page - 1) * PER_PAGE;

    const { cars, total } = await getCarPage(JSON.stringify(where), sort, page);

    const data = cars;

    return NextResponse.json({
      cars: data,
      total,
      page,
      hasMore: skip + cars.length < total,
    });
  } catch (err) {
    console.error("cars/list error:", err);
    return NextResponse.json({ error: "Failed to fetch cars." }, { status: 500 });
  }
}
