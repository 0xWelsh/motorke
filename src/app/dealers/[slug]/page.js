// src/app/dealers/[slug]/page.js
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { formatPrice, formatMileage, FUEL_LABELS, BADGE_OPTIONS } from "@/lib/utils";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const dealer = await db.dealer.findUnique({ where: { slug } });
  if (!dealer) return {};
  return { title: `${dealer.name} — Motorke Kenya` };
}

export default async function DealerPage({ params }) {
  const { slug } = await params;

  const dealer = await db.dealer.findUnique({
    where:   { slug },
    include: {
      cars: {
        where:   { available: true },
        include: { images: { where: { isPrimary: true }, take: 1 } },
        orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      },
    },
  });

  if (!dealer) notFound();

  const makes = [...new Set(dealer.cars.map((c) => c.make))];

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Dealer header */}
      <div className="bg-white border border-slate-100 shadow-xl rounded-[2.5rem] p-10 mb-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--brand-accent)]/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        
        <div className="relative flex flex-col md:flex-row items-center md:items-start gap-10">
          <div className="w-32 h-32 rounded-3xl bg-slate-50 border border-slate-100 text-[var(--brand)] flex items-center justify-center font-black text-5xl shrink-0 shadow-sm overflow-hidden">
            {dealer.logoUrl ? (
              <img src={dealer.logoUrl} alt={dealer.name} className="w-full h-full object-cover" />
            ) : (
              dealer.name[0]
            )}
          </div>

          <div className="flex-1 text-center md:text-left min-w-0">
            <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
              <h1 className="font-black text-4xl text-slate-900 tracking-tight">{dealer.name}</h1>
              {dealer.verified && (
                <span className="text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full px-4 py-1.5 font-black uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Verified Partner
                </span>
              )}
            </div>

            <p className="text-slate-500 font-bold text-sm mb-6 flex items-center justify-center md:justify-start gap-2 uppercase tracking-wide">
              📍 {dealer.address || dealer.location}
            </p>

            {dealer.description && (
              <p className="text-slate-600 text-base leading-relaxed max-w-3xl mb-8 italic">
                "{dealer.description}"
              </p>
            )}

            <div className="flex flex-wrap justify-center md:justify-start gap-3">
              {dealer.phone && <a href={`tel:${dealer.phone}`} className="text-[11px] bg-slate-50 border border-slate-100 text-slate-600 hover:text-[var(--brand)] hover:border-[var(--brand-accent)]/20 px-6 py-3 rounded-2xl transition-all font-black uppercase tracking-[0.15em] shadow-sm">📞 Call</a>}
              {dealer.whatsapp && <a href={`https://wa.me/${dealer.whatsapp}`} target="_blank" rel="noopener noreferrer" className="text-[11px] bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100 px-6 py-3 rounded-2xl transition-all font-black uppercase tracking-[0.15em] shadow-sm">💬 WhatsApp</a>}
              {dealer.email && <a href={`mailto:${dealer.email}`} className="text-[11px] bg-slate-50 border border-slate-100 text-slate-600 hover:text-[var(--brand)] hover:border-[var(--brand-accent)]/20 px-6 py-3 rounded-2xl transition-all font-black uppercase tracking-[0.15em] shadow-sm">✉️ Email</a>}
            </div>
          </div>

          <div className="flex md:flex-col gap-4 w-full md:w-auto">
            {[{ v: dealer.cars.length, l: "Active Units" }, { v: makes.length, l: "Brands" }].map(({ v, l }) => (
              <div key={l} className="text-center bg-slate-50 border border-slate-100 rounded-[2rem] px-8 py-6 min-w-[140px] flex-1 md:flex-none shadow-sm">
                <p className="font-black text-4xl text-[var(--brand)] mb-1">{v.toString().padStart(2, '0')}</p>
                <p className="text-[9px] text-slate-400 uppercase tracking-[0.2em] font-black">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Makes pills */}
      {makes.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-12">
          {makes.map(make => (
            <span key={make} className="text-[10px] bg-slate-50 border border-slate-100 rounded-lg px-5 py-2.5 text-slate-500 font-black uppercase tracking-[0.2em] shadow-sm">
              {make}
            </span>
          ))}
        </div>
      )}

      {/* Cars grid */}
      <div className="flex items-center gap-4 mb-10">
        <h2 className="font-black text-3xl text-slate-900 tracking-tight">Dealer Inventory</h2>
        <div className="h-px flex-1 bg-slate-100" />
      </div>

      {dealer.cars.length === 0 ? (
        <div className="bg-slate-50 border-2 border-dashed border-slate-100 rounded-[3rem] p-32 text-center shadow-inner">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
             <span className="text-4xl grayscale opacity-30">🏢</span>
          </div>
          <p className="font-black text-slate-300 text-xl tracking-tight uppercase tracking-widest">No active showcases listed yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {dealer.cars.map((car) => {
            const img   = car.images[0]?.url;
            const title = `${car.make} ${car.model}${car.variant ? ` ${car.variant}` : ""}`;
            const specs = [
              car.fuelType && FUEL_LABELS[car.fuelType],
              car.transmission === "AUTOMATIC" ? "Auto" : car.transmission === "MANUAL" ? "Manual" : car.transmission,
              car.mileage ? `${Math.round(car.mileage / 1000)}k km` : null,
            ].filter(Boolean);

            return (
              <Link key={car.id} href={`/cars/${car.id}`} className="group block bg-white border border-slate-100 hover:border-[var(--brand-accent)]/30 overflow-hidden transition-all duration-500 rounded-3xl shadow-sm hover:shadow-xl">
                <div className="relative aspect-[16/10] bg-slate-50 overflow-hidden">
                  {img ? (
                    <img src={img} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300 text-[10px] font-bold uppercase tracking-widest">No Image</div>
                  )}
                  {car.badges?.length > 0 && (
                    <div className="absolute bottom-3 left-3 flex flex-wrap gap-1">
                      {car.badges.map((b) => (
                        <span key={b} className={`text-[9px] font-bold px-2 py-0.5 border ${BADGE_OPTIONS[b]?.color || "bg-white/10 text-white/60 border-white/10"}`}>
                          {b}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] font-black bg-[var(--brand-light)] text-[var(--brand)] px-2 py-0.5 uppercase tracking-wider shrink-0 rounded-md">{car.year}</span>
                    <h3 className="font-bold text-slate-800 text-sm leading-tight truncate group-hover:text-[var(--brand-accent)] transition-colors">{title}</h3>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {specs.map((s) => (
                      <span key={s} className="text-[10px] font-semibold text-slate-500 bg-slate-50 border border-slate-100 px-2 py-1 rounded-lg">{s}</span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-50 mt-auto">
                    <p className="text-lg font-black text-slate-900">{formatPrice(car.price)}</p>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-[var(--brand-accent)] transition-colors flex items-center gap-1">
                      View Offer <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
