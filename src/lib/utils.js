// src/lib/utils.js

/** Format KES price → "KSh 4,200,000" */
export function formatPrice(amount) {
  return `KSh ${Number(amount).toLocaleString("en-KE")}`;
}

/** Format mileage → "38,000 km" */
export function formatMileage(km) {
  if (!km) return "N/A";
  return `${Number(km).toLocaleString("en-KE")} km`;
}

/** Rough import duty estimate (simplified Kenya KRA formula for illustration) */
export function estimateDuty(price, year) {
  const age = new Date().getFullYear() - year;
  // Kenya depreciates customs value: 10% per year after yr 1, capped at 70%
  const depreciation = Math.min(age * 0.10, 0.70);
  const customsValue = price * (1 - depreciation);
  const importDuty    = customsValue * 0.25;  // 25% IDF
  const exciseDuty    = customsValue * 0.20;  // 20% excise
  const vat           = (customsValue + importDuty + exciseDuty) * 0.16; // 16% VAT
  const rdl           = 10000; // Registration & road levies (KES)
  return Math.round(importDuty + exciseDuty + vat + rdl);
}

/** Body type → human label (Expanded for precision) */
export const BODY_TYPE_LABELS = {
  SEDAN:          "Sedan",
  SUV_COMPACT:    "Compact SUV / Crossover",
  SUV_FULL:       "Full-size SUV / 4x4",
  HATCHBACK:      "Hatchback",
  PICKUP_SINGLE:  "Pickup (Single Cab)",
  PICKUP_DOUBLE:  "Pickup (Double Cab)",
  VAN_PASSENGER:  "Passenger Van / Matatu",
  VAN_CARGO:      "Cargo Van",
  WAGON:          "Wagon / Estate",
  COUPE:          "Coupe",
  CONVERTIBLE:    "Convertible",
  BUS:            "Bus / Coach",
  TRUCK_LIGHT:    "Light Truck / Canter",
  TRUCK_HEAVY:    "Heavy Truck / Prime Mover",
  MINIVAN:        "Minivan / MPV",
  MOTORCYCLE:     "Motorcycle",
};

export const FUEL_LABELS = {
  PETROL:  "Petrol",
  DIESEL:  "Diesel",
  HYBRID:  "Hybrid",
  ELECTRIC:"Electric",
  LPG:     "LPG",
};

export const TRANSMISSION_LABELS = {
  AUTOMATIC: "Automatic",
  MANUAL:    "Manual",
  CVT:       "CVT",
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
