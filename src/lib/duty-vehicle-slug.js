import { slugifyCarSegment } from "@/lib/seo-car-slug";

export function buildDutyVehicleSlug({ make, model, year, trim }) {
  const parts = [make, model, trim, year].filter(Boolean).map((p) => slugifyCarSegment(p));
  return parts.filter(Boolean).join("-");
}

export function dutyVehicleLabel(vehicle) {
  const trim = vehicle.trim ? ` ${vehicle.trim}` : "";
  return `${vehicle.year} ${vehicle.make} ${vehicle.model}${trim}`;
}

export function carsHubPathForDutyVehicle(vehicle) {
  const make = slugifyCarSegment(vehicle.make);
  const model = slugifyCarSegment(vehicle.model);
  if (make && model) return `/cars/${make}/${model}`;
  if (make) return `/cars/${make}`;
  return "/cars";
}
