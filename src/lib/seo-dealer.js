import { absoluteUrl } from "@/lib/site-url";
import { carListingPath } from "@/lib/car-listing-url";
import { buildBreadcrumbListSchema } from "@/lib/seo-schema";

export function dealerShowroomPath(slug) {
  return `/dealers/${slug}`;
}

export function dealerShowroomUrl(slug) {
  return absoluteUrl(dealerShowroomPath(slug));
}

/** Search phrases buyers use for a yard (title, description, schema alternateName). */
export function buildDealerSearchPhrases(dealer) {
  const name = String(dealer?.name || "").trim();
  const place = dealer?.location || dealer?.county || "Kenya";
  if (!name) return [];

  const phrases = [
    name,
    `${name} Kenya`,
    `${name} cars`,
    `${name} cars for sale`,
    `${name} showroom`,
    `${name} ${place}`,
    `${name} used cars Kenya`,
    `${name} Welsh Motorhub`,
  ];

  return [...new Set(phrases.map((p) => p.trim()).filter(Boolean))];
}

export function buildDealerMetadata(dealer, { stockCount = 0 } = {}) {
  const name = dealer.name;
  const place = dealer.location || dealer.county || "Kenya";
  const stock = Math.max(0, Number(stockCount) || 0);
  const stockLine = stock > 0 ? `${stock} car${stock === 1 ? "" : "s"} in stock` : "live showroom";

  const title = `${name} Kenya | ${stockLine} | Welsh Motorhub`;
  const description =
    (dealer.description && dealer.description.trim().length >= 40
      ? dealer.description.trim().slice(0, 155)
      : null) ||
    `Find ${name} on Welsh Motorhub: ${stockLine} in ${place}, Kenya. Browse verified listings, read buyer reviews, and contact ${name} by phone or WhatsApp.`;

  const keywords = buildDealerSearchPhrases(dealer);
  const canonical = dealerShowroomPath(dealer.slug);

  return {
    title,
    description,
    keywords,
    alternates: { canonical },
    openGraph: {
      title: `${name} | Welsh Motorhub`,
      description,
      url: absoluteUrl(canonical),
      siteName: "Welsh Motorhub",
      locale: "en_KE",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} | Welsh Motorhub`,
      description,
    },
  };
}

export function buildDealerSeoParagraph(dealer, { stockCount = 0, topMakes = [] } = {}) {
  const name = dealer.name;
  const place = dealer.location || dealer.county || "Kenya";
  const county = dealer.county || place;
  const stock = Math.max(0, Number(stockCount) || 0);
  const makes =
    topMakes.length > 0
      ? topMakes.slice(0, 4).join(", ")
      : "popular makes";

  return [
    `${name} lists ${stock > 0 ? `${stock} verified vehicle${stock === 1 ? "" : "s"}` : "vehicles"} on Welsh Motorhub`,
    `from ${place}${county !== place ? `, ${county} County` : ""}, Kenya.`,
    stock > 0 ? `Current stock highlights include ${makes}.` : "",
    `Search "${name}" or "${name} Kenya" to return to this showroom, compare prices, read reviews, and reach the dealer directly.`,
    dealer.verified
      ? `${name} is a verified Welsh Motorhub partner dealership.`
      : `Contact ${name} through Welsh Motorhub for availability and viewing appointments.`,
  ]
    .filter(Boolean)
    .join(" ");
}

export function buildDealerFaqSchema(dealer, { stockCount = 0 } = {}) {
  const name = dealer.name;
  const place = dealer.location || dealer.county || "Kenya";
  const address = [dealer.address, dealer.location, dealer.county, "Kenya"].filter(Boolean).join(", ");
  const showroomUrl = dealerShowroomUrl(dealer.slug);
  const stock = Math.max(0, Number(stockCount) || 0);

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `Where can I find ${name} cars for sale in Kenya?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Browse ${name}'s live inventory on Welsh Motorhub at ${showroomUrl}. The showroom lists ${stock > 0 ? `${stock} available vehicles` : "vehicles as they are listed"} in ${place}.`,
        },
      },
      {
        "@type": "Question",
        name: `How do I contact ${name}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Open the ${name} showroom on Welsh Motorhub to call, WhatsApp, or send an enquiry. ${dealer.verified ? "This dealer is verified on the platform." : ""}`.trim(),
        },
      },
      {
        "@type": "Question",
        name: `Where is ${name} located?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: address
            ? `${name} is listed at ${address}. Use the map on the Welsh Motorhub showroom page for directions.`
            : `${name} operates in ${place}, Kenya. See the showroom page on Welsh Motorhub for location details.`,
        },
      },
    ],
  };
}

export function buildDealerInventoryItemList(dealer, cars) {
  const showroomUrl = dealerShowroomUrl(dealer.slug);
  const items = (cars || []).slice(0, 48).map((car, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: `${car.year} ${car.make} ${car.model}${car.variant ? ` ${car.variant}` : ""}`,
    url: absoluteUrl(carListingPath(car)),
  }));

  if (!items.length) return null;

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${dealer.name} cars for sale`,
    description: `Vehicles listed by ${dealer.name} on Welsh Motorhub`,
    url: showroomUrl,
    numberOfItems: items.length,
    itemListElement: items,
  };
}

