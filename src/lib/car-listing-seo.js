import { BODY_TYPE_LABELS, FUEL_LABELS } from "@/lib/constants";
import { formatCarPrice, formatPrice } from "@/lib/utils";

/** Compact price for title tags (keeps under ~60 chars with make/model/year). */
export function formatPriceForTitle(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) return "";
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    const rounded = m >= 10 ? Math.round(m) : Math.round(m * 10) / 10;
    return `KES ${String(rounded).replace(/\.0$/, "")}M`;
  }
  if (n >= 1_000) return `KES ${Math.round(n / 1_000)}K`;
  return formatPrice(n);
}

/** Short spec fragment for titles/H1 (e.g. "2.2L Diesel SUV"). */
export function buildCarSpecSnippet(car) {
  const parts = [];
  if (car.engineCC && car.engineCC >= 800) {
    const litres = car.engineCC / 1000;
    parts.push(litres >= 10 ? `${Math.round(litres)}L` : `${litres.toFixed(1).replace(/\.0$/, "")}L`);
  }
  if (car.fuelType && FUEL_LABELS[car.fuelType]) {
    parts.push(FUEL_LABELS[car.fuelType]);
  }
  if (car.bodyType && BODY_TYPE_LABELS[car.bodyType]) {
    const body = BODY_TYPE_LABELS[car.bodyType];
    if (body.length <= 12) parts.push(body.split("/")[0].trim());
  }
  return parts.join(" ");
}

/**
 * Listing page H1 — vehicle name only (no “for sale in …”; use hubs for that).
 */
export function buildCarListingH1(car) {
  const variant = car.variant ? ` ${car.variant}` : "";
  return `${car.year} ${car.make} ${car.model}${variant}`;
}

/**
 * Hub / inventory context headings — sale intent + location.
 */
export function buildCarContextHeading(car, dealer, { includeSpecs = true } = {}) {
  const variant = car.variant ? ` ${car.variant}` : "";
  const spec = includeSpecs ? buildCarSpecSnippet(car) : "";
  const specPart = spec ? ` ${spec}` : "";
  const place = car.location || dealer?.location || dealer?.county || "Kenya";
  return `${car.year} ${car.make} ${car.model}${variant}${specPart} for Sale in ${place}`;
}

/**
 * SERP title (without site name — add "| BIDGARI" in metadata).
 */
export function buildCarListingTitle(car) {
  const variant = car.variant ? ` ${car.variant}` : "";
  const price = formatPriceForTitle(car.price);
  let title = `${car.year} ${car.make} ${car.model}${variant} for Sale Kenya`;
  if (price) title += ` ${price}`;
  if (title.length > 58) {
    title = `${car.year} ${car.make} ${car.model} for Sale Kenya`;
    if (price) title += ` ${price}`;
  }
  return title;
}

/**
 * Meta description (~150–160 chars), action-oriented.
 */
export function buildCarListingDescription(car, dealer) {
  const variant = car.variant ? ` ${car.variant}` : "";
  const vehicle = `${car.year} ${car.make} ${car.model}${variant}`;
  const place = car.location || dealer?.location || dealer?.county || "Kenya";
  const priceStr = formatCarPrice(car);
  const desc = `Buy a ${vehicle} in ${place} for ${priceStr}. Compare specs, running costs, and contact the BIDGARI team to handle the sale for you.`;
  return desc.length > 160 ? desc.slice(0, 157) + "…" : desc;
}

/** Alt text for gallery images. */
export function buildCarImageAlt(car, photoIndex, { isPrimary = false } = {}) {
  const variant = car.variant ? ` ${car.variant}` : "";
  const base = `${car.year} ${car.make} ${car.model}${variant}`;
  const spec = buildCarSpecSnippet(car);
  const suffix = isPrimary ? "main photo" : `photo ${photoIndex}`;
  return spec ? `${base} ${spec}, ${suffix}` : `${base}, ${suffix}`;
}

/** Map API image payloads to DB rows with alt text. */
export function mapCarImagesWithAlt(car, images) {
  if (!images?.length) return [];
  const primaryIdx = images.findIndex((img) => img.isPrimary);
  const finalPrimaryIdx = primaryIdx !== -1 ? primaryIdx : 0;
  return images.map((img, i) => ({
    url: img.url,
    isPrimary: i === finalPrimaryIdx,
    order: i,
    alt: (img.alt && String(img.alt).trim()) || buildCarImageAlt(car, i + 1, { isPrimary: i === finalPrimaryIdx }),
  }));
}

export function buildCarListingDealerMetadata(car, dealer) {
  const dealerName = "BIDGARI";
  const place = car.location || dealer?.location || dealer?.county || "Kenya";
  return {
    title: buildCarListingTitle(car),
    description: buildCarListingDescription(car, dealer),
    h1: buildCarListingH1(car),
    dealerName,
    place,
  };
}
