// src/components/detail/CarPeopleAlsoSearch.js
// Async block so the suggestions fill in after the listing shell renders
// rather than holding up the gallery and price.
import { getPeopleAlsoSearch } from "@/lib/car-detail-data";
import PeopleAlsoSearch from "@/components/detail/PeopleAlsoSearch";
import { slugifyCarSegment } from "@/lib/seo-car-slug";

export default async function CarPeopleAlsoSearch({ car }) {
  const cars = await getPeopleAlsoSearch(
    car.id,
    car.make,
    car.model,
    car.bodyType,
    car.fuelType,
    car.price,
    car.year
  );

  if (!cars.length) return null;

  return (
    <PeopleAlsoSearch
      cars={cars}
      searchHref={`/cars/${slugifyCarSegment(car.make)}/${slugifyCarSegment(car.model)}`}
      searchLabel={`All ${car.make} ${car.model}`}
    />
  );
}