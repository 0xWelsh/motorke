// src/components/detail/CarSimilarSection.js
// Full-width "More {make} cars" strip below the listing grid.
// Streams in after the listing shell.
import { getSimilarCars } from "@/lib/car-detail-data";
import SimilarCarsSection from "@/components/SimilarCarsSection";

export default async function CarSimilarSection({ car }) {
  const similar = await getSimilarCars(car.id, car.make, car.dealerId, car.bodyType, car.year, car.price);
  return <SimilarCarsSection cars={similar} make={car.make} />;
}