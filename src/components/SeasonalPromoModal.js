"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Sparkles } from "lucide-react";
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
        className="fixed bottom-20 right-4 z-[10040] flex items-center gap-2 rounded-full border border-[#38A169]/50 bg-[#1a3d2e] px-2 py-2 pr-4 text-white shadow-[0_12px_32px_rgba(26,61,46,0.45)] transition-all hover:scale-[1.03] hover:bg-[#234d3a] active:scale-95 sm:bottom-6 sm:right-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
        aria-label={`Open ${promo.fabLabel} greeting`}
      >
        <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full ring-2 ring-[#d4af37]/60">
          <Image src={promo.image} alt="" fill className="object-cover object-left" sizes="44px" />
        </span>
        <span className="flex flex-col items-start leading-tight">
          <span className="text-[9px] font-black uppercase tracking-[0.14em] text-[#d4af37]">
            Welsh Motorhub
          </span>
          <span className="text-[11px] font-bold">{promo.fabLabel}</span>
        </span>
        <Sparkles className="h-4 w-4 text-[#d4af37] shrink-0" aria-hidden />
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
          className="absolute -top-2 -right-2 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-[#111827]/90 text-white shadow-lg transition-colors hover:bg-[#ef3340] hover:border-[#ef3340]"
          aria-label="Close greeting"
        >
          <X className="h-5 w-5" />
        </button>

        <Link
          href={promo.href}
          onClick={() => minimize()}
          className="block overflow-hidden rounded-2xl ring-1 ring-white/20 shadow-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38A169]"
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

        <p className="mt-3 text-center text-[11px] font-medium text-white/80">
          Tap the image to explore cars, or close to keep browsing.
        </p>
      </div>
    </div>
  );
}
