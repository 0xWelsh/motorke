"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, EyeOff } from "lucide-react";
import {
  getActiveSeasonalPromo,
  seasonalPromoStorageKey,
} from "@/lib/seasonal-promo";

export default function SeasonalPromoModal() {
  const promo = getActiveSeasonalPromo();
  const [view, setView] = useState("open");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!promo) return;
    const key = seasonalPromoStorageKey(promo.id);
    try {
      const saved = window.localStorage.getItem(key);
      if (saved === "minimized" || saved === "dismissed") {
        setView(saved);
      } else {
        setView("open");
      }
    } catch {
      setView("open");
    }
    setReady(true);
  }, [promo]);

  if (!promo || !ready || view === "dismissed") return null;

  const persist = (next) => {
    setView(next);
    try {
      window.localStorage.setItem(seasonalPromoStorageKey(promo.id), next);
    } catch {
      /* ignore */
    }
  };

  const minimize = () => persist("minimized");

  if (view === "minimized") {
    return (
      <button
        type="button"
        onClick={() => persist("open")}
        className="fixed bottom-4 left-4 z-[10040] h-12 w-12 border border-[#38A169]/55 bg-[#1a3d2e] text-white shadow-[0_10px_24px_rgba(26,61,46,0.45)] transition-all hover:scale-[1.03] hover:bg-[#234d3a] active:scale-95 sm:bottom-6 sm:left-6 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden"
        aria-label={`Open ${promo.fabLabel} greeting`}
      >
        <Image src={promo.image} alt="" fill className="object-cover object-left" sizes="48px" />
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[10050] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300"
      role="dialog"
      aria-modal="true"
      aria-label={promo.alt}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
        aria-label="Minimize greeting"
        onClick={minimize}
      />

      <div className="relative z-10 w-full max-w-[min(100%,640px)] animate-in zoom-in-95 duration-300">
        <button
          type="button"
          onClick={minimize}
          className="absolute top-2 right-2 z-20 flex h-9 w-9 items-center justify-center border border-white/30 bg-[#111827]/90 text-white shadow-lg transition-colors hover:bg-[#ef3340] hover:border-[#ef3340]"
          aria-label="Close greeting"
        >
          <X className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => persist("dismissed")}
          className="absolute top-2 right-12 z-20 inline-flex h-9 items-center gap-1 border border-white/30 bg-[#111827]/90 px-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-white shadow-lg transition-colors hover:bg-slate-900"
          aria-label="Do not show this greeting again"
        >
          <EyeOff className="h-3.5 w-3.5" />
          Don't show again
        </button>

        <Link
          href={promo.href}
          onClick={() => minimize()}
          className="block overflow-hidden shadow-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38A169]"
        >
          <Image
            src={promo.image}
            alt={promo.alt}
            width={1402}
            height={1122}
            className="h-auto w-full"
            priority
            sizes="(max-width: 640px) 100vw, 640px"
          />
        </Link>
      </div>
    </div>
  );
}
