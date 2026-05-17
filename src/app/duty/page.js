import Link from "next/link";
import { db } from "@/lib/db";
import { dutyVehicleLabel } from "@/lib/duty-vehicle-slug";
import DutyPageClient from "@/components/DutyPageClient";
import DutyPageHero from "@/components/DutyPageHero";

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
      <div className="pt-16 md:pt-20">
        <DutyPageHero />
      </div>

      <div className="home-shell pb-16 sm:pb-20">
        <div className="max-w-6xl mx-auto">
          <DutyPageClient />

          {popular.length > 0 && (
            <div className="mt-12 pt-8 border-t border-slate-200 dark:border-zinc-800">
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
    </div>
  );
}
