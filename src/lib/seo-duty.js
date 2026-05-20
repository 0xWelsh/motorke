import dutyClusters from "../../data/seo/duty-clusters.json";
import { buildDutyVehicleSlug } from "@/lib/duty-vehicle-slug";
import { slugifyCarSegment } from "@/lib/seo-car-slug";
import { absoluteUrl } from "@/lib/site-url";

const DUTY_HUB = "/duty";

export function listDutySeoClusters() {
  return dutyClusters;
}

/**
 * Best programmatic duty URL for a listing (make/model match, else hub).
 * @param {{ make?: string; model?: string; year?: number; trim?: string }} car
 */
export function resolveDutyPathForCar(car = {}) {
  const make = slugifyCarSegment(car.make);
  const model = slugifyCarSegment(car.model);
  if (!make) return DUTY_HUB;

  let best = null;
  let bestScore = 0;

  for (const cluster of dutyClusters) {
    const cMake = slugifyCarSegment(cluster.make);
    const cModel = slugifyCarSegment(cluster.model);
    let score = 0;
    if (cMake === make) score += 3;
    if (cModel && model && cModel === model) score += 5;
    if (score > bestScore && cluster.dutyPath) {
      bestScore = score;
      best = cluster.dutyPath;
    }
  }

  if (best) return best;

  if (model && car.year) {
    const slug = buildDutyVehicleSlug({
      make: car.make,
      model: car.model,
      year: car.year,
      trim: car.trim || car.variant,
    });
    if (slug) return `${DUTY_HUB}/${slug}`;
  }

  return DUTY_HUB;
}

/**
 * Related duty + inventory links for duty calculator pages.
 */
export function getDutyPageRelatedLinks(vehicle = null, { take = 8 } = {}) {
  const out = [];
  const seen = new Set();

  const push = (href, label) => {
    if (!href || seen.has(href)) return;
    seen.add(href);
    out.push({ href, label });
  };

  if (vehicle?.make) {
    const make = slugifyCarSegment(vehicle.make);
    const model = slugifyCarSegment(vehicle.model);
    if (make && model) {
      push(`/cars/${make}/${model}`, `${vehicle.make} ${vehicle.model} for sale`);
    } else if (make) {
      push(`/cars/${make}`, `${vehicle.make} for sale`);
    }
  }

  push(DUTY_HUB, "All import duty estimates");

  for (const cluster of dutyClusters) {
    if (out.length >= take) break;
    push(cluster.dutyPath, cluster.keywords[0]);
  }

  push("/cars/suvs-under-3-million", "SUVs under KES 3M");
  push("/guides", "Buying guides");

  return out.slice(0, take);
}

/** WebApplication + FAQPage JSON-LD for /duty and vehicle pages. */
export function buildDutyCalculatorJsonLd({ vehicle = null, pathname = DUTY_HUB } = {}) {
  const pageUrl = absoluteUrl(pathname);
  const label = vehicle
    ? `${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.trim ? ` ${vehicle.trim}` : ""}`
    : "Kenya vehicle import duty";

  const faq = [
    {
      "@type": "Question",
      name: "How is import duty calculated in Kenya?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "KRA uses a depreciated CRSP multiplied by a schedule ratio to derive customs value, then import duty (typically 35%), excise on customs value plus duty, VAT at 16%, IDF at 3.5%, and railway levy at 2%.",
      },
    },
    {
      "@type": "Question",
      name: "What is CRSP for vehicle imports?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "CRSP is the Commissioner’s Recommended Selling Price — a KRA benchmark used to derive customs value for tax. It is not the price you pay the overseas seller.",
      },
    },
    {
      "@type": "Question",
      name: "Can I find cars matching my duty estimate?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Welsh Motorhub links each duty estimate to verified dealer stock for the same make and model so you can compare showroom prices after tax.",
      },
    },
  ];

  const app = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: vehicle ? `${label} import duty calculator` : "Kenya import duty calculator",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    url: pageUrl,
    description: vehicle
      ? `Estimate KRA import duty, excise, VAT, and levies for a ${label} in Kenya.`
      : "Estimate KRA import duty, excise, VAT, IDF, and railway levy for popular used imports in Kenya.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "KES",
    },
    provider: {
      "@type": "Organization",
      name: "Welsh Motorhub",
      url: absoluteUrl("/"),
    },
  };

  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq,
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: "Duty calculator", item: absoluteUrl(DUTY_HUB) },
      ...(vehicle
        ? [
            {
              "@type": "ListItem",
              position: 3,
              name: label,
              item: pageUrl,
            },
          ]
        : []),
    ],
  };

  return [app, faqPage, breadcrumb];
}
