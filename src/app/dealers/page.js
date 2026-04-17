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

  return (
    <div className="min-h-screen bg-[#f7f6f3]">
      <div className="w-full max-w-[2560px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-5 sm:py-6 lg:py-8 overflow-hidden">
        
        {/* Top Breadcrumb Bar */}
        <div className="block w-full mb-6 sm:mb-8 overflow-hidden text-[14px] font-medium">
          <div className="block w-full xl:w-1/4 2xl:w-1/4 xl:float-left xl:pr-3 mb-4 xl:mb-0">
            <div className="flex items-center gap-3 text-slate-800">
              <Link href="/" className="hover:text-black transition-colors">Home</Link>
              <span className="text-slate-400 text-xs mt-0.5">›</span>
              <span className="text-slate-900">Dealers</span>
            </div>
          </div>
          <div className="block w-full xl:w-3/4 2xl:w-3/4 xl:float-left text-slate-800 xl:pl-1 mt-1 font-black uppercase tracking-widest text-[10px]">
            {dealers.length} Verified Stations
          </div>
        </div>

        {/* Main Floating Matrix Container */}
        <div className="block -mx-2 sm:-mx-3">
          
          {/* Sidebar Area */}
          <aside className="block float-left w-full xl:w-1/4 px-2 sm:px-3 mb-6 xl:mb-0 relative z-20">
            <div className="xl:sticky xl:top-[84px] space-y-6">
              
              {/* Dummy Filter Block */}
              <div className="bg-white border border-[#ddd4c8] p-6 shadow-sm rounded-none">
                <span className="inline-block bg-[#111111] text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 mb-4">Terminal Filter</span>
                <div className="space-y-4">
                  <input type="text" placeholder="Search by name..." className="w-full border border-[#ddd4c8] text-sm p-3 rounded-none focus:outline-none focus:border-slate-900 transition-colors" />
                  
                  <select className="w-full border border-[#ddd4c8] text-sm p-3 rounded-none focus:outline-none focus:border-slate-900 transition-colors bg-white">
                    <option value="">All Regions</option>
                    {counties.map(county => (
                      <option key={county} value={county}>{county}</option>
                    ))}
                  </select>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="form-checkbox text-[#111111] border-[#ddd4c8] rounded-none focus:ring-0 w-4 h-4" />
                    <span className="text-xs font-black uppercase tracking-widest text-slate-700">Verified Only</span>
                  </label>

                  <button className="w-full bg-[#111111] hover:bg-[#ff5a2f] text-white text-[11px] font-black uppercase tracking-widest py-3 rounded-full transition-colors">
                    Update Radar
                  </button>
                </div>
              </div>

              {/* Find Nearby Block */}
              <div className="bg-white border border-[#ddd4c8] p-6 shadow-sm rounded-none">
                <div className="mb-4 text-center">
                  <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest leading-tight">
                    Proximity Radar
                  </h3>
                </div>
                <NearbyDealersList />
              </div>
            </div>
          </aside>

          {/* Dealership Grid (Right Side) */}
          <div className="block float-left w-full xl:w-3/4 px-2 sm:px-3">
            
            {dealers.length === 0 ? (
              <div className="py-20 text-center border border-[#ddd4c8] bg-white">
                <p className="text-sm font-black uppercase tracking-widest text-slate-500">No dealers available yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4 mb-16">
                {dealers.map((dealer) => {
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

                        {/* County Tag */}
                        {dealer.county && (
                          <span className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md text-slate-900 text-[10px] font-black px-3 py-1.5 border border-white uppercase tracking-widest">
                            {dealer.county}
                          </span>
                        )}
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
                              {dealer._count?.cars || 0} LIVE
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
                          <span className="text-[10px] font-black uppercase text-white tracking-widest flex items-center justify-center border border-slate-900 px-3 py-1.5 group-hover:bg-[#111111] group-hover:text-white transition-colors">
                            Enter Store <ArrowUpRight className="w-3 h-3 ml-1" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* General Maps - moved to bottom */}
            <div className="w-full border border-[#ddd4c8] bg-white p-6 rounded-none mb-12 shadow-sm">
              <div className="mb-6 flex items-center gap-3">
                <span className="bg-[#111111] text-white p-2 rounded-none"><MapPin size={18} /></span>
                <h2 className="text-[15px] font-black text-slate-900 uppercase tracking-widest">National Grid Array</h2>
              </div>
              <div className="h-[400px] border border-[#ddd4c8] shadow-none bg-[#fbfcfd]">
                <DealersMapView dealers={dealers} />
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
