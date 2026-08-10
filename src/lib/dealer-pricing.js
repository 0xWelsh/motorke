/**
 * Dealer listing plans, included boosts, and add-on boost prices (KES).
 * Used by dealer-facing docs and pricing pages.
 */

/** @typedef {'basic' | 'standard' | 'business' | 'enterprise'} DealerPlanId */

/**
 * @typedef {Object} DealerListingPlan
 * @property {DealerPlanId} id
 * @property {string} name
 * @property {string} tagline
 * @property {number} liveListingCap
 * @property {{ monthly: number, months3: number, months6: number }} pricing
 * @property {{ spotlight7dPerMonth: number, dealerLift14dPerMonth: number }} boostsIncluded
 * @property {number} maxConcurrentSpotlight
 */

/** Free buyer-request offers per dealer per Nairobi calendar day (see buyer-request-offers.js). */
export const BUYER_REQUEST_FREE_OFFERS_PER_DAY = 1;

/** Monthly add-on: unlimited offers on /requests (sets dealer.buyerRequestPassUntil). */
export const BUYER_REQUEST_MONTHLY_PASS = {
  id: "buyer_requests_monthly",
  name: "Buyer requests pass",
  durationDays: 30,
  price: 2999,
  description:
    "Unlimited Send offer clicks on live buyer requests for 30 days. Stacks with listing plans that include requests.",
};

/** When billing is on, these listing plans include unlimited buyer-request offers. */
export const DEALER_PLANS_WITH_UNLIMITED_BUYER_OFFERS = ["standard", "business", "enterprise"];

/** When true, M-Pesa checkout, caps, and boost purchases are enabled. */
export const DEALER_BILLING_ACTIVE = false;

/** Pricing visible; no charges until {@link DEALER_BILLING_ACTIVE} is true. */
export const DEALER_PRICING_EARLY_ACCESS = !DEALER_BILLING_ACTIVE;

export const DEALER_INCLUDED_EVERY_PLAN = [
  "Dealer profile and showroom page",
  "Inventory portal and lead inbox",
  "WhatsApp and call routing to your number",
  "Search and discovery on BIDGARI",
  "No commission on vehicle sales",
];

export const DEALER_BILLING_FAQ = [
  {
    q: "When will I be charged?",
    a: "Not until we turn billing on and email you first. This page is for reference during early access.",
  },
  {
    q: "What counts toward my live listing cap?",
    a: "Cars marked available on the site. Mark a car sold when it leaves the yard to free a slot.",
  },
  {
    q: "How do free boosts work?",
    a: "Each billing month your plan includes Spotlight and (on Enterprise) Dealer lift credits. Use them in the portal on the cars you choose. Unused credits do not roll over unless we say otherwise.",
  },
  {
    q: "Can I buy extra boosts?",
    a: "Yes, at the add-on prices below, after you have used your included credits for that month.",
  },
];

export const DEALER_LISTING_PLANS = [
  {
    id: "basic",
    name: "Basic",
    tagline: "Small yard or broker",
    liveListingCap: 50,
    pricing: { monthly: 3999, months3: 10999, months6: 19999 },
    boostsIncluded: { spotlight7dPerMonth: 0, dealerLift14dPerMonth: 0 },
    maxConcurrentSpotlight: 2,
  },
  {
    id: "standard",
    name: "Standard",
    tagline: "Established single-branch dealer",
    liveListingCap: 150,
    pricing: { monthly: 9999, months3: 27499, months6: 49999 },
    boostsIncluded: { spotlight7dPerMonth: 1, dealerLift14dPerMonth: 0 },
    maxConcurrentSpotlight: 3,
  },
  {
    id: "business",
    name: "Business",
    tagline: "Busy showroom or strong multi-line stock",
    liveListingCap: 250,
    pricing: { monthly: 14999, months3: 41499, months6: 74999 },
    boostsIncluded: { spotlight7dPerMonth: 2, dealerLift14dPerMonth: 0 },
    maxConcurrentSpotlight: 5,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "Large importer or multi-branch",
    liveListingCap: 500,
    pricing: { monthly: 22999, months3: 63499, months6: 114999 },
    boostsIncluded: { spotlight7dPerMonth: 4, dealerLift14dPerMonth: 1 },
    maxConcurrentSpotlight: 10,
  },
];

