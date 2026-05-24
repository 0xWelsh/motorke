import { revalidatePath, revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { slugifyCarSegment } from "@/lib/seo-car-slug";
import { GLOBAL_CAR_HUB_SLUGS } from "@/lib/seo-global-hubs";
import { SEO_PRICE_BANDS } from "@/lib/seo-car-facets";

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
  revalidatePath("/portal/boosts");
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
/** Bust programmatic hub URLs when stock changes (make/model/price/body). */
export function revalidateHubPathsForCar(car) {
  if (!car?.make) return;

  const makeSlug = slugifyCarSegment(car.make);
  const modelSlug = car.model ? slugifyCarSegment(car.model) : null;

  revalidatePath(`/cars/${makeSlug}`);
  if (modelSlug) revalidatePath(`/cars/${makeSlug}/${modelSlug}`);

  if (car.bodyType === "SUV") {
    for (const hub of Object.values(GLOBAL_CAR_HUB_SLUGS)) {
      if (hub.bodyType === "SUV") revalidatePath(hub.path);
    }
  }

  const price = Number(car.price);
  if (Number.isFinite(price) && price > 0) {
    for (const band of SEO_PRICE_BANDS) {
      const w = band.where?.price;
      if (!w || typeof w !== "object") continue;
      const gte = w.gte != null ? Number(w.gte) : 0;
      const lt = w.lt != null ? Number(w.lt) : Infinity;
      if (price >= gte && price < lt) {
        revalidatePath(`/cars/price-${band.slug}`);
        if (car.bodyType === "SUV") {
          const suvHub = Object.values(GLOBAL_CAR_HUB_SLUGS).find(
            (h) => h.kind === "global_body_price" && h.bandSlug === band.slug
          );
          if (suvHub) revalidatePath(suvHub.path);
        }
      }
    }
  }
}

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

    const full = await db.car.findUnique({
      where: { id: carId },
      select: { make: true, model: true, bodyType: true, price: true },
    });
    if (full) revalidateHubPathsForCar(full);
  } catch (err) {
    console.error("[revalidate] car lookup failed, busting listing caches:", err?.message || err);
    revalidateInventory({ carId, refreshHomepage });
  }
}
