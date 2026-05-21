import locationHubs from "../../data/seo/location-hubs.json";
import { slugifyCarSegment } from "@/lib/seo-car-slug";

export function resolveLocationHub(slug) {
  const key = slugifyCarSegment(slug);
  const hub = locationHubs[key];
  if (!hub) return null;
  return { slug: key, ...hub, path: `/showrooms/${key}` };
}

export function listLocationHubSlugs() {
  return Object.keys(locationHubs);
}

/** Prisma OR filter for dealers/cars in a location corridor. */
export function locationHubDealerWhere(hub) {
  const terms = hub.locationMatch || [hub.label];
  return {
    OR: terms.flatMap((term) => [
      { location: { contains: term, mode: "insensitive" } },
      { address: { contains: term, mode: "insensitive" } },
      { county: { equals: hub.county, mode: "insensitive" } },
    ]),
  };
}

export function locationHubMetadata(hub, { dealerCount = 0, carCount = 0 } = {}) {
  const title = `Car dealers on ${hub.label} Kenya | ${carCount} cars | Welsh Motorhub`;
  const description = `${hub.description} ${dealerCount} dealer${dealerCount === 1 ? "" : "s"} and ${carCount} live listings on Welsh Motorhub.`;

  return {
    title,
    description,
    alternates: { canonical: hub.path },
    keywords: [
      `car dealers ${hub.label}`,
      `car yards ${hub.label}`,
      `${hub.label} used cars Kenya`,
      `showrooms ${hub.label}`,
    ],
  };
}
