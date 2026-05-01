export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { PUBLIC_ONLY_VERIFIED_DEALERS } from "@/lib/feature-flags";

const querySchema = z.object({
  query: z.string().min(1).max(50),
  limit: z.coerce.number().positive().max(20).optional().default(8),
  includeCarListings: z.enum(["true", "false"]).optional().default("true"),
});

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const rawParams = Object.fromEntries(searchParams.entries());
  
  const parsed = querySchema.safeParse(rawParams);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid parameters", details: parsed.error.issues }, { status: 400 });
  }

  const { query, limit, includeCarListings } = parsed.data;
  const showCars = includeCarListings === "true";

  // Search for cars first (limited to top 3)
  const cars = showCars ? await db.car.findMany({
    where: {
      available: true,
      ...(PUBLIC_ONLY_VERIFIED_DEALERS && { dealer: { verified: true } }),
      OR: [
        { make:  { contains: query, mode: "insensitive" } },
        { model: { contains: query, mode: "insensitive" } },
        { variant: { contains: query, mode: "insensitive" } },
      ],
    },
    include: {
      images: { where: { isPrimary: true }, take: 1 },
      dealer: { select: { name: true, location: true, verified: true } },
    },
    take: 3,
    orderBy: { createdAt: "desc" },
  }) : [];

  // Search for makes, models, and variants that match the query
  const makes = await db.car.findMany({
    where: {
      make: { contains: query, mode: "insensitive" },
      available: true,
      ...(PUBLIC_ONLY_VERIFIED_DEALERS && { dealer: { verified: true } }),
    },
    select: { make: true },
    distinct: ["make"],
    take: limit,
  });

  const models = await db.car.findMany({
    where: {
      model: { contains: query, mode: "insensitive" },
      available: true,
      ...(PUBLIC_ONLY_VERIFIED_DEALERS && { dealer: { verified: true } }),
    },
    select: { model: true },
    distinct: ["model"],
    take: limit,
  });

  const variants = await db.car.findMany({
    where: {
      variant: { contains: query, mode: "insensitive" },
      available: true,
      ...(PUBLIC_ONLY_VERIFIED_DEALERS && { dealer: { verified: true } }),
      NOT: { variant: null },
    },
    select: { variant: true },
    distinct: ["variant"],
    take: Math.floor(limit / 2),
  });

  // Format car suggestions
  const carSuggestions = cars.map(car => ({
    type: "car",
    id: car.id,
    value: `${car.year} ${car.make} ${car.model}`,
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

  // Format attribute suggestions
  const attributeSuggestions = [
    ...makes.map(car => ({ type: "make", value: car.make })),
    ...models.map(car => ({ type: "model", value: car.model })),
    ...variants.map(car => ({ type: "variant", value: car.variant })),
  ];

  // Remove duplicates from attributes
  const uniqueAttributes = Array.from(
    new Map(attributeSuggestions.map(s => [s.value.toLowerCase(), s]))
  ).map(([_, s]) => s);

  // Combine: cars first, then attributes
  const allSuggestions = [...carSuggestions, ...uniqueAttributes].slice(0, limit);

  return NextResponse.json({
    query,
    suggestions: allSuggestions,
  });
}
