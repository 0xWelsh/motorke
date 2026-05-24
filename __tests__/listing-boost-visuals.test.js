import { getListingBoostVisuals } from "@/lib/listing-boost-visuals";

describe("listing-boost-visuals", () => {
  const future = new Date(Date.now() + 86400000).toISOString();

  it("returns neutral styles when no boost", () => {
    const v = getListingBoostVisuals({});
    expect(v.active).toBe(false);
    expect(v.cardBorderClass).toContain("slate");
  });

  it("applies red outline for spotlight", () => {
    const v = getListingBoostVisuals({ spotlightUntil: future });
    expect(v.spotlight).toBe(true);
    expect(v.cardBorderClass).toContain("red");
    expect(v.imageFrameClass).toContain("ring-red");
  });

  it("applies orange outline for hot badge", () => {
    const v = getListingBoostVisuals({ hotBadgeUntil: future });
    expect(v.hot).toBe(true);
    expect(v.cardBorderClass).toContain("orange");
  });

  it("uses prominent outline for homepage spotlight row", () => {
    const v = getListingBoostVisuals({ spotlightUntil: future }, { prominent: true });
    expect(v.cardBorderClass).toMatch(/orange.*\/\d+/);
    expect(v.imageFrameClass).toContain("ring-orange-400/30");
  });

  it("layers both when spotlight and hot are active", () => {
    const v = getListingBoostVisuals({
      spotlightUntil: future,
      hotBadgeUntil: future,
    });
    expect(v.spotlight && v.hot).toBe(true);
    expect(v.imageFrameClass).toContain("ring-red");
    expect(v.imageFrameClass).toContain("249,115,22");
  });
});
