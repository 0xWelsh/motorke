import { db } from "@/lib/db";
import { PUBLIC_ONLY_VERIFIED_DEALERS } from "@/lib/feature-flags";
import { buildComparisonSlug, comparisonPagePath } from "@/lib/seo-content";
import { modelHubPath } from "@/lib/seo-model-wiki";

const carWhere = {
  available: true,
  ...(PUBLIC_ONLY_VERIFIED_DEALERS && { dealer: { verificationStatus: "VERIFIED" } }),
};

export function buildComparisonTitle(makeA, modelA, makeB, modelB) {
  return `${makeA} ${modelA} vs ${makeB} ${modelB}: which to buy in Kenya?`;
}

export function buildComparisonDescription(makeA, modelA, makeB, modelB) {
  return `Compare ${makeA} ${modelA} and ${makeB} ${modelB} for Kenyan buyers — pricing, fuel economy, reliability, spare parts, and live listings on BIDGARI.`;
}

export function buildComparisonBody(makeA, modelA, makeB, modelB) {
  const hubA = modelHubPath(makeA, modelA);
  const hubB = modelHubPath(makeB, modelB);
  return `## ${makeA} ${modelA} vs ${makeB} ${modelB}

Both nameplates are common on Kenyan roads. Use this guide to narrow your shortlist, then open live listings to compare exact prices, mileage, and dealer terms. Browse all [${makeA} ${modelA} listings](${hubA}) and [${makeB} ${modelB} listings](${hubB}) to see current prices in Nairobi and across Kenya.

## Price and availability

Prices shift weekly as new stock lands at the port and dealers refresh inventory. Check the latest [${makeA} ${modelA} for sale](${hubA}) and [${makeB} ${modelB} for sale](${hubB}) pages for live pricing. Both models are popular on BIDGARI, but availability varies by year, trim, and whether the vehicle is locally available or still at the port.

## Who should choose the ${makeA} ${modelA}?

- Buyers who prioritise ${makeA}'s resale footprint and service network in Kenya
- Shoppers who want a broader selection of trims and years at a given budget
- Drivers whose daily routes suit ${makeA}'s strengths — whether that is fuel economy, ride comfort, or off-road capability

## Who should choose the ${makeB} ${modelB}?

- Buyers who prefer ${makeB}'s driving feel, equipment levels, and value proposition
- Shoppers who find a specific year band or import condition that fits their budget
- Families or individuals whose lifestyle matches ${makeB}'s body style and cabin layout

## Running costs in Kenya

Factor in insurance (typically 3–5% of vehicle value), annual inspection, and fuel. Fuel prices in Nairobi hover around KES 180–210 per litre depending on station and grade. Use the [BIDGARI duty calculator](/duty) to estimate import duty and other costs if you are importing.

## Verdict

Compare real listings side by side before deciding. Open the [interactive compare tool](/compare) with any two cars you shortlist — you get specs, duty estimates, TCO projections, and dealer contact in one view.`;
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
  const existing = await db.seoContentPage.findUnique({
    where: { slug },
    select: { id: true, meta: true },
  });

  // Preserve hand-written curated comparisons — do not overwrite with templates.
  if (existing && existing.meta?.curated === true) {
    return existing;
  }

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
      dealer: { select: { name: true, type: true, verificationStatus: true } },
    },
    orderBy: { createdAt: "desc" },
    take,
  });
}

/** Fetch related comparison pages that share a make with this one. */
export async function fetchRelatedComparisons(makeA, modelA, makeB, modelB, take = 4) {
  const currentSlug = buildComparisonSlug(makeA, modelA, makeB, modelB);

  const related = await db.seoContentPage.findMany({
    where: {
      type: "COMPARISON",
      status: "PUBLISHED",
      slug: { not: currentSlug },
      OR: [
        { meta: { path: ["makeA"], equals: makeA } },
        { meta: { path: ["makeA"], equals: makeB } },
        { meta: { path: ["makeB"], equals: makeA } },
        { meta: { path: ["makeB"], equals: makeB } },
      ],
    },
    select: { slug: true, title: true },
    take,
  });

  return related.map((r) => ({
    slug: r.slug,
    title: r.title,
    path: comparisonPagePath(r.slug),
  }));
}
