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

function roadTone(score) {
  if (typeof score !== "number") return "border-zinc-300 bg-zinc-100 text-zinc-600";
  if (score >= 80) return "border-black bg-black text-white";
  if (score >= 65) return "border-zinc-700 bg-zinc-800 text-zinc-100";
  if (score >= 50) return "border-zinc-400 bg-zinc-200 text-zinc-800";
  return "border-zinc-500 bg-zinc-300 text-zinc-900";
}

function importTone(eligible) {
  if (eligible === true) return "border-black bg-black text-white";
  if (eligible === false) return "border-zinc-500 bg-zinc-200 text-zinc-800";
  return "border-zinc-300 bg-zinc-100 text-zinc-600";
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
              <td>${escapeHtml(`${car.year} ${car.make} ${car.model}`)}</td>
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
            <title>Motorke Comparison PDF</title>
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
            <h1>Motorke Comparison Report</h1>
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
                    .map((car) => `<th>${escapeHtml(`${car.year} ${car.make} ${car.model}`)}</th>`)
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
    <div className="mk-compare-page min-h-screen bg-[#f7f6f3]">
    <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12 text-slate-900">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 sm:mb-12 gap-6 sm:gap-8">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 mb-3">Dyno Console - Spec Heavy Mode</p>
          <h1 className="text-3xl sm:text-5xl font-black mb-3 sm:mb-4 tracking-tighter">Comparison Engine</h1>
          <p className="text-slate-600 max-w-2xl font-medium text-sm sm:text-base">Mechanical-grade side-by-side analysis with Kenya buyer signals: annual operating cost, road readiness, import eligibility, and parts availability.</p>
        </div>
        <div className="no-print flex items-center gap-2 sm:gap-3 flex-wrap md:justify-end">
          {PRESETS.map((option) => (
            <button
              id={option.id === "all" ? "tour-presets" : undefined}
              key={option.id}
              onClick={() => setPreset(option.id)}
              className={`px-3 sm:px-4 h-9 sm:h-10 rounded-none text-[10px] font-black uppercase tracking-[0.14em] transition-all border ${
                preset === option.id
                  ? "bg-[#111111] text-white border-[#111111]"
                  : "bg-white text-white border-[#ddd4c8] hover:text-white hover:border-[#111111]/35"
              }`}
            >
              {option.label}
            </button>
          ))}

          <button
            id="tour-diff"
            onClick={() => setShowDiffOnly(!showDiffOnly)}
            className={`w-full sm:w-auto justify-center px-5 sm:px-6 h-11 sm:h-12 rounded-none flex items-center gap-2 text-[11px] sm:text-xs font-black uppercase tracking-widest transition-all ${
              showDiffOnly ? "bg-[#111111] text-white border border-[#111111]" : "bg-white border border-[#ddd4c8] text-white hover:text-white hover:border-[#111111]/35"
            }`}
          >
            {showDiffOnly ? <Check className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
            Differences Only
          </button>
          <button
            onClick={clearCompare}
            className="w-full sm:w-auto px-5 sm:px-6 h-11 sm:h-12 rounded-none bg-white border border-[#ddd4c8] text-slate-700 hover:text-slate-900 hover:border-slate-400 text-[11px] sm:text-xs font-black uppercase tracking-widest transition-all"
          >
            Clear All
          </button>
        </div>
      </div>

      {kenyaLensSummary && (
        <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="border border-[#ddd4c8] bg-white rounded-none px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Annual TCO Gap</p>
            <p className="text-lg font-black text-slate-900 mt-1">{formatKesCompact(kenyaLensSummary.annualTcoSpread)}/yr</p>
          </div>
          <div className="border border-[#ddd4c8] bg-white rounded-none px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Top Road Score</p>
            <p className="text-lg font-black text-slate-900 mt-1">{kenyaLensSummary.bestRoadScore}/100</p>
          </div>
          <div className="border border-[#ddd4c8] bg-white rounded-none px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Import Eligible</p>
            <p className="text-lg font-black text-slate-900 mt-1">{kenyaLensSummary.eligibleCount}/{fullComparedCars.length} cars</p>
          </div>
        </div>
      )}

      <div className="mb-8 sm:sticky sm:top-[84px] sm:z-40">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {winnerRail.map((item) => (
            <div key={item.title} className="border border-[#ddd4c8] bg-white rounded-none p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 mb-2">{item.title}</p>
              {item.car ? (
                <Link href={`/cars/${item.car.id}`} className="block group">
                  <p className="text-sm font-black text-slate-900 group-hover:text-black line-clamp-1">{item.car.year} {item.car.make} {item.car.model}</p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-700 mt-1">{item.sub}</p>
                </Link>
              ) : (
                <p className="text-xs font-bold text-slate-500">Add more cars to compute winner</p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="relative border border-[#ddd4c8] rounded-none overflow-x-auto bg-white">
        <div className="min-w-[980px]">
        {/* Table Header (Sticky) */}
        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-2xl border-b border-[#ddd4c8]">
          <div className="grid grid-cols-[160px_1fr_1fr_1fr] md:grid-cols-[240px_1fr_1fr_1fr]">
            <div className="sticky left-0 z-40 p-6 md:p-8 flex items-center justify-center border-r border-[#ddd4c8] bg-white">
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 -rotate-90">Model View ⚖️</span>
            </div>
            {SLOT_KEYS.map((_, idx) => {
              const car = comparedSlots[idx];
              const hydrated = !!(car && initialCarsById.has(car.id));
              const imageUrl = car?.images?.[0]?.url || car?.image || null;
              return (
                <div key={idx} className={`p-4 md:p-5 flex flex-col gap-4 border-r border-[#ddd4c8] last:border-r-0 relative transition-all ${!car ? "bg-white" : ""}`}>
                  {car ? (
                    <div className="relative h-full rounded-none border border-[#ddd4c8] bg-white p-4 md:p-5">
                      <button
                        onClick={() => removeFromCompare(car.id)}
                        className="absolute top-3 right-3 text-slate-400 hover:text-slate-900 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="relative aspect-[16/10] rounded-none overflow-hidden border border-[#ddd4c8] bg-white">
                        {imageUrl ? (
                          <Image src={imageUrl} alt={car.model} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">No Image</div>
                        )}
                      </div>
                      <div className="mt-3">
                         <p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500 mb-1">{car.year}</p>
                         <h3 className="font-black text-sm md:text-base leading-tight text-slate-900 mb-1 line-clamp-2">{car.make} {car.model}</h3>
                         <p className="text-slate-600 text-[10px] truncate">{car.variant || "Standard Variant"}</p>
                         {hydrated && (
                           <div className="mt-2 flex flex-wrap gap-1.5">
                             <span className={`inline-flex px-2 py-0.5 rounded-noneull border text-[8px] font-black uppercase tracking-[0.12em] ${roadTone(getInsights(car)?.roadSuitabilityScore)}`}>
                               Road {getInsights(car)?.roadSuitabilityScore || "N/A"}
                             </span>
                             <span className="inline-flex px-2 py-0.5 rounded-noneull border border-zinc-400 bg-zinc-200 text-zinc-800 text-[8px] font-black uppercase tracking-[0.12em]">
                               TCO {formatKesCompact(getInsights(car)?.tco?.annualTotal || 0)}/yr
                             </span>
                             <span className={`inline-flex px-2 py-0.5 rounded-noneull border text-[8px] font-black uppercase tracking-[0.12em] ${importTone(getInsights(car)?.importEligibility)}`}>
                               {getInsights(car)?.importEligibility ? "Import OK" : getInsights(car)?.importEligibility === false ? "Over-age" : "Eligibility N/A"}
                             </span>
                           </div>
                         )}
                         <div className="mt-2 h-1.5 w-full bg-[#e5e7eb] rounded-noneull overflow-hidden">
                           <div className="h-full bg-gradient-to-r from-[#111111] to-[#ff5a2f]" style={{ width: `${hydrated ? calcCoverage(car, allSpecs) : 0}%` }} />
                         </div>
                         <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.1em] mt-2">
                           Spec Coverage: {hydrated ? `${calcCoverage(car, allSpecs)}%` : "Loading"}
                         </p>
                      </div>
                    </div>
                  ) : (
                    <div className="relative h-full rounded-none border border-[#ddd4c8] bg-[#fbfcfe] flex flex-col items-center justify-center gap-4 p-4 md:p-5">
                       <button
                         id={idx === 1 ? "tour-add-slot" : undefined}
                         onClick={() => setActiveSlot(idx)}
                         className="w-16 h-16 rounded-none bg-white border border-dashed border-[#ddd4c8] flex items-center justify-center text-slate-500 hover:text-slate-900 hover:border-slate-400 transition-all group"
                       >
                         <Search className="w-6 h-6 group-hover:scale-110 transition-transform" />
                       </button>
                       <span className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">Empty Slot</span>
                       
                       {activeSlot === idx && (
                         <div className="absolute inset-0 rounded-none border border-[#ddd4c8] bg-white z-40 p-4 transition-all animate-in fade-in zoom-in-95">
                           <div className="relative">
                             <input
                               autoFocus
                               type="text"
                               placeholder="Search car..."
                               value={searchQuery}
                               onChange={(e) => setSearchQuery(e.target.value)}
                               className="w-full bg-white border border-[#ddd4c8] rounded-none px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#111111]/45 transition-all font-bold"
                             />
                             <button onClick={() => setActiveSlot(null)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900">
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
                                 className="w-full flex items-center gap-3 p-3 rounded-none hover:bg-white border border-transparent hover:border-[#ddd4c8] transition-all text-left"
                               >
                                 <div className="w-12 h-12 rounded-none overflow-hidden bg-[#eef2f7] shrink-0 relative">
                                   {res.image && <Image src={res.image} alt={res.model} fill className="object-cover" />}
                                 </div>
                                 <div className="flex-1 min-w-0">
                                   <p className="text-xs font-black text-slate-900">{res.year} {res.make} {res.model}</p>
                                   <p className="text-[10px] text-slate-700 font-bold">{formatCarPrice(res)}</p>
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
        <div className="divide-y divide-[#e5e7eb]">
          {specGroups.map((group) => (
            <div key={group.name} className="bg-white">
              <div className="grid grid-cols-[160px_1fr] md:grid-cols-[240px_1fr] py-4 px-8 items-center bg-white">
                <h2 className="sticky left-0 z-30 bg-white text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">{group.name}</h2>
                <div className="h-px bg-[#e2e8f0]" />
              </div>
              <div className="divide-y divide-[#eef2f7]">
                {group.specs.map((spec, specIndex) => {
                  if (!shouldShowSpec(spec)) return null;

                  const diff = isDifferent(spec, fullComparedCars);
                  const severity = getDiffSeverity(spec, fullComparedCars);
                  if (showDiffOnly && !diff && fullComparedCars.length > 1) return null;

                  const zebra = specIndex % 2 === 0 ? "bg-white" : "bg-[#fbfcfe]";
                  const rowTone = diff ? "bg-[#f4f6fa]" : `${zebra} hover:bg-[#f6f8fb]`;

                  return (
                    <div key={spec.label} className={`grid grid-cols-[160px_1fr_1fr_1fr] md:grid-cols-[240px_1fr_1fr_1fr] transition-colors ${rowTone}`}>
                      <div className="sticky left-0 z-20 p-5 md:p-6 flex items-center border-r border-[#ddd4c8] bg-[#f9fafb]">
                        <div className="space-y-2">
                          <span className="text-[11px] font-bold text-slate-900 uppercase tracking-widest block">{spec.label}</span>
                          {severity !== "none" && fullComparedCars.length > 1 && (
                            <span className={`inline-flex px-2 py-0.5 rounded-noneull border text-[8px] font-black uppercase tracking-[0.12em] ${SEVERITY_STYLES[severity]}`}>
                              {severity}
                            </span>
                          )}
                        </div>
                      </div>
                      {SLOT_KEYS.map((_, idx) => {
                        const car = comparedSlots[idx];
                        if (!car) return <div key={idx} className="p-5 md:p-6 border-r border-[#ddd4c8] last:border-r-0" />;
                        if (!initialCarsById.has(car.id)) {
                          return (
                            <div key={idx} className="p-5 md:p-6 flex items-center justify-center border-r border-[#ddd4c8] last:border-r-0">
                              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Loading...</span>
                            </div>
                          );
                        }
                        
                        const { value, raw } = spec.pick(car);
                        const best = getBest(spec, fullComparedCars);
                        const isBestValue = best != null && raw === best;
                        const gaugePercent = getGaugePercent(spec, fullComparedCars, raw);
                        const missing = isMissing(raw);
                        const annualTcoSavings = spec.id === "annualTco" ? (tcoStats.savingsByCarId.get(car.id) || 0) : 0;
                        const isAnnualTcoWinner = spec.id === "annualTco" && annualTcoSavings > 0 && typeof tcoStats.max === "number";
                        const trafficDelta = spec.id === "trafficFactor" ? (getInsights(car)?.tco?.trafficMultiplier || 1) : null;

                        return (
                          <div key={idx} className="p-5 md:p-6 flex items-center justify-center border-r border-[#ddd4c8] last:border-r-0">
                            <div className="w-full text-center space-y-1.5">
                              {gaugePercent !== null && (
                                <div className="h-1.5 w-full bg-[#e5e7eb] rounded-noneull overflow-hidden">
                                  <div
                                    className={`h-full ${isBestValue ? "bg-black" : "bg-slate-500"}`}
                                    style={{ width: `${Math.max(8, gaugePercent)}%` }}
                                  />
                                </div>
                              )}

                              <span className={`text-[13px] font-black leading-relaxed text-center block ${
                                missing ? "text-slate-400" : isBestValue ? "text-black" : "text-slate-800"
                              }`}>
                                {value}
                                {spec.id === "annualTco" && !missing && (
                                  <span className={`block text-[8px] mt-1 uppercase tracking-[0.12em] ${isAnnualTcoWinner ? "text-black/90" : "text-slate-500"}`}>
                                    {annualTcoSavings > 0 ? `Saves ${formatKesCompact(annualTcoSavings)}/yr vs highest` : "Highest annual operating cost in this set"}
                                  </span>
                                )}
                                {spec.id === "trafficFactor" && typeof trafficDelta === "number" && !missing && (
                                  <span className="block text-[8px] mt-1 uppercase tracking-[0.12em] text-slate-600">
                                    {trafficDelta <= 1.12 ? "Traffic efficient" : trafficDelta <= 1.25 ? "Moderate traffic penalty" : "Heavy traffic penalty"}
                                  </span>
                                )}
                                {missing && <span className="block text-[8px] mt-1 uppercase tracking-[0.12em]">Missing data</span>}
                                {isBestValue && !missing && (
                                  <span className="inline-flex mt-1 px-2 py-0.5 rounded-nonem bg-black text-white text-[8px] font-black uppercase tracking-[0.12em]">
                                    Best Spec
                                  </span>
                                )}
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
      </div>
      
      {/* Compare Page Bottom CTA */}
      <div className="no-print mt-10 sm:mt-12 flex flex-col items-center gap-5 sm:gap-6 p-6 sm:p-12 bg-white border border-[#ddd4c8] rounded-none text-center">
        <p className="text-slate-600 text-sm font-medium">Move from comparison to action</p>

        <div className="flex flex-wrap justify-center gap-3 w-full">
          {overallWinner && (
            <Link href={`/cars/${overallWinner.id}`} className="w-full sm:w-auto justify-center px-6 h-12 rounded-none bg-[#111111] text-white border border-[#111111] hover:bg-black transition-all flex items-center gap-2 font-black text-[11px] uppercase tracking-[0.14em]">
              Shortlist Winner <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}

          {topTwo.map((car, idx) => (
            <Link key={car.id} href={`/cars/${car.id}`} className="px-6 h-12 rounded-none bg-white border border-[#ddd4c8] hover:border-[#111111]/35 hover:bg-white transition-all flex items-center gap-2 group">
              <span className="text-[11px] font-black text-slate-700 group-hover:text-slate-900 uppercase tracking-widest">Enquire Top {idx + 1}</span>
              <ArrowRight className="w-3 h-3 text-slate-700" />
            </Link>
          ))}

          <button
            onClick={handleSaveComparison}
            className="px-6 h-12 rounded-none bg-white border border-[#ddd4c8] hover:border-[#111111]/35 hover:bg-white transition-all flex items-center gap-2"
          >
            <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest">
              {saveState === "copied" ? "Saved" : saveState === "failed" ? "Save Failed" : "Save Comparison"}
            </span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={fullComparedCars.length === 0}
            className="px-6 h-12 rounded-none bg-white border border-[#111111]/25 text-[#0f172a] hover:bg-white transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            <span className="text-[11px] font-black uppercase tracking-widest">
              {pdfState === "printing" ? "Preparing PDF" : pdfState === "done" ? "PDF Ready" : pdfState === "failed" ? "PDF Failed" : "Download PDF"}
            </span>
          </button>
        </div>
      </div>
    </div>

      {showTutorial && (
        <div className="fixed inset-0 z-[100] bg-[#0f172a]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-none p-8 max-w-lg w-full shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="absolute top-0 left-0 w-full h-2 bg-slate-100">
              <div 
                className="h-full bg-slate-900 transition-all duration-300"
                style={{ width: `${((tutorialStep + 1) / 3) * 100}%` }}
              />
            </div>
            
            <div className="mt-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">
                Dyno Overview &bull; Step {tutorialStep + 1} of 3
              </p>
              
              {tutorialStep === 0 && (
                <>
                  <h3 className="text-2xl font-black mb-3 tracking-tighter">Compare Your Finalists</h3>
                  <p className="text-slate-600 font-medium text-sm leading-relaxed mb-6">
                    Start by searching our inventory for the cars you're considering. Click the <strong className="text-slate-900 font-black">Empty Slot</strong> magnifying glass below to add a vehicle to the Dyno Console.
                  </p>
                </>
              )}
              {tutorialStep === 1 && (
                <>
                  <h3 className="text-2xl font-black mb-3 tracking-tighter">Pinpoint Differences</h3>
                  <p className="text-slate-600 font-medium text-sm leading-relaxed mb-6">
                    Toggle <strong className="text-slate-900 font-black">Differences Only</strong> at the top right to instantly hide matching specs. We also highlight critical Kenya buyer signals like Duty, Clearances, and Parts Cost.
                  </p>
                </>
              )}
              {tutorialStep === 2 && (
                <>
                  <h3 className="text-2xl font-black mb-3 tracking-tighter">Contextual Views</h3>
                  <p className="text-slate-600 font-medium text-sm leading-relaxed mb-6">
                    Switch between our preset modes (like <strong className="text-slate-900 font-black">Family</strong>, <strong className="text-slate-900 font-black">City</strong>, or <strong className="text-slate-900 font-black">Long Trip</strong>) to filter noise and only see the mechanical traits relevant to your exact use case.
                  </p>
                </>
              )}

              <div className="flex items-center justify-between mt-8 pt-2">
                <button 
                  onClick={closeTutorial}
                  className="text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
                >
                  Skip Tour
                </button>
                <button 
                  onClick={nextStep}
                  className="px-6 h-12 flex items-center justify-center rounded-none bg-[#111111] text-white hover:bg-black text-[11px] font-black uppercase tracking-widest transition-all"
                >
                  {tutorialStep === 2 ? "Start Comp" : "Next Step"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
