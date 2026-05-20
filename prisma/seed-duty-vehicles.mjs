#!/usr/bin/env node
/**
 * Seed CRSP reference rows for /duty calculator.
 * Delegates to starter CSV import (same as npm run db:import-crsp).
 *
 * Run: npm run db:seed-duty
 */
import { PrismaClient } from "@prisma/client";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseDutyCrspCsv, upsertDutyCrspRows } from "../scripts/lib/duty-crsp-import.mjs";

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

const csvPath = resolve(process.cwd(), "data/duty-crsp/starter-catalog.csv");
const prisma = new PrismaClient();

async function main() {
  if (!existsSync(csvPath)) {
    console.error(`Missing ${csvPath}. Run from repo root.`);
    process.exit(1);
  }
  const { rows, errors } = parseDutyCrspCsv(readFileSync(csvPath, "utf8"));
  if (errors.length) {
    console.warn("Parse warnings:", errors.slice(0, 5));
  }
  if (!rows.length) {
    console.error("No valid rows in starter catalog.");
    process.exit(1);
  }
  const result = await upsertDutyCrspRows(prisma, rows, { source: "seed-starter-catalog" });
  console.log(`db:seed-duty — upserted ${result.upserted} duty vehicles from starter-catalog.csv`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
