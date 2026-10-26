"use client";

import Link from "next/link";
import { BODY_TYPE_LABELS, FUEL_LABELS } from "@/lib/constants";
import { normalizeCarsSort } from "@/lib/cars-inventory-sort";
import CarsInfiniteGrid from "@/components/CarsInfiniteGrid";
import CarsSearchBar from "@/components/CarsSearchBar";
import CarsBudgetFilter from "@/components/CarsBudgetFilter";
import CarsAdvancedFilters from "@/components/CarsAdvancedFilters";

function parseNum(value) {
  if (value == null || value === "") return undefined;
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : undefined;
}

function buildChips(query, values) {
  const { make, model, bodyType, fuelType, transmission, steering, vehicleType, condition, county } = values;
  const { minPrice, maxPrice, minYOM, maxYOM } = values;

  const removeFilter = (key) => {
    const p = new URLSearchParams(query);
    p.delete(key);
    p.delete("page");
    const qs = p.toString();
    return qs ? `/cars?${qs}` : "/cars";
  };

  const chips = [];
  if (make) chips.push({ label: make, href: removeFilter("make") });
  if (model) chips.push({ label: `Model: ${model}`, href: removeFilter("model") });

  for (const bt of bodyType.split(",").filter(Boolean)) {
    const p = new URLSearchParams(query);
    const rest = bodyType.split(",").filter(Boolean).filter((x) => x !== bt).join(",");
    if (rest) p.set("bodyType", rest);
    else p.delete("bodyType");
    p.delete("page");
    const qs = p.toString();
    chips.push({ label: BODY_TYPE_LABELS[bt] || bt, href: qs ? `/cars?${qs}` : "/cars" });
  }

  for (const ft of fuelType.split(",").filter(Boolean)) {
    const p = new URLSearchParams(query);
    const rest = fuelType.split(",").filter(Boolean).filter((x) => x !== ft).join(",");
    if (rest) p.set("fuelType", rest);
    else p.delete("fuelType");
    p.delete("page");
    const qs = p.toString();
    chips.push({ label: FUEL_LABELS[ft] || ft, href: qs ? `/cars?${qs}` : "/cars" });
  }

  if (transmission) {
    const label =
      transmission === "AUTOMATIC" ? "Automatic" : transmission === "MANUAL" ? "Manual" : transmission;
    chips.push({ label, href: removeFilter("transmission") });
  }
  if (steering) chips.push({ label: steering === "RHD" ? "RHD" : "LHD", href: removeFilter("steering") });
  if (vehicleType) {
    chips.push({
      label: vehicleType === "MOTORBIKE" ? "Motorbike" : "Car",
      href: removeFilter("vehicleType"),
    });
  }
  if (condition) {
    chips.push({ label: condition === "NEW" ? "New" : "Used", href: removeFilter("condition") });
  }
  if (county) chips.push({ label: county, href: removeFilter("county") });

  if (minPrice || maxPrice) {
    const label = `${minPrice ? `KES ${(minPrice / 1000000).toFixed(1)}M` : ""}${
      minPrice && maxPrice ? " – " : ""
    }${maxPrice ? `KES ${(maxPrice / 1000000).toFixed(1)}M` : ""}`;
    const p = new URLSearchParams(query);
    p.delete("minPrice");
    p.delete("maxPrice");
    p.delete("page");
    const qs = p.toString();
    chips.push({ label, href: qs ? `/cars?${qs}` : "/cars" });
  }

  if (minYOM || maxYOM) {
    const label = `${minYOM || ""}${minYOM && maxYOM ? " – " : ""}${maxYOM || ""}`;
    const p = new URLSearchParams(query);
    p.delete("minYOM");
    p.delete("maxYOM");
    p.delete("page");
    const qs = p.toString();
    chips.push({ label: `Year: ${label}`, href: qs ? `/cars?${qs}` : "/cars" });
  }

  return chips;
}

