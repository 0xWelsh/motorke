/** @jest-environment node */

import {
  KENYA_MAX_IMPORT_AGE_YEARS,
  assessImportEligibility,
  getImportYearWindow,
  isImportableModelYear,
} from "@/lib/duty-import-eligibility";

describe("Kenya 8-year import eligibility", () => {
  const refYear = 2026;

  test("getImportYearWindow returns oldest importable year", () => {
    expect(getImportYearWindow(refYear)).toEqual({
      referenceYear: refYear,
      maxAgeYears: KENYA_MAX_IMPORT_AGE_YEARS,
      oldestImportableYear: refYear - KENYA_MAX_IMPORT_AGE_YEARS,
    });
  });

  test("2018 model is borderline in 2026", () => {
    const r = assessImportEligibility(2018, refYear);
    expect(r.status).toBe("borderline");
    expect(r.eligible).toBe(true);
  });

  test("2017 model is ineligible in 2026", () => {
    const r = assessImportEligibility(2017, refYear);
    expect(r.status).toBe("ineligible");
    expect(r.eligible).toBe(false);
    expect(isImportableModelYear(2017, refYear)).toBe(false);
  });

  test("2019 model is eligible in 2026", () => {
    const r = assessImportEligibility(2019, refYear);
    expect(r.status).toBe("eligible");
    expect(r.eligible).toBe(true);
  });
});
