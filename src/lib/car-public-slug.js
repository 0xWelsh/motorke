import { db } from "@/lib/db";
import { slugifyCarSegment } from "@/lib/seo-car-slug";
import { notifyListingPublished } from "@/lib/seo-indexing";

/**
 * Base slug before uniqueness suffix (year-make-model-last8id).
 */
export function buildCarPublicSlugBase(car) {
  const y = Number(car.year);
  const ys = Number.isFinite(y) ? String(y) : "0";
  return `${ys}-${slugifyCarSegment(car.make)}-${slugifyCarSegment(car.model)}-${String(car.id).slice(-8)}`.toLowerCase();
}

async function slugExists(tx, slug, excludeId) {
  const row = await tx.car.findFirst({
    where: {
      publicSlug: slug,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });
  return Boolean(row);
}

/**
 * Allocate a unique publicSlug and persist it (idempotent if already set).
 * @param {import("@prisma/client").Prisma.TransactionClient} tx
 * @param {{ id: string; year?: number|null; make: string|null; model: string|null; publicSlug?: string|null }} car
 */
export async function ensureCarPublicSlugInTx(tx, car) {
  if (car.publicSlug) return car.publicSlug;
  const base = buildCarPublicSlugBase(car);
  let candidate = base;
  let suffix = 0;
  while (await slugExists(tx, candidate, car.id)) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
  await tx.car.update({
    where: { id: car.id },
    data: { publicSlug: candidate },
  });
  return candidate;
}

/**
 * After `car.create` (same as DB row shape with id, year, make, model).
 */
export async function finalizeNewCarPublicSlug(car) {
  if (car.publicSlug) {
    notifyListingPublished(car);
    return car;
  }
  const finalized = await db.$transaction(async (tx) => {
    await ensureCarPublicSlugInTx(tx, car);
    return tx.car.findUniqueOrThrow({ where: { id: car.id } });
  });
  notifyListingPublished(finalized);
  return finalized;
}
