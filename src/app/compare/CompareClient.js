"use client";
// src/app/compare/CompareClient.js
import { useEffect, useMemo, useState } from "react";
import { useCompare } from "@/components/CompareContext";
import { formatPrice, formatMileage, BODY_TYPE_LABELS, FUEL_LABELS, TRANSMISSION_LABELS, STEERING_LABELS, DRIVETRAIN_LABELS } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { Search, X, Check, ArrowRight, Minus } from "lucide-react";
import { useRouter } from "next/navigation";

const SLOT_KEYS = ["a", "b", "c"];
const COVERAGE_FIELDS = [
  "price", "year", "mileage", "bodyType", "fuelType", "transmission",
  "engineCC", "drivetrain", "airbags", "seats", "dutyPaid", "condition",
];

function yesNo(value) {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return "N/A";
}

function toDisplay(value) {
  if (value === null || value === undefined || value === "") return "N/A";
  return value;
}

function calcCoverage(car) {
  if (!car) return 0;
  const available = COVERAGE_FIELDS.reduce((count, key) => {
    const value = car[key];
    return value === null || value === undefined || value === "" ? count : count + 1;
  }, 0);
  return Math.round((available / COVERAGE_FIELDS.length) * 100);
}

function getBest(spec, cars) {
  if (cars.length < 2 || !spec.rank) return null;

  if (spec.rank === "booltrue") {
    return cars.some((car) => spec.pick(car).raw === true) ? true : null;
  }

  const values = cars
    .map((car) => spec.pick(car).raw)
    .filter((value) => typeof value === "number");

  if (values.length < 2) return null;
  return spec.rank === "min" ? Math.min(...values) : Math.max(...values);
}

function isDifferent(spec, cars) {
  if (cars.length < 2) return false;

  const values = cars.map((car) => {
    const raw = spec.pick(car).raw;
    if (raw === null || raw === undefined || raw === "") return "__na__";
    return typeof raw === "string" ? raw.toLowerCase() : raw;
  });

  return new Set(values).size > 1;
}

