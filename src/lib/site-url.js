const DEFAULT_ORIGIN = "https://bidgari.com";

/** Public files in /public — used for OG fallbacks, JSON-LD, navbar */
export const BRAND_OG_IMAGE = "/opengraph.png";
export const BRAND_MARK_SQUARE = "/app-icon-source.png";
/** Horizontal wordmark for light surfaces (black "BID", green "GARI"). */
export const BRAND_HEADER_LOGO = "/images/bidgari-logo-on-light.png";

/** Strip slashes for consistent URL concatenation */
function normalizeOrigin(raw) {
  if (!raw || typeof raw !== "string") return "";
  let s = raw.trim().replace(/\/+$/, "");
  if (!s) return "";
  if (!/^https?:\/\//i.test(s)) {
    const hostOnly = /^[a-z0-9.-]+$/i.test(s) || s.includes(".");
    s = hostOnly ? `https://${s}` : s.startsWith("//") ? `https:${s}` : `https://${s}`;
  }
  return s.replace(/\/+$/, "");
}

/**
 * Public site origin (canonical). Uses env in production previews and deploys safely.
 */
export function getSiteOrigin() {
  const fromEnv =
    normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL) ||
    normalizeOrigin(process.env.NEXT_PUBLIC_APP_URL);
  if (fromEnv) return fromEnv;

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) {
    const v = normalizeOrigin(
      /^https?:\/\//i.test(vercel) ? vercel : `https://${vercel}`
    );
    if (v) return v;
  }

  return DEFAULT_ORIGIN;
}

export function absoluteUrl(pathname = "/") {
  const base = getSiteOrigin();
  if (!pathname || pathname === "/") return base;
  const p = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${base}${p}`;
}

/**
 * Normalise a stored media URL for crawlers (og:image, JSON-LD).
 * Handles full https URLs (e.g. Supabase), protocol-relative URLs, and
 * paths on this site. When `url` is empty, returns an absolute URL for
 * `fallbackPath` if provided (e.g. "/opengraph.png").
 */
export function absoluteMediaUrl(url, fallbackPath = null) {
  if (!url || typeof url !== "string" || !url.trim()) {
    if (!fallbackPath) return null;
    const f = fallbackPath.startsWith("/") ? fallbackPath : `/${fallbackPath}`;
    return absoluteUrl(f);
  }
  const u = url.trim();
  if (u.startsWith("//")) return `https:${u}`;
  if (/^https?:\/\//i.test(u)) return u;
  return absoluteUrl(u.startsWith("/") ? u : `/${u}`);
}
