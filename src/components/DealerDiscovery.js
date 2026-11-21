"use client";
import { ShieldCheck, ChevronRight, MapPin, Store } from "lucide-react";
import Link from "next/link";

export default function DealerDiscovery({ dealers }) {
  return (
    <section className="container mx-auto px-6 py-20 max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div className="space-y-2">
          <h2 className="text-3xl md:text-4xl font-extrabold text-text tracking-tight">Verified Partnerships</h2>
          <p className="text-lg text-muted font-medium">Browse inventory from Kenya's most trusted automotive hubs.</p>
        </div>
        <Link href="/dealers" className="text-sm font-extrabold uppercase tracking-widest text-brand flex items-center gap-2 hover:text-brand-accent transition-colors">
          View All Dealerships <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {dealers.map((dealer) => (
          <Link key={dealer.id} href={`/dealers/${dealer.slug}`}
            className="group bg-surface border border-border rounded-xl p-8 transition-all duration-300 hover:shadow-xl hover:border-brand-accent/30 flex flex-col items-center text-center">
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-3xl bg-surface-hover border border-border flex items-center justify-center text-brand font-black text-2xl group-hover:scale-110 transition-transform duration-500 shadow-sm">
                {dealer.logoUrl ? (
                  <img src={dealer.logoUrl} alt={dealer.name} className="w-full h-full object-contain p-2" />
                ) : (
                  dealer.name[0]
                )}
              </div>
              {dealer.verified && (
                <div className="absolute -bottom-1 -right-1 bg-surface rounded-2xl p-1 shadow-md">
                  <ShieldCheck className="w-5 h-5 text-[var(--accent)] fill-[var(--accent)]" />
                </div>
              )}
            </div>

            <h3 className="text-lg font-extrabold text-text mb-1 group-hover:text-brand transition-colors line-clamp-1">{dealer.name}</h3>
            <p className="text-xs text-muted font-bold flex items-center gap-1.5 mb-6 uppercase tracking-widest">
              <MapPin className="w-3 h-3" /> {dealer.location}
            </p>

            <div className="mt-auto w-full grid grid-cols-2 gap-2">
               <div className="bg-surface-hover rounded-2xl py-3 px-2">
                  <p className="text-lg font-black text-muted leading-none mb-1">{dealer._count?.cars || 0}</p>
                  <p className="text-[9px] font-extrabold text-muted uppercase tracking-widest">Live Units</p>
               </div>
               <div className="bg-brand-light rounded-2xl py-3 px-2 flex flex-col items-center justify-center group-hover:bg-brand group-hover:text-white transition-colors">
                  <Store className="w-4 h-4 mb-1" />
                  <p className="text-[9px] font-extrabold uppercase tracking-widest">Visit Yard</p>
               </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
