import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { BRANDS, BODY_TYPES } from "@/lib/browse-catalog";
import { PUBLIC_ONLY_VERIFIED_DEALERS } from "@/lib/feature-flags";
import { slugifyCarSegment } from "@/lib/seo-car-slug";
import { possibleMakesFromFilterSlug } from "@/lib/make-filter";
import { SEO_PRICE_BANDS } from "@/lib/seo-car-facets";

function publicInventoryWhere() {
  return {
    available: true,
    ...(PUBLIC_ONLY_VERIFIED_DEALERS ? { dealer: { verificationStatus: "VERIFIED" } } : {}),
  };
}

/**
 * Sum live inventory for a browse-catalog brand chip (handles Mercedes-Benz aliases, etc.).
 * @param {{ name: string, make?: string }} brand
 * @param {Record<string, number>} makeCountsMap lowercase make → count
 */
export function resolveBrandInventoryCount(brand, makeCountsMap) {
  const makeQuery = brand.make || brand.name;
  const slug = slugifyCarSegment(makeQuery);
  let candidates = possibleMakesFromFilterSlug(slug);
  if (!candidates.length) candidates = [makeQuery];

  const seen = new Set();
  let total = 0;
  for (const make of candidates) {
    const key = String(make || "").trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    total += makeCountsMap[key] || 0;
  }
  return total;
}

function rowsToCountMap(rows, field) {
  /** @type {Record<string, number>} */
  const map = {};
  for (const row of rows || []) {
    const key = String(row[field] || "").trim().toLowerCase();
    if (!key) continue;
    map[key] = (map[key] || 0) + (row._count?._all ?? 0);
  }
  return map;
}

function buildBrowseCountPayload(makeRows, bodyRows, priceBandCounts) {
  const makeCountsMap = rowsToCountMap(makeRows, "make");
  const bodyCountsMap = rowsToCountMap(bodyRows, "bodyType");

  /** @type {Record<string, number>} */
  const brands = {};
  for (const brand of BRANDS) {
    brands[brand.name] = resolveBrandInventoryCount(brand, makeCountsMap);
  }

  /** @type {Record<string, number>} */
  const bodyTypes = {};
  for (const bt of BODY_TYPES) {
    bodyTypes[bt.value] = bodyCountsMap[bt.value.toLowerCase()] || 0;
  }

  /** @type {Record<string, number>} Canonical DB make → live count. */
  const makes = {};
  for (const row of makeRows || []) {
    const make = String(row.make || "").trim();
    if (!make) continue;
    makes[make] = (makes[make] || 0) + (row._count?._all ?? 0);
  }

  /** @type {Record<string, number>} SEO price band slug → live count. */
  const priceBands = {};
  for (const band of SEO_PRICE_BANDS) {
    priceBands[band.slug] = priceBandCounts?.[band.slug] ?? 0;
  }

  return { brands, bodyTypes, makes, priceBands };
}

async function loadBrowseInventoryCounts() {
  const where = publicInventoryWhere();

  // One aggregate over the same row set the other counts use — grouping by a
  // coarse price bucket costs a single query rather than one per band.
  const [makeRows, bodyRows, priceRows] = await Promise.all([
    db.car.groupBy({
      by: ["make"],
      where,
      _count: { _all: true },
    }),
    db.car.groupBy({
      by: ["bodyType"],
      where,
      _count: { _all: true },
    }),
    db.car.groupBy({
      by: ["price"],
      where,
      _count: { _all: true },
    }),
  ]);

  const priceBandCounts = {};
  for (const row of priceRows || []) {
    const price = Number(row.price) || 0;
    for (const band of SEO_PRICE_BANDS) {
      const p = band.where.price;
      const aboveMin = p.gte == null || price >= p.gte;
      const belowMax = p.lt == null || price < p.lt;
      if (aboveMin && belowMax) {
        priceBandCounts[band.slug] = (priceBandCounts[band.slug] || 0) + (row._count?._all ?? 0);
        break;
      }
    }
  }

  return buildBrowseCountPayload(makeRows, bodyRows, priceBandCounts);
}

const getCachedBrowseInventoryCounts = unstable_cache(
  async () => {
    try {
      return await loadBrowseInventoryCounts();
    } catch (err) {
      console.error("[browse-inventory-counts] load failed:", err?.message || err);
      return { brands: {}, bodyTypes: {}, makes: {} };
    }
  },
  ["browse-inventory-counts-v1"],
  { revalidate: 300, tags: ["homepage", "makes", "browse-counts"] }
);

export async function getBrowseInventoryCounts() {
  return getCachedBrowseInventoryCounts();
}
