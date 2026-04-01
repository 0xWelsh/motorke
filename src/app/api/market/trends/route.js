// src/app/api/market/trends/route.js
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Get Market Price Trends & Popularity */
export async function GET() {
  try {
    // 1. Get Top 5 Trending Models (by average views)
    const trending = await db.car.groupBy({
      by: ["make", "model"],
      _sum: { views: true },
      _count: { id: true },
      where: { available: true },
      orderBy: { _sum: { views: "desc" } },
      take: 6,
    });

    // 2. Get Average Prices for those models
    const trends = await Promise.all(trending.map(async (t) => {
      const avg = await db.car.aggregate({
        where: { make: t.make, model: t.model, available: true },
        _avg: { price: true },
        _min: { price: true },
        _max: { price: true },
      });
      
      return {
        make: t.make,
        model: t.model,
        totalUnits: t._count.id,
        popularity: t._sum.views,
        avgPrice: Math.round(avg._avg.price || 0),
        minPrice: avg._min.price,
        maxPrice: avg._max.price,
      };
    }));

    return NextResponse.json(trends);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
