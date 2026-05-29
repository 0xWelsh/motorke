import { resolveBrandInventoryCount } from "@/lib/browse-inventory-counts";

describe("browse-inventory-counts", () => {
  it("merges Mercedes-Benz alias makes into one brand count", () => {
    const map = {
      "mercedes-benz": 5,
      mercedes: 2,
      toyota: 10,
    };
    expect(
      resolveBrandInventoryCount({ name: "Mercedes", make: "Mercedes-Benz" }, map)
    ).toBe(7);
    expect(resolveBrandInventoryCount({ name: "Toyota" }, map)).toBe(10);
  });
});
