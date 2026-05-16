#!/usr/bin/env node
/**
 * Idempotent: fills Car.publicSlug for rows where it is null.
 *
 * Uses DIRECT_URL when set (Supabase Session pooler :5432) — same as Prisma migrations.
 * The :6543 transaction pool in DATABASE_URL is often unreachable or unsuitable from a
 * laptop for long scripts; prefer DIRECT_URL in .env (see .env.example).
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";

function applyEnvFile(filename, overridesExisting) {
  const p = resolve(process.cwd(), filename);
  if (!existsSync(p)) return;
  const raw = readFileSync(p, "utf8");
  for (const line of raw.split("\n")) {
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

function parsePostgresUrl(raw) {
  try {
    return new URL(String(raw).replace(/^postgresql:/, "postgres:"));
  } catch {
    return null;
  }
}

/** Session pooler :5432 from DATABASE_URL (same idea as scripts/migrate-deploy.sh). */
function sessionPoolerFromDatabaseUrl(databaseUrl) {
  const session = parsePostgresUrl(databaseUrl);
  if (!session) return null;
  session.port = "5432";
  session.searchParams.delete("pgbouncer");
  session.searchParams.delete("connection_limit");
  session.searchParams.delete("pool_timeout");
  if (!session.searchParams.has("sslmode")) {
    session.searchParams.set("sslmode", "require");
  }
  return session.toString().replace(/^postgres:/, "postgresql:");
}

function prismaUrlForBackfill() {
  const direct = (process.env.DIRECT_URL || "").trim();
  const directParsed = direct ? parsePostgresUrl(direct) : null;
  const isIpv6DirectHost = Boolean(
    directParsed?.hostname?.match(/^db\.[a-z0-9]+\.supabase\.co$/i),
  );

  // Good DIRECT_URL: session pooler on :5432 without pgbouncer (matches Vercel migrate).
  const useConfiguredDirect =
    directParsed &&
    directParsed.port === "5432" &&
    !directParsed.searchParams.has("pgbouncer") &&
    !isIpv6DirectHost;

  if (useConfiguredDirect) {
    console.error(`backfill: using DIRECT_URL (${directParsed.hostname}:5432)`);
    return direct;
  }

  if (isIpv6DirectHost) {
    console.error(
      "backfill: DIRECT_URL is db.<ref>.supabase.co — often unreachable from laptops (IPv6).\n" +
        "         falling back to Session pooler :5432 from DATABASE_URL.\n" +
        "         In Supabase → Connect, copy Session pooler URI into DIRECT_URL.\n",
    );
  }

  const dbUrl = (process.env.DATABASE_URL || "").trim();
  const session = sessionPoolerFromDatabaseUrl(dbUrl);
  if (session) {
    const host = parsePostgresUrl(session)?.hostname || "pooler";
    console.error(`backfill: using Session pooler ${host}:5432`);
    return session;
  }

  if (direct) {
    console.error(`backfill: using DIRECT_URL as last resort (${directParsed?.hostname})`);
    return direct;
  }

  console.error(
    "backfill-car-public-slugs: Missing DIRECT_URL or DATABASE_URL.\n" +
      "Put them in .env or .env.local (this script loads both).\n",
  );
  process.exit(1);
}

function slugifyCarSegment(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildBasePublicSlug(car) {
  const y = Number(car.year);
  const ys = Number.isFinite(y) ? String(y) : "0";
  return `${ys}-${slugifyCarSegment(car.make)}-${slugifyCarSegment(car.model)}-${String(car.id).slice(-8)}`.toLowerCase();
}

async function slugExists(tx, slug, excludeId) {
  const row = await tx.car.findFirst({
    where: { publicSlug: slug, ...(excludeId ? { id: { not: excludeId } } : {}) },
    select: { id: true },
  });
  return Boolean(row);
}

async function allocateSlug(tx, car) {
  const base = buildBasePublicSlug(car);
  let candidate = base;
  let suffix = 0;
  while (await slugExists(tx, candidate, car.id)) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
  return candidate;
}

async function main() {
  const url = prismaUrlForBackfill();
  const prisma = new PrismaClient({
    datasources: { db: { url } },
    log: process.env.DEBUG_PRISMA ? ["info", "warn", "error"] : ["warn", "error"],
  });
  try {
    const rows = await prisma.car.findMany({
      where: { publicSlug: null },
      select: { id: true, year: true, make: true, model: true },
    });
    if (rows.length === 0) {
      console.log("backfill-car-public-slugs: nothing to do");
      return;
    }
    console.log(`backfill-car-public-slugs: ${rows.length} rows`);
    for (const car of rows) {
      await prisma.$transaction(async (tx) => {
        const slug = await allocateSlug(tx, car);
        await tx.car.update({ where: { id: car.id }, data: { publicSlug: slug } });
      });
    }
    console.log("backfill-car-public-slugs: done");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
