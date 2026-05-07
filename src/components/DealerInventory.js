"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import CarCard from "@/components/CarCard";

export default function DealerInventory({ cars, dealerSlug }) {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  const makes = useMemo(() => {
    return ["ALL", ...new Set(cars.map((c) => c.make))];
  }, [cars]);

  const filteredCars = useMemo(() => {
    return cars.filter((car) => {
      const matchFilter = activeFilter === "ALL" || car.make === activeFilter;
      if (!matchFilter) return false;

      if (!query) return true;
      const searchStr = `${car.make} ${car.model} ${car.year} ${car.variant || ""}`.toLowerCase();
      return searchStr.includes(query.toLowerCase());
    });
  }, [cars, query, activeFilter]);

  const getFreshnessLabel = (dateValue) => {
    if (!dateValue) return null;
    const updatedAt = new Date(dateValue);
    if (Number.isNaN(updatedAt.getTime())) return null;
    const diffDays = Math.max(0, Math.floor((Date.now() - updatedAt.getTime()) / (1000 * 60 * 60 * 24)));
    if (diffDays === 0) return "Updated today";
    if (diffDays === 1) return "Updated yesterday";
    return `Updated ${diffDays} days ago`;
  };
  const PAGE_SIZE = 14;
  const totalPages = Math.max(1, Math.ceil(filteredCars.length / PAGE_SIZE));
  const pageStart = (page - 1) * PAGE_SIZE;
  const pageCars = filteredCars.slice(pageStart, pageStart + PAGE_SIZE);
  const topCars = pageCars.slice(0, 6);
  const lowerCars = pageCars.slice(6);

  useEffect(() => {
    setPage(1);
  }, [query, activeFilter]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-10">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search showroom..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-[#F7FAFC] dark:bg-[#0a0a0a] border border-slate-100 dark:border-slate-800 text-sm font-medium placeholder:text-slate-400 outline-none focus:border-[#38A169] transition-all py-3.5 px-11"
            style={{ borderRadius: 'var(--radius)' }}
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#111827] dark:hover:text-white">
               <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 sm:pb-0 hide-scrollbar">
          <div className="flex items-center justify-center w-10 h-10 shrink-0 bg-[#fbfcfe] dark:bg-[#111111] border border-[#ece6dd] rounded-2xl text-slate-500">
             <SlidersHorizontal className="w-4 h-4" />
          </div>
          {makes.map((make) => (
             <button
               key={make}
               onClick={() => setActiveFilter(make)}
               className={`px-4 py-2.5 shrink-0 text-[10px] font-bold uppercase tracking-widest transition-all border ${
                 activeFilter === make
                   ? "bg-[#111827] text-white border-[#111827] dark:bg-white dark:!text-black dark:border-white"
                    : "bg-white dark:bg-[#111111] text-[#718096] dark:text-slate-400 border-slate-100 dark:border-slate-800 hover:border-[#111827] dark:hover:border-white"
               }`}
               style={{ borderRadius: 'var(--radius)' }}
             >
               {make === "ALL" ? "All Units" : make}
             </button>
          ))}
        </div>
      </div>

      {filteredCars.length === 0 ? (
        <div className="border border-dashed border-slate-200 dark:border-slate-800 bg-[#F7FAFC] dark:bg-[#111111] p-16 text-center" style={{ borderRadius: 'var(--radius)' }}>
           <Search className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-6" />
           <h3 className="text-xs font-bold text-[#111827] dark:text-white uppercase tracking-widest mb-2">No units found</h3>
           <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Try adjusting your filters or search query.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {topCars.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {topCars.map((car) => (
                <div key={`top-${car.id}`} className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                    {getFreshnessLabel(car.updatedAt) || "Recently listed"}
                  </p>
                  <CarCard car={car} />
                </div>
              ))}
            </div>
          )}
          {lowerCars.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {lowerCars.map((car) => (
                <div key={`lower-${car.id}`} className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                    {getFreshnessLabel(car.updatedAt) || "Recently listed"}
                  </p>
                  <CarCard car={car} />
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="pt-2 flex items-center justify-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-[11px] font-black uppercase tracking-[0.12em] bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 disabled:opacity-40"
                style={{ borderRadius: "10px" }}
              >
                Prev
              </button>
              <div className="flex items-center gap-1.5">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .map((p, idx, arr) => (
                    <div key={p} className="flex items-center">
                      {idx > 0 && arr[idx - 1] !== p - 1 && (
                        <span className="px-1 text-slate-400">…</span>
                      )}
                      <button
                        type="button"
                        onClick={() => setPage(p)}
                        className={`w-9 h-9 text-[11px] font-black ${
                          p === page
                            ? "bg-[#ef3340] text-white"
                            : "bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300"
                        }`}
                        style={{ borderRadius: "10px" }}
                      >
                        {p}
                      </button>
                    </div>
                  ))}
              </div>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 text-[11px] font-black uppercase tracking-[0.12em] bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 disabled:opacity-40"
                style={{ borderRadius: "10px" }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
