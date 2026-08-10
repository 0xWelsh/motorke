"use client";
// src/app/compare/CompareClient.js
import { Fragment, useEffect, useMemo, useState, useCallback } from "react";
import { useCompare } from "@/components/CompareContext";
import { formatPrice, formatCarPrice } from "@/lib/utils";
import { computeComparisonInsights } from "@/lib/comparison";
import { Search, X, Download, ChevronDown, Info } from "lucide-react";
import { buildCompareNarrative } from "@/lib/compare-narrative";
import { COMPARE_SETS_KEY, writeJsonCookie } from "@/lib/personalization";

import { SLOT_KEYS, PRESETS, getSpecGroups } from "@/components/compare/compare-config";
import { isMissing, shouldShowSpec, formatKesCompact } from "@/components/compare/compare-utils";

import CompareSpecsMatrix from "@/components/compare/CompareSpecsMatrix";
import CompareTcoSummary from "@/components/compare/CompareTcoSummary";
import CompareRadarChart from "@/components/compare/CompareRadarChart";
import CompareTcoBarChart from "@/components/compare/CompareTcoBarChart";
import CompareCostOverTimeChart from "@/components/compare/CompareCostOverTimeChart";
import ComparePriceValueChart from "@/components/compare/ComparePriceValueChart";
import CompareNarrative from "@/components/compare/CompareNarrative";
import CompareSearchModal from "@/components/compare/CompareSearchModal";

const TUTORIAL_STEPS = [
  {
    key: "filters",
    title: "Choose your lens",
    body: "Use Full Sheet or presets, then toggle Diffs to hide identical rows.",
  },
  {
    key: "summary",
    title: "Read the headline metrics",
    body: "These cards show set-level impact: annual TCO spread, best road score, and import count.",
  },
  {
    key: "specs",
    title: "Inspect the specs matrix",
    body: "Scroll through grouped specs and compare values side by side.",
  },
  {
    key: "export",
    title: "Save or share",
    body: "Download a print-ready report file to your device or copy a shareable link.",
  },
];

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

