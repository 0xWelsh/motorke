// src/components/compare/compare-config.js
import {
  formatCarPrice,
  formatPrice,
  formatMileage,
  BODY_TYPE_LABELS,
  FUEL_LABELS,
  TRANSMISSION_LABELS,
  STEERING_LABELS,
  DRIVETRAIN_LABELS,
  VEHICLE_TYPE_LABELS,
} from "@/lib/utils";

export const SLOT_KEYS = ["a", "b", "c"];

/** Get the best available raw value for a field: car's own value, or fallback to reference spec.
 *  Uses reference when the car's value is null, empty, or looks like a Prisma default. */
function rawRef(car, field) {
  if (!car) return null;
  const carVal = car[field];
  const refVal = car._refSpec?.[field];

  // Car has a real, non-default value? Use it.
  if (carVal !== null && carVal !== undefined && carVal !== "" && carVal !== "NA") {
    // Known Prisma defaults that likely mean "not entered"
    const isDefault =
      carVal === 0 || carVal === "0" ||
      (field === "seats" && carVal === 5) ||
      (field === "doors" && carVal === 4) ||
      (field === "steering" && carVal === "RHD") ||
      (field === "drivetrain" && carVal === "FWD") ||
      (field === "fuelType" && carVal === "PETROL") ||
      (field === "transmission" && carVal === "AUTOMATIC") ||
      (field === "condition" && carVal === "USED") ||
      (field === "turbo" && carVal === false) ||
      (field === "sunroof" && carVal === false);
    if (!isDefault) return carVal;
  }

  // Fall back to reference spec
  return refVal ?? carVal ?? null;
}

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
  if (value === null || value === undefined || value === "") return "Not specified";
  return value;
}

function positiveMetric(raw, suffix = "") {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return { value: "Not specified", raw: null };
  return { value: suffix ? `${n}${suffix}` : String(n), raw: n };
}

function yesNo(value) {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return "Not specified";
}

