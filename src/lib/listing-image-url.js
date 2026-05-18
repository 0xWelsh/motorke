// src/lib/listing-image-url.js
// Normalise car image URLs stored in the DB so browsers and scrapers hit a
// stable public Supabase path where possible.

const BUCKET = "car-images";

/**
 * @param {string|null|undefined} url
 * @returns {string|null}
 */
export function normalizeListingHeroImageUrl(url) {
  if (!url || typeof url !== "string") return null;
  let s = url.trim();
  if (!s) return null;
  if (s.startsWith("//")) s = `https:${s}`;
  if (!/^https?:\/\//i.test(s)) return s;

  try {
    const u = new URL(s);
    // Legacy uploads sometimes omitted `/public/` even though the bucket is public.
    const marker = `/object/${BUCKET}/`;
    const publicMarker = `/object/public/${BUCKET}/`;
    if (u.pathname.includes(marker) && !u.pathname.includes("/object/public/")) {
      u.pathname = u.pathname.replace(marker, publicMarker);
    }
    return u.toString();
  } catch {
    return s;
  }
}

/**
 * Storage object path after the bucket name (e.g. cars/{carId}/file.jpg).
 * @param {string} urlString
 * @returns {string|null}
 */
export function extractCarImageStoragePath(urlString) {
  if (!urlString || typeof urlString !== "string") return null;
  const markers = [
    `/object/public/${BUCKET}/`,
    `/object/sign/${BUCKET}/`,
    `/object/${BUCKET}/`,
  ];
  for (const marker of markers) {
    const idx = urlString.indexOf(marker);
    if (idx === -1) continue;
    const rest = urlString.slice(idx + marker.length).split("?")[0];
    if (rest && !rest.includes("..")) return rest;
  }
  return null;
}

/**
 * True if the URL is our Supabase Storage car bucket (public or signed).
 * Used to block SSRF in the OG image proxy.
 * @param {string} urlString
 * @param {string|null} supabaseOrigin e.g. https://xyz.supabase.co
 */
export function isCarImageStorageUrl(urlString, supabaseOrigin) {
  if (!urlString) return false;
  const normalized = normalizeListingHeroImageUrl(urlString);
  if (!normalized) return false;

  if (!supabaseOrigin) return false;
  try {
    const u = new URL(normalized);
    const o = new URL(supabaseOrigin);
    if (u.origin !== o.origin) return false;
    const p = u.pathname;
    return (
      p.includes(`/object/public/${BUCKET}/`) ||
      p.includes(`/object/${BUCKET}/`) ||
      (p.includes(`/object/sign/${BUCKET}/`) && u.searchParams.has("token"))
    );
  } catch {
    return false;
  }
}
