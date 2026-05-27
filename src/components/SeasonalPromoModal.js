"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import {
  getActiveSeasonalPromo,
  seasonalPromoStorageKey,
} from "@/lib/seasonal-promo";

const HOMEPAGE_FAB_CLASS =
  "fixed z-50 flex h-14 w-14 items-center justify-center rounded-full overflow-hidden ring-2 ring-white/90 shadow-[0_8px_32px_rgba(26,61,46,0.4)] transition-all hover:scale-105 active:scale-95 dark:ring-zinc-900/80 bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-4 sm:bottom-6 sm:left-6";

export default function SeasonalPromoModal() {
  const pathname = usePathname() || "";
  const isHomepage = pathname === "/";
  const promo = getActiveSeasonalPromo();
  const [view, setView] = useState("open");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!promo) return;
    const key = seasonalPromoStorageKey(promo.id);
    try {
      const saved = window.localStorage.getItem(key);
      if (saved === "minimized") {
        setView("minimized");
      } else {
        setView("open");
      }
    } catch {
      setView("open");
    }
    setReady(true);
  }, [promo]);

  if (!promo || !ready || !isHomepage) return null;

  const mobileOnly = "lg:hidden";

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
        className={`${HOMEPAGE_FAB_CLASS} ${mobileOnly} animate-in fade-in slide-in-from-bottom-4 duration-500`}
        aria-label={`Open ${promo.fabLabel} greeting`}
      >
        <Image src={promo.image} alt="" fill className="object-cover object-center" sizes="56px" />
      </button>
    );
  }

  return (
    <div
      className={`fixed inset-0 z-[10050] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300 ${mobileOnly}`}
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
