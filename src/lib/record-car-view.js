// src/lib/record-car-view.js
// Single helper for "this car was genuinely viewed" events.
// Shared by the dwell-based tracker (/api/cars/views) and by enquiry
// creation (/api/leads) so every real engagement counts exactly once.

import { db } from "@/lib/db";

// De-duplicate refresh spam: at most one view per (carId, userId OR
// sessionKey) inside this window. Short enough to stay responsive for
// genuine views, long enough to block rapid refresh inflation.
export const VIEW_DEDUP_WINDOW_MINUTES = 5;

// Stable per-device key; used to dedupe anonymous views. It is issued by the
// view/lead APIs rather than middleware so cacheable HTML responses never
// carry a Set-Cookie header (which would opt them out of CDN caching).
export const ROTATION_COOKIE = "wmh-rot";
export const ROTATION_COOKIE_MAX_AGE = 60 * 60 * 24 * 90;

export function newRotationId() {
  const bytes = new Uint8Array(16);
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function rotationCookieHeader(value) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${ROTATION_COOKIE}=${value}; Path=/; Max-Age=${ROTATION_COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
}

/**
 * Record a car view: dedupe → event row → counter.
 * Tracking must never break the user experience, so failures inside the
 * counter/cache steps are swallowed and logged.
 *
 * @param {{ carId: string, userId?: string|null, sessionKey?: string|null, source?: string|null }}
 * @returns {Promise<{ recorded: boolean, deduped: boolean }>}
 */
export async function recordCarView({ carId, userId, sessionKey, source }) {
  if (!carId) return { recorded: false, deduped: false };

  const since = new Date(Date.now() - VIEW_DEDUP_WINDOW_MINUTES * 60 * 1000);
  let recentMatch = null;

  if (userId) {
    recentMatch = await db.carView.findFirst({
      where: { carId, userId, viewedAt: { gte: since } },
      select: { id: true },
    });
  } else if (sessionKey) {
    recentMatch = await db.carView.findFirst({
      where: { carId, sessionKey, viewedAt: { gte: since } },
      select: { id: true },
    });
  }
  // If neither userId nor sessionKey exists we can't dedupe reliably.
  // Accept the view rather than lose it — cookie-blocked users are a tiny
  // minority and we'd rather slightly over-count than under-count.

  if (recentMatch) {
    return { recorded: false, deduped: true };
  }

  const car = await db.car.findUnique({
    where: { id: carId },
    select: { id: true },
  });
  if (!car) {
    return { recorded: false, deduped: false };
  }

  await Promise.all([
    db.carView.create({ data: { carId, userId, sessionKey, source } }),
    db.car.update({
      where: { id: carId },
      data:  { views: { increment: 1 } },
    }).catch((err) => {
      // Don't fail the whole request if the counter bump fails.
      console.warn("[carView] counter bump failed", { carId, err: err?.message });
    }),
  ]);

  // Deliberately do NOT invalidate the car-detail cache here. A popular
  // listing gets views every few seconds; busting its ISR entry on each one
  // turned every render into a cache miss. The 60s route / 120s data TTL
  // already refreshes the view badge, and a slightly stale count is harmless.
  return { recorded: true, deduped: false };
}
