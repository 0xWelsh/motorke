/** @jest-environment node */

import {
  calculateDutyBreakdown,
  computeCustomsValueFromCrsp,
  getAgeYearsFromYear,
  resolveCrspRatio,
  resolveImportDutyRate,
} from "@/lib/duty";

describe("duty calculator engine", () => {
  test("returns positive tax breakdown for typical SUV CRSP", () => {
    const ageYears = getAgeYearsFromYear(2018);
    const result = calculateDutyBreakdown({
      crspKes: 3_200_000,
      ageYears,
      engineCC: 2200,
      fuelType: "PETROL",
      isElectric: false,
    });

    expect(result.customsValue).toBeGreaterThan(0);
    expect(result.importDuty).toBeGreaterThan(0);
    expect(result.totalTaxes).toBeGreaterThan(300_000);
    expect(result.vat).toBeGreaterThan(0);
    expect(result.excise).toBeGreaterThan(0);
    expect(result.depreciatedCrsp).toBeGreaterThan(result.customsValue);
  });

  test("2019 Mazda CX-5 2000cc — KRA cascade on customs value", () => {
    const crsp = 3_100_000;
    const ageYears = getAgeYearsFromYear(2019);
    const result = calculateDutyBreakdown({
      crspKes: crsp,
      ageYears,
      engineCC: 2000,
      fuelType: "PETROL",
      isElectric: false,
    });

    const cv = result.customsValue;

    expect(resolveImportDutyRate(2000, "PETROL")).toBe(0.25);
    expect(result.importDutyRate).toBe(0.25);
    expect(result.importDuty).toBe(Math.round(cv * 0.25));
    expect(result.idf).toBe(Math.round(cv * 0.035));
    expect(result.rdl).toBe(Math.round(cv * 0.02));
    expect(result.excise).toBe(Math.round((cv + result.importDuty) * 0.25));
    expect(result.vat).toBe(Math.round((cv + result.importDuty + result.excise) * 0.16));

    const sum = result.importDuty + result.excise + result.vat + result.idf + result.rdl;
    expect(result.totalTaxes).toBe(sum);
    expect(result.totalTaxes).toBeGreaterThan(400_000);
    expect(result.totalTaxes).toBeLessThan(crsp);
  });

  test("2018 Land Cruiser V8 diesel — CRSP ratio and 35% import duty + excise", () => {
    const crsp = 8_500_000;
    const ageYears = getAgeYearsFromYear(2018);
    expect(resolveCrspRatio(4500, "DIESEL")).toBe(0.378);
    expect(resolveImportDutyRate(4500, "DIESEL")).toBe(0.35);

    const { customsValue, depreciatedCrsp, crspRatio } = computeCustomsValueFromCrsp({
      crspKes: crsp,
      ageYears,
      engineCC: 4500,
      fuelType: "DIESEL",
    });

    expect(depreciatedCrsp).toBe(Math.round(crsp * 0.35));
    expect(crspRatio).toBe(0.378);
    expect(customsValue).toBe(1_124_550);

    const result = calculateDutyBreakdown({
      crspKes: crsp,
      ageYears,
      engineCC: 4500,
      fuelType: "DIESEL",
      isElectric: false,
    });

    expect(result.customsValue).toBe(1_124_550);
    expect(result.importDuty).toBe(393_593);
    expect(result.excise).toBe(531_350);
    expect(result.vat).toBe(327_919);
    expect(result.idf).toBe(39_359);
    expect(result.rdl).toBe(22_491);
    expect(result.totalTaxes).toBe(1_314_712);
    expect(result.exciseRate).toBe(0.35);
    expect(result.importDutyRate).toBe(0.35);
  });

  test("import duty band resolution: 35% only for large engines", () => {
    expect(resolveImportDutyRate(1500, "PETROL")).toBe(0.25);
    expect(resolveImportDutyRate(3000, "PETROL")).toBe(0.25);
    expect(resolveImportDutyRate(3001, "PETROL")).toBe(0.35);
    expect(resolveImportDutyRate(2500, "DIESEL")).toBe(0.25);
    expect(resolveImportDutyRate(2501, "DIESEL")).toBe(0.35);
    expect(resolveImportDutyRate(4500, "DIESEL")).toBe(0.35);
  });
});
