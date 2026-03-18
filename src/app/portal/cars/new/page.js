// src/app/portal/cars/new/page.js
import { requireDealer } from "@/lib/auth";
import CarForm from "@/components/CarForm";

export const metadata = { title: "Add Car — Motorke Portal" };

export default async function PortalNewCarPage() {
  const user = await requireDealer();

  // Pass dealer as a single-item array so CarForm hides the dealer selector
  const dealers = [user.dealer];

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <a href="/portal" className="text-xs text-white/40 hover:text-white transition-colors">
          ← My listings
        </a>
        <h1 className="text-3xl font-black mt-2">Add new car</h1>
        <p className="text-white/40 text-sm mt-1">
          Fill in the details and upload photos. Your listing goes live immediately.
        </p>
      </div>
      <CarForm dealers={dealers} action="/api/portal/cars" />
    </div>
  );
}
