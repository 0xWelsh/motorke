const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || "";
const R2_HOSTNAME = R2_PUBLIC_URL ? new URL(R2_PUBLIC_URL).hostname : "";

const SUPABASE_PATTERN = /\/storage\/v1\/object\/(public|sign)\/[^/]+\//;

function isR2Url(url) {
  if (!url || typeof url !== "string") return false;
  try {
    return new URL(url).hostname === R2_HOSTNAME;
  } catch {
    return false;
  }
}

function isSupabaseUrl(url) {
  if (!url || typeof url !== "string") return false;
  try {
    return new URL(url).hostname.endsWith(".supabase.co") && SUPABASE_PATTERN.test(url);
  } catch {
    return false;
  }
}

function r2Thumbnail(url, width) {
  const size = width <= 400 ? "-400w" : "-800w";
  return url.replace(/(\/[^/]+)\.\w+$/, `$1${size}.webp`);
}

function supabaseTransform(url, width, quality) {
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}width=${width}&format=webp&quality=${quality}`;
}

export function getThumbnailUrl(url, width = 400, quality = 80) {
  if (!url) return url;
  if (isR2Url(url)) return r2Thumbnail(url, width);
  if (isSupabaseUrl(url)) return supabaseTransform(url, width, quality);
  return url;
}

export function getHeroImageUrl(url, quality = 85, width) {
  if (!url) return url;
  if (isR2Url(url)) return width ? r2Thumbnail(url, width) : r2Thumbnail(url, 800);
  if (isSupabaseUrl(url)) {
    const sep = url.includes("?") ? "&" : "?";
    if (width) return `${url}${sep}width=${width}&format=webp&quality=${quality}`;
    return `${url}${sep}format=webp&quality=${quality}`;
  }
  return url;
}

export function getPreloadImageUrl(url, quality = 85) {
  if (!url) return url;
  if (isR2Url(url)) return r2Thumbnail(url, 800);
  if (isSupabaseUrl(url)) {
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}width=1200&format=webp&quality=${quality}`;
  }
  return url;
}

export function getGalleryImageUrl(url, quality = 85) {
  return getHeroImageUrl(url, quality, 800);
}

export function saveDataQuality(saveData, defaultQ = 80) {
  return saveData ? Math.min(defaultQ, 50) : defaultQ;
}
