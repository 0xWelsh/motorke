import { db } from "@/lib/db";
import { PUBLIC_ONLY_VERIFIED_DEALERS } from "@/lib/feature-flags";

const listingSelect = {
  id: true,
  make: true,
  model: true,
  variant: true,
  year: true,
  price: true,
  engineCC: true,
  fuelType: true,
  mileage: true,
  publicSlug: true,
  featured: true,
  images: { where: { isPrimary: true }, take: 1, select: { url: true, alt: true } },
  dealer: { select: { name: true, location: true, type: true, verificationStatus: true, slug: true } },
};

/**
 * Live inventory rows matching duty vehicle make/model (marketplace sidebar).
 */
export async function findSimilarStock({ make, model, limit = 4 }) {
  const m = String(make || "").trim();
  const mod = String(model || "").trim();
  if (!m) return [];

  const modelClause = mod
    ? {
        OR: [
          { model: { equals: mod, mode: "insensitive" } },
          { model: { contains: mod.replace(/-/g, ""), mode: "insensitive" } },
        ],
      }
    : {};

  return db.car.findMany({
    where: {
      available: true,
      make: { equals: m, mode: "insensitive" },
      ...modelClause,
      ...(PUBLIC_ONLY_VERIFIED_DEALERS && { dealer: { verificationStatus: "VERIFIED" } }),
    },
    select: listingSelect,
    orderBy: [{ featured: "desc" }, { views: "desc" }, { createdAt: "desc" }],
    take: Math.min(limit, 8),
  });
}

export function serializeSimilarStockCar(car) {
  return {
    id: car.id,
    make: car.make,
    model: car.model,
    variant: car.variant,
    year: car.year,
    price: car.price,
    engineCC: car.engineCC,
    fuelType: car.fuelType,
    mileage: car.mileage,
    publicSlug: car.publicSlug,
    image: car.images?.[0]?.url || null,
    dealerName: car.dealer?.name || null,
    location: car.dealer?.location || null,
  };
}
