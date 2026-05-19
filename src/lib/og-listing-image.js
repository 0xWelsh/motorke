/**
 * Build consistent WhatsApp / Facebook link-preview images for car listings.
 * Crawlers are picky: prefer same-origin JPEG ~1200×630, no redirects, < ~600KB.
 */

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { BRAND_MARK_SQUARE, BRAND_OG_IMAGE } from "@/lib/site-url";
import {
  extractCarImageStoragePath,
  normalizeListingHeroImageUrl,
} from "@/lib/listing-image-url";

const BUCKET = "car-images";
const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const MAX_OG_BYTES = 600 * 1024;
const FETCH_TIMEOUT_MS = 12_000;

function supabaseConfig() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!raw || !serviceKey) return null;
  try {
    const base = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    const origin = new URL(base).origin;
    return { origin, serviceKey };
  } catch {
    return null;
  }
}

async function fetchWithTimeout(url, init = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal, redirect: "follow" });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * @param {string} url
 * @returns {Promise<Buffer|null>}
 */
async function fetchPublicImageBytes(url) {
  try {
    const res = await fetchWithTimeout(url, { headers: { Accept: "image/*" } });
    if (!res.ok) return null;
    const ct = (res.headers.get("content-type") || "").toLowerCase();
    if (ct && !ct.startsWith("image/") && ct !== "application/octet-stream") return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return buf.length > 0 ? buf : null;
  } catch {
    return null;
  }
}

/**
 * Service-role object download (works when public URL 404s or bucket was private).
 * @param {string} storagePath e.g. cars/{carId}/file.jpg
 */
async function fetchStorageObjectBytes(storagePath) {
  const cfg = supabaseConfig();
  if (!cfg || !storagePath || !/^cars\/[a-z0-9_-]+\/.+/i.test(storagePath)) return null;
  const objectUrl = `${cfg.origin}/storage/v1/object/${BUCKET}/${storagePath}`;
  try {
    const res = await fetchWithTimeout(objectUrl, {
      headers: { Authorization: `Bearer ${cfg.serviceKey}`, Accept: "image/*" },
    });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return buf.length > 0 ? buf : null;
  } catch {
    return null;
  }
}

/**
 * @param {string|null|undefined} rawUrl
 * @returns {Promise<Buffer|null>}
 */
