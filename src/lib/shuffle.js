// src/lib/shuffle.js
// Deterministic seeded shuffle used by the public /cars listing for
// fair exposure. Cars within the same quality tier are rotated based
// on a per-visitor + per-day seed, so:
//   - The same buyer keeps a stable order across pagination.
//   - Different buyers see different orders (no car lives at page 7
//     forever just because it was uploaded after the popular ones).
//   - The catalog rotates daily, so older listings naturally cycle
//     back into earlier pages.
//   - Featured / verified cars still hold the top tiers — we only
//     shuffle *within* each tier.

/** FNV-1a 32-bit hash. Fast, deterministic, JS-only. */
function hashSeed(str) {
  let h = 2166136261;
  const s = String(str || "");
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Mulberry32 PRNG — deterministic, ~30ms for 100k draws. */
function mulberry32(seed) {
  let t = seed >>> 0;
  return function next() {
    t = (t + 0x6D2B79F5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Stable per-item rank in [0, 2^32). Same item + same seed always
 * returns the same number, so sorting by this value gives a
 * deterministic "random" permutation.
 */
export function rankFor(itemId, seed) {
  return hashSeed(`${itemId}::${seed}`);
}

/**
 * Sort an array in-place equivalent. Same input + same seed = same
 * output. Different seed = different (still deterministic) output.
 */
export function shuffleWithSeed(arr, seedStr) {
  if (!Array.isArray(arr) || arr.length < 2) return arr ? [...arr] : [];
  const rng = mulberry32(hashSeed(seedStr));
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Integer day index since the unix epoch, in UTC. */
export function dayBucket(now = Date.now()) {
  return Math.floor(now / (24 * 60 * 60 * 1000));
}

const SEARCH_BOT_RE =
  /\b(googlebot|bingbot|yandexbot|baiduspider|duckduckbot|slurp|facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegrambot|applebot|crawl|spider|bot\/)\b/i;

/** Returns true for the user agents we don't want to shuffle for. */
export function isSearchBot(userAgent) {
  return SEARCH_BOT_RE.test(userAgent || "");
}

/**
 * Derive a stable seed for the current visitor.
 *   - Logged-in user → their id (stable across devices).
 *   - Otherwise → cookie set by middleware (stable on device, 90d).
 *   - Last resort → ip + ua hash (degrades for shared NAT but works).
 *
 * Day bucket is mixed in so the order naturally rotates every day.
 */
export function rotationSeed({ userId, cookieRotationId, ip, userAgent }) {
  const day = dayBucket();
  if (userId) return `u:${userId}:${day}`;
  if (cookieRotationId) return `c:${cookieRotationId}:${day}`;
  const fingerprint = hashSeed(`${ip || "0.0.0.0"}|${userAgent || ""}`);
  return `f:${fingerprint}:${day}`;
}

/**
 * Quality tier — lower number = higher priority.
 *   0: explicitly pinned by an admin (high featuredWeight) on a
 *      featured dealer — VIP slot.
 *   1: featured dealer (admin promoted on /admin/dealers).
 *   2: verified dealer.
 *   3: unverified dealer (only visible when the
 *      PUBLIC_ONLY_VERIFIED_DEALERS flag is off).
 */
export function carTier(car) {
  const fw = Number(car?.featuredWeight || 0);
  const dealerFeatured = Boolean(car?.dealer?.featured);
  const dealerVerified = Boolean(car?.dealer?.verified);
  if (dealerFeatured && fw >= 50) return 0;
  if (dealerFeatured) return 1;
  if (dealerVerified) return 2;
  return 3;
}

/**
 * Sort cars by quality tier ascending, then by a seeded rank within
 * each tier. The relative ordering of tiers never changes; within a
 * tier the order depends entirely on the seed.
 */
export function sortByTierAndSeed(cars, seed) {
  return [...cars].sort((a, b) => {
    const tA = carTier(a);
    const tB = carTier(b);
    if (tA !== tB) return tA - tB;
    return rankFor(a.id, seed) - rankFor(b.id, seed);
  });
}