export default function CompareClient({ initialCars }) {
  const { compareCars, addToCompare, removeFromCompare, clearCompare, isFull, isInitialized } = useCompare();
  const [showDiffOnly, setShowDiffOnly] = useState(false);
  const [preset, setPreset] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [activeSlot, setActiveSlot] = useState(null);
  const [didInitialSync, setDidInitialSync] = useState(false);
  const [saveState, setSaveState] = useState("idle");
  const [pdfState, setPdfState] = useState("idle");
  const [pdfHint, setPdfHint] = useState("");
  
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [activeMobileSlot, setActiveMobileSlot] = useState(0);
  const [searchSlotError, setSearchSlotError] = useState("");
  const [freeAi, setFreeAi] = useState({ status: "idle", text: "", hint: "" });
  const [pickReasons, setPickReasons] = useState({ status: "idle", byCarId: {}, hint: "" });

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

  const comparedCarIdsKey = useMemo(() => fullComparedCars.map((c) => c.id).join("|"), [fullComparedCars]);

  useEffect(() => {
    setPickReasons({ status: "idle", byCarId: {}, hint: "" });
    setFreeAi({ status: "idle", text: "", hint: "" });
  }, [comparedCarIdsKey]);

  const insightsMap = useMemo(() => {
    return new Map(fullComparedCars.map((car) => [car.id, computeComparisonInsights(car)]));
  }, [fullComparedCars]);

  const getInsights = useCallback((car) => {
    if (!car) return null;
    return insightsMap.get(car.id) || computeComparisonInsights(car);
  }, [insightsMap]);

  const specGroups = useMemo(() => getSpecGroups(getInsights), [getInsights]);

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
        normalizeScore(cars, (x) => insightsMap.get(x.id)?.tco?.annualTotal, car.id, false) * 0.52 +
        normalizeScore(cars, (x) => insightsMap.get(x.id)?.spareAvailabilityScore, car.id, true) * 0.14 +
        normalizeScore(cars, (x) => insightsMap.get(x.id)?.roadSuitabilityScore, car.id, true) * 0.34
      );

      const value = (
        normalizeScore(cars, (x) => x.price, car.id, false) * 0.35 +
        normalizeScore(cars, (x) => insightsMap.get(x.id)?.tco?.annualTotal, car.id, false) * 0.4 +
        normalizeScore(cars, (x) => x.mileage, car.id, false) * 0.1 +
        normalizeScore(cars, (x) => x.year, car.id, true) * 0.15
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

    return { performanceMap, comfortMap, economyMap, valueMap, overallMap };
  }, [fullComparedCars, insightsMap, preset]);

  const rankedCars = useMemo(() => {
    return [...fullComparedCars]
      .map((car) => ({ car, score: scoreMaps.overallMap.get(car.id) || 0 }))
      .sort((a, b) => b.score - a.score);
  }, [fullComparedCars, scoreMaps.overallMap]);

  const overallWinner = rankedCars[0]?.car || null;

  const winnerByPrice = useMemo(() => {
    const priced = fullComparedCars.filter((car) => typeof car.price === "number");
    if (priced.length === 0) return null;
    return [...priced].sort((a, b) => a.price - b.price)[0];
  }, [fullComparedCars]);

  const kenyaLensSummary = useMemo(() => {
    const entries = fullComparedCars
      .map((car) => ({ carId: car.id, annualTco: insightsMap.get(car.id)?.tco?.annualTotal }))
      .filter((entry) => typeof entry.annualTco === "number");

    if (entries.length === 0) return null;

    const tcoValues = entries.map(e => e.annualTco);
    const minTco = Math.min(...tcoValues);
    const maxTco = Math.max(...tcoValues);

    const roadScores = fullComparedCars
      .map((car) => insightsMap.get(car.id)?.roadSuitabilityScore)
      .filter((s) => typeof s === "number");
    const bestRoadScore = roadScores.length > 0 ? Math.max(...roadScores) : "N/A";

    return {
      annualTcoSpread: Math.max(0, maxTco - minTco),
      bestRoadScore
    };
  }, [fullComparedCars, insightsMap]);

  // Sync initial cars if they are not in local storage yet
  useEffect(() => {
    if (!isInitialized || didInitialSync) return;
    initialCars.forEach((c) => {
      const alreadyIn = compareCars.find((x) => x?.id === c.id);
      if (!alreadyIn) addToCompare(c);
    });
    setDidInitialSync(true);
  }, [isInitialized, didInitialSync, initialCars, compareCars, addToCompare]);

  // Search logic
  useEffect(() => {
    let active = true;
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoadingSearch(true);
      try {
        const res = await fetch(`/api/cars/search?q=${encodeURIComponent(searchQuery)}&take=5`);
        const data = await res.json();
        if (active) setSearchResults(data.cars || []);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        if (active) setLoadingSearch(false);
      }
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const onAddCarSearch = (car) => {
    const success = addToCompare(car, activeSlot);
    if (success) {
      setActiveSlot(null);
      setSearchQuery("");
      setSearchResults([]);
    } else {
      setSearchSlotError("You already have this car in comparison.");
    }
  };

  const requestFreeAi = async () => {
    if (fullComparedCars.length < 2) return;
    setFreeAi({ status: "loading", text: "", hint: "" });
    try {
      const res = await fetch("/api/compare/insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preset, cars: fullComparedCars }),
      });
      const data = await res.json();
      if (data.ok) {
        setFreeAi({ status: "done", text: data.paragraph, hint: data.hint });
      } else {
        setFreeAi({ status: "nokey", text: "", hint: data.message || "Narrative unavailable." });
      }
    } catch (err) {
      setFreeAi({ status: "err", text: "", hint: "Network error. Try again." });
    }
  };

  const pickReasonsPayload = useMemo(() => {
    if (fullComparedCars.length < 2) return null;
    return fullComparedCars.map((c) => ({
      id: c.id,
      year: c.year,
      make: c.make,
      model: c.model,
      price: c.price,
      tco: getInsights(c)?.tco?.annualTotal,
      road: getInsights(c)?.roadSuitabilityScore,
      spares: getInsights(c)?.spareAvailabilityScore,
    }));
  }, [fullComparedCars, getInsights]);

  const requestPickReasons = async () => {
    if (!pickReasonsPayload) return;
    setPickReasons({ status: "loading", byCarId: {}, hint: "" });
    try {
      const res = await fetch("/api/compare/pick-reasons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cars: pickReasonsPayload }),
      });
      const data = await res.json();
      if (data.ok) {
        setPickReasons({ status: "done", byCarId: data.reasons || {}, hint: data.hint });
      } else {
        setPickReasons({ status: "nokey", byCarId: {}, hint: data.message });
      }
    } catch (err) {
      setPickReasons({ status: "err", byCarId: {}, hint: "Error loading pick reasons." });
    }
  };

  const handleSaveComparison = () => {
    const ids = fullComparedCars.map(c => c.id).join(',');
    const url = `${window.location.origin}/compare?ids=${ids}`;
    navigator.clipboard.writeText(url);
    setSaveState("copied");
    setTimeout(() => setSaveState("idle"), 2000);
  };

  const handleDownloadPdf = async () => {
    setPdfState("loading");
    setPdfHint("Generating report...");
    try {
      // Logic for PDF download would go here
      setPdfState("done");
      setTimeout(() => setPdfState("idle"), 2000);
    } catch (err) {
      setPdfState("idle");
      setPdfHint("Failed to generate report.");
    }
  };

  const startTutorial = () => { setTutorialStep(0); setShowTutorial(true); };
  const closeTutorial = () => { setShowTutorial(false); };
  const nextStep = () => {
    if (tutorialStep < TUTORIAL_STEPS.length - 1) setTutorialStep(s => s + 1);
    else closeTutorial();
  };
  const currentTutorial = TUTORIAL_STEPS[tutorialStep];
  const currentTutorialKey = showTutorial ? currentTutorial.key : null;

  if (!isInitialized) return <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center"><p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 animate-pulse">Initializing engine…</p></div>;

  return (
    <div className="min-h-screen bg-[var(--bg)] pb-24 lg:pb-12 selection:bg-[var(--accent)]/30">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 lg:pt-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 lg:mb-12">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">Compare <span className="text-[var(--accent)]">Hub</span></h1>
            <p className="text-sm sm:text-base font-medium text-slate-500">Deep technical analysis for the Kenyan market.</p>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={clearCompare} className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-red-500 transition-colors">Clear Set</button>
             <button onClick={startTutorial} className="btn btn-neutral btn-sm">Tutorial</button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-10">
          <div className="xl:col-span-8 2xl:col-span-9 space-y-8 lg:space-y-10">
            
            {/* Filters Row */}
            <div data-tour="filters" className={`flex flex-wrap items-center justify-between gap-4 p-2 bg-white border border-slate-200 rounded-xl shadow-sm ${currentTutorialKey === "filters" ? "ring-2 ring-[var(--accent)]" : ""}`}>
               <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar p-1">
                  {PRESETS.map((p) => (
                    <button key={p.id} onClick={() => setPreset(p.id)} className={`shrink-0 px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all rounded-lg ${preset === p.id ? "bg-[var(--accent)] text-black" : "bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300"}`}>{p.label}</button>
                  ))}
               </div>
               <div className="flex items-center gap-4 px-3">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" checked={showDiffOnly} onChange={(e) => setShowDiffOnly(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-[var(--accent)] focus:ring-[var(--accent)]" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 group-hover:text-slate-900">Diffs Only</span>
                  </label>
               </div>
            </div>

            <div className="flex flex-col gap-8 lg:gap-10">
              <CompareTcoSummary kenyaLensSummary={kenyaLensSummary} fullComparedCars={fullComparedCars} currentTutorialKey={currentTutorialKey} />
              <CompareRadarChart fullComparedCars={fullComparedCars} scoreMaps={scoreMaps} initialCarsById={initialCarsById} />
              <CompareTcoBarChart fullComparedCars={fullComparedCars} initialCarsById={initialCarsById} getInsights={getInsights} />
              <CompareCostOverTimeChart fullComparedCars={fullComparedCars} initialCarsById={initialCarsById} getInsights={getInsights} />
              {fullComparedCars.length >= 2 && (
                <ComparePriceValueChart fullComparedCars={fullComparedCars} initialCarsById={initialCarsById} scoreMaps={scoreMaps} />
              )}
              <CompareNarrative 
                freeAi={freeAi} requestFreeAi={requestFreeAi} 
                pickReasons={pickReasons} requestPickReasons={requestPickReasons} 
                fullComparedCars={fullComparedCars} pickReasonsPayload={pickReasonsPayload} 
                initialCarsById={initialCarsById} 
              />
              
              <CompareSpecsMatrix
                fullComparedCars={fullComparedCars}
                comparedSlots={comparedSlots}
                getInsights={getInsights}
                specGroups={specGroups}
                shouldShowSpec={(spec) => shouldShowSpec(spec, preset)}
                removeFromCompare={removeFromCompare}
                setActiveSlot={setActiveSlot}
                setSearchQuery={setSearchQuery}
                setSearchSlotError={setSearchSlotError}
                showDiffOnly={showDiffOnly}
                overallWinner={overallWinner}
                activeMobileSlot={activeMobileSlot}
                setActiveMobileSlot={setActiveMobileSlot}
              />

              {/* Action Center - Desktop */}
              <div id="compare-export" className="max-lg:hidden pt-12 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-slate-900">Export Analysis</h3>
                    <p className="text-sm text-slate-500 font-medium">Save this comparison for offline viewing or share with others.</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button onClick={handleSaveComparison} className="btn btn-neutral btn-lg">{saveState === "copied" ? "URL Copied" : "Copy Link"}</button>
                    <button onClick={handleDownloadPdf} disabled={pdfState === "loading"} className="btn btn-primary btn-lg">{pdfState === "loading" ? "Preparing..." : "Download PDF"}</button>
                  </div>
                </div>
              </div>

            </div>
          </div>
          
          <aside className="hidden xl:block xl:col-span-4 2xl:col-span-3 sticky top-24 self-start">
             <nav className="space-y-1 bg-white border border-slate-200 p-4 rounded-xl">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4 px-2">Navigation</p>
                {[
                  ["Summary", "#compare-summary"],
                  ["Performance", "#compare-radar"],
                  ["The Verdict", "#compare-decision"],
                  ["Specifications", "#compare-specs"],
                ].map(([label, href]) => (
                  <a key={href} href={href} className="block px-3 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 hover:text-[var(--accent)] transition-all rounded-lg">{label}</a>
                ))}
             </nav>
          </aside>
        </div>
      </div>

      <CompareSearchModal 
        activeSlot={activeSlot} setActiveSlot={setActiveSlot}
        searchQuery={searchQuery} setSearchQuery={setSearchQuery}
        searchSlotError={searchSlotError} setSearchSlotError={setSearchSlotError}
        searchResults={searchResults} loadingSearch={loadingSearch}
        onAddCarSearch={onAddCarSearch}
      />

      {/* Mobile Action Bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur-md px-4 py-3 flex gap-2">
        <button onClick={handleSaveComparison} className="flex-1 btn btn-neutral">{saveState === "copied" ? "Copied" : "Share"}</button>
        <button onClick={handleDownloadPdf} className="flex-1 btn btn-primary">PDF</button>
      </div>

      {/* Tutorial Overlay */}
      {showTutorial && currentTutorial && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
           <div className="max-w-md w-full bg-white border border-slate-200 p-6 shadow-2xl space-y-6 rounded-2xl">
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent)]">Step {tutorialStep + 1} of {TUTORIAL_STEPS.length}</p>
                <h4 className="text-xl font-bold text-slate-900">{currentTutorial.title}</h4>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">{currentTutorial.body}</p>
              </div>
              <div className="flex items-center justify-between pt-4">
                <button onClick={closeTutorial} className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Skip</button>
                <button onClick={nextStep} className="btn btn-primary">{tutorialStep < TUTORIAL_STEPS.length - 1 ? "Next" : "Finish"}</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
