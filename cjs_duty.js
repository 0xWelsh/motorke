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
