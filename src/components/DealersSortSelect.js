"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function DealersSortSelect({ hasLocation, defaultValue = "recommended" }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function onChange(e) {
    const next = new URLSearchParams(searchParams.toString());
    next.set("sort", e.target.value);
    router.push(`/dealers?${next.toString()}`);
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 whitespace-nowrap">
        Sort by
      </span>
      <select
        aria-label="Sort dealers"
        defaultValue={defaultValue}
        onChange={onChange}
        className="bg-slate-50 border border-slate-300 px-4 py-2.5 text-sm font-medium outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/25 transition-all appearance-none cursor-pointer text-slate-900"
        style={{ borderRadius: "var(--radius)" }}
      >
        <option value="recommended">Recommended</option>
        <option value="nearest" disabled={!hasLocation}>
          Nearest
        </option>
        <option value="active">Most active inventory</option>
        <option value="response">Best response rate</option>
      </select>
    </div>
  );
}
