import {
  BODY_TYPE_LABELS,
  DRIVETRAIN_LABELS,
  FUEL_LABELS,
  HYBRID_BATTERY_LABELS,
  STEERING_LABELS,
  TRANSMISSION_LABELS,
} from "@/lib/constants";
import { formatMileage } from "@/lib/utils";
import { meaningfulFeatureList, positiveNum } from "@/lib/car-display";
import { stockCode } from "@/lib/stock-code";

/**
 * Listing detail fields for the detail page.
 *
 * Two tiers: `primary` renders in the always-open details grid, `secondary`
 * stays hidden behind "Show all" so a sparse listing doesn't read as a
 * template and a rich one doesn't open as a wall of text.
 *
 * Every row is only emitted when the underlying field actually holds a
 * value — no placeholder dashes.
 */

const ORIGIN_FLAGS = {
  Japan: "🇯🇵",
  UK: "🇬🇧",
  USA: "🇺🇸",
  UAE: "🇦🇪",
  Germany: "🇩🇪",
  "South Africa": "🇿🇦",
  Thailand: "🇹🇭",
  Singapore: "🇸🇬",
};

function conditionLabel(condition) {
  if (condition === "NEW") return "Brand new";
  if (condition === "CERTIFIED") return "Certified used";
  if (condition === "USED") return "Used";
  return null;
}

function transmissionLabel(value) {
  if (!value) return null;
  return TRANSMISSION_LABELS[value] || value;
}

function bodyLabel(value) {
  if (!value) return null;
  return BODY_TYPE_LABELS[value] || value;
}

function importLabel(car) {
  if (car.imported === false) return "Locally used";
  if (car.importCountry?.trim()) {
    const flag = ORIGIN_FLAGS[car.importCountry.trim()];
    return `Imported from ${car.importCountry.trim()}${flag ? ` ${flag}` : ""}`;
  }
  return car.imported === true ? "Imported" : null;
}

/**
 * Detail rows, split into an always-visible tier and a "Show all" tier.
 *
 * Labels are unique across both tiers: the same field is never listed twice
 * under two headings (the old build emitted Condition in both tiers, so a used
 * import showed "Used" and then "Used" again behind Show all).
 *
 * Every row is only emitted when the underlying field actually holds a
 * value — no placeholder dashes.
 *
 * @returns {{ primary: {label:string, value:string}[], secondary: {label:string, value:string}[] }}
 */
export function buildDetailFieldRows(car) {
  const primary = [];
  const secondary = [];
  const seenLabels = new Set();

  const push = (tier, label, value) => {
    const v = typeof value === "string" ? value.trim() : value;
    if (!v) return;
    const key = label.toLowerCase();
    if (seenLabels.has(key)) return;
    seenLabels.add(key);
    (tier === "primary" ? primary : secondary).push({ label, value: String(v) });
  };

  // ── Always-visible essentials ─────────────────────────────────────────
  push("primary", "Year", car.year);
  push("primary", "Make", car.make);
  push("primary", "Model", [car.model, car.variant].filter(Boolean).join(" "));
  push("primary", "Body", bodyLabel(car.bodyType));
  push("primary", "Fuel", car.fuelType ? FUEL_LABELS[car.fuelType] || car.fuelType : null);
  push("primary", "Transmission", transmissionLabel(car.transmission));
  push("primary", "Mileage", positiveNum(car.mileage) ? formatMileage(car.mileage) : null);
  push("primary", "Engine size", positiveNum(car.engineCC) ? `${Number(car.engineCC).toLocaleString("en-KE")} cc` : null);
  push("primary", "Color", car.color);
  // Falls back to the import origin so an unsorted listing still reads clearly;
  // the secondary tier will not repeat it under "Origin" because push() dedupes.
  push("primary", "Condition", conditionLabel(car.condition) || importLabel(car));

  // ── Behind "Show all" ─────────────────────────────────────────────────
  push("secondary", "Stock no.", stockCode(car));
  push("secondary", "Origin", importLabel(car));
  push("secondary", "Drivetrain", car.drivetrain ? DRIVETRAIN_LABELS[car.drivetrain] || car.drivetrain : null);
  push("secondary", "Steering", car.steering ? STEERING_LABELS[car.steering] || car.steering : null);
  push("secondary", "Doors", positiveNum(car.doors) ? String(Number(car.doors)) : null);
  push("secondary", "Seats", positiveNum(car.seats) ? String(Number(car.seats)) : null);
  push("secondary", "Cylinders", positiveNum(car.cylinders) ? String(Number(car.cylinders)) : null);
  push("secondary", "Horsepower", positiveNum(car.horsepower) ? `${Math.round(Number(car.horsepower))} hp` : null);
  push("secondary", "Torque", positiveNum(car.torque) ? `${Math.round(Number(car.torque))} Nm` : null);
  push("secondary", "Turbo", car.turbo === true ? "Turbocharged" : null);
  push("secondary", "Airbags", positiveNum(car.airbags) ? String(Number(car.airbags)) : null);
  push("secondary", "Sunroof", car.sunroof === true ? "Yes" : null);
  push("secondary", "Ground clearance", positiveNum(car.groundClearanceMm) ? `${Number(car.groundClearanceMm)} mm` : null);
  push("secondary", "Hybrid battery", car.hybridBatteryTech ? HYBRID_BATTERY_LABELS[car.hybridBatteryTech] : null);
  push("secondary", "Duty status", car.dutyPaid === true ? "Duty paid" : car.dutyPaid === false ? "Duty not paid" : null);
  push(
    "secondary",
    "Import eligibility",
    car.importEligibility === true ? "Eligible" : car.importEligibility === false ? "Not eligible" : null
  );
  push("secondary", "Registration", car.registered === false ? "Not registered" : car.registered === true ? "Registered" : null);
  push("secondary", "Spare availability", positiveNum(car.spareAvailability) ? `${Number(car.spareAvailability)}/10` : null);
  push("secondary", "Negotiable", car.negotiable === true ? "Yes" : null);

  return { primary, secondary };
}

/**
 * Features for display: placeholder values dropped, duplicates collapsed
 * case- and punctuation-insensitively, capped for sane rendering.
 * `meaningfulFeatureList` already de-duplicates, so this only applies the cap.
 */
export function buildFeatureItems(car, limit = 24) {
  return meaningfulFeatureList(car.features).slice(0, limit);
}

export { ORIGIN_FLAGS };
