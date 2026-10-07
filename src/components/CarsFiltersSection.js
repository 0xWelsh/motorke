"use client";

import { useState } from "react";
import { SlidersHorizontal, ChevronDown } from "lucide-react";
import CarsHorizontalFilters from "@/components/CarsHorizontalFilters";

// Collapses the facet-chip rows so the /cars page leads with cars, not
// controls. Expands when filters are active (so users can edit/clear them),
// hidden by default otherwise.
export default function CarsFiltersSection({ activeFilters, allMakes, hasActive = false }) {
  const [open, setOpen] = useState(hasActive);

  const activeCount = Object.values(activeFilters || {}).filter(Boolean).length;

  return (
    <div className="mb-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="cars-filter-panel"
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 transition-colors hover:border-slate-300"
      >
        <span className="flex items-center gap-2 text-[12px] font-black uppercase tracking-widest text-slate-700">
          <SlidersHorizontal className="h-4 w-4 text-slate-400" aria-hidden />
          Filters
          {activeCount > 0 && (
            <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-[var(--accent)] px-1.5 py-0.5 text-[10px] font-bold text-white">
              {activeCount}
            </span>
          )}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {open && (
        <div id="cars-filter-panel" className="mt-2">
          <CarsHorizontalFilters activeFilters={activeFilters} allMakes={allMakes} />
        </div>
      )}
    </div>
  );
}