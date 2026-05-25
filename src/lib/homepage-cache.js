import { db } from "@/lib/db";
import { isTransientDbError, settleNamed, withDbRetry } from "@/lib/db-retry";
import { unstable_cache } from "next/cache";
import { analyzePrice } from "@/lib/market";
import { activeListingBoostWhere } from "@/lib/listing-boost";
import { activeSpotlightWhere, spotlightCarInclude } from "@/lib/spotlight";

export const EMPTY_HOMEPAGE_DATA = {
  featured: [],
  hotThisWeek: [],
  newArrivals: [],
  dealers: [],
  newsItems: [],
  highlightReviews: [],
  spotlightEnhanced: [],
  paidSpotlight: [],
  heroBoosted: [],
  heroFallback: [],
  hotEnhanced: [],
  mostViewedEnhanced: [],
  newEnhanced: [],
};

function scoreMarketValue(marketAnalysis) {
  if (!marketAnalysis) return 6;
  if (marketAnalysis.comparison <= -10) return 24;
  if (marketAnalysis.comparison < 0) return 18;
  if (marketAnalysis.comparison <= 5) return 10;
  return 4;
}

function scoreFreshness(createdAt) {
  if (!createdAt) return 0;
  const ageDays = Math.max(
    0,
    Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24))
  );
  return Math.max(0, 20 - Math.min(20, ageDays));
}

function rankHotDeals(carsWithAnalysis) {
  const maxViews = carsWithAnalysis.reduce((max, car) => Math.max(max, car._count?.carViews || 0), 0) || 1;
  return [...carsWithAnalysis]
    .map((car) => {
      const viewScore = ((car._count?.carViews || 0) / maxViews) * 55;
      const freshnessScore = scoreFreshness(car.createdAt);
      const valueScore = scoreMarketValue(car.marketAnalysis);
      const trustScore = (car.dealer?.verified ? 8 : 0) + (car.featured ? 5 : 0);
      return { ...car, hotScore: viewScore + freshnessScore + valueScore + trustScore };
    })
    .sort((a, b) => b.hotScore - a.hotScore || (b._count?.carViews || 0) - (a._count?.carViews || 0))
    .slice(0, 8);
}

async function loadHomepageBase() {
  const week = new Date();
  week.setDate(week.getDate() - 7);

  const { data, failures } = await settleNamed({
    featured: () =>
      db.car.findMany({
        where: { available: true, featured: true },
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          dealer: { select: { id: true, name: true, location: true, verified: true, slug: true } },
        },
        take: 8,
        orderBy: { createdAt: "desc" },
      }),
    hotThisWeek: () =>
      db.car.findMany({
        where: { available: true },
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          dealer: { select: { id: true, name: true, location: true, verified: true, slug: true } },
          _count: { select: { carViews: true } },
        },
        take: 100,
      }),
    newArrivals: () =>
      db.car.findMany({
        where: { available: true, createdAt: { gte: week } },
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          dealer: { select: { id: true, name: true, location: true, slug: true } },
        },
        take: 8,
        orderBy: { createdAt: "desc" },
      }),
    dealers: () =>
      db.dealer.findMany({
        where: { OR: [{ featured: true }, { verified: true }] },
        include: {
          _count: { select: { cars: { where: { available: true } } } },
          users: { select: { avatarUrl: true }, take: 1 },
        },
        take: 8,
        orderBy: [
          { featured: "desc" },
          { verified: "desc" },
          { boostScore: "desc" },
          { createdAt: "desc" },
        ],
      }),
    newsItems: () =>
      db.article.findMany({
        orderBy: { publishedAt: "desc" },
        take: 8,
        select: {
          id: true,
          title: true,
          url: true,
          sourceName: true,
          publishedAt: true,
        },
      }),
    dealerReviews: () =>
      db.dealerReview.findMany({
        where: { comment: { not: null }, rating: { gte: 4 } },
        include: {
          user: { select: { name: true, avatarUrl: true } },
          dealer: { select: { name: true, county: true } },
        },
        take: 10,
        orderBy: { createdAt: "desc" },
      }),
    heroFallback: () =>
      db.car.findMany({
        where: { available: true },
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          dealer: { select: { id: true, name: true, location: true, verified: true, slug: true } },
        },
        take: 24,
        orderBy: { createdAt: "desc" },
      }),
    carReviews: () =>
      db.carReview.findMany({
        where: { comment: { not: null }, rating: { gte: 4 } },
        include: {
          user: { select: { name: true, avatarUrl: true } },
          car: {
            select: {
              make: true,
              model: true,
              dealer: { select: { name: true, county: true } },
            },
          },
        },
        take: 10,
        orderBy: { createdAt: "desc" },
      }),
  });

  if (failures.length) {
    const summary = failures
      .map((f) => `${f.key}: ${f.reason?.message || f.reason}`)
      .join("; ");
    console.warn("[homepage-cache] partial base load:", summary);
  }

  const {
    featured,
    hotThisWeek,
    newArrivals,
    dealers,
    newsItems,
    dealerReviews,
    carReviews,
    heroFallback,
  } = data;

  const combinedReviews = [
    ...(dealerReviews || []).map((r) => ({ ...r, source: "dealer" })),
    ...(carReviews || []).map((r) => ({
      ...r,
      source: "car",
      dealer: r.car?.dealer || null,
      comment: r.comment || `Great ${r.car?.make || ""} ${r.car?.model || ""} experience.`,
    })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 12);

  const payload = {
    featured,
    hotThisWeek,
    newArrivals,
    dealers,
    newsItems,
    highlightReviews: combinedReviews,
    heroFallback,
  };

  const hasContent =
    payload.featured?.length ||
    payload.hotThisWeek?.length ||
    payload.newArrivals?.length ||
    payload.dealers?.length;

  if (
    !hasContent &&
    failures.length > 0 &&
    failures.every((f) => isTransientDbError(f.reason))
  ) {
    throw failures[0].reason;
  }

  return payload;
}

