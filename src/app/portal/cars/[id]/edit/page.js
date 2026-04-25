// src/app/portal/cars/[id]/edit/page.js
export const dynamic = "force-dynamic";
import { requireDealer } from "@/lib/auth";
import DeleteButton from "@/components/DeleteButton";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import CarForm from "@/components/CarForm";

export const metadata = { title: "Edit Car — Welsh Motors Portal" };

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
    <div className="animate-in fade-in duration-1000 max-w-4xl">
      <div className="mb-12">
        <a href="/portal" className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-700 hover:text-[#ff5a2f] transition-colors mb-6">
          <span className="text-lg">←</span> Back to Showroom
        </a>
        <h1 className="text-4xl font-black text-slate-950 tracking-tight">
          Modify Entry
        </h1>
        <p className="text-slate-700 font-medium mt-2 font-sans">
          {car.year} {car.make} {car.model} — System Ref: {car.id.slice(-8)}
        </p>
      </div>

      <CarForm
        dealers={dealers}
        car={car}
        action={`/api/portal/cars/${car.id}`}
        method="PUT"
      />

      {/* Danger zone */}
      <div className="mt-20 bg-rose-50/30 border border-rose-100 rounded-[2.5rem] p-10">
        <h3 className="text-lg font-black text-rose-600 tracking-tight mb-2 uppercase">Asset Decommissioning</h3>
        <p className="text-[11px] font-bold text-rose-400 mb-8 uppercase tracking-widest">
          Permanently remove this vehicle profile and associated lead data from the marketplace.
        </p>
        <div className="flex">
          <DeleteButton action={`/api/admin/cars/${car.id}/delete`} message="Permanently decommission this vehicle asset?" />
        </div>
      </div>
    </div>
  );
}
