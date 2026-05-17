#!/usr/bin/env node
/**
 * Seed CRSP reference rows for /duty calculator.
 * Run: npm run db:seed-duty
 */
import { PrismaClient } from "@prisma/client";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

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

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function slugFor(row) {
  return [row.make, row.model, row.trim, row.year].filter(Boolean).map(slugify).join("-");
}

/** Illustrative CRSP (KES) for MVP — replace via admin as official values are updated. */
const VEHICLES = [
  { make: "Toyota", model: "Land Cruiser", trim: "V8", year: 2018, engineCC: 4500, fuelType: "DIESEL", bodyType: "SUV", crspKes: 8_500_000 },
  { make: "Toyota", model: "Land Cruiser", trim: "VX", year: 2016, engineCC: 4600, fuelType: "DIESEL", bodyType: "SUV", crspKes: 7_200_000 },
  { make: "Toyota", model: "Prado", trim: "TX", year: 2018, engineCC: 2800, fuelType: "DIESEL", bodyType: "SUV", crspKes: 5_400_000 },
  { make: "Toyota", model: "Prado", trim: "TZ-G", year: 2017, engineCC: 2800, fuelType: "DIESEL", bodyType: "SUV", crspKes: 5_100_000 },
  { make: "Toyota", model: "Harrier", trim: "Premium", year: 2019, engineCC: 2500, fuelType: "HYBRID", bodyType: "SUV", crspKes: 4_200_000 },
  { make: "Toyota", model: "Harrier", year: 2018, engineCC: 2000, fuelType: "PETROL", bodyType: "SUV", crspKes: 3_600_000 },
  { make: "Toyota", model: "RAV4", year: 2019, engineCC: 2500, fuelType: "HYBRID", bodyType: "SUV", crspKes: 3_800_000 },
  { make: "Toyota", model: "Fielder", year: 2017, engineCC: 1500, fuelType: "PETROL", bodyType: "WAGON", crspKes: 1_650_000 },
  { make: "Toyota", model: "Vitz", year: 2018, engineCC: 1000, fuelType: "PETROL", bodyType: "HATCHBACK", crspKes: 1_050_000 },
  { make: "Toyota", model: "Axio", year: 2018, engineCC: 1500, fuelType: "PETROL", bodyType: "SEDAN", crspKes: 1_450_000 },
  { make: "Toyota", model: "Premio", year: 2017, engineCC: 1800, fuelType: "PETROL", bodyType: "SEDAN", crspKes: 1_750_000 },
  { make: "Mazda", model: "CX-5", year: 2018, engineCC: 2200, fuelType: "DIESEL", bodyType: "SUV", crspKes: 3_200_000 },
  { make: "Mazda", model: "CX-5", year: 2019, engineCC: 2000, fuelType: "PETROL", bodyType: "SUV", crspKes: 3_100_000 },
  { make: "Mazda", model: "Demio", year: 2018, engineCC: 1300, fuelType: "PETROL", bodyType: "HATCHBACK", crspKes: 1_200_000 },
  { make: "Subaru", model: "Forester", year: 2018, engineCC: 2000, fuelType: "PETROL", bodyType: "SUV", crspKes: 2_900_000 },
  { make: "Subaru", model: "Outback", year: 2017, engineCC: 2500, fuelType: "PETROL", bodyType: "WAGON", crspKes: 3_100_000 },
  { make: "Nissan", model: "X-Trail", year: 2018, engineCC: 2000, fuelType: "PETROL", bodyType: "SUV", crspKes: 2_750_000 },
  { make: "Nissan", model: "Note", year: 2018, engineCC: 1200, fuelType: "PETROL", bodyType: "HATCHBACK", crspKes: 1_100_000 },
  { make: "Honda", model: "Fit", year: 2018, engineCC: 1300, fuelType: "PETROL", bodyType: "HATCHBACK", crspKes: 1_250_000 },
  { make: "Honda", model: "CR-V", year: 2018, engineCC: 2000, fuelType: "PETROL", bodyType: "SUV", crspKes: 3_000_000 },
  { make: "Mitsubishi", model: "Outlander", year: 2018, engineCC: 2400, fuelType: "PETROL", bodyType: "SUV", crspKes: 2_850_000 },
  { make: "Mitsubishi", model: "Pajero", year: 2016, engineCC: 3200, fuelType: "DIESEL", bodyType: "SUV", crspKes: 4_500_000 },
  { make: "Mercedes-Benz", model: "C-Class", trim: "C200", year: 2016, engineCC: 2000, fuelType: "PETROL", bodyType: "SEDAN", crspKes: 3_400_000 },
  { make: "BMW", model: "X3", year: 2018, engineCC: 2000, fuelType: "DIESEL", bodyType: "SUV", crspKes: 4_100_000 },
  { make: "Volkswagen", model: "Tiguan", year: 2018, engineCC: 2000, fuelType: "PETROL", bodyType: "SUV", crspKes: 3_300_000 },
  { make: "Isuzu", model: "D-Max", year: 2018, engineCC: 3000, fuelType: "DIESEL", bodyType: "PICKUP", crspKes: 3_600_000 },
  { make: "Toyota", model: "Hilux", year: 2018, engineCC: 2800, fuelType: "DIESEL", bodyType: "PICKUP", crspKes: 4_200_000 },
  { make: "Toyota", model: "Noah", year: 2017, engineCC: 2000, fuelType: "PETROL", bodyType: "MPV", crspKes: 2_400_000 },
  { make: "Toyota", model: "Alphard", year: 2018, engineCC: 2500, fuelType: "PETROL", bodyType: "MPV", crspKes: 4_800_000 },
  { make: "Lexus", model: "RX", year: 2018, engineCC: 2000, fuelType: "PETROL", bodyType: "SUV", crspKes: 4_600_000 },
  { make: "Lexus", model: "LX", year: 2017, engineCC: 5700, fuelType: "PETROL", bodyType: "SUV", crspKes: 9_500_000 },
];

const prisma = new PrismaClient();

async function main() {
  let upserted = 0;
  for (const row of VEHICLES) {
    const slug = slugFor(row);
    await prisma.dutyVehicle.upsert({
      where: { slug },
      create: {
        ...row,
        slug,
        active: true,
        source: "seed-mvp",
        notes: "Illustrative CRSP for calculator MVP — verify against KRA schedule before compliance use.",
      },
      update: {
        make: row.make,
        model: row.model,
        trim: row.trim ?? null,
        year: row.year,
        engineCC: row.engineCC,
        fuelType: row.fuelType,
        bodyType: row.bodyType ?? null,
        crspKes: row.crspKes,
        active: true,
      },
    });
    upserted += 1;
  }
  console.log(`db:seed-duty — upserted ${upserted} duty vehicles`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
