/** Short names / typos → canonical make stored on listings. */
export const MAKE_ALIASES = {
  benz: "Mercedes-Benz",
  mercedes: "Mercedes-Benz",
  merc: "Mercedes-Benz",
  vw: "Volkswagen",
  landcruiser: "Toyota",
  rangerover: "Range Rover",
};

/** Query values → all `make` values that should match in Prisma. */
const MAKE_FILTER_GROUPS = {
  "mercedes-benz": ["Mercedes-Benz", "Mercedes"],
  mercedes: ["Mercedes-Benz", "Mercedes"],
  merc: ["Mercedes-Benz", "Mercedes"],
  benz: ["Mercedes-Benz", "Mercedes"],
  volkswagen: ["Volkswagen", "VW"],
  vw: ["Volkswagen", "VW"],
};

/** Prisma `where` fragment for inventory make filter. */
export function buildMakeWhere(make) {
  const trimmed = (make || "").trim();
  if (!trimmed) return {};

  const key = trimmed.toLowerCase();
  let values = MAKE_FILTER_GROUPS[key];

  if (!values) {
    const canonical = MAKE_ALIASES[key];
    if (canonical) {
      values = MAKE_FILTER_GROUPS[canonical.toLowerCase()];
      if (!values) values = [canonical];
    }
  }

  if (values?.length > 1) {
    return { OR: values.map((v) => ({ make: { equals: v, mode: "insensitive" } })) };
  }
  if (values?.length === 1) {
    return { make: { equals: values[0], mode: "insensitive" } };
  }

  return { make: { equals: trimmed, mode: "insensitive" } };
}
