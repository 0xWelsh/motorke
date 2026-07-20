import sharp from "sharp";
import { fetchListingImageBytes } from "@/lib/og-listing-image";

const CARD_W = 900;
const PHOTO_H = 600;
const BOTTOM_H = 580;
const CARD_H = PHOTO_H + BOTTOM_H;

export const SHARE_CARD_DIMENSIONS = { width: CARD_W, height: CARD_H };

function escapeXml(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function formatPrice(v) {
  if (v == null) return "";
  const n = Number(v);
  return isNaN(n) ? String(v) : `KES ${n.toLocaleString("en-KE")}`;
}

function formatMileage(v) {
  if (v == null) return "";
  const n = Number(v);
  return isNaN(n) ? String(v) : `${n.toLocaleString("en-KE")} km`;
}

/**
 * Dark bottom panel with price, title, specs, CTA, and brand mark.
 * Positioned at PHOTO_H in the composite.
 */
function buildBottomSvg(car) {
  const price = escapeXml(formatPrice(car.price));
  const title = escapeXml(`${car.year} ${car.make} ${car.model}${car.variant ? ` ${car.variant}` : ""}`);
  const mileage = car.mileage ? escapeXml(formatMileage(car.mileage)) : "";
  const fuel = car.fuelType ? escapeXml(car.fuelType) : "";
  const transmission = car.transmission ? escapeXml(car.transmission) : "";
  const location = car.dealer?.location ? escapeXml(car.dealer.location) : "";

  const specParts = [mileage, fuel, transmission].filter(Boolean);
  const specLine = specParts.length ? specParts.join("  ·  ") : "";

  return Buffer.from(`<svg width="${CARD_W}" height="${BOTTOM_H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${CARD_W}" height="${BOTTOM_H}" fill="#0a0a0a"/>
  <line x1="45" y1="0" x2="${CARD_W - 45}" y2="0" stroke="#1a1a1a" stroke-width="1"/>
  <text x="45" y="52" font-family="system-ui, sans-serif" font-size="28" font-weight="800" fill="#22c55e">${price}</text>
  <text x="45" y="108" font-family="system-ui, sans-serif" font-size="24" font-weight="700" fill="#fff">${title}</text>
  ${specLine ? `<text x="45" y="155" font-family="system-ui, sans-serif" font-size="16" fill="#a1a1aa">${specLine}</text>` : ""}
  ${location ? `<text x="45" y="195" font-family="system-ui, sans-serif" font-size="14" fill="#71717a">📍 ${location}</text>` : ""}
  <rect x="45" y="270" width="${CARD_W - 90}" height="48" rx="8" fill="#22c55e"/>
  <text x="${CARD_W / 2}" y="300" font-family="system-ui, sans-serif" font-size="15" font-weight="800" fill="#000" text-anchor="middle">See on BIDGARI</text>
  <text x="${CARD_W / 2}" y="${BOTTOM_H - 45}" font-family="system-ui, sans-serif" font-size="13" font-weight="800" fill="#3f3f46" text-anchor="middle" letter-spacing="4">BIDGARI</text>
  <text x="${CARD_W / 2}" y="${BOTTOM_H - 28}" font-family="system-ui, sans-serif" font-size="10" fill="#3f3f46" text-anchor="middle">Kenya's car marketplace</text>
</svg>`);
}

/**
 * Gradient overlay at the bottom of the photo area so the
 * price text is readable against any image.
 */
function buildPhotoOverlaySvg() {
  const overlayH = 160;
  return Buffer.from(`<svg width="${CARD_W}" height="${overlayH}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.65"/>
    </linearGradient>
  </defs>
  <rect width="${CARD_W}" height="${overlayH}" fill="url(#fade)"/>
</svg>`);
}

export async function buildShareCardJpeg(imageBuffer, carData) {
  const photo = await sharp(imageBuffer)
    .rotate()
    .resize(CARD_W, PHOTO_H, { fit: "cover", position: "centre" })
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer();

  const overlay = buildPhotoOverlaySvg();
  const bottom = buildBottomSvg(carData);
  const overlayH = 160;

  const out = await sharp({
    create: { width: CARD_W, height: CARD_H, channels: 3, background: { r: 10, g: 10, b: 10 } },
  })
    .composite([
      { input: photo, top: 0, left: 0 },
      { input: overlay, top: PHOTO_H - overlayH, left: 0 },
      { input: bottom, top: PHOTO_H, left: 0 },
    ])
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer();

  return out;
}

export async function buildShareCardFallbackJpeg() {
  return sharp({
    create: { width: CARD_W, height: CARD_H, channels: 3, background: { r: 17, g: 24, b: 39 } },
  })
    .jpeg({ quality: 80 })
    .toBuffer();
}
