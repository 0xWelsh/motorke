import {
  buildCarsOrderBy,
  normalizeCarsSort,
  isExplicitCarsSort,
  CARS_SORT_DEFAULT,
} from "@/lib/cars-inventory-sort";

describe("cars-inventory-sort", () => {
  it("normalizes unknown sort to default", () => {
    expect(normalizeCarsSort("")).toBe(CARS_SORT_DEFAULT);
    expect(normalizeCarsSort("bogus")).toBe(CARS_SORT_DEFAULT);
  });

  it("treats non-default sorts as explicit", () => {
    expect(isExplicitCarsSort("newest")).toBe(false);
    expect(isExplicitCarsSort("oldest")).toBe(true);
    expect(isExplicitCarsSort("price_desc")).toBe(true);
  });

  it("builds orderBy for date and price", () => {
    expect(buildCarsOrderBy("oldest")).toEqual([{ createdAt: "asc" }]);
    expect(buildCarsOrderBy("price_desc")).toEqual([{ price: "desc" }]);
    expect(buildCarsOrderBy("views_desc")).toEqual([
      { views: "desc" },
      { createdAt: "desc" },
    ]);
  });
});
