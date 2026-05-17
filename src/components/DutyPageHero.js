import Image from "next/image";
import { CheckCircle2 } from "lucide-react";

const MERCEDES_HERO = "/images/mercedes.jpg";

export default function DutyPageHero({ compact = false }) {
  if (compact) {
    return null;
  }

  return (
    <section className="relative mb-10 lg:mb-12 overflow-hidden">
      {/* Ambient blurred wash — reads well at any viewport */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <Image
          src={MERCEDES_HERO}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[62%_center] scale-110 blur-2xl opacity-35 dark:opacity-25"
        />
      </div>

      {/* Desktop: sharper Mercedes panel on the right */}
      <div className="hidden lg:block absolute inset-y-0 right-0 w-[min(46%,520px)] pointer-events-none" aria-hidden>
        <Image
          src={MERCEDES_HERO}
          alt=""
          fill
          sizes="520px"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/55 to-transparent dark:from-[#0a0a0a] dark:via-[#0a0a0a]/70 dark:to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-white/30 via-transparent to-white/20 dark:from-[#0a0a0a]/40 dark:to-[#0a0a0a]/25" />
      </div>

      {/* Readability overlays */}
      <div
        className="absolute inset-0 pointer-events-none bg-gradient-to-br from-white/95 via-white/88 to-white/72 dark:from-[#0a0a0a]/96 dark:via-[#0a0a0a]/90 dark:to-[#0a0a0a]/78 lg:bg-gradient-to-r lg:from-white/96 lg:via-white/88 lg:to-white/50 dark:lg:from-[#0a0a0a]/97 dark:lg:via-[#0a0a0a]/92 dark:lg:to-[#0a0a0a]/55"
        aria-hidden
      />
      <div
        className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_15%_40%,rgba(220,38,38,0.07),transparent_50%)] dark:bg-[radial-gradient(ellipse_at_15%_40%,rgba(220,38,38,0.12),transparent_55%)]"
        aria-hidden
      />

      <div className="relative home-shell py-10 sm:py-12 lg:py-14">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl lg:max-w-[52%]">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-600 dark:text-red-500 mb-2">
              Import duty estimator
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-3 editorial-heading leading-[1.05]">
              Kenya vehicle{" "}
              <span className="text-red-600 dark:text-red-500">duty calculator</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Search by make and model for a KRA-style breakdown of IDF, excise, VAT, and levies — then jump to matching
              verified stock on Welsh Motorhub.
            </p>
            <ul className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <li className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500 shrink-0" aria-hidden />
                Up-to-date tax rates
              </li>
              <li className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500 shrink-0" aria-hidden />
                Instant estimate
              </li>
              <li className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500 shrink-0" aria-hidden />
                KRA-style breakdown
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
