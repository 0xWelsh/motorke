"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const CLUSTERS = [
  { label: "Under 500K", min: "", max: "500000" },
  { label: "Under 1M", min: "", max: "1000000" },
  { label: "1M – 2M", min: "1000000", max: "2000000" },
  { label: "2M – 5M", min: "2000000", max: "5000000" },
  { label: "5M – 8M", min: "5000000", max: "8000000" },
  { label: "Above 5M", min: "5000000", max: "" },
];

function BudgetFilterInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";

  const active = CLUSTERS.findIndex((c) => c.min === minPrice && c.max === maxPrice);

  function apply(cluster) {
    const p = new URLSearchParams(searchParams.toString());
    if (cluster.min) p.set("minPrice", cluster.min);
    else p.delete("minPrice");
    if (cluster.max) p.set("maxPrice", cluster.max);
    else p.delete("maxPrice");
    p.delete("page");
    const q = p.toString();
    router.push(q ? `/cars?${q}` : "/cars");
  }

  const chip = (label, isActive, onClick) => (
    <button
      key={label}
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-8 items-center px-3 text-[12px] font-bold transition-colors ${
        isActive
          ? "bg-accent text-white"
          : "border border-[var(--accent-dim)] bg-accent-wash text-accent hover:bg-accent-dim"
      }`}
      style={{ borderRadius: "999px" }}
    >
      {label}
    </button>
  );

  return (
    <div className="mb-4">
      <p className="mb-1.5 text-[11px] font-black uppercase tracking-widest text-dim">
        Budget
      </p>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        {chip("All budgets", active === -1, () => apply({ min: "", max: "" }))}
        {CLUSTERS.map((c, i) =>
          chip(c.label, active === i, () => apply(c))
        )}
      </div>
    </div>
  );
}

export default function CarsBudgetFilter() {
  return (
    <Suspense fallback={<div className="mb-4 h-10" />}>
      <BudgetFilterInner />
    </Suspense>
  );
}