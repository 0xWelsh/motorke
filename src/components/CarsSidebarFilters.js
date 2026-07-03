"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X, SlidersHorizontal } from "lucide-react";
import { FUEL_LABELS, TRANSMISSION_LABELS, STEERING_LABELS, VEHICLE_TYPE_LABELS } from "@/lib/constants";

function FilterLink({ label, active, href }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push(href)}
      className={`w-full text-left px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all ${
        active
          ? "bg-brand-accent/10 text-brand-accent border-l-2 border-brand-accent"
          : "text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50"
      }`}
    >
      {label}
    </button>
  );
}

function FilterSection({ title, children }) {
  return (
    <div className="space-y-1">
      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-zinc-400 px-2.5">
        {title}
      </p>
      {children}
    </div>
  );
}

function buildUrl(currentParams, updates) {
  const params = new URLSearchParams(currentParams.toString());
  Object.entries(updates).forEach(([key, value]) => {
    if (!value || value === "") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
  });
  params.delete("page");
  const qs = params.toString();
  return qs ? `/cars?${qs}` : "/cars";
}

export default function CarsSidebarFilters({ activeFilters, allMakes = [], bodyTypeLabels = {}, counties = [] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);

  function navigate(updates) {
    router.push(buildUrl(searchParams, updates));
  }

  const hasActiveFilters = Object.values(activeFilters).some((v) => v && v !== "");

  const sidebarContent = (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white">
          Filters
        </h3>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => router.push("/cars")}
            className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <X className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>

      <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111] divide-y divide-slate-100 dark:divide-slate-800/50">
        <div className="py-2 space-y-2">
          <FilterSection title="Make">
            <div className="max-h-[180px] overflow-y-auto space-y-0.5">
              <FilterLink
                label="All Makes"
                active={!activeFilters.make}
                href={buildUrl(searchParams, { make: "", model: "" })}
              />
              {allMakes.map((m) => (
                <FilterLink
                  key={m.make}
                  label={m.make}
                  active={activeFilters.make === m.make}
                  href={buildUrl(searchParams, { make: m.make, model: "" })}
                />
              ))}
            </div>
          </FilterSection>

          <FilterSection title="Model">
            <input
              type="text"
              defaultValue={activeFilters.model || ""}
              placeholder="e.g. Corolla"
              onBlur={(e) => navigate({ model: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter") navigate({ model: e.target.value });
              }}
              className="w-full mx-2.5 px-2 py-1.5 text-[11px] bg-transparent border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-brand-accent transition-colors"
              style={{ width: "calc(100% - 20px)" }}
            />
          </FilterSection>
        </div>

        <div className="py-2 space-y-2">
          <FilterSection title="Body Type">
            <div className="max-h-[160px] overflow-y-auto space-y-0.5">
              <FilterLink
                label="All Types"
                active={!activeFilters.bodyType}
                href={buildUrl(searchParams, { bodyType: "" })}
              />
              {Object.entries(bodyTypeLabels).map(([value, label]) => (
                <FilterLink
                  key={value}
                  label={label}
                  active={activeFilters.bodyType === value}
                  href={buildUrl(searchParams, { bodyType: value })}
                />
              ))}
            </div>
          </FilterSection>
        </div>

        <div className="py-2 space-y-2">
          <FilterSection title="Fuel">
            {Object.entries(FUEL_LABELS).map(([value, label]) => (
              <FilterLink
                key={value}
                label={label}
                active={activeFilters.fuelType === value}
                href={buildUrl(searchParams, { fuelType: value })}
              />
            ))}
          </FilterSection>
        </div>

        <div className="py-2 space-y-2">
          <FilterSection title="Transmission">
            {Object.entries(TRANSMISSION_LABELS).map(([value, label]) => (
              <FilterLink
                key={value}
                label={label}
                active={activeFilters.transmission === value}
                href={buildUrl(searchParams, { transmission: value })}
              />
            ))}
          </FilterSection>
        </div>

        <div className="py-2 space-y-2">
          <FilterSection title="Steering">
            {Object.entries(STEERING_LABELS).map(([value, label]) => (
              <FilterLink
                key={value}
                label={label}
                active={activeFilters.steering === value}
                href={buildUrl(searchParams, { steering: value })}
              />
            ))}
          </FilterSection>
        </div>

        <div className="py-2 space-y-2">
          <FilterSection title="Type">
            {Object.entries(VEHICLE_TYPE_LABELS).map(([value, label]) => (
              <FilterLink
                key={value}
                label={label}
                active={activeFilters.vehicleType === value}
                href={buildUrl(searchParams, { vehicleType: value })}
              />
            ))}
          </FilterSection>
        </div>

        <div className="py-2 space-y-2">
          <FilterSection title="Condition">
            <FilterLink
              label="Used"
              active={activeFilters.condition === "USED"}
              href={buildUrl(searchParams, { condition: "USED" })}
            />
            <FilterLink
              label="New"
              active={activeFilters.condition === "NEW"}
              href={buildUrl(searchParams, { condition: "NEW" })}
            />
          </FilterSection>
        </div>

        <div className="py-2 space-y-2">
          <FilterSection title="Price (KSh)">
            <div className="flex items-center gap-1.5 px-2.5">
              <input
                type="number"
                defaultValue={activeFilters.minPrice || ""}
                placeholder="Min"
                onBlur={(e) => {
                  const val = e.target.value;
                  if (!val && !activeFilters.maxPrice) return navigate({ minPrice: "" });
                  navigate({ minPrice: val, maxPrice: activeFilters.maxPrice || "" });
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.target.blur();
                }}
                className="w-full px-2 py-1.5 text-[11px] bg-transparent border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-brand-accent transition-colors"
              />
              <span className="text-[9px] text-slate-400 dark:text-zinc-400 shrink-0">—</span>
              <input
                type="number"
                defaultValue={activeFilters.maxPrice || ""}
                placeholder="Max"
                onBlur={(e) => {
                  const val = e.target.value;
                  if (!val && !activeFilters.minPrice) return navigate({ maxPrice: "" });
                  navigate({ maxPrice: val, minPrice: activeFilters.minPrice || "" });
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.target.blur();
                }}
                className="w-full px-2 py-1.5 text-[11px] bg-transparent border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-brand-accent transition-colors"
              />
            </div>
          </FilterSection>
        </div>

        <div className="py-2 space-y-2">
          <FilterSection title="Year">
            <div className="flex items-center gap-1.5 px-2.5">
              <input
                type="number"
                defaultValue={activeFilters.minYOM || ""}
                placeholder="From"
                onBlur={(e) => {
                  const val = e.target.value;
                  if (!val && !activeFilters.maxYOM) return navigate({ minYOM: "" });
                  navigate({ minYOM: val, maxYOM: activeFilters.maxYOM || "" });
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.target.blur();
                }}
                className="w-full px-2 py-1.5 text-[11px] bg-transparent border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-brand-accent transition-colors"
              />
              <span className="text-[9px] text-slate-400 dark:text-zinc-400 shrink-0">—</span>
              <input
                type="number"
                defaultValue={activeFilters.maxYOM || ""}
                placeholder="To"
                onBlur={(e) => {
                  const val = e.target.value;
                  if (!val && !activeFilters.minYOM) return navigate({ maxYOM: "" });
                  navigate({ maxYOM: val, minYOM: activeFilters.minYOM || "" });
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.target.blur();
                }}
                className="w-full px-2 py-1.5 text-[11px] bg-transparent border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-brand-accent transition-colors"
              />
            </div>
          </FilterSection>
        </div>

        <div className="py-2 space-y-2">
          <FilterSection title="County">
            <div className="max-h-[140px] overflow-y-auto space-y-0.5">
              <FilterLink
                label="All Counties"
                active={!activeFilters.county}
                href={buildUrl(searchParams, { county: "" })}
              />
              {counties.map((c) => (
                <FilterLink
                  key={c}
                  label={c}
                  active={activeFilters.county === c}
                  href={buildUrl(searchParams, { county: c })}
                />
              ))}
            </div>
          </FilterSection>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile filter button */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="inline-flex items-center gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-wider border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111] text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-900 transition-all"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filters
          {hasActiveFilters && (
            <span className="w-1.5 h-1.5 rounded-full bg-brand-accent" />
          )}
        </button>
      </div>

      {/* Mobile slide-over */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-[85vw] max-w-sm bg-white dark:bg-[#0a0a0a] shadow-2xl overflow-y-auto">
            <div className="sticky top-0 z-10 bg-white dark:bg-[#0a0a0a] border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Filters</span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-4 py-3">
              {sidebarContent}
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        {sidebarContent}
      </div>
    </>
  );
}
