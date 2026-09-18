// prisma/seed-luxury.js
// One-time backfill: marks existing cars as isLuxury = true based on curated criteria.
// Run: DATABASE_URL="..." node prisma/seed-luxury.js

const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

const ALWAYS_LUXURY_MAKES = new Set([
  "PORSCHE", "BENTLEY", "ROLLS-ROYCE", "FERRARI", "LAMBORGHINI",
  "ASTON MARTIN", "MASERATI", "JAGUAR", "RANGE ROVER",
]);

const PRICE_FLOOR = 7_000_000;

const PREMIUM_MAKES = new Set(["BMW", "MERCEDES-BENZ", "AUDI", "VOLVO", "LAND ROVER"]);

const LUXURY_TOYOTA_MODELS = [
  /land cruiser 300/i, /land cruiser v8/i, /land cruiser zx/i,
];

const LEXUS_LUXURY_MODELS = [/\blx[56]00\b/i, /\blx570\b/i, /\blx500d\b/i];

const EXCLUDED_MODELS = [
  /fortuner/i, /prado/i, /218i/i, /520i.*e60/i, /cx-?60/i, /freelander/i,
];

const BMW_ALWAYS_LUXURY = [
  /^m[3-8]\b/i, /\bm\s*[3458]\b/i, /\bx[5-7]\b/i, /\b7[0-9][0-9]i\b/i,
];

const MB_ALWAYS_LUXURY = [
  /\bg[0-9]{2,3}\b/i, /\bs[5-9][0-9]{2}\b/i, /\bgt[0-9]/i,
];

function isMBFullAMG(s) {
  if (/amg[- ]?line/i.test(s)) return false;
  return /\bamg\b/i.test(s) && /\b[egsc]\d{2,3}\b/i.test(s);
}

function isMBPremiumEClass(s) { return /\be[4-9][0-9]{2}\b/i.test(s); }
function isExcluded(s) { return EXCLUDED_MODELS.some((re) => re.test(s)); }
function matchesList(list, s) { return list.some((re) => re.test(s)); }

function isLuxuryCar(car) {
  const make = (car.make || "").trim().toUpperCase();
  const model = (car.model || "").trim();
  const variant = (car.variant || "").trim();
  const fullModel = `${model} ${variant}`;
  const price = car.price || 0;

  if (isExcluded(model) || isExcluded(variant)) return false;
  if (ALWAYS_LUXURY_MAKES.has(make)) return true;
  if (make === "TOYOTA") return LUXURY_TOYOTA_MODELS.some((re) => re.test(fullModel));
  if (make === "LEXUS") return matchesList(LEXUS_LUXURY_MODELS, fullModel);
  if (make === "BMW") {
    if (matchesList(BMW_ALWAYS_LUXURY, fullModel)) return true;
    return price >= PRICE_FLOOR;
  }
  if (make === "MERCEDES-BENZ") {
    if (matchesList(MB_ALWAYS_LUXURY, fullModel)) return true;
    if (isMBFullAMG(fullModel)) return true;
    if (isMBPremiumEClass(fullModel)) return true;
    if (/\bgle\b/i.test(fullModel) || /\bgls\b/i.test(fullModel)) return price >= PRICE_FLOOR;
    return price >= PRICE_FLOOR;
  }
  if (PREMIUM_MAKES.has(make)) return price >= PRICE_FLOOR;
  return false;
}

async function main() {
  const cars = await db.car.findMany({
    select: { id: true, make: true, model: true, variant: true, price: true, isLuxury: true },
  });

  console.log(`Found ${cars.length} cars total.`);
  const toMark = cars.filter((c) => !c.isLuxury && isLuxuryCar(c));
  const toUnmark = cars.filter((c) => c.isLuxury && !isLuxuryCar(c));

  console.log(`${toMark.length} cars to mark as luxury.`);
  console.log(`${toUnmark.length} cars to unmark.`);

  if (toMark.length > 0) {
    console.log("\nMarking:");
    for (const c of toMark) console.log(`  + ${c.year || "?"} ${c.make} ${c.model}${c.variant ? " " + c.variant : ""} — KES ${(c.price || 0).toLocaleString()}`);
    await db.car.updateMany({ where: { id: { in: toMark.map((c) => c.id) } }, data: { isLuxury: true } });
  }
  if (toUnmark.length > 0) {
    console.log("\nUnmarking:");
    for (const c of toUnmark) console.log(`  - ${c.year || "?"} ${c.make} ${c.model}${c.variant ? " " + c.variant : ""} — KES ${(c.price || 0).toLocaleString()}`);
    await db.car.updateMany({ where: { id: { in: toUnmark.map((c) => c.id) } }, data: { isLuxury: false } });
  }

  const finalCount = await db.car.count({ where: { isLuxury: true } });
  console.log(`\nDone. ${finalCount} cars now marked as luxury.`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
