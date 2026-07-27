"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { BODY_TYPE_LABELS, FUEL_LABELS, TRANSMISSION_LABELS } from "@/lib/constants";

export default function PortalInventoryFilters({
  filter,
  search,
  make,
  bodyType,
  fuelType,
  transmission,
  sort,
  minPrice,
  maxPrice,
  minYear,
  maxYear,
  makeOptions = [],
  bodyOptions = [],
  fuelOptions = [],
  transmissionOptions = [],
  yearOptions = [],
  /** When true, expand on first paint (URL already has filters). */
  startExpanded = false,
}) {
  const [open, setOpen] = useState(startExpanded);

  const activeCount = [
    search,
    make,
    bodyType,
    fuelType,
    transmission,
    minPrice != null,
    maxPrice != null,
    minYear != null,
    maxYear != null,
    sort && sort !== "newest",
  ].filter(Boolean).length;

  return (
    <div className="mb-4 sm:mb-6 rounded-2xl border border-[#ddd4c8] bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.04)] overflow-hidden">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 px-3 py-2.5 sm:px-4 sm:py-3 text-left transition-colors hover:bg-[#fbfcfe]"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="portal-inventory-filters-panel"
      >
        <span className="inline-flex items-center gap-2 min-w-0">
          <SlidersHorizontal className="h-4 w-4 shrink-0 text-[#2F855A]" aria-hidden />
          <span className="text-[11px] sm:text-[12px] font-black uppercase tracking-[0.12em] text-slate-800">
            Inventory filters
          </span>
          {activeCount > 0 ? (
            <span className="inline-flex shrink-0 items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black tabular-nums text-emerald-800">
              {activeCount} active
            </span>
          ) : (
            <span className="hidden sm:inline text-[10px] font-medium text-slate-500">Search &amp; refine your stock</span>
          )}
        </span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      <div id="portal-inventory-filters-panel" hidden={!open} className="border-t border-[#ddd4c8]">
        <form method="GET" className="p-2.5 sm:p-4 pt-3">
          <input type="hidden" name="filter" value={filter} />
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-2">
            <input
              name="search"
              defaultValue={search}
              placeholder="Search make, model, year..."
              className="h-10 px-3 border border-[#ddd4c8] text-[12px] font-medium outline-none focus:border-[#2F855A]"
            />
            <select name="make" defaultValue={make} className="h-10 px-3 border border-[#ddd4c8] text-[12px] font-medium outline-none focus:border-[#2F855A]">
              <option value="">All makes</option>
              {makeOptions.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
            <select name="bodyType" defaultValue={bodyType} className="h-10 px-3 border border-[#ddd4c8] text-[12px] font-medium outline-none focus:border-[#2F855A]">
              <option value="">All body shapes</option>
              {bodyOptions.map((value) => (
                <option key={value} value={value}>
                  {BODY_TYPE_LABELS[value] || value}
                </option>
              ))}
            </select>
            <select name="fuelType" defaultValue={fuelType} className="h-10 px-3 border border-[#ddd4c8] text-[12px] font-medium outline-none focus:border-[#2F855A]">
              <option value="">All fuel types</option>
              {fuelOptions.map((value) => (
                <option key={value} value={value}>
                  {FUEL_LABELS[value] || value}
                </option>
              ))}
            </select>
            <select name="transmission" defaultValue={transmission} className="h-10 px-3 border border-[#ddd4c8] text-[12px] font-medium outline-none focus:border-[#2F855A]">
              <option value="">All transmissions</option>
              {transmissionOptions.map((value) => (
                <option key={value} value={value}>
                  {TRANSMISSION_LABELS[value] || value}
                </option>
              ))}
            </select>
            <select name="sort" defaultValue={sort} className="h-10 px-3 border border-[#ddd4c8] text-[12px] font-medium outline-none focus:border-[#2F855A]">
              <option value="newest">Newest first</option>
              <option value="price_asc">Price low to high</option>
              <option value="price_desc">Price high to low</option>
              <option value="views_desc">Most viewed</option>
            </select>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-6 gap-2 mt-2">
            <input
              name="minPrice"
              type="number"
              defaultValue={minPrice ?? ""}
              placeholder="Min price"
              className="h-10 px-3 border border-[#ddd4c8] text-[12px] font-medium outline-none focus:border-[#2F855A]"
            />
            <input
              name="maxPrice"
              type="number"
              defaultValue={maxPrice ?? ""}
              placeholder="Max price"
              className="h-10 px-3 border border-[#ddd4c8] text-[12px] font-medium outline-none focus:border-[#2F855A]"
            />
            <select name="minYear" defaultValue={minYear ?? ""} className="h-10 px-3 border border-[#ddd4c8] text-[12px] font-medium outline-none focus:border-[#2F855A]">
              <option value="">Min year</option>
              {yearOptions.map((value) => (
                <option key={`min-${value}`} value={value}>
                  {value}
                </option>
              ))}
            </select>
            <select name="maxYear" defaultValue={maxYear ?? ""} className="h-10 px-3 border border-[#ddd4c8] text-[12px] font-medium outline-none focus:border-[#2F855A]">
              <option value="">Max year</option>
              {yearOptions.map((value) => (
                <option key={`max-${value}`} value={value}>
                  {value}
                </option>
              ))}
            </select>
            <button type="submit" className="h-10 px-3 bg-[#1e1e1e] text-white text-[10px] font-black uppercase tracking-[0.12em]">
              Apply filters
            </button>
            <Link
              href={`/portal/inventory?filter=${filter}`}
              className="h-10 px-3 border border-[#ddd4c8] text-[10px] font-black uppercase tracking-[0.12em] inline-flex items-center justify-center"
            >
              Reset row
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
