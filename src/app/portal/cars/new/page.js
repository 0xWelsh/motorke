// src/app/portal/cars/new/page.js
import { requireDealer } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import CarForm from "@/components/CarForm";

export const metadata = { title: "Add Car — Motorke Portal" };

export default async function PortalNewCarPage({ searchParams }) {
  const user = await requireDealer();
  const sp = await searchParams;
  const cloneId = sp?.clone || "";

  if (!user.dealerId || !user.dealer) {
    return (
      <div className="max-w-3xl rounded-2xl border border-amber-200 bg-amber-50 px-6 py-8">
        <h1 className="text-2xl font-black text-amber-900 tracking-tight">Dealer Setup Required</h1>
        <p className="mt-2 text-sm font-semibold text-amber-800">
          Your account is marked as dealer, but no dealer profile is linked yet. Please complete dealer profile setup first.
        </p>
        <a href="/portal/profile" className="mt-5 inline-flex rounded-xl bg-amber-600 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white">
          Open Profile Setup
        </a>
      </div>
    );
  }

  const [recentCars, templateCar] = await Promise.all([
    db.car.findMany({
      where: { dealerId: user.dealerId },
      select: {
        id: true,
        year: true,
        make: true,
        model: true,
        variant: true,
        images: { where: { isPrimary: true }, take: 1, select: { url: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    cloneId
      ? db.car.findFirst({
          where: { id: cloneId, dealerId: user.dealerId },
          include: { images: { orderBy: { order: "asc" } }, dealer: true },
        })
      : null,
  ]);

  // Pass dealer as a single-item array so CarForm hides the dealer selector
  const dealers = [user.dealer];

  return (
    <div className="animate-in fade-in duration-1000 max-w-4xl">
      <div className="mb-12">
        <a href="/portal" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-600 transition-colors mb-6">
          <span className="text-lg">←</span> Back to Showroom
        </a>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Add Car</h1>
        <p className="text-slate-500 font-bold mt-2">
          Fast upload mode is enabled by default. You can publish quickly and refine later.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <a href="/portal/cars/bulk" className="inline-flex rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-black uppercase tracking-wider text-slate-700 hover:bg-slate-50">
            Bulk Upload CSV
          </a>
          {templateCar && (
            <a href="/portal/cars/new" className="inline-flex rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-black uppercase tracking-wider text-emerald-700">
              Using Duplicate Template
            </a>
          )}
        </div>
      </div>

      {recentCars.length > 0 && (
        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Duplicate From Existing Listing</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            {recentCars.map((car) => (
              <Link key={car.id} href={`/portal/cars/new?clone=${car.id}`} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 hover:bg-slate-50">
                <div className="h-14 w-20 overflow-hidden rounded-lg bg-slate-100">
                  {car.images[0]?.url ? (
                    <img src={car.images[0].url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] font-bold uppercase tracking-wider text-slate-500">No Image</div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{car.year} {car.make} {car.model}</p>
                  <p className="text-xs font-semibold text-slate-500">{car.variant || "Standard"}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <CarForm dealers={dealers} car={templateCar} action="/api/portal/cars" method="POST" />
    </div>
  );
}
