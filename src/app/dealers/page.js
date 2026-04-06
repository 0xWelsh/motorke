// src/app/dealers/page.js
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import Link from "next/link";
import { ArrowUpRight, Building2, CarFront, MapPin, ShieldCheck } from "lucide-react";

export const metadata = { title: "Dealerships — Motorke Kenya" };

export default async function DealersPage() {
  const dealers = await db.dealer.findMany({
    include: {
      _count: { select: { cars: { where: { available: true } } } },
      users: { select: { avatarUrl: true }, take: 1 },
    },
    orderBy: [{ featured: "desc" }, { verified: "desc" }, { name: "asc" }],
  });

  const counties = [...new Set(dealers.map((d) => d.county))].sort();
  const featuredCount = dealers.filter((d) => d.featured).length;
  const verifiedCount = dealers.filter((d) => d.verified).length;
  const totalCars = dealers.reduce((sum, dealer) => sum + (dealer._count?.cars || 0), 0);

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-6 py-12 max-w-7xl">
        <section className="rounded-[2rem] border border-[#e7e1d8] bg-white p-8 md:p-12 shadow-sm mb-12 relative overflow-hidden">
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-[#ff5a2f]/10 blur-3xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 mb-4 rounded-full border border-[#e7e1d8] px-3 py-1.5">
              <span className="h-2 w-2 rounded-full bg-[#ff5a2f] animate-pulse" />
              <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-500">Dealer Network</span>
            </div>

            <h1 className="text-4xl md:text-6xl text-slate-900 tracking-tight mb-4">Verified Dealerships</h1>
            <p className="text-base md:text-lg text-slate-600 font-medium max-w-3xl">
              Discover trusted dealer profiles, browse live inventory, and connect directly with teams that are ready to close.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              {[
                { label: "Dealerships", value: dealers.length, icon: <Building2 className="w-4 h-4" /> },
                { label: "Verified", value: verifiedCount, icon: <ShieldCheck className="w-4 h-4" /> },
                { label: "Featured", value: featuredCount, icon: <ArrowUpRight className="w-4 h-4" /> },
                { label: "Live Cars", value: totalCars, icon: <CarFront className="w-4 h-4" /> },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-[#ece6dd] bg-[#faf7f2] p-4">
                  <div className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-[#e5ddd2] bg-white text-slate-700 mb-3">
                    {item.icon}
                  </div>
                  <p className="text-2xl font-bold text-slate-900 leading-none">{item.value}</p>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-500 mt-1">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="flex flex-wrap gap-2 mb-12">
          {counties.map((county) => (
            <a
              key={county}
              href={`#county-${encodeURIComponent(county)}`}
              className="rounded-full border border-[#e7e1d8] bg-white px-3 py-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-600 hover:bg-[#faf7f2]"
            >
              {county}
            </a>
          ))}
        </div>

        {counties.map((county) => {
          const countyDealers = dealers.filter((d) => d.county === county);

          return (
            <section key={county} id={`county-${encodeURIComponent(county)}`} className="mb-16 last:mb-0 scroll-mt-40">
              <div className="flex items-center gap-4 mb-7">
                <h2 className="text-sm font-extrabold uppercase tracking-[0.18em] text-slate-700 whitespace-nowrap">{county}</h2>
                <div className="h-px w-full bg-[#e7e1d8]" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {countyDealers.map((dealer) => {
                  const brandImage = dealer.logoUrl || dealer.users?.[0]?.avatarUrl;

                  return (
                  <Link
                    key={dealer.id}
                    href={`/dealers/${dealer.slug}`}
                    className="group relative flex flex-col bg-white border border-[#e8e2d9] hover:border-[#d8cec1] shadow-sm hover:shadow-lg rounded-3xl p-7 transition-all duration-500"
                  >
                    <div className="flex items-start justify-between mb-6">
                      <div className="w-16 h-16 rounded-2xl bg-[#faf7f2] border border-[#ece6dd] flex items-center justify-center overflow-hidden shadow-sm transition-transform group-hover:scale-105">
                        {brandImage ? (
                          <img src={brandImage} alt={dealer.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-slate-900 font-black text-2xl">{dealer.name[0]}</span>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-1.5">
                        {dealer.verified && (
                          <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2.5 py-1 font-extrabold uppercase tracking-[0.14em] inline-flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> Verified
                          </span>
                        )}
                        {dealer.featured && (
                          <span className="text-[9px] bg-[#fff2e8] text-[#bf441f] border border-[#ffd9c9] rounded-full px-2.5 py-1 font-extrabold uppercase tracking-[0.14em]">
                            Featured
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="text-slate-900 text-2xl leading-tight group-hover:text-black transition-colors line-clamp-1">{dealer.name}</h3>
                      <p className="text-slate-500 text-xs font-bold flex items-center gap-1.5 mb-4 uppercase tracking-[0.12em] mt-2">
                        <MapPin className="w-3.5 h-3.5" /> {dealer.location}
                      </p>

                      {dealer.description && (
                        <p className="text-sm text-slate-600 leading-relaxed line-clamp-2 mb-6 min-h-[40px]">
                          {dealer.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-4 border-t border-[#efe8df] mt-auto">
                        <div>
                          <span className="text-slate-900 font-bold text-2xl leading-none">{dealer._count.cars}</span>
                          <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-[0.14em] mt-1">Live Cars</p>
                        </div>

                        <span className="mk-pill-btn inline-flex items-center gap-1 border border-[#e7e1d8] px-3 py-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-700 group-hover:bg-[#111111] group-hover:text-white group-hover:border-[#111111] transition-colors">
                          View Dealer <ArrowUpRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
