// src/app/sitemap.js
// Next.js generates /sitemap.xml automatically from this file.

export const dynamic = "force-dynamic";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { absoluteUrl, getSiteOrigin } from "@/lib/site-url";
import { PUBLIC_ONLY_VERIFIED_DEALERS } from "@/lib/feature-flags";
import { slugifyCarSegment, SEO_COUNTIES } from "@/lib/seo-car-slug";
import { SEO_PRICE_BANDS, facetPathSegment } from "@/lib/seo-car-facets";
import { carListingPath } from "@/lib/car-listing-url";

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
  const dealerWhere = PUBLIC_ONLY_VERIFIED_DEALERS ? { verified: true } : {};

  const allowedCountySlugs = new Set(SEO_COUNTIES.map((c) => slugifyCarSegment(c)));

  const verifiedJoin = PUBLIC_ONLY_VERIFIED_DEALERS ? Prisma.sql`AND d.verified = true` : Prisma.empty;
  const countiesSql = Prisma.join(SEO_COUNTIES.map((c) => Prisma.sql`${c}`));

  const [
    cars,
    dealers,
    makeRows,
    comboRows,
    countiesWithStock,
    makeCountyRows,
    fuelFacetRows,
    bodyFacetRows,
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
    db.dealer.findMany({
      where: dealerWhere,
      select: { slug: true, updatedAt: true, logoUrl: true, bannerUrl: true },
    }),
    db.car.findMany({
      where: carWhere,
      distinct: ["make"],
      select: { make: true },
      orderBy: { make: "asc" },
    }),
    db.car.findMany({
      where: carWhere,
      distinct: ["make", "model"],
      select: { make: true, model: true },
    }),
    db.dealer.findMany({
      where: {
        ...dealerWhere,
        cars: { some: { available: true } },
      },
      distinct: ["county"],
      select: { county: true },
    }),
    db.$queryRaw(Prisma.sql`
      SELECT DISTINCT c.make AS make, d.county AS county
      FROM cars c
      INNER JOIN dealers d ON c."dealerId" = d.id
      WHERE c.available = true
      ${verifiedJoin}
      AND d.county IN (${countiesSql})
    `),
    db.car.findMany({
      where: carWhere,
      distinct: ["make", "fuelType"],
      select: { make: true, fuelType: true },
    }),
    db.car.findMany({
      where: carWhere,
      distinct: ["make", "bodyType"],
      select: { make: true, bodyType: true },
    }),
  ]);

  const now = new Date();

  const priceFacetPagesNested = await Promise.all(
    SEO_PRICE_BANDS.map(async (band) => {
      const makes = await db.car.groupBy({
        by: ["make"],
        where: { ...carWhere, ...band.where },
      });
      return makes.map(({ make }) => ({
        url: `${BASE}/cars/${slugifyCarSegment(make)}/${facetPathSegment("price", band)}`,
        lastModified: now,
        changeFrequency: "daily",
        priority: 0.79,
      }));
    })
  );
  const priceFacetPages = priceFacetPagesNested.flat();

  const staticPages = [
    { url: BASE, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE}/cars`, lastModified: now, changeFrequency: "daily", priority: 0.95 },
    { url: `${BASE}/dealers`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/compare`, lastModified: now, changeFrequency: "weekly", priority: 0.65 },
    { url: `${BASE}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/faq`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/duty`, lastModified: now, changeFrequency: "monthly", priority: 0.45 },
    { url: `${BASE}/mission`, lastModified: now, changeFrequency: "yearly", priority: 0.35 },
    { url: `${BASE}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.25 },
    { url: `${BASE}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.25 },
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

  const dealerPages = dealers.map((dealer) => {
    const images = [toAbsImage(dealer.bannerUrl), toAbsImage(dealer.logoUrl)].filter(Boolean);
    return {
      url: `${BASE}/dealers/${dealer.slug}`,
      lastModified: dealer.updatedAt,
      changeFrequency: "weekly",
      priority: 0.75,
      ...(images.length ? { images } : {}),
    };
  });

  const makeHubPages = makeRows.map((row) => ({
    url: `${BASE}/cars/${slugifyCarSegment(row.make)}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.88,
  }));

  const modelHubPages = comboRows.map((row) => ({
    url: `${BASE}/cars/${slugifyCarSegment(row.make)}/${slugifyCarSegment(row.model)}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.82,
  }));

  const countyHubPages = countiesWithStock
    .filter((row) => row.county && allowedCountySlugs.has(slugifyCarSegment(row.county)))
    .map((row) => ({
      url: `${BASE}/cars/${slugifyCarSegment(row.county)}`,
      lastModified: now,
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
        lastModified: now,
        changeFrequency: "weekly",
        priority: countyHubSlugSet.has(hubUrl) ? 0.81 : 0.8,
      };
    });

  const fuelFacetHubPages = fuelFacetRows
    .filter((row) => row?.make && row?.fuelType)
    .map((row) => ({
      url: `${BASE}/cars/${slugifyCarSegment(row.make)}/${facetPathSegment("fuel", row.fuelType)}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    }));

  const bodyFacetHubPages = bodyFacetRows
    .filter((row) => row?.make && row?.bodyType)
    .map((row) => ({
      url: `${BASE}/cars/${slugifyCarSegment(row.make)}/${facetPathSegment("body", row.bodyType)}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    }));

  return dedupeByUrl([
    ...staticPages,
    ...carPages,
    ...dealerPages,
    ...makeHubPages,
    ...countyHubPages,
    ...modelHubPages,
    ...makeCountyHubPages,
    ...fuelFacetHubPages,
    ...bodyFacetHubPages,
    ...priceFacetPages,
  ]);
}
