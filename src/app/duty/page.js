"use client";

import Link from "next/link";

export default function DutyCalculatorPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
      <div className="mx-auto max-w-3xl px-6 pt-36 pb-20 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-4">Welsh Motorhub</p>
        <h1 className="text-3xl sm:text-5xl font-bold text-slate-900 dark:text-white mb-5">Prices are final on listings</h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed mb-10">
          We now show final listed prices directly across the platform. Browse inventory and compare vehicles without extra pricing calculators.
        </p>
        <Link
          href="/cars"
          className="inline-flex items-center justify-center h-11 px-6 bg-[#111827] dark:bg-white text-white dark:!text-black text-xs font-bold uppercase tracking-widest"
          style={{ borderRadius: "var(--radius)" }}
        >
          Browse Cars
        </Link>
      </div>
    </div>
  );
}
