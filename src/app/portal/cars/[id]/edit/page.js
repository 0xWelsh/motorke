// src/app/portal/cars/[id]/edit/page.js
import { requireDealer } from "@/lib/auth";
import DeleteButton from "@/components/DeleteButton";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import CarForm from "@/components/CarForm";

export const metadata = { title: "Edit Car — Motorke Portal" };

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
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <a href="/portal" className="text-xs text-white/40 hover:text-white transition-colors">
          ← My listings
        </a>
        <h1 className="text-3xl font-black mt-2">
          Edit — {car.year} {car.make} {car.model}
        </h1>
      </div>

      <CarForm
        dealers={dealers}
        car={car}
        action={`/api/portal/cars/${car.id}`}
        method="PUT"
      />

      {/* Danger zone */}
      <div className="mt-8 bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
        <h3 className="font-bold text-red-400 mb-1">Remove listing</h3>
        <p className="text-xs text-white/30 mb-4">
          Permanently removes this car and all enquiries. Cannot be undone.
        </p>
        <DeleteButton action={`/api/admin/cars/${car.id}/delete`} message="Delete this car permanently?" />
      </div>
    </div>
  );
}