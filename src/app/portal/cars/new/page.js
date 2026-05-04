// src/app/portal/cars/new/page.js
import { requireDealer } from "@/lib/auth";
import Link from "next/link";
import CarForm from "@/components/CarForm";

export const metadata = { title: "Add Car — Welsh Motorhub Portal" };

export default async function PortalNewCarPage() {
  const user = await requireDealer();

  if (!user.dealerId || !user.dealer) {
    return (
      <div className="max-w-3xl rounded-2xl border border-amber-200 bg-amber-50 px-6 py-8">
        <h1 className="text-2xl font-black text-amber-900 tracking-tight">Dealer Setup Required</h1>
        <p className="mt-2 text-[11px] uppercase font-black tracking-[0.10em] font-semibold text-amber-800">
          Your account is marked as dealer, but no dealer profile is linked yet. Please complete dealer profile setup first.
        </p>
        <a href="/portal/profile" className="mt-5 inline-flex rounded-2xl bg-amber-600 px-5 py-2.5 text-[11px] uppercase font-black tracking-[0.15em] font-black uppercase tracking-wider text-slate-900 dark:text-white">
          Open Profile Setup
        </a>
      </div>
    );
  }

  const dealers = [user.dealer];

  return (
    <div className="animate-in fade-in duration-700 w-full">
      <div className="mb-4 sm:mb-6">
        <a href="/portal" className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-700 hover:text-[#ff5a2f] transition-colors mb-4">
          <span className="text-lg">←</span> Back to Showroom
        </a>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Add car</h1>
        <p className="text-sm text-slate-600 font-medium mt-1">Fill in the listing below — every field is yours to edit.</p>
        <div className="mt-4">
          <Link
            href="/portal/cars/bulk"
            className="inline-flex rounded-xl border border-[#ddd4c8] dark:border-slate-800 px-3 py-2 text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-700 hover:bg-[#fbfcfe] dark:hover:bg-[#111111]"
          >
            Bulk upload CSV
          </Link>
        </div>
      </div>

      <CarForm dealers={dealers} car={null} action="/api/portal/cars" method="POST" />
    </div>
  );
}
