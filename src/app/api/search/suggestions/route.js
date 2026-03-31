export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

const querySchema = z.object({
  query: z.string().min(1).max(50),
  limit: z.coerce.number().positive().max(20).optional().default(8),
});

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const rawParams = Object.fromEntries(searchParams.entries());
  
  const parsed = querySchema.safeParse(rawParams);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid parameters", details: parsed.error.issues }, { status: 400 });
  }

  const { query, limit } = parsed.data;

  // Search for makes, models, and variants that match the query
  const makes = await db.car.findMany({
    where: {
      make: { contains: query, mode: "insensitive" },
      available: true,
    },
    select: { make: true },
    distinct: ["make"],
    take: limit,
  });

  const models = await db.car.findMany({
    where: {
      model: { contains: query, mode: "insensitive" },
      available: true,
    },
    select: { model: true },
    distinct: ["model"],
    take: limit,
  });

  const variants = await db.car.findMany({
    where: {
      variant: { contains: query, mode: "insensitive" },
      available: true,
      NOT: { variant: null },
    },
    select: { variant: true },
    distinct: ["variant"],
    take: limit,
  });

  // Combine and deduplicate suggestions
  const suggestions = [
    ...makes.map(car => ({ type: "make", value: car.make })),
    ...models.map(car => ({ type: "model", value: car.model })),
    ...variants.map(car => ({ type: "variant", value: car.variant })),
  ];

  // Remove duplicates
  const uniqueSuggestions = Array.from(new Map(suggestions.map(s => [s.value.toLowerCase(), s]))).map(([_, s]) => s);

  return NextResponse.json({
    query,
    suggestions: uniqueSuggestions.slice(0, limit),
  });
}
