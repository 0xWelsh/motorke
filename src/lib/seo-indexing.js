import { carListingPath } from "@/lib/car-listing-url";
import { requestGoogleUrlIndexing } from "@/lib/google-indexing";

/**
 * Fire-and-forget SEO hooks after a listing is published or slug-finalized.
 * Never throws — logs warnings only.
 * @param {{ id: string; publicSlug?: string|null; available?: boolean }} car
 */
export function notifyListingPublished(car) {
  if (!car?.id || car.available === false) return;

  const path = carListingPath(car);

  queueMicrotask(() => {
    requestGoogleUrlIndexing(path).catch(() => {});
  });
}
