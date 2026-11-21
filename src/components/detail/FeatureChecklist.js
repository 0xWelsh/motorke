"use client";

// src/components/detail/FeatureChecklist.js
import { useState } from "react";
import { Check } from "lucide-react";
import { buildFeatureItems } from "@/lib/car-detail-fields";

const INITIAL = 8;

/**
 * Features as a tick-list in two columns so a long equipment list stays a
 * compact block on a phone instead of a one-item-per-row wall. Collapses
 * behind "Show all" past eight items so the description and contact rail
 * stay reachable.
 */
export default function FeatureChecklist({ car, title = "Features", limit = 24 }) {
  const [showAll, setShowAll] = useState(false);
  const items = buildFeatureItems(car, limit);
  if (items.length === 0) return null;

  const visible = showAll ? items : items.slice(0, INITIAL);
  const hidden = items.length - INITIAL;

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-surface">
      <h2 className="px-4 pt-4 text-[15px] font-bold text-text sm:px-5 sm:pt-5">{title}</h2>

      <ul className="grid grid-cols-2 gap-x-3 gap-y-2.5 px-4 pb-5 pt-4 sm:gap-x-6 sm:px-5 lg:grid-cols-3">
        {visible.map((feature, i) => (
          <li
            key={`${feature}-${i}`}
            className="flex min-w-0 items-start gap-1.5 text-[13px] leading-snug text-secondary"
          >
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" strokeWidth={3} aria-hidden />
            <span className="min-w-0 break-words font-medium">{feature}</span>
          </li>
        ))}
      </ul>

      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setShowAll((s) => !s)}
          aria-expanded={showAll}
          className="flex w-full items-center justify-center gap-1.5 border-t border-subtle py-2.5 text-[11px] font-bold uppercase tracking-wider text-muted transition-colors hover:bg-surface-hover hover:text-text"
        >
          {showAll ? "Show less" : `Show all ${items.length} features`}
          <svg
            className={`h-3.5 w-3.5 transition-transform ${showAll ? "rotate-180" : ""}`}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            aria-hidden
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      )}
    </section>
  );
}