/**
 * Public listing pathname (prefer persistent SEO slug).
 * @param {{ id?: string|null; publicSlug?: string|null }} car
 */
export function carListingPath(car) {
  if (!car?.id) return "/cars";
  return `/cars/${car.publicSlug || car.id}`;
}
