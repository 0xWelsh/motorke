// src/components/compare/compare-config.js
import {
  formatCarPrice,
  formatPrice,
  formatMileage,
  BODY_TYPE_LABELS,
  FUEL_LABELS,
  HYBRID_BATTERY_LABELS,
  TRANSMISSION_LABELS,
  STEERING_LABELS,
  DRIVETRAIN_LABELS,
} from "@/lib/utils";

export const SLOT_KEYS = ["a", "b", "c"];

export const PRESETS = [
  { id: "all", label: "Full Sheet" },
  { id: "city", label: "City" },
  { id: "family", label: "Family" },
  { id: "performance", label: "Performance" },
  { id: "longtrip", label: "Long Trip" },
];

export function estimateMonthlyLoan(price) {
  if (typeof price !== "number" || price < 500000) return null;
  // Assumes a standard bank auto loan: 20% Deposit, 80% Financed, 48 Months at 14% p.a.
  const principal = price * 0.8;
  const monthlyRate = 0.14 / 12;
  const months = 48;
  const pmt = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
  return Math.round(pmt);
}

function toDisplay(value) {
  if (value === null || value === undefined || value === "") return "N/A";
  return value;
}

function positiveMetric(raw, suffix = "") {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return { value: "—", raw: null };
  return { value: suffix ? `${n}${suffix}` : String(n), raw: n };
}

function yesNo(value) {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return "N/A";
}

