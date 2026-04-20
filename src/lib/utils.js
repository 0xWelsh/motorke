// src/lib/utils.js
import { estimateDuty as estimateDutyCore, calculateDutyBreakdown, getAgeYearsFromYear, getDefaultDutyRates } from "./duty";

/** Format KES price → "KSh 4,200,000" */
export function formatPrice(amount) {
  let numAmount = Number(amount);
  if (isNaN(numAmount)) return "N/A";
  
  if (numAmount >= 1000000) {
    numAmount = Math.round(numAmount / 10000) * 10000;
  } else if (numAmount >= 100000) {
    numAmount = Math.round(numAmount / 5000) * 5000;
  } else if (numAmount > 1000) {
    numAmount = Math.round(numAmount / 100) * 100;
  }
  
  return `KSh ${numAmount.toLocaleString("en-KE")}`;
}

export function estimateLandedCost(price, year, options = {}) {
  const ageYears = getAgeYearsFromYear(year);
  const breakdown = calculateDutyBreakdown({
    // By default, add standard Export ($450) and Shipping ($2300) = $2750 USD to the FOB price to estimate CIF.
    // Assuming 135 KES/USD for foreign cars.
    cifKes: (Number(price) || 0) + (2750 * 135),
    ageYears,
    engineCC: options.engineCC ?? 1500,
    isElectric: options.isElectric ?? false,
    rates: options.rates || getDefaultDutyRates(),
  });
  // Include standard localized Clearing & Agent fees
  return Math.round(breakdown.landed + 200000);
}

export function formatCarPrice(car, dutyRates = null) {
  if (!car || car.price == null) return "N/A";
  
  if (car.computedLandedPrice) {
    return formatPrice(car.computedLandedPrice);
  }
  
  if (car.dutyPaid === true || car.imported === true) {
    return formatPrice(car.price);
  }
  
  const landedCost = estimateLandedCost(car.price, car.year, {
    engineCC: car.engineCC,
    isElectric: car.fuelType === "ELECTRIC",
    rates: dutyRates || getDefaultDutyRates(),
  });

  return formatPrice(landedCost);
}

/** Format mileage → "38,000 km" */
export function formatMileage(km) {
  if (!km) return "N/A";
  return `${Number(km).toLocaleString("en-KE")} km`;
}

/** Rough import duty estimate (simplified Kenya KRA formula for illustration) */
export function estimateDuty(price, year) {
  return estimateDutyCore(price, year);
}

/** Body type → human label (Expanded for precision) */
export const BODY_TYPE_LABELS = {
  SEDAN:       "Sedan",
  SUV:         "SUV / 4x4",
  HATCHBACK:   "Hatchback",
  PICKUP:      "Pickup",
  VAN:         "Van",
  WAGON:       "Wagon / Estate",
  COUPE:       "Coupe",
  CONVERTIBLE: "Convertible",
  BUS:         "Bus / Coach",
  TRUCK:       "Truck",
};

export const FUEL_LABELS = {
  PETROL:  "Petrol",
  DIESEL:  "Diesel",
  HYBRID:  "Hybrid",
  ELECTRIC:"Electric",
  LPG:     "LPG",
};

export const HYBRID_BATTERY_LABELS = {
  NIMH: "NiMH",
  LI_ION: "Li-ion",
  OTHER: "Other",
  NA: "N/A",
};

export const TRANSMISSION_LABELS = {
  AUTOMATIC: "Automatic",
  MANUAL:    "Manual",
  CVT:       "CVT",
};

export const STEERING_LABELS = {
  RHD: "RHD (Right Hand Drive)",
  LHD: "LHD (Left Hand Drive)",
};

export const DRIVETRAIN_LABELS = {
  FWD:    "FWD (Front Wheel Drive)",
  RWD:    "RWD (Rear Wheel Drive)",
  AWD:    "AWD (All Wheel Drive)",
  FOURWD: "4WD (Four Wheel Drive)",
};

/** Predefined badge options dealers can add to listings */
export const BADGE_OPTIONS = {
  "Available":     { color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  "Sold":          { color: "bg-red-50 text-red-700 border-red-200" },
  "Reserved":      { color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  "Fresh Import":  { color: "bg-blue-50 text-blue-700 border-blue-200" },
  "Duty Free":     { color: "bg-purple-50 text-purple-700 border-purple-200" },
  "Duty Paid":     { color: "bg-teal-50 text-teal-700 border-teal-200" },
  "Low Mileage":   { color: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  "Price Drop":    { color: "bg-orange-50 text-orange-700 border-orange-200" },
  "Hot Deal":      { color: "bg-rose-50 text-rose-700 border-rose-200" },
  "Clearance":     { color: "bg-amber-50 text-amber-700 border-amber-200" },
  "One Owner":     { color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  "Financing OK":  { color: "bg-lime-50 text-lime-700 border-lime-200" },
};

/** Clamp a number between min and max */
export function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

/** Build WhatsApp link for a car enquiry */
export function whatsappLink(whatsapp, carTitle, dealerName) {
  const msg = encodeURIComponent(
    `Hi ${dealerName}, I'm interested in the ${carTitle} listed on Motorke. Is it still available?`
  );
  return `https://wa.me/${whatsapp}?text=${msg}`;
}