export async function fetchListingImageBytes(rawUrl) {
  const normalized = normalizeListingHeroImageUrl(rawUrl);
  if (!normalized || !/^https?:\/\//i.test(normalized)) return null;

  const cfg = supabaseConfig();
  const path = extractCarImageStoragePath(normalized);

  if (cfg) {
    try {
      if (new URL(normalized).origin === cfg.origin) {
        const publicBuf = await fetchPublicImageBytes(normalized);
        if (publicBuf) return publicBuf;
      }
    } catch {
      // ignore bad URL
    }
  }

  if (path) {
    return fetchStorageObjectBytes(path);
  }

  return null;
}

function escapeXml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function truncate(value = "", max = 48) {
  const s = String(value).trim();
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

/**
 * @param {string|null|undefined} logoUrl
 * @returns {Promise<Buffer|null>}
 */
export async function fetchDealerLogoBytes(logoUrl) {
  if (!logoUrl?.trim()) return null;
  return fetchPublicImageBytes(logoUrl.trim());
}

/**
 * @param {{ dealerName?: string, titleLine?: string, priceLine?: string, locationLine?: string, hasLogo?: boolean }} opts
 */
function buildBrandingOverlaySvg(opts) {
  const dealerName = escapeXml(truncate(opts.dealerName || "Verified dealer", 42));
  const titleLine = escapeXml(truncate(opts.titleLine || "", 52));
  const priceLine = escapeXml(truncate(opts.priceLine || "", 28));
  const locationLine = escapeXml(truncate(opts.locationLine || "", 36));
  const textX = opts.hasLogo ? 168 : 48;
  const titleY = locationLine ? 548 : 558;
  const priceY = locationLine ? 586 : 596;

  return Buffer.from(`<svg width="${OG_WIDTH}" height="${OG_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bar" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="rgba(8,12,20,0)"/>
      <stop offset="42%" stop-color="rgba(8,12,20,0.35)"/>
      <stop offset="100%" stop-color="rgba(8,12,20,0.93)"/>
    </linearGradient>
  </defs>
  <rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="url(#bar)"/>
  <rect x="0" y="470" width="${OG_WIDTH}" height="160" fill="rgba(8,12,20,0.72)"/>
  <text x="${textX}" y="512" fill="#ffffff" font-family="system-ui,-apple-system,Segoe UI,sans-serif" font-size="34" font-weight="700">${dealerName}</text>
  ${
    titleLine
      ? `<text x="${textX}" y="${titleY}" fill="#e2e8f0" font-family="system-ui,-apple-system,Segoe UI,sans-serif" font-size="24" font-weight="600">${titleLine}</text>`
      : ""
  }
  ${
    locationLine
      ? `<text x="${textX}" y="572" fill="#94a3b8" font-family="system-ui,-apple-system,Segoe UI,sans-serif" font-size="20" font-weight="500">${locationLine}</text>`
      : ""
  }
  ${
    priceLine
      ? `<text x="${textX}" y="${priceY}" fill="#6ee7a8" font-family="system-ui,-apple-system,Segoe UI,sans-serif" font-size="28" font-weight="700">${priceLine}</text>`
      : ""
  }
  <text x="1152" y="608" text-anchor="end" fill="#94a3b8" font-family="system-ui,-apple-system,Segoe UI,sans-serif" font-size="15" font-weight="600" letter-spacing="2">WELSH MOTORHUB</text>
</svg>`);
}

async function prepareLogoBadge(logoBytes) {
  return sharp(logoBytes)
    .rotate()
    .resize(88, 88, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .extend({
      top: 8,
      bottom: 8,
      left: 8,
      right: 8,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .png()
    .toBuffer();
}

async function loadBrandMarkPng() {
  for (const rel of [BRAND_MARK_SQUARE, "/headerlogo.png"]) {
    try {
      const filePath = join(process.cwd(), "public", rel.replace(/^\//, ""));
      const raw = await readFile(filePath);
      return sharp(raw)
        .resize(40, 40, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();
    } catch {
      // try next
    }
  }
  return null;
}

/**
 * Composite dealer branding onto a 1200×630 base image.
 * @param {Buffer} baseBuffer already sized photo or solid background
 * @param {{ dealerName?: string, titleLine?: string, priceLine?: string, locationLine?: string, logoBytes?: Buffer|null }} branding
 */
async function compositeBrandingOntoBase(baseBuffer, branding = {}) {
  const hasLogo = Boolean(branding.logoBytes);
  const overlay = buildBrandingOverlaySvg({
    dealerName: branding.dealerName,
    titleLine: branding.titleLine,
    priceLine: branding.priceLine,
    locationLine: branding.locationLine,
    hasLogo,
  });

  /** @type {import("sharp").OverlayOptions[]} */
  const layers = [{ input: overlay, top: 0, left: 0 }];

  if (branding.logoBytes) {
    try {
      const badge = await prepareLogoBadge(branding.logoBytes);
      layers.push({ input: badge, top: 478, left: 40 });
    } catch {
      // skip broken logo
    }
  }

  const brandMark = await loadBrandMarkPng();
  if (brandMark) {
    layers.push({ input: brandMark, top: 28, left: OG_WIDTH - 68 });
  }

  let quality = 82;
  let out = await sharp(baseBuffer)
    .composite(layers)
    .jpeg({ quality, mozjpeg: true })
    .toBuffer();

  while (out.length > MAX_OG_BYTES && quality > 48) {
    quality -= 8;
    out = await sharp(baseBuffer)
      .composite(layers)
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();
  }

  return out;
}

/**
 * Car photo + dealer logo/name for WhatsApp / Facebook link previews.
 * @param {Buffer} photoBytes
 * @param {{ dealerName?: string, titleLine?: string, priceLine?: string, locationLine?: string, logoBytes?: Buffer|null }} branding
 */
export async function buildBrandedListingOgJpeg(photoBytes, branding = {}) {
  const base = await sharp(photoBytes)
    .rotate()
    .resize(OG_WIDTH, OG_HEIGHT, { fit: "cover", position: "centre" })
    .toBuffer();
  return compositeBrandingOntoBase(base, branding);
}

/** Branded card when listing has no usable photos. */
export async function buildBrandedFallbackOgJpeg(branding = {}) {
  const base = await sharp({
    create: {
      width: OG_WIDTH,
      height: OG_HEIGHT,
      channels: 3,
      background: { r: 17, g: 24, b: 39 },
    },
  })
    .jpeg({ quality: 85 })
    .toBuffer();
  return compositeBrandingOntoBase(base, branding);
}

/**
 * @param {Buffer} input
 * @returns {Promise<Buffer>}
 */
export async function buildWhatsAppOgJpeg(input) {
  let quality = 82;
  let out = await sharp(input)
    .rotate()
    .resize(OG_WIDTH, OG_HEIGHT, { fit: "cover", position: "centre" })
    .jpeg({ quality, mozjpeg: true })
    .toBuffer();

  while (out.length > MAX_OG_BYTES && quality > 48) {
    quality -= 8;
    out = await sharp(input)
      .rotate()
      .resize(OG_WIDTH, OG_HEIGHT, { fit: "cover", position: "centre" })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();
  }
  return out;
}

const FALLBACK_FILES = [BRAND_OG_IMAGE, BRAND_MARK_SQUARE, "/headerlogo.png"];

/** @returns {Promise<Buffer>} */
export async function buildBrandFallbackOgJpeg() {
  for (const rel of FALLBACK_FILES) {
    try {
      const filePath = join(process.cwd(), "public", rel.replace(/^\//, ""));
      const raw = await readFile(filePath);
      return buildWhatsAppOgJpeg(raw);
    } catch {
      // try next asset
    }
  }
  return sharp({
    create: {
      width: OG_WIDTH,
      height: OG_HEIGHT,
      channels: 3,
      background: { r: 17, g: 24, b: 39 },
    },
  })
    .jpeg({ quality: 80 })
    .toBuffer();
}

export const OG_IMAGE_DIMENSIONS = { width: OG_WIDTH, height: OG_HEIGHT };
