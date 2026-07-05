#!/usr/bin/env node
/**
 * scripts/generate-watermark.mjs
 *
 * Builds the brand watermark PNG that gets composited onto every car
 * upload. Designed to be run ONCE locally (or in CI) on a machine with
 * a real font stack — the output is a static asset committed to the
 * repo so production never has to render text at runtime.
 *
 * The watermark is a bold brush-font "WELSH MOTORHUB" centered and
 * rotated, at very low opacity — like faint ink on paper.
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
const HEIGHT = 700;

function loadFontCss() {
  try {
    const latin = readFileSync(join(FONTS_DIR, "permanent-marker-400-normal.woff2"));
    return `
@font-face{font-family:'WmhWatermark';font-style:normal;font-weight:400;
src:url(data:font/woff2;charset=utf-8;base64,${latin.toString("base64")}) format('woff2');}`;
  } catch (err) {
    console.warn("[generate-watermark] Could not load Permanent Marker font, falling back to system:", err.message);
    return "";
  }
}

function buildSvg() {
  const fontCss = loadFontCss();
  const defs = fontCss ? `<defs><style type="text/css"><![CDATA[${fontCss}]]></style></defs>` : "";

  // Brush-edge filter — subtle noise displacement so the text edges
  // look like rough ink bleed instead of crisp vector type.
  const filter = `<filter id="brush">
    <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="3" result="noise" />
    <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" />
  </filter>`;

  // Centered, rotated, faint — like a traditional paper watermark.
  // Opacity is baked into the PNG so runtime just composites.
  // White ink at low opacity is naturally visible on dark areas
  // and fades into highlights — classic watermark behaviour.
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
      ${defs}
      <defs>${filter}</defs>
      <text
        x="50%" y="50%"
        text-anchor="middle"
        dominant-baseline="central"
        transform="rotate(-30, ${WIDTH / 2}, ${HEIGHT / 2})"
        font-family="WmhWatermark, 'Permanent Marker', 'Liberation Sans', 'DejaVu Sans', sans-serif"
        font-size="92"
        font-weight="400"
        fill="#ffffff"
        opacity="0.15"
        filter="url(#brush)"
      >BIDGARI KENYA</text>
    </svg>`
  );
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const svg = buildSvg();

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
