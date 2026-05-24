import {
  hotBadgeActivationData,
  hotBadgeUntilFromDays,
  isActiveHotBadge,
} from "@/lib/hot-badge";

describe("hot-badge", () => {
  it("detects active hot badge by until date", () => {
    const future = new Date(Date.now() + 86400000);
    expect(isActiveHotBadge({ hotBadgeUntil: future })).toBe(true);
    expect(isActiveHotBadge({ hotBadgeUntil: new Date("2020-01-01") })).toBe(false);
    expect(isActiveHotBadge({})).toBe(false);
  });

  it("builds activation payload with HOT badge", () => {
    const data = hotBadgeActivationData(7, ["Low mileage"]);
    expect(data.hotBadgeUntil).toBeInstanceOf(Date);
    expect(data.badges).toContain("HOT");
    expect(data.badges).toContain("Low mileage");
    expect(hotBadgeUntilFromDays(7).getTime()).toBeGreaterThan(Date.now());
  });

  it("extends from current until when still active", () => {
    const current = new Date(Date.now() + 3 * 86400000);
    const data = hotBadgeActivationData(7, [], current);
    expect(data.hotBadgeUntil.getTime()).toBeGreaterThan(current.getTime());
  });
});
