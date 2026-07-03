// src/lib/utils.js
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

export function formatCarPrice(car) {
  if (!car || car.price == null || car.price === 0) return "Contact for price";
  return formatPrice(car.price);
}

/** Format mileage → "38,000 km" */
export function formatMileage(km) {
  if (!km) return "N/A";
  return `${Number(km).toLocaleString("en-KE")} km`;
}

/** Body type → human label (Expanded for precision) */
export {
  BODY_TYPE_LABELS,
  FUEL_LABELS,
  HYBRID_BATTERY_LABELS,
  TRANSMISSION_LABELS,
  STEERING_LABELS,
  DRIVETRAIN_LABELS,
  VEHICLE_TYPE_LABELS,
  BADGE_OPTIONS,
} from "./constants";

/** Clamp a number between min and max */
export function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

/** Build WhatsApp link for a car enquiry (wa.me expects digits, country code, no +) */
export function whatsappLink(whatsapp, carTitle, dealerName) {
  const digits = String(whatsapp ?? "").replace(/\D/g, "");
  if (!digits) return "#";
  const msg = encodeURIComponent(
    `Hi ${dealerName}, I am interested in the ${carTitle}. Is it still available? Please share final price and viewing details.`
  );
  return `https://wa.me/${digits}?text=${msg}`;
}
