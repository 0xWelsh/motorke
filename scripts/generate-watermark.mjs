#!/usr/bin/env node
/**
 * scripts/generate-watermark.mjs
 *
 * Builds the brand watermark PNG that gets composited onto every car
 * upload. Designed to be run ONCE locally (or in CI) on a machine with
 * a real font stack — the output is a static asset committed to the
 * repo so production never has to render text from SVG at runtime.
 *
 * Why this exists:
 *   The previous approach rendered an SVG <text> element with a base64
 *   @font-face on every upload. librsvg on Linux silently ignores
 *   inline @font-face data URIs, so on Vercel the font fell back to
 *   whatever DejaVu/Liberation was on the cold-start container — and
 *   when those were missing, glyphs rendered as tofu boxes (□).
 *
 * Now: this script renders the SVG locally (where fonts work), exports
 * a transparent PNG, and runtime watermark.js just composites that
 * PNG onto each upload. Zero font dependency in production.
 *
 * Run: node scripts/generate-watermark.mjs
 */

import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const FONTS_DIR = join(ROOT, "fonts", "watermark");
const OUT_DIR = join(ROOT, "public", "watermark");
const OUT_FILE = join(OUT_DIR, "brand-watermark.png");

const WIDTH = 1200;
const HEIGHT = 160;

function loadFontCss() {
  try {
    const latin = readFileSync(join(FONTS_DIR, "inter-latin-700-normal.woff"));
    const latinExt = readFileSync(join(FONTS_DIR, "inter-latin-ext-700-normal.woff"));
    return `
@font-face{font-family:'WmhWatermark';font-style:normal;font-weight:700;
src:url(data:font/woff;charset=utf-8;base64,${latin.toString("base64")}) format('woff');}
@font-face{font-family:'WmhWatermark';font-style:normal;font-weight:700;
src:url(data:font/woff;charset=utf-8;base64,${latinExt.toString("base64")}) format('woff');}`;
  } catch (err) {
    console.warn("[generate-watermark] Could not load Inter fonts, falling back to system sans:", err.message);
    return "";
  }
}

function buildSvg() {
  const fontCss = loadFontCss();
  const defs = fontCss ? `<defs><style type="text/css"><![CDATA[${fontCss}]]></style></defs>` : "";

  // Two-tone wordmark: heavy weight WELSH MOTORHUB + lighter .co.ke,
  // with a small green dot as a brand mark. White with a soft drop
  // shadow so it's legible on both light and dark photo backgrounds.
  const filter = `<filter id="wmShadow" x="-20%" y="-20%" width="140%" height="140%">
    <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000" flood-opacity="0.55" />
  </filter>`;

  // We bake the final ~85% opacity directly into the PNG so the runtime
  // can just composite without doing alpha math. The drop shadow keeps
  // the wordmark legible on light photos even at sub-100% opacity.
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
      ${defs}
      <defs>${filter}</defs>
      <g filter="url(#wmShadow)" font-family="WmhWatermark, 'Liberation Sans', 'DejaVu Sans', sans-serif" font-weight="700" opacity="0.85">
        <circle cx="60" cy="${HEIGHT / 2}" r="14" fill="#38A169" />
        <text x="98" y="${HEIGHT / 2 + 26}" font-size="76" letter-spacing="6" fill="#ffffff">WELSH MOTORHUB</text>
        <text x="1010" y="${HEIGHT / 2 + 22}" font-size="40" letter-spacing="2" fill="#ffffff" opacity="0.85">.co.ke</text>
      </g>
    </svg>`
  );
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const svg = buildSvg();

  // Render SVG → trimmed transparent PNG.
  const png = await sharp(svg, { density: 200 })
    .png({ compressionLevel: 9 })
    .trim()
    .toBuffer();

  writeFileSync(OUT_FILE, png);
  const meta = await sharp(OUT_FILE).metadata();
  console.log(`Wrote ${OUT_FILE}  ${meta.width}×${meta.height}  ${png.length} bytes`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
