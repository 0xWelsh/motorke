// src/app/portal/cars/[id]/edit/page.js
export const dynamic = "force-dynamic";
import { requireDealer } from "@/lib/auth";
import DeleteButton from "@/components/DeleteButton";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import CarForm from "@/components/CarForm";

export const metadata = { title: "Edit Car — Welsh Motorhub Portal" };

export default async function PortalEditCarPage({ params }) {
  const { id } = await params;
  const user = await requireDealer();

  const car = await db.car.findUnique({
    where:   { id: id },
    include: { images: { orderBy: { order: "asc" } } },
  });

  if (!car || car.dealerId !== user.dealerId) notFound();

  const dealers = [user.dealer];

  return (
    <div className="animate-in fade-in duration-700 w-full max-md:-mx-1">
      <div className="mb-4 sm:mb-6">
        <a
          href="/portal"
          className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-slate-700 hover:text-[#ff5a2f] transition-colors mb-2 sm:mb-6"
        >
          <span className="text-base sm:text-lg">←</span>
          <span className="truncate sm:whitespace-normal">Back</span>
        </a>
        <h1 className="text-xl sm:text-3xl font-black text-slate-950 dark:text-white tracking-tight leading-tight">Edit listing</h1>
        <p className="text-slate-700 dark:text-slate-300 font-medium mt-1 text-sm font-sans line-clamp-2 sm:line-clamp-none">
          {car.year} {car.make} {car.model} — Ref {car.id.slice(-8)}
        </p>
      </div>

      <CarForm
        key={car.id}
        dealers={dealers}
        car={car}
        action={`/api/portal/cars/${car.id}`}
        method="PUT"
      />

      {/* Danger zone */}
      <div className="mt-10 bg-rose-50/30 border border-rose-100 rounded-2xl p-6">
        <h3 className="text-lg font-black text-rose-600 tracking-tight mb-2 uppercase">Delete Listing</h3>
        <p className="text-[11px] font-bold text-rose-400 mb-8 uppercase tracking-widest">
          Permanently remove this vehicle and related lead data.
        </p>
        <div className="flex">
          <DeleteButton action={`/api/admin/cars/${car.id}/delete`} message="Permanently decommission this vehicle asset?" />
        </div>
      </div>
    </div>
  );
}
