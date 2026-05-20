"use client";

import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, ArrowRight } from "lucide-react";
import TrackedLink from "@/components/TrackedLink";

const MERCEDES_HERO = "/images/mercedes.jpg";

const FLOATING_CARDS = [
  { label: "Import duty", value: "Est. KES 1.2M+" },
  { label: "VAT (16%)", value: "On CIF + excise" },
  { label: "IDF", value: "2.5% of CIF" },
  { label: "Excise", value: "By engine CC" },
];

export default function DutyPageHero({ compact = false, children = null }) {
  if (compact) {
    return null;
  }

  return (
    <section className="relative mb-0 overflow-hidden border-b border-slate-100 dark:border-zinc-900">
      <div className="absolute inset-0 pointer-events-none z-0" aria-hidden>
        <Image
          src={MERCEDES_HERO}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[70%_center] scale-105 opacity-40 dark:opacity-25"
        />
      </div>

      <div className="hidden lg:block absolute inset-y-0 right-0 w-[min(50%,560px)] pointer-events-none z-0" aria-hidden>
        <Image
          src={MERCEDES_HERO}
          alt=""
          fill
          sizes="560px"
          className="object-cover object-center opacity-95 dark:opacity-80 contrast-[1.05]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/70 to-transparent dark:from-[#0a0a0a] dark:via-[#0a0a0a]/80 dark:to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-white/40 via-transparent to-transparent dark:from-[#0a0a0a]/60" />
        <ul className="absolute bottom-8 right-6 space-y-2 w-44">
          {FLOATING_CARDS.map((card) => (
            <li
              key={card.label}
              className="px-3 py-2 border border-white/20 bg-black/55 backdrop-blur-sm text-white shadow-lg"
              style={{ borderRadius: "var(--radius)" }}
            >
              <p className="text-[9px] font-bold uppercase tracking-widest text-red-300">{card.label}</p>
              <p className="text-xs font-semibold mt-0.5 tabular-nums">{card.value}</p>
            </li>
          ))}
        </ul>
      </div>

      <div
        className="absolute inset-0 pointer-events-none z-0 bg-gradient-to-br from-white via-white/92 to-white/75 dark:from-[#0a0a0a] dark:via-[#0a0a0a]/95 dark:to-[#0a0a0a]/88 lg:bg-gradient-to-r lg:from-white lg:via-white/90 lg:to-white/55 dark:lg:from-[#0a0a0a] dark:lg:via-[#0a0a0a]/95 dark:lg:to-transparent"
        aria-hidden
      />

      <div className="relative z-10 home-shell pt-2 pb-4 sm:pb-6 lg:pb-8">
        <div className="max-w-6xl mx-auto">
          <nav className="text-xs text-slate-500 mb-4" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-slate-900 dark:hover:text-white font-medium">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span className="text-slate-800 dark:text-slate-200">Duty calculator</span>
          </nav>

          <div className="max-w-2xl lg:max-w-[55%]">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-600 dark:text-red-500 mb-2">
              Kenya import decision engine
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-slate-900 dark:text-white mb-3 editorial-heading leading-[1.05]">
              Vehicle{" "}
              <span className="text-red-600 dark:text-red-500">duty calculator</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Instant KRA-style tax breakdown for popular imports, then browse matching verified dealer stock.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 mb-5 max-w-xl">
              <TrackedLink
                href="/"
                eventName="duty_hero_home_click"
                className="h-11 sm:h-12 inline-flex items-center justify-center bg-white dark:bg-[#111111] border border-slate-200 dark:border-slate-800 text-[#111827] dark:text-white px-4 text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all hover:border-slate-900 dark:hover:border-white"
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
                className="h-11 sm:h-12 inline-flex items-center justify-center gap-1.5 bg-slate-900 text-white dark:bg-[#f7f6f3] dark:text-[#0a0a0a] dark:border dark:border-zinc-600 px-4 text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all hover:opacity-90 dark:hover:bg-white"
                style={{ borderRadius: "var(--radius)" }}
              >
                Calculate <ArrowRight className="w-3.5 h-3.5 shrink-0" aria-hidden />
              </Link>
            </div>

            <ul className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
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
