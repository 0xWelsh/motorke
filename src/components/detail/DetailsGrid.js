"use client";

// src/components/detail/DetailsGrid.js
import { useState } from "react";
import { buildDetailFieldRows } from "@/lib/car-detail-fields";

/**
 * Marketplace-style details grid: uppercase micro-labels over bold values,
 * flowing across columns instead of a dense two-column table. Two columns on
 * a phone so the always-open rows stay above the fold. Secondary rows stay
 * behind "Show all" so sparse listings don't open as a wall of "—".
 */
export default function DetailsGrid({ car, title = "Details" }) {
  const [showAll, setShowAll] = useState(false);
  const { primary, secondary } = buildDetailFieldRows(car);
  const visible = showAll ? [...primary, ...secondary] : primary;
  const hiddenCount = secondary.length;

  if (visible.length === 0) return null;

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex items-center justify-between gap-3 px-4 pt-4 sm:px-5 sm:pt-5">
        <h2 className="text-[15px] font-bold text-text">{title}</h2>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-4 px-4 pb-5 pt-4 sm:grid-cols-3 sm:px-5 lg:grid-cols-4 xl:grid-cols-5">
        {visible.map((row, i) => (
          <div key={`${row.label}-${i}`} className="min-w-0">
            <p className="text-[9px] font-bold uppercase leading-tight tracking-[0.08em] text-dim">
              {row.label}
            </p>
            <p className="mt-0.5 break-words text-[13px] font-bold leading-snug text-[var(--accent)]">
              {row.value}
            </p>
          </div>
        ))}
      </div>

      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setShowAll((s) => !s)}
          aria-expanded={showAll}
          className="flex w-full items-center justify-center gap-1.5 border-t border-subtle py-2.5 text-[11px] font-bold uppercase tracking-wider text-muted transition-colors hover:bg-surface-hover hover:text-text"
        >
          {showAll ? "Show less" : `Show all ${primary.length + hiddenCount} details`}
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