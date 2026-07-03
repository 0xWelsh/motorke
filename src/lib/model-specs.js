// src/lib/model-specs.js
// Lookup reference specs for a car make/model/variant/year.

import { db } from "@/lib/db";

const FILLABLE_FIELDS = [
  "bodyType", "vehicleType", "engineCC", "cylinders", "horsepower", "torque",
  "fuelType", "transmission", "drivetrain", "steering", "seats", "doors",
  "airbags", "groundClearanceMm", "turbo", "sunroof",
  "curbWeightKg", "fuelTankLiters",
];

/**
 * Find the best matching reference spec for a given car description.
 * Matches on (make, model, variant, year) with fallback to (make, model, year) if no variant match.
 */
export async function findMatchingSpec({ make, model, variant, year }) {
  if (!make || !model || !year) return null;

  const normalizedYear = Number(year);
  if (!Number.isFinite(normalizedYear)) return null;

  const normMake = make.trim();
  const normModel = model.trim();
  const normVariant = variant?.trim() || null;

  const yearFilter = {
    yearStart: { lte: normalizedYear },
    OR: [
      { yearEnd: null },
      { yearEnd: { gte: normalizedYear } },
    ],
  };

  // First try: exact match on make + model + variant + year range
  if (normVariant) {
    const exact = await db.carModelSpec.findFirst({
      where: {
        make: { equals: normMake, mode: "insensitive" },
        model: { equals: normModel, mode: "insensitive" },
        variant: { equals: normVariant, mode: "insensitive" },
        ...yearFilter,
      },
      orderBy: { yearStart: "desc" },
    });
    if (exact) return exact;
  }

  // Second try: match on make + model + year range (any variant)
  const anyVariant = await db.carModelSpec.findFirst({
    where: {
      make: { equals: normMake, mode: "insensitive" },
      model: { equals: normModel, mode: "insensitive" },
      ...yearFilter,
    },
    orderBy: { yearStart: "desc" },
  });
  if (anyVariant) return anyVariant;

  // Third try: match on make + model, any year range, pick closest
  const fallback = await db.carModelSpec.findFirst({
    where: {
      make: { equals: normMake, mode: "insensitive" },
      model: { equals: normModel, mode: "insensitive" },
    },
    orderBy: { yearStart: "desc" },
  });

  return fallback || null;
}

/**
 * Build an object of fillable fields from a reference spec.
 * Only returns non-null fields that can be used to populate a Car record.
 */
export function specToFillData(spec) {
  if (!spec) return {};

  const fill = {};
  for (const field of FILLABLE_FIELDS) {
    if (spec[field] !== null && spec[field] !== undefined) {
      fill[field] = spec[field];
    }
  }
  return fill;
}

/**
 * Get auto-fill data for a car. Looks up reference specs and returns
 * fillable fields. Returns empty object if no match found.
 */
export async function getAutoFillData({ make, model, variant, year }) {
  const spec = await findMatchingSpec({ make, model, variant, year });
  if (!spec) return {};
  return {
    ...specToFillData(spec),
    _specId: spec.id,
    _specVariant: spec.variant,
  };
}

export { FILLABLE_FIELDS };
