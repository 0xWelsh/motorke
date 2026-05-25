/**
 * Active per-listing boosts (Spotlight + Hot badge).
 */

import { isActiveHotBadge } from "@/lib/hot-badge";
import { isActiveSpotlight } from "@/lib/spotlight";

/**
 * @param {{ spotlightUntil?: Date | string | null, hotBadgeUntil?: Date | string | null }} car
 * @param {Date} [now]
 */
export function isActiveListingBoost(car, now = new Date()) {
  return isActiveSpotlight(car, now) || isActiveHotBadge(car, now);
}

/**
 * Prisma where for cars with Spotlight or Hot badge still active.
 * @param {Date} [now]
 */
export function activeListingBoostWhere(now = new Date()) {
  return {
    available: true,
    OR: [{ spotlightUntil: { gt: now } }, { hotBadgeUntil: { gt: now } }],
  };
}
