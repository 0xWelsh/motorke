"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatPrice, formatMileage, FUEL_LABELS, BADGE_OPTIONS } from "@/lib/utils";
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
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search this dealer's inventory..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-white border border-[#ece6dd] rounded-none px-11 py-3.5 text-sm font-bold placeholder:text-slate-400 outline-none focus:border-[#ddd4c8] transition-all shadow-sm"
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900">
               <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 sm:pb-0 hide-scrollbar">
          <div className="flex items-center justify-center w-10 h-10 shrink-0 bg-[#fbfcfe] border border-[#ece6dd] rounded-none text-slate-500">
             <SlidersHorizontal className="w-4 h-4" />
          </div>
          {makes.map((make) => (
             <button
               key={make}
               onClick={() => setActiveFilter(make)}
               className={`px-4 py-2.5 shrink-0 rounded-none text-[10px] font-black uppercase tracking-widest transition-all border shadow-sm ${
                 activeFilter === make
                    ? "bg-slate-900 text-slate-900 border-slate-900"
                    : "bg-white text-slate-600 border-[#ece6dd] hover:border-slate-400"
               }`}
             >
               {make === "ALL" ? "All Cars" : make}
             </button>
          ))}
        </div>
      </div>

      {filteredCars.length === 0 ? (
        <div className="border border-dashed border-[#ece6dd] bg-[#fbfcfe] rounded-[2rem] p-12 text-center">
           <Search className="w-8 h-8 mx-auto text-slate-300 mb-4" />
           <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-1">No matches found</h3>
           <p className="text-xs font-medium text-slate-500">Try adjusting your filters or search query.</p>
        </div>
      ) : (
        <div className="border-y border-[#ece6dd] divide-y divide-[#ece6dd]">
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
              <article key={car.id} className="py-6 group">
                <div className="grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)_170px] gap-4 md:gap-5 items-start">
                  <Link href={`/cars/${car.id}`} className="relative aspect-[16/10] bg-[#fbfcfe] overflow-hidden border border-[#ece6dd] rounded-[1.25rem]">
                    {img ? (
                      <Image
                        src={img}
                        alt={title}
                        fill
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        sizes="(max-width: 768px) 100vw, 220px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">No Image</div>
                    )}

                    {car.badges?.length > 0 && (
                      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                        {car.badges.slice(0, 2).map((b) => (
                          <span key={b} className={`text-[9px] font-extrabold px-2 py-1 rounded-none shadow-sm ${BADGE_OPTIONS[b]?.color || "bg-white/90 text-slate-700"}`}>
                            {b}
                          </span>
                        ))}
                      </div>
                    )}
                  </Link>

                  <div className="min-w-0 flex flex-col h-full justify-center">
                    <Link href={`/cars/${car.id}`}>
                      <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight mb-2 group-hover:text-amber-600 transition-colors line-clamp-1">{title}</h3>
                    </Link>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500 mb-5">
                      {specs.map((s, idx) => (
                        <span key={idx} className="flex items-center gap-4">
                           {s} {idx !== specs.length - 1 && <span className="w-1 h-1 rounded-none bg-slate-200" />}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-3">
                      <CompareButton car={compareCar} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:flex-col md:items-end md:justify-center md:h-full gap-4">
                    <div className="text-left md:text-right">
                       <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{formatPrice(car.price)}</p>
                       <p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-slate-400 mt-1">Ready to go</p>
                    </div>
                    <Link href={`/cars/${car.id}`} className="w-12 h-12 rounded-[1rem] bg-[#fbfcfe] border border-[#ece6dd] flex items-center justify-center text-slate-300 group-hover:bg-slate-900 group-hover:text-slate-900 group-hover:border-slate-900 transition-all shadow-sm">
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
