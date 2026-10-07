// src/app/api/cars/[id]/related-views/route.js
// Returns cars that were also viewed by people who viewed the current car.
import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// Fired on every detail page after hydration; co-occurrence only moves slowly.
const getRelatedViews = unstable_cache(
  async (id) => {
    // Find sessions/users who viewed this car in the last 90 days
    const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const viewers = await db.carView.findMany({
      where: { carId: id, viewedAt: { gte: since } },
      select: { userId: true, sessionKey: true },
      distinct: ["userId", "sessionKey"],
    });

    if (viewers.length === 0) return [];

    // Build OR conditions for finding other cars viewed by these sessions
    const orConditions = [];
    for (const v of viewers) {
      if (v.userId) orConditions.push({ userId: v.userId });
      if (v.sessionKey) orConditions.push({ sessionKey: v.sessionKey });
    }

    if (orConditions.length === 0) return [];

    // Find other cars viewed by these same users/sessions, excluding the current car
    const relatedViews = await db.carView.findMany({
      where: {
        viewedAt: { gte: since },
        carId: { not: id },
        OR: orConditions,
      },
      select: { carId: true },
      orderBy: { viewedAt: "desc" },
      take: 500,
    });

    // Count co-occurrences and rank by frequency
    const coViewCounts = new Map();
    for (const rv of relatedViews) {
      coViewCounts.set(rv.carId, (coViewCounts.get(rv.carId) || 0) + 1);
    }

    // Sort by co-view count, take top 8
    const topCarIds = [...coViewCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([carId]) => carId);

    if (topCarIds.length === 0) return [];

    // Fetch full car data
    const cars = await db.car.findMany({
      where: { id: { in: topCarIds }, available: true },
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        dealer: { select: { name: true, location: true } },
      },
    });

    // Preserve ranking order
    const carMap = new Map(cars.map((c) => [c.id, c]));
    return topCarIds.map((carId) => carMap.get(carId)).filter(Boolean);
  },
  ["related-views"],
  { revalidate: 300, tags: ["cars"] }
);

export async function GET(req, { params }) {
  const { id } = await params;
  if (!id) return NextResponse.json({ cars: [] });
  const cars = await getRelatedViews(id);
  return NextResponse.json({ cars });
}
