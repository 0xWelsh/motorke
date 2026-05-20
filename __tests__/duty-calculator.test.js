/** @jest-environment node */

import { calculateDutyBreakdown, getAgeYearsFromYear, FREIGHT_PROXY_KES } from "@/lib/duty";

describe("duty calculator engine", () => {
  test("returns positive tax breakdown for typical SUV CRSP", () => {
    const ageYears = getAgeYearsFromYear(2018);
    const result = calculateDutyBreakdown({
      cifKes: 3_200_000 + FREIGHT_PROXY_KES,
      ageYears,
      engineCC: 2200,
      isElectric: false,
    });

    expect(result.customsValue).toBeGreaterThan(0);
    expect(result.importDuty).toBeGreaterThan(0);
    expect(result.totalTaxes).toBeGreaterThan(500_000);
    expect(result.vat).toBeGreaterThan(0);
    expect(result.excise).toBeGreaterThan(0);
  });

  test("2019 Mazda CX-5 2000cc — KRA cascade on customs value", () => {
    const crsp = 3_100_000;
    const cif = crsp + FREIGHT_PROXY_KES;
    const ageYears = getAgeYearsFromYear(2019);
    const result = calculateDutyBreakdown({
      cifKes: cif,
      ageYears,
      engineCC: 2000,
      isElectric: false,
    });

    const cv = result.customsValue;

    expect(result.importDuty).toBe(Math.round(cv * 0.35));
    expect(result.idf).toBe(Math.round(cv * 0.025));
    expect(result.rdl).toBe(Math.round(cv * 0.02));
    expect(result.excise).toBe(Math.round((cv + result.importDuty) * 0.25));
    expect(result.vat).toBe(Math.round((cv + result.importDuty + result.excise) * 0.16));

    const sum = result.importDuty + result.excise + result.vat + result.idf + result.rdl;
    expect(result.totalTaxes).toBe(sum);
    expect(result.totalTaxes).toBeGreaterThan(1_000_000);
    expect(result.totalTaxes).toBeLessThan(crsp);
  });
});
