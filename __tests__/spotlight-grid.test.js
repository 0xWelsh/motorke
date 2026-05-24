import { getSpotlightGridLayout } from "@/lib/spotlight-grid";

describe("spotlight-grid", () => {
  it("centers a single card", () => {
    const { gridClass } = getSpotlightGridLayout(1);
    expect(gridClass).toContain("grid-cols-1");
    expect(gridClass).toContain("mx-auto");
  });

  it("balances five cards as 3 + 2", () => {
    const { getItemClass } = getSpotlightGridLayout(5);
    expect(getItemClass(3)).toContain("col-start-2");
    expect(getItemClass(4)).toContain("col-start-4");
  });

  it("balances seven cards as 4 + centered 3 on desktop", () => {
    const { gridClass, getItemClass } = getSpotlightGridLayout(7);
    expect(gridClass).toContain("lg:grid-cols-4");
    expect(getItemClass(4)).toContain("lg:col-start-2");
    expect(getItemClass(6)).toContain("lg:col-start-4");
  });

  it("uses full shell width on desktop", () => {
    const { gridClass } = getSpotlightGridLayout(8);
    expect(gridClass).toContain("lg:max-w-none");
    expect(gridClass).toContain("lg:gap-6");
  });
});
