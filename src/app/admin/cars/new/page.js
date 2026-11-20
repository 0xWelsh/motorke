export const dynamic = "force-dynamic";
import { requireAdmin } from "@/lib/auth";
import { getOrCreateInHouseDealer } from "@/lib/in-house-dealer";
import Link from "next/link";
import CarForm from "@/components/CarForm";

export const metadata = { title: "Add Car | Admin" };

export default async function AdminNewCarPage() {
  await requireAdmin();
  const dealer = await getOrCreateInHouseDealer();

  return (
    <div className="animate-in fade-in duration-700 w-full min-w-0 max-w-none">
      <div className="mb-4">
        <Link
          href="/admin/cars"
          className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-emerald-600 transition-colors"
        >
          ← All cars
        </Link>
        <h1 className="mt-1.5 text-lg font-bold text-slate-900 tracking-tight">
          Add new car
        </h1>
      </div>
      <CarForm dealers={[dealer]} action="/api/admin/cars" initialDealerId={dealer.id} />
    </div>
  );
}
