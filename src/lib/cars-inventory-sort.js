/**
 * Inventory browse sort keys for /cars (?sort=).
 * Explicit sorts skip homepage-style rotation and distance re-ranking.
 */

export const CARS_SORT_DEFAULT = "newest";

export const CARS_SORT_OPTIONS = [
  { value: "newest", label: "Newest listed" },
  { value: "oldest", label: "Oldest listed" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "year_desc", label: "Year: newest first" },
  { value: "year_asc", label: "Year: oldest first" },
  { value: "mileage_asc", label: "Mileage: lowest first" },
  { value: "mileage_desc", label: "Mileage: highest first" },
  { value: "views_desc", label: "Most viewed" },
];

const EXPLICIT_SORTS = new Set(
  CARS_SORT_OPTIONS.map((o) => o.value).filter((v) => v !== CARS_SORT_DEFAULT)
);

export function normalizeCarsSort(sort) {
  const key = String(sort || "").trim();
  return CARS_SORT_OPTIONS.some((o) => o.value === key) ? key : CARS_SORT_DEFAULT;
}

export function isExplicitCarsSort(sort) {
  return EXPLICIT_SORTS.has(normalizeCarsSort(sort));
}

/** Prisma orderBy for a given sort key. */
export function buildCarsOrderBy(sort) {
  const key = normalizeCarsSort(sort);
  switch (key) {
    case "oldest":
      return [{ createdAt: "asc" }];
    case "price_asc":
      return [{ price: "asc" }];
    case "price_desc":
      return [{ price: "desc" }];
    case "mileage_asc":
      return [{ mileage: "asc" }];
    case "mileage_desc":
      return [{ mileage: "desc" }];
    case "year_desc":
      return [{ year: "desc" }];
    case "year_asc":
      return [{ year: "asc" }];
    case "views_desc":
      return [{ views: "desc" }, { createdAt: "desc" }];
    case "newest":
    default:
      return [
        { featuredWeight: "desc" },
        { dealer: { featured: "desc" } },
        { dealer: { verified: "desc" } },
        { dealer: { boostScore: "desc" } },
        { views: "desc" },
        { createdAt: "desc" },
      ];
  }
}
