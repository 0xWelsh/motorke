// src/app/api/cars/search/route.js
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";

const getSearchResults = unstable_cache(
  async (query) => {
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

    return cars.map(car => ({
      id: car.id,
      make: car.make,
      model: car.model,
      year: car.year,
      price: car.price,
      image: car.images[0]?.url || null,
    }));
  },
  ["car-search", query],
  { revalidate: 600, tags: ["cars"] }
);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";

  if (query.length < 2) {
    return NextResponse.json([]);
  }

  try {
    const results = await getSearchResults(query);
    return NextResponse.json(results);
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
