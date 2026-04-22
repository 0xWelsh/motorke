"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatPrice, formatCarPrice, formatMileage, FUEL_LABELS, BADGE_OPTIONS } from "@/lib/utils";
import { Search, SlidersHorizontal, ChevronRight, X } from "lucide-react";
import { CompareButton } from "@/components/CompareSelector";

export default function DealerInventory({ cars, dealerSlug }) {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");

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
                    ? "bg-[#111827] text-white border-[#111827] dark:bg-white dark:text-black dark:border-white"
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
        <div className="border-t border-slate-100 dark:border-slate-800 divide-y divide-slate-50 dark:divide-slate-900">
          {filteredCars.map((car) => {
            const img = car.images?.[0]?.url;
            const title = `${car.make} ${car.model}${car.variant ? ` ${car.variant}` : ""}`;
            const specs = [
              car.year,
              car.fuelType && FUEL_LABELS[car.fuelType],
              car.transmission === "AUTOMATIC" ? "Auto" : car.transmission === "MANUAL" ? "Manual" : car.transmission,
              car.mileage ? formatMileage(car.mileage) : null,
            ].filter(Boolean);

            const compareCar = {
              ...car,
              image: img,
              model: `${car.make} ${car.model}`,
            };

            return (
              <article key={car.id} className="py-8 group">
                <div className="grid grid-cols-1 md:grid-cols-[200px_minmax(0,1fr)_180px] gap-8 md:gap-12 items-center">
                  <Link href={`/cars/${car.id}`} className="relative aspect-[16/10] bg-slate-100 dark:bg-slate-900 overflow-hidden border border-slate-100 dark:border-slate-800" style={{ borderRadius: 'var(--radius)' }}>
                    {img ? (
                      <Image
                        src={img}
                        alt={title}
                        fill
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        sizes="(max-width: 768px) 100vw, 200px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">No Image</div>
                    )}

                    {car.badges?.length > 0 && (
                      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                        {car.badges.slice(0, 2).map((b) => (
                          <span key={b} className={`text-[8px] font-bold px-2 py-1 uppercase tracking-widest shadow-sm rounded-[2px] ${BADGE_OPTIONS[b]?.color || "bg-white/90 text-[#111827]"}`}>
                            {b}
                          </span>
                        ))}
                      </div>
                    )}
                  </Link>

                  <div className="min-w-0 flex flex-col h-full justify-center">
                    <Link href={`/cars/${car.id}`}>
                      <h3 className="text-xl sm:text-2xl font-bold text-[#111827] dark:text-white leading-tight mb-2 group-hover:text-[#38A169] transition-colors line-clamp-1">{title}</h3>
                    </Link>

                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-[10px] font-bold uppercase tracking-widest text-[#718096] dark:text-slate-400 mb-6">
                      {specs.map((s, idx) => (
                        <span key={idx} className="flex items-center gap-4">
                           {s} {idx !== specs.length - 1 && <span className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-800" />}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-3">
                      <CompareButton car={compareCar} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:flex-col md:items-end md:justify-center md:h-full gap-4">
                    <div className="text-left md:text-right">
                       <p className="text-2xl sm:text-3xl font-bold text-[#111827] dark:text-white tracking-tight">{formatCarPrice(car)}</p>
                       <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-1">Direct from Showroom</p>
                    </div>
                    <Link href={`/cars/${car.id}`} className="w-12 h-12 bg-[#F7FAFC] dark:bg-[#111111] border border-slate-100 dark:border-slate-800 flex items-center justify-center text-[#111827] dark:text-white hover:bg-[#111827] dark:hover:bg-white hover:text-white dark:hover:text-black transition-all shadow-sm" style={{ borderRadius: 'var(--radius)' }}>
                       <ChevronRight className="w-5 h-5 pointer-events-none" />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
