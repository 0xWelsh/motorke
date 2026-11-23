import { db } from "@/lib/db";
import { slugifyCarSegment, countyFromSlug } from "@/lib/seo-car-slug";
import { notifyListingPublished } from "@/lib/seo-indexing";

/**
 * Listing URL style (SEO): keyword slug, no random tails.
 *
 *   /cars/{year}-{make}-{model}[-{trim}]-{county}
 *   e.g. 2020-bmw-x7-nairobi · 2017-mercedes-benz-s63-amg-txl-nairobi
 *
 * Collisions get a short numeric tail (-2, -3) — never a cuid fragment.
 * The county comes from the dealer (Car has no location column).
 */
function locationSegment(dealer) {
  const raw = dealer?.county || dealer?.location || "";
  const s = slugifyCarSegment(String(raw).split(/[,/]/)[0]);
  if (!s) return "kenya";
  // Canonicalize known counties; anything else stays as-is if short.
  const canonical = countyFromSlug(s);
  if (canonical) return slugifyCarSegment(canonical);
  return s.length <= 14 ? s : "kenya";
}

export function buildCarPublicSlugBase(car, dealer = null) {
  const y = Number(car.year);
  const ys = Number.isFinite(y) ? String(y) : "0";
  const parts = [ys, slugifyCarSegment(car.make), slugifyCarSegment(car.model)];
  const variant = slugifyCarSegment(car.variant || "");
  // Keep trims that read as names (TXL, ZX.L, AMG) and stay short; skip
  // anything that would bloat the slug or duplicate the model.
  if (variant && variant.length <= 12 && !parts.includes(variant)) parts.push(variant);
  parts.push(locationSegment(dealer));
  return parts.join("-").toLowerCase().slice(0, 80);
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
 * @param {{ id: string; year?: number|null; make: string|null; model: string|null; variant?: string|null; dealerId?: string|null; publicSlug?: string|null }} car
 */
export async function ensureCarPublicSlugInTx(tx, car) {
  if (car.publicSlug) return car.publicSlug;
  const dealer = car.dealerId
    ? await tx.dealer.findUnique({
        where: { id: car.dealerId },
        select: { county: true, location: true },
      })
    : null;
  const base = buildCarPublicSlugBase(car, dealer);
  let candidate = base;
  let suffix = 1;
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
