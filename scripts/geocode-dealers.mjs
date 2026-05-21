#!/usr/bin/env node
/**
 * Backfill dealer lat/lng from address when missing.
 * Usage: node scripts/geocode-dealers.mjs [--dry-run]
 * Requires DATABASE_URL in .env (rate-limit: 1 req/sec for Nominatim).
 */
import { PrismaClient } from "@prisma/client";
import { geocodeAddressKenya } from "../src/lib/geocode.js";

const dryRun = process.argv.includes("--dry-run");
const prisma = new PrismaClient();

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const dealers = await prisma.dealer.findMany({
    where: { OR: [{ lat: null }, { lng: null }] },
    select: { id: true, name: true, address: true, location: true, county: true, lat: true, lng: true },
  });

  console.log(`Found ${dealers.length} dealer(s) without coordinates.`);
  let updated = 0;

  for (const d of dealers) {
    const hit = await geocodeAddressKenya({
      address: d.address,
      location: d.location,
      county: d.county,
    });
    await sleep(1100);

    if (!hit) {
      console.log(`  skip ${d.name} — no geocode hit`);
      continue;
    }

    console.log(`  ${dryRun ? "[dry-run] " : ""}${d.name} → ${hit.lat}, ${hit.lng}`);
    if (!dryRun) {
      await prisma.dealer.update({
        where: { id: d.id },
        data: { lat: hit.lat, lng: hit.lng },
      });
    }
    updated += 1;
  }

  console.log(`Done. ${updated} updated.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
