// src/lib/constants.js

export const VEHICLE_TYPE_LABELS = {
  CAR: "Car",
  MOTORBIKE: "Motorbike",
};

export const BODY_TYPE_LABELS = {
  SEDAN:       "Sedan",
  SUV:         "SUV / 4x4",
  HATCHBACK:   "Hatchback",
  PICKUP:      "Pickup",
  VAN:         "Van",
  WAGON:       "Wagon / Estate",
  COUPE:       "Coupe",
  CONVERTIBLE: "Convertible",
  CROSSOVER:   "Crossover",
  MPV:         "MPV",
  MINIVAN:     "Minivan",
  ROADSTER:    "Roadster",
  LIFTBACK:    "Liftback",
  BUS:         "Bus / Coach",
  TRUCK:       "Truck",
};

export const FUEL_LABELS = {
  PETROL:   "Petrol",
  DIESEL:   "Diesel",
  HYBRID:   "Hybrid",
  ELECTRIC: "Electric",
  LPG:      "LPG",
};

export const HYBRID_BATTERY_LABELS = {
  NIMH:   "NiMH",
  LI_ION: "Li-ion",
  OTHER:  "Other",
  NA:     "N/A",
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

export const CAR_STATUS_LABELS = {
  IN_YARD: "In Yard",
  WITH_OWNER: "With Owner",
  IN_TRANSIT: "In Transit",
  AT_PORT: "At Port",
};

export const CAR_STATUS_COLORS = {
  IN_YARD: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300",
  WITH_OWNER: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300",
  IN_TRANSIT: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300",
  AT_PORT: "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-300",
};

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