export function getSpecGroups(getInsights) {
  return [
    {
      name: "Core",
      specs: [
        { id: "price", label: "Price", tags: ["all", "city", "family", "longtrip"], pick: (c) => ({ value: c?.price != null ? formatCarPrice(c) : "N/A", raw: c?.price }), rank: "min" },
        { 
          id: "landedPrice", 
          label: "Total Landed", 
          tags: ["all", "city", "longtrip"], 
          pick: (c) => {
            const lp = getInsights(c)?.landedPrice;
            const isEstimated = !c?.dutyPaid && !c?.computedLandedPrice;
            return { 
              value: lp != null ? formatPrice(lp) : (isEstimated ? "Calculate Duty" : "N/A"), 
              raw: lp 
            };
          }, 
          rank: "min" 
        },
        { id: "monthlyLoan", label: "Est. Loan (48m@14%)", tags: ["all", "city", "family", "performance"], pick: (c) => ({ value: c?.price != null ? formatPrice(estimateMonthlyLoan(c?.price)) : "N/A", raw: estimateMonthlyLoan(c?.price) }), rank: "min" },
        { id: "year", label: "Year", tags: ["all", "city", "family", "longtrip", "performance"], pick: (c) => ({ value: toDisplay(c?.year), raw: c?.year }), rank: "max" },
        { id: "mileage", label: "Mileage", tags: ["all", "city", "longtrip", "family"], pick: (c) => ({ value: c?.mileage != null ? formatMileage(c.mileage) : "N/A", raw: c?.mileage }), rank: "min" },
        { id: "condition", label: "Condition", tags: ["all", "family", "longtrip"], pick: (c) => ({ value: toDisplay(c?.condition), raw: c?.condition }) },
        { id: "bodyType", label: "Body type", tags: ["all", "city", "family"], pick: (c) => ({ value: c?.bodyType ? BODY_TYPE_LABELS[c.bodyType] : "N/A", raw: c?.bodyType }) },
      ],
    },
    {
      name: "Powertrain",
      specs: [
        { id: "fuelType", label: "Fuel type", tags: ["all", "city", "longtrip"], pick: (c) => ({ value: c?.fuelType ? FUEL_LABELS[c.fuelType] : "N/A", raw: c?.fuelType }) },
        { id: "transmission", label: "Transmission", tags: ["all", "city", "longtrip", "performance"], pick: (c) => ({ value: c?.transmission ? TRANSMISSION_LABELS[c.transmission] : "N/A", raw: c?.transmission }) },
        { id: "drivetrain", label: "Drivetrain", tags: ["all", "performance", "longtrip"], pick: (c) => ({ value: c?.drivetrain ? DRIVETRAIN_LABELS[c.drivetrain] : "N/A", raw: c?.drivetrain }) },
        { id: "steering", label: "Steering", tags: ["all", "city", "performance"], pick: (c) => ({ value: c?.steering ? STEERING_LABELS[c.steering] : "N/A", raw: c?.steering }) },
        { id: "engineCC", label: "Engine size", tags: ["all", "performance", "longtrip"], pick: (c) => positiveMetric(c?.engineCC, "cc"), rank: "max" },
        { id: "cylinders", label: "Cylinders", tags: ["all", "performance"], pick: (c) => positiveMetric(c?.cylinders), rank: "max" },
        { id: "horsepower", label: "Horsepower", tags: ["all", "performance"], pick: (c) => positiveMetric(c?.horsepower, " hp"), rank: "max" },
        { id: "torque", label: "Torque", tags: ["all", "performance", "longtrip"], pick: (c) => positiveMetric(c?.torque, " Nm"), rank: "max" },
        { id: "turbo", label: "Turbocharged", tags: ["all", "performance"], pick: (c) => ({ value: yesNo(c?.turbo), raw: c?.turbo }), rank: "booltrue" },
      ],
    },
    {
      name: "Safety & Comfort",
      specs: [
        {
          id: "airbags",
          label: "Airbags",
          tags: ["all", "family", "longtrip"],
          pick: (c) => {
            const n = Number(c?.airbags);
            const ok = c?.airbags != null && c?.airbags !== "" && Number.isFinite(n) && n > 0;
            return { value: ok ? String(n) : "—", raw: ok ? n : null };
          },
          rank: "max",
        },
        { id: "seats", label: "Seats", tags: ["all", "family", "longtrip"], pick: (c) => positiveMetric(c?.seats), rank: "max" },
        { id: "sunroof", label: "Sunroof", tags: ["all", "family"], pick: (c) => ({ value: yesNo(c?.sunroof), raw: c?.sunroof }), rank: "booltrue" },
        { id: "doors", label: "Doors", tags: ["all", "city", "family"], pick: (c) => positiveMetric(c?.doors), rank: "max" },
        { id: "color", label: "Color", tags: ["all"], pick: (c) => ({ value: toDisplay(c?.color), raw: c?.color }) },
        { id: "featuresCount", label: "Features count", tags: ["all", "family"], pick: (c) => ({ value: c?.features?.length != null ? c.features.length : "N/A", raw: c?.features?.length }), rank: "max" },
      ],
    },
    {
      name: "Ownership",
      specs: [
        { id: "imported", label: "Imported", tags: ["all", "city", "longtrip"], pick: (c) => ({ value: yesNo(c?.imported), raw: c?.imported }) },
        { id: "importCountry", label: "Import country", tags: ["all", "city", "longtrip"], pick: (c) => ({ value: toDisplay(c?.importCountry), raw: c?.importCountry }) },
        { id: "dealer", label: "Dealer", tags: ["all", "city", "family", "performance", "longtrip"], pick: (c) => ({ value: toDisplay(c?.dealer?.name), raw: c?.dealer?.name }) },
        { id: "dealerVerified", label: "Dealer verified", tags: ["all", "city", "family", "longtrip"], pick: (c) => ({ value: yesNo(c?.dealer?.verified), raw: c?.dealer?.verified }), rank: "booltrue" },
      ],
    },
    {
      name: "Kenya Ops Intelligence",
      specs: [
        { id: "groundClearance", label: "Ground clearance", tags: ["all", "city", "longtrip", "family"], pick: (c) => positiveMetric(c?.groundClearanceMm, " mm"), rank: "max" },
        { id: "roadSuitability", label: "Road suitability", tags: ["all", "city", "longtrip", "family"], pick: (c) => ({ value: `${getInsights(c)?.roadSuitabilityScore ?? "N/A"}/100`, raw: getInsights(c)?.roadSuitabilityScore }), rank: "max" },
        { id: "spares", label: "Spare availability", tags: ["all", "city", "longtrip", "family"], pick: (c) => ({ value: `${getInsights(c)?.spareAvailabilityScore ?? "N/A"}/10`, raw: getInsights(c)?.spareAvailabilityScore }), rank: "max" },
        {
          id: "batteryTech",
          label: "Hybrid battery tech",
          tags: ["all", "city", "family"],
          pick: (c) => {
            if (c?.fuelType !== "HYBRID") return { value: "N/A", raw: null };
            return {
              value: HYBRID_BATTERY_LABELS[c?.hybridBatteryTech] || "N/A",
              raw: c?.hybridBatteryTech || null,
            };
          },
        },
        { id: "trafficFactor", label: "Traffic fuel factor", tags: ["all", "city", "longtrip"], pick: (c) => ({ value: `${((getInsights(c)?.tco?.trafficMultiplier ?? 1) * 100 - 100).toFixed(0)}%`, raw: getInsights(c)?.tco?.trafficMultiplier }), rank: "min" },
        { id: "annualFuel", label: "Annual energy cost", tags: ["all", "city", "longtrip"], pick: (c) => ({ value: formatPrice(getInsights(c)?.tco?.annualFuelCost || 0), raw: getInsights(c)?.tco?.annualFuelCost }), rank: "min" },
        { id: "annualInsurance", label: "Annual insurance", tags: ["all", "city", "family", "longtrip"], pick: (c) => ({ value: formatPrice(getInsights(c)?.tco?.annualInsurance || 0), raw: getInsights(c)?.tco?.annualInsurance }), rank: "min" },
        { id: "annualMaintenance", label: "Annual maintenance", tags: ["all", "city", "family", "longtrip"], pick: (c) => ({ value: formatPrice(getInsights(c)?.tco?.annualMaintenance || 0), raw: getInsights(c)?.tco?.annualMaintenance }), rank: "min" },
        { id: "annualTco", label: "Annual TCO", tags: ["all", "city", "family", "longtrip"], pick: (c) => ({ value: formatPrice(getInsights(c)?.tco?.annualTotal || 0), raw: getInsights(c)?.tco?.annualTotal }), rank: "min" },
      ],
    },
  ];
}
