import {
  SOLD_GRACE_DAYS,
  daysRemainingOnSite,
  isInSoldGracePeriod,
  isPublicDetailVisible,
  publicDetailVisibilityClause,
} from "@/lib/car-sold-status";

describe("car-sold-status", () => {
  const now = new Date("2026-05-21T12:00:00.000Z");

  test("live car is public", () => {
    expect(isPublicDetailVisible({ available: true, soldAt: null }, now)).toBe(true);
    expect(isInSoldGracePeriod({ available: true, soldAt: now }, now)).toBe(false);
  });

  test("sold within grace stays public", () => {
    const soldAt = new Date("2026-05-20T12:00:00.000Z");
    const car = { available: false, soldAt };
    expect(isInSoldGracePeriod(car, now)).toBe(true);
    expect(isPublicDetailVisible(car, now)).toBe(true);
    expect(daysRemainingOnSite(car, now)).toBe(6);
  });

  test("sold after grace is hidden from public detail", () => {
    const soldAt = new Date("2026-05-01T12:00:00.000Z");
    const car = { available: false, soldAt };
    expect(isInSoldGracePeriod(car, now)).toBe(false);
    expect(isPublicDetailVisible(car, now)).toBe(false);
  });

  test("legacy unavailable without soldAt is hidden", () => {
    expect(isPublicDetailVisible({ available: false, soldAt: null }, now)).toBe(false);
  });

  test("visibility clause includes grace window", () => {
    expect(publicDetailVisibilityClause(now)).toEqual({
      OR: [
        { available: true },
        { available: false, soldAt: { gte: new Date(now.getTime() - SOLD_GRACE_DAYS * 86400000) } },
      ],
    });
  });
});
