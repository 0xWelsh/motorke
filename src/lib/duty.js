/** Standard export/freight proxy added to CRSP before depreciation (USD 2,750 × ~KES/USD). */
export const FREIGHT_PROXY_KES = 2750 * 135;

export const DEFAULT_DUTY_RATES = {
  /** EAC CET — 35% for many motor vehicles; some classes still at 25%. */
  importDutyRate: 0.35,
  idfRate: 0.025,
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
  excise: {
    electricRate: 0.1,
    defaultRate: 0.25,
    bands: [
      { minCC: 0, maxCC: 1500, rate: 0.15, label: "<=1500cc" },
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

function depreciate(cifKes, ageYears, rates) {
  const amount = Math.max(0, asNumber(cifKes));
  const bands = rates.depreciationBands || [];

  const match = bands.find((band) => band.maxAge == null || ageYears <= band.maxAge);
  const factor = match?.factor ?? 1;

  return amount * factor;
}

function getExciseBand(engineCC, bands) {
  const size = Math.max(0, asNumber(engineCC));

  return bands.find((band) => {
    const min = asNumber(band.minCC, 0);
    const max = band.maxCC == null ? Infinity : asNumber(band.maxCC, Infinity);
    return size >= min && size <= max;
  });
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
 * KRA-style import tax stack (CRSP + freight proxy → depreciated customs value).
 * CRSP is a valuation schedule for tax — not the price paid to the overseas seller.
 *
 * Sequence:
 * 1. Customs value (depreciated CIF)
 * 2. Import duty = CV × rate
 * 3. Excise = (CV + import duty) × rate
 * 4. VAT = (CV + import duty + excise) × 16%
 * 5. IDF = CV × 2.5%
 * 6. RDL = CV × 2%
 */
export function calculateDutyBreakdown({ cifKes, ageYears, engineCC, isElectric, rates = getDefaultDutyRates() }) {
  const customsValue = Math.round(depreciate(cifKes, ageYears, rates));

  const importDutyRate = asNumber(rates.importDutyRate, 0.35);
  const importDuty = Math.round(customsValue * importDutyRate);

  const matchedBand = getExciseBand(engineCC, rates.excise?.bands || []);
  const exciseRate = isElectric
    ? asNumber(rates.excise?.electricRate, 0)
    : matchedBand
      ? asNumber(matchedBand.rate, 0)
      : asNumber(rates.excise?.defaultRate, 0);

  const exciseBase = customsValue + importDuty;
  const excise = Math.round(exciseBase * exciseRate);

  const vatBase = customsValue + importDuty + excise;
  const vat = Math.round(vatBase * asNumber(rates.vatRate, 0.16));

  const idf = Math.round(customsValue * asNumber(rates.idfRate, 0.025));
  const rdl = Math.round(resolveRdl(customsValue, rates));

  const totalTaxes = importDuty + excise + vat + idf + rdl;

  return {
    customsValue,
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
    isElectric: fuelType === "ELECTRIC",
    rates,
  });

  return Math.round(asNumber(price, 0) + FREIGHT_PROXY_KES + breakdown.totalTaxes);
}
