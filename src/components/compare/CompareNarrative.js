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
      className="order-5 scroll-mt-24 bg-[#1c1c1c] border border-white/[0.06] p-5 sm:p-6 lg:p-8"
      style={{ borderRadius: "var(--radius)" }}
    >
      <div className="flex items-start gap-4 mb-6">
        <div className="shrink-0 w-10 h-10 bg-[var(--accent)] flex items-center justify-center rounded-full shadow-lg">
          <CircleHelp className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">The Buyer's Verdict</h3>
          <p className="text-sm text-zinc-400 font-medium mt-0.5">
            AI-powered reasoning based on Kenyan market data.
          </p>
        </div>
      </div>

      <div className="prose prose-invert max-w-none">
        <div className="bg-black/20 border border-white/[0.06] p-4 sm:p-5 shadow-sm" style={{ borderRadius: "var(--radius)" }}>
          {freeAi.status === "idle" && (
            <div className="py-4 text-center">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Awaiting analysis request</p>
              <button
                type="button"
                onClick={requestFreeAi}
                className="h-11 px-6 bg-[var(--accent)] text-white text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
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
                  <div key={i} className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full" />
                ))}
              </div>
              <p className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-[0.2em]">Consulting local data…</p>
            </div>
          )}

          {(freeAi.status === "done" || freeAi.status === "err" || freeAi.status === "nokey") && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent)] mb-3">Narrative Summary</p>
              <p className="text-[13px] sm:text-[14px] leading-relaxed font-medium text-zinc-300">
                {freeAi.text || freeAi.hint || "Could not generate narrative."}
              </p>
              {freeAi.hint && freeAi.status === "done" && (
                <p className="mt-3 text-[10px] font-semibold text-zinc-400 italic opacity-80">{freeAi.hint}</p>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 border-t border-white/[0.06] pt-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400 mb-3">
            Who should pick which car
          </p>
          <p className="text-[11px] text-zinc-400 mb-3 leading-relaxed">
            One punchy "buy this if…" line per car, grounded in the specs.
          </p>
          <button
            type="button"
            onClick={requestPickReasons}
            disabled={!pickReasonsPayload || pickReasons.status === "loading"}
            className="inline-flex items-center justify-center px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest border border-white/[0.06] bg-white/[0.03] text-white hover:border-[var(--accent)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                    className="p-3 sm:p-4 border border-white/[0.06] bg-black/20 text-sm text-zinc-300 leading-snug"
                    style={{ borderRadius: "var(--radius)" }}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block mb-1">
                      {car.year} {car.make} {car.model}
                    </span>
                    {line || (
                      <span className="text-[12px] text-zinc-400">
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
