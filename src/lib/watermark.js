/**
 * lib/watermark.js
 * Server-side watermark applied via Sharp on every car image upload.
 *
 * Design:
 *  - Bottom bar: semi-transparent dark strip with centered watermark text.
 *  - Text defaults to brand name, but upload handlers can pass the car title.
 *
 * Fonts: SVG embeds Inter (latin + latin-ext WOFF from /fonts/watermark) so librsvg
 *  renders glyphs on Linux/serverless where Arial is missing (otherwise → □).
 *  Bundled files ship with the repo so Next/Vercel tracing never omits them.
 *
 * Controlled via env:
 *   LISTING_WATERMARK_ENABLED=false  → skip watermarking (default: enabled)
 *   LISTING_WATERMARK_TEXT           → override default text (default: "WELSH MOTORS")
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const WATERMARK_ENABLED = process.env.LISTING_WATERMARK_ENABLED !== "false";
const BRAND             = process.env.LISTING_WATERMARK_TEXT || "WELSH MOTORS";

/** Cached @font-face rules for SVG (empty string if files unavailable). */
let embeddedInterCss = null;

function getEmbeddedInterCss() {
  if (embeddedInterCss !== null) return embeddedInterCss;
  try {
    const dir = join(process.cwd(), "fonts", "watermark");
    const latin = readFileSync(join(dir, "inter-latin-700-normal.woff"));
    const latinExt = readFileSync(join(dir, "inter-latin-ext-700-normal.woff"));
    const a = latin.toString("base64");
    const b = latinExt.toString("base64");
    embeddedInterCss = `
@font-face{font-family:'MotorkeWatermark';font-style:normal;font-weight:700;
src:url(data:font/woff;charset=utf-8;base64,${a}) format('woff');}
@font-face{font-family:'MotorkeWatermark';font-style:normal;font-weight:700;
src:url(data:font/woff;charset=utf-8;base64,${b}) format('woff');}`;
  } catch (err) {
    console.warn("[watermark] Could not load embedded Inter fonts:", err?.message || err);
    embeddedInterCss = "";
  }
  return embeddedInterCss;
}

function escapeXml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Normalize label for SVG text (length cap, strip broken surrogates). */
function normalizeWatermarkLabel(raw) {
  let s = String(raw ?? "")
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim();
  if (!s) return BRAND;
  s = s.replace(/\uFFFD/g, "");
  return s.slice(0, 96);
}

/**
 * Bottom bar: dark strip with centered text.
 */
function buildBarSvg(width, height, customText = null) {
  const barH     = Math.max(28, Math.round(height * 0.062));
  const fontSize = Math.max(11, Math.round(barH * 0.42));
  const y        = height - barH;
  const textY    = y + barH * 0.64;

  const label = escapeXml(normalizeWatermarkLabel(customText || BRAND));

  const fontCss = getEmbeddedInterCss();
  const defs = fontCss
    ? `<defs><style type="text/css"><![CDATA[${fontCss}]]></style></defs>`
    : "";

  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      ${defs}
      <rect x="0" y="${y}" width="${width}" height="${barH}" fill="rgba(0,0,0,0.52)" />
      <text x="${width / 2}" y="${textY}"
        font-family="MotorkeWatermark, DejaVu Sans, Liberation Sans, Helvetica Neue, Helvetica, Arial, sans-serif"
        font-size="${fontSize}"
        font-weight="700"
        letter-spacing="0.04em"
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
