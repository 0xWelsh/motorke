// src/components/detail/CarReviewsBlock.js
// Streams the review section (client component + server-fetched reviews).
import { getCarReviews } from "@/lib/car-detail-data";
import CarReviewsSection from "@/components/CarReviewsSection";

export default async function CarReviewsBlock({ carId }) {
  const data = await getCarReviews(carId);
  return (
    <CarReviewsSection
      carId={carId}
      initialReviews={data.reviews}
      initialAvgRating={data.avgRating}
    />
  );
}