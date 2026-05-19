import Image from "next/image";
import { CheckCircle2 } from "lucide-react";

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
    <section className="relative mb-6 sm:mb-8 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <Image
          src={MERCEDES_HERO}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[70%_center] scale-105 opacity-40 dark:opacity-25"
        />
      </div>

      <div className="hidden lg:block absolute inset-y-0 right-0 w-[min(50%,560px)] pointer-events-none" aria-hidden>
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
        className="absolute inset-0 pointer-events-none bg-gradient-to-br from-white via-white/92 to-white/75 dark:from-[#0a0a0a] dark:via-[#0a0a0a]/95 dark:to-[#0a0a0a]/88 lg:bg-gradient-to-r lg:from-white lg:via-white/90 lg:to-white/55 dark:lg:from-[#0a0a0a] dark:lg:via-[#0a0a0a]/95 dark:lg:to-transparent"
        aria-hidden
      />

      <div className="relative home-shell pt-2 pb-6 sm:pb-8 lg:pb-10">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl lg:max-w-[55%]">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-600 dark:text-red-500 mb-2">
              Kenya import decision engine
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-slate-900 dark:text-white mb-3 editorial-heading leading-[1.05]">
              Vehicle{" "}
              <span className="text-red-600 dark:text-red-500">duty calculator</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Instant KRA-style tax breakdown for popular imports — then browse matching verified dealer stock.
            </p>
            <ul className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-slate-600 dark:text-slate-400 mb-6">
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
          {children ? <div className="max-w-3xl">{children}</div> : null}
        </div>
      </div>
    </section>
  );
}
