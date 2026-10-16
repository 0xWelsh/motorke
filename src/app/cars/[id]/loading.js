import CarDetailSkeleton from "@/components/CarDetailSkeleton";

// App Router renders this once the route's RSC response begins streaming.
// The same skeleton is painted earlier by CarNavOverlay, so there is no gap
// and no visual jump when this takes over.
export default function CarDetailLoading() {
  return <CarDetailSkeleton />;
}