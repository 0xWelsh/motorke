import { BODY_TYPE_LABELS } from "@/lib/constants";
import { SEO_PRICE_BANDS } from "@/lib/seo-car-facets";
import { GLOBAL_CAR_HUB_SLUGS } from "@/lib/seo-global-hubs";
import { SEO_COUNTIES, slugifyCarSegment } from "@/lib/seo-car-slug";

const BUDGET_SHORT_LABELS = {
  "under-1m": "Under 1M",
  "1m-to-2m": "1M–2M",
  "2m-to-3m": "2M–3M",
  "3m-to-5m": "3M–5M",
  "5m-to-10m": "5M–10M",
  "over-10m": "10M+",
};

/** Homepage budget chips — SEO hub paths under /cars/price-*. */
export const HOMEPAGE_BUDGET_LINKS = SEO_PRICE_BANDS.map((band) => ({
  href: `/cars/price-${band.slug}`,
  label: BUDGET_SHORT_LABELS[band.slug] || band.label,
}));

const BODY_MARKETING_HUBS = {
  SUV: GLOBAL_CAR_HUB_SLUGS["suvs-for-sale-kenya"].path,
  SEDAN: GLOBAL_CAR_HUB_SLUGS["sedans-for-sale-kenya"].path,
  PICKUP: GLOBAL_CAR_HUB_SLUGS["pickups-for-sale-kenya"].path,
};

function shortBodyLabel(value) {
  const label = BODY_TYPE_LABELS[value];
  if (value === "SUV") return "SUV";
  if (value === "WAGON") return "Wagon";
  if (value === "BUS") return "Bus";
  if (label) return label.split("/")[0].trim();
  return value;
}

/** All inventory body types — marketing hubs or /cars?bodyType= (browse page). */
export const HOMEPAGE_BODY_LINKS = Object.keys(BODY_TYPE_LABELS).map((value) => ({
  href: BODY_MARKETING_HUBS[value] || `/cars?bodyType=${value}`,
  label: shortBodyLabel(value),
}));

/** Fuel filters via /cars query (inventory page). */
export const HOMEPAGE_FUEL_LINKS = [
  { href: "/cars?fuelType=PETROL", label: "Petrol" },
  { href: "/cars?fuelType=DIESEL", label: "Diesel" },
  { href: "/cars?fuelType=HYBRID", label: "Hybrid" },
  { href: "/cars?fuelType=ELECTRIC", label: "Electric" },
  { href: "/cars?fuelType=LPG", label: "LPG" },
];

/** County hubs — /cars/{county-slug}. */
export const HOMEPAGE_COUNTY_LINKS = SEO_COUNTIES.map((county) => ({
  href: `/cars/${slugifyCarSegment(county)}`,
  label: county,
}));

/** SUV + budget combo hubs. */
export const HOMEPAGE_POPULAR_SUV_LINKS = [
  { href: GLOBAL_CAR_HUB_SLUGS["suvs-under-2-million"].path, label: "SUVs under 2M" },
  { href: GLOBAL_CAR_HUB_SLUGS["suvs-under-3-million"].path, label: "SUVs under 3M" },
  { href: GLOBAL_CAR_HUB_SLUGS["suvs-under-4-million"].path, label: "SUVs under 4M" },
];

/** Sort shortcuts on /cars. */
export const HOMEPAGE_POPULAR_SORT_LINKS = [
  { href: "/cars?sort=newest", label: "Newest listed" },
  { href: "/cars?sort=views_desc", label: "Most viewed" },
  { href: "/cars?sort=price_asc", label: "Lowest price" },
  { href: "/cars?sort=year_desc", label: "Newest year" },
];

/** Transmission and mixed inventory shortcuts. */
export const HOMEPAGE_POPULAR_SPEC_LINKS = [
  { href: "/cars?transmission=AUTOMATIC", label: "Automatic" },
  { href: "/cars?transmission=MANUAL", label: "Manual" },
  { href: "/cars?fuelType=DIESEL&bodyType=SUV", label: "Diesel SUVs" },
  { href: "/cars?bodyType=PICKUP&sort=price_asc", label: "Budget pickups" },
];

/** @deprecated Use grouped popular exports; kept for tests/imports. */
export const HOMEPAGE_POPULAR_LINKS = [
  ...HOMEPAGE_POPULAR_SUV_LINKS,
  ...HOMEPAGE_POPULAR_SORT_LINKS,
  ...HOMEPAGE_POPULAR_SPEC_LINKS,
];
