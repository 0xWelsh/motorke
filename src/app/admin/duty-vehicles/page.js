export const dynamic = "force-dynamic";

import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import AdminDutyCrspImport from "@/components/admin/AdminDutyCrspImport";
import Link from "next/link";

export const metadata = { title: "Duty CRSP catalog" };

export default async function AdminDutyVehiclesPage() {
  await requireAdmin();

  let catalogCount = 0;
  try {
    catalogCount = await db.dutyVehicle.count({ where: { active: true } });
  } catch {
    catalogCount = 0;
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link
          href="/admin"
          className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
        >
          ← Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">Duty CRSP catalog</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
          Grow the import duty calculator search catalog. Use the starter CSV in the repo or build your own in Google
          Sheets. When you get official KRA CRSP figures from a clearing agent, paste them here and re-import.
        </p>
      </div>

      <AdminDutyCrspImport initialCount={catalogCount} />

      <div className="rounded-xl border border-slate-200 bg-white p-5 text-xs text-slate-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-400 leading-relaxed">
        <p className="font-bold text-slate-900 dark:text-white mb-2">CLI import (production)</p>
        <pre className="bg-slate-50 dark:bg-zinc-900 p-3 rounded-lg overflow-x-auto text-[11px]">
          npm run db:import-crsp{"\n"}
          npm run db:import-crsp -- data/duty-crsp/starter-catalog.csv
        </pre>
      </div>
    </div>
  );
}
