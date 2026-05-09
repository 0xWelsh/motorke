/**
 * Re-apply watermark for existing car listing images.
 *
 * Usage:
 *   node scripts/rewatermark-existing-images.js
 *   node scripts/rewatermark-existing-images.js --limit=200
 *   node scripts/rewatermark-existing-images.js --recent-cars=5
 *   node scripts/rewatermark-existing-images.js --dry-run
 *
 * This script fetches each current image, applies the latest watermark style
 * using the dealership name, and uploads it back to the same
 * storage path (upsert), so existing URLs remain unchanged.
 */

const { PrismaClient } = require("@prisma/client");
const { applyListingWatermark } = require("../src/lib/watermark");
const { uploadImage } = require("../src/lib/storage");

const prisma = new PrismaClient();

const PUBLIC_MARKER = "/storage/v1/object/public/car-images/";

function parseArgs() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const limitArg = args.find((arg) => arg.startsWith("--limit="));
  const limit = limitArg ? Number(limitArg.split("=")[1]) : null;
  const recentArg = args.find((arg) => arg.startsWith("--recent-cars="));
  const recentCars = recentArg ? Number(recentArg.split("=")[1]) : null;
  return {
    dryRun,
    limit: Number.isFinite(limit) ? limit : null,
    recentCars:
      Number.isFinite(recentCars) && recentCars > 0 ? Math.floor(recentCars) : null,
  };
}

function storagePathFromUrl(url) {
  if (!url || typeof url !== "string") return null;
  const idx = url.indexOf(PUBLIC_MARKER);
  if (idx === -1) return null;
  return url.slice(idx + PUBLIC_MARKER.length);
}

function inferMimeType(url, contentTypeHeader) {
  if (contentTypeHeader && contentTypeHeader.startsWith("image/")) return contentTypeHeader;
  const lower = String(url || "").toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

async function main() {
  const { dryRun, limit, recentCars } = parseArgs();
  console.log(`[rewatermark] starting ${dryRun ? "(dry-run)" : ""}`);

  let rows;

  if (recentCars != null) {
    const recent = await prisma.car.findMany({
      select: { id: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: recentCars,
    });
    const carIds = recent.map((c) => c.id);
    console.log(
      `[rewatermark] scope recent-cars=${recentCars} matched=${carIds.length} listings`
    );
    rows = await prisma.carImage.findMany({
      where: { carId: { in: carIds } },
      include: {
        car: {
          select: {
            year: true,
            make: true,
            model: true,
            dealer: { select: { name: true } },
          },
        },
      },
      orderBy: [{ carId: "asc" }, { order: "asc" }],
    });
  } else {
    rows = await prisma.carImage.findMany({
      include: {
        car: {
          select: {
            year: true,
            make: true,
            model: true,
            dealer: { select: { name: true } },
          },
        },
      },
      orderBy: { id: "asc" },
      ...(limit ? { take: limit } : {}),
    });
  }

  let scanned = 0;
  let updated = 0;
  let skipped = 0;
  let failed = 0;

  const progressEvery = 40;

  for (const row of rows) {
    scanned += 1;

    const storagePath = storagePathFromUrl(row.url);
    if (!storagePath) {
      skipped += 1;
      continue;
    }

    const watermarkText = row.car?.dealer?.name?.trim() || "WELSH MOTORS";

    try {
      const res = await fetch(row.url);
      if (!res.ok) {
        failed += 1;
        console.error(`[rewatermark] fetch failed (${res.status}) for image ${row.id}`);
        continue;
      }

      const arrayBuffer = await res.arrayBuffer();
      const inputBuffer = Buffer.from(arrayBuffer);
      const mimeType = inferMimeType(row.url, res.headers.get("content-type"));
      const outputBuffer = await applyListingWatermark(inputBuffer, mimeType, watermarkText);

      if (dryRun) {
        updated += 1;
        continue;
      }

      await uploadImage(outputBuffer, storagePath, mimeType);
      updated += 1;
    } catch (err) {
      failed += 1;
      console.error(`[rewatermark] failed image ${row.id}:`, err?.message || err);
    }

    if (scanned % progressEvery === 0) {
      console.log(
        `[rewatermark] progress scanned=${scanned}/${rows.length} updated=${updated} skipped=${skipped} failed=${failed}`
      );
    }
  }

  console.log(
    `[rewatermark] done scanned=${scanned} updated=${updated} skipped=${skipped} failed=${failed}${dryRun ? " (dry-run)" : ""}`
  );
}

main()
  .catch((err) => {
    console.error("[rewatermark] fatal:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

