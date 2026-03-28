// src/app/dealers/page.js
import { db } from "@/lib/db";
import Link from "next/link";

export const metadata = { title: "Dealerships — Motorke Kenya" };

export default async function DealersPage() {
  const dealers = await db.dealer.findMany({
    include: { _count: { select: { cars: { where: { available: true } } } } },
    orderBy: [{ featured: "desc" }, { verified: "desc" }, { name: "asc" }],
  });

  const counties = [...new Set(dealers.map((d) => d.county))].sort();

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-10">
        <h1 className="text-4xl font-black mb-2">Dealerships</h1>
        <p className="text-white/40">{dealers.length} dealers across {counties.length} counties</p>
      </div>

      {counties.map((county) => {
        const countyDealers = dealers.filter((d) => d.county === county);
        return (
          <div key={county} className="mb-12">
            <h2 className="text-sm font-bold uppercase tracking-widest text-orange-500 mb-4">{county}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {countyDealers.map((dealer) => (
                <Link key={dealer.id} href={`/dealers/${dealer.slug}`}
                  className="card-hover flex gap-4 bg-surface border border-white/5 hover:border-orange-500/30 shadow-sm hover:shadow-xl rounded-2xl p-5 transition-all">
                  <div className="w-14 h-14 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-500 font-black text-xl flex-shrink-0">
                    {dealer.name[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-black text-white text-lg">{dealer.name}</h3>
                      {dealer.verified && (
                        <span className="text-[10px] bg-green-500/20 text-green-400 border border-green-500/30 rounded-full px-2 py-0.5">✓ Verified</span>
                      )}
                      {dealer.featured && (
                        <span className="text-[10px] bg-orange-500/20 text-orange-500 border border-orange-500/30 rounded-full px-2 py-0.5">⭐ Featured</span>
                      )}
                    </div>
                    <p className="text-sm text-white/40 mt-0.5">{dealer.location}</p>
                    {dealer.description && (
                      <p className="text-xs text-white/30 mt-1.5 line-clamp-2">{dealer.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-xs text-white/50">
                      <span className="text-orange-500 font-semibold">{dealer._count.cars} cars</span>
                      {dealer.phone && <span>📞 {dealer.phone}</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
