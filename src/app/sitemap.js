// src/app/sitemap.js
// Next.js generates /sitemap.xml automatically from this file.

// Regenerate hourly instead of rebuilding from the DB on every crawl hit.
export const revalidate = 3600;
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { absoluteUrl, getSiteOrigin } from "@/lib/site-url";
import { PUBLIC_ONLY_VERIFIED_DEALERS } from "@/lib/feature-flags";
import { slugifyCarSegment, SEO_COUNTIES } from "@/lib/seo-car-slug";
import { SEO_PRICE_BANDS, facetPathSegment } from "@/lib/seo-car-facets";
import { carListingPath } from "@/lib/car-listing-url";
import { listSeoPagesForSitemap, contentPublicPath } from "@/lib/seo-content";
import { listGlobalHubSitemapEntries } from "@/lib/seo-global-hubs";
import { listLocationHubSlugs } from "@/lib/seo-location-hubs";

const BASE = getSiteOrigin();

function toAbsImage(url) {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return absoluteUrl(url.startsWith("/") ? url : `/${url}`);
}

function dedupeByUrl(entries) {
  const map = new Map();
  for (const e of entries) {
    if (e?.url && !map.has(e.url)) map.set(e.url, e);
  }
  return [...map.values()];
}

export default async function sitemap() {
  const carWhere = {
    available: true,
    ...(PUBLIC_ONLY_VERIFIED_DEALERS && { dealer: { verified: true } }),
  };

  const allowedCountySlugs = new Set(SEO_COUNTIES.map((c) => slugifyCarSegment(c)));

  const verifiedJoin = PUBLIC_ONLY_VERIFIED_DEALERS ? Prisma.sql`AND d.verified = true` : Prisma.empty;
  const countiesSql = Prisma.join(SEO_COUNTIES.map((c) => Prisma.sql`${c}`));

  const [
    cars,
    makeRows,
    comboRows,
    countiesWithStock,
    makeCountyRows,
    fuelFacetRows,
    bodyFacetRows,
    dutyVehicles,
  ] = await Promise.all([
    db.car.findMany({
      where: carWhere,
      select: {
        id: true,
        publicSlug: true,
        updatedAt: true,
        images: {
          orderBy: { order: "asc" },
          take: 4,
          select: { url: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
    db.car.groupBy({
      by: ["make"],
      where: carWhere,
      _max: { updatedAt: true },
      orderBy: { make: "asc" },
    }),
    db.car.groupBy({
      by: ["make", "model"],
      where: carWhere,
      _max: { updatedAt: true },
    }),
    db.$queryRaw(Prisma.sql`
      SELECT d.county AS county, MAX(c."updatedAt") AS max_updated
      FROM cars c
      INNER JOIN dealers d ON c."dealerId" = d.id
      WHERE c.available = true
      ${verifiedJoin}
      AND d.county IN (${countiesSql})
      GROUP BY d.county
    `),
    db.$queryRaw(Prisma.sql`
      SELECT DISTINCT c.make AS make, d.county AS county, MAX(c."updatedAt") OVER (PARTITION BY c.make, d.county) AS max_updated
      FROM cars c
      INNER JOIN dealers d ON c."dealerId" = d.id
      WHERE c.available = true
      ${verifiedJoin}
      AND d.county IN (${countiesSql})
    `),
    db.car.groupBy({
      by: ["make", "fuelType"],
      where: carWhere,
      _max: { updatedAt: true },
    }),
    db.car.groupBy({
      by: ["make", "bodyType"],
      where: carWhere,
      _max: { updatedAt: true },
    }),
    db.dutyVehicle
      .findMany({ where: { active: true }, select: { slug: true, updatedAt: true } })
      .catch(() => []),
  ]);

  const now = new Date();
  // Hubs/facets are derived from inventory; their content changes exactly
  // when their newest car changes — not when the sitemap is regenerated.
  const inventoryMax = cars[0]?.updatedAt ?? now;

  const priceFacetPagesNested = await Promise.all(
    SEO_PRICE_BANDS.map(async (band) => {
      const makes = await db.car.groupBy({
        by: ["make"],
        where: { ...carWhere, ...band.where },
        _max: { updatedAt: true },
      });
      return makes.map(({ make, _max }) => ({
        url: `${BASE}/cars/${slugifyCarSegment(make)}/${facetPathSegment("price", band)}`,
        lastModified: _max.updatedAt ?? inventoryMax,
        changeFrequency: "daily",
        priority: 0.79,
      }));
    })
  );
  const priceFacetPages = priceFacetPagesNested.flat();

  const globalHubPages = listGlobalHubSitemapEntries().map((hub) => ({
    url: `${BASE}${hub.path}`,
    lastModified: inventoryMax,
    changeFrequency: "daily",
    priority: hub.priority,
  }));

  const staticPages = [
    { url: BASE, changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE}/cars`, changeFrequency: "daily", priority: 0.95 },
    { url: `${BASE}/luxury`, changeFrequency: "weekly", priority: 0.86 },
    { url: `${BASE}/compare`, changeFrequency: "weekly", priority: 0.65 },
    { url: `${BASE}/request-car`, changeFrequency: "weekly", priority: 0.82 },
    { url: `${BASE}/blog`, changeFrequency: "weekly", priority: 0.62 },
    { url: `${BASE}/guides`, changeFrequency: "daily", priority: 0.7 },
    { url: `${BASE}/contact`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/faq`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/safety`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/report`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/duty`, changeFrequency: "weekly", priority: 0.88 },
    { url: `${BASE}/mission`, changeFrequency: "yearly", priority: 0.35 },
    { url: `${BASE}/terms`, changeFrequency: "yearly", priority: 0.25 },
    { url: `${BASE}/privacy`, changeFrequency: "yearly", priority: 0.25 },
    { url: `${BASE}/kenya`, changeFrequency: "weekly", priority: 0.85 },
    { url: `${BASE}/testimonials`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE}/how-to-buy`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/trust`, changeFrequency: "monthly", priority: 0.65 },
    { url: `${BASE}/sell`, changeFrequency: "monthly", priority: 0.7 },
  ];

  const carPages = cars.map((car) => {
    const images = (car.images || []).map((img) => toAbsImage(img.url)).filter(Boolean);
    const path = carListingPath(car);
    return {
      url: `${BASE}${path}`,
      lastModified: car.updatedAt,
      changeFrequency: "weekly",
      priority: 0.85,
      ...(images.length ? { images } : {}),
    };
  });

  const makeHubPages = makeRows.map((row) => ({
    url: `${BASE}/cars/${slugifyCarSegment(row.make)}`,
    lastModified: row._max?.updatedAt ?? inventoryMax,
    changeFrequency: "daily",
    priority: 0.88,
  }));

  const modelHubPages = comboRows.map((row) => ({
    url: `${BASE}/cars/${slugifyCarSegment(row.make)}/${slugifyCarSegment(row.model)}`,
    lastModified: row._max?.updatedAt ?? inventoryMax,
    changeFrequency: "daily",
    priority: 0.82,
  }));

  const countyHubPages = countiesWithStock
    .filter((row) => row.county && allowedCountySlugs.has(slugifyCarSegment(row.county)))
    .map((row) => ({
      url: `${BASE}/cars/${slugifyCarSegment(row.county)}`,
      lastModified: row.max_updated ?? inventoryMax,
      changeFrequency: "weekly",
      priority: 0.84,
    }));

  const countyHubSlugSet = new Set(countyHubPages.map((p) => p.url));

  /** @type {{ make?: string; county?: string }[]} */
  const rawMc = Array.isArray(makeCountyRows) ? makeCountyRows : [];
  const makeCountyHubPages = rawMc
    .filter((row) => row?.make && row?.county)
    .map((row) => {
      const slug = slugifyCarSegment(row.county);
      const hubUrl = `${BASE}/cars/${slug}`;
      return {
        url: `${BASE}/cars/${slugifyCarSegment(row.make)}/${slug}`,
        lastModified: row.max_updated ?? inventoryMax,
        changeFrequency: "weekly",
        priority: countyHubSlugSet.has(hubUrl) ? 0.81 : 0.8,
      };
    });

  const fuelFacetHubPages = fuelFacetRows
    .filter((row) => row?.make && row?.fuelType)
    .map((row) => ({
      url: `${BASE}/cars/${slugifyCarSegment(row.make)}/${facetPathSegment("fuel", row.fuelType)}`,
      lastModified: row._max?.updatedAt ?? inventoryMax,
      changeFrequency: "daily",
      priority: 0.8,
    }));

  const bodyFacetHubPages = bodyFacetRows
    .filter((row) => row?.make && row?.bodyType)
    .map((row) => ({
      url: `${BASE}/cars/${slugifyCarSegment(row.make)}/${facetPathSegment("body", row.bodyType)}`,
      lastModified: row._max?.updatedAt ?? inventoryMax,
      changeFrequency: "daily",
      priority: 0.8,
    }));

  const dutyPages = (dutyVehicles || []).map((row) => ({
    url: `${BASE}/duty/${row.slug}`,
    lastModified: row.updatedAt || now,
    changeFrequency: "weekly",
    priority: 0.68,
  }));

  const seoContentPages = await listSeoPagesForSitemap();
  const contentPages = seoContentPages
    .map((row) => {
      const path = contentPublicPath(row);
      if (!path) return null;
      return {
        url: `${BASE}${path}`,
        lastModified: row.updatedAt || row.publishedAt || now,
        changeFrequency: row.type === "COMPARISON" ? "weekly" : "monthly",
        priority: row.type === "COMPARISON" ? 0.66 : row.type === "BLOG" ? 0.6 : 0.64,
      };
    })
    .filter(Boolean);

  const showroomHubPages = listLocationHubSlugs().map((slug) => ({
    url: `${BASE}/showrooms/${slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.75,
  }));

  return dedupeByUrl([
    ...staticPages,
    ...globalHubPages,
    ...carPages,
    ...makeHubPages,
    ...countyHubPages,
    ...modelHubPages,
    ...makeCountyHubPages,
    ...fuelFacetHubPages,
    ...bodyFacetHubPages,
    ...priceFacetPages,
    ...dutyPages,
    ...contentPages,
    ...showroomHubPages,
  ]);
}
