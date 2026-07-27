"use client";

import { Calculator } from "lucide-react";

function vehicleDetail(vehicle) {
  const parts = [];
  if (vehicle.engineCC) parts.push(`${vehicle.engineCC}cc`);
  if (vehicle.fuelType) parts.push(vehicle.fuelType);
  if (vehicle.year) parts.push(`${vehicle.year}`);
  return parts.length ? parts.join(" · ") : null;
}

export default function DutyPopularChips({ vehicles = [], activeId = null, onSelect, disabled = false }) {
  if (!vehicles.length) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Popular estimates</p>
        <p className="text-[10px] text-zinc-400 hidden sm:block">Tap to calculate instantly</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {vehicles.map((vehicle) => {
          const isActive = activeId === vehicle.id;
          return (
            <button
              key={vehicle.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelect?.(vehicle)}
              className={`text-left flex items-center gap-3 px-4 py-3 border transition-all disabled:opacity-50 hover:scale-[0.98] active:scale-95 ${
                isActive
                  ? "border-white bg-white text-[#1c1c1c]"
                  : "border-white/[0.06] bg-[#1c1c1c] hover:border-zinc-500"
              }`}
              style={{ borderRadius: "var(--radius)" }}
            >
              <div className={`w-9 h-9 flex items-center justify-center shrink-0 ${
                isActive ? "bg-red-600" : "bg-red-900/30"
              }`} style={{ borderRadius: "var(--radius)" }}>
                <Calculator className={`w-4 h-4 ${
                  isActive ? "text-white" : "text-red-400"
                }`} aria-hidden />
              </div>
              <div className="min-w-0">
                <p className={`text-xs font-bold truncate ${
                  isActive ? "text-[#1c1c1c]" : "text-white"
                }`}>
                  {vehicle.label}
                </p>
                {vehicleDetail(vehicle) && (
                  <p className={`text-[10px] mt-0.5 truncate ${
                    isActive ? "text-zinc-600" : "text-zinc-400"
                  }`}>
                    {vehicleDetail(vehicle)}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
