export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { PUBLIC_ONLY_VERIFIED_DEALERS } from "@/lib/feature-flags";
import { buildMakeWhere } from "@/lib/make-filter";

const querySchema = z.object({
  make: z.string().optional(),
  bodyType: z.string().optional(),
  fuelType: z.string().optional(),
  transmission: z.string().optional(),
  dealerId: z.string().optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  minYear: z.coerce.number().positive().optional(),
  maxYear: z.coerce.number().positive().optional(),
  search: z.string().optional(),
  featured: z.enum(["true", "false"]).optional(),
  page: z.coerce.number().positive().optional().default(1),
  limit: z.coerce.number().positive().max(100).optional().default(12),
});

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const rawParams = Object.fromEntries(searchParams.entries());
  
  const parsed = querySchema.safeParse(rawParams);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid parameters", details: parsed.error.issues }, { status: 400 });
  }

  const {
    make, bodyType, fuelType, transmission, dealerId,
    minPrice, maxPrice, minYear, maxYear, search, featured,
    page, limit
  } = parsed.data;

  const where = {
    available: true,
    ...(PUBLIC_ONLY_VERIFIED_DEALERS && { dealer: { verified: true } }),
    ...buildMakeWhere(make),
    ...(bodyType     && { bodyType }),
    ...(fuelType     && { fuelType }),
    ...(transmission && { transmission }),
    ...(dealerId     && { dealerId }),
    ...(featured === "true" && { featured: true }),
    ...(minPrice || maxPrice ? {
      price: {
        ...(minPrice && { gte: parseInt(minPrice) }),
        ...(maxPrice && { lte: parseInt(maxPrice) }),
      }
    } : {}),
    ...(minYear || maxYear ? {
      year: {
        ...(minYear && { gte: parseInt(minYear) }),
        ...(maxYear && { lte: parseInt(maxYear) }),
      }
    } : {}),
    ...(search && {
      OR: [
        { make:        { contains: search, mode: "insensitive" } },
        { model:       { contains: search, mode: "insensitive" } },
        { variant:     { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const [cars, total] = await Promise.all([
    db.car.findMany({
      where,
      include: {
        images:  { where: { isPrimary: true }, take: 1 },
        dealer:  { select: { id: true, name: true, slug: true, location: true, verified: true } },
      },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      skip:  (page - 1) * limit,
      take:  limit,
    }),
    db.car.count({ where }),
  ]);

  return NextResponse.json({
    cars,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  });
}