export function getSpecGroups(getInsights) {
  return [
    {
      name: "Core",
      specs: [
        { id: "price", label: "Price", tags: ["all", "city", "family", "longtrip"], pick: (c) => ({ value: c?.price != null ? formatCarPrice(c) : "Not specified", raw: c?.price }), rank: "min" },
        { 
          id: "landedPrice", 
          label: "Total Landed", 
          tags: ["all", "city", "longtrip"], 
          pick: (c) => {
            const lp = getInsights(c)?.landedPrice;
            const isEstimated = !c?.dutyPaid && !c?.computedLandedPrice;
            return { 
              value: lp != null ? formatPrice(lp) : (isEstimated ? "Calculate Duty" : "Not specified"), 
              raw: lp 
            };
          }, 
          rank: "min" 
        },
        { id: "monthlyLoan", label: "Est. Loan (48m@14%)", tags: ["all", "city", "family", "performance"], pick: (c) => ({ value: c?.price != null ? formatPrice(estimateMonthlyLoan(c?.price)) : "Not specified", raw: estimateMonthlyLoan(c?.price) }), rank: "min" },
        { id: "year", label: "Year", tags: ["all", "city", "family", "longtrip", "performance"], pick: (c) => ({ value: toDisplay(c?.year), raw: c?.year }), rank: "max" },
        { id: "mileage", label: "Mileage", tags: ["all", "city", "longtrip", "family"], pick: (c) => ({ value: c?.mileage != null ? formatMileage(c.mileage) : "Not specified", raw: c?.mileage }), rank: "min" },
        { id: "condition", label: "Condition", tags: ["all", "family", "longtrip"], pick: (c) => ({ value: toDisplay(c?.condition), raw: c?.condition }) },
        { id: "bodyType", label: "Body type", tags: ["all", "city", "family"], pick: (c) => {
          const bt = rawRef(c, "bodyType");
          return { value: bt ? BODY_TYPE_LABELS[bt] || bt : "Not specified", raw: bt };
        }},
        { id: "vehicleType", label: "Type", tags: ["all", "city", "family", "longtrip"], pick: (c) => {
          const vt = rawRef(c, "vehicleType");
          return { value: vt ? VEHICLE_TYPE_LABELS[vt] || vt : "Car", raw: vt };
        }},
        { id: "negotiable", label: "Price negotiable", tags: ["all", "city", "family"], pick: (c) => ({ value: yesNo(c?.negotiable !== false), raw: c?.negotiable }), rank: "booltrue" },
      ],
    },
    {
      name: "Powertrain",
      specs: [
        { id: "fuelType", label: "Fuel type", tags: ["all", "city", "longtrip"], pick: (c) => {
          const ft = rawRef(c, "fuelType");
          return { value: ft ? FUEL_LABELS[ft] || ft : "Not specified", raw: ft };
        }},
        { id: "transmission", label: "Transmission", tags: ["all", "city", "longtrip", "performance"], pick: (c) => {
          const tr = rawRef(c, "transmission");
          return { value: tr ? TRANSMISSION_LABELS[tr] || tr : "Not specified", raw: tr };
        }},
        { id: "drivetrain", label: "Drivetrain", tags: ["all", "performance", "longtrip"], pick: (c) => {
          const dr = rawRef(c, "drivetrain");
          return { value: dr ? DRIVETRAIN_LABELS[dr] || dr : "Not specified", raw: dr };
        }},
        { id: "steering", label: "Steering", tags: ["all", "city", "performance"], pick: (c) => {
          const st = rawRef(c, "steering");
          return { value: st ? STEERING_LABELS[st] || st : "Not specified", raw: st };
        }},
        { id: "engineCC", label: "Engine size", tags: ["all", "performance", "longtrip"], pick: (c) => {
          const cc = Number(rawRef(c, "engineCC"));
          if (!Number.isFinite(cc) || cc <= 0) return { value: "Not specified", raw: null };
          const litres = (cc / 1000).toFixed(1);
          let parts = [`${litres}L`];
          const cyl = rawRef(c, "cylinders");
          if (Number.isFinite(Number(cyl)) && Number(cyl) > 0) parts.push(`${cyl} cyl`);
          if (rawRef(c, "turbo")) parts.push("Turbo");
          return { value: parts.join(", "), raw: cc };
        }, rank: "max" },
        { id: "cylinders", label: "Cylinders", tags: ["all", "performance"], pick: (c) => positiveMetric(rawRef(c, "cylinders")), rank: "max" },
        { id: "horsepower", label: "Horsepower", tags: ["all", "performance"], pick: (c) => positiveMetric(rawRef(c, "horsepower"), " hp"), rank: "max" },
        { id: "torque", label: "Torque", tags: ["all", "performance", "longtrip"], pick: (c) => positiveMetric(rawRef(c, "torque"), " Nm"), rank: "max" },
        { id: "turbo", label: "Turbocharged", tags: ["all", "performance"], pick: (c) => {
          const t = rawRef(c, "turbo");
          return { value: yesNo(t), raw: t };
        }, rank: "booltrue" },
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
            const n = Number(rawRef(c, "airbags"));
            const ok = Number.isFinite(n) && n > 0;
            return { value: ok ? String(n) : "Not specified", raw: ok ? n : null };
          },
          rank: "max",
        },
        { id: "seats", label: "Seats", tags: ["all", "family", "longtrip"], pick: (c) => positiveMetric(rawRef(c, "seats")), rank: "max" },
        { id: "sunroof", label: "Sunroof", tags: ["all", "family"], pick: (c) => {
          const s = rawRef(c, "sunroof");
          return { value: yesNo(s), raw: s };
        }, rank: "booltrue" },
        { id: "doors", label: "Doors", tags: ["all", "city", "family"], pick: (c) => positiveMetric(rawRef(c, "doors")), rank: "max" },
        { id: "color", label: "Color", tags: ["all"], pick: (c) => ({ value: toDisplay(c?.color), raw: c?.color }) },
        { id: "featuresCount", label: "Features count", tags: ["all", "family"], pick: (c) => {
          const dealerCount = c?.features?.length;
          const refFeatures = c?._refSpec?.standardFeatures;
          const count = dealerCount || refFeatures?.length || 0;
          return { value: count > 0 ? String(count) : "Not specified", raw: count };
        }, rank: "max" },
      ],
    },
    {
      name: "Ownership",
      specs: [
        { id: "imported", label: "Imported", tags: ["all", "city", "longtrip"], pick: (c) => ({ value: yesNo(c?.imported), raw: c?.imported }) },
        { id: "importCountry", label: "Import country", tags: ["all", "city", "longtrip"], pick: (c) => ({ value: toDisplay(c?.importCountry), raw: c?.importCountry }) },
        { id: "registered", label: "Registered in Kenya", tags: ["all", "city", "family", "longtrip"], pick: (c) => ({ value: c?.registered == null ? "Not specified" : c.registered === false ? "No" : "Yes", raw: c?.registered }) },
      ],
    },
    {
      name: "Kenya Ops Intelligence",
      specs: [
        { id: "groundClearance", label: "Ground clearance", tags: ["all", "city", "longtrip", "family"], pick: (c) => positiveMetric(rawRef(c, "groundClearanceMm"), " mm"), rank: "max" },
        { id: "roadSuitability", label: "Road suitability", tags: ["all", "city", "longtrip", "family"], pick: (c) => ({ value: `${getInsights(c)?.roadSuitabilityScore ?? "Not specified"}/100`, raw: getInsights(c)?.roadSuitabilityScore }), rank: "max" },
        { id: "spares", label: "Spare availability", tags: ["all", "city", "longtrip", "family"], pick: (c) => ({ value: `${getInsights(c)?.spareAvailabilityScore ?? "Not specified"}/10`, raw: getInsights(c)?.spareAvailabilityScore }), rank: "max" },
        { id: "trafficFactor", label: "Traffic fuel factor", tags: ["all", "city", "longtrip"], pick: (c) => ({ value: `${((getInsights(c)?.tco?.trafficMultiplier ?? 1) * 100 - 100).toFixed(0)}%`, raw: getInsights(c)?.tco?.trafficMultiplier }), rank: "min" },
        { id: "annualFuel", label: "Annual energy cost", tags: ["all", "city", "longtrip"], pick: (c) => ({ value: formatPrice(getInsights(c)?.tco?.annualFuelCost || 0), raw: getInsights(c)?.tco?.annualFuelCost }), rank: "min" },
        { id: "annualInsurance", label: "Annual insurance", tags: ["all", "city", "family", "longtrip"], pick: (c) => ({ value: formatPrice(getInsights(c)?.tco?.annualInsurance || 0), raw: getInsights(c)?.tco?.annualInsurance }), rank: "min" },
        { id: "annualMaintenance", label: "Annual maintenance", tags: ["all", "city", "family", "longtrip"], pick: (c) => ({ value: formatPrice(getInsights(c)?.tco?.annualMaintenance || 0), raw: getInsights(c)?.tco?.annualMaintenance }), rank: "min" },
        { id: "annualTco", label: "Annual TCO", tags: ["all", "city", "family", "longtrip"], pick: (c) => ({ value: formatPrice(getInsights(c)?.tco?.annualTotal || 0), raw: getInsights(c)?.tco?.annualTotal }), rank: "min" },
      ],
    },
  ];
}
