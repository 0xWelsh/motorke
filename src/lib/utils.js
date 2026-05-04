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
  if (!car || car.price == null) return "N/A";
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
  BADGE_OPTIONS,
} from "./constants";

/** Clamp a number between min and max */
export function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

/** Build WhatsApp link for a car enquiry */
export function whatsappLink(whatsapp, carTitle, dealerName) {
  const msg = encodeURIComponent(
    `Hi ${dealerName}, I'm interested in the ${carTitle} listed on Welsh Motorhub. Is it still available?`
  );
  return `https://wa.me/${whatsapp}?text=${msg}`;
}
