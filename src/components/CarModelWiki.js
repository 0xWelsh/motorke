import Link from "next/link";
import { BookOpen } from "lucide-react";
import { modelHubPath } from "@/lib/seo-model-wiki";
import { resolveDutyPathForCar } from "@/lib/seo-duty";

export default function CarModelWiki({ car, wiki }) {
  if (!wiki?.paragraphs?.length) return null;

  const hubHref = modelHubPath(car.make, car.model);
  const dutyPath = resolveDutyPathForCar(car);

  return (
    <section
      className="mt-10 sm:mt-12 border border-[#EDF2F7] dark:border-zinc-800 bg-white dark:bg-[#0a0a0a] rounded-2xl p-5 sm:p-8 shadow-sm"
      aria-labelledby="model-wiki-heading"
    >
      <div className="flex items-start gap-3 mb-4">
        <span
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#38A169]/10 text-[#38A169]"
          aria-hidden
        >
          <BookOpen className="h-5 w-5" />
        </span>
        <div>
          <h2 id="model-wiki-heading" className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            {wiki.headline}
          </h2>
          <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
            {wiki.source === "curated"
              ? "Kenya buyer guide"
              : wiki.source === "listing"
                ? "About this listing"
                : "Listing buyer notes"}
          </p>
        </div>
      </div>

      <div className="space-y-3 text-sm sm:text-[15px] text-slate-600 dark:text-slate-300 leading-relaxed">
        {wiki.paragraphs.map((para) => (
          <p key={para.slice(0, 40)}>{para}</p>
        ))}
      </div>

      {wiki.bullets?.length > 0 ? (
        <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300 list-disc pl-5">
          {wiki.bullets.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}

      <p className="mt-5 text-[12px] text-slate-500 dark:text-slate-400">
        <Link href={hubHref} className="font-bold text-[#38A169] hover:underline">
          Browse all {car.make} {car.model} for sale in Kenya
        </Link>
        {", "}
        <Link href={dutyPath} className="font-bold text-[#38A169] hover:underline">
          Import duty calculator
        </Link>
      </p>
    </section>
  );
}
