/** Days a sold listing stays on the public detail page (hidden from search immediately). */
export const SOLD_GRACE_DAYS = 7;

const SOLD_GRACE_MS = SOLD_GRACE_DAYS * 24 * 60 * 60 * 1000;

export function soldGraceCutoffDate(now = new Date()) {
  return new Date(now.getTime() - SOLD_GRACE_MS);
}

export function isInSoldGracePeriod(car, now = new Date()) {
  if (!car || car.available) return false;
  const soldAt = car.soldAt ? new Date(car.soldAt) : null;
  if (!soldAt || Number.isNaN(soldAt.getTime())) return false;
  return soldAt >= soldGraceCutoffDate(now);
}

export function isPublicDetailVisible(car, now = new Date()) {
  return Boolean(car?.available) || isInSoldGracePeriod(car, now);
}

export function canAcceptListingEnquiry(car, now = new Date()) {
  return isPublicDetailVisible(car, now);
}

/** Whole days left on the public site (0 = removes on next crawl/view). */
export function daysRemainingOnSite(car, now = new Date()) {
  if (!car?.soldAt || car.available) return null;
  const soldAt = new Date(car.soldAt);
  if (Number.isNaN(soldAt.getTime())) return null;
  const endsAt = soldAt.getTime() + SOLD_GRACE_MS;
  const msLeft = endsAt - now.getTime();
  if (msLeft <= 0) return 0;
  return Math.ceil(msLeft / (24 * 60 * 60 * 1000));
}

export function publicDetailVisibilityClause(now = new Date()) {
  const cutoff = soldGraceCutoffDate(now);
  return {
    OR: [{ available: true }, { available: false, soldAt: { gte: cutoff } }],
  };
}

export function availabilityUpdateData(available) {
  return available
    ? { available: true, soldAt: null }
    : { available: false, soldAt: new Date() };
}
