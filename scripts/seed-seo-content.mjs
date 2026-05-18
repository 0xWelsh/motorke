#!/usr/bin/env node
/**
 * Seed blog, landing guides, and comparison pages.
 * Run: npm run db:seed-seo-content
 */
import { PrismaClient } from "@prisma/client";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { BLOG_EXTRA, CURATED_COMPARISONS, GUIDES } from "./seo-editorial-content.mjs";

function applyEnvFile(filename, overridesExisting) {
  const p = resolve(process.cwd(), filename);
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!key) continue;
    if (!overridesExisting && process.env[key] !== undefined) continue;
    process.env[key] = val;
  }
}

applyEnvFile(".env", false);
applyEnvFile(".env.local", true);

const db = new PrismaClient();

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildComparisonSlug(makeA, modelA, makeB, modelB) {
  const left = `${slugify(makeA)}-${slugify(modelA)}`;
  const right = `${slugify(makeB)}-${slugify(modelB)}`;
  const [a, b] = [left, right].sort();
  return `${a}-vs-${b}`;
}

async function upsertPage({ type, slug, title, description, body, meta }) {
  const now = new Date();
  return db.seoContentPage.upsert({
    where: { slug },
    create: {
      type,
      slug,
      title,
      description,
      body,
      meta,
      status: "PUBLISHED",
      publishedAt: now,
    },
    update: {
      type,
      title,
      description,
      body,
      meta,
      status: "PUBLISHED",
      publishedAt: now,
    },
  });
}

const BLOG = [
  {
    slug: "how-to-buy-a-used-car-in-kenya",
    title: "How to buy a used car in Kenya (checklist)",
    description: "A practical checklist for inspecting, pricing, and closing on a used car in Kenya.",
    body: `## Start with your budget and use case

Decide monthly budget, fuel type, and whether you need seven seats or city parking ease. That narrows body type before you fall in love with a colour.

## Verify the seller and paperwork

- Logbook name matches seller ID
- NTSA search / transfer history where applicable
- Service records for timing belt, gearbox, and accident repairs

## Inspect before you pay a deposit

Walk around in daylight. Check panel gaps, tyre wear, and cold-start smoke. A short test drive on a hill reveals clutch and engine health.

## Use live market data

Compare similar year, mileage, and trim on Welsh Motorhub before you negotiate. Listings update daily across Nairobi and other counties.`,
  },
  {
    slug: "import-duty-and-taxes-explained-kenya",
    title: "Import duty and taxes in Kenya — plain English",
    description: "What CRSP, excise, VAT, and IDF mean when you are budgeting an import.",
    body: `## Why duty matters before you ship

Land cost is not just purchase price abroad. Kenya applies CRSP-based duty, excise by engine size, VAT, and levies that can change your breakeven versus buying locally.

## Use estimates, then confirm

Our duty calculator gives a structured estimate from reference CRSP rows. Always confirm with your clearing agent before you commit to a vessel.

## Pair duty with live stock

Sometimes a locally registered unit with transparent history beats a marginally cheaper import after duty and repair risk.`,
  },
  {
    slug: "financing-a-car-in-nairobi-what-to-know",
    title: "Financing a car in Nairobi — what to know",
    description: "Deposit, tenure, insurance, and total cost of ownership when you finance through a bank or dealer.",
    body: `## Look at total cost, not just monthly payment

A longer tenure lowers the instalment but raises interest paid. Model fuel, insurance, and major service intervals in the same spreadsheet.

## Deposit and insurance

Most facilities want 10–30% deposit and comprehensive insurance assigned to the lender. Factor that into cash you need on hand.

## Shop inventory that fits the facility

Dealers on Welsh Motorhub often work with common bank panels — ask early whether a specific listing qualifies before you inspect.`,
  },
  ...BLOG_EXTRA,
];

