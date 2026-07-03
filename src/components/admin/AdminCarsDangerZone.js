"use client";

import { useState } from "react";
import { AlertTriangle, ChevronDown } from "lucide-react";
import ClearAllButton from "@/components/ClearAllButton";

export default function AdminCarsDangerZone() {
  const [open, setOpen] = useState(false);

  return (
    <section className="overflow-hidden rounded-lg border border-rose-900/60 bg-rose-950/20">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2.5 min-w-0">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-rose-950 text-rose-400">
            <AlertTriangle size={14} />
          </span>
          <span>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-rose-400">
              Danger zone
            </span>
            <span className="block text-[11px] text-rose-300/70">
              Destructive actions — tap to expand
            </span>
          </span>
        </span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-rose-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? (
        <div className="border-t border-rose-900/50 px-4 pb-3 pt-3">
          <p className="mb-3 text-xs leading-relaxed text-rose-200/80">
            Clearing removes every listing, photo, and related data from the platform. Per-row delete is
            available on each vehicle. This cannot be undone.
          </p>
          <ClearAllButton />
        </div>
      ) : null}
    </section>
  );
}
