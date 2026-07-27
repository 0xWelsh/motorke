// src/components/compare/compare-utils.js

export function shouldShowSpec(spec, preset) {
  return preset === "all" || spec.tags.includes(preset);
}

export function isMissing(raw) {
  return raw === null || raw === undefined || raw === "";
}

export function isAllNA(spec, cars) {
  if (!cars || cars.length === 0) return true;
  return cars.every((car) => isMissing(spec.pick(car).raw));
}

export function isDifferent(spec, cars) {
  if (cars.length < 2) return false;

  const values = cars.map((car) => {
    const raw = spec.pick(car).raw;
    if (raw === null || raw === undefined || raw === "") return "__na__";
    return typeof raw === "string" ? raw.toLowerCase() : raw;
  });

  return new Set(values).size > 1;
}

export function getBest(spec, cars) {
  if (cars.length < 2 || !spec.rank) return null;

  if (spec.rank === "booltrue") {
    return cars.some((car) => spec.pick(car).raw === true) ? true : null;
  }

  const values = cars
    .map((car) => spec.pick(car).raw)
    .filter((value) => typeof value === "number");

  if (values.length < 2) return null;
  return spec.rank === "min" ? Math.min(...values) : Math.max(...values);
}

export function getDiffSeverity(spec, cars) {
  if (cars.length < 2 || !isDifferent(spec, cars)) return "none";

  if (spec.rank === "booltrue") return "moderate";

  const numeric = cars
    .map((car) => spec.pick(car).raw)
    .filter((value) => typeof value === "number");

  if (numeric.length >= 2) {
    const min = Math.min(...numeric);
    const max = Math.max(...numeric);
    const ratio = Math.abs(max - min) / Math.max(Math.abs(max), 1);
    if (ratio >= 0.35) return "major";
    if (ratio >= 0.15) return "moderate";
    return "minor";
  }

  return "minor";
}

export function getGaugePercent(spec, cars, raw) {
  if (typeof raw !== "number" || (spec.rank !== "min" && spec.rank !== "max")) return null;

  const values = cars
    .map((car) => spec.pick(car).raw)
    .filter((value) => typeof value === "number");

  if (values.length < 2) return 100;
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return 100;

  if (spec.rank === "min") {
    return Math.round(((max - raw) / (max - min)) * 100);
  }

  return Math.round(((raw - min) / (max - min)) * 100);
}

export function formatKesCompact(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return "N/A";
  if (value >= 1000000) return `KSh ${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `KSh ${(value / 1000).toFixed(0)}K`;
  return `KSh ${Math.round(value)}`;
}

export function roadTone(score) {
  if (typeof score !== "number") return "border-white/[0.06] bg-white/[0.03] text-zinc-400";
  if (score >= 80) return "border-white bg-white text-[#1c1c1c]";
  if (score >= 65) return "border-white/[0.08] bg-white/[0.06] text-zinc-300";
  if (score >= 50) return "border-white/[0.06] bg-white/[0.03] text-zinc-300";
  return "border-white/[0.06] bg-white/[0.03] text-zinc-400";
}

export function carPhotoUrl(car) {
  if (!car) return null;
  const u = car?.images?.[0]?.url ?? car?.image;
  return u || null;
}

export function importTone(eligible) {
  if (eligible === true) return "border-white bg-white text-[#1c1c1c]";
  if (eligible === false) return "border-white/[0.06] bg-white/[0.03] text-zinc-300";
  return "border-white/[0.06] bg-white/[0.03] text-zinc-400";
}
