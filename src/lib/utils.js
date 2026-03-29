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

export const TRANSMISSION_LABELS = {
  AUTOMATIC: "Automatic",
  MANUAL:    "Manual",
  CVT:       "CVT",
};

export const DRIVE_TYPE_LABELS = {
  RHD:    "RHD (Right Hand Drive)",
  LHD:    "LHD (Left Hand Drive)",
  AWD:    "AWD (All Wheel Drive)",
  FWD:    "FWD (Front Wheel Drive)",
  RWD:    "RWD (Rear Wheel Drive)",
  FOURWD: "4WD (Four Wheel Drive)",
};

/** Predefined badge options dealers can add to listings */
export const BADGE_OPTIONS = {
  "Available":     { color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  "Sold":          { color: "bg-red-500/20 text-red-400 border-red-500/30" },
  "Reserved":      { color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  "Fresh Import":  { color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  "Duty Free":     { color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  "Duty Paid":     { color: "bg-teal-500/20 text-teal-400 border-teal-500/30" },
  "Low Mileage":   { color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
  "Price Drop":    { color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  "Hot Deal":      { color: "bg-rose-500/20 text-rose-400 border-rose-500/30" },
  "Clearance":     { color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  "One Owner":     { color: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30" },
  "Financing OK":  { color: "bg-lime-500/20 text-lime-400 border-lime-500/30" },
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
