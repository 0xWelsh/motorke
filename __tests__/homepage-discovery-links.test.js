import {
  HOMEPAGE_BODY_LINKS,
  HOMEPAGE_BUDGET_LINKS,
  HOMEPAGE_COUNTY_LINKS,
  HOMEPAGE_FUEL_LINKS,
  HOMEPAGE_POPULAR_LINKS,
  HOMEPAGE_POPULAR_SUV_LINKS,
} from "@/lib/homepage-discovery-links";

describe("homepage-discovery-links", () => {
  it("exposes all budget hub paths", () => {
    expect(HOMEPAGE_BUDGET_LINKS[0].href).toBe("/cars/price-under-1m");
    expect(HOMEPAGE_BUDGET_LINKS).toHaveLength(6);
    expect(HOMEPAGE_BUDGET_LINKS.some((l) => l.href === "/cars/price-over-10m")).toBe(true);
  });

  it("exposes body hub and query paths", () => {
    expect(HOMEPAGE_BODY_LINKS.find((l) => l.label === "SUV")?.href).toBe(
      "/cars/suvs-for-sale-kenya",
    );
    expect(HOMEPAGE_BODY_LINKS.find((l) => l.label === "Hatchback")?.href).toBe(
      "/cars?bodyType=HATCHBACK",
    );
    expect(HOMEPAGE_BODY_LINKS.length).toBeGreaterThanOrEqual(14);
  });

  it("exposes fuel and county filters", () => {
    expect(HOMEPAGE_FUEL_LINKS.find((l) => l.label === "Diesel")?.href).toBe(
      "/cars?fuelType=DIESEL",
    );
    expect(HOMEPAGE_COUNTY_LINKS.find((l) => l.label === "Nairobi")?.href).toBe("/cars/nairobi");
  });

  it("exposes grouped popular shortcuts", () => {
    expect(HOMEPAGE_POPULAR_SUV_LINKS).toHaveLength(3);
    expect(HOMEPAGE_POPULAR_LINKS.some((l) => l.href === "/cars/suvs-under-3-million")).toBe(
      true,
    );
    expect(HOMEPAGE_POPULAR_LINKS.some((l) => l.href === "/cars?sort=newest")).toBe(true);
  });
});
