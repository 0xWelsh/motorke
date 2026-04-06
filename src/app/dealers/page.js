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
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-7xl">
        <header className="mb-12 md:mb-14">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-500 mb-4">Dealer Network</p>
          <h1 className="text-3xl sm:text-4xl md:text-6xl text-slate-900 tracking-tight mb-4">Trusted Dealerships, Clearly Listed</h1>
          <p className="text-base md:text-lg text-slate-600 font-medium max-w-3xl">
            Browse verified dealer profiles by county, compare footprint quickly, and connect with the right team without jumping through crowded card layouts.
          </p>

          <div className="mt-6 sm:mt-8 border-y border-[#e7e1d8] py-6 grid grid-cols-2 md:grid-cols-4 gap-x-6 sm:gap-x-8 gap-y-6">
            {[
              { label: "Dealerships", value: dealers.length, icon: <Building2 className="w-4 h-4" /> },
              { label: "Verified", value: verifiedCount, icon: <ShieldCheck className="w-4 h-4" /> },
              { label: "Featured", value: featuredCount, icon: <ArrowUpRight className="w-4 h-4" /> },
              { label: "Live Cars", value: totalCars, icon: <CarFront className="w-4 h-4" /> },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-500 inline-flex items-center gap-1.5 mb-1">
                  {item.icon}
                  {item.label}
                </p>
                <p className="text-3xl font-bold text-slate-900 leading-none">{item.value}</p>
              </div>
            ))}
          </div>
        </header>

        <nav className="flex items-center gap-x-4 gap-y-2 mb-8 sm:mb-10 md:mb-12 overflow-x-auto no-scrollbar pb-1 whitespace-nowrap">
          {counties.map((county) => (
            <a
              key={county}
              href={`#county-${encodeURIComponent(county)}`}
              className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-500 hover:text-slate-900 transition-colors"
            >
              {county}
            </a>
          ))}
        </nav>

        {dealers.length === 0 && (
          <div className="border-y border-[#e7e1d8] py-16">
            <p className="text-sm font-bold text-slate-500 uppercase tracking-[0.14em]">No dealerships available yet</p>
          </div>
        )}

        {counties.map((county) => {
          const countyDealers = dealers.filter((d) => d.county === county);

          return (
            <section key={county} id={`county-${encodeURIComponent(county)}`} className="mb-14 last:mb-0 scroll-mt-40">
              <div className="flex items-end justify-between gap-4 mb-4">
                <h2 className="text-sm font-extrabold uppercase tracking-[0.18em] text-slate-700">{county}</h2>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">{countyDealers.length} dealers</p>
              </div>

              <div className="border-y border-[#ece6dd] divide-y divide-[#ece6dd]">
                {countyDealers.map((dealer) => {
                  const brandImage = dealer.logoUrl || dealer.users?.[0]?.avatarUrl;

                  return (
                  <Link
                    key={dealer.id}
                    href={`/dealers/${dealer.slug}`}
                    className="group block py-5 md:py-7 transition-colors"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-[84px_minmax(0,1fr)_140px] gap-4 md:gap-5 items-start">
                      <div className="w-20 h-20 rounded-2xl bg-[#faf7f2] border border-[#ece6dd] flex items-center justify-center overflow-hidden">
                        {brandImage ? (
                          <img src={brandImage} alt={dealer.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-slate-900 font-black text-2xl">{dealer.name[0]}</span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2.5">
                          <h3 className="text-xl sm:text-2xl text-slate-900 leading-tight group-hover:text-black transition-colors line-clamp-1">{dealer.name}</h3>
                          {dealer.verified && (
                            <span className="text-[9px] text-emerald-700 inline-flex items-center gap-1 font-extrabold uppercase tracking-[0.14em]">
                              <ShieldCheck className="w-3 h-3" /> Verified
                            </span>
                          )}
                          {dealer.featured && (
                            <span className="text-[9px] text-[#bf441f] font-extrabold uppercase tracking-[0.14em]">Featured</span>
                          )}
                        </div>

                        <p className="text-slate-500 text-xs font-bold flex items-center gap-1.5 uppercase tracking-[0.12em] mb-3">
                          <MapPin className="w-3.5 h-3.5" /> {dealer.location}
                        </p>

                        {dealer.description && (
                          <p className="text-sm text-slate-600 leading-relaxed line-clamp-2 max-w-2xl">
                            {dealer.description}
                          </p>
                        )}
                      </div>

                      <div className="md:text-right flex md:block items-center justify-between gap-4">
                        <div>
                          <span className="text-slate-900 font-bold text-2xl leading-none">{dealer._count.cars}</span>
                          <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-[0.14em] mt-1">Live Cars</p>
                        </div>

                        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-600 group-hover:text-black transition-colors md:mt-3">
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
