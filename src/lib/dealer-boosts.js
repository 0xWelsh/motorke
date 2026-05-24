/**
 * Dealer portal boosts (Spotlight, Hot badge, Dealer lift).
 * Billing/paywall hooks in via DEALER_BILLING_ACTIVE and balance checks.
 */

import { db } from "@/lib/db";
import {
  DEALER_BILLING_ACTIVE,
  DEALER_BOOST_ADDONS,
  getDealerListingPlan,
  suggestPlanForLiveCount,
} from "@/lib/dealer-pricing";
import { hotBadgeActivationData } from "@/lib/hot-badge";
import { isActiveSpotlight } from "@/lib/spotlight";

/** Browse ranking bump while Dealer lift is active. */
export const DEALER_LIFT_BOOST_SCORE = 15;

/** Generous starter credits during early access (no M-Pesa yet). */
export const EARLY_ACCESS_BOOST_DEFAULTS = {
  spotlight7d: 10,
  spotlight30d: 2,
  hotBadge7d: 20,
  dealerLift14d: 3,
};

/** @typedef {'spotlight_7d' | 'spotlight_30d' | 'hot_badge_7d' | 'dealer_lift_14d'} DealerBoostTypeId */

export const DEALER_BOOST_TYPES = {
  spotlight_7d: {
    id: "spotlight_7d",
    label: "Spotlight",
    durationDays: 7,
    balanceField: "spotlight7d",
    needsCar: true,
  },
  spotlight_30d: {
    id: "spotlight_30d",
    label: "Spotlight",
    durationDays: 30,
    balanceField: "spotlight30d",
    needsCar: true,
  },
  hot_badge_7d: {
    id: "hot_badge_7d",
    label: "Hot badge",
    durationDays: 7,
    balanceField: "hotBadge7d",
    needsCar: true,
  },
  dealer_lift_14d: {
    id: "dealer_lift_14d",
    label: "Dealer lift",
    durationDays: 14,
    balanceField: "dealerLift14d",
    needsCar: false,
  },
};

/**
 * @param {string} typeId
 * @returns {typeof DEALER_BOOST_TYPES[keyof typeof DEALER_BOOST_TYPES] | undefined}
 */
export function getBoostType(typeId) {
  return DEALER_BOOST_TYPES[typeId];
}

/**
 * @param {string} dealerId
 */
export async function countActiveSpotlights(dealerId) {
  const now = new Date();
  return db.car.count({
    where: {
      dealerId,
      available: true,
      spotlightUntil: { gt: now },
    },
  });
}

/**
 * Plan limits from live inventory (subscription plan mapping comes later).
 * @param {string} dealerId
 */
export async function getDealerBoostLimits(dealerId) {
  const liveCount = await db.car.count({
    where: { dealerId, available: true },
  });
  const planId = suggestPlanForLiveCount(liveCount);
  const plan = getDealerListingPlan(planId);
  return {
    planId,
    planName: plan?.name ?? "Basic",
    maxConcurrentSpotlight: plan?.maxConcurrentSpotlight ?? 2,
  };
}

/**
 * @param {string} dealerId
 */
export async function getOrCreateBoostBalance(dealerId) {
  let balance = await db.dealerBoostBalance.findUnique({ where: { dealerId } });
  if (!balance) {
    balance = await db.dealerBoostBalance.create({
      data: {
        dealerId,
        ...EARLY_ACCESS_BOOST_DEFAULTS,
      },
    });
  }
  return balance;
}

/**
 * Lazy-clear expired dealer lift boost score.
 * @param {string} dealerId
 */
export async function syncExpiredDealerLift(dealerId) {
  const dealer = await db.dealer.findUnique({
    where: { id: dealerId },
    select: { dealerLiftUntil: true, boostScore: true },
  });
  if (!dealer?.dealerLiftUntil) return;
  if (new Date(dealer.dealerLiftUntil).getTime() > Date.now()) return;
  if (dealer.boostScore === DEALER_LIFT_BOOST_SCORE) {
    await db.dealer.update({
      where: { id: dealerId },
      data: { boostScore: 0, dealerLiftUntil: null },
    });
  }
}

/**
 * @param {string} dealerId
 */
export async function isDealerLiftActive(dealerId) {
  await syncExpiredDealerLift(dealerId);
  const dealer = await db.dealer.findUnique({
    where: { id: dealerId },
    select: { dealerLiftUntil: true },
  });
  if (!dealer?.dealerLiftUntil) return false;
  return new Date(dealer.dealerLiftUntil).getTime() > Date.now();
}

/**
 * @param {string} dealerId
 */
export async function getDealerBoostStatus(dealerId) {
  await syncExpiredDealerLift(dealerId);

  const [balance, limits, activeSpotlights, dealer, recentEvents] = await Promise.all([
    getOrCreateBoostBalance(dealerId),
    getDealerBoostLimits(dealerId),
    countActiveSpotlights(dealerId),
    db.dealer.findUnique({
      where: { id: dealerId },
      select: { dealerLiftUntil: true, boostScore: true },
    }),
    db.listingBoostEvent.findMany({
      where: { dealerId },
      orderBy: { createdAt: "desc" },
      take: 12,
      include: {
        car: { select: { id: true, make: true, model: true, year: true } },
      },
    }),
  ]);

  const dealerLiftActive =
    dealer?.dealerLiftUntil &&
    new Date(dealer.dealerLiftUntil).getTime() > Date.now();

  return {
    billingActive: DEALER_BILLING_ACTIVE,
    balance: {
      spotlight7d: balance.spotlight7d,
      spotlight30d: balance.spotlight30d,
      hotBadge7d: balance.hotBadge7d,
      dealerLift14d: balance.dealerLift14d,
    },
    limits,
    activeSpotlights,
    dealerLiftUntil: dealerLiftActive ? dealer.dealerLiftUntil : null,
    addons: DEALER_BOOST_ADDONS.filter((a) => a.id !== "spotlight_5pack" && a.id !== "showroom_highlight_30d"),
    recentEvents: recentEvents.map((e) => ({
      id: e.id,
      boostType: e.boostType,
      days: e.days,
      endsAt: e.endsAt,
      createdAt: e.createdAt,
      car: e.car,
    })),
  };
}

