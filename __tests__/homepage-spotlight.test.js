import {
  HOMEPAGE_SPOTLIGHT_COUNT,
  homepageSpotlightSeed,
  mergeHomepageSpotlight,
  pickHomepageSpotlightCars,
} from "@/lib/homepage-spotlight";

describe("homepage-spotlight", () => {
  const pool = Array.from({ length: 20 }, (_, i) => ({ id: `car-${i}` }));

  it("picks up to eight cars deterministically for a seed", () => {
    const seed = "test-seed";
    const a = pickHomepageSpotlightCars(pool, seed);
    const b = pickHomepageSpotlightCars(pool, seed);
    expect(a).toHaveLength(HOMEPAGE_SPOTLIGHT_COUNT);
    expect(a.map((c) => c.id)).toEqual(b.map((c) => c.id));
  });

  it("changes selection when the rotation seed changes", () => {
    const a = pickHomepageSpotlightCars(pool, "seed-a");
    const b = pickHomepageSpotlightCars(pool, "seed-b");
    expect(a.map((c) => c.id)).not.toEqual(b.map((c) => c.id));
  });

  it("prefers paid spotlight and fills remaining slots from rotation", () => {
    const paid = [{ id: "paid-1" }, { id: "paid-2" }];
    const rotated = [{ id: "paid-1" }, { id: "r-1" }, { id: "r-2" }, { id: "r-3" }];
    const merged = mergeHomepageSpotlight(paid, rotated, 4);
    expect(merged).toHaveLength(4);
    expect(merged[0].id).toBe("paid-1");
    expect(merged[1].id).toBe("paid-2");
    expect(merged.map((c) => c.id)).toEqual(["paid-1", "paid-2", "r-1", "r-2"]);
  });

  it("builds a time-based seed that changes every 30 minutes", () => {
    const start = new Date("2026-05-30T12:00:00.000Z").getTime();
    const later = new Date("2026-05-30T12:35:00.000Z").getTime();
    expect(homepageSpotlightSeed(start)).toMatch(/^homepage-spotlight:\d+:\d+$/);
    expect(homepageSpotlightSeed(start)).not.toBe(homepageSpotlightSeed(later));
  });
});
