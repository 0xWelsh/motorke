import { SEO_PRICE_BANDS } from "@/lib/seo-car-facets";

/** Homepage budget chips — SEO hub paths under /cars/price-*. */
export const HOMEPAGE_BUDGET_LINKS = SEO_PRICE_BANDS.filter((band) =>
  ["under-1m", "1m-to-2m", "2m-to-3m", "3m-to-5m"].includes(band.slug),
).map((band) => ({
  href: `/cars/price-${band.slug}`,
  label:
    band.slug === "under-1m"
      ? "Under 1M"
      : band.slug === "1m-to-2m"
        ? "1M to 2M"
        : band.slug === "2m-to-3m"
          ? "2M to 3M"
          : "3M to 5M",
}));

/** Core body types for Kenya buyers — prefer marketing hubs where we have them. */
export const HOMEPAGE_BODY_LINKS = [
  { href: "/cars/suvs-for-sale-kenya", label: "SUV" },
  { href: "/cars/sedans-for-sale-kenya", label: "Sedan" },
  { href: "/cars/pickups-for-sale-kenya", label: "Pickup" },
  { href: "/cars/body-hatchback", label: "Hatchback" },
];
