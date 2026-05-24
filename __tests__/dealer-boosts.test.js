import {
  DEALER_BOOST_TYPES,
  EARLY_ACCESS_BOOST_DEFAULTS,
  getBoostType,
} from "@/lib/dealer-boosts";

describe("dealer-boosts", () => {
  it("maps known boost type ids", () => {
    expect(getBoostType("spotlight_7d")?.durationDays).toBe(7);
    expect(getBoostType("spotlight_30d")?.balanceField).toBe("spotlight30d");
    expect(getBoostType("hot_badge_7d")?.needsCar).toBe(true);
    expect(getBoostType("dealer_lift_14d")?.needsCar).toBe(false);
    expect(getBoostType("unknown")).toBeUndefined();
  });

  it("defines early access starter credits", () => {
    expect(EARLY_ACCESS_BOOST_DEFAULTS.spotlight7d).toBeGreaterThan(0);
    expect(EARLY_ACCESS_BOOST_DEFAULTS.hotBadge7d).toBeGreaterThan(0);
    expect(EARLY_ACCESS_BOOST_DEFAULTS.dealerLift14d).toBeGreaterThan(0);
  });

  it("lists portal-applicable boost types", () => {
    const ids = Object.keys(DEALER_BOOST_TYPES);
    expect(ids).toEqual(
      expect.arrayContaining([
        "spotlight_7d",
        "spotlight_30d",
        "hot_badge_7d",
        "dealer_lift_14d",
      ])
    );
  });
});
