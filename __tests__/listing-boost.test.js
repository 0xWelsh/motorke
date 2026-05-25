import {
  activeListingBoostWhere,
  isActiveListingBoost,
} from "@/lib/listing-boost";

describe("listing-boost", () => {
  const now = new Date("2026-06-01T00:00:00Z");
  const future = new Date("2026-12-01T00:00:00Z");
  const past = new Date("2020-01-01T00:00:00Z");

  it("detects spotlight or hot badge", () => {
    expect(isActiveListingBoost({ spotlightUntil: future }, now)).toBe(true);
    expect(isActiveListingBoost({ hotBadgeUntil: future }, now)).toBe(true);
    expect(isActiveListingBoost({ spotlightUntil: past, hotBadgeUntil: past }, now)).toBe(
      false
    );
  });

  it("activeListingBoostWhere matches either boost field", () => {
    expect(activeListingBoostWhere(now)).toEqual({
      available: true,
      OR: [{ spotlightUntil: { gt: now } }, { hotBadgeUntil: { gt: now } }],
    });
  });
});
