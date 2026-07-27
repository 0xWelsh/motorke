#!/usr/bin/env node
/**
 * BIDGARI Promo Screenshot Automation
 *
 * Captures pages from the live site and composites promotional overlays.
 * Output: PNG files in scripts/promo-output/
 *
 * Usage:
 *   node scripts/promo-screenshots.mjs                    # all presets
 *   node scripts/promo-screenshots.mjs --preset feed      # just feed posts
 *   node scripts/promo-screenshots.mjs --url http://...   # custom base URL
 *   node scripts/promo-screenshots.mjs --local             # use localhost:3000
 */

import { chromium } from "playwright";
import sharp from "sharp";
import { mkdir, writeFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, "promo-output");

const BRAND = {
  green: "#22C55E",
  greenDark: "#16A34A",
  bg: "#141414",
  surface: "#1c1c1c",
  white: "#ffffff",
  textMuted: "#a1a1aa",
};

const PRESETS = {
  feed: { width: 1080, height: 1080, label: "Feed (1080x1080)" },
  story: { width: 1080, height: 1920, label: "Story (1080x1920)" },
  banner: { width: 1200, height: 630, label: "Banner (1200x630)" },
  twitter: { width: 1600, height: 900, label: "Twitter (1600x900)" },
};

const PAGES = [
  {
    name: "homepage",
    path: "/",
    headline: "Find Your Next Car",
    subline: "Direct to dealer. No middlemen.",
    cta: "Browse Cars",
  },
  {
    name: "search",
    path: "/cars",
    headline: "1000+ Cars Listed",
    subline: "Filter by make, model, price & location.",
    cta: "Start Searching",
  },
  {
    name: "car-detail",
    path: null,
    headline: "See Full Details",
    subline: "Photos, specs, pricing & dealer contact.",
    cta: "View Car",
    needsCarLink: true,
  },
  {
    name: "dealers",
    path: "/dealers",
    headline: "Trusted Dealers",
    subline: "Verified sellers across Kenya.",
    cta: "Find a Dealer",
  },
  {
    name: "sell",
    path: "/sell",
    headline: "Sell Your Car Free",
    subline: "List in minutes. Reach thousands.",
    cta: "List Now",
  },
];

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { preset: null, url: "https://motorke.vercel.app" };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--preset" && args[i + 1]) opts.preset = args[++i];
    if (args[i] === "--url" && args[i + 1]) opts.url = args[++i];
    if (args[i] === "--local") opts.url = "http://localhost:3000";
  }
  return opts;
}

function escapeXml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function overlaySVG(preset, page) {
  const isStory = preset.height > 1400;
  const isWide = preset.width > 1200;

  const fontSize = isStory ? 72 : isWide ? 56 : 48;
  const subSize = isStory ? 28 : isWide ? 22 : 20;
  const ctaSize = isStory ? 22 : 18;
  const padding = isStory ? 80 : 48;

  const textY = isStory ? preset.height * 0.12 : preset.height - 200;
  const subY = textY + fontSize + 16;
  const ctaY = subY + subSize + 32;
  const ctaWidth = page.cta.length * ctaSize * 0.7 + 48;
  const bottomY = preset.height - padding;

  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${preset.width}" height="${preset.height}" viewBox="0 0 ${preset.width} ${preset.height}">
  <defs>
    <linearGradient id="dim" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="black" stop-opacity="0"/>
      <stop offset="50%" stop-color="black" stop-opacity="0.05"/>
      <stop offset="100%" stop-color="black" stop-opacity="0.85"/>
    </linearGradient>
    <linearGradient id="greenGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${BRAND.green}"/>
      <stop offset="100%" stop-color="${BRAND.greenDark}"/>
    </linearGradient>
  </defs>

  <rect width="${preset.width}" height="${preset.height}" fill="url(#dim)"/>

  <text x="${padding}" y="${textY}" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="${fontSize}" fill="white">${escapeXml(page.headline)}</text>
  <text x="${padding}" y="${subY}" font-family="system-ui, -apple-system, sans-serif" font-weight="500" font-size="${subSize}" fill="${BRAND.textMuted}">${escapeXml(page.subline)}</text>

  <rect x="${padding}" y="${ctaY - ctaSize}" width="${ctaWidth}" height="${ctaSize + 24}" rx="${ctaSize}" fill="url(#greenGrad)"/>
  <text x="${padding + 24}" y="${ctaY + 2}" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="${ctaSize}" fill="white" letter-spacing="0.5">${escapeXml(page.cta)}</text>

  <text x="${preset.width - padding}" y="${bottomY}" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="16" fill="${BRAND.green}" text-anchor="end" letter-spacing="3" opacity="0.8">BIDGARI</text>
  <rect x="${padding}" y="${bottomY + 12}" width="60" height="3" rx="1.5" fill="${BRAND.green}"/>
</svg>`);
}

async function main() {
  const opts = parseArgs();
  const activePresets = opts.preset ? { [opts.preset]: PRESETS[opts.preset] } : PRESETS;

  if (opts.preset && !PRESETS[opts.preset]) {
    console.error(`Unknown preset: ${opts.preset}. Available: ${Object.keys(PRESETS).join(", ")}`);
    process.exit(1);
  }

  await mkdir(OUTPUT_DIR, { recursive: true });

  console.log(`\n  BIDGARI Promo Screenshots`);
  console.log(`  Target: ${opts.url}`);
  console.log(`  Presets: ${Object.keys(activePresets).join(", ")}\n`);

  const browser = await chromium.launch({ headless: true });

  for (const [presetKey, preset] of Object.entries(activePresets)) {
    const context = await browser.newContext({
      viewport: { width: preset.width, height: preset.height },
      deviceScaleFactor: 1,
    });
    const tab = await context.newPage();

    // Find a car link once for the car-detail page
    let carPath = null;

    for (const page of PAGES) {
      console.log(`  -> ${page.name} [${preset.label}]`);

      try {
        let targetUrl;
        if (page.needsCarLink) {
          if (!carPath) {
            await tab.goto(`${opts.url}/cars`, { waitUntil: "networkidle", timeout: 30000 });
            await tab.waitForTimeout(2000);
            carPath = await tab.evaluate(() => {
              const link = document.querySelector('a[href^="/cars/"]');
              return link ? link.getAttribute("href") : null;
            });
            if (!carPath) {
              console.log(`     SKIP: no car links found`);
              continue;
            }
          }
          targetUrl = `${opts.url}${carPath}`;
        } else {
          targetUrl = `${opts.url}${page.path}`;
        }

        await tab.goto(targetUrl, { waitUntil: "networkidle", timeout: 30000 });
        await tab.waitForTimeout(2000);

        const screenshotBuffer = await tab.screenshot({ type: "png" });

        const svgOverlay = overlaySVG(preset, page);

        const composited = await sharp(screenshotBuffer)
          .resize(preset.width, preset.height, { fit: "cover" })
          .composite([{ input: svgOverlay, top: 0, left: 0 }])
          .png()
          .toBuffer();

        const filename = `bidgari-${page.name}-${presetKey}.png`;
        await writeFile(join(OUTPUT_DIR, filename), composited);
        console.log(`     saved: ${filename}`);
      } catch (err) {
        console.error(`     FAILED: ${err.message}`);
      }
    }

    await context.close();
  }

  await browser.close();
  console.log(`\n  Done! Files in ${OUTPUT_DIR}\n`);
}

main().catch(console.error);
