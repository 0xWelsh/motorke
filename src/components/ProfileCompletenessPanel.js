"use client";

import { useMemo, useState } from "react";

export default function ProfileCompletenessPanel({
  title = "Profile completeness",
  items = [],
  missingFieldIds = [],
}) {
  const [highlighting, setHighlighting] = useState(false);

  const { completed, total, percent, missingLabels } = useMemo(() => {
    const totalItems = items.length || 1;
    const done = items.filter((item) => item.done).length;
    const value = Math.round((done / totalItems) * 100);
    return {
      completed: done,
      total: totalItems,
      percent: value,
      missingLabels: items.filter((item) => !item.done).map((item) => item.label),
    };
  }, [items]);

  function highlightMissingFields() {
    if (!missingFieldIds.length) return;
    setHighlighting(true);
    let scrolled = false;
    missingFieldIds.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.classList.add("ring-2", "ring-amber-400", "ring-offset-2", "ring-offset-[var(--bg)]");
      if (!scrolled) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        scrolled = true;
      }
      setTimeout(() => {
        el.classList.remove("ring-2", "ring-amber-400", "ring-offset-2", "ring-offset-[var(--bg)]");
      }, 2800);
    });
    setTimeout(() => setHighlighting(false), 1200);
  }

  return (
    <div className="mb-6 rounded-xl border border-border bg-surface p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="text-[11px] font-black uppercase tracking-widest text-muted">{title}</p>
        <p className="text-xs font-bold text-muted">
          {percent}% complete
        </p>
      </div>
      <div className="h-2 w-full bg-surface-overlay mb-3">
        <div className="h-2 bg-[var(--accent)] transition-all" style={{ width: `${percent}%` }} />
      </div>
      <p className="text-[11px] font-semibold text-muted mb-3">
        {completed}/{total} core profile fields completed
      </p>
      {missingLabels.length > 0 ? (
        <p className="text-xs text-muted mb-3">
          Missing: {missingLabels.join(", ")}
        </p>
      ) : (
        <p className="text-xs text-[var(--accent)] font-semibold mb-3">All core fields are complete.</p>
      )}
      <button
        type="button"
        onClick={highlightMissingFields}
        disabled={!missingFieldIds.length || highlighting}
        className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest border border-border bg-surface text-secondary hover:bg-surface-overlay disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {highlighting ? "Highlighting..." : "Highlight Missing Fields"}
      </button>
    </div>
  );
}
