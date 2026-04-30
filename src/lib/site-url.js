const DEFAULT_ORIGIN = "https://welshmotorhub.co.ke";

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
