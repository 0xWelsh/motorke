// src/app/dealers/page.js
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import Link from "next/link";
import { ArrowUpRight, Building2, CarFront, MapPin, ShieldCheck } from "lucide-react";
import NearbyDealersList from "@/components/NearbyDealersList";
import DealersMapView from "@/components/DealersMapView";

export const metadata = { title: "Dealers — Motorke Kenya" };

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
    <div className="min-h-screen bg-[#f7f6f3]">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <header className="mb-12">
          <h1 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tight leading-none mb-4">TRUSTED DEALERS</h1>
          <p className="text-base text-slate-600 font-medium max-w-3xl mb-12">
            Browse verified dealer profiles by county and find your next car from Kenya's top-tier inventory.
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Dealerships", value: dealers.length },
              { label: "Verified", value: verifiedCount },
              { label: "Featured", value: featuredCount },
              { label: "Live Cars", value: totalCars },
            ].map((item) => (
              <div key={item.label} className="bg-white border border-[#ddd4c8] p-6 rounded-none">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">{item.label}</p>
                <p className="text-4xl font-black text-slate-900">{item.value}</p>
              </div>
            ))}
          </div>
        </header>

        {/* Content Flex */}
        <div className="flex flex-col xl:flex-row gap-4 mb-12">
          {/* Find Nearby Section */}
          <section className="xl:w-1/2 p-6 border border-[#ddd4c8] bg-white rounded-none">
            <div className="mb-8">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 mb-1 uppercase tracking-wider">
                Find Nearby
              </h2>
              <p className="text-[13px] font-medium text-slate-600">
                Search for dealers within your preferred radius using your precise current location.
              </p>
            </div>
            <NearbyDealersList />
          </section>

          {/* Map View */}
          <section className="xl:w-1/2 p-6 border border-[#ddd4c8] bg-white rounded-none">
            <div className="mb-8">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 mb-1 uppercase tracking-wider">
                Map Terminal
              </h2>
              <p className="text-[13px] font-medium text-slate-600">
                A top-down view of all verified and featured vehicle hubs across the country.
              </p>
            </div>
            <div className="h-[300px] border border-[#ddd4c8] shadow-none bg-[#fbfcfd]">
              <DealersMapView dealers={dealers} />
            </div>
          </section>
        </div>

        {/* County Navigation */}
        <nav className="flex items-center gap-2 mb-12 overflow-x-auto pb-4 border-b border-[#ddd4c8] no-scrollbar">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#ff5a2f] mr-2 shrink-0">Terminal:</span>
          {counties.map((county) => (
            <a
              key={county}
              href={`#county-${encodeURIComponent(county)}`}
              className="text-[11px] font-black uppercase tracking-widest text-slate-600 hover:text-slate-900 bg-white border border-[#ddd4c8] hover:border-slate-400 whitespace-nowrap transition-colors px-4 py-2"
            >
              {county}
            </a>
          ))}
        </nav>

        {/* Empty State */}
        {dealers.length === 0 && (
          <div className="py-20 text-center border border-[#ddd4c8] bg-white">
            <p className="text-sm font-black uppercase tracking-widest text-slate-500">No dealers available yet.</p>
          </div>
        )}

        {/* Dealers by County */}
        {counties.map((county) => {
          const countyDealers = dealers.filter((d) => d.county === county);

          return (
            <section key={county} id={`county-${encodeURIComponent(county)}`} className="mb-16 last:mb-0 scroll-mt-32">
              <div className="flex items-center gap-4 mb-6">
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{county}</h2>
                <span className="h-[1px] bg-[#ddd4c8] flex-1"></span>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{countyDealers.length} Stations</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {countyDealers.map((dealer) => {
                  const brandImage = dealer.logoUrl || dealer.users?.[0]?.avatarUrl;

                  return (
                  <Link
                    key={dealer.id}
                    href={`/dealers/${dealer.slug}`}
                    className="group bg-white flex flex-col p-6 rounded-none border border-[#ddd4c8] hover:border-slate-400 transition-all h-full"
                  >
                    <div className="flex items-start gap-4 mb-6">
                      {/* Logo */}
                      <div className="w-[64px] h-[64px] rounded-none bg-[#f7f6f3] border border-[#ddd4c8] flex items-center justify-center overflow-hidden shrink-0">
                        {brandImage ? (
                          <img src={brandImage} alt={dealer.name} className="w-full h-full object-cover grayscale opacity-90 group-hover:grayscale-0 group-hover:opacity-100 transition-all" />
                        ) : (
                          <span className="text-slate-400 font-black text-xl">{dealer.name?.[0] || '?'}</span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 pt-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="text-[15px] font-black text-slate-900 group-hover:text-[#ff5a2f] transition-colors truncate uppercase tracking-wide leading-none">{dealer.name}</h3>
                          
                        </div>

                        <p className="text-[12px] font-medium text-slate-500 flex items-center gap-1.5 uppercase tracking-wide truncate">
                          <MapPin size={12} className="text-slate-400 shrink-0" /> {dealer.location || 'Terminal Not Set'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Tags */}
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      {dealer.verified && (
                        <span className="bg-emerald-400 text-white text-[9px] font-black uppercase tracking-widest px-2 py-1">
                          Verified
                        </span>
                      )}
                      {dealer.featured && (
                        <span className="bg-[#111111] text-white text-[9px] font-black uppercase tracking-widest px-2 py-1">
                          Featured
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    {dealer.description ? (
                      <p className="text-[13px] text-slate-600 line-clamp-2 leading-relaxed font-medium mb-8">
                        {dealer.description}
                      </p>
                    ) : (
                      <p className="text-[13px] text-slate-400 italic line-clamp-2 mb-8">
                        No description provided.
                      </p>
                    )}
                    
                    {/* Stats */}
                    <div className="mt-auto border-t border-[#f0f0f0] pt-4 flex items-center justify-between">
                      <div>
                        <p className="text-xl font-black text-slate-900 leading-none mb-1">{dealer._count.cars}</p>
                        <p className="text-[10px] uppercase font-black tracking-widest text-[#ff5a2f] leading-none">Live Cars</p>
                      </div>
                      <span className="text-slate-300 group-hover:text-slate-900 transition-colors">
                        <ArrowUpRight className="w-5 h-5" />
                      </span>
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
                        )}
                      </div>

                      {/* Stats */}
                      <div className="text-right shrink-0">
                        <p className="text-2xl font-bold text-slate-900">{dealer._count.cars}</p>
                        <p className="text-xs text-slate-500 font-medium">Live Cars</p>
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