const LANDING = [
  {
    slug: "best-suvs-for-families-kenya",
    title: "Best SUVs for families in Kenya",
    description: "Space, ground clearance, and resale — what Kenyan families usually shortlist.",
    meta: { hubPath: "/cars", ctaLabel: "Browse SUVs" },
    body: `## What families optimise for

Seven seats or a large boot, comfortable ride on rough estate roads, and parts availability in Nairobi and major towns.

## Popular segments

Toyota Prado and RAV4, Nissan X-Trail, Mazda CX-5, and Subaru Forester appear often in our inventory. Filter by body type and price band to see what is listed today.`,
  },
  {
    slug: "first-time-import-from-japan",
    title: "First-time import from Japan — starter guide",
    description: "Auction grades, shipping, and why duty estimates matter before you bid.",
    meta: { hubPath: "/duty", ctaLabel: "Estimate import duty" },
    body: `## Before you bid at auction

Understand grade (3.5 vs 4 vs 4.5), odometer verification, and rust risk for coastal use in Mombasa.

## Budget land cost early

Run a duty estimate for your target year and engine size, then add clearing, transport, and registration. Compare against similar local stock on the marketplace.`,
  },
  {
    slug: "hybrid-cars-worth-it-kenya",
    title: "Are hybrid cars worth it in Kenya?",
    description: "Fuel savings, battery risk, and who hybrid makes sense for in Nairobi traffic.",
    meta: { hubPath: "/cars", ctaLabel: "Browse hybrid listings" },
    body: `## Where hybrids win

Stop-start traffic in Nairobi and moderate daily mileage can make hybrids economical if purchase price is not heavily premium.

## What to check

Battery health indicators, service history, and whether your mechanic is comfortable with the model. Filter fuel type to hybrid on search to compare live prices.`,
  },
  ...GUIDES.map(({ slug, title, description, body, meta }) => ({
    slug,
    title,
    description,
    body,
    meta,
  })),
];

async function seedEditorial() {
  for (const post of BLOG) {
    await upsertPage({ type: "BLOG", ...post, meta: null });
  }
  for (const page of LANDING) {
    const { meta, ...rest } = page;
    await upsertPage({ type: "LANDING", meta, ...rest });
  }
}

async function seedCuratedComparisons() {
  for (const row of CURATED_COMPARISONS) {
    const slug = buildComparisonSlug(row.makeA, row.modelA, row.makeB, row.modelB);
    const title = `${row.makeA} ${row.modelA} vs ${row.makeB} ${row.modelB}: which to buy in Kenya?`;
    const description = `Compare ${row.makeA} ${row.modelA} and ${row.makeB} ${row.modelB} for Kenyan buyers — live listings and buying tips.`;
    await upsertPage({
      type: "COMPARISON",
      slug,
      title,
      description,
      body: `## ${row.makeA} ${row.modelA} vs ${row.makeB} ${row.modelB}\n\n${row.body}\n\nBrowse live inventory on Welsh Motorhub for both models before you decide.`,
      meta: { makeA: row.makeA, modelA: row.modelA, makeB: row.makeB, modelB: row.modelB },
    });
  }
  return CURATED_COMPARISONS.length;
}

async function seedInventoryComparisons() {
  const grouped = await db.car.groupBy({
    by: ["make", "model"],
    where: { available: true },
    _count: { _all: true },
  });

  const models = grouped
    .filter((g) => g._count._all >= 2)
    .sort((a, b) => b._count._all - a._count._all)
    .slice(0, 20);

  const pairs = [];
  for (let i = 0; i < models.length; i += 1) {
    for (let j = i + 1; j < models.length; j += 1) {
      pairs.push({ a: models[i], b: models[j] });
      if (pairs.length >= 40) break;
    }
    if (pairs.length >= 40) break;
  }

  let created = 0;
  for (const { a, b } of pairs) {
    const slug = buildComparisonSlug(a.make, a.model, b.make, b.model);
    const existing = await db.seoContentPage.findUnique({ where: { slug }, select: { id: true } });
    if (existing) continue;

    const title = `${a.make} ${a.model} vs ${b.make} ${b.model}: which to buy in Kenya?`;
    const description = `Compare ${a.make} ${a.model} and ${b.make} ${b.model} for Kenyan buyers — live listings and buying tips.`;
    await upsertPage({
      type: "COMPARISON",
      slug,
      title,
      description,
      body: `## ${a.make} ${a.model} vs ${b.make} ${b.model}

Compare live inventory, pricing, and dealer options on Welsh Motorhub before you decide.`,
      meta: { makeA: a.make, modelA: a.model, makeB: b.make, modelB: b.model },
    });
    created += 1;
  }

  return created;
}

async function main() {
  await seedEditorial();
  const curated = await seedCuratedComparisons();
  const inventory = await seedInventoryComparisons();
  const guideCount = LANDING.length;
  const blogCount = BLOG.length;
  console.log(
    `SEO content seeded: ${blogCount} blog, ${guideCount} guides (landing), ${curated} curated comparisons, ${inventory} inventory comparisons (new)`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
