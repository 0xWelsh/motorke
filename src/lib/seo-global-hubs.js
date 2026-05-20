import { SEO_PRICE_BANDS, facetPathSegment } from "@/lib/seo-car-facets";
import { slugifyCarSegment } from "@/lib/seo-car-slug";
import { BODY_TYPE_LABELS } from "@/lib/constants";

/** Marketing slugs → structured hub (single URL segment under /cars/...). */
export const GLOBAL_CAR_HUB_SLUGS = {
  "suvs-for-sale-kenya": {
    kind: "global_body",
    bodyType: "SUV",
    path: "/cars/suvs-for-sale-kenya",
    h1: "SUVs for sale in Kenya",
  },
  "suvs-under-2-million": {
    kind: "global_body_price",
    bodyType: "SUV",
    bandSlug: "1m-to-2m",
    path: "/cars/suvs-under-2-million",
    h1: "SUVs under KES 2 million",
  },
  "suvs-under-3-million": {
    kind: "global_body_price",
    bodyType: "SUV",
    bandSlug: "2m-to-3m",
    path: "/cars/suvs-under-3-million",
    h1: "SUVs under KES 3 million",
  },
  "suvs-under-4-million": {
    kind: "global_body_price",
    bodyType: "SUV",
    bandSlug: "3m-to-5m",
    path: "/cars/suvs-under-4-million",
    h1: "SUVs under KES 4 million",
  },
  "sedans-for-sale-kenya": {
    kind: "global_body",
    bodyType: "SEDAN",
    path: "/cars/sedans-for-sale-kenya",
    h1: "Sedans for sale in Kenya",
  },
  "pickups-for-sale-kenya": {
    kind: "global_body",
    bodyType: "PICKUP",
    path: "/cars/pickups-for-sale-kenya",
    h1: "Pickups for sale in Kenya",
  },
};

export function resolveGlobalCarHubSlug(segment) {
  const s = slugifyCarSegment(segment);
  if (!s) return null;

  if (GLOBAL_CAR_HUB_SLUGS[s]) {
    return GLOBAL_CAR_HUB_SLUGS[s];
  }

  if (s.startsWith("price-")) {
    const tail = s.slice("price-".length);
    const band = SEO_PRICE_BANDS.find((b) => b.slug === tail);
    if (band) {
      return {
        kind: "global_price",
        band,
        path: `/cars/price-${band.slug}`,
        h1: `Cars ${band.label} in Kenya`,
      };
    }
  }

  return null;
}

export function globalHubTitleAndDescription(resolved, total) {
  const n = total.toLocaleString("en-KE");
  const base = resolved.h1 || "Cars for sale in Kenya";

  switch (resolved.kind) {
    case "global_body":
      return {
        title: `${base} | Verified dealer stock — Welsh Motorhub`,
        description: `Browse ${n} verified ${BODY_TYPE_LABELS[resolved.bodyType]?.toLowerCase() || "vehicle"} listings from Kenyan dealers. Compare prices and contact sellers on Welsh Motorhub.`,
      };
    case "global_body_price": {
      const bl = BODY_TYPE_LABELS[resolved.bodyType] || resolved.bodyType;
      const band = SEO_PRICE_BANDS.find((b) => b.slug === resolved.bandSlug);
      return {
        title: `${resolved.h1} | ${bl} listings Kenya — Welsh Motorhub`,
        description: `Shop ${n} ${String(bl).toLowerCase()} vehicles ${band?.label || "in this budget"} from verified dealers. Live stock updated on Welsh Motorhub.`,
      };
    }
    case "global_price":
      return {
        title: `Used cars ${resolved.band.label} in Kenya | Welsh Motorhub`,
        description: `${n} verified listings ${resolved.band.label} across Kenya. Filter by make, fuel, and county on Welsh Motorhub.`,
      };
    default:
      return {
        title: `${base} | Welsh Motorhub`,
        description: `Browse verified cars for sale in Kenya on Welsh Motorhub.`,
      };
  }
}

export function globalHubWhereClause(resolved, hubCarWhere) {
  const base = hubCarWhere();

  switch (resolved.kind) {
    case "global_body":
      return { ...base, bodyType: resolved.bodyType };
    case "global_body_price": {
      const band = SEO_PRICE_BANDS.find((b) => b.slug === resolved.bandSlug);
      return {
        ...base,
        bodyType: resolved.bodyType,
        ...(band?.where || {}),
      };
    }
    case "global_price":
      return { ...base, ...resolved.band.where };
    default:
      return base;
  }
}

export function listGlobalHubSitemapEntries() {
  const entries = Object.values(GLOBAL_CAR_HUB_SLUGS).map((hub) => ({
    path: hub.path,
    priority: 0.82,
  }));

  for (const band of SEO_PRICE_BANDS) {
    entries.push({
      path: `/cars/price-${band.slug}`,
      priority: 0.8,
    });
  }

  return entries;
}

export function globalHubIntroCopy(resolved, total) {
  const n = total;
  switch (resolved.kind) {
    case "global_body_price":
      return `${n} live listings match this budget and body style. Welsh Motorhub aggregates verified dealer stock so you can compare ${resolved.h1.toLowerCase()} without scrolling generic classifieds.`;
    case "global_price":
      return `${n} vehicles are listed ${resolved.band.label}. Use this hub to shortlist by make, then open each listing for dealer contact and location.`;
    case "global_body":
      return `${n} ${resolved.h1.toLowerCase()} from Kenyan dealerships. Every listing links to a verified seller profile and direct WhatsApp or phone contact.`;
    default:
      return null;
  }
}

/** Facet path helper for internal links from listings. */
export { facetPathSegment };
