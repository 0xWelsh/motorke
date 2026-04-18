/**
 * scripts/geocode-dealers.mjs
 * Geocodes any dealers that are missing lat/lng using OpenStreetMap Nominatim.
 * Run with:  node scripts/geocode-dealers.mjs
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function geocode(address) {
  const q = encodeURIComponent(address);
  const url = `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&countrycodes=ke,cn,jp,gb`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Motorke-Geocoder/1.0 (motorke.co.ke)" },
  });
  if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`);
  const data = await res.json();
  if (!data.length) return null;
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), display: data[0].display_name };
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const dealers = await db.dealer.findMany({
    select: { id: true, name: true, address: true, location: true, county: true, lat: true, lng: true },
  });

  const missing = dealers.filter((d) => !d.lat || !d.lng);
  console.log(`\n📍 ${dealers.length} dealers total, ${missing.length} missing coordinates.\n`);

  if (missing.length === 0) {
    console.log("✅  All dealers already have coordinates — nothing to do.");
    return;
  }

  for (const dealer of missing) {
    // Build a search query from the most specific to least specific
    const queries = [
      [dealer.address, "Kenya"].filter(Boolean).join(", "),
      [dealer.location, dealer.county, "Kenya"].filter(Boolean).join(", "),
      [dealer.name, dealer.county, "Kenya"].filter(Boolean).join(", "),
    ];

    let result = null;
    for (const q of queries) {
      if (!q.trim()) continue;
      console.log(`  🔍  Trying: "${q}"`);
      try {
        result = await geocode(q);
        if (result) break;
      } catch (e) {
        console.warn(`     ⚠️  ${e.message}`);
      }
      await sleep(1100); // Nominatim rate limit: 1 req/sec
    }

    if (!result) {
      console.log(`  ❌  ${dealer.name} — could not geocode, skipping.\n`);
      continue;
    }

    await db.dealer.update({
      where: { id: dealer.id },
      data: { lat: result.lat, lng: result.lng },
    });

    console.log(`  ✅  ${dealer.name}`);
    console.log(`      → ${result.lat.toFixed(6)}, ${result.lng.toFixed(6)}`);
    console.log(`      → ${result.display}\n`);

    await sleep(1100);
  }

  console.log("Done.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
