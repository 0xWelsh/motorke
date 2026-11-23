#!/usr/bin/env node
/**
 * Rebuild listing public slugs to the keyword format
 *   {year}-{make}-{model}[-{trim}]-{county}
 * for cars whose current slug carries the legacy cuid suffix.
 *
 * Self-contained (mirrors src/lib/car-public-slug.js formatting rules) so it
 * runs with plain node against any reachable DB.
 *
 * Usage:
 *   node --env-file=.env.production scripts/rebuild-listing-slugs.mjs [--dry]
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const DRY = process.argv.includes("--dry");

// ── keep in sync with src/lib/car-public-slug.js ──
const slug = (v) =>
  String(v || "").trim().toLowerCase().normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
const SEO_COUNTIES = ["Nairobi","Mombasa","Nakuru","Kisumu","Uasin Gishu","Kiambu","Machakos","Meru"];
const locSeg = (dealer) => {
  const s = slug(String(dealer?.county || dealer?.location || "").split(/[,/]/)[0]);
  if (!s) return "kenya";
  const canon = SEO_COUNTIES.find((c) => slug(c) === s);
  if (canon) return slug(canon);
  return s.length <= 14 ? s : "kenya";
};
const baseSlug = (car, dealer) => {
  const y = Number(car.year);
  const parts = [Number.isFinite(y) ? String(y) : "0", slug(car.make), slug(car.model)];
  const variant = slug(car.variant || "");
  if (variant && variant.length <= 12 && !parts.includes(variant)) parts.push(variant);
  parts.push(locSeg(dealer));
  return parts.join("-").toLowerCase().slice(0, 80);
};
// ── end mirror ──

// Legacy slugs end in an 8-char cuid fragment: 2020-bmw-x7-eiuyntsz
const LEGACY = /^\d{4}-(?:[a-z0-9]+-){2,}[a-z0-9]{8}$/;

const cars = await db.car.findMany({
  where: { publicSlug: { not: null } },
  select: {
    id: true, year: true, make: true, model: true, variant: true, publicSlug: true,
    dealer: { select: { county: true, location: true } },
  },
});

let changed = 0;
for (const car of cars) {
  if (!LEGACY.test(car.publicSlug)) continue;
  const base = baseSlug(car, car.dealer);
  let candidate = base;
  let n = 1;
  // eslint-disable-next-line no-await-in-loop
  while (await db.car.findFirst({ where: { publicSlug: candidate, id: { not: car.id } }, select: { id: true } })) {
    candidate = `${base}-${++n}`;
  }
  if (candidate === car.publicSlug) continue;
  console.log(`${car.publicSlug}  ->  ${candidate}`);
  if (!DRY) {
    // eslint-disable-next-line no-await-in-loop
    await db.car.update({ where: { id: car.id }, data: { publicSlug: candidate } });
  }
  changed++;
}

console.log(`${DRY ? "would update" : "updated"} ${changed} slugs`);
await db.$disconnect();
