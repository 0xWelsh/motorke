// src/components/compare/CompareNarrative.js
"use client";
import { CircleHelp } from "lucide-react";

export default function CompareNarrative({
  freeAi,
  requestFreeAi,
  pickReasons,
  requestPickReasons,
  fullComparedCars,
  pickReasonsPayload,
  initialCarsById
}) {
  return (
    <div
      id="compare-decision"
      className="order-5 scroll-mt-24 bg-slate-50 dark:bg-[#0f0f0f] border border-slate-200/60 dark:border-slate-800 p-5 sm:p-6 lg:p-8"
      style={{ borderRadius: "var(--radius)" }}
    >
      <div className="flex items-start gap-4 mb-6">
        <div className="shrink-0 w-10 h-10 bg-[#111827] dark:bg-white flex items-center justify-center rounded-full shadow-lg">
          <CircleHelp className="w-5 h-5 text-white dark:text-black" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-[#111827] dark:text-white">The Buyer’s Verdict</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            AI-powered reasoning based on Kenyan market data.
          </p>
        </div>
      </div>

      <div className="prose dark:prose-invert max-w-none">
        <div className="bg-white dark:bg-black/20 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm" style={{ borderRadius: "var(--radius)" }}>
          {freeAi.status === "idle" && (
            <div className="py-4 text-center">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Awaiting analysis request</p>
              <button
                type="button"
                onClick={requestFreeAi}
                className="h-11 px-6 bg-[#111827] dark:bg-white text-white dark:text-black text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                style={{ borderRadius: "var(--radius)" }}
              >
                Generate Smart Narrative
              </button>
            </div>
          )}

          {freeAi.status === "loading" && (
            <div className="py-8 text-center animate-pulse">
              <div className="flex justify-center gap-1.5 mb-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-1.5 h-1.5 bg-[#38A169] rounded-full" />
                ))}
              </div>
              <p className="text-[10px] font-bold text-[#38A169] uppercase tracking-[0.2em]">Consulting local data…</p>
            </div>
          )}

          {(freeAi.status === "done" || freeAi.status === "err" || freeAi.status === "nokey") && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#38A169] mb-3">Narrative Summary</p>
              <p className="text-[13px] sm:text-[14px] leading-relaxed font-medium text-slate-700 dark:text-slate-200">
                {freeAi.text || freeAi.hint || "Could not generate narrative."}
              </p>
              {freeAi.hint && freeAi.status === "done" && (
                <p className="mt-3 text-[10px] font-semibold text-slate-500 italic opacity-80">{freeAi.hint}</p>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 border-t border-slate-200/80 dark:border-slate-700/80 pt-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-500 mb-3">
            Who should pick which car
          </p>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mb-3 leading-relaxed">
            One punchy “buy this if…” line per car, grounded in the specs.
          </p>
          <button
            type="button"
            onClick={requestPickReasons}
            disabled={!pickReasonsPayload || pickReasons.status === "loading"}
            className="inline-flex items-center justify-center px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-[#111827] dark:text-white hover:border-[#38A169] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{ borderRadius: "var(--radius)" }}
          >
            {pickReasons.status === "loading" ? "Working…" : "Get pick-one-liners"}
          </button>
          {pickReasons.status === "done" && (
            <ul className="mt-4 space-y-3">
              {fullComparedCars.map((car) => {
                const line = pickReasons.byCarId[car.id];
                return (
                  <li
                    key={car.id}
                    className="p-3 sm:p-4 border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-black/20 text-sm text-slate-800 dark:text-slate-200 leading-snug"
                    style={{ borderRadius: "var(--radius)" }}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-500 block mb-1">
                      {car.year} {car.make} {car.model}
                    </span>
                    {line || (
                      <span className="text-[12px] text-slate-500 dark:text-slate-500">
                        No line returned for this car. Try again.
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
