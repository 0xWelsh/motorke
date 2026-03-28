// src/app/dealers/[slug]/page.js
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { formatPrice, formatMileage } from "@/lib/utils";
import Link from "next/link";

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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {dealer.cars.map((car) => {
            const img   = car.images[0]?.url;
            const title = `${car.year} ${car.make} ${car.model}`;
            return (
              <Link key={car.id} href={`/cars/${car.id}`} className="card-hover block group">
                <div className="relative aspect-[4/5] bg-surface border border-white/5 rounded-[2rem] overflow-hidden mb-6 shadow-sm group-hover:shadow-2xl transition-all duration-700">
                  {img ? (
                    <img src={img} alt={title} className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-[1.5s]" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/20 uppercase font-black text-[10px] tracking-[0.2em]">Pending Imagery</div>
                  )}
                  {/* Bottom Overlay Info */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  <div className="absolute bottom-6 left-6 right-6 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-700">
                     <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1">View Details</p>
                     <div className="h-px w-full bg-white/20" />
                  </div>
                </div>
                <div className="px-2">
                  <p className="font-black text-white text-lg leading-tight group-hover:text-orange-500 transition-colors truncate mb-1">{title}</p>
                  {car.variant && <p className="text-[10px] font-black text-white/40 uppercase tracking-widest truncate">{car.variant}</p>}
                  <div className="flex justify-between items-center mt-3 border-t border-white/5 pt-3">
                    <p className="font-black text-xl text-orange-500">{formatPrice(car.price)}</p>
                    {car.mileage && <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">{formatMileage(car.mileage).replace(' km', 'km')}</p>}
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
