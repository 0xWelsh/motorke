// src/app/dealers/[slug]/page.js
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { formatPrice, formatMileage, BODY_TYPE_LABELS } from "@/lib/utils";
import Link from "next/link";

export async function generateMetadata({ params }) {
  const dealer = await db.dealer.findUnique({ where: { slug: params.slug } });
  if (!dealer) return {};
  return { title: `${dealer.name} — Motorke Kenya` };
}

export default async function DealerPage({ params }) {
  const dealer = await db.dealer.findUnique({
    where:   { slug: params.slug },
    include: {
      cars: {
        where:   { available: true },
        include: { images: { where: { isPrimary: true }, take: 1 } },
        orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      },
    },
  });

  if (!dealer) notFound();

  const totalCars = dealer.cars.length;
  const makes     = [...new Set(dealer.cars.map((c) => c.make))];

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-8 mb-8">
        <div className="flex flex-wrap items-start gap-6">
          <div className="w-20 h-20 rounded-2xl bg-[#f97316]/20 flex items-center justify-center text-[#f97316] font-black text-3xl flex-shrink-0">
            {dealer.name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-3xl font-black">{dealer.name}</h1>
              {dealer.verified && (
                <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 rounded-full px-3 py-1">✓ Verified dealer</span>
              )}
            </div>
            <p className="text-white/50 mb-1">📍 {dealer.address || dealer.location}</p>
            {dealer.description && <p className="text-white/60 text-sm mt-2 max-w-2xl">{dealer.description}</p>}

            <div className="flex flex-wrap gap-4 mt-4 text-sm">
              {dealer.phone && (
                <a href={`tel:${dealer.phone}`} className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors">
                  📞 {dealer.phone}
                </a>
              )}
              {dealer.email && (
                <a href={`mailto:${dealer.email}`} className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors">
                  ✉️ {dealer.email}
                </a>
              )}
              {dealer.whatsapp && (
                <a href={`https://wa.me/${dealer.whatsapp}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/30 px-3 py-1 rounded-full hover:bg-[#25D366]/30 transition-colors text-xs font-semibold">
                  💬 WhatsApp
                </a>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-4 text-center">
            <div className="bg-white/5 rounded-xl p-4 min-w-[80px]">
              <p className="text-2xl font-black text-[#f97316]">{totalCars}</p>
              <p className="text-[10px] text-white/40 mt-1">Cars</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 min-w-[80px]">
              <p className="text-2xl font-black text-[#f97316]">{makes.length}</p>
              <p className="text-[10px] text-white/40 mt-1">Makes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Makes */}
      {makes.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {makes.map((make) => (
            <span key={make} className="text-xs bg-white/5 border border-white/10 text-white/50 rounded-full px-3 py-1">{make}</span>
          ))}
        </div>
      )}

      {/* Car grid */}
      <h2 className="text-xl font-black mb-5">Available inventory</h2>
      {dealer.cars.length === 0 ? (
        <p className="text-white/30 text-center py-20">No cars listed yet</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {dealer.cars.map((car) => {
            const img   = car.images[0]?.url;
            const title = `${car.year} ${car.make} ${car.model}`;
            return (
              <Link key={car.id} href={`/cars/${car.id}`}
                className="card-hover block bg-[#1a1a1a] border border-white/10 hover:border-[#f97316]/30 rounded-2xl overflow-hidden transition-all">
                <div className="relative aspect-[16/10] bg-white/5">
                  {img
                    ? <img src={img} alt={title} className="w-full h-full object-cover" />
                    : <div className="flex items-center justify-center h-full text-3xl">🚗</div>
                  }
                  {car.featured && (
                    <span className="absolute top-2 left-2 text-[9px] font-bold bg-[#f97316] text-white px-2 py-0.5 rounded-full uppercase">Featured</span>
                  )}
                </div>
                <div className="p-4">
                  <p className="font-bold text-sm">{title}</p>
                  {car.variant && <p className="text-xs text-white/40 mt-0.5 truncate">{car.variant}</p>}
                  <div className="flex justify-between items-center mt-3">
                    <p className="text-[#f97316] font-black">{formatPrice(car.price)}</p>
                    <p className="text-xs text-white/30">{formatMileage(car.mileage)}</p>
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
