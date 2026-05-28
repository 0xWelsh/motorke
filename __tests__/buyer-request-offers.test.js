import {
  getNairobiDayBounds,
  hasActiveBuyerRequestPass,
  subscriptionGrantsUnlimitedOffers,
} from "@/lib/buyer-request-offers";

describe("buyer-request-offers", () => {
  it("computes Nairobi day bounds in EAT (UTC+3)", () => {
    const now = new Date("2026-05-27T12:00:00.000Z");
    const { start, end } = getNairobiDayBounds(now);
    expect(start.toISOString()).toBe("2026-05-26T21:00:00.000Z");
    expect(end.toISOString()).toBe("2026-05-27T20:59:59.999Z");
    const middayNairobi = new Date("2026-05-27T09:00:00+03:00");
    expect(middayNairobi >= start && middayNairobi <= end).toBe(true);
  });

  it("detects active buyer request pass", () => {
    const future = new Date(Date.now() + 86400000);
    expect(hasActiveBuyerRequestPass(future)).toBe(true);
    expect(hasActiveBuyerRequestPass(new Date("2020-01-01"))).toBe(false);
  });

  it("grants unlimited for active PRO subscription", () => {
    expect(subscriptionGrantsUnlimitedOffers({ plan: "PRO", status: "ACTIVE" })).toBe(true);
    expect(subscriptionGrantsUnlimitedOffers({ plan: "FREE", status: "ACTIVE" })).toBe(false);
    expect(subscriptionGrantsUnlimitedOffers({ plan: "PRO", status: "EXPIRED" })).toBe(false);
  });
});
