import { db } from "@/lib/db";
import { BODY_TYPE_LABELS, FUEL_LABELS } from "@/lib/constants";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import CarsInfiniteGrid from "@/components/CarsInfiniteGrid";
import SearchMapToggle from "@/components/SearchMapToggle";
import TrackEventOnMount from "@/components/TrackEventOnMount";
import { unstable_cache } from "next/cache";
import { PUBLIC_ONLY_VERIFIED_DEALERS } from "@/lib/feature-flags";
import { buildCarsOrderBy, normalizeCarsSort } from "@/lib/cars-inventory-sort";
import CarsInventorySort from "@/components/CarsInventorySort";
import CarsHorizontalFilters from "@/components/CarsHorizontalFilters";
import CarsSearchBar from "@/components/CarsSearchBar";
import { buildMakeWhere } from "@/lib/make-filter";
import { publicDetailVisibilityClause } from "@/lib/car-sold-status";

const PER_PAGE = 24;

export async function generateMetadata({ searchParams }) {
  const sp = await searchParams;
  const make = sp.make || "";
  const model = sp.model || "";
  const search = sp.search || "";
  const county = sp.county || "";

  const parts = ["Cars for sale in kenya"];
  if (make) parts.unshift(`${make}${model ? ` ${model}` : ""}`);
  if (county) parts.push(`in ${county}`);
  const title = `${parts.join(" — ")} | Trusted Dealers on BIDGARI`;
  const desc = make
    ? `Browse verified ${make}${model ? ` ${model}` : ""} cars for sale${county ? ` in ${county}` : " across Kenya"}. Transparent pricing, trusted dealers, direct contact.`
    : "Find verified cars from trusted Kenyan dealers. Transparent pricing, no middleman. Filter by make, price, body type, and county.";

  return {
    title,
    description: desc,
    alternates: { canonical: "/cars" },
    openGraph: { title, description: desc, type: "website", url: "/cars" },
  };
}

const carSelect = {
  id: true,
  publicSlug: true,
  make: true,
  model: true,
  variant: true,
  year: true,
  price: true,
  engineCC: true,
  mileage: true,
  vehicleType: true,
  condition: true,
  bodyType: true,
  fuelType: true,
  transmission: true,
  featured: true,
  featuredWeight: true,
  spotlightUntil: true,
  hotBadgeUntil: true,
  views: true,
  createdAt: true,
  badges: true,
  description: true,
  available: true,
  soldAt: true,
  images: { take: 1, orderBy: { isPrimary: "desc" } },
  dealer: {
    select: {
      id: true,
      name: true,
      slug: true,
      location: true,
      type: true,
      verificationStatus: true,
      verified: true,
      lat: true,
      lng: true,
      county: true,
      whatsapp: true,
      featured: true,
      boostScore: true,
    },
  },
};

const getAllMakes = unstable_cache(
  async () => {
    return db.car.findMany({
      where: { available: true },
      distinct: ["make"],
      select: { make: true },
      orderBy: { make: "asc" },
    });
  },
  ["all-makes"],
  { revalidate: 3600, tags: ["makes"] },
);

const getAllCounties = unstable_cache(
  async () => {
    const rows = await db.dealer.findMany({
      distinct: ["county"],
      select: { county: true },
      orderBy: { county: "asc" },
    });
    return rows.map((r) => r.county).filter(Boolean);
  },
  ["all-counties"],
  { revalidate: 3600, tags: ["counties"] },
);

