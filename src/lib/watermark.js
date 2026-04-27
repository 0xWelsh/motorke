/**
 * lib/watermark.js
 * Server-side watermark applied via Sharp on every car image upload.
 *
 * Design:
 *  - Bottom bar: semi-transparent dark strip with centered watermark text.
 *  - Text defaults to brand name, but upload handlers can pass the car title.
 *
 * Controlled via env:
 *   LISTING_WATERMARK_ENABLED=false  → skip watermarking (default: enabled)
 *   LISTING_WATERMARK_TEXT           → override default text (default: "WELSH MOTORS")
 */

import sharp from "sharp";

const WATERMARK_ENABLED = process.env.LISTING_WATERMARK_ENABLED !== "false";
const BRAND             = process.env.LISTING_WATERMARK_TEXT || "WELSH MOTORS";

function escapeXml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Bottom bar: dark strip with centered text.
 */
function buildBarSvg(width, height, customText = null) {
  const barH    = Math.max(28, Math.round(height * 0.062));
  const fontSize = Math.max(11, Math.round(barH * 0.42));
  const y       = height - barH;
  const textY   = y + barH * 0.64;

  const label   = escapeXml(customText || BRAND);

  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect x="0" y="${y}" width="${width}" height="${barH}" fill="rgba(0,0,0,0.52)" />
      <text x="${width / 2}" y="${textY}"
        font-family="Arial, Helvetica, sans-serif"
        font-size="${fontSize}"
        font-weight="800"
        letter-spacing="1.2"
        text-anchor="middle"
        fill="rgba(255,255,255,0.92)"
      >${label}</text>
    </svg>`
  );
}

/**
 * Main export — apply all watermark layers to the incoming image buffer.
 */
export async function applyListingWatermark(buffer, mimeType, customText = null) {
  if (!WATERMARK_ENABLED) return buffer;

  const image = sharp(buffer, { failOn: "none" });
  const meta  = await image.metadata();
  const width  = meta.width  || 0;
  const height = meta.height || 0;

  if (!width || !height) return buffer;

  const bar = buildBarSvg(width, height, customText);

  const composited = image.composite([{ input: bar, left: 0, top: 0 }]);

  if (mimeType === "image/png") {
    return composited.png({ compressionLevel: 9 }).toBuffer();
  }
  if (mimeType === "image/webp") {
    return composited.webp({ quality: 90 }).toBuffer();
  }
  return composited.jpeg({ quality: 88, mozjpeg: true }).toBuffer();
}
