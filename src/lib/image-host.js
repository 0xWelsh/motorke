const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || "";

/**
 * Canonical image host.
 *
 * `r2.dev` is Cloudflare's raw dev endpoint: it works, but it is NOT served
 * through the edge cache and carries a hard rate limit. A custom domain
 * (e.g. https://img.bidgari.com) routed at the bucket IS edge-cached, which is
 * what makes repeated image views cheap. Switching is just an env var change:
 * set R2_PUBLIC_URL to the custom domain and redeploy.
 */
export const IMAGE_BASE_URL = R2_PUBLIC_URL;

let cachedHost = "";
export function imageHost() {
  if (cachedHost) return cachedHost;
  try {
    cachedHost = R2_PUBLIC_URL ? new URL(R2_PUBLIC_URL).hostname : "";
  } catch {
    cachedHost = "";
  }
  return cachedHost;
}

/** True when `url` points at our own image bucket. */
export function isImageHostUrl(url) {
  if (!url || typeof url !== "string") return false;
  let h;
  try {
    h = new URL(url, "https://placeholder.invalid").hostname;
  } catch {
    return false;
  }
  const host = imageHost();
  if (host && h === host) return true;
  // Safety net: any R2 dev endpoint. Without this, a build that is missing
  // R2_PUBLIC_URL would silently drop every srcset and serve raw originals.
  return h.endsWith(".r2.dev");
}

/**
 * Rewrite an original image URL to a pre-generated WebP width variant.
 * Returns null when no variant can be derived (caller should fall back).
 */
export function imageVariantUrl(url, suffix) {
  if (!isImageHostUrl(url)) return null;
  if (!suffix) return null;
  // Never stack a second variant onto one that is already generated.
  if (/-\d+w\.webp$/.test(url)) return null;
  return url.replace(/(\/[^/]+)\.\w+$/, `$1${suffix}`);
}