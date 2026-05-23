import {
  HOMEPAGE_BODY_LINKS,
  HOMEPAGE_BUDGET_LINKS,
} from "@/lib/homepage-discovery-links";

describe("homepage-discovery-links", () => {
  it("exposes budget hub paths", () => {
    expect(HOMEPAGE_BUDGET_LINKS[0].href).toBe("/cars/price-under-1m");
    expect(HOMEPAGE_BUDGET_LINKS).toHaveLength(4);
  });

  it("exposes body hub paths", () => {
    expect(HOMEPAGE_BODY_LINKS.find((l) => l.label === "SUV")?.href).toBe(
      "/cars/suvs-for-sale-kenya",
    );
  });
});
