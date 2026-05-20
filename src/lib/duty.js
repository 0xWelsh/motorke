/** Standard export/freight proxy added for landed-cost display (USD 2,750 × ~KES/USD). */
export const FREIGHT_PROXY_KES = 2750 * 135;

export const DEFAULT_DUTY_RATES = {
  /** EAC CET — 35% for many motor vehicles; some classes still at 25%. */
  importDutyRate: 0.35,
  /** Import Declaration Fee — 3.5% of customs value (KRA standard). */
  idfRate: 0.035,
  vatRate: 0.16,
  rdlRate: 0.02,
  /** Legacy flat RDL when rdlRate is not used (admin overrides). */
  rdlAmount: 0,
  depreciationBands: [
    { maxAge: 1, factor: 0.9 },
    { maxAge: 2, factor: 0.8 },
    { maxAge: 3, factor: 0.7 },
    { maxAge: 4, factor: 0.6 },
    { maxAge: 5, factor: 0.5 },
    { maxAge: 6, factor: 0.4 },
    { maxAge: 7, factor: 0.35 },
    { maxAge: null, factor: 0.35 },
  ],
  /**
   * CRSP ratio applied after age depreciation (July 2025+ schedule).
   * High-cc bands use 0.378 per KRA CRSP class factors.
   */
  crspRatioBands: [
    { minCC: 3001, fuelTypes: ["PETROL"], ratio: 0.378, label: "petrol >3000cc" },
    { minCC: 2501, fuelTypes: ["DIESEL"], ratio: 0.378, label: "diesel >2500cc" },
    { minCC: 1501, maxCC: null, ratio: 0.45, label: "mid CC" },
    { minCC: 0, maxCC: 1500, ratio: 0.5, label: "<=1500cc" },
  ],
  excise: {
    electricRate: 0.1,
    defaultRate: 0.25,
    bands: [
      { minCC: 0, maxCC: 1500, rate: 0.15, label: "<=1500cc" },
      { minCC: 3001, maxCC: null, fuelTypes: ["PETROL"], rate: 0.35, label: "petrol >3000cc" },
      { minCC: 2501, maxCC: null, fuelTypes: ["DIESEL"], rate: 0.35, label: "diesel >2500cc" },
      { minCC: 1501, maxCC: null, rate: 0.25, label: ">1500cc" },
    ],
  },
};

export function getDefaultDutyRates() {
  return JSON.parse(JSON.stringify(DEFAULT_DUTY_RATES));
}

function asNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function getAgeYearsFromYear(year) {
  const currentYear = new Date().getFullYear();
  const parsedYear = asNumber(year, currentYear);
  return Math.max(0, currentYear - parsedYear);
}

function depreciate(amountKes, ageYears, rates) {
  const amount = Math.max(0, asNumber(amountKes));
  const bands = rates.depreciationBands || [];

  const match = bands.find((band) => band.maxAge == null || ageYears <= band.maxAge);
  const factor = match?.factor ?? 1;

  return amount * factor;
}

function normalizeFuelType(fuelType) {
  return String(fuelType || "PETROL").toUpperCase();
}

function bandMatchesFuel(band, fuelType) {
  if (!band.fuelTypes?.length) return true;
  return band.fuelTypes.map((f) => f.toUpperCase()).includes(fuelType);
}

function bandMatchesCC(band, engineCC) {
  const size = Math.max(0, asNumber(engineCC));
  const min = asNumber(band.minCC, 0);
  const max = band.maxCC == null ? Infinity : asNumber(band.maxCC, Infinity);
  return size >= min && size <= max;
}

/** Most specific CRSP ratio band wins (higher minCC, fuel-specific). */
export function resolveCrspRatio(engineCC, fuelType, rates = getDefaultDutyRates()) {
  const fuel = normalizeFuelType(fuelType);
  const bands = rates.crspRatioBands || DEFAULT_DUTY_RATES.crspRatioBands;

  const matches = bands.filter((band) => bandMatchesCC(band, engineCC) && bandMatchesFuel(band, fuel));
  if (!matches.length) return 0.45;

  matches.sort((a, b) => {
    const fuelScore = (band) => (band.fuelTypes?.length ? 1 : 0);
    if (fuelScore(b) !== fuelScore(a)) return fuelScore(b) - fuelScore(a);
    return asNumber(b.minCC, 0) - asNumber(a.minCC, 0);
  });

  return asNumber(matches[0].ratio, 0.45);
}

function getExciseBand(engineCC, fuelType, bands) {
  const fuel = normalizeFuelType(fuelType);

  const matches = bands.filter((band) => bandMatchesCC(band, engineCC) && bandMatchesFuel(band, fuel));
  if (!matches.length) return null;

  matches.sort((a, b) => {
    const fuelScore = (band) => (band.fuelTypes?.length ? 1 : 0);
    if (fuelScore(b) !== fuelScore(a)) return fuelScore(b) - fuelScore(a);
    return asNumber(b.minCC, 0) - asNumber(a.minCC, 0);
  });

  return matches[0];
}

