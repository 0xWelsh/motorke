import { slugifyCarSegment } from "@/lib/seo-car-slug";
import { facetPathSegment } from "@/lib/seo-car-facets";
import { resolveDutyPathForCar } from "@/lib/seo-duty";

/**
 * Related hub links for a listing (internal linking).
 */
export function relatedHubLinksForCar(car) {
  const make = slugifyCarSegment(car.make);
  const model = slugifyCarSegment(car.model);
  if (!make) return [];

  const links = [
    { href: `/cars/${make}`, label: `All ${car.make} for sale` },
  ];

  if (model) {
    links.push({ href: `/cars/${make}/${model}`, label: `${car.make} ${car.model}` });
  }

  if (car.fuelType) {
    const fuel = facetPathSegment("fuel", car.fuelType);
    if (fuel) links.push({ href: `/cars/${make}/${fuel}`, label: `${car.make} ${car.fuelType.toLowerCase()}` });
  }

  if (car.bodyType) {
    const body = facetPathSegment("body", car.bodyType);
    if (body) links.push({ href: `/cars/${make}/${body}`, label: `${car.make} ${car.bodyType.toLowerCase()}` });
  }

  const county = car.location || car.dealer?.location;
  if (county && make) {
    const c = slugifyCarSegment(county);
    if (c) links.push({ href: `/cars/${make}/${c}`, label: `${car.make} in ${county}` });
  }

  links.push({
    href: resolveDutyPathForCar(car),
    label: car.dutyPaid === false ? "Import duty estimate" : "Import duty calculator",
  });

  return links;
}
