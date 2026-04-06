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
const PRESETS = [
  { id: "all", label: "Full Sheet" },
  { id: "city", label: "City" },
  { id: "family", label: "Family" },
  { id: "performance", label: "Performance" },
  { id: "longtrip", label: "Long Trip" },
];

const SEVERITY_STYLES = {
  minor: "text-amber-300 border-amber-400/30 bg-amber-500/10",
  moderate: "text-orange-300 border-orange-400/30 bg-orange-500/10",
  major: "text-rose-300 border-rose-400/30 bg-rose-500/10",
};

const FUEL_ECO_SCORE = {
  ELECTRIC: 4,
  HYBRID: 3,
  PETROL: 2,
  DIESEL: 1,
};

function yesNo(value) {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return "N/A";
}

function toDisplay(value) {
  if (value === null || value === undefined || value === "") return "N/A";
  return value;
}

function isMissing(raw) {
  return raw === null || raw === undefined || raw === "";
}

function normalizeScore(cars, getter, carId, higherIsBetter = true) {
  const points = cars.map((car) => ({ id: car.id, value: getter(car) }))
    .filter((entry) => typeof entry.value === "number");

  if (points.length === 0) return 0;
  if (points.length === 1) return points[0].id === carId ? 1 : 0;

  const min = Math.min(...points.map((entry) => entry.value));
  const max = Math.max(...points.map((entry) => entry.value));
  const current = points.find((entry) => entry.id === carId)?.value;

  if (typeof current !== "number") return 0;
  if (max === min) return 0.5;

  if (higherIsBetter) {
    return (current - min) / (max - min);
  }

  return (max - current) / (max - min);
}

