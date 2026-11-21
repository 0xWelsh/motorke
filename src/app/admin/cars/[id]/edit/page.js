export const dynamic = "force-dynamic";
import { requireAdmin } from "@/lib/auth";
import DeleteButton from "@/components/DeleteButton";
import { db } from "@/lib/db";
import { getOrCreateInHouseDealer } from "@/lib/in-house-dealer";
import { notFound } from "next/navigation";
import CarForm from "@/components/CarForm";
import Link from "next/link";

export const metadata = { title: "Edit Car | Admin" };

export default async function AdminEditCarPage({ params }) {
  await requireAdmin();
  const resolvedParams = await params;
  const id = resolvedParams?.id;
  if (!id || typeof id !== "string") notFound();

  const [car, dealer] = await Promise.all([
    db.car.findUnique({
      where: { id },
      include: { images: { orderBy: { order: "asc" } } },
    }),
    getOrCreateInHouseDealer(),
  ]);

  if (!car) notFound();

  return (
    <div className="animate-in fade-in duration-700 w-full min-w-0 max-w-none space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/cars"
            className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-muted hover:text-emerald-600 transition-colors"
          >
            ← All cars
          </Link>
          <h1 className="mt-1.5 text-lg font-bold text-text tracking-tight">
            Edit — {car.year} {car.make} {car.model}
          </h1>
        </div>
      </div>

      <CarForm
        key={car.id}
        dealers={[dealer]}
        car={car}
        action={`/api/admin/cars/${car.id}`}
        method="PUT"
      />

      {/* Danger zone */}
      <div className="rounded-lg border border-rose-800/40 bg-rose-950/15 p-4">
        <h3 className="text-sm font-bold text-rose-600 mb-1">Danger zone</h3>
        <p className="text-xs text-dim mb-3">
          Permanently deletes this listing, all its photos, and all buyer enquiries. Cannot be undone.
        </p>
        <DeleteButton
          action={`/api/admin/cars/${car.id}/delete`}
          message="Delete this listing permanently?"
          label="Delete listing"
        />
      </div>
    </div>
  );
}
