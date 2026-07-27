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
  IN_YARD: "bg-blue-900/20 text-blue-300 border-blue-200",
  WITH_OWNER: "bg-purple-900/20 text-purple-300 border-purple-200",
  IN_TRANSIT: "bg-amber-900/20 text-amber-300 border-amber-200",
  AT_PORT: "bg-cyan-900/20 text-cyan-300 border-cyan-200",
};

export const BADGE_OPTIONS = {
  "Available":     { color: "bg-emerald-900/20 text-emerald-300 border-emerald-800" },
  "Sold":          { color: "bg-red-900/20 text-red-300 border-red-800" },
  "Reserved":      { color: "bg-yellow-900/20 text-yellow-300 border-yellow-800" },
  "Fresh Import":  { color: "bg-blue-900/20 text-blue-300 border-blue-800" },
  "Duty Free":     { color: "bg-purple-900/20 text-purple-300 border-purple-800" },
  "Duty Paid":     { color: "bg-teal-900/20 text-teal-300 border-teal-800" },
  "Low Mileage":   { color: "bg-cyan-900/20 text-cyan-300 border-cyan-800" },
  "Price Drop":    { color: "bg-orange-900/20 text-orange-300 border-orange-800" },
  "Hot Deal":      { color: "bg-rose-900/20 text-rose-300 border-rose-800" },
  "Clearance":     { color: "bg-amber-900/20 text-amber-300 border-amber-800" },
  "One Owner":     { color: "bg-indigo-900/20 text-indigo-300 border-indigo-800" },
  "Financing OK":  { color: "bg-lime-900/20 text-lime-300 border-lime-800" },
};