export default function CarsListingView({ query, initialCars, initialTotal, allColors = [] }) {
  const sp = new URLSearchParams(query || "");

  const search = sp.get("search") || "";
  const make = sp.get("make") || "";
  const model = sp.get("model") || "";
  const steering = sp.get("steering") || "";
  const bodyType = sp.get("bodyType") || "";
  const fuelType = sp.get("fuelType") || "";
  const transmissionRaw = sp.get("transmission") || "";
  const transmission = transmissionRaw === "AUTO" ? "AUTOMATIC" : transmissionRaw;
  const county = sp.get("county") || "";
  const vehicleType = sp.get("vehicleType") || "";
  const condition = sp.get("condition") || "";
  const color = sp.get("color") || "";
  const sort = normalizeCarsSort(sp.get("sort"));
  const featured = sp.get("featured") === "1";
  const sunroof = sp.get("sunroof") === "1";
  const minYOM = parseNum(sp.get("minYOM"));
  const maxYOM = parseNum(sp.get("maxYOM"));
  const minPrice = parseNum(sp.get("minPrice"));
  const maxPrice = parseNum(sp.get("maxPrice"));
  const seats = parseNum(sp.get("seats"));

  const hasActiveFilters = Boolean(
    search ||
      make ||
      model ||
      steering ||
      minYOM ||
      maxYOM ||
      bodyType ||
      fuelType ||
      transmission ||
      county ||
      minPrice ||
      maxPrice ||
      vehicleType ||
      condition ||
      color ||
      sunroof ||
      seats ||
      featured ||
      sort !== "newest"
  );

  const values = {
    make,
    model,
    bodyType,
    fuelType,
    transmission,
    steering,
    vehicleType,
    condition,
    county,
    minPrice,
    maxPrice,
    minYOM,
    maxYOM,
  };
  const filterChips = buildChips(query || "", values);

  const stringFilters = {
    search,
    make,
    model,
    steering,
    minYOM: sp.get("minYOM") || "",
    maxYOM: sp.get("maxYOM") || "",
    bodyType,
    fuelType,
    transmission,
    county,
    minPrice: sp.get("minPrice") || "",
    maxPrice: sp.get("maxPrice") || "",
    vehicleType,
    condition,
    sort: sp.get("sort") ? sort : "",
    featured: sp.get("featured") || "",
    color,
    sunroof: sp.get("sunroof") || "",
    seats: sp.get("seats") || "",
  };

  const heading =
    make && model
      ? `${make} ${model} for Sale${county ? ` in ${county}` : " in Kenya"}`
      : make
        ? `${make} Cars for Sale${county ? ` in ${county}` : " in Kenya"}`
        : county
          ? `Cars for Sale in ${county}, Kenya`
          : search
            ? `"${search}" — Verified Cars in Kenya`
            : "Cars for Sale in Kenya";

  return (
    <>
      <h1 className="text-xl sm:text-2xl font-black text-[var(--text-main)] tracking-tight mb-3">
        {heading}
      </h1>

      <div className="mb-3">
        <CarsSearchBar />
      </div>

      {hasActiveFilters && filterChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {filterChips.map((chip, index) => (
            <Link
              key={`${chip.label}-${index}`}
              href={chip.href}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 hover:line-through transition-all"
              style={{ borderRadius: "6px" }}
            >
              {chip.label}
              <span className="text-slate-400">&times;</span>
            </Link>
          ))}
        </div>
      )}

      <CarsBudgetFilter />

      <CarsAdvancedFilters colors={allColors} />

      <div className="min-w-0">
        <CarsInfiniteGrid
          key={hasActiveFilters ? query : "all"}
          initialCars={hasActiveFilters ? [] : initialCars}
          initialTotal={hasActiveFilters ? 0 : initialTotal}
          filters={stringFilters}
          noFiltersActive={!hasActiveFilters}
          initialLoading={hasActiveFilters}
        />
      </div>
    </>
  );
}
