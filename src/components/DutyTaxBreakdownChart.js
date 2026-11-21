"use client";

import { formatPrice } from "@/lib/utils";

const SEGMENTS = [
  { key: "importDuty", label: "Import duty", color: "bg-zinc-300" },
  { key: "excise", label: "Excise", color: "bg-zinc-500" },
  { key: "vat", label: "VAT (16%)", color: "bg-red-500" },
  { key: "idf", label: "IDF", color: "bg-[var(--accent)]" },
  { key: "rdl", label: "RDL", color: "bg-amber-400" },
];

export default function DutyTaxBreakdownChart({ breakdown }) {
  if (!breakdown) return null;

  const rows = SEGMENTS.map(({ key, label, color }) => ({
    key,
    label,
    color,
    value: Math.max(0, Number(breakdown[key]) || 0),
  })).filter((r) => r.value > 0);

  const total = rows.reduce((sum, r) => sum + r.value, 0) || 1;

  return (
    <div className="space-y-3" aria-label="Tax breakdown chart">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Tax mix</p>
      <div
        className="flex h-3 w-full overflow-hidden border border-border"
        style={{ borderRadius: "var(--radius)" }}
        role="img"
        aria-hidden
      >
        {rows.map((row) => (
          <div
            key={row.key}
            className={`${row.color} min-w-[2px] transition-all`}
            style={{ width: `${(row.value / total) * 100}%` }}
            title={`${row.label}: ${formatPrice(row.value)}`}
          />
        ))}
      </div>
      <ul className="grid grid-cols-2 sm:grid-cols-2 gap-x-4 gap-y-2">
        {rows.map((row) => (
          <li key={row.key} className="flex items-center gap-2 text-xs">
            <span className={`h-2.5 w-2.5 shrink-0 ${row.color}`} style={{ borderRadius: 2 }} aria-hidden />
            <span className="text-muted">{row.label}</span>
            <span className="ml-auto font-bold tabular-nums text-text">{formatPrice(row.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
