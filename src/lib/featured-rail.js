import { db } from "@/lib/db";
import { unstable_cache } from "next/cache";
import { publicDetailVisibilityClause } from "@/lib/car-sold-status";

/**
 * Five random public listings for the homepage Featured rail.
 *
 * Cached for 10 minutes so the rail is stable for a visitor across reloads
 * within the window (random() re-rolls on every regeneration, which is the
 * point — the rail should never look frozen — but not mid-page-scroll).
 *
 * Ships up to 5 images per car so the mosaic card has its thumb grid without
 * a second round-trip.
 */
const RAIL_SELECT = {
  id: true,
  publicSlug: true,
  make: true,
  model: true,
  variant: true,
  year: true,
  price: true,
  mileage: true,
  fuelType: true,
  transmission: true,
  bodyType: true,
  engineCC: true,
  horsepower: true,
  drivetrain: true,
  color: true,
  location: true,
  condition: true,
  dutyPaid: true,
  negotiable: true,
  available: true,
  createdAt: true,
  soldAt: true,
  spotlightUntil: true,
  hotBadgeUntil: true,
  images: {
    orderBy: [{ isPrimary: "desc" }, { order: "asc" }],
    take: 5,
    select: { url: true },
  },
  dealer: { select: { id: true, name: true, location: true } },
};

async function fetchFeaturedRailCars() {
  try {
    const where = {
      ...publicDetailVisibilityClause(new Date()),
      ...(process.env.NEXT_PUBLIC_PUBLIC_ONLY_VERIFIED_DEALERS === "true" && {
        dealer: { verified: true },
      }),
    };

    // Two cheap queries: an id-only draw (few KB even at tens of thousands
    // of listings), then the five full cards. Random() in SQL would force a
    // sort of the whole set on every regeneration.
    const ids = await db.car.findMany({
      where,
      select: { id: true },
      orderBy: { createdAt: "desc" },
    });
    if (!ids.length) return [];

    const picks = new Set();
    let guard = 0;
    while (picks.size < Math.min(5, ids.length) && guard++ < 40) {
      picks.add(ids[Math.floor(Math.random() * ids.length)].id);
    }

    const rows = await db.car.findMany({
      where: { id: { in: [...picks] } },
      select: RAIL_SELECT,
    });
    // Preserve the random draw order rather than the DB's.
    const byId = new Map(rows.map((r) => [r.id, r]));
    return [...picks].map((id) => byId.get(id)).filter(Boolean);
  } catch (error) {
    console.error("[featured-rail] load failed:", error?.message || error);
    return [];
  }
}

export const getFeaturedRailCars = unstable_cache(fetchFeaturedRailCars, ["featured-rail-cars"], {
  revalidate: 600,
  tags: ["homepage"],
});
