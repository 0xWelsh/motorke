import {
  BODY_TYPE_LABELS,
  FUEL_LABELS,
  TRANSMISSION_LABELS,
  STEERING_LABELS,
  DRIVETRAIN_LABELS,
} from "@/lib/constants";
import { formatMileage } from "@/lib/utils";

/** Positive finite number (> 0). */
export function positiveNum(n) {
  const x = Number(n);
  return Number.isFinite(x) && x > 0;
}

/**
 * Listing / chip text from free-text feature arrays — drop empty, "0", "N/A", etc.
 */
export function meaningfulFeatureList(features) {
  if (!Array.isArray(features)) return [];
  return features
    .map((s) => String(s ?? "").trim())
    .filter((s) => {
      if (!s) return false;
      const L = s.toLowerCase();
      if (["n/a", "na", "none", "-", "—", "null", "undefined", "nil"].includes(L)) return false;
      if (L === "0" || /^0+\.?0*$/.test(L)) return false;
      return true;
    });
}

/** One-line spec fragments for cards and detail intro (no fake V8 / twin turbo). */
export function buildCarSpecSummaryItems(car) {
  const parts = [];
  if (positiveNum(car.horsepower)) parts.push(`${Math.round(Number(car.horsepower))} HP`);
  if (positiveNum(car.torque)) parts.push(`${Math.round(Number(car.torque))} Nm`);
  if (positiveNum(car.engineCC)) {
    let eng = `${(Number(car.engineCC) / 1000).toFixed(1)}L`;
    if (positiveNum(car.cylinders)) eng += ` · ${Number(car.cylinders)} cyl`;
    if (car.turbo) eng += " · Turbo";
    parts.push(eng);
  }
  if (car.transmission) parts.push(car.transmission === "AUTOMATIC" ? "AT" : "MT");
  if (car.drivetrain) parts.push(car.drivetrain);
  if (car.fuelType) {
    const f = FUEL_LABELS[car.fuelType] || car.fuelType;
    if (f) parts.push(f);
  }
  if (car.sunroof) parts.push("Sunroof");
  if (car.description?.toLowerCase().includes("leather")) parts.push("Leather interior");
  return parts;
}

function labelPresent(value) {
  if (value === null || value === undefined) return false;
  const s = String(value).trim();
  if (!s || s === "N/A" || s === "0") return false;
  return true;
}

/**
 * Vehicle detail grid rows — omit unset / zero / N/A so the page does not look like a template.
 */
export function buildCarDetailSpecRows(car) {
  const rows = [];

  if (car.year) rows.push({ label: "Year", value: String(car.year) });

  if (positiveNum(car.mileage)) {
    const m = formatMileage(car.mileage);
    if (m && m !== "N/A") rows.push({ label: "Mileage", value: m });
  }

  const fuel = car.fuelType ? FUEL_LABELS[car.fuelType] : null;
  if (labelPresent(fuel)) rows.push({ label: "Fuel", value: fuel });

  const trans = car.transmission ? TRANSMISSION_LABELS[car.transmission] : null;
  if (labelPresent(trans)) rows.push({ label: "Transmission", value: trans });

  const drive = car.drivetrain ? DRIVETRAIN_LABELS[car.drivetrain] : null;
  if (labelPresent(drive)) rows.push({ label: "Drivetrain", value: drive });

  const steer = car.steering ? STEERING_LABELS[car.steering] : null;
  if (labelPresent(steer)) rows.push({ label: "Steering", value: steer });

  const body = car.bodyType ? BODY_TYPE_LABELS[car.bodyType] : null;
  if (labelPresent(body)) rows.push({ label: "Body type", value: body });

  if (positiveNum(car.engineCC)) {
    rows.push({ label: "Engine size", value: `${Number(car.engineCC)}cc` });
  }
  if (positiveNum(car.cylinders)) {
    rows.push({ label: "Cylinders", value: String(Number(car.cylinders)) });
  }
  if (positiveNum(car.horsepower)) {
    rows.push({ label: "Horsepower", value: `${Number(car.horsepower)} hp` });
  }
  if (positiveNum(car.torque)) {
    rows.push({ label: "Torque", value: `${Number(car.torque)} Nm` });
  }
  if (car.turbo === true) rows.push({ label: "Turbocharged", value: "Yes" });

  if (positiveNum(car.seats)) rows.push({ label: "Seats", value: String(Number(car.seats)) });
  if (positiveNum(car.airbags)) rows.push({ label: "Airbags", value: String(Number(car.airbags)) });
  if (car.sunroof === true) rows.push({ label: "Sunroof", value: "Yes" });

  if (car.color?.trim()) rows.push({ label: "Color", value: car.color.trim() });
  if (car.condition) rows.push({ label: "Condition", value: car.condition });

  rows.push({
    label: "Registration",
    value: car.registered === false ? "Not registered" : "Registered (Kenya)",
  });

  return rows;
}
