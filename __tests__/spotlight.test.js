import {
  activeSpotlightWhere,
  isActiveSpotlight,
  spotlightActivationData,
  spotlightUntilFromDays,
} from "@/lib/spotlight";

describe("spotlight", () => {
  it("detects active spotlight by until date", () => {
    const future = new Date(Date.now() + 86400000);
    expect(isActiveSpotlight({ spotlightUntil: future })).toBe(true);
    expect(isActiveSpotlight({ spotlightUntil: new Date("2020-01-01") })).toBe(false);
    expect(isActiveSpotlight({})).toBe(false);
  });

  it("builds activation payload with browse weight", () => {
    const data = spotlightActivationData(7);
    expect(data.featuredWeight).toBe(40);
    expect(data.spotlightUntil).toBeInstanceOf(Date);
    expect(spotlightUntilFromDays(7).getTime()).toBeGreaterThan(Date.now());
  });

  it("activeSpotlightWhere requires future until", () => {
    const now = new Date("2026-06-01T00:00:00Z");
    expect(activeSpotlightWhere(now)).toEqual({
      available: true,
      spotlightUntil: { gt: now },
    });
  });
});
