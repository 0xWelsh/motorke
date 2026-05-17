import { db } from "@/lib/db";
import { PUBLIC_ONLY_VERIFIED_DEALERS } from "@/lib/feature-flags";
import { buildComparisonSlug } from "@/lib/seo-content";

const carWhere = {
  available: true,
  ...(PUBLIC_ONLY_VERIFIED_DEALERS && { dealer: { verified: true } }),
};

export function buildComparisonTitle(makeA, modelA, makeB, modelB) {
  return `${makeA} ${modelA} vs ${makeB} ${modelB}: which to buy in Kenya?`;
}

export function buildComparisonDescription(makeA, modelA, makeB, modelB) {
  return `Compare ${makeA} ${modelA} and ${makeB} ${modelB} for Kenyan buyers — pricing context, use cases, and live listings on Welsh Motorhub.`;
}

export function buildComparisonBody(makeA, modelA, makeB, modelB) {
  return `## ${makeA} ${modelA} vs ${makeB} ${modelB}

Both nameplates are common on Kenyan roads. Use this guide to narrow your shortlist, then open live listings to compare exact prices, mileage, and dealer terms.

## Price and availability

Inventory changes weekly. Filter by make and model on our marketplace to see what is listed today in Nairobi and other counties.

## Who should choose the ${makeA} ${modelA}?

- Buyers who prioritise ${makeA}'s resale footprint and service network in Kenya
- Shoppers who want more listings to choose from at a given budget

## Who should choose the ${makeB} ${modelB}?

- Drivers who prefer ${makeB}'s driving feel and equipment for the money
- Buyers who find a specific trim or year that fits their import or local budget

## Next step

Use the side-by-side compare tool with real listings you shortlist — specs, duty estimates, and dealer contact in one place.`;
}

/** Discover popular make/model pairs with enough stock for SEO comparison pages. */
export async function discoverComparisonPairs({ maxPairs = 24, minListings = 2 } = {}) {
  const grouped = await db.car.groupBy({
    by: ["make", "model"],
    where: carWhere,
    _count: { _all: true },
  });

  const models = grouped
    .filter((g) => g._count._all >= minListings)
    .sort((a, b) => b._count._all - a._count._all)
    .slice(0, 18);

  const pairs = [];
  for (let i = 0; i < models.length; i += 1) {
    for (let j = i + 1; j < models.length; j += 1) {
      const a = models[i];
      const b = models[j];
      if (a.make === b.make && a.model === b.model) continue;
      pairs.push({
        makeA: a.make,
        modelA: a.model,
        makeB: b.make,
        modelB: b.model,
        score: a._count._all + b._count._all,
      });
      if (pairs.length >= maxPairs) break;
    }
    if (pairs.length >= maxPairs) break;
  }

  return pairs.sort((x, y) => y.score - x.score);
}

export async function upsertComparisonPage({ makeA, modelA, makeB, modelB, publish = true }) {
  const slug = buildComparisonSlug(makeA, modelA, makeB, modelB);
  const title = buildComparisonTitle(makeA, modelA, makeB, modelB);
  const description = buildComparisonDescription(makeA, modelA, makeB, modelB);
  const body = buildComparisonBody(makeA, modelA, makeB, modelB);
  const meta = { makeA, modelA, makeB, modelB };
  const now = new Date();

  return db.seoContentPage.upsert({
    where: { slug },
    create: {
      type: "COMPARISON",
      slug,
      title,
      description,
      body,
      meta,
      status: publish ? "PUBLISHED" : "DRAFT",
      publishedAt: publish ? now : null,
    },
    update: {
      title,
      description,
      body,
      meta,
      ...(publish
        ? { status: "PUBLISHED", publishedAt: now }
        : {}),
    },
  });
}

export async function syncComparisonPagesFromInventory(options = {}) {
  const pairs = await discoverComparisonPairs(options);
  const results = [];
  for (const pair of pairs) {
    results.push(await upsertComparisonPage({ ...pair, publish: true }));
  }
  return results;
}

export async function fetchComparisonInventory(make, model, take = 4) {
  return db.car.findMany({
    where: { ...carWhere, make, model },
    include: {
      images: { where: { isPrimary: true }, take: 1 },
      dealer: { select: { name: true, verified: true } },
    },
    orderBy: { createdAt: "desc" },
    take,
  });
}
