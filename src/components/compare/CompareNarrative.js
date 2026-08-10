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
      className="order-5 scroll-mt-24 bg-white border border-slate-200 p-5 sm:p-6 lg:p-8"
      style={{ borderRadius: "var(--radius)" }}
    >
      <div className="flex items-start gap-4 mb-6">
        <div className="shrink-0 w-10 h-10 bg-[var(--accent)] flex items-center justify-center rounded-full shadow-lg">
          <CircleHelp className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900">The Buyer's Verdict</h3>
          <p className="text-sm text-slate-500 font-medium mt-0.5">
            AI-powered reasoning based on Kenyan market data.
          </p>
        </div>
      </div>

      <div className="prose max-w-none">
        <div className="bg-slate-50 border border-slate-200 p-4 sm:p-5 shadow-sm" style={{ borderRadius: "var(--radius)" }}>
          {freeAi.status === "idle" && (
            <div className="py-4 text-center">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Awaiting analysis request</p>
              <button
                type="button"
                onClick={requestFreeAi}
                className="btn btn-primary"
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
              <p className="text-[13px] sm:text-[14px] leading-relaxed font-medium text-slate-500">
                {freeAi.text || freeAi.hint || "Could not generate narrative."}
              </p>
              {freeAi.hint && freeAi.status === "done" && (
                <p className="mt-3 text-[10px] font-semibold text-slate-500 italic opacity-80">{freeAi.hint}</p>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 border-t border-slate-200 pt-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 mb-3">
            Who should pick which car
          </p>
          <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
            One punchy "buy this if…" line per car, grounded in the specs.
          </p>
          <button
            type="button"
            onClick={requestPickReasons}
            disabled={!pickReasonsPayload || pickReasons.status === "loading"}
            className="btn btn-neutral btn-sm"
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
                    className="p-3 sm:p-4 border border-slate-200 bg-slate-50 text-sm text-slate-500 leading-snug"
                    style={{ borderRadius: "var(--radius)" }}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1">
                      {car.year} {car.make} {car.model}
                    </span>
                    {line || (
                      <span className="text-[12px] text-slate-500">
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
