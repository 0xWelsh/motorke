/**
 * Date-gated seasonal promos (modal + optional FAB when minimized).
 * Add entries here for future holidays — only the first active promo is shown.
 * No permanent dismiss: promo disappears when `endsAt` passes.
 */

/** @typedef {{ id: string, image: string, alt: string, href: string, startsAt: string, endsAt: string, fabLabel: string }} SeasonalPromo */

/** @type {SeasonalPromo[]} */
export const SEASONAL_PROMOS = [
  {
    id: "eid-al-adha-2026",
    image: "/images/promos/eid-mubarak-2026.png",
    alt: "Eid Mubarak from Welsh Motorhub — explore verified cars in Kenya",
    href: "/cars",
    startsAt: "2026-05-27",
    endsAt: "2026-05-31",
    fabLabel: "Eid Mubarak",
  },
];

function parseDay(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/**
 * @param {Date} [now]
 * @returns {SeasonalPromo | null}
 */
export function getActiveSeasonalPromo(now = new Date()) {
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  for (const promo of SEASONAL_PROMOS) {
    const start = parseDay(promo.startsAt);
    const end = parseDay(promo.endsAt);
    if (today >= start && today <= end) return promo;
  }
  return null;
}

export function seasonalPromoStorageKey(promoId) {
  return `motorke:seasonal-promo:${promoId}`;
}
