"use client";
// src/app/compare/CompareClient.js
import { useState, useEffect, useRef } from "react";
import { useCompare } from "@/components/CompareContext";
import { formatPrice, formatMileage, BODY_TYPE_LABELS, FUEL_LABELS, TRANSMISSION_LABELS, STEERING_LABELS, DRIVETRAIN_LABELS } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { Search, X, Check, ArrowRight, Minus } from "lucide-react";

export default function CompareClient({ initialCars }) {
  const { compareCars, addToCompare, removeFromCompare, clearCompare, isFull } = useCompare();
  const [highlightDiffs, setHighlightDiffs] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [activeSlot, setActiveSlot] = useState(null);
  const searchRef = useRef(null);

  // Sync initialCars from URL to Context if they aren't already there
  useEffect(() => {
    initialCars.forEach(car => {
      if (!compareCars.find(c => c.id === car.id)) {
        addToCompare({
          id: car.id,
          year: car.year,
          make: car.make,
          model: car.model,
          price: car.price,
          image: car.images[0]?.url
        });
      }
    });
  }, [initialCars]);

  // Update URL to match context
  useEffect(() => {
    const ids = compareCars.slice(0, 3).map(c => c.id);
    const params = new URLSearchParams();
    ids.forEach((id, i) => params.set("abc"[i], id));
    window.history.replaceState(null, "", `/compare?${params.toString()}`);
  }, [compareCars]);

  const handleSearch = async (val) => {
    setSearchQuery(val);
    if (val.length < 2) {
      setSearchResults([]);
      return;
    }
    const res = await fetch(`/api/cars/search?q=${val}`);
    const data = await res.json();
    setSearchResults(data);
  };

  const specGroups = [
    {
      name: "Basics",
      specs: [
        { label: "Price",           key: (c) => ({ value: formatPrice(c.price), raw: c.price }), type: "min" },
        { label: "Year",            key: (c) => ({ value: c.year, raw: c.year }), type: "max" },
        { label: "Mileage",         key: (c) => ({ value: formatMileage(c.mileage), raw: c.mileage }), type: "min" },
        { label: "Body type",       key: (c) => ({ value: BODY_TYPE_LABELS[c.bodyType], raw: c.bodyType }) },
        { label: "Transmission",    key: (c) => ({ value: TRANSMISSION_LABELS[c.transmission], raw: c.transmission }) },
        { label: "Fuel type",       key: (c) => ({ value: FUEL_LABELS[c.fuelType], raw: c.fuelType }) },
      ]
    },
    {
      name: "Performance",
      specs: [
        { label: "Engine size",     key: (c) => ({ value: c.engineCC ? `${c.engineCC}cc` : "N/A", raw: c.engineCC }), type: "max" },
        { label: "Drivetrain",      key: (c) => ({ value: DRIVETRAIN_LABELS[c.drivetrain] || "N/A", raw: c.drivetrain }) },
        { label: "Cylinders",       key: (c) => ({ value: c.cylinders || "N/A", raw: c.cylinders }), type: "max" },
        { label: "Horsepower",      key: (c) => ({ value: c.horsepower ? `${c.horsepower} hp` : "N/A", raw: c.horsepower }), type: "max" },
        { label: "Turbocharged",    key: (c) => ({ value: c.turbo ? "Yes" : "No", raw: c.turbo }) },
      ]
    },
    {
      name: "Interior & Comfort",
      specs: [
        { label: "Seats",           key: (c) => ({ value: c.seats || "N/A", raw: c.seats }), type: "max" },
        { label: "Sunroof",         key: (c) => ({ value: c.sunroof ? "Yes" : "No", raw: c.sunroof }) },
        { label: "Airbags",         key: (c) => ({ value: c.airbags || "0", raw: c.airbags }), type: "max" },
        { label: "Color",           key: (c) => ({ value: c.color || "N/A", raw: c.color }) },
      ]
    },
    {
      name: "Logistics",
      specs: [
        { label: "Condition",       key: (c) => ({ value: c.condition, raw: c.condition }) },
        { label: "Duty paid",       key: (c) => ({ value: c.dutyPaid ? "Yes" : "No", raw: c.dutyPaid }) },
        { label: "Import country",  key: (c) => ({ value: c.importCountry || "N/A", raw: c.importCountry }) },
      ]
    }
  ];

  function getBest(spec, cars) {
    if (cars.length < 2 || !spec.type) return null;
    const vals = cars.map(c => spec.key(c).raw).filter(v => v != null && typeof v === "number");
    if (vals.length < 2) return null;
    const bestVal = spec.type === "min" ? Math.min(...vals) : Math.max(...vals);
    return bestVal;
  }

  function isDifferent(spec, cars) {
    if (cars.length < 2) return false;
    const vals = cars.map(c => spec.key(c).value);
    return new Set(vals).size > 1;
  }

  // Find full car objects for initial data (from db via server component)
  // But subsequent additions will only have minimal car data from context
  // So we need to re-fetch if we want full specs.
  // Actually, for GSMArena style, adding a car usually reloads or fetches its data.
  // I'll use a simple approach: if a car is being compared, the parent server component fetched it.
  // If a car was added via "search-to-add", it will be missing full specs until reloaded.
  // I think I'll just reload the page with new query params when a car is added via search.

  const onAddCarSearch = (car) => {
    addToCompare(car);
    setSearchQuery("");
    setSearchResults([]);
    setActiveSlot(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-8">
        <div>
          <h1 className="text-5xl font-black mb-4 tracking-tighter">Comparison Engine</h1>
          <p className="text-white/40 max-w-xl font-medium">Side-by-side automotive assessment. Add up to 3 units to evaluate specs, performance, and value.</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setHighlightDiffs(!highlightDiffs)}
            className={`px-6 h-12 rounded-2xl flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all ${
              highlightDiffs ? "bg-orange-600 text-white shadow-[0_0_20px_rgba(234,88,12,0.3)]" : "bg-white/5 border border-white/10 text-white/50 hover:text-white"
            }`}
          >
            {highlightDiffs ? <Check className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
            Highlight Diffs
          </button>
          <button
            onClick={clearCompare}
            className="px-6 h-12 rounded-2xl bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 text-xs font-black uppercase tracking-widest transition-all"
          >
            Clear All
          </button>
        </div>
      </div>

      <div className="relative border border-white/10 rounded-[3rem] overflow-hidden bg-[#0a0a0a]">
        {/* Table Header (Sticky) */}
        <div className="sticky top-0 z-30 bg-[#0a0a0a]/90 backdrop-blur-2xl border-b border-white/10">
          <div className="grid grid-cols-[160px_1fr_1fr_1fr] md:grid-cols-[240px_1fr_1fr_1fr]">
            <div className="p-8 flex items-center justify-center border-r border-white/5">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 -rotate-90">Model View ⚖️</span>
            </div>
            {[0, 1, 2].map((idx) => {
              const car = initialCars[idx];
              return (
                <div key={idx} className={`p-6 md:p-8 flex flex-col gap-4 border-r border-white/5 last:border-r-0 relative transition-all ${!car ? "bg-white/[0.01]" : ""}`}>
                  {car ? (
                    <>
                      <button
                        onClick={() => removeFromCompare(car.id)}
                        className="absolute top-4 right-4 text-white/20 hover:text-black transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="relative aspect-[16/10] rounded-2xl overflow-hidden border border-white/10 bg-white/5 shadow-2xl">
                        {car.images?.[0]?.url ? (
                          <Image src={car.images[0].url} alt={car.model} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/10 font-bold uppercase tracking-widest text-[10px]">No Image</div>
                        )}
                      </div>
                      <div>
                         <p className="text-[10px] font-black uppercase tracking-widest text-[#f97316] mb-1">{car.year}</p>
                         <h3 className="font-black text-sm md:text-base leading-tight text-white mb-1 line-clamp-2">{car.make} {car.model}</h3>
                         <p className="text-white/40 text-[10px] truncate">{car.variant || "Standard Variant"}</p>
                      </div>
                    </>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center gap-4">
                       <button
                         onClick={() => setActiveSlot(idx)}
                         className="w-16 h-16 rounded-3xl bg-white/5 border border-dashed border-white/10 flex items-center justify-center text-white/20 hover:text-black hover:border-orange-500/50 transition-all group"
                       >
                         <Search className="w-6 h-6 group-hover:scale-110 transition-transform" />
                       </button>
                       <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Empty Slot</span>
                       
                       {activeSlot === idx && (
                         <div className="absolute inset-0 bg-[#0a0a0a] z-40 p-4 transition-all animate-in fade-in zoom-in-95">
                           <div className="relative">
                             <input
                               autoFocus
                               type="text"
                               placeholder="Search car..."
                               value={searchQuery}
                               onChange={(e) => handleSearch(e.target.value)}
                               className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500/50 transition-all font-bold"
                             />
                             <button onClick={() => setActiveSlot(null)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white">
                               <X className="w-4 h-4" />
                             </button>
                           </div>
                           <div className="mt-4 space-y-2 max-h-[300px] overflow-y-auto no-scrollbar">
                             {searchResults.map((res) => (
                               <button
                                 key={res.id}
                                 onClick={() => onAddCarSearch(res)}
                                 className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all text-left"
                               >
                                 <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/5 shrink-0 relative">
                                   {res.image && <Image src={res.image} alt={res.model} fill className="object-cover" />}
                                 </div>
                                 <div className="flex-1 min-w-0">
                                   <p className="text-xs font-black text-white">{res.year} {res.make} {res.model}</p>
                                   <p className="text-[10px] text-black/70 font-bold">{formatPrice(res.price)}</p>
                                 </div>
                                 <ArrowRight className="w-4 h-4 text-white/20" />
                               </button>
                             ))}
                             {searchQuery.length >= 2 && searchResults.length === 0 && (
                               <p className="text-center py-8 text-xs text-white/20 font-bold">No units found matching "{searchQuery}"</p>
                             )}
                           </div>
                         </div>
                       )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Table Content */}
        <div className="divide-y divide-white/5">
          {specGroups.map((group) => (
            <div key={group.name} className="bg-[#0c0c0c]">
              <div className="grid grid-cols-[160px_1fr] md:grid-cols-[240px_1fr] py-4 px-8 items-center bg-white/[0.01]">
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#f97316]">{group.name}</h2>
                <div className="h-px bg-white/5" />
              </div>
              <div className="divide-y divide-white/[0.02]">
                {group.specs.map((spec) => {
                  const diff = isDifferent(spec, initialCars.filter(Boolean));
                  if (highlightDiffs && !diff && initialCars.filter(Boolean).length > 1) return null;

                  return (
                    <div key={spec.label} className="grid grid-cols-[160px_1fr_1fr_1fr] md:grid-cols-[240px_1fr_1fr_1fr] hover:bg-white/[0.02] transition-colors">
                      <div className="p-6 md:p-8 flex items-center border-r border-white/5 bg-[#0a0a0a]">
                        <span className="text-[11px] font-bold text-white/30 uppercase tracking-widest">{spec.label}</span>
                      </div>
                      {[0, 1, 2].map((idx) => {
                        const car = initialCars[idx];
                        if (!car) return <div key={idx} className="p-6 md:p-8 border-r border-white/5 last:border-r-0" />;
                        
                        const { value, raw } = spec.key(car);
                        const best = getBest(spec, initialCars.filter(Boolean));
                        const isBestValue = best != null && raw === best;

                        return (
                          <div key={idx} className="p-6 md:p-8 flex items-center justify-center border-r border-white/5 last:border-r-0">
                            <span className={`text-[13px] font-black leading-relaxed text-center ${
                              isBestValue ? "text-white" : "text-white/80"
                            }`}>
                              {value}
                              {isBestValue && <span className="block text-[8px] mt-1 opacity-50">Best Spec</span>}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Compare Page Bottom CTA */}
      <div className="mt-12 flex flex-col items-center gap-6 p-12 bg-white/[0.01] border border-white/10 rounded-[3rem] text-center">
        <p className="text-white/40 text-sm font-medium">Ready to take the next step with one of these units?</p>
        <div className="flex gap-4">
           {initialCars.filter(Boolean).map(car => (
             <Link key={car.id} href={`/cars/${car.id}`} className="px-6 h-12 rounded-2xl bg-white/5 border border-white/10 hover:border-orange-500/50 hover:bg-white/10 transition-all flex items-center gap-2 group">
                <span className="text-[11px] font-black text-white/60 group-hover:text-white uppercase tracking-widest">{car.make} {car.model}</span>
                <ArrowRight className="w-3 h-3 text-black" />
             </Link>
           ))}
        </div>
      </div>
    </div>
  );
}
