/** URL-safe slug for make/model/county segments (hyphenated, ascii). */
export function slugifyCarSegment(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Heuristic: Prisma cuids (~25 lowercase alnum) vs short SEO slugs like "toyota". */
export function looksLikeCarListingId(segment) {
  if (!segment || typeof segment !== "string") return false;
  if (segment.length < 20) return false;
  return /^[a-z0-9]+$/i.test(segment);
}

/** Year-first hyphenated listing slug assigned in `Car.publicSlug`. */
export function looksLikeCarPublicSlug(segment) {
  if (!segment || typeof segment !== "string") return false;
  const s = segment.trim().toLowerCase();
  return /^\d{4}(?:-[a-z0-9]+){3,}$/.test(s);
}

export const SEO_COUNTIES = [
  "Nairobi",
  "Mombasa",
  "Nakuru",
  "Kisumu",
  "Uasin Gishu",
  "Kiambu",
  "Machakos",
  "Meru",
];

/** Map slug → canonical county label (for DB `dealer.county`). */
export function countyFromSlug(slug) {
  const s = slugifyCarSegment(slug);
  if (!s) return null;
  for (const c of SEO_COUNTIES) {
    if (slugifyCarSegment(c) === s) return c;
  }
  return null;
}

export function countySlug(label) {
  return slugifyCarSegment(label);
}
