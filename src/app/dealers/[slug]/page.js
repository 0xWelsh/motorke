// src/app/dealers/[slug]/page.js
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
      <div className="bg-surface border border-white/5 shadow-2xl rounded-[2rem] p-8 mb-10">
        <div className="flex flex-col md:flex-row items-start gap-8">
          <div className="w-24 h-24 rounded-2xl bg-orange-500/20 text-orange-500 flex items-center justify-center font-black text-4xl shrink-0">
            {dealer.name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <h1 className="font-black text-3xl text-white">{dealer.name}</h1>
              {dealer.verified && (
                <span className="text-[11px] bg-green-500/20 text-green-400 border border-green-500/30 rounded-full px-3 py-1 font-bold uppercase tracking-widest">✓ Verified</span>
              )}
            </div>
            <p className="text-white/40 text-sm mb-4">📍 {dealer.address || dealer.location}</p>
            {dealer.description && <p className="text-white/60 text-sm leading-relaxed max-w-3xl mb-6">{dealer.description}</p>}
            <div className="flex flex-wrap gap-3 mt-4">
              {dealer.phone && <a href={`tel:${dealer.phone}`} className="text-[11px] bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 px-5 py-2.5 rounded-xl transition-all font-bold uppercase tracking-widest">📞 {dealer.phone}</a>}
              {dealer.whatsapp && <a href={`https://wa.me/${dealer.whatsapp}`} target="_blank" rel="noopener noreferrer" className="text-[11px] bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/30 hover:bg-[#25D366]/30 px-5 py-2.5 rounded-xl transition-all font-bold uppercase tracking-widest">💬 WhatsApp</a>}
              {dealer.email && <a href={`mailto:${dealer.email}`} className="text-[11px] bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 px-5 py-2.5 rounded-xl transition-all font-bold uppercase tracking-widest">✉️ {dealer.email}</a>}
            </div>
          </div>
          <div className="flex gap-4 w-full md:w-auto mt-6 md:mt-0">
            {[{ v: dealer.cars.length, l: "Units" }, { v: makes.length, l: "Brands" }].map(({ v, l }) => (
              <div key={l} className="text-center bg-background border border-white/5 rounded-2xl px-6 py-4 min-w-[100px] flex-1 md:flex-none">
                <p className="font-black text-3xl text-orange-500">{v}</p>
                <p className="text-[10px] text-white/30 uppercase tracking-widest mt-1 font-bold">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Makes pills */}
      {makes.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-10">
          {makes.map(make => (
            <span key={make} className="text-[10px] bg-white/5 border border-white/10 rounded-full px-5 py-2 text-white/50 font-black uppercase tracking-widest">{make}</span>
          ))}
        </div>
      )}

      {/* Cars grid */}
      <h2 className="font-black text-2xl text-white mb-8">Available Showcases</h2>

      {dealer.cars.length === 0 ? (
        <div className="bg-surface border border-white/5 border-dashed rounded-[3rem] p-24 text-center">
          <p className="text-7xl mb-6 opacity-50 grayscale">🏢</p>
          <p className="font-black text-white/40 text-xl tracking-tight">No showcases listed yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {dealer.cars.map((car) => {
            const img   = car.images[0]?.url;
            const title = `${car.make} ${car.model}${car.variant ? ` ${car.variant}` : ""}`;
            const specs = [
              car.fuelType && FUEL_LABELS[car.fuelType],
              car.transmission === "AUTOMATIC" ? "Auto" : car.transmission,
              car.mileage ? `${Math.round(car.mileage / 1000)}k km` : null,
            ].filter(Boolean);

            return (
              <Link key={car.id} href={`/cars/${car.id}`} className="group block bg-surface border border-white/5 hover:border-orange-500/30 overflow-hidden transition-all duration-300">
                <div className="relative aspect-[16/10] bg-white/5 overflow-hidden">
                  {img ? (
                    <img src={img} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/20 text-[10px] font-bold uppercase tracking-widest">No Image</div>
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
                <div className="p-4 flex flex-col gap-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] font-black bg-white/10 text-orange-400 px-2 py-0.5 uppercase tracking-wider shrink-0">{car.year}</span>
                    <h3 className="font-bold text-white text-sm leading-tight truncate group-hover:text-orange-500 transition-colors">{title}</h3>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {specs.map((s) => (
                      <span key={s} className="text-[10px] font-semibold text-white/50 bg-white/5 border border-white/5 px-2 py-0.5">{s}</span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-2.5 border-t border-white/5 mt-auto">
                    <p className="text-base font-black text-orange-500">{formatPrice(car.price)}</p>
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/30 group-hover:text-orange-500 transition-colors flex items-center gap-1">
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
