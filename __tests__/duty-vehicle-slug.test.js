/** @jest-environment node */

import { buildDutyVehicleSlug, dutyVehiclePathSlug, normalizeDutySlug } from "@/lib/duty-vehicle-slug";

describe("duty vehicle slugs", () => {
  test("buildDutyVehicleSlug matches seed order (make-model-trim-year)", () => {
    expect(
      buildDutyVehicleSlug({
        make: "Mercedes-Benz",
        model: "C-Class",
        trim: "C200",
        year: 2016,
      }),
    ).toBe("mercedes-benz-c-class-c200-2016");
    expect(buildDutyVehicleSlug({ make: "Mazda", model: "CX-5", year: 2019 })).toBe("mazda-cx-5-2019");
  });

  test("normalizeDutySlug decodes and lowercases", () => {
    expect(normalizeDutySlug("Mazda-CX-5-2019")).toBe("mazda-cx-5-2019");
    expect(normalizeDutySlug("mazda-cx-5-2019")).toBe("mazda-cx-5-2019");
  });

  test("dutyVehiclePathSlug prefers computed slug over stale column", () => {
    expect(
      dutyVehiclePathSlug({
        make: "Toyota",
        model: "Prado",
        trim: "TX",
        year: 2018,
        slug: "stale-or-wrong-slug",
      }),
    ).toBe("toyota-prado-tx-2018");
  });
});
