#!/usr/bin/env node
/**
 * CLI SEO audit — listings, slugs, descriptions.
 * Usage: node --env-file=.env.local scripts/seo-audit.mjs
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { PrismaClient } from "@prisma/client";

function loadEnv() {
  for (const f of [".env.local", ".env"]) {
    const p = resolve(process.cwd(), f);
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, "utf8").split("\n")) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m && !process.env[m[1].trim()]) {
        process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
      }
    }
  }
}

loadEnv();

const db = new PrismaClient();

function carListingPath(car) {
  return `/cars/${car.publicSlug || car.id}`;
}

async function runAudit() {
  const cars = await db.car.findMany({
    where: { available: true },
    select: {
      id: true,
      make: true,
      model: true,
      year: true,
      publicSlug: true,
      description: true,
      images: { select: { id: true }, take: 1 },
    },
    take: 5000,
  });

  let missingSlug = 0;
  let missingDesc = 0;
  let missingImg = 0;
  const slugs = new Map();

  for (const car of cars) {
    if (!car.publicSlug) missingSlug += 1;
    if (!car.description?.trim()) missingDesc += 1;
    if (!car.images?.length) missingImg += 1;
    if (car.publicSlug) {
      const n = (slugs.get(car.publicSlug) || 0) + 1;
      slugs.set(car.publicSlug, n);
    }
  }

  const dupSlugs = [...slugs.entries()].filter(([, n]) => n > 1).length;

  const report = {
    ok: missingSlug === 0 && dupSlugs === 0,
    listingsChecked: cars.length,
    missingPublicSlug: missingSlug,
    missingDescription: missingDesc,
    missingImages: missingImg,
    duplicateSlugKeys: dupSlugs,
  };

  console.log(JSON.stringify(report, null, 2));
  return report;
}

runAudit()
  .then((r) => process.exit(r.ok ? 0 : 1))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
