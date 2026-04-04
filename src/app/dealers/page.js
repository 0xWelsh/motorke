// src/app/dealers/page.js
export const dynamic = "force-dynamic";
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
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-6 py-16 max-w-7xl">
        <div className="mb-16">
          <div className="flex items-center gap-2 mb-2">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Verified Network</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Motorske Dealerships</h1>
          <p className="text-slate-500 font-medium mt-1">Connecting you with {dealers.length} trusted partners across {counties.length} counties.</p>
        </div>
        {counties.map((county) => {
          const countyDealers = dealers.filter((d) => d.county === county);
          return (
            <div key={county} className="mb-20 last:mb-0">
            <div className="flex items-center gap-4 mb-8">
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-[var(--brand)] whitespace-nowrap">{county} Region</h2>
              <div className="h-px w-full bg-slate-100" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {countyDealers.map((dealer) => (
                <Link key={dealer.id} href={`/dealers/${dealer.slug}`}
                  className="group relative flex flex-col bg-white border border-slate-100 hover:border-[var(--brand-accent)]/30 shadow-sm hover:shadow-xl rounded-[2rem] p-8 transition-all duration-500">
                  
                  {/* Card Header: Logo/Initials + Verified/Featured */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shadow-sm transition-transform group-hover:scale-110">
                      {dealer.logoUrl ? (
                         <img src={dealer.logoUrl} alt={dealer.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[var(--brand)] font-black text-2xl">{dealer.name[0]}</span>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-end gap-1.5">
                      {dealer.verified && (
                        <span className="text-[9px] bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full px-2.5 py-1 font-black uppercase tracking-wider flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Verified
                        </span>
                      )}
                      {dealer.featured && (
                        <span className="text-[9px] bg-amber-50 text-amber-600 border border-amber-100 rounded-full px-2.5 py-1 font-black uppercase tracking-wider">
                          ⭐ Featured
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-black text-slate-900 text-xl group-hover:text-[var(--brand)] transition-colors line-clamp-1">{dealer.name}</h3>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1.5 mb-4">📍 {dealer.location}</p>
                    
                    {dealer.description && (
                      <p className="text-sm text-slate-500 leading-relaxed line-clamp-2 mb-6 h-10 italic">
                        "{dealer.description}"
                      </p>
                    )}

                    {/* Stats & Info */}
                    <div className="flex items-center justify-between pt-6 border-t border-slate-50 mt-auto">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                           <span className="text-[var(--brand)] font-black text-lg">{dealer._count.cars}</span>
                           <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Active Units</span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                         <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 group-hover:text-[var(--brand-accent)] transition-colors">
                           View Profile →
                         </span>
                      </div>
                    </div>
                  </div>

                  {/* Decorative Glow */}
                  <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-[var(--brand-accent)]/0 to-[var(--brand-accent)]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                </Link>
              ))}
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}
