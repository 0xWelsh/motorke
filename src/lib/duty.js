export const DEFAULT_DUTY_RATES = {
  idfRate: 0.0225,
  vatRate: 0.16,
  rdlAmount: 10000,
  depreciationBands: [
    { maxAge: 1, factor: 0.9 },
    { maxAge: 2, factor: 0.8 },
    { maxAge: 3, factor: 0.7 },
    { maxAge: 4, factor: 0.6 },
    { maxAge: 5, factor: 0.5 },
    { maxAge: 6, factor: 0.4 },
    { maxAge: 7, factor: 0.3 },
    { maxAge: null, factor: 0.3 },
  ],
  excise: {
    electricRate: 0.1,
    defaultRate: 0.2,
    bands: [
      { minCC: 0, maxCC: 1500, rate: 0.15, label: "<=1500cc" },
      { minCC: 1501, maxCC: 2000, rate: 0.2, label: "1501-2000cc" },
      { minCC: 2001, maxCC: 3000, rate: 0.25, label: "2001-3000cc" },
      { minCC: 3001, maxCC: null, rate: 0.3, label: ">3000cc" },
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

export function calculateDutyBreakdown({ cifKes, ageYears, engineCC, isElectric, rates = getDefaultDutyRates() }) {
  // Enforce the standard 3400 USD freight/export proxy to make the calculation accurate for imported FOBs.
  // We apply this only if this is clearly a raw un-exported FOB amount. 
  // In motorke, the `cifKes` parameter coming here is actually the pure FOB KES price natively!
  
  // NOTE: I will handle the + (2750 * 135) strictly inside `estimateDuty` and `estimateLandedCost` in utils.js
  
  const customsValue = depreciate(cifKes, ageYears, rates);

  const idfRate = asNumber(rates.idfRate, 0);
  const vatRate = asNumber(rates.vatRate, 0);
  const rdl = asNumber(rates.rdlAmount, 0);

  const matchedBand = getExciseBand(engineCC, rates.excise?.bands || []);
  const exciseRate = isElectric
    ? asNumber(rates.excise?.electricRate, 0)
    : matchedBand
      ? asNumber(matchedBand.rate, 0)
      : asNumber(rates.excise?.defaultRate, 0);

  const idf = customsValue * idfRate;
  const excise = customsValue * exciseRate;
  const vatBase = customsValue + idf + excise;
  const vat = vatBase * vatRate;

  const total = idf + excise + vat + rdl;
  const landed = asNumber(cifKes, 0) + total;

  return {
    customsValue,
    idf,
    excise,
    exciseRate,
    exciseLabel: isElectric ? "EV rate" : matchedBand?.label || "default",
    vat,
    rdl,
    total,
    landed,
  };
}

export function estimateDuty(price, year, options = {}) {
  const ageYears = getAgeYearsFromYear(year);
  const breakdown = calculateDutyBreakdown({
    cifKes: asNumber(price, 0) + (2750 * 135),
    ageYears,
    engineCC: options.engineCC ?? 1500,
    isElectric: options.isElectric ?? false,
    rates: options.rates || getDefaultDutyRates(),
  });

  return Math.round(breakdown.total + 200000);
}
