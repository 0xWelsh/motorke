// src/app/dealers/page.js
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import Link from "next/link";
import { ArrowUpRight, Building2, MapPin } from "lucide-react";
import NearbyDealersList from "@/components/NearbyDealersList";

export const metadata = { title: "Dealers — Welsh Motors Kenya" };

export default async function DealersPage() {
  const dealers = await db.dealer.findMany({
    include: {
      _count: { select: { cars: { where: { available: true } } } },
      users: { select: { avatarUrl: true }, take: 1 },
    },
  });

  const [leadTotals, leadResponded] = await Promise.all([
    db.lead.groupBy({
      by: ["dealerId"],
      _count: { _all: true },
    }),
    db.lead.groupBy({
      by: ["dealerId"],
      where: { status: { not: "NEW" } },
      _count: { _all: true },
    }),
  ]);

  const leadTotalMap = new Map(leadTotals.map((row) => [row.dealerId, row._count._all]));
  const leadRespondedMap = new Map(leadResponded.map((row) => [row.dealerId, row._count._all]));

  const rankedDealers = [...dealers].sort((a, b) => {
    const activeCarsA = a._count?.cars || 0;
    const activeCarsB = b._count?.cars || 0;
    const totalLeadsA = leadTotalMap.get(a.id) || 0;
    const totalLeadsB = leadTotalMap.get(b.id) || 0;
    const respondedA = leadRespondedMap.get(a.id) || 0;
    const respondedB = leadRespondedMap.get(b.id) || 0;
    const responseRateA = totalLeadsA > 0 ? respondedA / totalLeadsA : 0;
    const responseRateB = totalLeadsB > 0 ? respondedB / totalLeadsB : 0;
    const updatedA = new Date(a.updatedAt).getTime();
    const updatedB = new Date(b.updatedAt).getTime();

    const scoreA =
      (a.featured ? 5000 : 0) +
      (a.verified ? 2000 : 0) +
      activeCarsA * 40 +
      responseRateA * 500 +
      Math.floor(updatedA / 86_400_000);
    const scoreB =
      (b.featured ? 5000 : 0) +
      (b.verified ? 2000 : 0) +
      activeCarsB * 40 +
      responseRateB * 500 +
      Math.floor(updatedB / 86_400_000);

    if (scoreA !== scoreB) return scoreB - scoreA;
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });

  const counties = [...new Set(rankedDealers.map((d) => d.county))].sort();

  return (
    <div className="bg-white min-h-screen pb-20">
      <div className="w-full px-4 sm:px-8 pt-32 sm:pt-40">
        <div className="flex items-center justify-between mb-6 gap-4 border-b border-slate-100 dark:border-zinc-900 pb-3">
          <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.18em] text-[#718096] dark:text-slate-400">
            <Link href="/" className="hover:text-[#111827] dark:hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <span className="text-[#111827] dark:text-white">Dealers</span>
          </div>
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[#718096] dark:text-slate-400 whitespace-nowrap">
            Dealers Showing ({rankedDealers.length})
          </div>
        </div>

        {/* Header Section */}
        <div className="mb-10 sm:mb-12">
          <h1 className="text-3xl sm:text-5xl font-bold text-[#111827] dark:text-white tracking-tight leading-[1.1] mb-4">
            Trusted <span className="text-[#38A169]">Dealer Network</span>
          </h1>
          <p className="text-[#718096] dark:text-slate-400 text-sm sm:text-base font-medium max-w-2xl">
            Browse verified dealerships, compare active inventory footprint, and pick your next trusted seller faster.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-4 gap-y-10 items-start">
          
          {/* Sidebar */}
          <aside className="order-2 lg:order-1 lg:col-span-3 lg:sticky lg:top-32 space-y-4 lg:space-y-6 text-[#111827] dark:text-white">
            <details className="lg:hidden bg-[#F7FAFC] dark:bg-[#111111] border border-[#E2E8F0] dark:border-slate-800 p-5" style={{ borderRadius: "var(--radius)" }}>
              <summary className="cursor-pointer list-none text-xs font-bold uppercase tracking-widest">
                Refine Network
              </summary>
              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#718096]">Search</label>
                  <input type="text" placeholder="Dealer name..." className="w-full bg-white dark:bg-[#0a0a0a] border border-[#E2E8F0] dark:border-slate-800 px-4 py-3 text-sm font-medium outline-none focus:border-[#38A169] transition-all text-[#111827] dark:text-white placeholder:text-slate-400" style={{ borderRadius: "var(--radius)" }} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#718096]">Region</label>
                  <select className="w-full bg-white dark:bg-[#0a0a0a] border border-[#E2E8F0] dark:border-slate-800 px-4 py-3 text-sm font-medium outline-none focus:border-[#38A169] transition-all appearance-none cursor-pointer text-[#111827] dark:text-white" style={{ borderRadius: "var(--radius)" }}>
                    <option value="" className="dark:bg-[#0a0a0a]">All Regions</option>
                    {counties.map(c => <option key={c} value={c} className="dark:bg-[#0a0a0a]">{c}</option>)}
                  </select>
                </div>
                <button className="w-full bg-[#111827] dark:bg-white text-white dark:!text-black py-4 text-[10px] font-bold uppercase tracking-widest transition-transform hover:scale-[0.98]" style={{ borderRadius: "var(--radius)" }}>
                  Apply Filters
                </button>
              </div>
            </details>

            <div className="hidden lg:block bg-[#F7FAFC] dark:bg-[#111111] border border-[#E2E8F0] dark:border-slate-800 p-6" style={{ borderRadius: 'var(--radius)' }}>
              <h3 className="text-xs font-bold uppercase tracking-widest mb-6">Refine Network</h3>
              <div className="space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-bold uppercase tracking-widest text-[#718096]">Search</label>
                   <input type="text" placeholder="Dealer name..." className="w-full bg-white dark:bg-[#0a0a0a] border border-[#E2E8F0] dark:border-slate-800 px-4 py-3 text-sm font-medium outline-none focus:border-[#38A169] transition-all text-[#111827] dark:text-white placeholder:text-slate-400" style={{ borderRadius: 'var(--radius)' }} />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-bold uppercase tracking-widest text-[#718096]">Region</label>
                   <select className="w-full bg-white dark:bg-[#0a0a0a] border border-[#E2E8F0] dark:border-slate-800 px-4 py-3 text-sm font-medium outline-none focus:border-[#38A169] transition-all appearance-none cursor-pointer text-[#111827] dark:text-white" style={{ borderRadius: 'var(--radius)' }}>
                      <option value="" className="dark:bg-[#0a0a0a]">All Regions</option>
                      {counties.map(c => <option key={c} value={c} className="dark:bg-[#0a0a0a]">{c}</option>)}
                   </select>
                </div>
                <button className="w-full bg-[#111827] dark:bg-white text-white dark:!text-black py-4 text-[10px] font-bold uppercase tracking-widest transition-transform hover:scale-[0.98]" style={{ borderRadius: 'var(--radius)' }}>
                   Apply Filters
                </button>
              </div>
            </div>

            <details className="lg:hidden bg-[#F7FAFC] dark:bg-[#111111] border border-[#E2E8F0] dark:border-slate-800 p-5" style={{ borderRadius: "var(--radius)" }}>
              <summary className="cursor-pointer list-none text-xs font-bold uppercase tracking-widest text-[#718096]">
                Proximity Radar
              </summary>
              <div className="mt-4">
                <NearbyDealersList />
              </div>
            </details>

            <div className="hidden lg:block bg-[#F7FAFC] dark:bg-[#111111] border border-[#E2E8F0] dark:border-slate-800 p-6" style={{ borderRadius: 'var(--radius)' }}>
               <h3 className="text-xs font-bold uppercase tracking-widest mb-6 divider-line text-[#718096]">Proximity Radar</h3>
               <NearbyDealersList />
            </div>
          </aside>

          {/* Grid */}
          <main className="order-1 lg:order-2 lg:col-span-9">
            {rankedDealers.length === 0 ? (
              <div className="py-32 text-center bg-[#F7FAFC] dark:bg-[#111111] border border-[#E2E8F0] dark:border-slate-800" style={{ borderRadius: 'var(--radius)' }}>
                <Building2 className="w-12 h-12 text-[#CBD5E0] dark:text-slate-700 mx-auto mb-6" />
                <h2 className="text-2xl font-bold text-[#111827] dark:text-white mb-2">Network offline</h2>
                <p className="text-[#718096] dark:text-slate-400 font-medium">We couldn't find any active dealers matching your criteria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {rankedDealers.map((dealer) => (
                  <DealerCard key={dealer.id} dealer={dealer} />
                ))}
              </div>
            )}
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
    <Link href={`/dealers/${dealer.slug}`} className="group flex flex-col h-full bg-white dark:bg-[#111111] border border-slate-100 dark:border-slate-800 transition-all hover:border-[#38A169] dark:hover:border-[#38A169]" style={{ borderRadius: 'var(--radius)' }}>
      <div className="relative aspect-[16/10] bg-slate-100 dark:bg-slate-900 overflow-hidden" style={{ borderTopLeftRadius: 'var(--radius)', borderTopRightRadius: 'var(--radius)' }}>
        <img src={bannerImage} alt={dealer.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
        <div className="absolute top-4 left-4 flex flex-col gap-2">
           {dealer.verified && <span className="bg-[#38A169] text-white text-[8px] font-bold px-2 py-1 uppercase tracking-widest" style={{ borderRadius: '2px' }}>VERIFIED</span>}
           {dealer.featured && <span className="bg-[#111827] text-white text-[8px] font-bold px-2 py-1 uppercase tracking-widest" style={{ borderRadius: '2px' }}>PREMIUM</span>}
        </div>
      </div>

      <div className="flex-1 flex flex-col p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
           <div className="min-w-0">
              <h3 className="text-lg font-bold text-[#111827] dark:text-white group-hover:text-[#38A169] transition-colors truncate">{dealer.name}</h3>
              <p className="text-[10px] font-bold text-[#718096] dark:text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-1">
                 <MapPin className="w-3 h-3 text-[#38A169]" /> {dealer.location || dealer.county}
              </p>
           </div>
           <div className="w-12 h-12 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center shrink-0 overflow-hidden shadow-sm" style={{ borderRadius: 'var(--radius)' }}>
              {brandImage ? <img src={brandImage} className="w-full h-full object-cover" /> : <span className="text-sm font-bold text-slate-300 dark:text-slate-500">{dealer.name[0]}</span>}
           </div>
        </div>

        <p className="text-xs text-[#718096] dark:text-slate-400 font-medium line-clamp-2 leading-relaxed mb-5">
           {dealer.description || "A cornerstone of our verified network, offering premium logistics and asset transparency."}
        </p>

        <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
           <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{dealer._count?.cars || 0} Listed Units</span>
           <span className="text-[10px] font-bold text-[#38A169] uppercase tracking-widest hover:opacity-70 flex items-center gap-1 group-hover:translate-x-1 transition-all">
              Visit Station <ArrowUpRight className="w-3 h-3" />
           </span>
        </div>
      </div>
    </Link>
  );
}
