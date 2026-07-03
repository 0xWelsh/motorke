// src/lib/image-transform.js
// Adds Supabase Storage image transformation params to car image URLs.
// Falls through to the original URL when the input is not a Supabase
// storage URL (local assets, external CDN, etc.) — safe to call anywhere.

const STORAGE_PATTERN = /\/storage\/v1\/object\/(public|sign)\/[^/]+\//;

function isSupabaseStorageUrl(url) {
  if (!url || typeof url !== "string") return false;
  try {
    const u = new URL(url);
    return u.hostname.endsWith(".supabase.co") && STORAGE_PATTERN.test(u.pathname);
  } catch {
    return false;
  }
}

/**
 * Return a Supabase storage URL with width, format, and quality params
 * for use in thumbnails / card images. Returns the original URL unchanged
 * when it is not a Supabase storage URL.
 */
export function getThumbnailUrl(url, width = 400, quality = 80) {
  if (!isSupabaseStorageUrl(url)) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}width=${width}&format=webp&quality=${quality}`;
}

/**
 * Hero / carousel images: just convert to WebP with good quality,
 * no aggressive width clamp (let the responsive layout decide).
 */
export function getHeroImageUrl(url, quality = 85, width) {
  if (!isSupabaseStorageUrl(url)) return url;
  const sep = url.includes("?") ? "&" : "?";
  if (width) return `${url}${sep}width=${width}&format=webp&quality=${quality}`;
  return `${url}${sep}format=webp&quality=${quality}`;
}

/**
 * Preload variant — smallest sensible representation for LCP images.
 * Wider than thumbnails since hero images span a larger viewport.
 */
export function getPreloadImageUrl(url, quality = 85) {
  if (!isSupabaseStorageUrl(url)) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}width=1200&format=webp&quality=${quality}`;
}

/** Gallery carousel images - width-limited for bandwidth but crisp enough for hero display. */
export function getGalleryImageUrl(url, quality = 85) {
  return getHeroImageUrl(url, quality, 800);
}

/** Return reduced quality when Save-Data is active to save bandwidth. */
export function saveDataQuality(saveData, defaultQ = 80) {
  return saveData ? Math.min(defaultQ, 50) : defaultQ;
}