function resolveRdl(customsValue, rates) {
  const cv = Math.max(0, asNumber(customsValue));
  const rdlRate = rates.rdlRate;
  if (rdlRate != null && rdlRate > 0) {
    return cv * asNumber(rdlRate, 0);
  }
  return asNumber(rates.rdlAmount, 0);
}

/**
 * Customs value from CRSP (KRA July 2025+): depreciate CRSP, then × schedule ratio.
 */
export function computeCustomsValueFromCrsp({ crspKes, ageYears, engineCC, fuelType, crspRatio, rates = getDefaultDutyRates() }) {
  const crsp = Math.max(0, asNumber(crspKes));
  const depreciatedCrsp = Math.round(depreciate(crsp, ageYears, rates));
  const ratio =
    crspRatio != null && crspRatio > 0 ? asNumber(crspRatio) : resolveCrspRatio(engineCC, fuelType, rates);
  const customsValue = Math.round(depreciatedCrsp * ratio);

  return {
    customsValue,
    depreciatedCrsp,
    crspRatio: ratio,
  };
}

/**
 * KRA-style import tax stack on customs value.
 *
 * Sequence:
 * 1. Customs value (depreciated CRSP × ratio, or legacy depreciated CIF)
 * 2. Import duty = CV × rate
 * 3. Excise = (CV + import duty) × rate
 * 4. VAT = (CV + import duty + excise) × 16%
 * 5. IDF = CV × 3.5%
 * 6. RDL = CV × 2%
 */
export function calculateDutyBreakdown({
  crspKes,
  cifKes,
  ageYears,
  engineCC,
  fuelType,
  isElectric,
  crspRatio,
  rates = getDefaultDutyRates(),
}) {
  let customsValue;
  let depreciatedCrsp = null;
  let resolvedRatio = null;

  if (crspKes != null && asNumber(crspKes) > 0) {
    const cv = computeCustomsValueFromCrsp({
      crspKes,
      ageYears,
      engineCC,
      fuelType,
      crspRatio,
      rates,
    });
    customsValue = cv.customsValue;
    depreciatedCrsp = cv.depreciatedCrsp;
    resolvedRatio = cv.crspRatio;
  } else {
    customsValue = Math.round(depreciate(cifKes, ageYears, rates));
  }

  const importDutyRate = asNumber(rates.importDutyRate, 0.35);
  const importDuty = Math.round(customsValue * importDutyRate);

  const matchedBand = getExciseBand(engineCC, fuelType, rates.excise?.bands || []);
  const exciseRate = isElectric
    ? asNumber(rates.excise?.electricRate, 0)
    : matchedBand
      ? asNumber(matchedBand.rate, 0)
      : asNumber(rates.excise?.defaultRate, 0);

  const exciseBase = customsValue + importDuty;
  const excise = Math.round(exciseBase * exciseRate);

  const vatBase = customsValue + importDuty + excise;
  const vat = Math.round(vatBase * asNumber(rates.vatRate, 0.16));

  const idf = Math.round(customsValue * asNumber(rates.idfRate, 0.035));
  const rdl = Math.round(resolveRdl(customsValue, rates));

  const totalTaxes = importDuty + excise + vat + idf + rdl;

  return {
    customsValue,
    depreciatedCrsp,
    crspRatio: resolvedRatio,
    importDuty,
    importDutyRate,
    exciseBase,
    excise,
    exciseRate,
    exciseLabel: isElectric ? "EV rate" : matchedBand?.label || "default",
    vatBase,
    vat,
    idf,
    rdl,
    total: totalTaxes,
    totalTaxes,
    /** @deprecated Use totalTaxes — CRSP must not be summed as a purchase price. */
    landed: totalTaxes,
  };
}

export function estimateDuty(price, year, options = {}) {
  const ageYears = getAgeYearsFromYear(year);
  const breakdown = calculateDutyBreakdown({
    cifKes: asNumber(price, 0) + FREIGHT_PROXY_KES,
    ageYears,
    engineCC: options.engineCC ?? 1500,
    fuelType: options.fuelType,
    isElectric: options.isElectric ?? false,
    rates: options.rates || getDefaultDutyRates(),
  });

  return Math.round(breakdown.totalTaxes + 150_000);
}

import { getDutyRates } from "./duty-rates";

/** Listing price + freight + taxes when duty not yet paid (price = seller/listing amount). */
export async function computeLandedPriceForDb(price, dutyPaid, year, engineCC, fuelType) {
  let isDutyPaid = true;
  if (dutyPaid === false || dutyPaid === "false" || dutyPaid === 0) {
    isDutyPaid = false;
  }

  if (isDutyPaid) return Number(price);

  const { rates } = await getDutyRates();
  const ageYears = getAgeYearsFromYear(year);
  const breakdown = calculateDutyBreakdown({
    cifKes: asNumber(price, 0) + FREIGHT_PROXY_KES,
    ageYears,
    engineCC: engineCC ? Number(engineCC) : 1500,
    fuelType,
    isElectric: fuelType === "ELECTRIC",
    rates,
  });

  return Math.round(asNumber(price, 0) + FREIGHT_PROXY_KES + breakdown.totalTaxes);
}
