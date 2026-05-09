/**
 * Re-apply watermark for existing car listing images.
 *
 * Usage:
 *   node scripts/rewatermark-existing-images.js
 *   node scripts/rewatermark-existing-images.js --limit=200
 *   node scripts/rewatermark-existing-images.js --car-id=cmabc123...
 *   node scripts/rewatermark-existing-images.js --from-date=2026-05-01
 *   node scripts/rewatermark-existing-images.js --recent-cars=5
 *   node scripts/rewatermark-existing-images.js --dry-run
 *   node scripts/rewatermark-existing-images.js --retries=3
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
const DEFAULT_RETRIES = 2;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseIsoDateMaybe(raw) {
  if (!raw) return null;
  const dt = new Date(raw);
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
}

function isRetriableError(err) {
  const msg = String(err?.message || "").toLowerCase();
  return (
    msg.includes("timeout") ||
    msg.includes("timed out") ||
    msg.includes("econnreset") ||
    msg.includes("enotfound") ||
    msg.includes("fetch failed") ||
    msg.includes("network") ||
    msg.includes("429") ||
    msg.includes("502") ||
    msg.includes("503") ||
    msg.includes("504")
  );
}

async function withRetry(task, retries, label) {
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await task();
    } catch (err) {
      const finalAttempt = attempt >= retries;
      if (finalAttempt || !isRetriableError(err)) throw err;
      const backoff = 400 * 2 ** attempt;
      console.warn(
        `[rewatermark] retrying ${label} attempt=${attempt + 1}/${retries + 1} in ${backoff}ms: ${err?.message || err}`
      );
      await sleep(backoff);
    }
  }
  throw new Error(`Unexpected retry termination for ${label}`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const limitArg = args.find((arg) => arg.startsWith("--limit="));
  const limit = limitArg ? Number(limitArg.split("=")[1]) : null;
  const recentArg = args.find((arg) => arg.startsWith("--recent-cars="));
  const recentCars = recentArg ? Number(recentArg.split("=")[1]) : null;
  const retriesArg = args.find((arg) => arg.startsWith("--retries="));
  const retriesRaw = retriesArg ? Number(retriesArg.split("=")[1]) : DEFAULT_RETRIES;
  const retries = Number.isFinite(retriesRaw) && retriesRaw >= 0 ? Math.floor(retriesRaw) : DEFAULT_RETRIES;
  const carIdArg = args.find((arg) => arg.startsWith("--car-id="));
  const carId = carIdArg ? carIdArg.split("=")[1]?.trim() || null : null;
  const fromDateArg = args.find((arg) => arg.startsWith("--from-date="));
  const fromDateRaw = fromDateArg ? fromDateArg.split("=")[1]?.trim() : null;
  const fromDate = parseIsoDateMaybe(fromDateRaw);
  if (fromDateRaw && !fromDate) {
    throw new Error(`Invalid --from-date value "${fromDateRaw}". Use ISO format, e.g. 2026-05-01 or 2026-05-01T00:00:00Z`);
  }
  return {
    dryRun,
    limit: Number.isFinite(limit) ? limit : null,
    recentCars:
      Number.isFinite(recentCars) && recentCars > 0 ? Math.floor(recentCars) : null,
    retries,
    carId,
    fromDate,
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
  const { dryRun, limit, recentCars, retries, carId, fromDate } = parseArgs();
  console.log(
    `[rewatermark] starting ${dryRun ? "(dry-run)" : ""} retries=${retries} ${carId ? `car-id=${carId}` : ""} ${fromDate ? `from-date=${fromDate.toISOString()}` : ""}`
  );

  let rows;

  if (carId) {
    rows = await prisma.carImage.findMany({
      where: { carId },
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
      orderBy: [{ order: "asc" }, { id: "asc" }],
      ...(limit ? { take: limit } : {}),
    });
    console.log(`[rewatermark] scope car-id=${carId} images=${rows.length}`);
  } else if (recentCars != null) {
    const recent = await prisma.car.findMany({
      select: { id: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: recentCars,
      ...(fromDate ? { where: { createdAt: { gte: fromDate } } } : {}),
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
      ...(limit ? { take: limit } : {}),
    });
  } else {
    rows = await prisma.carImage.findMany({
      where: {
        ...(fromDate ? { car: { createdAt: { gte: fromDate } } } : {}),
      },
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
      const res = await withRetry(
        () => fetch(row.url),
        retries,
        `fetch image=${row.id}`
      );
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

      await withRetry(
        () => uploadImage(outputBuffer, storagePath, mimeType),
        retries,
        `upload image=${row.id}`
      );
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

