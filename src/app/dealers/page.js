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
    <div className="bg-white min-h-screen pb-20">
      <div className="container mx-auto px-6 max-w-7xl pt-32 sm:pt-40">
        
        {/* Header Section */}
        <div className="mb-16">
          <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-[#718096] mb-4">
            <Link href="/" className="hover:text-[#1A202C] transition-colors">Home</Link>
            <span>/</span>
            <span className="text-[#1A202C]">Dealers</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold text-[#1A202C] tracking-tight leading-[1.1] mb-6">
            Our Trusted <br />
            <span className="editorial-heading text-[#718096]">Station Network.</span>
          </h1>
          <p className="text-[#718096] text-lg font-medium max-w-2xl">
            Connecting you with {dealers.length} verified dealerships across the region.
            Every partner is vetted for compliance and service excellence.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Sidebar */}
          <aside className="lg:col-span-3 lg:sticky lg:top-32 space-y-10">
            <div className="bg-[#F7FAFC] border border-[#E2E8F0] p-8" style={{ borderRadius: 'var(--radius)' }}>
              <h3 className="text-xs font-bold text-[#1A202C] uppercase tracking-widest mb-6">Refine Network</h3>
              <div className="space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-bold uppercase tracking-widest text-[#718096]">Search</label>
                   <input type="text" placeholder="Dealer name..." className="w-full bg-white border border-[#E2E8F0] px-4 py-3 text-sm font-medium outline-none focus:border-[#1A202C] transition-all" style={{ borderRadius: 'var(--radius)' }} />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-bold uppercase tracking-widest text-[#718096]">Region</label>
                   <select className="w-full bg-white border border-[#E2E8F0] px-4 py-3 text-sm font-medium outline-none focus:border-[#1A202C] transition-all appearance-none cursor-pointer" style={{ borderRadius: 'var(--radius)' }}>
                      <option value="">All Regions</option>
                      {counties.map(c => <option key={c} value={c}>{c}</option>)}
                   </select>
                </div>
                <button className="w-full bg-[#1A202C] text-white py-4 text-[10px] font-bold uppercase tracking-widest transition-transform hover:scale-[0.98]" style={{ borderRadius: 'var(--radius)' }}>
                   Apply Filters
                </button>
              </div>
            </div>

            <div className="bg-[#F7FAFC] border border-[#E2E8F0] p-8" style={{ borderRadius: 'var(--radius)' }}>
               <h3 className="text-xs font-bold text-[#1A202C] uppercase tracking-widest mb-6">Proximity Radar</h3>
               <NearbyDealersList />
            </div>
          </aside>

          {/* Grid */}
          <main className="lg:col-span-9">
            {dealers.length === 0 ? (
              <div className="py-32 text-center bg-[#F7FAFC] border border-[#E2E8F0]" style={{ borderRadius: 'var(--radius)' }}>
                <Building2 className="w-12 h-12 text-[#CBD5E0] mx-auto mb-6" />
                <h2 className="text-2xl font-bold text-[#1A202C] mb-2">Network offline</h2>
                <p className="text-[#718096] font-medium">We couldn't find any active dealers matching your criteria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {dealers.map((dealer) => (
                  <DealerCard key={dealer.id} dealer={dealer} />
                ))}
              </div>
            )}

            {/* National Grid Map */}
            <div className="mt-20 pt-20 border-t border-[#EDF2F7]">
               <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#718096] mb-10">National Grid Array</h2>
               <div className="h-[500px] bg-[#F7FAFC] border border-[#E2E8F0] overflow-hidden" style={{ borderRadius: 'var(--radius)' }}>
                  <DealersMapView dealers={dealers} />
               </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function DealerCard({ dealer }) {
  const brandImage = dealer.logoUrl || dealer.users?.[0]?.avatarUrl;
  const bannerImage = dealer.bannerUrl || "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&q=80&w=1200";

  return (
    <Link href={`/dealers/${dealer.slug}`} className="group flex flex-col bg-white border-b border-transparent hover:border-[#38A169] transition-all pb-4">
      <div className="relative aspect-[16/10] bg-[#F7FAFC] overflow-hidden mb-8" style={{ borderRadius: 'var(--radius)' }}>
        <img src={bannerImage} alt={dealer.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
        <div className="absolute top-4 left-4 flex flex-col gap-2">
           {dealer.verified && <span className="bg-[#38A169] text-white text-[8px] font-bold px-2 py-1 uppercase tracking-widest" style={{ borderRadius: '2px' }}>VERIFIED</span>}
           {dealer.featured && <span className="bg-[#1A202C] text-white text-[8px] font-bold px-2 py-1 uppercase tracking-widest" style={{ borderRadius: '2px' }}>PREMIUM</span>}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-4 mb-4">
           <div>
              <h3 className="text-lg font-bold text-[#1A202C] group-hover:text-[#38A169] transition-colors">{dealer.name}</h3>
              <p className="text-[10px] font-bold text-[#718096] uppercase tracking-widest mt-1 flex items-center gap-1">
                 <MapPin className="w-3 h-3 text-[#38A169]" /> {dealer.location || dealer.county}
              </p>
           </div>
           <div className="w-10 h-10 border border-[#E2E8F0] flex items-center justify-center shrink-0 overflow-hidden" style={{ borderRadius: 'var(--radius)' }}>
              {brandImage ? <img src={brandImage} className="w-full h-full object-cover" /> : <span className="text-xs font-bold text-[#CBD5E0]">{dealer.name[0]}</span>}
           </div>
        </div>

        <p className="text-xs text-[#718096] font-medium line-clamp-2 leading-relaxed mb-6">
           {dealer.description || "A cornerstone of our verified network, offering premium logistics and asset transparency."}
        </p>

        <div className="mt-auto pt-4 flex items-center justify-between border-t border-[#EDF2F7]">
           <span className="text-[10px] font-bold text-[#1A202C] uppercase tracking-widest">{dealer._count?.cars || 0} Listed Units</span>
           <span className="text-[10px] font-bold text-[#38A169] uppercase tracking-widest flex items-center gap-1 group-hover:gap-2 transition-all">
              Visit Station <ArrowUpRight className="w-3 h-3" />
           </span>
        </div>
      </div>
    </Link>
  );
}
