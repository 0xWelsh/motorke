#!/usr/bin/env node
/**
 * Import duty calculator CRSP rows from CSV.
 *
 *   npm run db:import-crsp
 *   npm run db:import-crsp -- data/duty-crsp/starter-catalog.csv
 *   npm run db:import-crsp -- --dry-run data/duty-crsp/starter-catalog.csv
 */
import { PrismaClient } from "@prisma/client";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseDutyCrspCsv, upsertDutyCrspRows } from "./lib/duty-crsp-import.mjs";

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

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const fileArg = args.find((a) => !a.startsWith("--"));
const csvPath = resolve(process.cwd(), fileArg || "data/duty-crsp/starter-catalog.csv");

if (!existsSync(csvPath)) {
  console.error(`File not found: ${csvPath}`);
  console.error("Create data/duty-crsp/starter-catalog.csv or pass a path.");
  process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
  const text = readFileSync(csvPath, "utf8");
  const { rows, errors } = parseDutyCrspCsv(text);

  if (errors.length) {
    console.warn("Parse warnings:");
    for (const e of errors.slice(0, 20)) {
      console.warn(`  line ${e.line}: ${e.message}`);
    }
    if (errors.length > 20) console.warn(`  … and ${errors.length - 20} more`);
  }

  if (!rows.length) {
    console.error("No valid rows to import.");
    process.exit(1);
  }

  const result = await upsertDutyCrspRows(prisma, rows, {
    source: `csv:${fileArg || "starter-catalog"}`,
    dryRun,
  });

  const mode = dryRun ? "(dry run)" : "";
  console.log(
    `db:import-crsp ${mode}: parsed ${rows.length} rows, upserted ${result.upserted}, skipped ${result.skipped}`,
  );
  if (result.rowErrors.length) {
    for (const e of result.rowErrors.slice(0, 10)) {
      console.warn(`  line ${e.line}: ${e.message}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
