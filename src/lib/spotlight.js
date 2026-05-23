/**
 * Paid Spotlight placement (homepage section + browse rank).
 */

/** Browse sort weight while Spotlight is active (see cars/page affinity). */
export const SPOTLIGHT_BROWSE_WEIGHT = 40;

const CAR_CARD_INCLUDE = {
  images: { where: { isPrimary: true }, take: 1 },
  dealer: {
    select: { id: true, name: true, location: true, verified: true, slug: true, county: true },
  },
};

/**
 * @param {{ spotlightUntil?: Date | string | null }} car
 * @param {Date} [now]
 */
export function isActiveSpotlight(car, now = new Date()) {
  if (!car?.spotlightUntil) return false;
  return new Date(car.spotlightUntil).getTime() > now.getTime();
}

/**
 * @param {number} days
 * @returns {Date}
 */
export function spotlightUntilFromDays(days) {
  const until = new Date();
  until.setUTCDate(until.getUTCDate() + days);
  return until;
}

/**
 * Prisma where clause for cars with an active paid Spotlight.
 * @param {Date} [now]
 */
export function activeSpotlightWhere(now = new Date()) {
  return {
    available: true,
    spotlightUntil: { gt: now },
  };
}

/** Shared include for homepage / cards. */
export function spotlightCarInclude() {
  return CAR_CARD_INCLUDE;
}

/**
 * Data to apply when activating Spotlight on a car (portal/M-Pesa later).
 * @param {number} days
 */
export function spotlightActivationData(days) {
  return {
    spotlightUntil: spotlightUntilFromDays(days),
    featuredWeight: SPOTLIGHT_BROWSE_WEIGHT,
  };
}

/**
 * Clear Spotlight when expired manually or on refund.
 */
export function spotlightDeactivationData() {
  return {
    spotlightUntil: null,
    featuredWeight: 0,
  };
}