/** Add-on boost SKUs when included credits are used up. */
export const DEALER_BOOST_ADDONS = [
  {
    id: "hot_badge_7d",
    name: "Hot badge",
    durationLabel: "7 days",
    description: "Orange outline and badge on one listing in browse.",
    price: 299,
  },
  {
    id: "spotlight_7d",
    name: "Spotlight",
    durationLabel: "7 days",
    description: "Red outline and badge on your listing, plus higher rank in browse and search.",
    price: 799,
  },
  {
    id: "spotlight_30d",
    name: "Spotlight",
    durationLabel: "30 days",
    description: "Same visibility boost for one vehicle, longer run.",
    price: 2499,
  },
  {
    id: "spotlight_5pack",
    name: "Spotlight 5-pack",
    durationLabel: "5 × 7 days",
    description: "Five separate 7-day spotlights on any five cars.",
    price: 3499,
  },
  {
    id: "dealer_lift_14d",
    name: "Dealer lift",
    durationLabel: "14 days",
    description: "Visibility lift for your whole showroom.",
    price: 1999,
  },
  {
    id: BUYER_REQUEST_MONTHLY_PASS.id,
    name: BUYER_REQUEST_MONTHLY_PASS.name,
    durationLabel: "30 days",
    description: BUYER_REQUEST_MONTHLY_PASS.description,
    price: BUYER_REQUEST_MONTHLY_PASS.price,
  },
  {
    id: "showroom_highlight_30d",
    name: "Showroom highlight",
    durationLabel: "30 days",
    description: "Extra prominence on your showroom and corridor pages.",
    price: 4999,
  },
];

export const DEALER_HOMEPAGE_FEATURED_PRICE = 29999;

/**
 * @param {number} amount
 * @returns {string}
 */
export function formatKes(amount) {
  return `KES ${Number(amount).toLocaleString("en-KE")}`;
}

/**
 * @param {DealerListingPlan} plan
 * @returns {string} Human-readable included boosts for tables.
 */
export function formatBoostsIncluded(plan) {
  const parts = [];
  const { spotlight7dPerMonth, dealerLift14dPerMonth } = plan.boostsIncluded;

  if (spotlight7dPerMonth > 0) {
    parts.push(
      `${spotlight7dPerMonth}× Spotlight (7d)`,
    );
  }
  if (dealerLift14dPerMonth > 0) {
    parts.push(
      `${dealerLift14dPerMonth}× Dealer lift (14d)`,
    );
  }

  if (parts.length === 0) {
    return "—";
  }
  return parts.join(" · ");
}

/**
 * @param {DealerPlanId} planId
 * @returns {DealerListingPlan | undefined}
 */
export function getDealerListingPlan(planId) {
  return DEALER_LISTING_PLANS.find((p) => p.id === planId);
}

/**
 * @param {DealerListingPlan} plan
 * @returns {number} Whole KES saved vs 3× monthly.
 */
export function getPrepaid3MonthSavings(plan) {
  return Math.max(0, plan.pricing.monthly * 3 - plan.pricing.months3);
}

/**
 * @param {DealerListingPlan} plan
 * @returns {number} Whole KES saved vs 6× monthly.
 */
export function getPrepaid6MonthSavings(plan) {
  return Math.max(0, plan.pricing.monthly * 6 - plan.pricing.months6);
}

/**
 * @param {DealerListingPlan} plan
 * @returns {number} Rounded KES per live slot at monthly rate.
 */
export function getCostPerLiveSlot(plan) {
  return Math.round(plan.pricing.monthly / plan.liveListingCap);
}

/**
 * Suggested plan id from current live inventory count.
 * @param {number} liveCount
 * @returns {DealerPlanId}
 */
export function suggestPlanForLiveCount(liveCount) {
  if (liveCount <= 50) return "basic";
  if (liveCount <= 150) return "standard";
  if (liveCount <= 250) return "business";
  return "enterprise";
}
