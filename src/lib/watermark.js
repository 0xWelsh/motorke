/**
 * lib/watermark.js
 * Server-side watermark applied via Sharp on every car image upload.
 *
 * Design:
 *  - Bottom bar: semi-transparent dark strip with "MOTORKE • motorke.co.ke"
 *  - Corner bug: small brand text bottom-right with white/black outline (fallback visibility on any bg)
 *  - Diagonal tiled ghost text: light repeat across whole image to deter scraping
 *
 * Controlled via env:
 *   LISTING_WATERMARK_ENABLED=false  → skip watermarking (default: enabled)
 *   LISTING_WATERMARK_TEXT           → override brand text (default: "MOTORKE")
 *   LISTING_WATERMARK_URL            → override URL text (default: "motorke.co.ke")
 */

import sharp from "sharp";

const WATERMARK_ENABLED = process.env.LISTING_WATERMARK_ENABLED !== "false";
const BRAND             = process.env.LISTING_WATERMARK_TEXT || "MOTORKE";
const BRAND_URL         = process.env.LISTING_WATERMARK_URL  || "motorke.co.ke";

function escapeXml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Bottom bar: dark strip with brand + URL
 */
function buildBarSvg(width, height) {
  const barH    = Math.max(28, Math.round(height * 0.062));
  const fontSize = Math.max(11, Math.round(barH * 0.44));
  const pad     = Math.max(10, Math.round(width * 0.02));
  const y       = height - barH;
  const textY   = y + barH * 0.64;

  const label   = escapeXml(BRAND);
  const url     = escapeXml(BRAND_URL);

  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <!-- Dark bar -->
      <rect x="0" y="${y}" width="${width}" height="${barH}" fill="rgba(0,0,0,0.52)" />
      <!-- Brand text left -->
      <text x="${pad}" y="${textY}"
        font-family="Arial, Helvetica, sans-serif"
        font-size="${fontSize}"
        font-weight="800"
        letter-spacing="2"
        fill="rgba(255,255,255,0.92)"
      >${label}</text>
      <!-- Separator dot -->
      <text x="${pad + (label.length * fontSize * 0.65)}" y="${textY}"
        font-family="Arial, Helvetica, sans-serif"
        font-size="${fontSize}"
        fill="rgba(255,90,47,0.9)"
      > • </text>
      <!-- URL text -->
      <text x="${pad + (label.length * fontSize * 0.65) + fontSize * 1.8}" y="${textY}"
        font-family="Arial, Helvetica, sans-serif"
        font-size="${Math.round(fontSize * 0.85)}"
        font-weight="600"
        fill="rgba(255,255,255,0.7)"
      >${url}</text>
    </svg>`
  );
}

/**
 * Diagonal ghost tiling: deters crop-and-repost
 * Renders evenly-spaced rotated "MOTORKE" labels at low opacity.
 */
function buildGhostSvg(width, height) {
  const step     = Math.round(Math.max(width, height) * 0.28);
  const fontSize = Math.max(13, Math.round(step * 0.11));
  const text     = escapeXml(BRAND);
  const labels   = [];

  for (let y = -step; y < height + step; y += step) {
    for (let x = -step; x < width + step; x += step) {
      labels.push(
        `<text x="${x}" y="${y}"
          transform="rotate(-32, ${x}, ${y})"
          font-family="Arial, Helvetica, sans-serif"
          font-size="${fontSize}"
          font-weight="700"
          letter-spacing="2"
          fill="rgba(255,255,255,0.10)"
        >${text}</text>`
      );
    }
  }

  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      ${labels.join("\n")}
    </svg>`
  );
}

/**
 * Main export — apply all watermark layers to the incoming image buffer.
 */
export async function applyListingWatermark(buffer, mimeType) {
  if (!WATERMARK_ENABLED) return buffer;

  const image = sharp(buffer, { failOn: "none" });
  const meta  = await image.metadata();
  const width  = meta.width  || 0;
  const height = meta.height || 0;

  if (!width || !height) return buffer;

  const bar   = buildBarSvg(width, height);
  const ghost = buildGhostSvg(width, height);

  const composited = image.composite([
    { input: ghost, left: 0, top: 0 },   // ghost tile first (under bar)
    { input: bar,   left: 0, top: 0 },   // bar on top
  ]);

  if (mimeType === "image/png") {
    return composited.png({ compressionLevel: 9 }).toBuffer();
  }
  if (mimeType === "image/webp") {
    return composited.webp({ quality: 90 }).toBuffer();
  }
  return composited.jpeg({ quality: 88, mozjpeg: true }).toBuffer();
}