export function buildDealerWebPageSchema(dealer, autoDealerSchema) {
  const showroomUrl = dealerShowroomUrl(dealer.slug);
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${showroomUrl}#webpage`,
    url: showroomUrl,
    name: `${dealer.name} | Welsh Motorhub`,
    description: autoDealerSchema?.description,
    isPartOf: {
      "@type": "WebSite",
      name: "Welsh Motorhub",
      url: absoluteUrl("/"),
    },
    about: { "@id": autoDealerSchema?.["@id"] || showroomUrl },
    primaryImageOfPage: autoDealerSchema?.image,
  };
}

/**
 * AutoDealer + optional aggregateRating for a showroom page.
 */
export function buildDealerAutoDealerSchema(dealer, options = {}) {
  const {
    stockCount = 0,
    averageRating = 0,
    totalReviews = 0,
    priceRange,
    absAsset,
    dealerSummary,
  } = options;

  const showroomUrl = dealerShowroomUrl(dealer.slug);
  const dealerLat = Number.isFinite(dealer?.lat) ? dealer.lat : null;
  const dealerLng = Number.isFinite(dealer?.lng) ? dealer.lng : null;

  const dealerSameAs = [dealer.instagramUrl, dealer.facebookUrl, dealer.tiktokUrl, dealer.website]
    .filter(Boolean)
    .map((u) => (u.startsWith("http") ? u : `https://${u}`))
    .filter(Boolean);

  const searchPhrases = buildDealerSearchPhrases(dealer);
  const alternateName = searchPhrases.filter((p) => p !== dealer.name);

  const openingHoursSpecification = [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      opens: "08:00",
      closes: "18:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: "Sunday",
      opens: "10:00",
      closes: "16:00",
    },
  ];

  return {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    "@id": showroomUrl,
    name: dealer.name,
    url: showroomUrl,
    image: absAsset?.(dealer.bannerUrl || dealer.logoUrl),
    logo: absAsset?.(dealer.logoUrl),
    description: dealer.description?.trim() || dealerSummary,
    ...(alternateName.length ? { alternateName } : {}),
    ...(stockCount > 0
      ? {
          makesOffer: {
            "@type": "Offer",
            itemOffered: {
              "@type": "Product",
              name: `${dealer.name} vehicle inventory`,
              description: `${stockCount} vehicles listed on Welsh Motorhub`,
            },
          },
        }
      : {}),
    address: {
      "@type": "PostalAddress",
      ...(dealer.address ? { streetAddress: dealer.address } : {}),
      addressLocality: dealer.location || dealer.county || "Nairobi",
      addressRegion: dealer.county || "Nairobi",
      addressCountry: "KE",
    },
    telephone: dealer.phone || dealer.whatsapp || undefined,
    ...(dealer.email ? { email: dealer.email } : {}),
    ...(dealerLat != null && dealerLng != null
      ? { geo: { "@type": "GeoCoordinates", latitude: dealerLat, longitude: dealerLng } }
      : {}),
    ...(priceRange ? { priceRange } : {}),
    areaServed: { "@type": "Country", name: "Kenya" },
    openingHoursSpecification,
    ...(dealerSameAs.length ? { sameAs: dealerSameAs } : {}),
    ...(totalReviews > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Number(averageRating.toFixed(2)),
            reviewCount: totalReviews,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
    parentOrganization: {
      "@type": "Organization",
      name: "Welsh Motorhub",
      url: absoluteUrl("/"),
    },
  };
}

export function buildDealerBreadcrumbSchema(dealer) {
  return buildBreadcrumbListSchema([
    { name: "Home", path: "/" },
    { name: "Dealers", path: "/dealers" },
    { name: dealer.name, path: dealerShowroomPath(dealer.slug) },
  ]);
}

export function buildDealersDirectoryItemList(dealers) {
  const items = (dealers || [])
    .filter((d) => d?.slug && d?.name)
    .slice(0, 200)
    .map((dealer, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: dealer.name,
      url: dealerShowroomUrl(dealer.slug),
    }));

  if (!items.length) return null;

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Car dealers in Kenya on Welsh Motorhub",
    url: absoluteUrl("/dealers"),
    numberOfItems: items.length,
    itemListElement: items,
  };
}

/** Seller node on Vehicle JSON-LD — links listing to indexed showroom URL. */
export function buildListingSellerSchema(dealer) {
  if (!dealer?.name) {
    return { "@type": "AutoDealer", name: "Welsh Motorhub dealer", url: absoluteUrl("/dealers") };
  }

  const showroomUrl = dealer.slug ? dealerShowroomUrl(dealer.slug) : absoluteUrl("/dealers");

  return {
    "@type": "AutoDealer",
    "@id": showroomUrl,
    name: dealer.name,
    url: showroomUrl,
    ...(dealer.logoUrl
      ? {
          logo: dealer.logoUrl.startsWith("http")
            ? dealer.logoUrl
            : absoluteUrl(dealer.logoUrl.startsWith("/") ? dealer.logoUrl : `/${dealer.logoUrl}`),
        }
      : {}),
    ...(dealer.location || dealer.county
      ? {
          address: {
            "@type": "PostalAddress",
            addressLocality: dealer.location || dealer.county,
            addressRegion: dealer.county || undefined,
            addressCountry: "KE",
          },
        }
      : {}),
  };
}

export { buildCarListingDealerMetadata } from "@/lib/car-listing-seo";
