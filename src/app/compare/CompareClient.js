"use client";
// src/app/compare/CompareClient.js
import { useEffect, useMemo, useState } from "react";
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
import { Search, X, Check, ArrowRight, Minus, Download } from "lucide-react";
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
  minor: "text-zinc-700 border-zinc-300 bg-zinc-100",
  moderate: "text-zinc-800 border-zinc-400 bg-zinc-200",
  major: "text-black border-zinc-500 bg-zinc-300",
};

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
  const router = useRouter();
  const [showDiffOnly, setShowDiffOnly] = useState(false);
  const [preset, setPreset] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [activeSlot, setActiveSlot] = useState(null);
  const [didInitialSync, setDidInitialSync] = useState(false);
  const [saveState, setSaveState] = useState("idle");
  const [pdfState, setPdfState] = useState("idle");

  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasSeen = localStorage.getItem("hasSeenCompareTour");
      if (!hasSeen) {
        setShowTutorial(true);
      }
    }
  }, []);

  const nextStep = () => {
    if (tutorialStep < 2) {
      setTutorialStep(tutorialStep + 1);
    } else {
      closeTutorial();
    }
  };

  const closeTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem("hasSeenCompareTour", "true");
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
        { id: "price", label: "Price", tags: ["all", "city", "family", "longtrip"], pick: (c) => ({ value: (c?.computedLandedPrice ?? c?.price) != null ? formatCarPrice(c) : "N/A", raw: c?.computedLandedPrice ?? c?.price }), rank: "min" },
        { id: "monthlyLoan", label: "Est. Loan (48m@14%)", tags: ["all", "city", "family", "performance"], pick: (c) => ({ value: (c?.computedLandedPrice ?? c?.price) != null ? formatPrice(estimateMonthlyLoan(c?.computedLandedPrice ?? c?.price)) : "N/A", raw: estimateMonthlyLoan(c?.computedLandedPrice ?? c?.price) }), rank: "min" },
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
        { id: "importEligibility", label: "Import eligibility", tags: ["all", "city", "longtrip"], pick: (c) => ({ value: yesNo(getInsights(c)?.importEligibility), raw: getInsights(c)?.importEligibility }), rank: "booltrue" },
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
      const insight = insightsMap.get(car.id);

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
        normalizeScore(cars, (x) => insightsMap.get(x.id)?.roadSuitabilityScore, car.id, true) * 0.14 +
        (insight?.importEligibility ? 1 : 0) * 0.2
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
    const priced = fullComparedCars.filter((car) => typeof (car.computedLandedPrice ?? car.price) === "number");
    if (priced.length === 0) return null;
    return [...priced].sort((a, b) => (a.computedLandedPrice ?? a.price) - (b.computedLandedPrice ?? b.price))[0];
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

    const eligibleCount = fullComparedCars.filter((car) => getInsights(car)?.importEligibility === true).length;
    const bestRoadScore = Math.max(...fullComparedCars.map((car) => getInsights(car)?.roadSuitabilityScore || 0));
    const spread =
      typeof tcoStats.max === "number" && typeof tcoStats.min === "number"
        ? Math.max(0, tcoStats.max - tcoStats.min)
        : 0;

    return {
      eligibleCount,
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

  function handleDownloadPdf() {
    if (fullComparedCars.length === 0 || typeof window === "undefined") return;

    try {
      setPdfState("printing");

      const visibleGroups = specGroups
        .map((group) => {
          const rows = group.specs
            .filter((spec) => shouldShowSpec(spec))
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
          const importStatus = insight?.importEligibility === true ? "Eligible" : insight?.importEligibility === false ? "Not Eligible" : "N/A";

          return `
            <tr>
              <td class="car-name">${escapeHtml(`${car.year} ${car.make} ${car.model}`)}</td>
              <td>${escapeHtml(formatCarPrice(car))}</td>
              <td>${escapeHtml(formatPrice(annualTco))}</td>
              <td>${escapeHtml(String(road))}</td>
              <td>${escapeHtml(importStatus)}</td>
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
                  <th>Import Eligibility</th>
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
    <div className="bg-white dark:bg-[#0a0a0a] min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-32 sm:py-40">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-24 gap-12">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#718096] dark:text-slate-500 mb-8">
              <span>Terminal</span>
              <span>/</span>
              <span className="text-[#111827] dark:text-white">Technical Comparison</span>
            </div>
            <h1 className="text-5xl sm:text-7xl font-bold text-[#111827] dark:text-white tracking-tight leading-[1.05] mb-8">
              Spec <br />
              <span className="editorial-heading text-[#718096] dark:text-slate-400">Synthesis.</span>
            </h1>
            <p className="text-xl text-[#718096] dark:text-slate-400 font-medium leading-relaxed">
              Side-by-side mechanical analysis with architectural precision. 
              Integrating Kenya-specific operational data: TCO models, road suitability, 
              and central parts availability.
            </p>
          </div>
          
          <div className="no-print flex items-center gap-3 flex-wrap md:justify-end">
            {PRESETS.map((option) => (
              <button
                key={option.id}
                onClick={() => setPreset(option.id)}
                className={`px-6 h-12 text-[10px] font-bold uppercase tracking-widest transition-all border ${
                  preset === option.id
                    ? "bg-[#111827] text-white border-[#111827] dark:bg-white dark:!text-black dark:border-white shadow-xl"
                    : "bg-white dark:bg-[#111111] text-[#718096] dark:text-slate-400 border-slate-100 dark:border-slate-800 hover:border-[#111827] dark:hover:border-white"
                }`}
                style={{ borderRadius: 'var(--radius)' }}
              >
                {option.label}
              </button>
            ))}

            <button
              onClick={() => setShowDiffOnly(!showDiffOnly)}
              className={`px-6 h-12 flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest transition-all border ${
                showDiffOnly ? "bg-[#38A169] text-white border-[#38A169]" : "bg-white dark:bg-[#111111] text-[#718096] dark:text-slate-400 border-slate-100 dark:border-slate-800 hover:border-[#38A169]"
              }`}
              style={{ borderRadius: 'var(--radius)' }}
            >
              {showDiffOnly ? <Check className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
              Differences
            </button>
            
            <button
              onClick={clearCompare}
              className="px-6 h-12 bg-white dark:bg-[#111111] border border-slate-100 dark:border-slate-800 text-[#718096] dark:text-slate-400 hover:text-[#111827] dark:hover:text-white hover:border-[#111827] dark:hover:border-white text-[10px] font-bold uppercase tracking-widest transition-all"
              style={{ borderRadius: 'var(--radius)' }}
            >
              Reset Terminal
            </button>
          </div>
        </div>

        {/* Global Summary Stats */}
        {kenyaLensSummary && (
          <div className="mb-24 grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { label: 'Annual TCO Gap', value: `${formatKesCompact(kenyaLensSummary.annualTcoSpread)}/yr`, sub: 'Set Variance' },
              { label: 'Top Road Score', value: `${kenyaLensSummary.bestRoadScore}/100`, sub: 'Highest Readiness' },
              { label: 'Import Eligible', value: `${kenyaLensSummary.eligibleCount}/${fullComparedCars.length} Assets`, sub: 'Fiscal Approval' }
            ].map((stat, i) => (
              <div key={i} className="bg-[#F7FAFC] dark:bg-[#111111] border border-slate-100 dark:border-slate-800 p-8 sm:p-10 shadow-sm" style={{ borderRadius: 'var(--radius)' }}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#718096] dark:text-slate-500 mb-4">{stat.label}</p>
                <div className="flex items-baseline gap-3">
                  <p className="text-2xl sm:text-3xl font-bold text-[#111827] dark:text-white tabular-nums">{stat.value}</p>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-wide">{stat.sub}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Analytics Engine (Radar) */}
        {fullComparedCars.length >= 2 && (
          <div className="mb-32 bg-[#111827] dark:bg-[#111111] p-12 sm:p-20 overflow-hidden shadow-2xl" style={{ borderRadius: 'var(--radius)' }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <div>
                <h2 className="text-[10px] font-bold text-white uppercase tracking-[0.2em] mb-8">Performance Dimensions</h2>
                <p className="text-xl text-white/60 font-medium leading-relaxed mb-12">
                   Vector analysis of four critical mechanical pillars. The synthesis highlights 
                   how each unit balances fiscal efficiency against high-performance dynamics.
                </p>
                <div className="space-y-6">
                   {fullComparedCars.map((car, ci) => (
                      <div key={car.id} className="flex items-center gap-4 group">
                         <div className="w-12 h-[2px] transition-all" style={{ background: ci === 0 ? '#38A169' : ci === 1 ? '#FFFFFF' : '#718096' }} />
                         <span className="text-[11px] font-sans font-semibold text-white tracking-widest group-hover:text-[#38A169] transition-colors">
                            {car.year} {car.make} {car.model}
                         </span>
                      </div>
                   ))}
                </div>
              </div>
              
              <div className="flex justify-center scale-90 sm:scale-100">
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
        )}

        {/* Winner Rail */}
        <div className="mb-24 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {winnerRail.map((item) => (
            <div key={item.title} className="p-8 border border-slate-100 dark:border-slate-800" style={{ borderRadius: 'var(--radius)' }}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#A0AEC0] dark:text-slate-600 mb-4">{item.title}</p>
              {item.car ? (
                <Link href={`/cars/${item.car.id}`} className="group block">
                  <h3 className="text-lg font-bold font-sans text-[#111827] dark:text-white mb-1 group-hover:text-[#38A169] transition-colors">{item.car.year} {item.car.make}</h3>
                  <p className="text-[10px] font-bold text-[#718096] dark:text-slate-500 uppercase tracking-widest">{item.sub}</p>
                </Link>
              ) : (
                <p className="text-sm font-medium text-slate-300 dark:text-slate-700">Insufficient Data</p>
              )}
            </div>
          ))}
        </div>

        {/* Comparison Terminal (Table) */}
        <div className="relative border border-slate-100 dark:border-slate-800 overflow-x-auto bg-white dark:bg-[#0a0a0a] mb-32 shadow-2xl no-scrollbar" style={{ borderRadius: 'var(--radius)' }}>
          <div className="min-w-[900px] sm:min-w-[1100px]">
             {/* Header Row */}
             <div className="sticky top-0 z-40 bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800">
                <div className="grid grid-cols-[180px_1fr_1fr_1fr] sm:grid-cols-[300px_1fr_1fr_1fr]">
                   <div className="p-8 sm:p-12 border-r border-slate-100 dark:border-slate-800 flex items-center bg-white dark:bg-[#0a0a0a] sticky left-0 z-50">
                      <span className="text-[10px] font-bold text-[#A0AEC0] dark:text-slate-600 uppercase tracking-[0.2em] transform -rotate-180 [writing-mode:vertical-lr]">Spec Matrix</span>
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
                                      <span className="px-2 py-1 bg-[#38A169]/5 border border-[#38A169]/20 text-[8px] font-bold text-[#38A169] uppercase tracking-widest" style={{ borderRadius: '4px' }}>{getInsights(car)?.importEligibility ? 'ELIGIBLE' : 'NOT ELIGIBLE'}</span>
                                   </div>
                                )}
                              </div>
                           ) : (
                              <div className="relative group flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-100 dark:border-slate-800 transition-colors hover:border-[#38A169]/40" style={{ borderRadius: 'var(--radius)' }}>
                                 <button onClick={() => setActiveSlot(idx)} className="w-14 h-14 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm" style={{ borderRadius: 'var(--radius)' }}>
                                    <Search className="w-5 h-5 text-[#A0AEC0] dark:text-slate-600" />
                                 </button>
                                 <p className="mt-6 text-[10px] font-bold text-[#A0AEC0] dark:text-slate-600 uppercase tracking-widest">Awaiting Data</p>
                                 
                                 {activeSlot === idx && (
                                    <div className="absolute inset-0 bg-white dark:bg-[#111111] z-50 p-6 shadow-2xl animate-in fade-in slide-in-from-top-2" style={{ borderRadius: 'var(--radius)' }}>
                                       <input autoFocus type="text" placeholder="Search parameters..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 px-5 py-4 text-sm font-bold text-[#111827] dark:text-white outline-none focus:border-[#38A169]" style={{ borderRadius: 'var(--radius)' }} />
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
                                     if (!car) return <div key={idx} className="p-8 border-r border-slate-100 dark:border-slate-800 last:border-r-0" />;
                                     const { value, raw } = spec.pick(car);
                                     const best = getBest(spec, fullComparedCars);
                                     const isBest = best != null && raw === best;
                                     return (
                                        <div key={idx} className="p-6 sm:p-8 border-r border-slate-100 dark:border-slate-800 last:border-r-0 text-center font-bold tabular-nums">
                                           <span className={`text-xs sm:text-sm ${isBest ? 'text-[#111827] dark:text-white' : 'text-[#718096] dark:text-slate-500'}`}>{value}</span>
                                           {isBest && <div className="mt-1 sm:mt-2 text-[8px] font-bold text-[#38A169] uppercase tracking-widest">Optimized</div>}
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

        {/* Action Center */}
        <div className="pt-24 border-t border-slate-100 dark:border-slate-800">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
              <div>
                 <h3 className="text-2xl font-bold text-[#111827] dark:text-white mb-4">Export Result Matrix</h3>
                 <p className="text-sm font-medium text-[#718096] dark:text-slate-400 leading-relaxed">
                    Generate a high-fidelity documentation set for your comparison. 
                    Includes full mechanical specs and regional operational scoring.
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
  );
}
