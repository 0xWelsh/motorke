import { absoluteMediaUrl, absoluteUrl, BRAND_MARK_SQUARE } from "@/lib/site-url";
import { carListingPath } from "@/lib/car-listing-url";
import { formatCarPrice } from "@/lib/utils";
import { buildListingSellerSchema } from "@/lib/seo-dealer";

const FUEL_TYPE_LD = {
  PETROL: "Gasoline",
  DIESEL: "Diesel",
  HYBRID: "Hybrid",
  ELECTRIC: "Electric",
  LPG: "LPG",
};

const TRANSMISSION_LD = {
  AUTOMATIC: "Automatic",
  MANUAL: "Manual",
  CVT: "Continuously Variable Transmission",
};

const DRIVETRAIN_LD = {
  FWD: "https://schema.org/FrontWheelDriveConfiguration",
  RWD: "https://schema.org/RearWheelDriveConfiguration",
  AWD: "https://schema.org/AllWheelDriveConfiguration",
  FOURWD: "https://schema.org/FourWheelDriveConfiguration",
};

function positiveNum(n) {
  const v = Number(n);
  return Number.isFinite(v) && v > 0 ? v : null;
}

/**
 * BreadcrumbList for listing / hub pages.
 * @param {{ name: string; path: string }[]} items
 */
export function buildBreadcrumbListSchema(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

/**
 * Vehicle + Offer JSON-LD for a car listing (aligned with listing detail page).
 */
export function buildVehicleListingSchema(car, { reviews } = {}) {
  const title = `${car.year} ${car.make} ${car.model}${car.variant ? ` ${car.variant}` : ""}`;
  const listingUrl = absoluteUrl(carListingPath(car));
  const primaryImg = car.images?.find((i) => i.isPrimary) || car.images?.[0];
  const absImages = (car.images?.length ? car.images : [{ url: BRAND_MARK_SQUARE }]).map((i) =>
    absoluteMediaUrl(i.url, BRAND_MARK_SQUARE),
  );

  const seoDescription = `${title} in ${car.location || car.dealer?.location || "Kenya"} at ${formatCarPrice(car)}.`;

  const conditionLd =
    car.condition === "NEW"
      ? "https://schema.org/NewCondition"
      : car.condition === "CERTIFIED"
        ? "https://schema.org/RefurbishedCondition"
        : "https://schema.org/UsedCondition";

  const priceValidUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const ratingAvg = reviews?.avgRating ? Number(reviews.avgRating) : null;
  const ratingCount = reviews?.count || 0;

  return {
    "@context": "https://schema.org",
    "@type": "Vehicle",
    name: title,
    description: seoDescription,
    image: absImages,
    url: listingUrl,
    sku: car.id,
    brand: { "@type": "Brand", name: car.make },
    model: car.model,
    vehicleModelDate: String(car.year),
    bodyType: car.bodyType,
    color: car.color || undefined,
    fuelType: FUEL_TYPE_LD[car.fuelType] || car.fuelType,
    vehicleTransmission: TRANSMISSION_LD[car.transmission] || car.transmission,
    driveWheelConfiguration: DRIVETRAIN_LD[car.drivetrain] || undefined,
    itemCondition: conditionLd,
    ...(positiveNum(car.mileage)
      ? {
          mileageFromOdometer: {
            "@type": "QuantitativeValue",
            value: car.mileage,
            unitCode: "KMT",
          },
        }
      : {}),
    ...(car.price
      ? {
          offers: {
            "@type": "Offer",
            price: car.price,
            priceCurrency: "KES",
            priceValidUntil,
            availability: car.available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            url: listingUrl,
            seller: buildListingSellerSchema(),
          },
        }
      : {}),
    ...(ratingAvg && ratingCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: ratingAvg,
            reviewCount: ratingCount,
          },
        }
      : {}),
  };
}

export function listingBreadcrumbs(car) {
  return buildBreadcrumbListSchema([
    { name: "Home", path: "/" },
    { name: "Cars", path: "/cars" },
    { name: `${car.make} ${car.model}`, path: carListingPath(car) },
  ]);
}

/** Article JSON-LD for blog / guide content pages. */
export function articleJsonLd({ headline, description, datePublished, dateModified, url }) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    description: description || headline,
    datePublished: datePublished || undefined,
    dateModified: dateModified || datePublished || undefined,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    publisher: {
      "@type": "Organization",
      name: "BIDGARI",
      logo: { "@type": "ImageObject", url: absoluteMediaUrl(BRAND_MARK_SQUARE) },
    },
  };
}
