"use client";
// src/app/compare/CompareClient.js
import { Fragment, useEffect, useMemo, useState } from "react";
import { useCompare } from "@/components/CompareContext";
import {
  formatPrice, formatCarPrice,
  formatMileage,
  BODY_TYPE_LABELS,
  FUEL_LABELS,
  HYBRID_BATTERY_LABELS,
  TRANSMISSION_LABELS,
  STEERING_LABELS,
  DRIVETRAIN_LABELS,
} from "@/lib/utils";
import { computeComparisonInsights } from "@/lib/comparison";
import Link from "next/link";
import Image from "next/image";
import { Search, X, Check, ArrowRight, Minus, Download, ChevronDown, ChevronUp, Info } from "lucide-react";
import { buildCompareNarrative } from "@/lib/compare-narrative";
import { COMPARE_SETS_KEY, writeJsonCookie } from "@/lib/personalization";

const SLOT_KEYS = ["a", "b", "c"];
const PRESETS = [
  { id: "all", label: "Full Sheet" },
  { id: "city", label: "City" },
  { id: "family", label: "Family" },
  { id: "performance", label: "Performance" },
  { id: "longtrip", label: "Long Trip" },
];

const SEVERITY_STYLES = {
  minor: "text-zinc-700 border-zinc-300 bg-zinc-100",
  moderate: "text-zinc-800 border-zinc-400 bg-zinc-200",
  major: "text-black border-zinc-500 bg-zinc-300",
};

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
    body: "Download a PDF snapshot or copy a shareable link.",
  },
];

