import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { buildCarPublicSlugBase } from "@/lib/car-public-slug";

export const dynamic = "force-dynamic";

// Legacy slugs end in an 8-char cuid fragment: 2020-bmw-x7-eiuyntsz
const LEGACY = /^\d{4}-(?:[a-z0-9]+-){2,}[a-z0-9]{8}$/;

function authorized(req) {
  if (process.env.NODE_ENV !== "production" && !process.env.CRON_SECRET) return true;
  const authHeader = req.headers.get("authorization");
  return Boolean(process.env.CRON_SECRET) && authHeader === `Bearer ${process.env.CRON_SECRET}`;
}

/**
 * One-shot rebuild of listing public slugs to the keyword format
 * {year}-{make}-{model}[-{trim}]-{county}. Idempotent: legacy-looking slugs
 * only. ?dry=1 reports without writing.
 *
 *   curl -H "Authorization: Bearer $CRON_SECRET" \
 *        "https://bidgari.com/api/cron/rebuild-slugs?dry=1"
 */
export async function GET(req) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const dry = new URL(req.url).searchParams.get("dry") === "1";

  const cars = await db.car.findMany({
    where: { publicSlug: { not: null } },
    select: {
      id: true, year: true, make: true, model: true, variant: true, publicSlug: true,
      dealer: { select: { county: true, location: true } },
    },
  });

  const taken = new Set(cars.map((c) => c.publicSlug));
  const changes = [];
  for (const car of cars) {
    if (!LEGACY.test(car.publicSlug)) continue;
    const base = buildCarPublicSlugBase(car, car.dealer);
    let candidate = base;
    let n = 1;
    while (taken.has(candidate)) candidate = `${base}-${++n}`;
    if (candidate === car.publicSlug) continue;
    taken.delete(car.publicSlug);
    taken.add(candidate);
    changes.push({ from: car.publicSlug, to: candidate });
    if (!dry) {
      await db.car.update({ where: { id: car.id }, data: { publicSlug: candidate } });
    }
  }

  if (!dry && changes.length) {
    // Refresh ISR pages that embed listing URLs (detail, hubs, sitemap).
    for (const tag of ["cars", "homepage", "sitemap"]) {
      try { revalidateTag(tag); } catch { /* tag may not exist */ }
    }
  }
  return NextResponse.json({ dry, count: changes.length, changes });
}
