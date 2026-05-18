"use client";

import { useState } from "react";
import { AlertTriangle, ChevronDown } from "lucide-react";
import ClearAllButton from "@/components/ClearAllButton";

export default function AdminCarsDangerZone() {
  const [open, setOpen] = useState(false);

  return (
    <section className="mb-6 overflow-hidden rounded-2xl border-2 border-rose-200 bg-gradient-to-b from-rose-50 to-white dark:border-rose-900/60 dark:from-rose-950/40 dark:to-[#111111]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left sm:px-5"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2.5 min-w-0">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
            <AlertTriangle size={18} strokeWidth={2.25} aria-hidden />
          </span>
          <span>
            <span className="block text-[10px] font-black uppercase tracking-[0.14em] text-rose-700 dark:text-rose-400">
              Danger zone
            </span>
            <span className="block text-xs font-medium text-rose-900/80 dark:text-rose-200/80">
              Destructive actions — tap to expand
            </span>
          </span>
        </span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-rose-600 transition-transform dark:text-rose-400 ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {open ? (
        <div className="border-t border-rose-200/80 px-4 pb-4 pt-3 dark:border-rose-900/50 sm:px-5">
          <p className="mb-3 text-xs leading-relaxed text-rose-900/90 dark:text-rose-100/80">
            Clearing removes every listing, photo, and related data from the platform. Per-row delete is
            available on each vehicle. This cannot be undone.
          </p>
          <ClearAllButton />
        </div>
      ) : null}
    </section>
  );
}