export default async function CarsPage({ searchParams }) {
  const sp = await searchParams;
  const search = sp.search || "";
  const make = sp.make || "";
  const model = sp.model || "";
  const steering = sp.steering || "";
  const minYOM = sp.minYOM ? parseInt(sp.minYOM, 10) : undefined;
  const maxYOM = sp.maxYOM ? parseInt(sp.maxYOM, 10) : undefined;
  const bodyType = sp.bodyType || "";
  const fuelType = sp.fuelType || "";
  const transmission = sp.transmission || "";
  const county = sp.county || "";
  const minPrice = sp.minPrice ? parseInt(sp.minPrice, 10) : undefined;
  const maxPrice = sp.maxPrice ? parseInt(sp.maxPrice, 10) : undefined;
  const vehicleType = sp.vehicleType || "";
  const condition = sp.condition || "";
  const sort = normalizeCarsSort(sp.sort);

  const where = {
    ...publicDetailVisibilityClause(),
    ...(PUBLIC_ONLY_VERIFIED_DEALERS && { dealer: { verified: true } }),
    ...buildMakeWhere(make),
    ...(model && { model: { equals: model, mode: "insensitive" } }),
    ...(steering && { steering }),
    ...(minYOM || maxYOM ? { year: { ...(minYOM && { gte: minYOM }), ...(maxYOM && { lte: maxYOM }) } } : {}),
    ...(bodyType && { bodyType }),
    ...(fuelType && { fuelType }),
    ...(transmission && { transmission }),
    ...(minPrice || maxPrice ? { price: { ...(minPrice && { gte: minPrice }), ...(maxPrice && { lte: maxPrice }) } } : {}),
    ...(vehicleType && { vehicleType }),
    ...(condition && { condition }),
    ...(county && {
      dealer: {
        ...(PUBLIC_ONLY_VERIFIED_DEALERS && { verified: true }),
        county: { equals: county, mode: "insensitive" },
      },
    }),
    ...(search ? {
      OR: ["make", "model", "variant", "description"].map(field => ({
        [field]: { contains: search, mode: "insensitive" },
      })),
    } : {}),
  };

  const orderBy = buildCarsOrderBy(sort);

  const [initialCars, total, allMakes, allCounties] = await Promise.all([
    db.car.findMany({
      where,
      select: carSelect,
      orderBy,
      take: PER_PAGE,
    }),
    db.car.count({ where }),
    getAllMakes(),
    getAllCounties(),
  ]);

  function removeFilter(params, key) {
    const p = new URLSearchParams(params.toString());
    p.delete(key);
    p.delete("page");
    const qs = p.toString();
    return qs ? `/cars?${qs}` : "/cars";
  }

  const filterChips = [];
  if (make) filterChips.push({ label: make, href: removeFilter(sp, "make") });
  if (model) filterChips.push({ label: `Model: ${model}`, href: removeFilter(sp, "model") });
  if (bodyType) filterChips.push({ label: BODY_TYPE_LABELS[bodyType] || bodyType, href: removeFilter(sp, "bodyType") });
  if (fuelType) filterChips.push({ label: FUEL_LABELS[fuelType] || fuelType, href: removeFilter(sp, "fuelType") });
  if (transmission) filterChips.push({ label: transmission === "AUTOMATIC" ? "Automatic" : transmission === "MANUAL" ? "Manual" : transmission, href: removeFilter(sp, "transmission") });
  if (steering) filterChips.push({ label: steering === "RHD" ? "RHD" : "LHD", href: removeFilter(sp, "steering") });
  if (vehicleType) filterChips.push({ label: vehicleType === "MOTORBIKE" ? "Motorbike" : "Car", href: removeFilter(sp, "vehicleType") });
  if (condition) filterChips.push({ label: condition === "NEW" ? "New" : "Used", href: removeFilter(sp, "condition") });
  if (county) filterChips.push({ label: county, href: removeFilter(sp, "county") });
  if (minPrice || maxPrice) {
    const label = `${minPrice ? `KSh ${(minPrice / 1000000).toFixed(1)}M` : ""}${minPrice && maxPrice ? " – " : ""}${maxPrice ? `KSh ${(maxPrice / 1000000).toFixed(1)}M` : ""}`;
    filterChips.push({ label, href: (() => { const p = new URLSearchParams(sp.toString()); p.delete("minPrice"); p.delete("maxPrice"); p.delete("page"); return `/cars?${p.toString()}`; })() });
  }
  if (minYOM || maxYOM) {
    const label = `${minYOM || ""}${minYOM && maxYOM ? " – " : ""}${maxYOM || ""}`;
    filterChips.push({ label: `Year: ${label}`, href: (() => { const p = new URLSearchParams(sp.toString()); p.delete("minYOM"); p.delete("maxYOM"); p.delete("page"); return `/cars?${p.toString()}`; })() });
  }

  const noFiltersActive = !search && !make && !model && !steering && !minYOM && !maxYOM && !bodyType && !fuelType && !transmission && !county && !minPrice && !maxPrice && !vehicleType && !condition;

  const stringFilters = {
    search: search || "",
    make: make || "",
    model: model || "",
    steering: steering || "",
    minYOM: sp.minYOM || "",
    maxYOM: sp.maxYOM || "",
    bodyType: bodyType || "",
    fuelType: fuelType || "",
    transmission: transmission || "",
    county: county || "",
    minPrice: sp.minPrice || "",
    maxPrice: sp.maxPrice || "",
    vehicleType: vehicleType || "",
    condition: condition || "",
    sort: sort || "",
  };

  return (
    <div className="min-h-screen bg-[var(--surface)] pb-12">
      <TrackEventOnMount
        name="cars_listing_view"
        payload={{
          search: search || "",
          make: make || "",
          body_type: bodyType || "",
          fuel_type: fuelType || "",
          transmission: transmission || "",
          county: county || "",
          sort: sort || "newest",
          result_count: total,
        }}
      />
      <div className="w-full px-2.5 sm:px-8 pt-2 sm:pt-3">

        {/* Breadcrumb strip */}
        <div className="mb-3 sm:mb-4 flex items-center gap-3 sm:gap-4 pb-2 sm:pb-2.5 min-w-0">
          <div className="meta-label flex min-w-0 items-center gap-2 sm:gap-3 truncate">
            <Link href="/" className="hidden sm:inline hover:text-[var(--brand-primary)] transition-colors">Home</Link>
            <ChevronRight className="hidden sm:block w-3 h-3 shrink-0" />
            <Link href="/cars" className="hover:text-[var(--brand-primary)] transition-colors truncate">Vehicles</Link>
            <ChevronRight className="w-3 h-3 shrink-0" />
            <span className="text-[var(--text-main)] truncate">Available</span>
          </div>
        </div>

        <h1 className="text-xl sm:text-2xl font-black text-[var(--text-main)] tracking-tight mb-4">
          {make && model
            ? `${make} ${model} for Sale${county ? ` in ${county}` : " in Kenya"}`
            : make
            ? `${make} Cars for Sale${county ? ` in ${county}` : " in Kenya"}`
            : county
            ? `Cars for Sale in ${county}, Kenya`
            : search
            ? `"${search}" — Verified Cars in Kenya`
            : "Cars for sale in kenya"}
        </h1>

        {!noFiltersActive && (
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {filterChips.map((chip) => (
              <Link
                key={chip.label}
                href={chip.href}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-white dark:bg-[#111] text-slate-700 dark:text-white hover:line-through transition-all"
                style={{ borderRadius: "6px" }}
              >
                {chip.label}
                <span className="text-slate-400 dark:text-zinc-300">&times;</span>
              </Link>
            ))}
          </div>
        )}

        <CarsHorizontalFilters
          activeFilters={{ make, transmission, minPrice, maxPrice }}
          allMakes={allMakes}
        />

        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 mb-4">
          <CarsInventorySort />
        </div>

        <div className="mb-4">
          <CarsSearchBar />
        </div>

        <div className="min-w-0">
          <CarsInfiniteGrid
            initialCars={initialCars}
            initialTotal={total}
            filters={stringFilters}
            noFiltersActive={noFiltersActive}
          />

          {initialCars.length > 0 && (
            <div className="flex justify-center mt-4 sm:mt-6">
              <SearchMapToggle
                cars={initialCars.filter((c) => c.dealer?.lat && c.dealer?.lng)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
