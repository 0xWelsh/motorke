// src/app/admin/cars/new/page.js
export const dynamic = "force-dynamic";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import CarForm from "@/components/CarForm";

export const metadata = { title: "Add Car — Admin" };

export default async function AdminNewCarPage({ searchParams }) {
  await requireAdmin();
  const sp = await searchParams;
  const dealers = await db.dealer.findMany({ orderBy: { name: "asc" } });
  const raw = sp?.dealerId;
  const initialDealerId =
    typeof raw === "string" && raw.trim() && dealers.some((d) => d.id === raw.trim()) ? raw.trim() : null;

  return (
    <div className="p-6 lg:p-8 w-full">
      <div className="mb-8">
        <a href="/admin/cars" className="text-xs text-white/40 hover:text-white transition-colors">← All cars</a>
        <h1 className="text-3xl font-black mt-2">Add new car</h1>
        {initialDealerId ? (
          <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-zinc-400">
            Assigning to{" "}
            <span className="text-slate-800 dark:text-zinc-200">{dealers.find((d) => d.id === initialDealerId)?.name}</span>{" "}
            — change below if needed
          </p>
        ) : null}
      </div>
      <CarForm dealers={dealers} action="/api/admin/cars" initialDealerId={initialDealerId} />
    </div>
  );
}
