/**
 * Per-listing Hot badge boost (browse cards + detail).
 */

/**
 * @param {{ hotBadgeUntil?: Date | string | null }} car
 * @param {Date} [now]
 */
export function isActiveHotBadge(car, now = new Date()) {
  if (!car?.hotBadgeUntil) return false;
  return new Date(car.hotBadgeUntil).getTime() > now.getTime();
}

/**
 * @param {number} days
 * @returns {Date}
 */
export function hotBadgeUntilFromDays(days) {
  const until = new Date();
  until.setUTCDate(until.getUTCDate() + days);
  return until;
}

/**
 * Extend or start Hot badge; merges HOT into badges array.
 * @param {number} days
 * @param {string[]} [existingBadges]
 * @param {Date | null} [currentUntil]
 */
export function hotBadgeActivationData(days, existingBadges = [], currentUntil = null) {
  const now = new Date();
  const base =
    currentUntil && new Date(currentUntil).getTime() > now.getTime()
      ? new Date(currentUntil)
      : now;
  const until = new Date(base);
  until.setUTCDate(until.getUTCDate() + days);

  const badges = Array.isArray(existingBadges) ? [...existingBadges] : [];
  if (!badges.includes("HOT")) badges.push("HOT");

  return { hotBadgeUntil: until, badges };
}
