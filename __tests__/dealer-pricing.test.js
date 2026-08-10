import {
  DEALER_BILLING_ACTIVE,
  DEALER_LISTING_PLANS,
  DEALER_PRICING_EARLY_ACCESS,
  formatBoostsIncluded,
  formatKes,
  getDealerListingPlan,
  getPrepaid6MonthSavings,
  suggestPlanForLiveCount,
} from "@/lib/dealer-pricing";

describe("dealer-pricing", () => {
  it("formats KES with en-KE grouping", () => {
    expect(formatKes(3999)).toBe("KES 3,999");
  });

  it("formats boosts included per plan", () => {
    expect(formatBoostsIncluded(getDealerListingPlan("basic"))).toBe("—");
    expect(formatBoostsIncluded(getDealerListingPlan("standard"))).toBe(
      "1× Spotlight (7d)",
    );
    expect(formatBoostsIncluded(getDealerListingPlan("enterprise"))).toBe(
      "4× Spotlight (7d) · 1× Dealer lift (14d)",
    );
  });

  it("defines boosts for standard and above", () => {
    const standard = DEALER_LISTING_PLANS.find((p) => p.id === "standard");
    expect(standard?.boostsIncluded.spotlight7dPerMonth).toBe(1);
    const business = DEALER_LISTING_PLANS.find((p) => p.id === "business");
    expect(business?.boostsIncluded.spotlight7dPerMonth).toBe(2);
  });

  it("keeps billing inactive for early access preview", () => {
    expect(DEALER_BILLING_ACTIVE).toBe(false);
    expect(DEALER_PRICING_EARLY_ACCESS).toBe(true);
  });

  it("calculates 6-month savings for standard", () => {
    const standard = getDealerListingPlan("standard");
    expect(getPrepaid6MonthSavings(standard)).toBe(9995);
  });

  it("suggests plan from live count", () => {
    expect(suggestPlanForLiveCount(40)).toBe("basic");
    expect(suggestPlanForLiveCount(120)).toBe("standard");
    expect(suggestPlanForLiveCount(400)).toBe("enterprise");
  });
});
