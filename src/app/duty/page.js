import DutyCalculator from "@/components/DutyCalculator";
import Link from "next/link";
import { db } from "@/lib/db";
import { dutyVehicleLabel } from "@/lib/duty-vehicle-slug";

export const dynamic = "force-dynamic";

export default async function DutyCalculatorPage() {
  let popular = [];
  try {
    popular = await db.dutyVehicle.findMany({
      where: { active: true },
      orderBy: [{ year: "desc" }, { make: "asc" }],
      take: 8,
    });
  } catch {
    /* table may not exist until migrate + seed */
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
      <div className="mx-auto max-w-3xl px-6 pt-28 sm:pt-36 pb-20">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-600 dark:text-red-500 mb-3">
          Import duty estimator
        </p>
        <h1 className="text-3xl sm:text-5xl font-bold text-slate-900 dark:text-white mb-4 editorial-heading">
          Kenya vehicle duty calculator
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed mb-10">
          Search a common import, see an indicative KRA-style tax breakdown, then browse matching stock on Welsh
          Motorhub.
        </p>

        <DutyCalculator />

        {popular.length > 0 && (
          <div className="mt-14 pt-10 border-t border-slate-200 dark:border-zinc-800">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-4">Popular estimates</h2>
            <ul className="flex flex-wrap gap-2">
              {popular.map((v) => (
                <li key={v.id}>
                  <Link
                    href={`/duty/${v.slug}`}
                    className="inline-block px-3 py-2 text-xs font-semibold border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-slate-200 hover:border-slate-900 dark:hover:border-white transition-colors"
                    style={{ borderRadius: "var(--radius)" }}
                  >
                    {dutyVehicleLabel(v)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
