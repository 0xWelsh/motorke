/**
 * Slim car payload for client-rendered cards.
 *
 * The homepage renders ~88 cars and every card is a client component, so
 * whatever shape we pass becomes part of the RSC flight payload the browser
 * downloads. Querying with `include` hands back all 65 Car columns per row —
 * specs, duty flags, boost counters, descriptions, branch — and ~59 of them
 * are never read by any card.
 *
 * This mapper trims the row to the fields the cards actually touch, roughly
 * cutting the serialized car from ~3KB to a few hundred bytes. The full record
 * stays available server-side; we only slim the object crossing the boundary.
 */

// Fields read by NikkyoStockCard, CarCard, HeroCarousel and AdminCardControls.
const CARD_FIELDS = [
  "id",
  "publicSlug",
  "make",
  "model",
  "variant",
  "year",
  "price",
  "mileage",
  "fuelType",
  "transmission",
  "location",
  "createdAt",
  "available",
  "soldAt",
  "spotlightUntil",
  "hotBadgeUntil",
];

// Injected at render time rather than stored on the row.
const PASS_THROUGH = ["distance", "image"];

export function toCardCar(car) {
  if (!car || typeof car !== "object") return car;

  const out = {};
  for (const key of CARD_FIELDS) {
    if (car[key] !== undefined) out[key] = car[key];
  }
  for (const key of PASS_THROUGH) {
    if (car[key] !== undefined) out[key] = car[key];
  }

  // Cards only ever read images[0].url — drop any extra gallery entries.
  const primary = car.images?.[0];
  if (primary?.url) out.images = [{ url: primary.url }];

  // Cards only render the badge label; comparison/color stay server-side.
  if (car.marketAnalysis?.label) {
    out.marketAnalysis = { label: car.marketAnalysis.label };
  }

  // CarCard sends dealer_id in its analytics event.
  if (car.dealer?.id) out.dealer = { id: car.dealer.id };

  return out;
}

export function toCardCars(cars) {
  if (!Array.isArray(cars)) return [];
  return cars.map(toCardCar);
}