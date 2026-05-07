// src/app/admin/cars/[id]/edit/page.js
export const dynamic = "force-dynamic";
import { requireAdmin } from "@/lib/auth";
import DeleteButton from "@/components/DeleteButton";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import CarForm from "@/components/CarForm";

export const metadata = { title: "Edit Car — Admin" };

export default async function AdminEditCarPage({ params }) {
  await requireAdmin();
  const resolvedParams = await params;
  const id = resolvedParams?.id;
  if (!id || typeof id !== "string") notFound();

  const [car, dealers] = await Promise.all([
    db.car.findUnique({
      where:   { id },
      include: { images: { orderBy: { order: "asc" } } },
    }),
    db.dealer.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!car) notFound();

  return (
    <div className="p-6 lg:p-8 w-full">
      <div className="mb-8">
        <a href="/admin/cars" className="text-xs text-white/40 hover:text-white transition-colors">← All cars</a>
        <h1 className="text-3xl font-black font-sans mt-2">
          Edit — {car.year} {car.make} {car.model}
        </h1>
      </div>

      <CarForm
        key={car.id}
        dealers={dealers}
        car={car}
        action={`/api/admin/cars/${car.id}`}
        method="PUT"
      />

      {/* Danger zone */}
      <div className="mt-8 bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
        <h3 className="font-bold text-red-400 mb-1">Danger zone</h3>
        <p className="text-xs text-white/30 mb-4">
          Permanently deletes this listing, all its photos, and all buyer enquiries. Cannot be undone.
        </p>
        <DeleteButton action={`/api/admin/cars/${car.id}/delete`} message="Delete this listing permanently?" label="Delete listing" />
      </div>
    </div>
  );
}
