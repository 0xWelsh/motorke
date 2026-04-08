function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export const DEFAULT_KENYA_COMPARISON_POLICY = {
  annualMileageKm: 18000,
  maxImportAgeYears: 8,
  trafficMultipliers: {
    PETROL: 1.35,
    DIESEL: 1.25,
    HYBRID: 1.1,
    ELECTRIC: 1.08,
    LPG: 1.2,
  },
  fuelPriceKesPerLiter: {
    PETROL: 198,
    DIESEL: 182,
    HYBRID: 198,
    LPG: 130,
  },
  electricityPriceKesPerKwh: 35,
  insuranceBaseRate: 0.035,
  maintenancePerKmKes: {
    PETROL: 8,
    DIESEL: 9,
    HYBRID: 6,
    ELECTRIC: 4,
    LPG: 7,
  },
  maintenanceAgeFactorPerYear: 0.03,
  road: {
    minimumPracticalMm: 145,
    idealMm: 185,
    baselineByBodyType: {
      SEDAN: 145,
      HATCHBACK: 150,
      WAGON: 155,
      COUPE: 135,
      CONVERTIBLE: 130,
      SUV: 195,
      PICKUP: 215,
      VAN: 185,
      BUS: 210,
      TRUCK: 230,
    },
  },
  spareIndexByMake: {
    Toyota: 9,
    Nissan: 8,
    Honda: 8,
    Mazda: 8,
    Subaru: 7,
    Mitsubishi: 7,
    Suzuki: 8,
    Isuzu: 8,
    Hyundai: 7,
    Kia: 7,
    "Mercedes-Benz": 6,
    BMW: 5,
    Audi: 5,
    Volkswagen: 6,
    "Land Rover": 4,
  },
};

export function deriveImportEligibility(year, referenceDate = new Date(), policy = DEFAULT_KENYA_COMPARISON_POLICY) {
  const y = toNumber(year);
  if (!y) return null;
  const currentYear = referenceDate.getFullYear();
  const age = Math.max(0, currentYear - y);
  return age <= policy.maxImportAgeYears;
}

export function getTrafficFuelMultiplier(fuelType, policy = DEFAULT_KENYA_COMPARISON_POLICY) {
  return policy.trafficMultipliers[fuelType] || 1.2;
}

function estimateBaseLitersPer100Km(engineCC, fuelType) {
  const cc = toNumber(engineCC) || 1500;
  let base;

  if (cc <= 1000) base = 4.8;
  else if (cc <= 1300) base = 5.6;
  else if (cc <= 1500) base = 6.5;
  else if (cc <= 1800) base = 7.4;
  else if (cc <= 2000) base = 8.2;
  else if (cc <= 2500) base = 9.1;
  else if (cc <= 3000) base = 10.4;
  else base = 12;

  if (fuelType === "HYBRID") base *= 0.72;
  if (fuelType === "DIESEL") base *= 0.88;
  if (fuelType === "LPG") base *= 1.05;

  return base;
}

function estimateBaseKwhPer100Km(bodyType) {
  if (bodyType === "SUV" || bodyType === "PICKUP" || bodyType === "VAN") return 19;
  if (bodyType === "TRUCK" || bodyType === "BUS") return 24;
  return 16;
}

export function estimateAnnualEnergyCost(car, policy = DEFAULT_KENYA_COMPARISON_POLICY) {
  const annualKm = policy.annualMileageKm;
  const multiplier = getTrafficFuelMultiplier(car?.fuelType, policy);

  if (car?.fuelType === "ELECTRIC") {
    const adjustedKwhPer100 = estimateBaseKwhPer100Km(car?.bodyType) * multiplier;
    const annualKwh = (adjustedKwhPer100 / 100) * annualKm;
    const annualFuelCost = annualKwh * policy.electricityPriceKesPerKwh;

    return {
      energyUnit: "kWh",
      adjustedPer100: adjustedKwhPer100,
      annualUnits: annualKwh,
      annualFuelCost,
      trafficMultiplier: multiplier,
    };
  }

  const adjustedLPer100 = estimateBaseLitersPer100Km(car?.engineCC, car?.fuelType) * multiplier;
  const annualLiters = (adjustedLPer100 / 100) * annualKm;
  const pricePerLiter = policy.fuelPriceKesPerLiter[car?.fuelType] || policy.fuelPriceKesPerLiter.PETROL;
  const annualFuelCost = annualLiters * pricePerLiter;

  return {
    energyUnit: "L",
    adjustedPer100: adjustedLPer100,
    annualUnits: annualLiters,
    annualFuelCost,
    trafficMultiplier: multiplier,
  };
}

