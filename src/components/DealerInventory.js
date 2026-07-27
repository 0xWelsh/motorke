"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import CarCard from "@/components/CarCard";
import DealerInventoryStripCard from "@/components/DealerInventoryStripCard";
import DealerInventoryFeaturedStrip from "@/components/DealerInventoryFeaturedStrip";

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
  const mobileFeatured = page === 1 && activeFilter === "ALL" && !query ? pageCars[0] : null;
  const mobileStripCars = mobileFeatured ? pageCars.slice(1) : pageCars;

  useEffect(() => {
    setPage(1);
  }, [query, activeFilter]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6 lg:mb-10">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search showroom..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-[#0f0f0f] border border-white/[0.08] text-sm font-medium text-white placeholder:text-zinc-400 outline-none focus:border-[var(--accent)] transition-all py-3.5 px-11 rounded-xl"
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white">
               <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 sm:pb-0 hide-scrollbar">
          <div className="flex items-center justify-center w-10 h-10 shrink-0 bg-[#111111] border border-white/[0.08] rounded-2xl text-zinc-400">
             <SlidersHorizontal className="w-4 h-4" />
          </div>
          {makes.map((make) => (
             <button
               key={make}
               onClick={() => setActiveFilter(make)}
               className={`px-4 py-2.5 shrink-0 text-[10px] font-bold uppercase tracking-widest transition-all border rounded-xl ${
                 activeFilter === make
                   ? "bg-white text-black border-white"
                    : "bg-[#111111] text-zinc-400 border-white/[0.08] hover:border-white"
               }`}
             >
               {make === "ALL" ? "All Units" : make}
             </button>
          ))}
        </div>
      </div>

      {filteredCars.length === 0 ? (
        <div className="border border-dashed border-white/[0.08] bg-[#111111] p-16 text-center rounded-xl">
           <Search className="w-10 h-10 mx-auto text-zinc-600 mb-6" />
           <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-2">No units found</h3>
           <p className="text-sm font-medium text-zinc-400">Try adjusting your filters or search query.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Mobile: edge-to-edge packed strips; latest listing gets a small slideshow */}
          <div className="-mx-4 flex flex-col sm:-mx-6 lg:hidden">
            {mobileFeatured ? (
              <DealerInventoryFeaturedStrip
                car={mobileFeatured}
                freshnessLabel={getFreshnessLabel(mobileFeatured.updatedAt) || "Just listed"}
              />
            ) : null}
            {mobileStripCars.map((car) => (
              <DealerInventoryStripCard
                key={`strip-${car.id}`}
                car={car}
                showFreshness
                freshnessLabel={getFreshnessLabel(car.updatedAt) || "Recently listed"}
              />
            ))}
          </div>

          {/* Desktop: grid cards */}
          {topCars.length > 0 && (
            <div className="hidden lg:grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
              {topCars.map((car) => (
                <div key={`top-${car.id}`} className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-400">
                    {getFreshnessLabel(car.updatedAt) || "Recently listed"}
                  </p>
                  <CarCard car={car} />
                </div>
              ))}
            </div>
          )}
          {lowerCars.length > 0 && (
            <div className="hidden lg:grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
              {lowerCars.map((car) => (
                <div key={`lower-${car.id}`} className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-400">
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
                className="px-4 py-2 text-[11px] font-black uppercase tracking-[0.12em] bg-white/[0.06] text-zinc-300 disabled:opacity-40 rounded-xl"
              >
                Prev
              </button>
              <div className="flex items-center gap-1.5">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .map((p, idx, arr) => (
                    <div key={p} className="flex items-center">
                      {idx > 0 && arr[idx - 1] !== p - 1 && (
                        <span className="px-1 text-zinc-400">…</span>
                      )}
                      <button
                        type="button"
                        onClick={() => setPage(p)}
                        className={`w-9 h-9 text-[11px] font-black rounded-xl ${
                          p === page
                            ? "bg-[#ef3340] text-white"
                            : "bg-white/[0.06] text-zinc-300"
                        }`}
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
                className="px-4 py-2 text-[11px] font-black uppercase tracking-[0.12em] bg-white/[0.06] text-zinc-300 disabled:opacity-40 rounded-xl"
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
