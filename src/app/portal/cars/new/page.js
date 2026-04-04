// src/app/portal/cars/new/page.js
import { requireDealer } from "@/lib/auth";
import CarForm from "@/components/CarForm";

export const metadata = { title: "Add Car — Motorke Portal" };

export default async function PortalNewCarPage() {
  const user = await requireDealer();

  // Pass dealer as a single-item array so CarForm hides the dealer selector
  const dealers = [user.dealer];

  return (
    <div className="animate-in fade-in duration-1000 max-w-4xl">
      <div className="mb-12">
        <a href="/portal" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white hover:text-black transition-colors mb-6">
          <span className="text-lg">←</span> Back to Showroom
        </a>
        <h1 className="text-4xl font-black text-black tracking-tight">Expand Inventory</h1>
        <p className="text-black font-bold mt-2">
          Deploy a new vehicle to the marketplace. Ensure all technical specs are precise.
        </p>
      </div>
      <CarForm dealers={dealers} action="/api/portal/cars" />
    </div>
  );
}
