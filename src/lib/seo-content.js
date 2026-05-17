import { db } from "@/lib/db";
import { slugifyCarSegment } from "@/lib/seo-car-slug";

export const SEO_CONTENT_TYPES = {
  BLOG: "BLOG",
  COMPARISON: "COMPARISON",
  LANDING: "LANDING",
};

export function buildComparisonSlug(makeA, modelA, makeB, modelB) {
  const left = `${slugifyCarSegment(makeA)}-${slugifyCarSegment(modelA)}`;
  const right = `${slugifyCarSegment(makeB)}-${slugifyCarSegment(modelB)}`;
  const [a, b] = [left, right].sort();
  return `${a}-vs-${b}`;
}

export function comparisonPagePath(slug) {
  return `/compare/${slug}`;
}

export function blogPagePath(slug) {
  return `/blog/${slug}`;
}

export function guidePagePath(slug) {
  return `/guides/${slug}`;
}

export function contentPublicPath(page) {
  if (!page?.slug) return null;
  if (page.type === SEO_CONTENT_TYPES.BLOG) return blogPagePath(page.slug);
  if (page.type === SEO_CONTENT_TYPES.COMPARISON) return comparisonPagePath(page.slug);
  if (page.type === SEO_CONTENT_TYPES.LANDING) return guidePagePath(page.slug);
  return null;
}

export async function getPublishedSeoPage(slug, { type } = {}) {
  try {
    return await db.seoContentPage.findFirst({
      where: {
        slug,
        status: "PUBLISHED",
        ...(type ? { type } : {}),
      },
    });
  } catch {
    return null;
  }
}

export async function listPublishedSeoPages({ type, take = 50 } = {}) {
  try {
    return await db.seoContentPage.findMany({
      where: {
        status: "PUBLISHED",
        ...(type ? { type } : {}),
      },
      orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
      take,
    });
  } catch {
    return [];
  }
}

export async function listSeoPagesForSitemap() {
  try {
    return await db.seoContentPage.findMany({
      where: { status: "PUBLISHED" },
      select: { type: true, slug: true, updatedAt: true, publishedAt: true },
    });
  } catch {
    return [];
  }
}

export function parseComparisonMeta(meta) {
  if (!meta || typeof meta !== "object") return null;
  const { makeA, modelA, makeB, modelB } = meta;
  if (!makeA || !modelA || !makeB || !modelB) return null;
  return { makeA, modelA, makeB, modelB };
}

export function parseLandingMeta(meta) {
  if (!meta || typeof meta !== "object") return null;
  return {
    hubPath: meta.hubPath || null,
    ctaLabel: meta.ctaLabel || "Browse listings",
  };
}
