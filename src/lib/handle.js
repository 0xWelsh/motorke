// Public profile handles: /u/<handle>

export const HANDLE_MIN = 3;
export const HANDLE_MAX = 24;
const HANDLE_RE = /^[a-z0-9](?:[a-z0-9-]{1,22}[a-z0-9])?$/;

// Anything that could shadow a real route or look official.
const RESERVED = new Set([
  "admin", "api", "app", "u", "cars", "car", "dealers", "dealer", "showrooms",
  "login", "signup", "logout", "account", "dashboard", "settings", "profile",
  "sell", "buy", "sold", "bid", "bidding", "auction", "compare", "duty",
  "import", "blog", "guides", "guide", "faq", "contact", "help", "support",
  "privacy", "terms", "trust", "safety", "reports", "report", "requests",
  "saved", "kenya", "nairobi", "mombasa", "kisumu", "nakuru", "luxury",
  "mission", "maintenance", "testimonials", "verification", "verified",
  "bidgari", "official", "staff", "team", "system", "root", "null", "undefined",
]);

export function normalizeHandle(input) {
  return String(input || "")
    .trim().toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Returns { ok, handle } or { ok:false, error } */
export function validateHandle(raw) {
  const h = normalizeHandle(raw);
  if (h.length < HANDLE_MIN || h.length > HANDLE_MAX) {
    return { ok: false, error: `Handle must be ${HANDLE_MIN}–${HANDLE_MAX} characters.` };
  }
  if (!HANDLE_RE.test(h)) {
    return { ok: false, error: "Letters, numbers and hyphens only; no leading/trailing hyphen." };
  }
  if (RESERVED.has(h)) return { ok: false, error: "That handle is reserved." };
  return { ok: true, handle: h };
}

/** Suggest a handle from a display name (used when the user has none yet). */
export function suggestHandle(name) {
  const base = normalizeHandle(name).slice(0, HANDLE_MAX);
  if (base.length >= HANDLE_MIN && !RESERVED.has(base)) return base;
  return null;
}
