import { BODY_TYPE_LABELS, FUEL_LABELS, TRANSMISSION_LABELS } from "@/lib/constants";
import { formatMileage } from "@/lib/utils";
import { positiveNum } from "@/lib/car-display";

/** Up to 6 chips for the listing summary sidebar. */
export function buildListingHighlightChips(car, dealer) {
  const chips = [];

  if (car.year) chips.push({ label: "Year", value: String(car.year) });

  if (positiveNum(car.mileage)) {
    const m = formatMileage(car.mileage);
    if (m && m !== "N/A") chips.push({ label: "Mileage", value: m });
  }

  const fuel = car.fuelType ? FUEL_LABELS[car.fuelType] : null;
  if (fuel) chips.push({ label: "Fuel", value: fuel });

  const trans = car.transmission ? TRANSMISSION_LABELS[car.transmission] : null;
  if (trans) chips.push({ label: "Gearbox", value: trans });

  const place = car.location || dealer?.location || dealer?.county;
  if (place) chips.push({ label: "Location", value: place });

  const body = car.bodyType ? BODY_TYPE_LABELS[car.bodyType] : null;
  if (body) chips.push({ label: "Body", value: body.split("/")[0].trim() });

  return chips.slice(0, 6);
}
