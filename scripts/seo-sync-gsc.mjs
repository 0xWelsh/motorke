#!/usr/bin/env node
/**
 * Manual GSC sync into Postgres.
 * Usage: npm run seo:sync-gsc  (requires GSC_SYNC_ENABLED in env)
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { GoogleAuth } from "google-auth-library";
import { PrismaClient } from "@prisma/client";

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

const GSC_SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";
const GSC_API = "https://www.googleapis.com/webmasters/v3/sites";

function parseCreds() {
  const raw =
    process.env.GSC_SERVICE_ACCOUNT_JSON?.trim() ||
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) return null;
  return JSON.parse(raw);
}

function fmt(d) {
  return d.toISOString().slice(0, 10);
}

function daysAgo(n) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

async function query(client, siteUrl, dimensions, rowLimit) {
  const endDate = daysAgo(2);
  const startDate = daysAgo(30);
  const encoded = encodeURIComponent(siteUrl);
  const res = await client.request({
    url: `${GSC_API}/${encoded}/searchAnalytics/query`,
    method: "POST",
    data: {
      startDate: fmt(startDate),
      endDate: fmt(endDate),
      dimensions,
      rowLimit,
    },
  });
  return res.data?.rows || [];
}

async function main() {
  const siteUrl =
    process.env.GSC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!siteUrl) {
    console.error("Set GSC_SITE_URL or NEXT_PUBLIC_SITE_URL");
    process.exit(1);
  }

  const credentials = parseCreds();
  if (!credentials) {
    console.error("Missing GSC_SERVICE_ACCOUNT_JSON or GOOGLE_SERVICE_ACCOUNT_JSON");
    process.exit(1);
  }

  const auth = new GoogleAuth({ credentials, scopes: [GSC_SCOPE] });
  const client = await auth.getClient();

  const [queryRows, pageRows] = await Promise.all([
    query(client, siteUrl, ["query"], 100),
    query(client, siteUrl, ["page"], 50),
  ]);

  const rows = [
    ...queryRows.map((r) => ({
      dimension: "query",
      key: r.keys?.[0] || "",
      clicks: r.clicks ?? 0,
      impressions: r.impressions ?? 0,
      ctr: r.ctr ?? 0,
      position: r.position ?? 0,
    })),
    ...pageRows.map((r) => ({
      dimension: "page",
      key: r.keys?.[0] || "",
      clicks: r.clicks ?? 0,
      impressions: r.impressions ?? 0,
      ctr: r.ctr ?? 0,
      position: r.position ?? 0,
    })),
  ].filter((r) => r.key);

  const db = new PrismaClient();
  const endDate = daysAgo(2);
  const startDate = daysAgo(30);

  const sync = await db.seoGscSync.create({
    data: {
      siteUrl,
      startDate,
      endDate,
      rows: {
        create: rows.map((row) => ({
          dimension: row.dimension,
          key: row.key.slice(0, 500),
          clicks: row.clicks,
          impressions: row.impressions,
          ctr: row.ctr,
          position: row.position,
        })),
      },
    },
    include: { rows: true },
  });

  console.log(`GSC sync ok: ${sync.id} (${sync.rows.length} rows)`);
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
