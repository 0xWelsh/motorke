import { slugifyCarSegment } from "@/lib/seo-car-slug";

/** @type {{ slug: string; label: string; where: import("@prisma/client").Prisma.CarWhereInput }}[] */
export const SEO_PRICE_BANDS = [
  { slug: "under-1m", label: "under KES 1M", where: { price: { lt: 1_000_000 } } },
  {
    slug: "1m-to-2m",
    label: "KES 1M – 2M",
    where: { price: { gte: 1_000_000, lt: 2_000_000 } },
  },
  {
    slug: "2m-to-3m",
    label: "KES 2M – 3M",
    where: { price: { gte: 2_000_000, lt: 3_000_000 } },
  },
  {
    slug: "3m-to-5m",
    label: "KES 3M – 5M",
    where: { price: { gte: 3_000_000, lt: 5_000_000 } },
  },
  {
    slug: "5m-to-10m",
    label: "KES 5M – 10M",
    where: { price: { gte: 5_000_000, lt: 10_000_000 } },
  },
  { slug: "over-10m", label: "over KES 10M", where: { price: { gte: 10_000_000 } } },
];

const FUEL_SLUG_TO_ENUM = Object.freeze({
  petrol: "PETROL",
  diesel: "DIESEL",
  hybrid: "HYBRID",
  electric: "ELECTRIC",
  lpg: "LPG",
});

const BODY_ENUMS = [
  "SEDAN",
  "SUV",
  "HATCHBACK",
  "PICKUP",
  "VAN",
  "WAGON",
  "COUPE",
  "CONVERTIBLE",
  "CROSSOVER",
  "MPV",
  "MINIVAN",
  "ROADSTER",
  "LIFTBACK",
  "BUS",
  "TRUCK",
];

const BODY_SLUG_TO_ENUM = Object.fromEntries(BODY_ENUMS.map((b) => [slugifyCarSegment(b), b]));

export function facetPathSegment(facetKind, payload) {
  if (facetKind === "fuel") return `fuel-${String(payload).toLowerCase()}`;
  if (facetKind === "body") return `body-${slugifyCarSegment(payload)}`;
  if (facetKind === "price") return `price-${payload.slug}`;
  return "";
}

/**
 * @param {string} segment — second path segment e.g. fuel-diesel
 * @returns {{ kind: 'fuel'; fuelType: string } | { kind: 'body'; bodyType: string } | { kind: 'price'; band: typeof SEO_PRICE_BANDS[number] } | null}
 */
export function resolveFacetSlugSegment(segment) {
  const s = slugifyCarSegment(segment);
  if (!s) return null;

  if (s.startsWith("fuel-")) {
    const key = s.slice("fuel-".length);
    const fuelType = FUEL_SLUG_TO_ENUM[key];
    return fuelType ? { kind: "fuel", fuelType } : null;
  }

  if (s.startsWith("body-")) {
    const key = s.slice("body-".length);
    const bodyType = BODY_SLUG_TO_ENUM[key];
    return bodyType ? { kind: "body", bodyType } : null;
  }

  if (s.startsWith("price-")) {
    const tail = s.slice("price-".length);
    const band = SEO_PRICE_BANDS.find((b) => b.slug === tail);
    return band ? { kind: "price", band } : null;
  }

  return null;
}

export function fuelFacetLabel(fuelType) {
  const m = { PETROL: "Petrol", DIESEL: "Diesel", HYBRID: "Hybrid", ELECTRIC: "Electric", LPG: "LPG" };
  return m[fuelType] || fuelType;
}

/** Map hub price band to /cars search (minPrice/maxPrice match cars page lte rules). */
export function priceBandSearchParams(band) {
  const p = band?.where?.price;
  if (!p || typeof p !== "object") return {};
  if (p.lt != null && p.gte != null) {
    return { minPrice: p.gte, maxPrice: Number(p.lt) - 1 };
  }
  if (p.lt != null) return { maxPrice: Number(p.lt) - 1 };
  if (p.gte != null) return { minPrice: p.gte };
  return {};
}