export default function CompareClient({ initialCars }) {
  const { compareCars, addToCompare, removeFromCompare, clearCompare, isFull, isInitialized } = useCompare();
  const router = useRouter();
  const [showDiffOnly, setShowDiffOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [activeSlot, setActiveSlot] = useState(null);
  const [didInitialSync, setDidInitialSync] = useState(false);

  const initialCarsById = useMemo(() => {
    return new Map(initialCars.map((car) => [car.id, car]));
  }, [initialCars]);

  const comparedSlots = useMemo(() => {
    return SLOT_KEYS.map((_, idx) => {
      const selected = compareCars[idx];
      if (!selected) return null;
      return initialCarsById.get(selected.id) || selected;
    });
  }, [compareCars, initialCarsById]);

  const fullComparedCars = useMemo(() => {
    return comparedSlots.filter((car) => car && initialCarsById.has(car.id));
  }, [comparedSlots, initialCarsById]);

  const specGroups = [
    {
      name: "Core",
      specs: [
        { label: "Price", pick: (c) => ({ value: c?.price != null ? formatPrice(c.price) : "N/A", raw: c?.price }), rank: "min" },
        { label: "Year", pick: (c) => ({ value: toDisplay(c?.year), raw: c?.year }), rank: "max" },
        { label: "Mileage", pick: (c) => ({ value: c?.mileage != null ? formatMileage(c.mileage) : "N/A", raw: c?.mileage }), rank: "min" },
        { label: "Condition", pick: (c) => ({ value: toDisplay(c?.condition), raw: c?.condition }) },
        { label: "Body type", pick: (c) => ({ value: c?.bodyType ? BODY_TYPE_LABELS[c.bodyType] : "N/A", raw: c?.bodyType }) },
      ],
    },
    {
      name: "Powertrain",
      specs: [
        { label: "Fuel type", pick: (c) => ({ value: c?.fuelType ? FUEL_LABELS[c.fuelType] : "N/A", raw: c?.fuelType }) },
        { label: "Transmission", pick: (c) => ({ value: c?.transmission ? TRANSMISSION_LABELS[c.transmission] : "N/A", raw: c?.transmission }) },
        { label: "Drivetrain", pick: (c) => ({ value: c?.drivetrain ? DRIVETRAIN_LABELS[c.drivetrain] : "N/A", raw: c?.drivetrain }) },
        { label: "Steering", pick: (c) => ({ value: c?.steering ? STEERING_LABELS[c.steering] : "N/A", raw: c?.steering }) },
        { label: "Engine size", pick: (c) => ({ value: c?.engineCC ? `${c.engineCC}cc` : "N/A", raw: c?.engineCC }), rank: "max" },
        { label: "Cylinders", pick: (c) => ({ value: toDisplay(c?.cylinders), raw: c?.cylinders }), rank: "max" },
        { label: "Horsepower", pick: (c) => ({ value: c?.horsepower ? `${c.horsepower} hp` : "N/A", raw: c?.horsepower }), rank: "max" },
        { label: "Torque", pick: (c) => ({ value: c?.torque ? `${c.torque} Nm` : "N/A", raw: c?.torque }), rank: "max" },
        { label: "Turbocharged", pick: (c) => ({ value: yesNo(c?.turbo), raw: c?.turbo }), rank: "booltrue" },
      ],
    },
    {
      name: "Safety & Comfort",
      specs: [
        { label: "Airbags", pick: (c) => ({ value: c?.airbags != null ? c.airbags : "0", raw: c?.airbags ?? 0 }), rank: "max" },
        { label: "Seats", pick: (c) => ({ value: toDisplay(c?.seats), raw: c?.seats }), rank: "max" },
        { label: "Sunroof", pick: (c) => ({ value: yesNo(c?.sunroof), raw: c?.sunroof }), rank: "booltrue" },
        { label: "Doors", pick: (c) => ({ value: toDisplay(c?.doors), raw: c?.doors }), rank: "max" },
        { label: "Color", pick: (c) => ({ value: toDisplay(c?.color), raw: c?.color }) },
        { label: "Features count", pick: (c) => ({ value: c?.features?.length != null ? c.features.length : "N/A", raw: c?.features?.length }), rank: "max" },
      ],
    },
    {
      name: "Ownership & Import",
      specs: [
        { label: "Duty paid", pick: (c) => ({ value: yesNo(c?.dutyPaid), raw: c?.dutyPaid }) },
        { label: "Imported", pick: (c) => ({ value: yesNo(c?.imported), raw: c?.imported }) },
        { label: "Import country", pick: (c) => ({ value: toDisplay(c?.importCountry), raw: c?.importCountry }) },
        { label: "Dealer", pick: (c) => ({ value: toDisplay(c?.dealer?.name), raw: c?.dealer?.name }) },
        { label: "Dealer verified", pick: (c) => ({ value: yesNo(c?.dealer?.verified), raw: c?.dealer?.verified }), rank: "booltrue" },
      ],
    },
  ];

  // Sync URL-loaded cars into context once compare storage is ready.
  useEffect(() => {
    if (!isInitialized) return;

    if (initialCars.length === 0) {
      setDidInitialSync(true);
      return;
    }

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
    setDidInitialSync(true);
  }, [isInitialized, initialCars, compareCars, addToCompare]);

  // Keep URL in sync with current compare slots to trigger full-spec server hydration.
  useEffect(() => {
    if (!isInitialized || !didInitialSync) return;

    const ids = compareCars.slice(0, 3).map(c => c.id);
    const params = new URLSearchParams();
    ids.forEach((id, i) => params.set(SLOT_KEYS[i], id));
    const nextUrl = params.toString() ? `/compare?${params.toString()}` : "/compare";
    router.replace(nextUrl, { scroll: false });
  }, [isInitialized, didInitialSync, compareCars, router]);

  // Slot search with debounce + cancellation.
  useEffect(() => {
    if (activeSlot === null || searchQuery.length < 2) {
      setSearchResults([]);
      setLoadingSearch(false);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        setLoadingSearch(true);
        const res = await fetch(`/api/cars/search?q=${encodeURIComponent(searchQuery)}`, { signal: controller.signal });
        const data = await res.json();
        setSearchResults(Array.isArray(data) ? data : []);
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Compare search failed:", error);
        }
      } finally {
        setLoadingSearch(false);
      }
    }, 250);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [searchQuery, activeSlot]);

  const onAddCarSearch = (car) => {
    if (compareCars.find((c) => c.id === car.id)) {
      setSearchQuery("");
      setSearchResults([]);
      setActiveSlot(null);
      return;
    }

    if (isFull) return;

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
          <p className="text-white/40 max-w-2xl font-medium">Spec-heavy side-by-side analysis. Compare up to 3 vehicles across pricing, powertrain, safety, comfort, and ownership factors.</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowDiffOnly(!showDiffOnly)}
            className={`px-6 h-12 rounded-2xl flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all ${
              showDiffOnly ? "bg-orange-600 text-white shadow-[0_0_20px_rgba(234,88,12,0.3)]" : "bg-white/5 border border-white/10 text-white/50 hover:text-white"
            }`}
          >
            {showDiffOnly ? <Check className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
            Differences Only
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
            {SLOT_KEYS.map((_, idx) => {
              const car = comparedSlots[idx];
              const hydrated = !!(car && initialCarsById.has(car.id));
              const imageUrl = car?.images?.[0]?.url || car?.image || null;
              return (
                <div key={idx} className={`p-6 md:p-8 flex flex-col gap-4 border-r border-white/5 last:border-r-0 relative transition-all ${!car ? "bg-white/[0.01]" : ""}`}>
                  {car ? (
                    <>
                      <button
                        onClick={() => removeFromCompare(car.id)}
                        className="absolute top-4 right-4 text-white/20 hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="relative aspect-[16/10] rounded-2xl overflow-hidden border border-white/10 bg-white/5 shadow-2xl">
                        {imageUrl ? (
                          <Image src={imageUrl} alt={car.model} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/10 font-bold uppercase tracking-widest text-[10px]">No Image</div>
                        )}
                      </div>
                      <div>
                         <p className="text-[10px] font-black uppercase tracking-widest text-[#f97316] mb-1">{car.year}</p>
                         <h3 className="font-black text-sm md:text-base leading-tight text-white mb-1 line-clamp-2">{car.make} {car.model}</h3>
                         <p className="text-white/40 text-[10px] truncate">{car.variant || "Standard Variant"}</p>
                         <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest mt-2">
                           Spec Coverage: {hydrated ? `${calcCoverage(car)}%` : "Loading"}
                         </p>
                      </div>
                    </>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center gap-4">
                       <button
                         onClick={() => setActiveSlot(idx)}
                         className="w-16 h-16 rounded-3xl bg-white/5 border border-dashed border-white/10 flex items-center justify-center text-white/20 hover:text-orange-500 hover:border-orange-500/50 transition-all group"
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
                               onChange={(e) => setSearchQuery(e.target.value)}
                               className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500/50 transition-all font-bold"
                             />
                             <button onClick={() => setActiveSlot(null)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white">
                               <X className="w-4 h-4" />
                             </button>
                           </div>
                           <div className="mt-4 space-y-2 max-h-[300px] overflow-y-auto no-scrollbar">
                             {loadingSearch && (
                               <p className="text-center py-6 text-xs text-white/30 font-bold">Searching inventory...</p>
                             )}
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
                                   <p className="text-[10px] text-orange-500/70 font-bold">{formatPrice(res.price)}</p>
                                 </div>
                                 <ArrowRight className="w-4 h-4 text-white/20" />
                               </button>
                             ))}
                             {!loadingSearch && searchQuery.length >= 2 && searchResults.length === 0 && (
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
                  const diff = isDifferent(spec, fullComparedCars);
                  if (showDiffOnly && !diff && fullComparedCars.length > 1) return null;

                  return (
                    <div key={spec.label} className={`grid grid-cols-[160px_1fr_1fr_1fr] md:grid-cols-[240px_1fr_1fr_1fr] transition-colors ${diff ? "bg-white/[0.02]" : "hover:bg-white/[0.015]"}`}>
                      <div className="p-6 md:p-8 flex items-center border-r border-white/5 bg-[#0a0a0a]">
                        <span className="text-[11px] font-bold text-white/30 uppercase tracking-widest">{spec.label}</span>
                      </div>
                      {SLOT_KEYS.map((_, idx) => {
                        const car = comparedSlots[idx];
                        if (!car) return <div key={idx} className="p-6 md:p-8 border-r border-white/5 last:border-r-0" />;
                        if (!initialCarsById.has(car.id)) {
                          return (
                            <div key={idx} className="p-6 md:p-8 flex items-center justify-center border-r border-white/5 last:border-r-0">
                              <span className="text-[11px] font-bold text-white/30 uppercase tracking-widest">Loading...</span>
                            </div>
                          );
                        }
                        
                        const { value, raw } = spec.pick(car);
                        const best = getBest(spec, fullComparedCars);
                        const isBestValue = best != null && raw === best;

                        return (
                          <div key={idx} className="p-6 md:p-8 flex items-center justify-center border-r border-white/5 last:border-r-0">
                            <span className={`text-[13px] font-black leading-relaxed text-center ${
                              isBestValue ? "text-emerald-400" : "text-white/80"
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
           {comparedSlots.filter(Boolean).map(car => (
             <Link key={car.id} href={`/cars/${car.id}`} className="px-6 h-12 rounded-2xl bg-white/5 border border-white/10 hover:border-orange-500/50 hover:bg-white/10 transition-all flex items-center gap-2 group">
                <span className="text-[11px] font-black text-white/60 group-hover:text-white uppercase tracking-widest">{car.make} {car.model}</span>
                <ArrowRight className="w-3 h-3 text-orange-500" />
             </Link>
           ))}
        </div>
      </div>
    </div>
  );
}
