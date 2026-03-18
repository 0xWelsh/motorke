// src/app/api/cars/route.js
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const make         = searchParams.get("make");
  const bodyType     = searchParams.get("bodyType");
  const fuelType     = searchParams.get("fuelType");
  const transmission = searchParams.get("transmission");
  const dealerId     = searchParams.get("dealerId");
  const minPrice     = searchParams.get("minPrice");
  const maxPrice     = searchParams.get("maxPrice");
  const minYear      = searchParams.get("minYear");
  const maxYear      = searchParams.get("maxYear");
  const search       = searchParams.get("search");
  const featured     = searchParams.get("featured");
  const page         = parseInt(searchParams.get("page") || "1");
  const limit        = parseInt(searchParams.get("limit") || "12");

  const where = {
    available: true,
    ...(make         && { make:         { equals: make, mode: "insensitive" } }),
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
