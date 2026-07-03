/**
 * Dealer offer limits on buyer request board — 1 free offer per Nairobi calendar day,
 * unlimited with active PRO subscription or buyer-request pass (monthly add-on).
 */

import { db } from "@/lib/db";
import { DEALER_BILLING_ACTIVE } from "@/lib/dealer-pricing";

export const BUYER_REQUEST_FREE_OFFERS_PER_DAY = 1;

const NAIROBI_TZ = "Africa/Nairobi";

/** @returns {{ start: Date, end: Date }} UTC instants for current calendar day in Nairobi (EAT, UTC+3). */
export function getNairobiDayBounds(now = new Date()) {
  const ymd = now.toLocaleDateString("en-CA", { timeZone: NAIROBI_TZ });
  return {
    start: new Date(`${ymd}T00:00:00+03:00`),
    end: new Date(`${ymd}T23:59:59.999+03:00`),
  };
}

/**
 * @param {Date | null | undefined} until
 */
export function hasActiveBuyerRequestPass(until) {
  if (!until) return false;
  return new Date(until).getTime() > Date.now();
}

/**
 * @param {{ plan?: string, status?: string } | null | undefined} subscription
 */
export function subscriptionGrantsUnlimitedOffers(subscription) {
  if (!subscription) return false;
  return subscription.plan === "PRO" && subscription.status === "ACTIVE";
}

/**
 * @param {string} dealerId
 */
export async function dealerHasUnlimitedBuyerOffers(dealerId) {
  const dealer = await db.dealer.findUnique({
    where: { id: dealerId },
    select: {
      buyerRequestPassUntil: true,
      subscription: { select: { plan: true, status: true } },
    },
  });
  if (!dealer) return false;
  if (hasActiveBuyerRequestPass(dealer.buyerRequestPassUntil)) return true;
  if (subscriptionGrantsUnlimitedOffers(dealer.subscription)) return true;
  return false;
}

/**
 * @param {string} dealerId
 * @param {Date} [now]
 */
export async function countDealerOffersToday(dealerId, now = new Date()) {
  const { start, end } = getNairobiDayBounds(now);
  return db.buyerRequestOffer.count({
    where: {
      dealerId,
      createdAt: { gte: start, lte: end },
    },
  });
}

/**
 * @param {string} dealerId
 * @param {string} buyerRequestId
 */
export async function findDealerOfferForRequest(dealerId, buyerRequestId) {
  return db.buyerRequestOffer.findUnique({
    where: {
      dealerId_buyerRequestId: { dealerId, buyerRequestId },
    },
  });
}

/**
 * @param {string} dealerId
 */
export async function getDealerOfferQuota(dealerId) {
  const unlimited = await dealerHasUnlimitedBuyerOffers(dealerId);
  const usedToday = unlimited ? 0 : await countDealerOffersToday(dealerId);
  const freeRemaining = unlimited
    ? null
    : Math.max(0, BUYER_REQUEST_FREE_OFFERS_PER_DAY - usedToday);

  return {
    unlimited,
    usedToday,
    freeRemaining,
    freePerDay: BUYER_REQUEST_FREE_OFFERS_PER_DAY,
    billingActive: DEALER_BILLING_ACTIVE,
    upgradeUrl: "/",
  };
}

/**
 * @param {string} dealerId
 * @returns {Promise<{ allowed: true } | { allowed: false, code: string, message: string, upgradeUrl: string }>}
 */
export async function assertDealerCanSendOffer(dealerId) {
  if (await dealerHasUnlimitedBuyerOffers(dealerId)) {
    return { allowed: true };
  }

  const used = await countDealerOffersToday(dealerId);
  if (used >= BUYER_REQUEST_FREE_OFFERS_PER_DAY) {
    return {
      allowed: false,
      code: "DAILY_LIMIT",
      message:
        "You have used your free buyer request offer for today. Upgrade to Standard plan or add a monthly Requests pass for unlimited offers.",
    upgradeUrl: "/",
    };
  }

  return { allowed: true };
}
