// src/app/admin/cars/new/page.js
export const dynamic = "force-dynamic";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
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
    <div className="animate-in fade-in duration-700 w-full min-w-0 max-w-none">
      <div className="mb-4 sm:mb-6">
        <Link
          href="/admin/cars"
          className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 transition hover:text-[#2F855A] dark:text-zinc-400 dark:hover:text-emerald-400"
        >
          <span aria-hidden>←</span> All cars
        </Link>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          Add new car
        </h1>
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