/**
 * Extend spotlight from current end or now.
 * @param {Date | null} currentUntil
 * @param {number} days
 */
function extendedSpotlightData(currentUntil, days) {
  const now = new Date();
  const base =
    currentUntil && new Date(currentUntil).getTime() > now.getTime()
      ? new Date(currentUntil)
      : now;
  const until = new Date(base);
  until.setUTCDate(until.getUTCDate() + days);
  return {
    spotlightUntil: until,
    featuredWeight: 40,
  };
}

/**
 * @param {{ dealerId: string, carId?: string, type: string }}
 */
export async function applyDealerBoost({ dealerId, carId, type }) {
  const boostType = getBoostType(type);
  if (!boostType) {
    return { ok: false, error: "Unknown boost type", status: 400 };
  }

  if (boostType.needsCar && !carId) {
    return { ok: false, error: "Select a vehicle for this boost", status: 400 };
  }

  const balance = await getOrCreateBoostBalance(dealerId);
  const limits = await getDealerBoostLimits(dealerId);
  const field = boostType.balanceField;
  const credits = balance[field];

  if (DEALER_BILLING_ACTIVE && credits < 1) {
    return {
      ok: false,
      error: "No credits left for this boost. Buy an add-on or upgrade your plan.",
      status: 402,
    };
  }

  let car = null;
  if (boostType.needsCar) {
    car = await db.car.findUnique({
      where: { id: carId },
      select: {
        id: true,
        dealerId: true,
        available: true,
        spotlightUntil: true,
        hotBadgeUntil: true,
        badges: true,
        make: true,
        model: true,
        year: true,
      },
    });

    if (!car || car.dealerId !== dealerId) {
      return { ok: false, error: "Vehicle not found", status: 404 };
    }
    if (!car.available) {
      return { ok: false, error: "Only live listings can be boosted", status: 400 };
    }

    if (type === "spotlight_7d" || type === "spotlight_30d") {
      const active = await countActiveSpotlights(dealerId);
      const alreadyActive = isActiveSpotlight(car);
      if (!alreadyActive && active >= limits.maxConcurrentSpotlight) {
        return {
          ok: false,
          error: `You can run up to ${limits.maxConcurrentSpotlight} Spotlights at once on your plan.`,
          status: 400,
        };
      }
    }

    if (type === "dealer_lift_14d") {
      return { ok: false, error: "Dealer lift does not use a vehicle", status: 400 };
    }
  }

  const now = new Date();
  let endsAt;
  let updatedCar = null;
  let updatedDealer = null;

  if (type === "spotlight_7d" || type === "spotlight_30d") {
    const days = boostType.durationDays;
    const data = extendedSpotlightData(car.spotlightUntil, days);
    endsAt = data.spotlightUntil;
    updatedCar = await db.car.update({
      where: { id: car.id },
      data,
      select: {
        id: true,
        make: true,
        model: true,
        year: true,
        spotlightUntil: true,
        hotBadgeUntil: true,
      },
    });
  } else if (type === "hot_badge_7d") {
    const days = 7;
    const data = hotBadgeActivationData(days, car.badges, car.hotBadgeUntil);
    endsAt = data.hotBadgeUntil;
    updatedCar = await db.car.update({
      where: { id: car.id },
      data,
      select: {
        id: true,
        make: true,
        model: true,
        year: true,
        spotlightUntil: true,
        hotBadgeUntil: true,
      },
    });
  } else if (type === "dealer_lift_14d") {
    const existing = await db.dealer.findUnique({
      where: { id: dealerId },
      select: { dealerLiftUntil: true },
    });
    const base =
      existing?.dealerLiftUntil &&
      new Date(existing.dealerLiftUntil).getTime() > now.getTime()
        ? new Date(existing.dealerLiftUntil)
        : now;
    endsAt = new Date(base);
    endsAt.setUTCDate(endsAt.getUTCDate() + 14);

    updatedDealer = await db.dealer.update({
      where: { id: dealerId },
      data: {
        dealerLiftUntil: endsAt,
        boostScore: DEALER_LIFT_BOOST_SCORE,
      },
      select: { id: true, dealerLiftUntil: true, boostScore: true },
    });
  }

  const charged = DEALER_BILLING_ACTIVE;

  if (charged) {
    await db.dealerBoostBalance.update({
      where: { dealerId },
      data: { [field]: { decrement: 1 } },
    });
  }

  await db.listingBoostEvent.create({
    data: {
      dealerId,
      carId: car?.id ?? null,
      boostType: type,
      days: boostType.durationDays,
      endsAt,
      source: "portal",
      charged,
    },
  });

  const newBalance = await getOrCreateBoostBalance(dealerId);

  return {
    ok: true,
    car: updatedCar,
    dealer: updatedDealer,
    endsAt,
    balance: {
      spotlight7d: newBalance.spotlight7d,
      spotlight30d: newBalance.spotlight30d,
      hotBadge7d: newBalance.hotBadge7d,
      dealerLift14d: newBalance.dealerLift14d,
    },
  };
}