function TooltipLabel({ label, tip }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span>{label}</span>
      <span className="relative inline-flex group/tt">
        <button
          type="button"
          aria-label={`${label} info`}
          className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-600 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
        >
          <Info className="w-2.5 h-2.5" />
        </button>
        <span
          role="tooltip"
          className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-[calc(100%+6px)] z-30 w-48 p-2 text-[10px] font-semibold normal-case tracking-normal leading-relaxed text-slate-600 dark:text-slate-300 bg-white dark:bg-[#111111] border border-slate-200 dark:border-slate-700 shadow-lg opacity-0 group-hover/tt:opacity-100 group-focus-within/tt:opacity-100 transition-opacity"
          style={{ borderRadius: "8px" }}
        >
          {tip}
        </span>
      </span>
    </span>
  );
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

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

function carPhotoUrl(car) {
  if (!car) return null;
  const u = car?.images?.[0]?.url ?? car?.image;
  return u || null;
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

function isMostlyNA(spec, cars) {
  if (cars.length === 0) return true;
  const missingCount = cars.reduce((count, car) => {
    const raw = spec.pick(car).raw;
    return isMissing(raw) ? count + 1 : count;
  }, 0);
  return missingCount >= 2;
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

function formatKesCompact(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return "N/A";
  if (value >= 1000000) return `KSh ${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `KSh ${(value / 1000).toFixed(0)}K`;
  return `KSh ${Math.round(value)}`;
}

function estimateMonthlyLoan(price) {
  if (typeof price !== "number" || price < 500000) return null;
  // Assumes a standard bank auto loan: 20% Deposit, 80% Financed, 48 Months at 14% p.a.
  const principal = price * 0.8;
  const monthlyRate = 0.14 / 12;
  const months = 48;
  const pmt = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
  return Math.round(pmt);
}

function roadTone(score) {
  if (typeof score !== "number") return "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-500";
  if (score >= 80) return "border-[#111827] dark:border-white bg-[#111827] dark:bg-white text-white dark:text-black";
  if (score >= 65) return "border-slate-700 bg-slate-800 text-slate-100";
  if (score >= 50) return "border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200";
  return "border-slate-300 dark:border-slate-700 bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white";
}

function importTone(eligible) {
  if (eligible === true) return "border-[#111827] dark:border-white bg-[#111827] dark:bg-white text-white dark:text-black";
  if (eligible === false) return "border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200";
  return "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-500";
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
  const [setName, setSetName] = useState("");
  const [savedSets, setSavedSets] = useState([]);

  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [activeMobileSlot, setActiveMobileSlot] = useState(0);
  const [searchSlotError, setSearchSlotError] = useState("");
  const [freeAi, setFreeAi] = useState({ status: "idle", text: "", hint: "" });
  const [radarOpen, setRadarOpen] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches) {
      setRadarOpen(false);
    }
  }, []);

  useEffect(() => {
    if (!showTutorial) return;
    const key = TUTORIAL_STEPS[tutorialStep]?.key;
    if (!key || typeof window === "undefined") return;
    const el = document.querySelector(`[data-tour='${key}']`);
    if (el && typeof el.scrollIntoView === "function") {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [showTutorial, tutorialStep]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasSeen = localStorage.getItem("hasSeenCompareTour");
      if (!hasSeen) {
        setShowTutorial(true);
      }
    }
  }, []);

  const nextStep = () => {
    if (tutorialStep < TUTORIAL_STEPS.length - 1) {
      setTutorialStep(tutorialStep + 1);
    } else {
      closeTutorial();
    }
  };

  const startTutorial = () => {
    setTutorialStep(0);
    setShowTutorial(true);
  };

  const closeTutorial = () => {
    setShowTutorial(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("hasSeenCompareTour", "true");
    }
  };

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

  const insightsMap = useMemo(() => {
    return new Map(fullComparedCars.map((car) => [car.id, computeComparisonInsights(car)]));
  }, [fullComparedCars]);

  function getInsights(car) {
    if (!car) return null;
    return insightsMap.get(car.id) || computeComparisonInsights(car);
  }

  const specGroups = [
    {
      name: "Core",
      specs: [
        { id: "price", label: "Price", tags: ["all", "city", "family", "longtrip"], pick: (c) => ({ value: c?.price != null ? formatCarPrice(c) : "N/A", raw: c?.price }), rank: "min" },
        { id: "monthlyLoan", label: "Est. Loan (48m@14%)", tags: ["all", "city", "family", "performance"], pick: (c) => ({ value: c?.price != null ? formatPrice(estimateMonthlyLoan(c?.price)) : "N/A", raw: estimateMonthlyLoan(c?.price) }), rank: "min" },
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
      name: "Ownership",
      specs: [
        { id: "imported", label: "Imported", tags: ["all", "city", "longtrip"], pick: (c) => ({ value: yesNo(c?.imported), raw: c?.imported }) },
        { id: "importCountry", label: "Import country", tags: ["all", "city", "longtrip"], pick: (c) => ({ value: toDisplay(c?.importCountry), raw: c?.importCountry }) },
        { id: "dealer", label: "Dealer", tags: ["all", "city", "family", "performance", "longtrip"], pick: (c) => ({ value: toDisplay(c?.dealer?.name), raw: c?.dealer?.name }) },
        { id: "dealerVerified", label: "Dealer verified", tags: ["all", "city", "family", "longtrip"], pick: (c) => ({ value: yesNo(c?.dealer?.verified), raw: c?.dealer?.verified }), rank: "booltrue" },
      ],
    },
    {
      name: "Kenya Ops Intelligence",
      specs: [
        { id: "groundClearance", label: "Ground clearance", tags: ["all", "city", "longtrip", "family"], pick: (c) => ({ value: c?.groundClearanceMm ? `${c.groundClearanceMm} mm` : "N/A", raw: c?.groundClearanceMm }), rank: "max" },
        { id: "roadSuitability", label: "Road suitability", tags: ["all", "city", "longtrip", "family"], pick: (c) => ({ value: `${getInsights(c)?.roadSuitabilityScore ?? "N/A"}/100`, raw: getInsights(c)?.roadSuitabilityScore }), rank: "max" },
        { id: "spares", label: "Spare availability", tags: ["all", "city", "longtrip", "family"], pick: (c) => ({ value: `${getInsights(c)?.spareAvailabilityScore ?? "N/A"}/10`, raw: getInsights(c)?.spareAvailabilityScore }), rank: "max" },
        {
          id: "batteryTech",
          label: "Hybrid battery tech",
          tags: ["all", "city", "family"],
          pick: (c) => {
            if (c?.fuelType !== "HYBRID") return { value: "N/A", raw: null };
            return {
              value: HYBRID_BATTERY_LABELS[c?.hybridBatteryTech] || "N/A",
              raw: c?.hybridBatteryTech || null,
            };
          },
        },
        { id: "trafficFactor", label: "Traffic fuel factor", tags: ["all", "city", "longtrip"], pick: (c) => ({ value: `${((getInsights(c)?.tco?.trafficMultiplier ?? 1) * 100 - 100).toFixed(0)}%`, raw: getInsights(c)?.tco?.trafficMultiplier }), rank: "min" },
        { id: "annualFuel", label: "Annual energy cost", tags: ["all", "city", "longtrip"], pick: (c) => ({ value: formatPrice(getInsights(c)?.tco?.annualFuelCost || 0), raw: getInsights(c)?.tco?.annualFuelCost }), rank: "min" },
        { id: "annualInsurance", label: "Annual insurance", tags: ["all", "city", "family", "longtrip"], pick: (c) => ({ value: formatPrice(getInsights(c)?.tco?.annualInsurance || 0), raw: getInsights(c)?.tco?.annualInsurance }), rank: "min" },
        { id: "annualMaintenance", label: "Annual maintenance", tags: ["all", "city", "family", "longtrip"], pick: (c) => ({ value: formatPrice(getInsights(c)?.tco?.annualMaintenance || 0), raw: getInsights(c)?.tco?.annualMaintenance }), rank: "min" },
        { id: "annualTco", label: "Annual TCO", tags: ["all", "city", "family", "longtrip"], pick: (c) => ({ value: formatPrice(getInsights(c)?.tco?.annualTotal || 0), raw: getInsights(c)?.tco?.annualTotal }), rank: "min" },
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

    return {
      performanceMap,
      comfortMap,
      economyMap,
      valueMap,
      overallMap,
    };
  }, [fullComparedCars, insightsMap, preset]);

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
  const winnerRoad = useMemo(() => {
    const items = fullComparedCars
      .map((car) => ({ car, score: insightsMap.get(car.id)?.roadSuitabilityScore }))
      .filter((entry) => typeof entry.score === "number")
      .sort((a, b) => b.score - a.score);
    return items[0]?.car || null;
  }, [fullComparedCars, insightsMap]);

  const winnerLowestTco = useMemo(() => {
    const items = fullComparedCars
      .map((car) => ({ car, tco: insightsMap.get(car.id)?.tco?.annualTotal }))
      .filter((entry) => typeof entry.tco === "number")
      .sort((a, b) => a.tco - b.tco);
    return items[0]?.car || null;
  }, [fullComparedCars, insightsMap]);

  const tcoStats = useMemo(() => {
    const entries = fullComparedCars
      .map((car) => ({ carId: car.id, annualTco: insightsMap.get(car.id)?.tco?.annualTotal }))
      .filter((entry) => typeof entry.annualTco === "number");

    if (entries.length === 0) {
      return { min: null, max: null, savingsByCarId: new Map() };
    }

    const min = Math.min(...entries.map((entry) => entry.annualTco));
    const max = Math.max(...entries.map((entry) => entry.annualTco));
    const savingsByCarId = new Map(entries.map((entry) => [entry.carId, Math.max(0, max - entry.annualTco)]));

    return { min, max, savingsByCarId };
  }, [fullComparedCars, insightsMap]);

  const kenyaLensSummary = useMemo(() => {
    const count = fullComparedCars.length;
    if (count === 0) return null;

    const bestRoadScore = Math.max(...fullComparedCars.map((car) => getInsights(car)?.roadSuitabilityScore || 0));
    const spread =
      typeof tcoStats.max === "number" && typeof tcoStats.min === "number"
        ? Math.max(0, tcoStats.max - tcoStats.min)
        : 0;

    return {
      bestRoadScore,
      annualTcoSpread: spread,
    };
  }, [fullComparedCars, tcoStats]);

  const winnerRail = [
    {
      title: "Best Price",
      car: winnerByPrice,
      sub: winnerByPrice?.price != null ? formatCarPrice(winnerByPrice) : "N/A",
    },
    {
      title: "Best Performance",
      car: winnerPerformance,
      sub: winnerPerformance ? `${Math.round((scoreMaps.performanceMap.get(winnerPerformance.id) || 0) * 100)} pts` : "N/A",
    },
    {
      title: "Lowest Annual TCO",
      car: winnerLowestTco,
      sub: winnerLowestTco ? formatPrice(insightsMap.get(winnerLowestTco.id)?.tco?.annualTotal || 0) : "N/A",
    },
    {
      title: "Most Road Ready",
      car: winnerRoad,
      sub: winnerRoad ? `${insightsMap.get(winnerRoad.id)?.roadSuitabilityScore || 0}/100` : "N/A",
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

      const existing = JSON.parse(localStorage.getItem("welsh-motors_compare_snapshots") || "[]");
      const next = [snapshot, ...existing].slice(0, 20);
      localStorage.setItem("welsh-motors_compare_snapshots", JSON.stringify(next));

      setSaveState("copied");
      setTimeout(() => setSaveState("idle"), 1800);
    } catch (error) {
      console.error("Failed to save comparison:", error);
      setSaveState("failed");
      setTimeout(() => setSaveState("idle"), 1800);
    }
  }

  function persistCompareSets(nextSets) {
    if (typeof window === "undefined") return;
    localStorage.setItem(COMPARE_SETS_KEY, JSON.stringify(nextSets));
    writeJsonCookie(COMPARE_SETS_KEY, nextSets, 60 * 60 * 24 * 30);
  }

  function handleSaveNamedSet() {
    if (compareCars.length === 0) {
      setSaveState("failed");
      setTimeout(() => setSaveState("idle"), 1400);
      return;
    }
    const normalized = (setName || "").trim() || `Set ${new Date().toLocaleDateString("en-KE")}`;
    const item = {
      id: Date.now(),
      name: normalized.slice(0, 36),
      ids: compareCars.slice(0, 3).map((car) => car.id),
      createdAt: new Date().toISOString(),
    };
    const next = [item, ...savedSets.filter((set) => set.name !== item.name)].slice(0, 8);
    setSavedSets(next);
    persistCompareSets(next);
    setSetName("");
    setSaveState("saved");
    setTimeout(() => setSaveState("idle"), 1600);
  }

  function handleLoadSet(setItem) {
    if (!setItem?.ids?.length) return;
    clearCompare();
    setTimeout(() => {
      setItem.ids.forEach((id) => {
        const found = initialCarsById.get(id);
        if (found) addToCompare(found);
      });
    }, 0);
  }

  function handleDeleteSet(setId) {
    const next = savedSets.filter((set) => set.id !== setId);
    setSavedSets(next);
    persistCompareSets(next);
  }

  function handleDownloadPdf() {
    if (fullComparedCars.length === 0 || typeof window === "undefined") return;

    try {
      setPdfState("printing");

      const visibleGroups = specGroups
        .map((group) => {
          const rows = group.specs
            .filter((spec) => shouldShowSpec(spec))
            .filter((spec) => !isMostlyNA(spec, fullComparedCars))
            .filter((spec) => !(showDiffOnly && fullComparedCars.length > 1 && !isDifferent(spec, fullComparedCars)))
            .map((spec) => ({
              label: spec.label,
              values: fullComparedCars.map((car) => spec.pick(car).value),
            }));

          return { name: group.name, rows };
        })
        .filter((group) => group.rows.length > 0);

      const title = fullComparedCars
        .map((car) => `${car.year} ${car.make} ${car.model}`)
        .join(" vs ");

      const popup = window.open("", "_blank", "width=1200,height=900");
      if (!popup) {
        throw new Error("Popup blocked");
      }

      const printedAt = new Date().toLocaleString("en-KE");

      const rowsHtml = visibleGroups
        .map(
          (group) => `
            <tr class="group-row"><td colspan="${2 + fullComparedCars.length}">${escapeHtml(group.name)}</td></tr>
            ${group.rows
              .map(
                (row) => `
                  <tr>
                    <td class="label">${escapeHtml(row.label)}</td>
                    ${row.values.map((value) => `<td>${escapeHtml(value)}</td>`).join("")}
                  </tr>
                `
              )
              .join("")}
          `
        )
        .join("");

      const summaryRows = fullComparedCars
        .map((car) => {
          const insight = getInsights(car);
          const annualTco = insight?.tco?.annualTotal || 0;
          const road = insight?.roadSuitabilityScore ?? "N/A";
          return `
            <tr>
              <td class="car-name">${escapeHtml(`${car.year} ${car.make} ${car.model}`)}</td>
              <td>${escapeHtml(formatCarPrice(car))}</td>
              <td>${escapeHtml(formatPrice(annualTco))}</td>
              <td>${escapeHtml(String(road))}</td>
            </tr>
          `;
        })
        .join("");

      popup.document.write(`
        <!doctype html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Welsh Motors Comparison PDF</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                margin: 24px;
                color: #0f172a;
                background: #ffffff;
              }
              h1 { font-size: 20px; margin: 0 0 8px; }
              p.meta { margin: 0 0 18px; color: #334155; font-size: 12px; }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 22px;
                font-size: 12px;
              }
              th, td {
                border: 1px solid #cbd5e1;
                padding: 8px;
                text-align: left;
                vertical-align: top;
              }
              th {
                background: #e2e8f0;
                font-weight: 700;
              }
              tr.group-row td {
                background: #f1f5f9;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                color: #334155;
              }
              td.label {
                font-weight: 700;
                background: #f8fafc;
              }
              .car-name {
                font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
                font-weight: 700;
              }
              .section-title {
                font-size: 13px;
                margin: 20px 0 8px;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                color: #475569;
                font-weight: 700;
              }
              @page { size: A4; margin: 12mm; }
            </style>
          </head>
          <body>
            <h1>Welsh Motors Comparison Report</h1>
            <p class="meta">${escapeHtml(title)}<br/>Generated: ${escapeHtml(printedAt)} · Preset: ${escapeHtml(preset)}</p>

            <div class="section-title">Quick Summary</div>
            <table>
              <thead>
                <tr>
                  <th>Car</th>
                  <th>Price</th>
                  <th>Annual TCO</th>
                  <th>Road Score</th>
                </tr>
              </thead>
              <tbody>
                ${summaryRows}
              </tbody>
            </table>

            <div class="section-title">Detailed Comparison</div>
            <table>
              <thead>
                <tr>
                  <th style="width: 24%">Specification</th>
                  ${fullComparedCars
                    .map((car) => `<th class="car-name">${escapeHtml(`${car.year} ${car.make} ${car.model}`)}</th>`)
                    .join("")}
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
          </body>
        </html>
      `);

      popup.document.close();
      popup.focus();
      popup.print();

      setPdfState("done");
      setTimeout(() => setPdfState("idle"), 1800);
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      setPdfState("failed");
      setTimeout(() => setPdfState("idle"), 1800);
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const parsed = JSON.parse(localStorage.getItem(COMPARE_SETS_KEY) || "[]");
      if (Array.isArray(parsed)) setSavedSets(parsed.slice(0, 8));
    } catch {}
  }, []);

  const onAddCarSearch = (car) => {
    if (compareCars.find((c) => c.id === car.id)) {
      setSearchQuery("");
      setSearchResults([]);
      setActiveSlot(null);
      return;
    }

    if (isFull) {
      setSearchSlotError("All 3 compare slots are full. Remove a car from the header row, then add this one.");
      return;
    }

    addToCompare(car);
    setSearchSlotError("");
    setSearchQuery("");
    setSearchResults([]);
    setActiveSlot(null);
  };

  const mobileFilledSlots = [0, 1, 2].filter((idx) => comparedSlots[idx]);
  const mobileEmptySlots = [0, 1, 2].filter((idx) => !comparedSlots[idx]);
  const mobileCar = comparedSlots[activeMobileSlot] || null;
  const currentTutorial = TUTORIAL_STEPS[tutorialStep] || null;
  const currentTutorialKey = showTutorial ? currentTutorial?.key : null;
  const mobileQuickSpecs = [
    { id: "price", label: "Price", rank: "min", pick: (c) => ({ value: formatCarPrice(c), raw: c?.price }) },
    { id: "annualTco", label: "Annual TCO", rank: "min", pick: (c) => ({ value: formatPrice(getInsights(c)?.tco?.annualTotal || 0), raw: getInsights(c)?.tco?.annualTotal }) },
    { id: "road", label: "Road", rank: "max", pick: (c) => ({ value: `${getInsights(c)?.roadSuitabilityScore ?? "N/A"}/100`, raw: getInsights(c)?.roadSuitabilityScore }) },
    { id: "import", label: "Imported", rank: "booltrue", pick: (c) => ({ value: yesNo(c?.imported), raw: c?.imported }) },
  ];

  useEffect(() => {
    const filled = [0, 1, 2].filter((idx) => comparedSlots[idx]);
    if (filled.length === 0) return;
    if (!filled.includes(activeMobileSlot)) {
      setActiveMobileSlot(filled[0]);
    }
  }, [comparedSlots, activeMobileSlot]);

  const smartNarrative = useMemo(() => {
    if (fullComparedCars.length === 0) return null;
    const spread =
      typeof tcoStats.max === "number" && typeof tcoStats.min === "number"
        ? Math.max(0, tcoStats.max - tcoStats.min)
        : null;
    return buildCompareNarrative({
      preset,
      cars: fullComparedCars,
      insightsMap,
      overallCar: overallWinner,
      winnerByPrice,
      winnerLowestTco,
      winnerRoad,
      annualTcoSpread: spread,
    });
  }, [
    fullComparedCars,
    insightsMap,
    preset,
    overallWinner,
    winnerByPrice,
    winnerLowestTco,
    winnerRoad,
    tcoStats,
  ]);

  const insightPayload = useMemo(() => {
    if (fullComparedCars.length === 0) return null;
    return {
      preset,
      cars: fullComparedCars.map((car) => {
        const tco = insightsMap.get(car.id)?.tco?.annualTotal;
        const road = insightsMap.get(car.id)?.roadSuitabilityScore;
        return {
          label: `${car.year} ${car.make} ${car.model}`.slice(0, 180),
          priceText: formatCarPrice(car),
          annualTcoText: typeof tco === "number" ? formatPrice(tco) : "N/A",
          roadScore: typeof road === "number" ? String(road) : "N/A",
        };
      }),
      ruleBullets: smartNarrative?.bullets ?? [],
    };
  }, [fullComparedCars, insightsMap, preset, smartNarrative]);

  async function requestFreeAi() {
    if (!insightPayload) return;
    setFreeAi({ status: "loading", text: "", hint: "" });
    try {
      const res = await fetch("/api/compare/insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(insightPayload),
      });
      const data = await res.json();
      if (data.ok && data.text) {
        setFreeAi({
          status: "done",
          text: data.text,
          hint: data.provider ? `Assisted by ${data.provider}` : "",
        });
        return;
      }
      if (data.noKey) {
        setFreeAi({ status: "nokey", text: "", hint: data.hint || data.message || "" });
        return;
      }
      setFreeAi({
        status: "err",
        text: "",
        hint: data.message || data.error || "Could not generate a paragraph.",
      });
    } catch {
      setFreeAi({ status: "err", text: "", hint: "Network error — try again." });
    }
  }

  if (fullComparedCars.length < 2) {
    return (
      <>
        <div className="bg-white dark:bg-[#0a0a0a] min-h-screen pb-24">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-20 sm:pt-24 pb-10">
            <div className="max-w-4xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#718096] dark:text-slate-500 mb-4">
                Compare / Selection
              </p>
              <h1 className="text-3xl sm:text-5xl font-bold text-[#111827] dark:text-white tracking-tight leading-[1.1] mb-4">
                Select <span className="text-[#38A169]">2 or 3 cars</span> to compare
              </h1>
              <p className="text-sm sm:text-base text-[#718096] dark:text-slate-400 font-medium leading-relaxed max-w-2xl">
                Start by choosing vehicles first. The comparison engine appears only after selection and shows key parameters side by side.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
              {SLOT_KEYS.map((_, idx) => {
                const car = comparedSlots[idx];
                return (
                  <div
                    key={idx}
                    className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111111] p-4 sm:p-5"
                    style={{ borderRadius: "var(--radius)" }}
                  >
                    {car ? (
                      <div className="space-y-3">
                        <div className="relative h-36 w-full overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700" style={{ borderRadius: "var(--radius)" }}>
                          {carPhotoUrl(car) ? (
                            <Image src={carPhotoUrl(car)} alt={`${car.year} ${car.make} ${car.model}`} fill className="object-cover" />
                          ) : null}
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Slot {idx + 1}</p>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">{car.year} {car.make} {car.model}</h3>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{formatCarPrice(car)}</p>
                        <button
                          type="button"
                          onClick={() => removeFromCompare(car.id)}
                          className="h-10 px-4 text-[10px] font-bold uppercase tracking-widest border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                          style={{ borderRadius: "var(--radius)" }}
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center py-8 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setSearchSlotError("");
                            setActiveSlot(idx);
                          }}
                          className="w-12 h-12 flex items-center justify-center border border-dashed border-[#38A169]/70 text-[#2f855a]"
                          style={{ borderRadius: "var(--radius)" }}
                        >
                          <Search className="w-5 h-5" />
                        </button>
                        <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Empty slot</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={clearCompare}
                className="h-11 px-5 text-[10px] font-bold uppercase tracking-widest border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                style={{ borderRadius: "var(--radius)" }}
              >
                Clear selection
              </button>
              <p className="text-[11px] font-semibold text-slate-500">
                Selected: {fullComparedCars.length}/3
              </p>
            </div>
          </div>
        </div>
        {activeSlot !== null && (
          <div
            className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm no-print"
            onClick={(e) => {
              if (e.target !== e.currentTarget) return;
              setActiveSlot(null);
              setSearchSlotError("");
              setSearchQuery("");
              setSearchResults([]);
            }}
          >
            <div className="absolute inset-x-0 bottom-0 max-h-[82vh] bg-white dark:bg-[#0f0f0f] border-t border-slate-200 dark:border-slate-700 p-4" style={{ borderTopLeftRadius: "16px", borderTopRightRadius: "16px" }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Add a car to compare</p>
                <button
                  type="button"
                  onClick={() => {
                    setActiveSlot(null);
                    setSearchSlotError("");
                    setSearchQuery("");
                    setSearchResults([]);
                  }}
                  className="h-8 w-8 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300"
                  style={{ borderRadius: "999px" }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <input
                autoFocus
                type="text"
                placeholder="Search make, model, year..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchSlotError("");
                  setSearchQuery(e.target.value);
                }}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm font-semibold text-[#111827] dark:text-white outline-none focus:border-[#38A169]"
                style={{ borderRadius: "var(--radius)" }}
              />
              {searchSlotError && (
                <p className="mt-2 text-xs font-semibold text-red-600 dark:text-red-400">{searchSlotError}</p>
              )}
              <div className="mt-3 space-y-1.5 overflow-y-auto max-h-[56vh] pr-1">
                {searchResults.map((res) => (
                  <button
                    key={res.id}
                    type="button"
                    onClick={() => onAddCarSearch(res)}
                    className="w-full flex items-center gap-3 p-3 border border-slate-100 dark:border-slate-800 hover:border-[#38A169]/40 text-left"
                    style={{ borderRadius: "var(--radius)" }}
                  >
                    <div className="relative w-12 h-12 bg-slate-100 dark:bg-slate-800 overflow-hidden border border-black dark:border-white shrink-0" style={{ borderRadius: "var(--radius)" }}>
                      {res.image ? <Image src={res.image} alt={res.model} fill className="object-cover" /> : null}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#111827] dark:text-white truncate">{res.year} {res.make} {res.model}</p>
                      <p className="text-[10px] font-bold text-[#718096] dark:text-slate-500 uppercase tracking-widest">{formatCarPrice(res)}</p>
                    </div>
                  </button>
                ))}
                {loadingSearch && (
                  <div className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Loading results...</div>
                )}
                {!loadingSearch && searchQuery.length >= 2 && searchResults.length === 0 && (
                  <div className="p-4 text-[11px] font-semibold text-slate-500 dark:text-slate-400 text-center">No matches yet. Try another make or model.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
    <div className="bg-white dark:bg-[#0a0a0a] min-h-screen pb-24 lg:pb-0">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-20 sm:pt-24 pb-6 sm:pb-10 min-w-0">
        <div className="xl:grid xl:grid-cols-12 xl:gap-8 xl:items-start">
          <div className="min-w-0 xl:col-span-8 2xl:col-span-9">
            <div className="flex flex-col gap-5 sm:gap-6 lg:gap-8">
        {/* 1: Title + sticky controls */}
        <div
          data-tour="filters"
          className={`order-1 no-print ${currentTutorialKey === "filters" ? "ring-2 ring-[#38A169] ring-offset-2 ring-offset-white dark:ring-offset-[#0a0a0a]" : ""}`}
          style={currentTutorialKey === "filters" ? { borderRadius: "var(--radius)" } : undefined}
        >
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#718096] dark:text-slate-500 mb-4 sm:mb-5">
              <span>Compare</span>
              <span>/</span>
              <span className="text-[#111827] dark:text-white">Vehicles</span>
            </div>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-[#111827] dark:text-white tracking-tight leading-[1.1] mb-3 sm:mb-4">
              <span className="text-[#38A169]">Side-by-side</span> comparison
            </h1>
            <p className="text-sm sm:text-base text-[#718096] dark:text-slate-400 font-medium leading-relaxed max-w-2xl">
              Kenya TCO, road fitness, and specs in one place. Use the lens to focus the rows, or hide identical lines with Differences.
            </p>
          </div>

          {fullComparedCars.length > 0 && (
            <div className="mt-5 sm:mt-7 w-full" aria-label="Vehicles in this comparison">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2.5">In this comparison</p>
              <div className="flex flex-wrap items-center gap-0 sm:gap-1 pl-0.5">
                {fullComparedCars.map((car) => {
                  const src = carPhotoUrl(car);
                  return (
                    <Link
                      key={car.id}
                      href={`/cars/${car.id}`}
                      className="relative -ml-2 first:ml-0 h-14 w-[5.5rem] sm:h-16 sm:w-28 shrink-0 overflow-hidden rounded border-2 border-white dark:border-[#0a0a0a] shadow-md ring-1 ring-slate-200/80 dark:ring-slate-700/60 transition-transform hover:z-10 hover:scale-[1.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38A169] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0a0a0a]"
                      style={{ borderRadius: "var(--radius)" }}
                    >
                      {src ? (
                        <Image
                          src={src}
                          alt={`${car.year} ${car.make} ${car.model}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 88px, 112px"
                        />
                      ) : (
                        <div
                          className="absolute inset-0 flex items-center justify-center bg-slate-200 dark:bg-slate-800 text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-500 p-1 text-center leading-tight"
                          aria-hidden
                        >
                          {car.make?.slice(0, 3) || "—"}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          <div className="sticky top-0 z-40 mt-5 -mx-4 px-4 sm:-mx-6 sm:px-6 py-2.5 bg-white/90 dark:bg-[#0a0a0a]/90 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800/90 shadow-sm sm:mt-6 lg:static lg:mx-0 lg:px-0 lg:py-0 lg:bg-transparent lg:backdrop-blur-none lg:border-0 lg:shadow-none">
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2 lg:hidden">View &amp; filter</p>
            <div className="flex flex-nowrap items-center gap-2 overflow-x-auto no-scrollbar pb-0.5 -mb-0.5">
            {PRESETS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setPreset(option.id)}
                className={`shrink-0 px-4 h-10 sm:h-11 text-[10px] font-bold uppercase tracking-widest transition-all border ${
                  preset === option.id
                    ? "bg-[#111827] text-white border-[#111827] dark:bg-white dark:!text-black dark:border-white shadow-sm"
                    : "bg-white dark:bg-[#111111] text-[#718096] dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-[#111827] dark:hover:border-white"
                }`}
                style={{ borderRadius: "var(--radius)" }}
              >
                {option.label}
              </button>
            ))}
            <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 shrink-0 self-center" aria-hidden />
            <button
              type="button"
              onClick={() => setShowDiffOnly(!showDiffOnly)}
              className={`shrink-0 px-4 h-10 sm:h-11 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all border ${
                showDiffOnly ? "bg-[#38A169] text-white border-[#38A169]" : "bg-white dark:bg-[#111111] text-[#718096] border-slate-200 dark:border-slate-800"
              }`}
              style={{ borderRadius: "var(--radius)" }}
              title="Hide rows where all cars have the same value"
            >
              {showDiffOnly ? <Check className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
              Diffs
            </button>
            <button
              type="button"
              onClick={clearCompare}
              className="shrink-0 px-4 h-10 sm:h-11 bg-white dark:bg-[#111111] border border-slate-200 dark:border-slate-800 text-[#718096] dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest"
              style={{ borderRadius: "var(--radius)" }}
            >
              Clear all
            </button>
            {mobileEmptySlots.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSearchSlotError("");
                  setActiveSlot(mobileEmptySlots[0]);
                }}
                className="lg:hidden shrink-0 px-4 h-10 sm:h-11 bg-[#38A169] dark:!bg-[#38A169] text-white dark:!text-white border border-[#38A169] dark:!border-[#38A169] text-[10px] font-bold uppercase tracking-widest"
                style={{ borderRadius: "var(--radius)" }}
              >
                Add car
              </button>
            )}
            <button
              type="button"
              onClick={startTutorial}
              className="shrink-0 px-4 h-10 sm:h-11 bg-white dark:bg-[#111111] border border-slate-200 dark:border-slate-800 text-[#111827] dark:text-slate-200 text-[10px] font-bold uppercase tracking-widest"
              style={{ borderRadius: "var(--radius)" }}
            >
              Tour
            </button>
            <button
              type="button"
              onClick={handleSaveNamedSet}
              className="shrink-0 px-4 h-10 sm:h-11 bg-[#111827] dark:bg-white text-white dark:!text-black border border-[#111827] dark:border-white text-[10px] font-bold uppercase tracking-widest"
              style={{ borderRadius: "var(--radius)" }}
            >
              {saveState === "saved" ? "Set Saved" : "Save Set"}
            </button>
            </div>
            <div className="mt-2 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  value={setName}
                  onChange={(e) => setSetName(e.target.value)}
                  placeholder="Set name (optional)"
                  className="h-9 flex-1 min-w-[180px] bg-white dark:bg-[#111111] border border-slate-200 dark:border-slate-800 px-3 text-[11px] font-semibold text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  style={{ borderRadius: "var(--radius)" }}
                />
                {savedSets.length > 0 && (
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    Saved sets
                  </p>
                )}
              </div>
              {savedSets.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {savedSets.map((setItem) => (
                    <div
                      key={setItem.id}
                      className="inline-flex items-center gap-1 bg-white dark:bg-[#111111] border border-slate-200 dark:border-slate-800 px-2 py-1.5"
                      style={{ borderRadius: "var(--radius)" }}
                    >
                      <button
                        type="button"
                        onClick={() => handleLoadSet(setItem)}
                        className="text-[10px] font-bold uppercase tracking-widest text-slate-700 dark:text-slate-200"
                      >
                        {setItem.name}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSet(setItem.id)}
                        className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                        aria-label={`Delete ${setItem.name}`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Global Summary Stats — order 3 on mobile, 2 on large screens */}
        {kenyaLensSummary && (
          <div
            id="compare-summary"
            data-tour="summary"
            className={`order-3 lg:order-2 scroll-mt-24 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 ${currentTutorialKey === "summary" ? "ring-2 ring-[#38A169] ring-offset-2 ring-offset-white dark:ring-offset-[#0a0a0a] p-1" : ""}`}
            style={currentTutorialKey === "summary" ? { borderRadius: "var(--radius)" } : undefined}
          >
            {[
              {
                label: "Annual TCO Gap",
                tip: "Difference between the highest and lowest yearly ownership cost in this set.",
                value: `${formatKesCompact(kenyaLensSummary.annualTcoSpread)}/yr`,
                sub: "Set Variance",
              },
              {
                label: "Top Road Score",
                tip: "Highest road-readiness score among the compared vehicles.",
                value: `${kenyaLensSummary.bestRoadScore}/100`,
                sub: "Highest Readiness",
              },
              {
                label: "Cars Compared",
                tip: "Total number of vehicles currently loaded in this comparison set.",
                value: `${fullComparedCars.length} Assets`,
                sub: "Current Set",
              }
            ].map((stat, i) => (
              <div key={i} className="bg-[#F7FAFC] dark:bg-[#111111] border border-slate-100 dark:border-slate-800 p-5 sm:p-6 shadow-sm" style={{ borderRadius: 'var(--radius)' }}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#718096] dark:text-slate-500 mb-2">
                  <TooltipLabel label={stat.label} tip={stat.tip} />
                </p>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <p className="text-xl sm:text-2xl font-bold text-[#111827] dark:text-white tabular-nums">{stat.value}</p>
                  <p className="text-[9px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-wide">{stat.sub}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Radar — order 4 on mobile, 3 on large; collapsible on small screens */}
        {fullComparedCars.length >= 2 && (
          <div id="compare-radar" className="order-4 lg:order-3 scroll-mt-24 mb-0">
            <button
              type="button"
              onClick={() => setRadarOpen((o) => !o)}
              className="lg:hidden w-full flex items-center justify-between gap-3 py-3 px-4 text-left text-[10px] font-bold uppercase tracking-widest text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 mb-3"
              style={{ borderRadius: "var(--radius)" }}
            >
              <span>Performance chart</span>
              {radarOpen ? <ChevronUp className="w-4 h-4 shrink-0" /> : <ChevronDown className="w-4 h-4 shrink-0" />}
            </button>
            <div className={`${radarOpen ? "block" : "hidden"} lg:block`}>
          <div className="mb-6 sm:mb-8 bg-[#111827] dark:bg-[#111111] p-6 sm:p-10 lg:p-12 overflow-hidden shadow-xl" style={{ borderRadius: 'var(--radius)' }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div>
                <h2 className="text-[10px] font-bold text-white uppercase tracking-[0.2em] mb-3">Performance mix</h2>
                <p className="text-sm sm:text-base text-white/60 font-medium leading-relaxed mb-6">
                  Relative balance of comfort, economy, and value in this set — same scoring as the table below.
                </p>
                <div className="space-y-3">
                   {fullComparedCars.map((car, ci) => {
                      const p = carPhotoUrl(car);
                      return (
                      <Link
                        key={car.id}
                        href={`/cars/${car.id}`}
                        className="flex items-center gap-2.5 sm:gap-3 group min-w-0"
                      >
                         <div className="relative h-9 w-12 sm:h-10 sm:w-14 shrink-0 overflow-hidden rounded border border-white/20 bg-white/5">
                            {p ? (
                              <Image
                                src={p}
                                alt={`${car.year} ${car.make} ${car.model}`}
                                fill
                                className="object-cover"
                                sizes="56px"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center text-[8px] font-bold uppercase text-white/40" aria-hidden>
                                {ci + 1}
                              </div>
                            )}
                         </div>
                         <div className="w-5 sm:w-6 h-0.5 shrink-0" style={{ background: ci === 0 ? "#38A169" : ci === 1 ? "#FFFFFF" : "#718096" }} />
                         <span className="text-xs font-sans font-semibold text-white/90 group-hover:text-[#38A169] transition-colors truncate min-w-0">
                            {car.year} {car.make} {car.model}
                         </span>
                      </Link>
                      );
                   })}
                </div>
              </div>
              
              <div className="flex justify-center scale-[0.85] sm:scale-95 lg:scale-100 -mx-2">
                {(() => {
                  const DIMS = ["Performance", "Comfort", "Economy", "Value"];
                  const getDimScore = (car) => [
                    Math.round((scoreMaps.performanceMap.get(car.id) || 0) * 100),
                    Math.round((scoreMaps.comfortMap.get(car.id) || 0) * 100),
                    Math.round((scoreMaps.economyMap.get(car.id) || 0) * 100),
                    Math.round((scoreMaps.valueMap.get(car.id) || 0) * 100),
                  ];
                  const COLORS = ["#38A169", "#FFFFFF", "#718096"];
                  const N = DIMS.length;
                  const R = 120;
                  const CX = 160, CY = 160;
                  const toXY = (i, val) => {
                    const angle = (Math.PI * 2 * i) / N - Math.PI / 2;
                    const r = (val / 100) * R;
                    return [CX + r * Math.cos(angle), CY + r * Math.sin(angle)];
                  };
                  const rings = [25, 50, 75, 100];

                  return (
                    <svg width={320} height={320} viewBox="0 0 320 320" className="overflow-visible max-w-full">
                      {rings.map(r => (
                        <polygon key={r} points={DIMS.map((_, i) => toXY(i, r).join(",")).join(" ")} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                      ))}
                      {DIMS.map((_, i) => {
                        const [x, y] = toXY(i, 100);
                        return <line key={i} x1={CX} y1={CY} x2={x} y2={y} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />;
                      })}
                      {DIMS.map((dim, i) => {
                        const [x, y] = toXY(i, 118);
                        return (
                          <text key={dim} x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="fill-white/40 text-[9px] font-bold uppercase tracking-widest">{dim}</text>
                        );
                      })}
                      {fullComparedCars.map((car, ci) => {
                        const scores = getDimScore(car);
                        const pts = scores.map((s, i) => toXY(i, s).join(",")).join(" ");
                        return <polygon key={car.id} points={pts} fill={COLORS[ci % COLORS.length]} fillOpacity={0.08} stroke={COLORS[ci % COLORS.length]} strokeWidth={2} strokeLinejoin="round" />;
                      })}
                    </svg>
                  );
                })()}
              </div>
            </div>
          </div>
            </div>
          </div>
        )}

        {/* Winner Rail */}
        <div id="compare-winners" className="order-5 lg:order-4 scroll-mt-24 mb-8 sm:mb-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {winnerRail.map((item) => {
            const wThumb = item.car ? carPhotoUrl(item.car) : null;
            return (
            <div key={item.title} className="p-5 sm:p-6 border border-slate-100 dark:border-slate-800" style={{ borderRadius: 'var(--radius)' }}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#A0AEC0] dark:text-slate-600 mb-4">{item.title}</p>
              {item.car ? (
                <Link href={`/cars/${item.car.id}`} className="group flex gap-3.5 min-w-0">
                  {wThumb ? (
                    <div className="relative h-[4.5rem] w-[5.5rem] sm:h-20 sm:w-24 shrink-0 overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900" style={{ borderRadius: "var(--radius)" }}>
                      <Image
                        src={wThumb}
                        alt={`${item.car.year} ${item.car.make} ${item.car.model}`}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                        sizes="96px"
                      />
                    </div>
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-bold font-sans text-[#111827] dark:text-white mb-1 group-hover:text-[#38A169] transition-colors leading-snug">{item.car.year} {item.car.make}</h3>
                    <p className="text-[10px] font-bold text-[#718096] dark:text-slate-500 uppercase tracking-widest">{item.sub}</p>
                  </div>
                </Link>
              ) : (
                <p className="text-sm font-medium text-slate-300 dark:text-slate-700">Insufficient Data</p>
              )}
            </div>
            );
          })}
        </div>

        {smartNarrative?.headline && (
          <div id="compare-decision" className="order-6 lg:order-5 scroll-mt-24 mb-8 sm:mb-10 p-5 sm:p-7 border border-[#38A169]/25 bg-[#38A169]/[0.07] dark:bg-[#0f172a] dark:border-[#38A169]/30" style={{ borderRadius: "var(--radius)" }}>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#2f855a] dark:text-[#4ade80] mb-2">Decision helper</p>
            <h3 className="text-lg sm:text-xl font-bold text-[#111827] dark:text-white mb-4">{smartNarrative.headline}</h3>
            <ul className="space-y-2.5 list-disc pl-4 text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
              {smartNarrative.bullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
            {smartNarrative.disclaimer && (
              <p className="mt-4 text-[11px] text-slate-500 dark:text-slate-500 leading-relaxed border-t border-slate-200/80 dark:border-slate-700/80 pt-3">
                {smartNarrative.disclaimer}
              </p>
            )}

            <div className="mt-6 border-t border-slate-200/80 dark:border-slate-700/80 pt-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-500 mb-3">
                Plain-English readout
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mb-3 leading-relaxed">
                The points above are generated from the numbers in this comparison. You can also ask for a short
                narrative paragraph that restates the same facts in everyday language. Availability depends on how the
                site is configured—if it is not available, the comparison table and bullets are still the full result.
              </p>
              <button
                type="button"
                onClick={requestFreeAi}
                disabled={!insightPayload || freeAi.status === "loading"}
                className="inline-flex items-center justify-center px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-[#111827] dark:text-white hover:border-[#38A169] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                style={{ borderRadius: "var(--radius)" }}
              >
                {freeAi.status === "loading" ? "Working…" : "Get narrative summary"}
              </button>
              {freeAi.status === "done" && freeAi.text && (
                <div className="mt-4 p-4 bg-white/80 dark:bg-black/20 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                  {freeAi.text}
                  {freeAi.hint && (
                    <p className="mt-2 text-[10px] font-semibold text-slate-500">{freeAi.hint}</p>
                  )}
                </div>
              )}
              {freeAi.status === "nokey" && freeAi.hint && (
                <p className="mt-3 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">{freeAi.hint}</p>
              )}
              {freeAi.status === "err" && freeAi.hint && (
                <p className="mt-3 text-[11px] text-amber-800 dark:text-amber-200 leading-relaxed max-w-2xl">{freeAi.hint}</p>
              )}
            </div>
          </div>
        )}

        {/* Spec matrix: mobile first in flow (order-2), desktop after insights (lg:order-6) */}
        <div
          id="compare-specs"
          data-tour="specs"
          className={`order-2 lg:order-6 scroll-mt-24 relative border border-slate-100 dark:border-slate-800 overflow-hidden bg-white dark:bg-[#0a0a0a] mb-8 sm:mb-10 lg:mb-12 shadow-2xl ${currentTutorialKey === "specs" ? "ring-2 ring-[#38A169] ring-offset-2 ring-offset-white dark:ring-offset-[#0a0a0a]" : ""}`}
          style={{ borderRadius: "var(--radius)" }}
        >
        {fullComparedCars.length > 0 && (
        <div className="lg:hidden no-print p-4 sm:p-5 space-y-4 border-b border-slate-100 dark:border-slate-800">
          <div className="sticky top-[52px] z-30 -mx-4 px-4 py-2 bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur border-b border-slate-100 dark:border-slate-800 sm:static sm:bg-transparent sm:backdrop-blur-none sm:border-0 sm:p-0 sm:mx-0">
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-0.5 px-0.5 no-scrollbar">
            {mobileFilledSlots.map((idx) => {
              const c = comparedSlots[idx];
              if (!c) return null;
              const label = `${c.make} ${c.model}`.trim();
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveMobileSlot(idx)}
                  className={`shrink-0 px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest border transition-colors shadow-sm ${
                    activeMobileSlot === idx
                      ? "bg-[#111827] text-white border-[#111827] dark:bg-white dark:!text-black dark:border-white"
                      : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                  }`}
                  style={{ borderRadius: "var(--radius)" }}
                >
                  {label.length > 24 ? `${label.slice(0, 22)}…` : label}
                </button>
              );
            })}
            {mobileEmptySlots.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSearchSlotError("");
                  setActiveSlot(mobileEmptySlots[0]);
                }}
                className="shrink-0 px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest border border-dashed border-[#38A169]/70 text-[#2f855a] dark:text-[#4ade80] bg-[#38A169]/5 dark:bg-[#38A169]/10"
                style={{ borderRadius: "var(--radius)" }}
              >
                + Add car
              </button>
            )}
          </div>
        </div>
          {mobileCar ? (
            <>
              <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                Tap tabs to switch the full sheet. Quick side-by-side is below.
              </p>
              {fullComparedCars.length >= 2 && (
                <div className="border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/40 p-3" style={{ borderRadius: "var(--radius)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2.5">At a glance</p>
                  <div className="overflow-x-auto no-scrollbar">
                    <div className="min-w-[560px]">
                      <div className="grid grid-cols-[132px_repeat(3,minmax(136px,1fr))] border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0f0f0f]" style={{ borderRadius: "10px" }}>
                        <div className="p-2.5 border-r border-slate-200 dark:border-slate-700" />
                        {SLOT_KEYS.map((_, idx) => {
                          const c = comparedSlots[idx];
                          return (
                            <div key={idx} className={`p-2.5 border-r border-slate-200 dark:border-slate-700 last:border-r-0 ${idx === activeMobileSlot ? "bg-[#111827]/5 dark:bg-white/10" : ""}`}>
                              {c ? (
                                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-700 dark:text-slate-200 truncate">
                                  {c.make} {c.model}
                                </p>
                              ) : (
                                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-600">—</p>
                              )}
                            </div>
                          );
                        })}
                        {mobileQuickSpecs.map((spec) => {
                          if (isMostlyNA(spec, fullComparedCars)) return null;
                          const best = getBest(spec, fullComparedCars);
                          return (
                            <Fragment key={spec.id}>
                              <div className="p-2.5 border-t border-r border-slate-200 dark:border-slate-700 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                {spec.label}
                              </div>
                              {SLOT_KEYS.map((_, idx) => {
                                const c = comparedSlots[idx];
                                if (!c) {
                                  return <div key={`${spec.id}-${idx}`} className="p-2.5 border-t border-r border-slate-200 dark:border-slate-700 last:border-r-0 text-[11px] text-slate-400 dark:text-slate-600">—</div>;
                                }
                                const { value, raw } = spec.pick(c);
                                const isBest = best != null && raw === best;
                                return (
                                  <div key={`${spec.id}-${idx}`} className={`p-2.5 border-t border-r border-slate-200 dark:border-slate-700 last:border-r-0 text-[11px] font-bold tabular-nums ${isBest ? "text-[#111827] dark:text-white" : "text-slate-600 dark:text-slate-300"}`}>
                                    {value}
                                  </div>
                                );
                              })}
                            </Fragment>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div className="space-y-6">
                {specGroups.map((group) => (
                  <div key={group.name} className="space-y-0">
                    <h4 className="text-[10px] font-bold text-[#111827] dark:text-white uppercase tracking-[0.2em] border-b border-slate-300 dark:border-slate-700 pb-2 mb-1">
                      {group.name}
                    </h4>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {group.specs.map((spec) => {
                        if (!shouldShowSpec(spec)) return null;
                        if (isMostlyNA(spec, fullComparedCars)) return null;
                        const diff = isDifferent(spec, fullComparedCars);
                        if (showDiffOnly && !diff && fullComparedCars.length > 1) return null;
                        const { value } = spec.pick(mobileCar);
                        return (
                          <div
                            key={spec.id}
                            className={`flex items-start justify-between gap-3 py-3.5 ${
                              diff ? "bg-[#38A169]/8 -mx-2 px-2 rounded-sm border-l-2 border-[#38A169]" : ""
                            }`}
                          >
                            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider min-w-0 max-w-[48%] leading-snug">
                              {spec.label}
                            </span>
                            <span className="text-[13px] font-bold text-right text-slate-900 dark:text-slate-100 tabular-nums break-words max-w-[52%]">
                              {value}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </div>
        )}
        {fullComparedCars.length === 0 && (
          <div className="lg:hidden no-print p-5 border-b border-slate-100 dark:border-slate-800">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              Add up to 3 cars to start comparing.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchSlotError("");
                setActiveSlot(0);
              }}
              className="h-11 px-4 bg-[#111827] dark:!bg-[#38A169] text-white dark:!text-white border border-[#111827] dark:!border-[#38A169] text-[10px] font-bold uppercase tracking-widest"
              style={{ borderRadius: "var(--radius)" }}
            >
              Add first car
            </button>
          </div>
        )}

        <div className="hidden lg:block overflow-x-auto no-scrollbar">
          <div className="min-w-[900px] sm:min-w-[1100px]">
             {/* Header Row */}
             <div className="sticky top-0 z-40 bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800">
                <div className="grid grid-cols-[180px_1fr_1fr_1fr] sm:grid-cols-[300px_1fr_1fr_1fr]">
                   <div className="p-6 sm:p-10 border-r border-slate-100 dark:border-slate-800 flex items-end justify-center bg-white dark:bg-[#0a0a0a] sticky left-0 z-50">
                      <span className="text-[10px] font-bold text-[#A0AEC0] dark:text-slate-600 uppercase tracking-[0.2em]">Specifications</span>
                   </div>
                   {SLOT_KEYS.map((_, idx) => {
                      const car = comparedSlots[idx];
                      const hydrated = !!(car && initialCarsById.has(car.id));
                      return (
                        <div key={idx} className="p-6 sm:p-10 border-r border-slate-100 dark:border-slate-800 last:border-r-0">
                           {car ? (
                              <div className="relative group">
                                <button onClick={() => removeFromCompare(car.id)} className="absolute -top-4 -right-4 w-8 h-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-all hover:border-[#111827] dark:hover:border-white z-10">
                                   <X className="w-3.5 h-3.5 dark:text-white" />
                                </button>
                                <div className="aspect-[16/9] bg-slate-50 dark:bg-slate-900 overflow-hidden mb-6 border border-black dark:border-white" style={{ borderRadius: 'var(--radius)' }}>
                                   {(car?.images?.[0]?.url || car?.image) ? <Image src={car?.images?.[0]?.url || car?.image} alt={car.model} fill className="object-cover" /> : null}
                                </div>
                                <p className="text-[10px] font-bold text-[#A0AEC0] dark:text-slate-600 uppercase tracking-widest mb-1">{car.year}</p>
                                <h3 className="text-base sm:text-xl font-bold font-sans text-[#111827] dark:text-white leading-snug line-clamp-2">{car.make} {car.model}</h3>
                                {hydrated && (
                                   <div className="mt-4 flex flex-wrap gap-2">
                                      <span className="px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[8px] font-bold text-[#718096] dark:text-slate-400 uppercase tracking-widest" style={{ borderRadius: '4px' }}>ROAD {getInsights(car)?.roadSuitabilityScore}</span>
                                      <span className={`px-2 py-1 text-[8px] font-bold uppercase tracking-widest border ${importTone(car?.imported)}`} style={{ borderRadius: '4px' }}>
                                        {car?.imported ? "IMPORTED" : "LOCAL"}
                                      </span>
                                   </div>
                                )}
                              </div>
                           ) : (
                              <div className="relative group flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-100 dark:border-slate-800 transition-colors hover:border-[#38A169]/40" style={{ borderRadius: 'var(--radius)' }}>
                                 <button onClick={() => { setSearchSlotError(""); setActiveSlot(idx); }} className="w-14 h-14 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm" style={{ borderRadius: 'var(--radius)' }}>
                                    <Search className="w-5 h-5 text-[#A0AEC0] dark:text-slate-600" />
                                 </button>
                                 <p className="mt-6 text-[10px] font-bold text-[#A0AEC0] dark:text-slate-600 uppercase tracking-widest">Awaiting Data</p>
                                 
                                 {activeSlot === idx && (
                                    <div className="absolute inset-0 bg-white dark:bg-[#111111] z-50 p-6 shadow-2xl animate-in fade-in slide-in-from-top-2" style={{ borderRadius: 'var(--radius)' }}>
                                       <input autoFocus type="text" placeholder="Search parameters..." value={searchQuery} onChange={(e) => { setSearchSlotError(""); setSearchQuery(e.target.value); }}
                                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 px-5 py-4 text-sm font-bold text-[#111827] dark:text-white outline-none focus:border-[#38A169]" style={{ borderRadius: 'var(--radius)' }} />
                                       {searchSlotError && (
                                          <p className="mt-3 text-xs font-semibold text-red-600 dark:text-red-400 leading-relaxed">{searchSlotError}</p>
                                       )}
                                       <div className="mt-6 space-y-2 max-h-[300px] overflow-y-auto no-scrollbar">
                                          {searchResults.map(res => (
                                             <button key={res.id} onClick={() => onAddCarSearch(res)} className="w-full flex items-center gap-4 p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900">
                                                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 overflow-hidden relative border border-black dark:border-white" style={{ borderRadius: 'var(--radius)' }}>
                                                   {res.image && <Image src={res.image} alt={res.model} fill className="object-cover" />}
                                                </div>
                                                <div className="flex-1 text-left">
                                                   <p className="text-xs font-bold font-sans text-[#111827] dark:text-white">{res.year} {res.make} {res.model}</p>
                                                   <p className="text-[10px] font-bold text-[#718096] dark:text-slate-500 uppercase">{formatCarPrice(res)}</p>
                                                </div>
                                             </button>
                                          ))}
                                          {loadingSearch && <div className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Loading Data...</div>}
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

             {/* Matrix Rows */}
             <div className="divide-y divide-slate-50 dark:divide-slate-900 border-t border-slate-100 dark:border-slate-800">
                {specGroups.map(group => (
                   <div key={group.name} className="border-b border-slate-100 dark:border-slate-800 last:border-b-0">
                      <div className="grid grid-cols-[180px_1fr] sm:grid-cols-[300px_1fr] px-8 sm:px-12 py-6 sm:py-8 bg-slate-50 dark:bg-slate-900/50 items-center sticky left-0">
                         <h4 className="text-[10px] font-bold text-[#111827] dark:text-white uppercase tracking-[0.25em]">{group.name} System</h4>
                         <div className="h-px bg-slate-100 dark:bg-slate-800 ml-8" />
                      </div>
                      <div className="divide-y divide-slate-50 dark:divide-slate-900">
                         {group.specs.map(spec => {
                            if (!shouldShowSpec(spec)) return null;
                            if (isMostlyNA(spec, fullComparedCars)) return null;
                            const diff = isDifferent(spec, fullComparedCars);
                            if (showDiffOnly && !diff && fullComparedCars.length > 1) return null;

                            return (
                               <div key={spec.label} className={`grid grid-cols-[180px_1fr_1fr_1fr] sm:grid-cols-[300px_1fr_1fr_1fr] transition-colors ${diff ? 'bg-[#38A169]/5' : 'hover:bg-slate-50 dark:hover:bg-slate-900'}`}>
                                  <div className="p-6 sm:p-8 border-r border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-[#0a0a0a] sticky left-0 z-30">
                                     <span className="text-[10px] sm:text-[11px] font-bold text-[#718096] dark:text-slate-500 uppercase tracking-widest">{spec.label}</span>
                                     {diff && <span className="w-1 h-1 bg-[#38A169] rounded-full" />}
                                  </div>
                                  {SLOT_KEYS.map((_, idx) => {
                                     const car = comparedSlots[idx];
                                     if (!car) return <div key={idx} className="p-6 sm:p-8 border-r border-slate-100 dark:border-slate-800 last:border-r-0" />;
                                     const { value, raw } = spec.pick(car);
                                     const best = getBest(spec, fullComparedCars);
                                     const isBest = best != null && raw === best;
                                     return (
                                        <div key={idx} className="p-6 sm:p-8 border-r border-slate-100 dark:border-slate-800 last:border-r-0 text-right font-bold tabular-nums min-w-0">
                                           <span className={`text-xs sm:text-sm inline-block text-right ${isBest ? 'text-[#111827] dark:text-white' : 'text-[#718096] dark:text-slate-500'}`}>{value}</span>
                                           {isBest && <div className="mt-1 sm:mt-2 text-[8px] font-bold text-[#38A169] uppercase tracking-widest text-right">Optimized</div>}
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
        </div>
        </div>

        {/* Action Center — order-7; pb-24 on page clears fixed mobile bar */}
        <div
          id="compare-export"
          data-tour="export"
          className={`order-7 no-print scroll-mt-24 ${currentTutorialKey === "export" ? "ring-2 ring-[#38A169] ring-offset-2 ring-offset-white dark:ring-offset-[#0a0a0a] p-1" : ""}`}
          style={currentTutorialKey === "export" ? { borderRadius: "var(--radius)" } : undefined}
        >
        <p className="lg:hidden text-center text-[11px] text-slate-500 dark:text-slate-500 py-1 mb-2">
          PDF and share: use the bar at the bottom of the screen.
        </p>
        <div className="max-lg:hidden pt-10 sm:pt-12 lg:pt-16 border-t border-slate-100 dark:border-slate-800">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
              <div>
                 <h3 className="text-2xl font-bold text-[#111827] dark:text-white mb-4">Export</h3>
                 <p className="text-sm font-medium text-[#718096] dark:text-slate-400 leading-relaxed">
                    Download a PDF of this comparison or copy a link to return later.
                 </p>
              </div>
              <div className="flex flex-wrap gap-4 md:justify-end">
                 <button onClick={handleDownloadPdf} className="h-14 px-8 bg-[#111827] dark:bg-white text-white dark:!text-black text-xs font-bold uppercase tracking-widest transition-transform hover:scale-[0.98]" style={{ borderRadius: 'var(--radius)' }}>
                    Download Technical PDF
                 </button>
                 <button onClick={handleSaveComparison} className="h-14 px-8 bg-white dark:bg-[#111111] border border-slate-200 dark:border-slate-800 text-[#111827] dark:text-white text-xs font-bold uppercase tracking-widest hover:border-[#111827] dark:hover:border-white transition-all shadow-sm" style={{ borderRadius: 'var(--radius)' }}>
                    {saveState === "copied" ? "URL Copied" : "Share Comparison"}
                 </button>
              </div>
           </div>
        </div>
        </div>
            </div>
          </div>
          <aside className="hidden xl:block min-w-0 xl:col-span-4 2xl:col-span-3 sticky top-24 self-start">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-3">On this page</p>
            <nav aria-label="Compare sections" className="text-sm space-y-0.5 border border-slate-200 dark:border-slate-800 bg-[#F7FAFC] dark:bg-[#111111] p-4" style={{ borderRadius: "var(--radius)" }}>
              <button
                type="button"
                onClick={startTutorial}
                className="w-full text-left py-1.5 mb-1 text-[#111827] dark:text-slate-100 hover:text-[#38A169] font-semibold border-b border-slate-200 dark:border-slate-800"
              >
                Start tutorial
              </button>
              {[
                ["Summary", "#compare-summary"],
                ["Performance", "#compare-radar"],
                ["Highlights", "#compare-winners"],
                ["Decision", "#compare-decision"],
                ["Specifications", "#compare-specs"],
                ["Export", "#compare-export"],
              ].map(([label, href]) => (
                <a
                  key={href}
                  href={href}
                  className="block py-1.5 text-slate-600 dark:text-slate-400 hover:text-[#38A169] font-medium"
                >
                  {label}
                </a>
              ))}
            </nav>
          </aside>
        </div>
      </div>
    </div>
    {showTutorial && currentTutorial && (
      <div className="fixed inset-x-0 bottom-20 lg:bottom-6 z-[60] px-4 no-print">
        <div className="max-w-md mx-auto border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111111] shadow-2xl p-4 sm:p-5" style={{ borderRadius: "var(--radius)" }}>
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-2">
            Compare tutorial {tutorialStep + 1}/{TUTORIAL_STEPS.length}
          </p>
          <h4 className="text-base font-bold text-[#111827] dark:text-white mb-1.5">{currentTutorial.title}</h4>
          <p className="text-[12px] text-slate-600 dark:text-slate-300 leading-relaxed mb-4">{currentTutorial.body}</p>
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={closeTutorial}
              className="h-10 px-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold uppercase tracking-widest"
              style={{ borderRadius: "var(--radius)" }}
            >
              Skip
            </button>
            <div className="flex items-center gap-2">
              {tutorialStep > 0 && (
                <button
                  type="button"
                  onClick={() => setTutorialStep((s) => Math.max(0, s - 1))}
                  className="h-10 px-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold uppercase tracking-widest"
                  style={{ borderRadius: "var(--radius)" }}
                >
                  Back
                </button>
              )}
              <button
                type="button"
                onClick={nextStep}
                className="h-10 px-3 bg-[#111827] dark:bg-white text-white dark:!text-black text-[10px] font-bold uppercase tracking-widest"
                style={{ borderRadius: "var(--radius)" }}
              >
                {tutorialStep < TUTORIAL_STEPS.length - 1 ? "Next" : "Done"}
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    {activeSlot !== null && (
      <div
        className="lg:hidden fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm no-print"
        onClick={(e) => {
          if (e.target !== e.currentTarget) return;
          setActiveSlot(null);
          setSearchSlotError("");
          setSearchQuery("");
          setSearchResults([]);
        }}
      >
        <div className="absolute inset-x-0 bottom-0 max-h-[82vh] bg-white dark:bg-[#0f0f0f] border-t border-slate-200 dark:border-slate-700 p-4" style={{ borderTopLeftRadius: "16px", borderTopRightRadius: "16px" }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Add a car to compare</p>
            <button
              type="button"
              onClick={() => {
                setActiveSlot(null);
                setSearchSlotError("");
                setSearchQuery("");
                setSearchResults([]);
              }}
              className="h-8 w-8 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300"
              style={{ borderRadius: "999px" }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <input
            autoFocus
            type="text"
            placeholder="Search make, model, year..."
            value={searchQuery}
            onChange={(e) => {
              setSearchSlotError("");
              setSearchQuery(e.target.value);
            }}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm font-semibold text-[#111827] dark:text-white outline-none focus:border-[#38A169]"
            style={{ borderRadius: "var(--radius)" }}
          />
          {searchSlotError && (
            <p className="mt-2 text-xs font-semibold text-red-600 dark:text-red-400">{searchSlotError}</p>
          )}
          <div className="mt-3 space-y-1.5 overflow-y-auto max-h-[56vh] pr-1">
            {searchResults.map((res) => (
              <button
                key={res.id}
                type="button"
                onClick={() => onAddCarSearch(res)}
                className="w-full flex items-center gap-3 p-3 border border-slate-100 dark:border-slate-800 hover:border-[#38A169]/40 text-left"
                style={{ borderRadius: "var(--radius)" }}
              >
                <div className="relative w-12 h-12 bg-slate-100 dark:bg-slate-800 overflow-hidden border border-black dark:border-white shrink-0" style={{ borderRadius: "var(--radius)" }}>
                  {res.image ? <Image src={res.image} alt={res.model} fill className="object-cover" /> : null}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#111827] dark:text-white truncate">{res.year} {res.make} {res.model}</p>
                  <p className="text-[10px] font-bold text-[#718096] dark:text-slate-500 uppercase tracking-widest">{formatCarPrice(res)}</p>
                </div>
              </button>
            ))}
            {loadingSearch && (
              <div className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Loading results...</div>
            )}
            {!loadingSearch && searchQuery.length >= 2 && searchResults.length === 0 && (
              <div className="p-4 text-[11px] font-semibold text-slate-500 dark:text-slate-400 text-center">No matches yet. Try another make or model.</div>
            )}
          </div>
        </div>
      </div>
    )}
    <div
      className="lg:hidden no-print fixed bottom-0 inset-x-0 z-50 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur-md px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex gap-2 justify-center"
      aria-label="Export comparison"
    >
      <button
        type="button"
        onClick={handleDownloadPdf}
        className="flex-1 h-12 max-w-[200px] bg-[#111827] dark:bg-white text-white dark:!text-black text-[10px] font-bold uppercase tracking-widest"
        style={{ borderRadius: "var(--radius)" }}
      >
        PDF
      </button>
      <button
        type="button"
        onClick={handleSaveComparison}
        className="flex-1 h-12 max-w-[200px] bg-white dark:bg-[#111111] border border-slate-200 dark:border-slate-800 text-[#111827] dark:text-white text-[10px] font-bold uppercase tracking-widest"
        style={{ borderRadius: "var(--radius)" }}
      >
        {saveState === "copied" ? "Copied" : "Share"}
      </button>
    </div>
    </>
  );
}