async function enrichHomepage(base) {
  const { featured, hotThisWeek, newArrivals, dealers, newsItems, highlightReviews, heroFallback } =
    base;

  const hotCandidates = (hotThisWeek || [])
    .filter((car) => car && car._count?.carViews > 0)
    .sort((a, b) => (b._count?.carViews || 0) - (a._count?.carViews || 0))
    .slice(0, 12);

  const hotCandidatesWithAnalysis = await Promise.all(
    hotCandidates.map(async (car) => ({
      ...car,
      marketAnalysis: await analyzePrice(car),
    }))
  );
  const hotSorted = rankHotDeals(hotCandidatesWithAnalysis);

  const baseSpotlight =
    hotSorted.length > 0 ? hotSorted : featured?.length ? featured : newArrivals;

  let paidSpotlightRaw = [];
  try {
    paidSpotlightRaw = await db.car.findMany({
      where: activeSpotlightWhere(),
      include: spotlightCarInclude(),
      orderBy: [{ featuredWeight: "desc" }, { spotlightUntil: "asc" }],
      take: 8,
    });
  } catch (err) {
    console.warn("[homepage-cache] paid spotlight load failed:", err?.message || err);
  }

  let heroBoostedRaw = [];
  try {
    heroBoostedRaw = await db.car.findMany({
      where: activeListingBoostWhere(),
      include: spotlightCarInclude(),
      orderBy: [
        { featuredWeight: "desc" },
        { spotlightUntil: "asc" },
        { hotBadgeUntil: "asc" },
        { createdAt: "desc" },
      ],
      take: 16,
    });
  } catch (err) {
    console.warn("[homepage-cache] hero boosted load failed:", err?.message || err);
  }

  const mostViewed = [...hotCandidatesWithAnalysis]
    .sort((a, b) => (b._count?.carViews || 0) - (a._count?.carViews || 0))
    .slice(0, 12);

  const [spotlightEnhanced, paidSpotlight, heroBoosted, hotEnhanced, mostViewedEnhanced, newEnhanced, heroFallbackEnhanced] =
    await Promise.all([
    Promise.all(
      (baseSpotlight || []).map(async (car) =>
        car.marketAnalysis ? car : { ...car, marketAnalysis: await analyzePrice(car) }
      )
    ),
    Promise.all(
      (paidSpotlightRaw || []).map(async (car) => ({
        ...car,
        marketAnalysis: await analyzePrice(car),
      }))
    ),
    Promise.all(
      (heroBoostedRaw || []).map(async (car) => ({
        ...car,
        marketAnalysis: await analyzePrice(car),
      }))
    ),
    Promise.all(
      (hotSorted || []).map(async (car) =>
        car.marketAnalysis ? car : { ...car, marketAnalysis: await analyzePrice(car) }
      )
    ),
    Promise.all(
      (mostViewed || []).map(async (car) =>
        car.marketAnalysis ? car : { ...car, marketAnalysis: await analyzePrice(car) }
      )
    ),
    Promise.all(
      (newArrivals || []).slice(0, 8).map(async (c) => ({ ...c, marketAnalysis: await analyzePrice(c) }))
    ),
    Promise.all(
      (heroFallback || []).map(async (car) => ({
        ...car,
        marketAnalysis: await analyzePrice(car),
      }))
    ),
  ]);

  return {
    featured,
    hotThisWeek,
    newArrivals,
    dealers,
    newsItems,
    highlightReviews,
    spotlightEnhanced,
    paidSpotlight,
    heroBoosted,
    heroFallback: heroFallbackEnhanced,
    hotEnhanced,
    mostViewedEnhanced,
    newEnhanced,
  };
}

const getCachedData = unstable_cache(
  async () => {
    try {
      return await withDbRetry(() => loadHomepageBase(), { retries: 2, baseDelayMs: 600 });
    } catch (err) {
      console.error("[homepage-cache] base load failed:", err?.message || err);
      return {
        featured: [],
        hotThisWeek: [],
        newArrivals: [],
        dealers: [],
        newsItems: [],
        highlightReviews: [],
      };
    }
  },
  ["homepage-minimal-v6"],
  { revalidate: 300, tags: ["homepage"] }
);

const getCachedHomeEnriched = unstable_cache(
  async () => {
    try {
      const base = await getCachedData();
      const hasCars =
        base.featured?.length ||
        base.hotThisWeek?.length ||
        base.newArrivals?.length;
      if (!hasCars && !base.dealers?.length) {
        return { ...EMPTY_HOMEPAGE_DATA, ...base };
      }
      return await withDbRetry(() => enrichHomepage(base), { retries: 1, baseDelayMs: 500 });
    } catch (err) {
      console.error("[homepage-cache] enrich failed:", err?.message || err);
      const base = await getCachedData().catch(() => ({}));
      return { ...EMPTY_HOMEPAGE_DATA, ...base };
    }
  },
  ["homepage-enriched-v6"],
  { revalidate: 120, tags: ["homepage"] }
);

export async function getHomepageData() {
  return getCachedHomeEnriched();
}
