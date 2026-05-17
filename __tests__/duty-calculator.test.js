/** @jest-environment node */

import { calculateDutyBreakdown, getAgeYearsFromYear } from "@/lib/duty";

describe("duty calculator engine", () => {
  test("returns positive tax breakdown for typical SUV CRSP", () => {
    const ageYears = getAgeYearsFromYear(2018);
    const result = calculateDutyBreakdown({
      cifKes: 3_200_000 + 2750 * 135,
      ageYears,
      engineCC: 2200,
      isElectric: false,
    });

    expect(result.customsValue).toBeGreaterThan(0);
    expect(result.total).toBeGreaterThan(0);
    expect(result.vat).toBeGreaterThan(0);
    expect(result.excise).toBeGreaterThan(0);
    expect(result.landed).toBeGreaterThan(result.total);
  });
});
