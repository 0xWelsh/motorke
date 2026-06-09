"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpDown } from "lucide-react";
import { CARS_SORT_DEFAULT, CARS_SORT_OPTIONS, normalizeCarsSort } from "@/lib/cars-inventory-sort";

/**
 * Sort control for /cars — preserves filters in the URL when changed.
 */
function CarsInventorySortInner({ className = "" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = normalizeCarsSort(searchParams.get("sort"));

  function onChange(e) {
    const next = normalizeCarsSort(e.target.value);
    const params = new URLSearchParams(searchParams.toString());
    if (next === CARS_SORT_DEFAULT) {
      params.delete("sort");
    } else {
      params.set("sort", next);
    }
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `/cars?${qs}` : "/cars");
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <ArrowUpDown className="h-3.5 w-3.5 shrink-0 text-[var(--brand-primary)]" aria-hidden />
      <label className="sr-only" htmlFor="cars-inventory-sort">
        Sort inventory
      </label>
      <select
        id="cars-inventory-sort"
        value={current}
        onChange={onChange}
        className="min-w-[10.5rem] max-w-full border border-[var(--brand-faint)] bg-[var(--surface)] px-3 py-2 text-[11px] font-black uppercase tracking-wider text-[var(--text-main)] outline-none focus:border-[var(--brand-primary)] transition-all"
        style={{ borderRadius: "8px" }}
      >
        {CARS_SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function CarsInventorySortFallback({ className = "" }) {
  return (
    <div
      className={`h-9 min-w-[10.5rem] border border-[var(--brand-faint)] bg-[var(--surface-overlay)] animate-pulse ${className}`}
      style={{ borderRadius: "8px" }}
      aria-hidden
    />
  );
}

export default function CarsInventorySort(props) {
  return (
    <Suspense fallback={<CarsInventorySortFallback className={props.className} />}>
      <CarsInventorySortInner {...props} />
    </Suspense>
  );
}
