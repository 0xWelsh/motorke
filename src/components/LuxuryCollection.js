"use client";

import { useState, useMemo } from "react";
import LuxuryVehicleCard from "@/components/LuxuryVehicleCard";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const FILTERS = [
  { label: "All", value: "all" },
  { label: "SUV", value: "SUV" },
  { label: "Sedan", value: "SEDAN" },
  { label: "Coupe", value: "COUPE" },
  { label: "Convertible", value: "CONVERTIBLE" },
  { label: "Wagon", value: "WAGON" },
];

const SUV_TYPES = new Set(["SUV", "CROSSOVER", "MPV"]);

export default function LuxuryCollection({ cars }) {
  const [active, setActive] = useState("all");

  const filtered = useMemo(() => {
    if (active === "all") return cars;
    if (active === "SUV") return cars.filter((c) => SUV_TYPES.has(c.bodyType));
    return cars.filter((c) => c.bodyType === active);
  }, [cars, active]);

  return (
    <>
      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {FILTERS.map((f) => {
          const isActive = active === f.value;
          const count =
            f.value === "all"
              ? cars.length
              : f.value === "SUV"
                ? cars.filter((c) => SUV_TYPES.has(c.bodyType)).length
                : cars.filter((c) => c.bodyType === f.value).length;

          if (count === 0 && f.value !== "all") return null;

          return (
            <button
              key={f.value}
              onClick={() => setActive(f.value)}
              className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 border ${
                isActive
                  ? "bg-surface text-black border-white"
                  : "bg-transparent text-zinc-400 border-zinc-700/60 hover:border-zinc-500 hover:text-white"
              }`}
            >
              {f.label}
              <span className="ml-1.5 text-[10px] opacity-50">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filtered.map((car, i) => (
            <LuxuryVehicleCard key={car.id} car={car} priority={i < 3} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 sm:py-28">
          <p className="text-zinc-500 text-sm font-medium mb-6">
            Nothing in this collection yet.
            <br />
            We&apos;re constantly adding exceptional vehicles.
          </p>
          <Link href="/request-car" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white hover:text-zinc-300 transition-colors">
            Request a Car <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </>
  );
}
