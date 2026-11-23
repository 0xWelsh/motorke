/**
 * Build consistent WhatsApp / Facebook link-preview images for car listings.
 * Crawlers are picky: prefer same-origin JPEG ~1200×630, no redirects, < ~600KB.
 */

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { BRAND_HEADER_LOGO, BRAND_MARK_SQUARE, BRAND_OG_IMAGE } from "@/lib/site-url";
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
// Hosts the OG proxy may fetch from (SSRF guard). Our own CDN hosts — the R2
// custom domain and the legacy pub-*.r2.dev endpoint — are always allowed,
// as is whatever NEXT_PUBLIC_R2_PUBLIC_URL points at.
const ALLOWED_IMAGE_HOSTS = [
  "images.bidgari.com",
  "r2.dev",
  "supabase.co",
  "supabase.in",
  "unsplash.com",
  "images.unsplash.com",
];

function allowedImageHost(hostname) {
  const h = String(hostname || "").toLowerCase();
  if (ALLOWED_IMAGE_HOSTS.some((a) => h === a || h.endsWith(`.${a}`))) return true;
  if (h.endsWith(".r2.cloudflarestorage.com")) return true;
  const raw = process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.trim();
  if (raw) {
    try {
      const u = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
      if (h === u.hostname) return true;
    } catch {
      /* ignore malformed */
    }
  }
  return false;
}

/** Fetch any public HTTPS image (dealer banners, external logos) — host-allowlisted. */
export async function fetchRemoteImageBytes(url) {
  try {
    const parsed = new URL(url);
    if (!allowedImageHost(parsed.hostname)) return null;
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
        const publicBuf = await fetchRemoteImageBytes(normalized);
        if (publicBuf) return publicBuf;
      }
    } catch {
      // ignore bad URL
    }
  }

  if (path) {
    return fetchStorageObjectBytes(path);
  }

  // Fallback: try direct fetch for any allowlisted host (R2, etc.)
  return fetchRemoteImageBytes(normalized);
}

const CAPTION_H = 140;

/**
 * Resize to max 1200px wide, keep aspect ratio, no caption bar — just the bare image.
 * @param {Buffer} input
 * @returns {Promise<Buffer>}
 */
export async function buildPlainOgJpeg(input) {
  const meta = await sharp(input).metadata();
  const imgW = meta.width || OG_WIDTH;
  const imgH = meta.height || OG_HEIGHT;

  const maxW = OG_WIDTH;
  let targetW = Math.min(imgW, maxW);
  let targetH = Math.round(imgH * (targetW / imgW));

  if (targetW < 300) {
    targetW = 300;
    targetH = Math.round(imgH * (targetW / imgW));
  }

  let quality = 82;
  let out = await sharp(input)
    .rotate()
    .resize(targetW, targetH, { fit: "contain", withoutEnlargement: false })
    .jpeg({ quality, mozjpeg: true })
    .toBuffer();

  while (out.length > MAX_OG_BYTES && quality > 48) {
    quality -= 8;
    out = await sharp(input)
      .rotate()
      .resize(targetW, targetH, { fit: "contain", withoutEnlargement: false })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();
  }
  return out;
}

/**
 * Resize to fixed 1200×630 cover (used by dealer OG images and fallback).
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

function escapeXml(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function buildCaptionSvg(carMeta, width) {
  const title = escapeXml(carMeta?.title || "Car");
  const price = carMeta?.price != null ? `KES ${Number(carMeta.price).toLocaleString("en-KE")}` : "";
  const metaParts = [];
  if (carMeta.mileage) metaParts.push(`${Number(carMeta.mileage).toLocaleString("en-KE")} km`);
  if (carMeta.location) metaParts.push(carMeta.location);
  const meta = escapeXml(metaParts.join(" | "));
  const dealer = escapeXml(carMeta?.dealerName || "");

  const line = `<line x1="0" y1="0" x2="${width}" y2="0" stroke="#2a2a2a" stroke-width="1"/>`;
  const t = `<text x="16" y="38" font-family="sans-serif" font-size="26" fill="#fff">${title}</text>`;
  const p = price ? `<text x="${width - 16}" y="38" font-family="sans-serif" font-size="24" fill="#4ade80" text-anchor="end">${price}</text>` : "";
  const m = meta ? `<text x="16" y="72" font-family="sans-serif" font-size="17" fill="#9ca3af">${meta}</text>` : "";
  const d = dealer ? `<text x="${width - 16}" y="72" font-family="sans-serif" font-size="15" fill="#9ca3af" text-anchor="end">${dealer}</text>` : "";
  const u = `<text x="16" y="108" font-family="sans-serif" font-size="13" fill="#666">WELSH</text>`;

  return Buffer.from(`<svg width="${width}" height="${CAPTION_H}" xmlns="http://www.w3.org/2000/svg"><rect width="${width}" height="${CAPTION_H}" fill="#222222"/>${line}${t}${p}${m}${d}${u}</svg>`);
}

/**
 * Build a branded OG image — full original photo + caption bar at the bottom.
 * No cropping — the photo keeps its natural aspect ratio, resized to max 1200px wide.
 * @param {Buffer} imageBuffer
 * @param {object|null} carMeta
 * @param {string} carMeta.title
 * @param {number} carMeta.price
 * @param {number} [carMeta.mileage]
 * @param {string} [carMeta.location]
 * @param {string} [carMeta.dealerName]
 * @returns {Promise<Buffer>}
 */
export async function buildBrandedOgJpeg(imageBuffer, carMeta) {
  const meta = await sharp(imageBuffer).metadata();
  const imgW = meta.width || OG_WIDTH;
  const imgH = meta.height || OG_HEIGHT;

  const maxW = OG_WIDTH;
  let targetW = Math.min(imgW, maxW);
  let targetH = Math.round(imgH * (targetW / imgW));

  if (targetW < 300) {
    targetW = 300;
    targetH = Math.round(imgH * (targetW / imgW));
  }

  const resized = await sharp(imageBuffer)
    .rotate()
    .resize(targetW, targetH, { fit: "contain", withoutEnlargement: false })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();

  const totalH = targetH + CAPTION_H;
  const caption = buildCaptionSvg(carMeta, targetW);

  const out = await sharp({
    create: { width: targetW, height: totalH, channels: 3, background: { r: 10, g: 10, b: 10 } },
  })
    .composite([
      { input: resized, top: 0, left: 0 },
      { input: caption, top: targetH, left: 0 },
    ])
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();

  return out;
}

const FALLBACK_FILES = [BRAND_OG_IMAGE, BRAND_MARK_SQUARE, BRAND_HEADER_LOGO];

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
