// retry-downloads.mjs — retry downloading external Wikipedia images with rate limiting
import { PrismaClient } from "@prisma/client";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient({ datasources: { db: { url: process.env.DIRECT_URL } } });
const IMAGE_DIR = join(__dirname, "..", "public", "images", "models");

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").substring(0, 80);
}

async function downloadImage(url, filepath, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36" },
        signal: AbortSignal.timeout(20000),
      });
      if (res.status === 429) {
        const wait = Math.pow(2, i) * 2000;
        log(`  429 — waiting ${wait}ms`);
        await sleep(wait);
        continue;
      }
      if (!res.ok) return false;
      const ct = res.headers.get("content-type") || "";
      if (!ct.startsWith("image/")) return false;
      const buffer = Buffer.from(await res.arrayBuffer());
      mkdirSync(dirname(filepath), { recursive: true });
      writeFileSync(filepath, buffer);
      return true;
    } catch (e) {
      if (i === retries - 1) return false;
      await sleep(1000);
    }
  }
  return false;
}

async function main() {
  log("=== Retry downloads ===");
  mkdirSync(IMAGE_DIR, { recursive: true });

  const specs = await prisma.carModelSpec.findMany({
    where: { published: true, imageUrl: { startsWith: "http" } },
    orderBy: [{ make: "asc" }, { model: "asc" }],
  });

  log(`Records with external URLs: ${specs.length}`);

  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const spec of specs) {
    const filename = `${slugify(spec.make)}-${slugify(spec.model)}-${spec.yearStart}.jpg`;
    const filepath = join(IMAGE_DIR, filename);
    const localUrl = `/images/models/${filename}`;

    if (existsSync(filepath)) {
      // File exists but DB still points to external — fix it
      await prisma.carModelSpec.update({ where: { id: spec.id }, data: { imageUrl: localUrl } });
      skipped++;
      continue;
    }

    const ok = await downloadImage(spec.imageUrl, filepath);
    if (ok) {
      await prisma.carModelSpec.update({ where: { id: spec.id }, data: { imageUrl: localUrl } });
      downloaded++;
      log(`  ✓ ${spec.make} ${spec.model}`);
    } else {
      failed++;
      log(`  ✗ ${spec.make} ${spec.model}`);
    }

    // Rate limit: 1.5s between requests to avoid 429
    await sleep(1500);
  }

  log(`\nDone: ${downloaded} downloaded, ${skipped} fixed, ${failed} failed`);
}

main().catch(e => { console.error("FATAL:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
