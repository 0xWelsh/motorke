// src/lib/record-car-view.js
// Single helper for "this car was genuinely viewed" events.
// Shared by the dwell-based tracker (/api/cars/views) and by enquiry
// creation (/api/leads) so every real engagement counts exactly once.

import { db } from "@/lib/db";
import { revalidateTag } from "next/cache";

// De-duplicate refresh spam: at most one view per (carId, userId OR
// sessionKey) inside this window. Short enough to stay responsive for
// genuine views, long enough to block rapid refresh inflation.
export const VIEW_DEDUP_WINDOW_MINUTES = 5;

// Stable per-device key set by middleware; used to dedupe anonymous views.
export const ROTATION_COOKIE = "wmh-rot";

/**
 * Record a car view: dedupe → event row → counter → cache refresh.
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

  // Existence check doubles as the lookup for the publicSlug we need to
  // invalidate the correct cached page entry.
  const car = await db.car.findUnique({
    where: { id: carId },
    select: { id: true, publicSlug: true },
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

  // Refresh the public car page so the new badge count shows immediately
  // instead of waiting out the 120s data cache.
  try {
    revalidateTag(`car-detail:${car.id}`);
    if (car.publicSlug) revalidateTag(`car-detail:${car.publicSlug}`);
  } catch (err) {
    console.warn("[carView] revalidate failed", { carId, err: err?.message });
  }

  return { recorded: true, deduped: false };
}
