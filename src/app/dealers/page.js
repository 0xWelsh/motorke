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

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                {countyDealers.map((dealer) => {
                  const brandImage = dealer.logoUrl || dealer.users?.[0]?.avatarUrl;
                  const bannerImage = dealer.bannerUrl || "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&q=80&w=1200";

                  return (
                  <Link
                    key={dealer.id}
                    href={`/dealers/${dealer.slug}`}
                    className="group bg-white flex flex-col rounded-none border border-[#ddd4c8] hover:border-slate-400 transition-all h-full overflow-hidden"
                  >
                    {/* Banner Image Area */}
                    <div className="relative aspect-[16/10] bg-slate-100 border-b border-[#ddd4c8] overflow-hidden shrink-0">
                      <img 
                        src={bannerImage} 
                        alt={`${dealer.name} showroom`} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      
                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                        {dealer.verified && (
                          <span className="bg-emerald-400 text-white text-[10px] font-black px-2 py-1 shadow-sm uppercase tracking-wider self-start">
                            VERIFIED
                          </span>
                        )}
                        {dealer.featured && (
                          <span className="bg-[#111111] text-white text-[10px] font-black px-2 py-1 shadow-sm uppercase tracking-wider self-start">
                            FEATURED
                          </span>
                        )}
                      </div>

                      {/* Distance Tag - Will be hydrated by client component later if needed, hardcoded logic can go here if we extract to Client component, for now placeholder like cars page */}
                      <span className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md text-slate-900 text-[10px] font-extrabold px-3 py-1.5 border border-white">
                        VIEW LOT
                      </span>
                    </div>

                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex justify-between items-start gap-4 mb-4 -mt-10 relative z-10">
                        {/* Logo */}
                        <div className="w-[64px] h-[64px] rounded-none bg-white border border-[#ddd4c8] flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                          {brandImage ? (
                            <img src={brandImage} alt={dealer.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-slate-400 font-black text-xl">{dealer.name?.[0] || '?'}</span>
                          )}
                        </div>
                        
                        <div className="bg-[#111111] text-white px-2.5 py-1 text-[10px] uppercase font-black tracking-widest mt-6">
                            {dealer._count.cars} LIVE
                        </div>
                      </div>

                      {/* Info */}
                      <div className="mb-2">
                        <h3 className="text-lg font-black text-slate-900 group-hover:text-[#ff5a2f] transition-colors truncate uppercase tracking-widest leading-none mb-2">{dealer.name}</h3>
                        <p className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-wide truncate">
                          <MapPin size={12} className="text-slate-400 shrink-0" /> {dealer.location || 'Terminal Not Set'}
                        </p>
                      </div>

                      {/* Description */}
                      <div className="flex-1 mt-2">
                        {dealer.description ? (
                          <p className="text-[13px] text-slate-600 line-clamp-2 leading-relaxed font-medium">
                            {dealer.description}
                          </p>
                        ) : (
                          <p className="text-[13px] text-slate-400 italic line-clamp-2">
                            A premium vehicle dealership offering tailored import and local models.
                          </p>
                        )}
                      </div>
                      
                      {/* View Button Row */}
                      <div className="mt-6 pt-4 border-t border-[#f0f0f0] flex justify-between items-center">
                        <div className="flex items-center gap-1 text-[11px] font-black uppercase text-slate-400 tracking-widest">
                          <span className="text-[#f59e0b]">★</span>
                          <span className="text-[#f59e0b]">★</span>
                          <span className="text-[#f59e0b]">★</span>
                          <span className="text-[#f59e0b]">★</span>
                          <span className="text-[#f59e0b]">★</span>
                          <span className="ml-1">(5.0)</span>
                        </div>
                        <span className="text-[10px] font-black uppercase text-slate-900 tracking-widest flex items-center justify-center border border-slate-900 px-3 py-1.5 group-hover:bg-[#111111] group-hover:text-white transition-colors">
                          Enter Store <ArrowUpRight className="w-3 h-3 ml-1" />
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
