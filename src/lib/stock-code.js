/**
 * Public stock number shown next to listings (Nikkyo-style "#XXXX0000").
 * Derived from the trailing token of the SEO public slug (or car id fallback).
 * @param {{ publicSlug?: string|null; id?: string|null }} car
 */
export function stockCode(car) {
  if (!car) return "";
  const src = car.publicSlug || car.id || "";
  const tail = String(src).split("-").pop() || "";
  const code = tail.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  return code ? `#${code}` : "";
}
