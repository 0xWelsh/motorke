import { db } from "@/lib/db";
import { carListingPath } from "@/lib/car-listing-url";
import { PUBLIC_ONLY_VERIFIED_DEALERS } from "@/lib/feature-flags";
import { absoluteUrl, getSiteOrigin } from "@/lib/site-url";

const TITLE_MAX = 60;
const DESC_MAX = 160;

/**
 * @returns {Promise<{
 *   ok: boolean;
 *   ranAt: string;
 *   siteOrigin: string;
 *   summary: Record<string, number>;
 *   issues: Array<{ severity: string; code: string; message: string; sample?: unknown }>;
 * }>}
 */
export async function runSeoAudit() {
  const carWhere = {
    available: true,
    ...(PUBLIC_ONLY_VERIFIED_DEALERS && { dealer: { verificationStatus: "VERIFIED" } }),
  };

  const cars = await db.car.findMany({
    where: carWhere,
    select: {
      id: true,
      make: true,
      model: true,
      year: true,
      publicSlug: true,
      description: true,
      images: { select: { id: true, url: true, isPrimary: true }, take: 3 },
    },
    take: 5000,
  });

  const issues = [];
  const slugSet = new Map();
  const titleSet = new Map();

  let missingSlug = 0;
  let missingDescription = 0;
  let missingImages = 0;
  let duplicateSlugs = 0;
  let duplicateTitles = 0;

  for (const car of cars) {
    const path = carListingPath(car);
    const title = `${car.year} ${car.make} ${car.model}`;

    if (!car.publicSlug) missingSlug += 1;
    if (!car.description?.trim()) missingDescription += 1;
    if (!car.images?.length) missingImages += 1;

    if (car.publicSlug) {
      const prev = slugSet.get(car.publicSlug);
      if (prev) {
        duplicateSlugs += 1;
        if (duplicateSlugs <= 5) {
          issues.push({
            severity: "error",
            code: "duplicate_slug",
            message: `Duplicate publicSlug: ${car.publicSlug}`,
            sample: { ids: [prev, car.id] },
          });
        }
      } else {
        slugSet.set(car.publicSlug, car.id);
      }
    }

    const titleKey = title.toLowerCase();
    const prevTitle = titleSet.get(titleKey);
    if (prevTitle) {
      duplicateTitles += 1;
    } else {
      titleSet.set(titleKey, car.id);
    }

    if (title.length > TITLE_MAX) {
      issues.push({
        severity: "warn",
        code: "title_long",
        message: `Title may truncate in SERPs (${title.length} chars)`,
        sample: { id: car.id, title },
      });
    }
  }

  if (missingSlug > 0) {
    issues.unshift({
      severity: "error",
      code: "missing_public_slug",
      message: `${missingSlug} live listing(s) missing publicSlug — run db:backfill-slugs`,
      sample: null,
    });
  }

  if (missingDescription > 0) {
    issues.push({
      severity: "warn",
      code: "missing_description",
      message: `${missingDescription} listing(s) without description`,
    });
  }

  if (missingImages > 0) {
    issues.push({
      severity: "warn",
      code: "missing_images",
      message: `${missingImages} listing(s) without images`,
    });
  }

  if (duplicateTitles > 10) {
    issues.push({
      severity: "info",
      code: "duplicate_titles",
      message: `${duplicateTitles} listings share the same year/make/model title (expected for inventory)`,
    });
  }

  const sitemapUrl = absoluteUrl("/sitemap.xml");
  const robotsUrl = absoluteUrl("/robots.txt");

  const summary = {
    listingsChecked: cars.length,
    missingPublicSlug: missingSlug,
    missingDescription,
    missingImages,
    duplicateSlugPairs: duplicateSlugs,
    issueCount: issues.length,
  };

  const ok = missingSlug === 0 && duplicateSlugs === 0;

  return {
    ok,
    ranAt: new Date().toISOString(),
    siteOrigin: getSiteOrigin(),
    sitemapUrl,
    robotsUrl,
    summary,
    issues: issues.slice(0, 50),
  };
}
