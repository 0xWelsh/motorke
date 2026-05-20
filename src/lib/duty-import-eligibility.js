/** Kenya NTSA / KRA: used imports must not exceed 8 years from year of first registration. */
export const KENYA_MAX_IMPORT_AGE_YEARS = 8;

export function getImportYearWindow(referenceYear = new Date().getFullYear()) {
  const y = Number(referenceYear) || new Date().getFullYear();
  return {
    referenceYear: y,
    maxAgeYears: KENYA_MAX_IMPORT_AGE_YEARS,
    oldestImportableYear: y - KENYA_MAX_IMPORT_AGE_YEARS,
  };
}

/**
 * @returns {{ eligible: boolean, status: 'eligible'|'borderline'|'ineligible', ageYears: number, oldestImportableYear: number, message: string }}
 */
export function assessImportEligibility(modelYear, referenceYear = new Date().getFullYear()) {
  const year = Number(modelYear);
  const ref = Number(referenceYear) || new Date().getFullYear();
  const ageYears = Math.max(0, ref - (Number.isFinite(year) ? year : ref));
  const { oldestImportableYear } = getImportYearWindow(ref);

  if (ageYears > KENYA_MAX_IMPORT_AGE_YEARS) {
    return {
      eligible: false,
      status: "ineligible",
      ageYears,
      oldestImportableYear,
      message: `A ${year} model is about ${ageYears} years old, over Kenya’s ${KENYA_MAX_IMPORT_AGE_YEARS}-year import limit. Newest eligible model year is typically ${oldestImportableYear} or later.`,
    };
  }

  if (ageYears === KENYA_MAX_IMPORT_AGE_YEARS) {
    return {
      eligible: true,
      status: "borderline",
      ageYears,
      oldestImportableYear,
      message: `At the ${KENYA_MAX_IMPORT_AGE_YEARS}-year ceiling. Confirm first-registration month with NTSA or your clearing agent before you ship.`,
    };
  }

  return {
    eligible: true,
    status: "eligible",
    ageYears,
    oldestImportableYear,
    message: `Within Kenya’s ${KENYA_MAX_IMPORT_AGE_YEARS}-year import window (${ageYears} years from ${year} model year).`,
  };
}

export function isImportableModelYear(modelYear, referenceYear = new Date().getFullYear()) {
  return assessImportEligibility(modelYear, referenceYear).eligible;
}
