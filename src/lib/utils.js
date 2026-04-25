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
export {
  BODY_TYPE_LABELS,
  FUEL_LABELS,
  HYBRID_BATTERY_LABELS,
  TRANSMISSION_LABELS,
  STEERING_LABELS,
  DRIVETRAIN_LABELS,
  BADGE_OPTIONS,
} from "./constants";

/** Clamp a number between min and max */
export function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

/** Build WhatsApp link for a car enquiry */
export function whatsappLink(whatsapp, carTitle, dealerName) {
  const msg = encodeURIComponent(
    `Hi ${dealerName}, I'm interested in the ${carTitle} listed on Welsh Motors. Is it still available?`
  );
  return `https://wa.me/${whatsapp}?text=${msg}`;
}
