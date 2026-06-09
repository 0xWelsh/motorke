import { db } from "@/lib/db";
import { PUBLIC_ONLY_VERIFIED_DEALERS } from "@/lib/feature-flags";
import { spotlightCarInclude } from "@/lib/spotlight";
import { dayBucket, shuffleWithSeed } from "@/lib/shuffle";

/** Cars shown in the homepage Spotlight grid. */
export const HOMEPAGE_SPOTLIGHT_COUNT = 8;

/** Max rows loaded per rotation window (keeps query bounded on large catalogs). */
export const HOMEPAGE_SPOTLIGHT_POOL_SIZE = 500;

/** How often the Spotlight shuffle seed changes (minutes, UTC). */
export const HOMEPAGE_SPOTLIGHT_ROTATE_MINUTES = 30;

function hashSeed(str) {
  let h = 2166136261;
  const s = String(str || "");
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Changes every {@link HOMEPAGE_SPOTLIGHT_ROTATE_MINUTES} so the row cycles through inventory. */
export function homepageSpotlightSeed(now = Date.now()) {
  const d = new Date(now);
  const minutesOfDay = d.getUTCHours() * 60 + d.getUTCMinutes();
  const slot = Math.floor(minutesOfDay / HOMEPAGE_SPOTLIGHT_ROTATE_MINUTES);
  return `homepage-spotlight:${dayBucket(now)}:${slot}`;
}

export function pickHomepageSpotlightCars(pool, seed, count = HOMEPAGE_SPOTLIGHT_COUNT) {
  if (!Array.isArray(pool) || !pool.length) return [];
  const shuffled = shuffleWithSeed(pool, seed);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * Paid boosts take priority when active; otherwise fill from a rotating random slice
 * of the full available inventory.
 */
export function mergeHomepageSpotlight(paid = [], rotated = [], count = HOMEPAGE_SPOTLIGHT_COUNT) {
  const paidSlice = (paid || []).slice(0, count);
  if (paidSlice.length >= count) return paidSlice;
  const used = new Set(paidSlice.map((car) => car.id));
  const fill = (rotated || []).filter((car) => car && !used.has(car.id));
  return [...paidSlice, ...fill].slice(0, count);
}

function availableInventoryWhere() {
  return {
    available: true,
    ...(PUBLIC_ONLY_VERIFIED_DEALERS && { dealer: { verificationStatus: "VERIFIED" } }),
  };
}

/**
 * Load a sliding window of listings, shuffle deterministically, return `count` cars.
 * Skip offset advances on each seed so the pool walks through the whole catalog over time.
 */
export async function loadRotatingSpotlightPool({
  count = HOMEPAGE_SPOTLIGHT_COUNT,
  poolSize = HOMEPAGE_SPOTLIGHT_POOL_SIZE,
  seed = homepageSpotlightSeed(),
} = {}) {
  const where = availableInventoryWhere();
  const total = await db.car.count({ where });
  if (!total) return [];

  const take = Math.min(total, poolSize);
  let skip = 0;
  if (total > poolSize) {
    skip = hashSeed(seed) % (total - poolSize + 1);
  }

  const pool = await db.car.findMany({
    where,
    include: spotlightCarInclude(),
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    skip,
    take,
  });

  return pickHomepageSpotlightCars(pool, seed, count);
}
