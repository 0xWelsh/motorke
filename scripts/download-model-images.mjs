// scripts/download-model-images.mjs
// Downloads Wikipedia thumbnails to local storage + fetches missing ones
// Run: node scripts/download-model-images.mjs  (safe to re-run)
import { PrismaClient } from "@prisma/client";
import { existsSync, mkdirSync, writeFileSync, createWriteStream } from "fs";
import { join, dirname, extname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL } },
});

const IMAGE_DIR = join(__dirname, "..", "public", "images", "models");
const LOG_FILE = join(__dirname, "..", "logs", "download-model-images.log");

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  try {
    mkdirSync(dirname(LOG_FILE), { recursive: true });
    writeFileSync(LOG_FILE, line + "\n", { flag: "a" });
  } catch {}
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").substring(0, 80);
}

async function downloadImage(url, filepath) {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "BIDGARI/1.0" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    mkdirSync(dirname(filepath), { recursive: true });
    writeFileSync(filepath, buffer);
    return true;
  } catch (e) {
    return false;
  }
}

async function fetchWikipediaThumbnail(make, model) {
  const searchTitle = `${make} ${model}`.replace(/\s+/g, "_");
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(searchTitle)}`,
      { headers: { "User-Agent": "BIDGARI/1.0" }, signal: AbortSignal.timeout(10000) }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data?.thumbnail?.source || null;
  } catch {
    try {
      const altTitle = `${model}`.replace(/\s+/g, "_");
      const res = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(altTitle)}`,
        { headers: { "User-Agent": "BIDGARI/1.0" }, signal: AbortSignal.timeout(10000) }
      );
      if (!res.ok) return null;
      const data = await res.json();
      return data?.thumbnail?.source || null;
    } catch {
      return null;
    }
  }
}

async function main() {
  log("=== Download model images ===");

  mkdirSync(IMAGE_DIR, { recursive: true });
  log(`Image dir: ${IMAGE_DIR}`);

  // Get all published specs
  const specs = await prisma.carModelSpec.findMany({
    where: { published: true },
    orderBy: [{ make: "asc" }, { model: "asc" }],
  });

  log(`Total published specs: ${specs.length}`);

  let downloaded = 0;
  let fetched = 0;
  let skipped = 0;
  let failed = 0;

  for (const spec of specs) {
    const filename = `${slugify(spec.make)}-${slugify(spec.model)}-${spec.yearStart}.jpg`;
    const filepath = join(IMAGE_DIR, filename);
    const localUrl = `/images/models/${filename}`;
    const records = [];

    // Collect all records with same make/model
    if (spec.imageUrl && spec.imageUrl.startsWith("http")) {
      records.push(spec);
    }

    if (!records.length) continue;

    // Skip if already downloaded locally
    if (existsSync(filepath)) {
      // Already downloaded — ensure DB points to local
      if (spec.imageUrl !== localUrl && !spec.imageUrl?.startsWith("/images")) {
        await prisma.carModelSpec.update({
          where: { id: spec.id },
          data: { imageUrl: localUrl },
        });
      }
      skipped++;
      continue;
    }

    const url = spec.imageUrl;

    // Download
    const ok = await downloadImage(url, filepath);
    if (ok) {
      await prisma.carModelSpec.update({
        where: { id: spec.id },
        data: { imageUrl: localUrl },
      });
      downloaded++;
      log(`  ↓ ${spec.make} ${spec.model} ${spec.yearStart}`);
    } else {
      failed++;
      log(`  ✗ failed: ${spec.make} ${spec.model}`);
    }
  }

  // Phase 2: Fetch thumbnails for models still without any imageUrl
  const missing = await prisma.carModelSpec.findMany({
    where: { published: true, imageUrl: null },
    distinct: ["make", "model"],
    select: { make: true, model: true },
  });

  log(`\nModels without any photo: ${missing.length}`);

  for (const { make, model } of missing) {
    const thumbUrl = await fetchWikipediaThumbnail(make, model);
    if (!thumbUrl) {
      log(`  - ${make} ${model}: no Wikipedia article`);
      continue;
    }

    // Get all spec records for this make/model
    const records = await prisma.carModelSpec.findMany({
      where: {
        published: true,
        make: { equals: make, mode: "insensitive" },
        model: { equals: model, mode: "insensitive" },
      },
    });

    if (!records.length) continue;

    // Use the first record's year for filename
    const year = records[0].yearStart;
    const filename = `${slugify(make)}-${slugify(model)}-${year}.jpg`;
    const filepath = join(IMAGE_DIR, filename);
    const localUrl = `/images/models/${filename}`;

    // Skip if already have it
    if (existsSync(filepath)) {
      for (const rec of records) {
        if (!rec.imageUrl) {
          await prisma.carModelSpec.update({ where: { id: rec.id }, data: { imageUrl: localUrl } });
        }
      }
      skipped++;
      continue;
    }

    const ok = await downloadImage(thumbUrl, filepath);
    if (ok) {
      for (const rec of records) {
        await prisma.carModelSpec.update({ where: { id: rec.id }, data: { imageUrl: localUrl } });
      }
      fetched++;
      log(`  + ${make} ${model}`);
    } else {
      failed++;
      log(`  ✗ fetch failed: ${make} ${model}`);
    }

    await sleep(200); // be gentle to Wikipedia
  }

  // Count final stats
  const total = await prisma.carModelSpec.count({ where: { published: true } });
  const local = await prisma.carModelSpec.count({ where: { published: true, imageUrl: { startsWith: "/images" } } });
  const external = await prisma.carModelSpec.count({ where: { published: true, imageUrl: { startsWith: "http" } } });
  const none = await prisma.carModelSpec.count({ where: { published: true, imageUrl: null } });
  const allFiles = await prisma.carModelSpec.findMany({
    where: { published: true, imageUrl: { startsWith: "/images" } },
    select: { imageUrl: true },
  });
  const files = new Set(allFiles.map(r => join(IMAGE_DIR, r.imageUrl.replace("/images/models/", ""))));
  const diskFiles = await (await import("fs/promises")).readdir(IMAGE_DIR).catch(() => []);

  log(`\n=== Done ===`);
  log(`Downloaded: ${downloaded}`);
  log(`Fetched new: ${fetched}`);
  log(`Skipped (already have): ${skipped}`);
  log(`Failed: ${failed}`);
  log(`\nTotal records: ${total}`);
  log(`Local files: ${local}`);
  log(`Wikipedia links: ${external}`);
  log(`No image: ${none}`);
  log(`Images on disk: ${diskFiles.length}`);
}

main().catch((e) => { console.error("FATAL:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
