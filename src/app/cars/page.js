import { db } from "@/lib/db";
import { unstable_cache } from "next/cache";
import { PUBLIC_ONLY_VERIFIED_DEALERS } from "@/lib/feature-flags";
import { buildCarsOrderBy } from "@/lib/cars-inventory-sort";
import { publicDetailVisibilityClause } from "@/lib/car-sold-status";
import CarsListingRoot from "@/components/CarsListingRoot";
import { getBrowseInventoryCounts } from "@/lib/browse-inventory-counts";

// No searchParams here on purpose: query-string filters are applied on the
// client (see CarsListingRoot), so `/cars` itself is statically rendered and
// CDN-cached. Filtered results come from the separately cached
// `/api/cars/list` endpoint, whose responses carry their own CDN headers.
// Inventory edits bust the "cars"/"cars-listing" tags, so this timer is only
// a backstop. 60s caused a regeneration on nearly every crawl hit.
export const revalidate = 600;

export const metadata = {
  title: { absolute: "Cars for Sale in Kenya | BIDGARI" },
  description:
    "Find verified cars for sale in Kenya. Compare real prices, mileage and specs, filter by budget, and buy with the whole sale handled end-to-end by BIDGARI — inspection, paperwork and fair pricing included.",
  alternates: { canonical: "/cars" },
  openGraph: {
    title: { absolute: "Cars for Sale in Kenya | BIDGARI" },
    description:
      "Find verified cars for sale in Kenya. Compare real prices, mileage and specs, filter by budget, and buy with the whole sale handled end-to-end by BIDGARI — inspection, paperwork and fair pricing included.",
    type: "website",
    url: "/cars",
  },
};

const PER_PAGE = 36;

const carSelect = {
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
  condition: true,
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
      lat: true,
      lng: true,
      county: true,
      whatsapp: true,
      featured: true,
      boostScore: true,
    },
  },
};

const getAllColors = unstable_cache(
  async () => {
    try {
      const rows = await db.car.findMany({
        where: { available: true },
        distinct: ["color"],
        select: { color: true },
      });
      const seen = new Map();
      for (const r of rows) {
        const raw = (r.color || "").trim();
        if (!raw) continue;
        const key = raw.toLowerCase();
        if (!seen.has(key)) {
          seen.set(key, raw.replace(/\b\w/g, (c) => c.toUpperCase()));
        }
      }
      return [...seen.values()].sort();
    } catch (err) {
      console.error("[cars] color list load failed:", err?.message || err);
      return [];
    }
  },
  ["all-colors"],
  { revalidate: 3600, tags: ["cars"] },
);

// The sold-grace cutoff is a timestamp, so a raw `new Date()` in the where
// clause gives every request a unique cache key. Bucket it to the hour: the
// grace window is 7 days, so an hour of drift is irrelevant, and the same
// query can now hit the Data Cache instead of the database.
const VISIBILITY_BUCKET_MS = 60 * 60 * 1000;

function stableVisibilityNow() {
  return new Date(Math.floor(Date.now() / VISIBILITY_BUCKET_MS) * VISIBILITY_BUCKET_MS);
}

const getCachedCarsPage = unstable_cache(
  async (whereJson, sort) => {
    try {
      const where = JSON.parse(whereJson);
      const [cars, total] = await Promise.all([
        db.car.findMany({
          where,
          select: carSelect,
          orderBy: buildCarsOrderBy(sort),
          take: PER_PAGE,
        }),
        db.car.count({ where }),
      ]);
      return { cars, total };
    } catch (err) {
      // Keep the static build/ISR regeneration alive if the DB is briefly
      // unavailable; the next revalidation fills the page in.
      console.error("[cars] page load failed:", err?.message || err);
      return { cars: [], total: 0 };
    }
  },
  ["cars-page-v1"],
  { revalidate: 600, tags: ["cars", "cars-listing"] },
);

export default async function CarsPage() {
  const where = {
    ...publicDetailVisibilityClause(stableVisibilityNow()),
    ...(PUBLIC_ONLY_VERIFIED_DEALERS && { dealer: { verified: true } }),
  };

  const [{ cars: initialCars, total }, , allColors] = await Promise.all([
    getCachedCarsPage(JSON.stringify(where), "newest"),
    getBrowseInventoryCounts(),
    getAllColors(),
  ]);

  return (
    <div className="min-h-screen bg-[var(--surface)] pb-8">
      <div className="w-full px-2.5 sm:px-8 pt-2 sm:pt-3">
        {/* Cars & Bids layout: the page starts at the very top with the
            search bar + filter pills; results stream in on scroll and the
            footer only appears when you scroll hard enough. No sidebar,
            no breadcrumb strip. */}
        <div className="min-w-0">
          <CarsListingRoot initialCars={initialCars} initialTotal={total} allColors={allColors} />
        </div>
      </div>
    </div>
  );
}
