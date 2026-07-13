/**
 * lib/watermark.js
 * Server-side watermark applied via Sharp on every car image upload.
 *
 * Architecture:
 *   We composite a pre-rendered PNG (public/watermark/brand-watermark.png)
 *   onto each photo. The PNG is generated locally by
 *   `scripts/generate-watermark.mjs` and committed to the repo. Runtime
 *   never renders text, so we cannot get tofu (□) boxes from missing
 *   fonts on Vercel cold starts — the only failure mode left is "PNG
 *   asset missing," which trips during build, not in production.
 *
 *   The watermark is the brand logo (green "GARI" in "BIDGARI"),
 *   horizontal, at moderate opacity, composited at the image centre.
 *
 * Controlled via env:
 *   LISTING_WATERMARK_ENABLED=false  → skip watermarking (default: enabled)
 */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const WATERMARK_ENABLED = process.env.LISTING_WATERMARK_ENABLED !== "false";

// Watermark width as a fraction of the source image width. Centre
// watermarks should be larger than corner logos to remain visible
// across the full image area.
const WATERMARK_WIDTH_RATIO = 0.55;
const MIN_WATERMARK_WIDTH = 200;
const MAX_WATERMARK_WIDTH = 800;

/** Cache the watermark PNG buffer once per server lifecycle. */
let cachedBrandWatermark = undefined;

function loadBrandWatermark() {
  if (cachedBrandWatermark !== undefined) return cachedBrandWatermark;
  const path = join(process.cwd(), "public", "watermark", "brand-watermark.png");
  if (!existsSync(path)) {
    console.warn(`[watermark] Asset missing at ${path}. Run 'node scripts/generate-watermark.mjs' to (re)generate it. Skipping watermark.`);
    cachedBrandWatermark = null;
    return null;
  }
  try {
    cachedBrandWatermark = readFileSync(path);
  } catch (err) {
    console.warn("[watermark] Could not read brand watermark PNG:", err?.message || err);
    cachedBrandWatermark = null;
  }
  return cachedBrandWatermark;
}

function clamp(value, min, max) {
  if (Number.isNaN(value)) return min;
  return Math.max(min, Math.min(max, value));
}

/**
 * Main export — apply the brand watermark to the incoming image buffer.
 *
 * @param {Buffer} buffer    Raw image bytes.
 * @param {string} mimeType  e.g. "image/jpeg" | "image/png" | "image/webp".
 * @returns {Promise<Buffer>}  Watermarked image buffer in the same format.
 */
export async function applyListingWatermark(buffer, mimeType /* customText ignored */) {
  if (!WATERMARK_ENABLED) return buffer;

  const brand = loadBrandWatermark();
  if (!brand) return buffer;

  const image = sharp(buffer, { failOn: "none" });
  const meta = await image.metadata();
  const width = meta.width || 0;
  const height = meta.height || 0;
  if (!width || !height) return buffer;

  // Compute watermark dimensions relative to the source photo.
  const targetWidth = Math.round(
    clamp(width * WATERMARK_WIDTH_RATIO, MIN_WATERMARK_WIDTH, MAX_WATERMARK_WIDTH)
  );

  // Resize the watermark PNG (opacity is already baked into the asset).
  let overlay;
  let overlayWidth = 0;
  let overlayHeight = 0;
  try {
    overlay = await sharp(brand)
      .resize({ width: targetWidth, withoutEnlargement: true })
      .png()
      .toBuffer();
    const overlayMeta = await sharp(overlay).metadata();
    overlayWidth = overlayMeta.width || targetWidth;
    overlayHeight = overlayMeta.height || 0;
  } catch (err) {
    console.warn("[watermark] Could not prepare overlay, returning original:", err?.message || err);
    return buffer;
  }

  // Centre the watermark on the image.
  const left = Math.max(0, Math.round((width - overlayWidth) / 2));
  const top = Math.max(0, Math.round((height - overlayHeight) / 2));

  let composited;
  try {
    composited = image.composite([
      {
        input: overlay,
        left,
        top,
      },
    ]);
  } catch (err) {
    console.warn("[watermark] Composite failed, returning original:", err?.message || err);
    return buffer;
  }

  try {
    if (mimeType === "image/png") {
      return await composited.png({ compressionLevel: 9 }).toBuffer();
    }
    if (mimeType === "image/webp") {
      return await composited.webp({ quality: 90 }).toBuffer();
    }
    return await composited.jpeg({ quality: 75, mozjpeg: true }).toBuffer();
  } catch (err) {
    console.warn("[watermark] Encode failed, returning original:", err?.message || err);
    return buffer;
  }
}
