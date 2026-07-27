"use client";

import Link from "next/link";
import { CheckCircle2, ArrowRight } from "lucide-react";
import TrackedLink from "@/components/TrackedLink";

export default function DutyPageHero({ compact = false, children = null }) {
  if (compact) {
    return null;
  }

  return (
    <section className="relative mb-0 overflow-hidden border-b border-slate-200 border-zinc-900 bg-red-50/70 bg-[#222222]">
      <div className="home-shell pt-2 pb-4 sm:pb-6 lg:pb-8">
        <div className="max-w-6xl mx-auto">
          <nav className="text-xs text-slate-500 mb-4" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-slate-900 hover:text-white font-medium">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span className="text-slate-800 text-slate-200">Duty calculator</span>
          </nav>

          <div className="max-w-2xl lg:max-w-[55%]">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-600 text-red-500 mb-2">
              Kenya import decision engine
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-slate-900 text-white mb-3 editorial-heading leading-[1.05]">
              Vehicle{" "}
              <span className="text-red-600 text-red-500">duty calculator</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-600 text-slate-300 leading-relaxed mb-4">
              Instant KRA-style tax breakdown for popular imports, then browse matching verified dealer stock.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 mb-5 max-w-xl">
              <TrackedLink
                href="/"
                eventName="duty_hero_home_click"
                className="h-11 sm:h-12 inline-flex items-center justify-center bg-white bg-[#1e1e1e] border border-slate-200 border-slate-800 text-[#111827] text-white px-4 text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all hover:border-slate-900 hover:border-white"
                style={{ borderRadius: "var(--radius)" }}
              >
                Home
              </TrackedLink>
              <TrackedLink
                href="/cars"
                eventName="duty_hero_inventory_click"
                className="h-11 sm:h-12 inline-flex items-center justify-center bg-[#38A169] hover:bg-[#2F855A] text-white px-4 text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all hover:scale-[0.98] active:scale-95"
                style={{ borderRadius: "var(--radius)" }}
              >
                Browse cars
              </TrackedLink>
              <Link
                href="#duty-calculator"
                className="h-11 sm:h-12 inline-flex items-center justify-center gap-1.5 bg-[#b91c1c] hover:bg-[#991b1b] text-white px-4 text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all hover:scale-[0.98] active:scale-95"
                style={{ borderRadius: "var(--radius)" }}
              >
                Calculate <ArrowRight className="w-3.5 h-3.5 shrink-0" aria-hidden />
              </Link>
            </div>

            <ul className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-slate-600 text-slate-400 mb-2">
              <li className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-hidden />
                Instant estimate
              </li>
              <li className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-hidden />
                KRA-style taxes
              </li>
              <li className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-hidden />
                8-year import eligibility check
              </li>
              <li className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-hidden />
                Verified dealer stock
              </li>
            </ul>
          </div>

          {children ? <div className="max-w-3xl mt-4 relative z-10">{children}</div> : null}
        </div>
      </div>
    </section>
  );
}
