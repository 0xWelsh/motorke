import Image from "next/image";
import { CheckCircle2 } from "lucide-react";

export default function DutyPageHero({ compact = false }) {
  if (compact) {
    return null;
  }

  return (
    <section className="grid lg:grid-cols-[1fr_minmax(280px,420px)] gap-6 lg:gap-10 items-center mb-8 lg:mb-10">
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-600 dark:text-red-500 mb-2">
          Import duty estimator
        </p>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-3 editorial-heading leading-[1.05]">
          Kenya vehicle{" "}
          <span className="text-red-600 dark:text-red-500">duty calculator</span>
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl mb-4">
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

      <div
        className="relative w-full max-w-md mx-auto lg:max-w-none aspect-[5/4] sm:aspect-[4/3] rounded-lg overflow-hidden bg-black ring-1 ring-slate-200/10 dark:ring-zinc-800"
        aria-hidden
      >
        <Image
          src="/duty-calculator-hero.webp"
          alt="Illustration of a Mazda CX-5 with engine size, vehicle age, and fuel type used for import duty estimates"
          fill
          priority
          sizes="(max-width: 1024px) 90vw, 420px"
          className="object-contain object-center"
        />
      </div>
    </section>
  );
}
