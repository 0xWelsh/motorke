import { carListingPath } from "@/lib/car-listing-url";
import { requestGoogleUrlIndexing } from "@/lib/google-indexing";
import { scheduleListingSeo } from "@/lib/car-seo-pipeline";

/**
 * Fire-and-forget SEO hooks after a listing is published or slug-finalized.
 * Never throws — logs warnings only.
 * @param {{ id: string; publicSlug?: string|null; available?: boolean; make?: string; model?: string; bodyType?: string; price?: number }} car
 */
export function notifyListingPublished(car) {
  scheduleListingSeo(car);
}

/** @deprecated Use scheduleListingSeo via notifyListingPublished */
export function requestIndexingOnly(car) {
  if (!car?.id || car.available === false) return;
  const path = carListingPath(car);
  queueMicrotask(() => {
    requestGoogleUrlIndexing(path).catch(() => {});
  });
}
