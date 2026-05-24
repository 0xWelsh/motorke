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

  it("balances seven cards as 4 + centered 3", () => {
    const { getItemClass } = getSpotlightGridLayout(7);
    expect(getItemClass(0)).toContain("lg:col-span-3");
    expect(getItemClass(4)).toContain("lg:col-start-2");
    expect(getItemClass(6)).toContain("lg:col-start-8");
  });
});
