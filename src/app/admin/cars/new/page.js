// src/app/admin/cars/new/page.js
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import CarForm from "@/components/CarForm";

export const metadata = { title: "Add Car — Admin" };

export default async function AdminNewCarPage() {
  await requireAdmin();
  const dealers = await db.dealer.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <a href="/admin/cars" className="text-xs text-white/40 hover:text-white transition-colors">← All cars</a>
        <h1 className="text-3xl font-black mt-2">Add new car</h1>
      </div>
      <CarForm dealers={dealers} action="/api/admin/cars" />
    </div>
  );
}