function calcCoverage(car, specs) {
  if (!car) return 0;
  const total = specs.length;
  if (total === 0) return 0;

  const available = specs.reduce((count, spec) => {
    const raw = spec.pick(car).raw;
    return isMissing(raw) ? count : count + 1;
  }, 0);

  return Math.round((available / total) * 100);
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

function getDiffSeverity(spec, cars) {
  if (cars.length < 2 || !isDifferent(spec, cars)) return "none";

  if (spec.rank === "booltrue") return "moderate";

  const numeric = cars
    .map((car) => spec.pick(car).raw)
    .filter((value) => typeof value === "number");

  if (numeric.length >= 2) {
    const min = Math.min(...numeric);
    const max = Math.max(...numeric);
    const ratio = Math.abs(max - min) / Math.max(Math.abs(max), 1);
    if (ratio >= 0.35) return "major";
    if (ratio >= 0.15) return "moderate";
    return "minor";
  }

  return "minor";
}

function getGaugePercent(spec, cars, raw) {
  if (typeof raw !== "number" || (spec.rank !== "min" && spec.rank !== "max")) return null;

  const values = cars
    .map((car) => spec.pick(car).raw)
    .filter((value) => typeof value === "number");

  if (values.length < 2) return 100;
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return 100;

  if (spec.rank === "min") {
    return Math.round(((max - raw) / (max - min)) * 100);
  }

  return Math.round(((raw - min) / (max - min)) * 100);
}

export default function CompareClient({ initialCars }) {
  const { compareCars, addToCompare, removeFromCompare, clearCompare, isFull, isInitialized } = useCompare();
  const router = useRouter();
  const [showDiffOnly, setShowDiffOnly] = useState(false);
  const [preset, setPreset] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [activeSlot, setActiveSlot] = useState(null);
  const [didInitialSync, setDidInitialSync] = useState(false);
  const [saveState, setSaveState] = useState("idle");

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
        { id: "price", label: "Price", tags: ["all", "city", "family", "longtrip"], pick: (c) => ({ value: c?.price != null ? formatPrice(c.price) : "N/A", raw: c?.price }), rank: "min" },
        { id: "year", label: "Year", tags: ["all", "city", "family", "longtrip", "performance"], pick: (c) => ({ value: toDisplay(c?.year), raw: c?.year }), rank: "max" },
        { id: "mileage", label: "Mileage", tags: ["all", "city", "longtrip", "family"], pick: (c) => ({ value: c?.mileage != null ? formatMileage(c.mileage) : "N/A", raw: c?.mileage }), rank: "min" },
        { id: "condition", label: "Condition", tags: ["all", "family", "longtrip"], pick: (c) => ({ value: toDisplay(c?.condition), raw: c?.condition }) },
        { id: "bodyType", label: "Body type", tags: ["all", "city", "family"], pick: (c) => ({ value: c?.bodyType ? BODY_TYPE_LABELS[c.bodyType] : "N/A", raw: c?.bodyType }) },
      ],
    },
    {
      name: "Powertrain",
      specs: [
        { id: "fuelType", label: "Fuel type", tags: ["all", "city", "longtrip"], pick: (c) => ({ value: c?.fuelType ? FUEL_LABELS[c.fuelType] : "N/A", raw: c?.fuelType }) },
        { id: "transmission", label: "Transmission", tags: ["all", "city", "longtrip", "performance"], pick: (c) => ({ value: c?.transmission ? TRANSMISSION_LABELS[c.transmission] : "N/A", raw: c?.transmission }) },
        { id: "drivetrain", label: "Drivetrain", tags: ["all", "performance", "longtrip"], pick: (c) => ({ value: c?.drivetrain ? DRIVETRAIN_LABELS[c.drivetrain] : "N/A", raw: c?.drivetrain }) },
        { id: "steering", label: "Steering", tags: ["all", "city", "performance"], pick: (c) => ({ value: c?.steering ? STEERING_LABELS[c.steering] : "N/A", raw: c?.steering }) },
        { id: "engineCC", label: "Engine size", tags: ["all", "performance", "longtrip"], pick: (c) => ({ value: c?.engineCC ? `${c.engineCC}cc` : "N/A", raw: c?.engineCC }), rank: "max" },
        { id: "cylinders", label: "Cylinders", tags: ["all", "performance"], pick: (c) => ({ value: toDisplay(c?.cylinders), raw: c?.cylinders }), rank: "max" },
        { id: "horsepower", label: "Horsepower", tags: ["all", "performance"], pick: (c) => ({ value: c?.horsepower ? `${c.horsepower} hp` : "N/A", raw: c?.horsepower }), rank: "max" },
        { id: "torque", label: "Torque", tags: ["all", "performance", "longtrip"], pick: (c) => ({ value: c?.torque ? `${c.torque} Nm` : "N/A", raw: c?.torque }), rank: "max" },
        { id: "turbo", label: "Turbocharged", tags: ["all", "performance"], pick: (c) => ({ value: yesNo(c?.turbo), raw: c?.turbo }), rank: "booltrue" },
      ],
    },
    {
      name: "Safety & Comfort",
      specs: [
        { id: "airbags", label: "Airbags", tags: ["all", "family", "longtrip"], pick: (c) => ({ value: c?.airbags != null ? c.airbags : "0", raw: c?.airbags ?? 0 }), rank: "max" },
        { id: "seats", label: "Seats", tags: ["all", "family", "longtrip"], pick: (c) => ({ value: toDisplay(c?.seats), raw: c?.seats }), rank: "max" },
        { id: "sunroof", label: "Sunroof", tags: ["all", "family"], pick: (c) => ({ value: yesNo(c?.sunroof), raw: c?.sunroof }), rank: "booltrue" },
        { id: "doors", label: "Doors", tags: ["all", "city", "family"], pick: (c) => ({ value: toDisplay(c?.doors), raw: c?.doors }), rank: "max" },
        { id: "color", label: "Color", tags: ["all"], pick: (c) => ({ value: toDisplay(c?.color), raw: c?.color }) },
        { id: "featuresCount", label: "Features count", tags: ["all", "family"], pick: (c) => ({ value: c?.features?.length != null ? c.features.length : "N/A", raw: c?.features?.length }), rank: "max" },
      ],
    },
    {
      name: "Ownership & Import",
      specs: [
        { id: "dutyPaid", label: "Duty paid", tags: ["all", "city", "longtrip"], pick: (c) => ({ value: yesNo(c?.dutyPaid), raw: c?.dutyPaid }) },
        { id: "imported", label: "Imported", tags: ["all", "city", "longtrip"], pick: (c) => ({ value: yesNo(c?.imported), raw: c?.imported }) },
        { id: "importCountry", label: "Import country", tags: ["all", "city", "longtrip"], pick: (c) => ({ value: toDisplay(c?.importCountry), raw: c?.importCountry }) },
        { id: "dealer", label: "Dealer", tags: ["all", "city", "family", "performance", "longtrip"], pick: (c) => ({ value: toDisplay(c?.dealer?.name), raw: c?.dealer?.name }) },
        { id: "dealerVerified", label: "Dealer verified", tags: ["all", "city", "family", "longtrip"], pick: (c) => ({ value: yesNo(c?.dealer?.verified), raw: c?.dealer?.verified }), rank: "booltrue" },
      ],
    },
  ];

  const allSpecs = useMemo(() => specGroups.flatMap((group) => group.specs), [specGroups]);

  const scoreMaps = useMemo(() => {
    const cars = fullComparedCars;
    const performanceMap = new Map();
    const comfortMap = new Map();
    const economyMap = new Map();
    const valueMap = new Map();

    cars.forEach((car) => {
      const perf = (
        normalizeScore(cars, (x) => x.horsepower, car.id, true) * 0.4 +
        normalizeScore(cars, (x) => x.torque, car.id, true) * 0.3 +
        normalizeScore(cars, (x) => x.engineCC, car.id, true) * 0.2 +
        (car.turbo ? 1 : 0) * 0.1
      );

      const comfort = (
        normalizeScore(cars, (x) => x.airbags ?? 0, car.id, true) * 0.35 +
        normalizeScore(cars, (x) => x.seats ?? 0, car.id, true) * 0.25 +
        normalizeScore(cars, (x) => x.features?.length ?? 0, car.id, true) * 0.2 +
        (car.sunroof ? 1 : 0) * 0.2
      );

      const economy = (
        normalizeScore(cars, (x) => x.mileage, car.id, false) * 0.45 +
        normalizeScore(cars, (x) => FUEL_ECO_SCORE[x.fuelType] ?? 1, car.id, true) * 0.25 +
        (car.dutyPaid ? 1 : 0) * 0.2 +
        normalizeScore(cars, (x) => x.price, car.id, false) * 0.1
      );

      const value = (
        normalizeScore(cars, (x) => x.price, car.id, false) * 0.5 +
        normalizeScore(cars, (x) => x.mileage, car.id, false) * 0.3 +
        normalizeScore(cars, (x) => x.year, car.id, true) * 0.2
      );

      performanceMap.set(car.id, perf);
      comfortMap.set(car.id, comfort);
      economyMap.set(car.id, economy);
      valueMap.set(car.id, value);
    });

    const overallMap = new Map();
    cars.forEach((car) => {
      const perf = performanceMap.get(car.id) || 0;
      const comfort = comfortMap.get(car.id) || 0;
      const economy = economyMap.get(car.id) || 0;
      const value = valueMap.get(car.id) || 0;

      const scoreByPreset = {
        all: value * 0.35 + economy * 0.25 + comfort * 0.2 + perf * 0.2,
        city: economy * 0.45 + value * 0.35 + comfort * 0.1 + perf * 0.1,
        family: comfort * 0.45 + value * 0.25 + economy * 0.2 + perf * 0.1,
        performance: perf * 0.6 + comfort * 0.15 + value * 0.15 + economy * 0.1,
        longtrip: economy * 0.4 + comfort * 0.25 + value * 0.2 + perf * 0.15,
      };

      overallMap.set(car.id, scoreByPreset[preset] ?? scoreByPreset.all);
    });

    return {
      performanceMap,
      comfortMap,
      economyMap,
      valueMap,
      overallMap,
    };
  }, [fullComparedCars, preset]);

  const rankedCars = useMemo(() => {
    return [...fullComparedCars]
      .map((car) => ({ car, score: scoreMaps.overallMap.get(car.id) || 0 }))
      .sort((a, b) => b.score - a.score);
  }, [fullComparedCars, scoreMaps.overallMap]);

  const overallWinner = rankedCars[0]?.car || null;
  const topTwo = rankedCars.slice(0, 2).map((entry) => entry.car);

  const winnerByPrice = useMemo(() => {
    const priced = fullComparedCars.filter((car) => typeof car.price === "number");
    if (priced.length === 0) return null;
    return [...priced].sort((a, b) => a.price - b.price)[0];
  }, [fullComparedCars]);

  function winnerFromMap(scoreMap) {
    const entries = [...scoreMap.entries()];
    if (entries.length === 0) return null;
    const winnerId = entries.sort((a, b) => b[1] - a[1])[0][0];
    return fullComparedCars.find((car) => car.id === winnerId) || null;
  }

  const winnerPerformance = winnerFromMap(scoreMaps.performanceMap);
  const winnerEconomy = winnerFromMap(scoreMaps.economyMap);
  const winnerComfort = winnerFromMap(scoreMaps.comfortMap);

  const winnerRail = [
    {
      title: "Best Price",
      car: winnerByPrice,
      sub: winnerByPrice?.price != null ? formatPrice(winnerByPrice.price) : "N/A",
    },
    {
      title: "Best Performance",
      car: winnerPerformance,
      sub: winnerPerformance ? `${Math.round((scoreMaps.performanceMap.get(winnerPerformance.id) || 0) * 100)} pts` : "N/A",
    },
    {
      title: "Best Economy",
      car: winnerEconomy,
      sub: winnerEconomy ? `${Math.round((scoreMaps.economyMap.get(winnerEconomy.id) || 0) * 100)} pts` : "N/A",
    },
    {
      title: "Best Comfort",
      car: winnerComfort,
      sub: winnerComfort ? `${Math.round((scoreMaps.comfortMap.get(winnerComfort.id) || 0) * 100)} pts` : "N/A",
    },
  ];

  function shouldShowSpec(spec) {
    return preset === "all" || spec.tags.includes(preset);
  }

  async function handleSaveComparison() {
    try {
      const url = window.location.href;
      await navigator.clipboard.writeText(url);

      const snapshot = {
        id: Date.now(),
        createdAt: new Date().toISOString(),
        ids: compareCars.slice(0, 3).map((car) => car.id),
        url,
      };

      const existing = JSON.parse(localStorage.getItem("motorke_compare_snapshots") || "[]");
      const next = [snapshot, ...existing].slice(0, 20);
      localStorage.setItem("motorke_compare_snapshots", JSON.stringify(next));

      setSaveState("copied");
      setTimeout(() => setSaveState("idle"), 1800);
    } catch (error) {
      console.error("Failed to save comparison:", error);
      setSaveState("failed");
      setTimeout(() => setSaveState("idle"), 1800);
    }
  }

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
    <div className="min-h-screen bg-[radial-gradient(circle_at_15%_12%,rgba(255,106,27,0.14),transparent_36%),radial-gradient(circle_at_85%_18%,rgba(56,189,248,0.08),transparent_34%),linear-gradient(180deg,#090d12_0%,#111821_100%)]">
    <div className="max-w-7xl mx-auto px-4 py-12 text-slate-100">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-8">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#ff7b29] mb-3">Dyno Console - Spec Heavy Mode</p>
          <h1 className="text-5xl font-black mb-4 tracking-tighter">Comparison Engine</h1>
          <p className="text-slate-300/80 max-w-2xl font-medium">Mechanical-grade side-by-side analysis. Compare up to 3 vehicles across pricing, powertrain, safety, comfort, and ownership factors.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap md:justify-end">
          {PRESETS.map((option) => (
            <button
              key={option.id}
              onClick={() => setPreset(option.id)}
              className={`px-4 h-10 rounded-xl text-[10px] font-black uppercase tracking-[0.14em] transition-all border ${
                preset === option.id
                  ? "bg-[#ff7b29] text-[#1f1207] border-[#ff7b29]"
                  : "bg-[#141c25] text-slate-300 border-[#2a3340] hover:text-white hover:border-[#ff7b29]/60"
              }`}
            >
              {option.label}
            </button>
          ))}

          <button
            onClick={() => setShowDiffOnly(!showDiffOnly)}
            className={`px-6 h-12 rounded-2xl flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all ${
              showDiffOnly ? "bg-[#ff7b29] text-[#1f1207] shadow-[0_0_26px_rgba(255,123,41,0.35)]" : "bg-[#141c25] border border-[#2a3340] text-slate-300 hover:text-white hover:border-[#ff7b29]/60"
            }`}
          >
            {showDiffOnly ? <Check className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
            Differences Only
          </button>
          <button
            onClick={clearCompare}
            className="px-6 h-12 rounded-2xl bg-[#141c25] border border-[#2a3340] text-slate-300 hover:text-white hover:border-slate-500 text-xs font-black uppercase tracking-widest transition-all"
          >
            Clear All
          </button>
        </div>
      </div>

      <div className="sticky top-[84px] z-40 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {winnerRail.map((item) => (
            <div key={item.title} className="border border-[#2a3340] bg-[#101822]/95 backdrop-blur-xl rounded-xl p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#ff9a54] mb-2">{item.title}</p>
              {item.car ? (
                <Link href={`/cars/${item.car.id}`} className="block group">
                  <p className="text-sm font-black text-slate-100 group-hover:text-white line-clamp-1">{item.car.year} {item.car.make} {item.car.model}</p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 mt-1">{item.sub}</p>
                </Link>
              ) : (
                <p className="text-xs font-bold text-slate-500">Add more cars to compute winner</p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="relative border border-[#2a3340] rounded-[2rem] overflow-hidden bg-[#0f151d]">
        {/* Table Header (Sticky) */}
        <div className="sticky top-0 z-30 bg-[#0f151d]/95 backdrop-blur-2xl border-b border-[#2a3340]">
          <div className="grid grid-cols-[160px_1fr_1fr_1fr] md:grid-cols-[240px_1fr_1fr_1fr]">
            <div className="p-8 flex items-center justify-center border-r border-[#25303d]">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 -rotate-90">Model View ⚖️</span>
            </div>
            {SLOT_KEYS.map((_, idx) => {
              const car = comparedSlots[idx];
              const hydrated = !!(car && initialCarsById.has(car.id));
              const imageUrl = car?.images?.[0]?.url || car?.image || null;
              return (
                <div key={idx} className={`p-6 md:p-8 flex flex-col gap-4 border-r border-[#25303d] last:border-r-0 relative transition-all ${!car ? "bg-[#0d131a]" : ""}`}>
                  {car ? (
                    <>
                      <button
                        onClick={() => removeFromCompare(car.id)}
                        className="absolute top-4 right-4 text-slate-500 hover:text-rose-400 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="relative aspect-[16/10] rounded-2xl overflow-hidden border border-[#2b3441] bg-[#131c27]">
                        {imageUrl ? (
                          <Image src={imageUrl} alt={car.model} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-600 font-bold uppercase tracking-widest text-[10px]">No Image</div>
                        )}
                      </div>
                      <div>
                         <p className="text-[10px] font-black uppercase tracking-widest text-[#ff7b29] mb-1">{car.year}</p>
                         <h3 className="font-black text-sm md:text-base leading-tight text-slate-100 mb-1 line-clamp-2">{car.make} {car.model}</h3>
                         <p className="text-slate-400 text-[10px] truncate">{car.variant || "Standard Variant"}</p>
                         <div className="mt-2 h-1.5 w-full bg-[#1f2a37] rounded-full overflow-hidden">
                           <div className="h-full bg-gradient-to-r from-[#ff7b29] to-[#ff9a54]" style={{ width: `${hydrated ? calcCoverage(car, allSpecs) : 0}%` }} />
                         </div>
                         <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-2">
                           Spec Coverage: {hydrated ? `${calcCoverage(car, allSpecs)}%` : "Loading"}
                         </p>
                      </div>
                    </>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center gap-4">
                       <button
                         onClick={() => setActiveSlot(idx)}
                         className="w-16 h-16 rounded-3xl bg-[#131c27] border border-dashed border-[#2a3340] flex items-center justify-center text-slate-500 hover:text-[#ff7b29] hover:border-[#ff7b29]/50 transition-all group"
                       >
                         <Search className="w-6 h-6 group-hover:scale-110 transition-transform" />
                       </button>
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Empty Slot</span>
                       
                       {activeSlot === idx && (
                         <div className="absolute inset-0 bg-[#0f151d] z-40 p-4 transition-all animate-in fade-in zoom-in-95">
                           <div className="relative">
                             <input
                               autoFocus
                               type="text"
                               placeholder="Search car..."
                               value={searchQuery}
                               onChange={(e) => setSearchQuery(e.target.value)}
                               className="w-full bg-[#141d28] border border-[#2a3340] rounded-2xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-[#ff7b29]/60 transition-all font-bold"
                             />
                             <button onClick={() => setActiveSlot(null)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-100">
                               <X className="w-4 h-4" />
                             </button>
                           </div>
                           <div className="mt-4 space-y-2 max-h-[300px] overflow-y-auto no-scrollbar">
                             {loadingSearch && (
                               <p className="text-center py-6 text-xs text-slate-400 font-bold">Searching inventory...</p>
                             )}
                             {searchResults.map((res) => (
                               <button
                                 key={res.id}
                                 onClick={() => onAddCarSearch(res)}
                                 className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-[#17202b] border border-transparent hover:border-[#2f3b4a] transition-all text-left"
                               >
                                 <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#1a2431] shrink-0 relative">
                                   {res.image && <Image src={res.image} alt={res.model} fill className="object-cover" />}
                                 </div>
                                 <div className="flex-1 min-w-0">
                                   <p className="text-xs font-black text-slate-100">{res.year} {res.make} {res.model}</p>
                                   <p className="text-[10px] text-[#ff9a54] font-bold">{formatPrice(res.price)}</p>
                                 </div>
                                 <ArrowRight className="w-4 h-4 text-slate-500" />
                               </button>
                             ))}
                             {!loadingSearch && searchQuery.length >= 2 && searchResults.length === 0 && (
                               <p className="text-center py-8 text-xs text-slate-500 font-bold">No units found matching "{searchQuery}"</p>
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
        <div className="divide-y divide-[#202a36]">
          {specGroups.map((group) => (
            <div key={group.name} className="bg-[#101822]">
              <div className="grid grid-cols-[160px_1fr] md:grid-cols-[240px_1fr] py-4 px-8 items-center bg-[#0f151d]">
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#ff7b29]">{group.name}</h2>
                <div className="h-px bg-[#293341]" />
              </div>
              <div className="divide-y divide-[#1a2430]">
                {group.specs.map((spec) => {
                  if (!shouldShowSpec(spec)) return null;

                  const diff = isDifferent(spec, fullComparedCars);
                  const severity = getDiffSeverity(spec, fullComparedCars);
                  if (showDiffOnly && !diff && fullComparedCars.length > 1) return null;

                  return (
                    <div key={spec.label} className={`grid grid-cols-[160px_1fr_1fr_1fr] md:grid-cols-[240px_1fr_1fr_1fr] transition-colors ${diff ? "bg-[#17202b]" : "hover:bg-[#141d28]"}`}>
                      <div className="p-6 md:p-8 flex items-center border-r border-[#25303d] bg-[#0f151d]">
                        <div className="space-y-2">
                          <span className="text-[11px] font-bold text-slate-300 uppercase tracking-widest block">{spec.label}</span>
                          {severity !== "none" && fullComparedCars.length > 1 && (
                            <span className={`inline-flex px-2 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-[0.12em] ${SEVERITY_STYLES[severity]}`}>
                              {severity}
                            </span>
                          )}
                        </div>
                      </div>
                      {SLOT_KEYS.map((_, idx) => {
                        const car = comparedSlots[idx];
                        if (!car) return <div key={idx} className="p-6 md:p-8 border-r border-[#25303d] last:border-r-0" />;
                        if (!initialCarsById.has(car.id)) {
                          return (
                            <div key={idx} className="p-6 md:p-8 flex items-center justify-center border-r border-[#25303d] last:border-r-0">
                              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Loading...</span>
                            </div>
                          );
                        }
                        
                        const { value, raw } = spec.pick(car);
                        const best = getBest(spec, fullComparedCars);
                        const isBestValue = best != null && raw === best;
                        const gaugePercent = getGaugePercent(spec, fullComparedCars, raw);
                        const missing = isMissing(raw);

                        return (
                          <div key={idx} className="p-6 md:p-8 flex items-center justify-center border-r border-[#25303d] last:border-r-0">
                            <div className="w-full text-center space-y-1.5">
                              {gaugePercent !== null && (
                                <div className="h-1.5 w-full bg-[#223041] rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${isBestValue ? "bg-emerald-400" : "bg-[#ff7b29]"}`}
                                    style={{ width: `${Math.max(8, gaugePercent)}%` }}
                                  />
                                </div>
                              )}

                              <span className={`text-[13px] font-black leading-relaxed text-center block ${
                                missing ? "text-slate-500" : isBestValue ? "text-emerald-300" : "text-slate-100"
                              }`}>
                                {value}
                                {missing && <span className="block text-[8px] mt-1 uppercase tracking-[0.12em]">Missing data</span>}
                                {isBestValue && !missing && <span className="block text-[8px] mt-1 uppercase tracking-[0.12em] text-emerald-400/80">Best Spec</span>}
                              </span>
                            </div>
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
      <div className="mt-12 flex flex-col items-center gap-6 p-12 bg-[#101822] border border-[#2a3340] rounded-[2rem] text-center">
        <p className="text-slate-300 text-sm font-medium">Move from comparison to action</p>

        <div className="flex flex-wrap justify-center gap-3">
          {overallWinner && (
            <Link href={`/cars/${overallWinner.id}`} className="px-6 h-12 rounded-2xl bg-[#ff7b29] text-[#1f1207] border border-[#ff7b29] hover:bg-[#ff9a54] transition-all flex items-center gap-2 font-black text-[11px] uppercase tracking-[0.14em]">
              Shortlist Winner <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}

          {topTwo.map((car, idx) => (
            <Link key={car.id} href={`/cars/${car.id}`} className="px-6 h-12 rounded-2xl bg-[#141c25] border border-[#2a3340] hover:border-[#ff7b29]/60 hover:bg-[#182231] transition-all flex items-center gap-2 group">
              <span className="text-[11px] font-black text-slate-300 group-hover:text-slate-100 uppercase tracking-widest">Enquire Top {idx + 1}</span>
              <ArrowRight className="w-3 h-3 text-[#ff7b29]" />
            </Link>
          ))}

          <button
            onClick={handleSaveComparison}
            className="px-6 h-12 rounded-2xl bg-[#141c25] border border-[#2a3340] hover:border-emerald-400/60 hover:bg-[#182231] transition-all flex items-center gap-2"
          >
            <span className="text-[11px] font-black text-slate-300 uppercase tracking-widest">
              {saveState === "copied" ? "Saved" : saveState === "failed" ? "Save Failed" : "Save Comparison"}
            </span>
          </button>
        </div>
      </div>
    </div>
    </div>
  );
}
