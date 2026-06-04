#!/usr/bin/env node
/**
 * scripts/generate-seo-comparisons.mjs
 * 
 * Automatically generates SEO comparison pages based on current inventory.
 * Uses the high-quality templates and logic from the comparison generator service.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";

// --- Env Loader (borrowed from seed script) ---
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
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
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

// Re-implementing logic with relative paths since we can't easily use @ aliases in a raw script
function slugify(s) {
  return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function buildComparisonSlug(makeA, modelA, makeB, modelB) {
  const left = `${slugify(makeA)}-${slugify(modelA)}`;
  const right = `${slugify(makeB)}-${slugify(modelB)}`;
  const [a, b] = [left, right].sort();
  return `${a}-vs-${b}`;
}

function buildComparisonTitle(makeA, modelA, makeB, modelB) {
  return `${makeA} ${modelA} vs ${makeB} ${modelB}: which to buy in Kenya?`;
}

function buildComparisonDescription(makeA, modelA, makeB, modelB) {
  return `Compare ${makeA} ${modelA} and ${makeB} ${modelB} for Kenyan buyers, pricing context, use cases, and live listings on Welsh Motorhub.`;
}

function buildComparisonBody(makeA, modelA, makeB, modelB) {
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

Use the side-by-side compare tool with real listings you shortlist, specs, duty estimates, and dealer contact in one place.`;
}

async function main() {
  console.log("🔍 Scanning inventory for popular comparison pairs...");

  const grouped = await db.car.groupBy({
    by: ["make", "model"],
    where: { available: true },
    _count: { _all: true },
  });

  const models = grouped
    .filter((g) => g._count._all >= 1) // Even 1 is okay for long-tail SEO if we expect more later
    .sort((a, b) => b._count._all - a._count._all)
    .slice(0, 20);

  const pairs = [];
  for (let i = 0; i < models.length; i += 1) {
    for (let j = i + 1; j < models.length; j += 1) {
      const a = models[i];
      const b = models[j];
      pairs.push({
        makeA: a.make,
        modelA: a.model,
        makeB: b.make,
        modelB: b.model,
      });
      if (pairs.length >= 50) break;
    }
    if (pairs.length >= 50) break;
  }

  console.log(`🚀 Found ${pairs.length} candidate pairs. Generating SEO pages...`);

  let count = 0;
  for (const pair of pairs) {
    const slug = buildComparisonSlug(pair.makeA, pair.modelA, pair.makeB, pair.modelB);
    const title = buildComparisonTitle(pair.makeA, pair.modelA, pair.makeB, pair.modelB);
    const description = buildComparisonDescription(pair.makeA, pair.modelA, pair.makeB, pair.modelB);
    const body = buildComparisonBody(pair.makeA, pair.modelA, pair.makeB, pair.modelB);
    const meta = { makeA: pair.makeA, modelA: pair.modelA, makeB: pair.makeB, modelB: pair.modelB };
    
    await db.seoContentPage.upsert({
      where: { slug },
      create: {
        type: "COMPARISON",
        slug,
        title,
        description,
        body,
        meta,
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
      update: {
        title,
        description,
        body,
        meta,
      },
    });
    count++;
    if (count % 10 === 0) console.log(`...processed ${count} pages`);
  }

  console.log(`✅ SEO Generation Complete! ${count} comparison pages are now live for Google to crawl.`);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
