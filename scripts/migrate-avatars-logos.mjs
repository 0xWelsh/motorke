#!/usr/bin/env node
// One-shot: free Supabase storage quota (delete dead car-images) then migrate
// user avatars + dealer logos from Supabase to R2.
//
// Precondition: Supabase storage must be reachable (project owner must remove
// spend caps / upgrade the plan if the service is quota-locked with 402).
//   node scripts/migrate-avatars-logos.mjs
import "dotenv/config";

import { PrismaClient } from "@prisma/client";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { config as loadEnv } from "dotenv";
import { readFileSync } from "node:fs";

// The local .env holds R2 credentials; production DB/supabase values live in
// .env.vercel.prod (which carries EMPTY R2_* placeholders). Load .env LAST so
// the real local R2 credentials win.
for (const path of [".env.vercel.prod", ".env.local", ".env"]) {
  try { loadEnv({ path, override: true }); } catch {}
}

const prisma = new PrismaClient();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = "car-images";
const SUPABASE_MARKER = "/storage/v1/object/public/car-images/";

const R2_ENDPOINT = process.env.R2_ENDPOINT;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "bidgari";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

const s3 = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

const sbHeaders = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
};

async function sbList(prefix) {
  const names = [];
  let offset = 0;
  for (;;) {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/list/${BUCKET}`, {
      method: "POST",
      headers: sbHeaders,
      body: JSON.stringify({ prefix, limit: 200, offset, sortBy: { column: "name", order: "asc" } }),
    });
    if (!res.ok) throw new Error(`list ${prefix} @${offset} -> HTTP ${res.status}: ${await res.text()}`);
    const batch = await res.json();
    if (!Array.isArray(batch) || batch.length === 0) break;
    names.push(...batch.map((o) => o.name));
    offset += batch.length;
  }
  return names;
}

async function sbDelete(names) {
  for (let i = 0; i < names.length; i += 1000) {
    const chunk = names.slice(i, i + 1000);
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/delete/${BUCKET}`, {
      method: "POST",
      headers: sbHeaders,
      body: JSON.stringify(chunk),
    });
    if (!res.ok) throw new Error(`delete batch -> HTTP ${res.status}: ${await res.text()}`);
    const data = await res.json();
    const failed = (data || []).filter((d) => d && !d.name).length;
    if (failed > 0) console.warn(`  ${failed} objects failed to delete in batch`);
  }
}

async function s3Upload(key, buffer, mimeType) {
  await s3.send(
    new PutObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key, Body: buffer, ContentType: mimeType })
  );
}

function supabaseKeyFromUrl(url) {
  const idx = url.indexOf(SUPABASE_MARKER);
  return idx === -1 ? null : url.slice(idx + SUPABASE_MARKER.length);
}

async function migrateUrl(url) {
  const key = supabaseKeyFromUrl(url);
  if (!key) return null;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch ${url.slice(-60)} -> HTTP ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  const mimeType = res.headers.get("content-type") || "image/jpeg";
  await s3Upload(key, buffer, mimeType);
  return `${R2_PUBLIC_URL}/${key}`;
}

async function main() {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error("Missing Supabase URL/service key env");
  if (!R2_PUBLIC_URL) throw new Error("Missing R2_PUBLIC_URL env");

  console.log("=== 1. Freeing quota: deleting dead cars/ objects ===");
  const carObjects = await sbList("cars/");
  console.log(`  found ${carObjects.length} car-image objects`);
  if (carObjects.length > 0) await sbDelete(carObjects);

  console.log("\n=== 2. Migrating user avatars ===");
  const users = await prisma.user.findMany({
    where: { avatarUrl: { contains: "supabase.co" } },
    select: { id: true, name: true, avatarUrl: true },
  });
  let avatarsOk = 0;
  for (const u of users) {
    try {
      const newUrl = await migrateUrl(u.avatarUrl);
      if (!newUrl) { console.log(`  skip (unexpected url): ${u.name}`); continue; }
      await prisma.user.update({ where: { id: u.id }, data: { avatarUrl: newUrl } });
      avatarsOk++;
      console.log(`  migrated ${u.name}`);
    } catch (e) { console.error(`  FAIL ${u.name}: ${e.message}`); }
  }
  console.log(`  avatars: ${avatarsOk}/${users.length}`);

  console.log("\n=== 3. Migrating dealer logos ===");
  const dealers = await prisma.dealer.findMany({
    where: { logoUrl: { contains: "supabase.co" } },
    select: { id: true, name: true, logoUrl: true },
  });
  let logosOk = 0;
  for (const d of dealers) {
    try {
      const newUrl = await migrateUrl(d.logoUrl);
      if (!newUrl) { console.log(`  skip (unexpected url): ${d.name}`); continue; }
      await prisma.dealer.update({ where: { id: d.id }, data: { logoUrl: newUrl } });
      logosOk++;
      console.log(`  migrated ${d.name}`);
    } catch (e) { console.error(`  FAIL ${d.name}: ${e.message}`); }
  }
  console.log(`  logos: ${logosOk}/${dealers.length}`);

  console.log("\n=== Done ===");
}

main()
  .catch((err) => { console.error("Fatal:", err); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
