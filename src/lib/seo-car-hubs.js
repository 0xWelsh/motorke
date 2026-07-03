import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { PUBLIC_ONLY_VERIFIED_DEALERS } from "@/lib/feature-flags";
import { BODY_TYPE_LABELS } from "@/lib/constants";
import { buildMakeWhere, possibleMakesFromFilterSlug } from "@/lib/make-filter";
import { countyFromSlug, slugifyCarSegment, SEO_COUNTIES } from "@/lib/seo-car-slug";
import { publicDetailVisibilityClause } from "@/lib/car-sold-status";
import {
  facetPathSegment,
  fuelFacetLabel,
  resolveFacetSlugSegment,
} from "@/lib/seo-car-facets";
import {
  globalHubIntroCopy,
  globalHubTitleAndDescription,
  globalHubWhereClause,
  resolveGlobalCarHubSlug,
} from "@/lib/seo-global-hubs";

export function hubCarWhere() {
  return {
    ...publicDetailVisibilityClause(),
    ...(PUBLIC_ONLY_VERIFIED_DEALERS && { dealer: { verificationStatus: "VERIFIED" } }),
  };
}

const getMakesForHubs = unstable_cache(
  async () => {
    const rows = await db.car.findMany({
      where: hubCarWhere(),
      distinct: ["make"],
      select: { make: true },
      orderBy: { make: "asc" },
    });
    return rows.map((r) => r.make).filter(Boolean);
  },
  ["seo-hub-makes-v1"],
  { revalidate: 3600, tags: ["makes", "cars-listing"] }
);

export async function resolveMakeFromSlug(slug) {
  const s = slugifyCarSegment(slug);
  if (!s) return null;
  const makes = await getMakesForHubs();
  let hit = makes.find((m) => slugifyCarSegment(m) === s);
  if (hit) return hit;
  const alts = possibleMakesFromFilterSlug(s);
  if (!alts.length) return null;
  hit =
    makes.find((m) => alts.some((n) => m.toLowerCase() === String(n).toLowerCase())) || null;
  return hit;
}

async function distinctModelsForMake(make) {
  const rows = await db.car.findMany({
    where: { ...hubCarWhere(), make: { equals: make, mode: "insensitive" } },
    distinct: ["model"],
    select: { model: true },
    orderBy: { model: "asc" },
  });
  return rows.map((r) => r.model).filter(Boolean);
}

export async function resolveModelFromSlug(make, slug) {
  const s = slugifyCarSegment(slug);
  if (!s) return null;
  const models = await distinctModelsForMake(make);
  const exact = models.find((m) => slugifyCarSegment(m) === s);
  if (exact) return exact;
  return models.find((m) => {
    const ms = slugifyCarSegment(m);
    if (ms === s) return true;
    if (ms.endsWith(`-${s}`)) return true;
    const tail = ms.split("-").pop();
    return tail === s;
  }) || null;
}

/**
 * @param {string[]} partsRaw, URL segments after /cars/hub → e.g. ['toyota'] or ['toyota','nairobi']
 * @returns {Promise<
 *   | { kind: 'county'; county: string; path: string }
 *   | { kind: 'make'; make: string; path: string }
 *   | { kind: 'make_model'; make: string; model: string; path: string }
 *   | { kind: 'make_county'; make: string; county: string; path: string }
 *   | { kind: 'make_fuel'; make: string; fuelType: string; path: string }
 *   | { kind: 'make_body'; make: string; bodyType: string; path: string }
 *   | { kind: 'make_price_band'; make: string; band: import("@/lib/seo-car-facets").SEO_PRICE_BANDS[number]; path: string }
 *   | { kind: 'global_body' | 'global_body_price' | 'global_price'; path: string; h1?: string }
 *   | null
 * >}
 */
export async function resolveCarHub(partsRaw) {
  const parts = (partsRaw || []).map((p) => String(p || "").trim()).filter(Boolean);
  if (parts.length === 0) return null;

  if (parts.length === 1) {
    const a = parts[0];
    const globalHub = resolveGlobalCarHubSlug(a);
    if (globalHub) return globalHub;

    const county = countyFromSlug(a);
    if (county) {
      return { kind: "county", county, path: `/cars/${slugifyCarSegment(county)}` };
    }
    const make = await resolveMakeFromSlug(a);
    if (make) {
      return { kind: "make", make, path: `/cars/${slugifyCarSegment(make)}` };
    }
    return null;
  }

  if (parts.length === 2) {
    const [a, b] = parts;
    const make = await resolveMakeFromSlug(a);
    if (!make) return null;

    const county = countyFromSlug(b);
    if (county) {
      return {
        kind: "make_county",
        make,
        county,
        path: `/cars/${slugifyCarSegment(make)}/${slugifyCarSegment(county)}`,
      };
    }

    const facet = resolveFacetSlugSegment(b);
    if (facet?.kind === "fuel") {
      return {
        kind: "make_fuel",
        make,
        fuelType: facet.fuelType,
        path: `/cars/${slugifyCarSegment(make)}/${facetPathSegment("fuel", facet.fuelType)}`,
      };
    }
    if (facet?.kind === "body") {
      return {
        kind: "make_body",
        make,
        bodyType: facet.bodyType,
        path: `/cars/${slugifyCarSegment(make)}/${facetPathSegment("body", facet.bodyType)}`,
      };
    }
    if (facet?.kind === "price") {
      return {
        kind: "make_price_band",
        make,
        band: facet.band,
        path: `/cars/${slugifyCarSegment(make)}/${facetPathSegment("price", facet.band)}`,
      };
    }

    const model = await resolveModelFromSlug(make, b);
    if (model) {
      return {
        kind: "make_model",
        make,
        model,
        path: `/cars/${slugifyCarSegment(make)}/${slugifyCarSegment(model)}`,
      };
    }
    return null;
  }

  return null;
}

