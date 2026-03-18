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

/** Body type → human label */
export const BODY_TYPE_LABELS = {
  SEDAN:      "Sedan",
  SUV:        "SUV",
  HATCHBACK:  "Hatchback",
  PICKUP:     "Pickup",
  VAN:        "Van",
  WAGON:      "Wagon/Estate",
  COUPE:      "Coupe",
  CONVERTIBLE:"Convertible",
  BUS:        "Bus/Matatu",
  TRUCK:      "Truck",
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