export function estimateAnnualInsurance(car, policy = DEFAULT_KENYA_COMPARISON_POLICY) {
  const price = toNumber(car?.price) || 0;
  const currentYear = new Date().getFullYear();
  const age = Math.max(0, currentYear - (toNumber(car?.year) || currentYear));
  const ageModifier = clamp(1 - age * 0.025, 0.78, 1.05);
  return price * policy.insuranceBaseRate * ageModifier;
}

export function estimateAnnualMaintenance(car, policy = DEFAULT_KENYA_COMPARISON_POLICY) {
  const perKm = policy.maintenancePerKmKes[car?.fuelType] || 8;
  const currentYear = new Date().getFullYear();
  const age = Math.max(0, currentYear - (toNumber(car?.year) || currentYear));
  const ageFactor = 1 + age * policy.maintenanceAgeFactorPerYear;
  const turboFactor = car?.turbo ? 1.08 : 1;
  const drivetrainFactor = car?.drivetrain === "AWD" || car?.drivetrain === "FOURWD" ? 1.1 : 1;

  return policy.annualMileageKm * perKm * ageFactor * turboFactor * drivetrainFactor;
}

export function computeRoadSuitabilityScore(car, policy = DEFAULT_KENYA_COMPARISON_POLICY) {
  const providedClearance = toNumber(car?.groundClearanceMm);
  const fallbackClearance = policy.road.baselineByBodyType[car?.bodyType] || 155;
  const clearance = providedClearance || fallbackClearance;

  const min = policy.road.minimumPracticalMm;
  const ideal = policy.road.idealMm;
  const clearanceScore = clamp(((clearance - min) / (ideal - min)) * 70, 5, 70);

  const drivetrainBonus =
    car?.drivetrain === "FOURWD" ? 20 :
    car?.drivetrain === "AWD" ? 17 :
    car?.drivetrain === "RWD" ? 8 : 10;

  const bodyBonus =
    car?.bodyType === "SUV" || car?.bodyType === "PICKUP" || car?.bodyType === "VAN" ? 10 :
    car?.bodyType === "TRUCK" || car?.bodyType === "BUS" ? 12 : 6;

  return Math.round(clamp(clearanceScore + drivetrainBonus + bodyBonus, 1, 100));
}

export function resolveSpareAvailabilityScore(car, policy = DEFAULT_KENYA_COMPARISON_POLICY) {
  const stated = toNumber(car?.spareAvailability);
  if (stated) return clamp(Math.round(stated), 1, 10);

  const make = String(car?.make || "").trim();
  if (make && policy.spareIndexByMake[make]) return policy.spareIndexByMake[make];
  return 5;
}

export function estimateAnnualTco(car, policy = DEFAULT_KENYA_COMPARISON_POLICY) {
  const energy = estimateAnnualEnergyCost(car, policy);
  const insurance = estimateAnnualInsurance(car, policy);
  const maintenance = estimateAnnualMaintenance(car, policy);
  const annualTotal = energy.annualFuelCost + insurance + maintenance;

  return {
    annualFuelCost: energy.annualFuelCost,
    annualInsurance: insurance,
    annualMaintenance: maintenance,
    annualTotal,
    trafficMultiplier: energy.trafficMultiplier,
    adjustedEnergyPer100: energy.adjustedPer100,
    annualEnergyUnits: energy.annualUnits,
    energyUnit: energy.energyUnit,
  };
}

export function computeComparisonInsights(car, policy = DEFAULT_KENYA_COMPARISON_POLICY) {
  const derivedImportEligibility = deriveImportEligibility(car?.year, new Date(), policy);

  return {
    importEligibility: typeof car?.importEligibility === "boolean" ? car.importEligibility : derivedImportEligibility,
    roadSuitabilityScore: computeRoadSuitabilityScore(car, policy),
    spareAvailabilityScore: resolveSpareAvailabilityScore(car, policy),
    tco: estimateAnnualTco(car, policy),
  };
}
