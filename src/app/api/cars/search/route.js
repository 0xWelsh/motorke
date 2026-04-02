// src/app/api/cars/search/route.js
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";

  if (query.length < 2) {
    return NextResponse.json([]);
  }

  try {
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

    const results = cars.map(car => ({
      id: car.id,
      make: car.make,
      model: car.model,
      year: car.year,
      price: car.price,
      image: car.images[0]?.url || null,
    }));

    return NextResponse.json(results);
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
