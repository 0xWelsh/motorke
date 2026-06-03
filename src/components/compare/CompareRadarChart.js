// src/components/compare/CompareRadarChart.js
"use client";
import { Info } from "lucide-react";

export default function CompareRadarChart({
  fullComparedCars,
  scoreMaps,
  currentTutorialKey,
  initialCarsById
}) {
  if (fullComparedCars.length === 0) return null;

  return (
    <div
      id="compare-radar"
      data-tour="radar"
      className={`order-4 scroll-mt-24 bg-white dark:bg-[#0f0f0f] border border-slate-100 dark:border-slate-800 p-5 sm:p-6 lg:p-8 ${currentTutorialKey === "radar" ? "ring-2 ring-[#38A169] ring-offset-2 ring-offset-white dark:ring-offset-[#0a0a0a]" : ""}`}
      style={{ borderRadius: "var(--radius)" }}
    >
      <div className="flex flex-col lg:flex-row gap-10 items-center">
        <div className="flex-1 space-y-6">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-[#111827] dark:text-white">Performance Radar</h3>
            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-[9px] font-bold text-slate-500 uppercase tracking-widest rounded">Beta Analysis</span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
            This normalized scoring represents how each car stacks up relative to the others in this set. 
            A higher area indicates better all-round capability in that dimension.
          </p>
          <div className="space-y-4">
            {fullComparedCars.map((car) => {
              const hydrated = !!(car && initialCarsById.has(car.id));
              if (!hydrated) return null;
              return (
                <div key={car.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-500">
                      {car.make} {car.model}
                    </span>
                    <span className="text-[11px] font-bold text-[#38A169]">
                      {Math.round((scoreMaps.overallMap.get(car.id) || 0) * 100)}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800/50 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#111827] dark:bg-white transition-all duration-700 ease-out" 
                      style={{ width: `${(scoreMaps.overallMap.get(car.id) || 0) * 100}%` }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Placeholder for SVG Radar or advanced viz if needed */}
        <div className="w-full lg:w-72 aspect-square relative flex items-center justify-center bg-slate-50 dark:bg-[#111111] border border-slate-100 dark:border-slate-800" style={{ borderRadius: "var(--radius)" }}>
           <div className="text-center space-y-1 p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Composite Score</p>
              <p className="text-4xl font-black text-[#111827] dark:text-white">
                {fullComparedCars.length > 0 ? Math.round(Math.max(...[...scoreMaps.overallMap.values()]) * 100) : 0}
              </p>
              <p className="text-[9px] font-bold text-[#38A169] uppercase tracking-widest">Max in set</p>
           </div>
        </div>
      </div>
    </div>
  );
}
