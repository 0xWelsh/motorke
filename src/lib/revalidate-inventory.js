import { revalidatePath, revalidateTag } from "next/cache";
import { db } from "@/lib/db";

/** Listing/browse caches — safe to bust on every edit */
const LISTING_CACHE_TAGS = [
  "cars",
  "cars-listing",
  "makes",
  "dealers-index",
  "market-analysis",
];

/**
 * Invalidate cached public inventory after create/update/delete/toggle.
 * @param {{ refreshHomepage?: boolean }} opts — homepage rebuild is heavy; only on publish/hide/delete
 */
export function revalidateInventory({
  carId,
  publicSlug,
  dealerSlug,
  refreshHomepage = false,
} = {}) {
  for (const tag of LISTING_CACHE_TAGS) {
    revalidateTag(tag);
  }
  if (refreshHomepage) {
    revalidateTag("homepage");
    revalidatePath("/");
  }

  if (carId) {
    revalidateTag(`car-detail:${carId}`);
  }
  if (publicSlug) {
    revalidateTag(`car-detail:${publicSlug}`);
  }

  revalidatePath("/cars");
  revalidatePath("/portal/inventory");
  revalidatePath("/admin/cars");

  if (carId) {
    revalidatePath(`/cars/${carId}`);
  }
  if (publicSlug) {
    revalidatePath(`/cars/${publicSlug}`);
  }
  if (dealerSlug) {
    revalidatePath(`/dealers/${dealerSlug}`);
  }
}

/**
 * @param {string} carId
 * @param {{ refreshHomepage?: boolean }} opts
 */
export async function revalidateInventoryForCar(carId, opts = {}) {
  const { refreshHomepage = false } = opts;

  if (!carId) {
    revalidateInventory({ refreshHomepage });
    return;
  }

  try {
    const car = await db.car.findUnique({
      where: { id: carId },
      select: {
        id: true,
        publicSlug: true,
        dealer: { select: { slug: true } },
      },
    });

    if (!car) {
      revalidateInventory({ carId, refreshHomepage });
      return;
    }

    revalidateInventory({
      carId: car.id,
      publicSlug: car.publicSlug || undefined,
      dealerSlug: car.dealer?.slug || undefined,
      refreshHomepage,
    });
  } catch (err) {
    console.error("[revalidate] car lookup failed, busting listing caches:", err?.message || err);
    revalidateInventory({ carId, refreshHomepage });
  }
}
