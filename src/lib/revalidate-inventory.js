import { revalidatePath, revalidateTag } from "next/cache";
import { db } from "@/lib/db";

/** Tags used by unstable_cache on public inventory surfaces */
const INVENTORY_CACHE_TAGS = [
  "cars",
  "cars-listing",
  "makes",
  "homepage",
  "dealers-index",
  "market-analysis",
];

/**
 * Invalidate cached public inventory after create/update/delete/toggle.
 * Call from API routes immediately after a successful DB write.
 */
export function revalidateInventory({ carId, publicSlug, dealerSlug } = {}) {
  for (const tag of INVENTORY_CACHE_TAGS) {
    revalidateTag(tag);
  }

  if (carId) {
    revalidateTag(`car-detail:${carId}`);
  }
  if (publicSlug) {
    revalidateTag(`car-detail:${publicSlug}`);
  }

  revalidatePath("/cars");
  revalidatePath("/");
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

/** Load slug/dealer and invalidate listing + detail caches for one car. */
export async function revalidateInventoryForCar(carId) {
  if (!carId) {
    revalidateInventory();
    return;
  }

  const car = await db.car.findUnique({
    where: { id: carId },
    select: {
      id: true,
      publicSlug: true,
      dealer: { select: { slug: true } },
    },
  });

  if (!car) {
    revalidateInventory({ carId });
    return;
  }

  revalidateInventory({
    carId: car.id,
    publicSlug: car.publicSlug || undefined,
    dealerSlug: car.dealer?.slug || undefined,
  });
}
