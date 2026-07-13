#!/usr/bin/env node

import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const LOGO_PATH = join(ROOT, "public", "images", "bidgari-logo.png");
const OUT_DIR = join(ROOT, "public", "watermark");
const OUT_FILE = join(OUT_DIR, "brand-watermark.png");

const TARGET_WIDTH = 500;
const OPACITY = 0.50;
const ROTATION = 0;

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  const logo = sharp(LOGO_PATH);
  const { width, height } = await logo.metadata();

  const resized = await logo.resize({ width: TARGET_WIDTH, withoutEnlargement: true }).png().toBuffer();
  const { width: w, height: h } = await sharp(resized).metadata();

  const original = await sharp(resized).raw().toBuffer();

  const rgba = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    rgba[i * 4] = original[i * 4];
    rgba[i * 4 + 1] = original[i * 4 + 1];
    rgba[i * 4 + 2] = original[i * 4 + 2];
    rgba[i * 4 + 3] = Math.round(original[i * 4 + 3] * OPACITY);
  }

  const png = await sharp(rgba, { raw: { width: w, height: h, channels: 4 } })
    .rotate(ROTATION, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toBuffer();

  writeFileSync(OUT_FILE, png);
  const meta = await sharp(OUT_FILE).metadata();
  console.log(`Wrote ${OUT_FILE}  ${meta.width}×${meta.height}  ${png.length} bytes`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
