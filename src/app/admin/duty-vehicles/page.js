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
          className="text-xs font-medium text-muted hover:text-secondary"
        >
          ← Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-text mt-2">Duty CRSP catalog</h1>
        <p className="text-sm text-muted mt-2 leading-relaxed">
          Grow the import duty calculator search catalog. Use the starter CSV in the repo or build your own in Google
          Sheets. When you get official KRA CRSP figures from a clearing agent, paste them here and re-import.
        </p>
      </div>

      <AdminDutyCrspImport initialCount={catalogCount} />

      <div className="rounded-xl border border-white/[0.06] bg-[#1c1c1c] p-5 text-xs text-muted leading-relaxed">
        <p className="font-bold text-text mb-2">CLI import (production)</p>
        <pre className="bg-glass/[0.03] p-3 rounded-lg overflow-x-auto text-[11px]">
          npm run db:import-crsp{"\n"}
          npm run db:import-crsp -- data/duty-crsp/starter-catalog.csv
        </pre>
      </div>
    </div>
  );
}