export function hubTitleAndDescription(resolved, total) {
  const n = total.toLocaleString("en-KE");
  switch (resolved.kind) {
    case "county":
      return {
        title: `Cars for sale in ${resolved.county} | Welsh Motorhub`,
        description: `Browse ${n}+ verified vehicles from trusted dealers in ${resolved.county}, Kenya. Compare prices, specs, and contact sellers on Welsh Motorhub.`,
      };
    case "make":
      return {
        title: `${resolved.make} cars for sale in Kenya | Welsh Motorhub`,
        description: `Shop ${n} verified ${resolved.make} listings across Kenya. Filter by year, price, fuel, and body type, dealer inventory on Welsh Motorhub.`,
      };
    case "make_model":
      return {
        title: `${resolved.make} ${resolved.model} for sale in Kenya | Welsh Motorhub`,
        description: `Find ${resolved.make} ${resolved.model} cars for sale, ${n} live listings from verified Kenyan dealers on Welsh Motorhub.`,
      };
    case "make_county":
      return {
        title: `${resolved.make} for sale in ${resolved.county} | Welsh Motorhub`,
        description: `Browse ${n} ${resolved.make} vehicles listed by dealers in ${resolved.county}. Transparent pricing and direct contact on Welsh Motorhub.`,
      };
    case "make_fuel": {
      const fl = fuelFacetLabel(resolved.fuelType);
      return {
        title: `${resolved.make} ${fl} cars for sale in Kenya | Welsh Motorhub`,
        description: `${n} ${resolved.make} ${fl.toLowerCase()} listings from verified Kenyan dealers, compare prices and specs on Welsh Motorhub.`,
      };
    }
    case "make_body": {
      const bl = BODY_TYPE_LABELS[resolved.bodyType] || resolved.bodyType;
      return {
        title: `${resolved.make} ${bl} for sale in Kenya | Welsh Motorhub`,
        description: `Shop ${n} ${resolved.make} ${String(bl).toLowerCase()} vehicles from dealers across Kenya on Welsh Motorhub.`,
      };
    }
    case "make_price_band":
      return {
        title: `${resolved.make} (${resolved.band.label}), cars for sale | Welsh Motorhub`,
        description: `Browse ${n} ${resolved.make} listings in this price range from verified Kenyan dealers on Welsh Motorhub.`,
      };
    case "global_body":
    case "global_body_price":
    case "global_price":
      return globalHubTitleAndDescription(resolved, total);
    default:
      return {
        title: "Browse cars | Welsh Motorhub",
        description: "Verified cars for sale across Kenya on Welsh Motorhub.",
      };
  }
}

export async function hubWhereClause(resolved) {
  const base = hubCarWhere();
  switch (resolved.kind) {
    case "county":
      return {
        ...base,
        dealer: {
          ...(PUBLIC_ONLY_VERIFIED_DEALERS && { verificationStatus: "VERIFIED" }),
          county: { equals: resolved.county, mode: "insensitive" },
        },
      };
    case "make":
      return { ...base, ...buildMakeWhere(resolved.make) };
    case "make_model":
      return {
        ...base,
        ...buildMakeWhere(resolved.make),
        model: { equals: resolved.model, mode: "insensitive" },
      };
    case "make_county":
      return {
        ...base,
        ...buildMakeWhere(resolved.make),
        dealer: {
          ...(PUBLIC_ONLY_VERIFIED_DEALERS && { verificationStatus: "VERIFIED" }),
          county: { equals: resolved.county, mode: "insensitive" },
        },
      };
    case "make_fuel":
      return {
        ...base,
        ...buildMakeWhere(resolved.make),
        fuelType: resolved.fuelType,
      };
    case "make_body":
      return {
        ...base,
        ...buildMakeWhere(resolved.make),
        bodyType: resolved.bodyType,
      };
    case "make_price_band":
      return {
        ...base,
        ...buildMakeWhere(resolved.make),
        ...resolved.band.where,
      };
    case "global_body":
    case "global_body_price":
    case "global_price":
      return globalHubWhereClause(resolved, () => base);
    default:
      return base;
  }
}

export function hubIntroParagraph(resolved, total) {
  if (resolved.kind === "global_body" || resolved.kind === "global_body_price" || resolved.kind === "global_price") {
    return globalHubIntroCopy(resolved, total);
  }
  return null;
}

export async function getSiblingHubLinks(make) {
  const makes = await getMakesForHubs();
  const slug = slugifyCarSegment;
  return makes
    .filter((m) => m !== make)
    .slice(0, 12)
    .map((m) => ({ label: m, href: `/cars/${slug(m)}` }));
}

export async function getPopularMakeLinks(limit = 14) {
  const makes = await getMakesForHubs();
  const slug = slugifyCarSegment;
  return makes.slice(0, limit).map((m) => ({ label: m, href: `/cars/${slug(m)}` }));
}

export async function getCountyHubLinks() {
  return SEO_COUNTIES.map((c) => ({
    label: c,
    href: `/cars/${slugifyCarSegment(c)}`,
  }));
}
