// src/app/dealers/page.js
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import Link from "next/link";
import { ArrowUpRight, Building2, MapPin } from "lucide-react";
import NearbyDealersList from "@/components/NearbyDealersList";
import DealersLocationButton from "@/components/DealersLocationButton";

export const metadata = {
  title: "Trusted car dealers in Kenya",
  description:
    "Discover verified car dealerships across Kenya. View locations, inventory counts, and open each dealer showroom on Welsh Motorhub.",
  alternates: { canonical: "/dealers" },
  keywords: ["car dealers Kenya", "Welsh Motorhub dealers", "verified dealerships", "automotive showroom Kenya"],
  openGraph: {
    title: "Trusted car dealers in Kenya | Welsh Motorhub",
    description:
      "Browse Welsh Motorhub’s verified dealer network: counties, cars, and direct links to each showroom.",
    type: "website",
    url: "/dealers",
  },
};

function distanceKm(lat1, lng1, lat2, lng2) {
  if ([lat1, lng1, lat2, lng2].some((value) => value == null || Number.isNaN(value))) return null;
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(km) {
  if (km == null || !Number.isFinite(km)) return null;
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
}

function responseTier(responseRate, totalLeads) {
  if (!totalLeads || totalLeads < 5) return { label: "New dealer", tone: "text-slate-500 bg-slate-100 dark:bg-slate-800/70 dark:text-slate-300" };
  if (responseRate >= 0.7) return { label: "Fast replies", tone: "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300" };
  if (responseRate >= 0.4) return { label: "Responsive", tone: "text-sky-700 bg-sky-50 dark:bg-sky-950/40 dark:text-sky-300" };
  return { label: "Slow replies", tone: "text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300" };
}

export default async function DealersPage({ searchParams }) {
  const sp = await searchParams;
  const search = (sp.search || "").toString().trim();
  const countyFilter = (sp.county || "").toString().trim();
  const verifiedOnly = sp.verified === "1";
  const inventoryMode = (sp.inventory || "active").toString();
  const withActiveInventoryOnly = inventoryMode !== "all";
  const userLat = sp.lat ? parseFloat(sp.lat) : null;
  const userLng = sp.lng ? parseFloat(sp.lng) : null;
  const hasLocation = Number.isFinite(userLat) && Number.isFinite(userLng);

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

  const enriched = dealers.map((dealer) => {
    const activeCars = dealer._count?.cars || 0;
    const totalLeads = leadTotalMap.get(dealer.id) || 0;
    const respondedLeads = leadRespondedMap.get(dealer.id) || 0;
    const responseRate = totalLeads > 0 ? respondedLeads / totalLeads : 0;
    const updatedMs = new Date(dealer.updatedAt).getTime();
    const score =
      (dealer.featured ? 5000 : 0) +
      (dealer.verified ? 2000 : 0) +
      activeCars * 40 +
      responseRate * 500 +
      Math.floor(updatedMs / 86_400_000);
    const distanceValue = hasLocation ? distanceKm(userLat, userLng, dealer.lat, dealer.lng) : null;
    return { ...dealer, activeCars, totalLeads, respondedLeads, responseRate, score, distanceValue };
  });

  const needle = search.toLowerCase();
  const filtered = enriched.filter((dealer) => {
    if (withActiveInventoryOnly && dealer.activeCars === 0) return false;
    if (verifiedOnly && !dealer.verified) return false;
    if (countyFilter && (dealer.county || "").toLowerCase() !== countyFilter.toLowerCase()) return false;
    if (needle) {
      const haystack = `${dealer.name} ${dealer.location || ""} ${dealer.county || ""}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });

  const rankedDealers = [...filtered].sort((a, b) => {
    if (hasLocation && a.distanceValue != null && b.distanceValue != null && a.distanceValue !== b.distanceValue) {
      return a.distanceValue - b.distanceValue;
    }
    if (a.score !== b.score) return b.score - a.score;
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });

  const counties = [...new Set(enriched.map((d) => d.county).filter(Boolean))].sort();

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
          {hasLocation ? (
            <p className="mt-2 text-[11px] font-semibold text-[#2F855A] dark:text-emerald-400">
              Sorted by distance from your current location.
            </p>
          ) : (
            <p className="mt-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Enable location to rank nearest dealers first.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-4 gap-y-10 items-start">
          
          {/* Sidebar */}
          <aside className="order-2 lg:order-1 lg:col-span-3 lg:sticky lg:top-32 space-y-4 lg:space-y-6 text-[#111827] dark:text-white">
            <details className="lg:hidden bg-[#F7FAFC] dark:bg-[#111111] border border-[#E2E8F0] dark:border-slate-800 p-5" style={{ borderRadius: "var(--radius)" }}>
              <summary className="cursor-pointer list-none text-xs font-bold uppercase tracking-widest">
                Refine Network
              </summary>
              <form method="GET" className="mt-4 space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#718096]">Search</label>
                  <input name="search" defaultValue={search} type="text" placeholder="Dealer name..." className="w-full bg-white dark:bg-[#0a0a0a] border border-[#E2E8F0] dark:border-slate-800 px-4 py-3 text-sm font-medium outline-none focus:border-[#38A169] transition-all text-[#111827] dark:text-white placeholder:text-slate-400" style={{ borderRadius: "var(--radius)" }} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#718096]">Region</label>
                  <select name="county" defaultValue={countyFilter} className="w-full bg-white dark:bg-[#0a0a0a] border border-[#E2E8F0] dark:border-slate-800 px-4 py-3 text-sm font-medium outline-none focus:border-[#38A169] transition-all appearance-none cursor-pointer text-[#111827] dark:text-white" style={{ borderRadius: "var(--radius)" }}>
                    <option value="" className="dark:bg-[#0a0a0a]">All Regions</option>
                    {counties.map(c => <option key={c} value={c} className="dark:bg-[#0a0a0a]">{c}</option>)}
                  </select>
                </div>
                <label className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300">
                  <input type="checkbox" name="verified" value="1" defaultChecked={verifiedOnly} className="accent-[#38A169]" />
                  Verified only
                </label>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#718096]">Inventory</label>
                  <select name="inventory" defaultValue={withActiveInventoryOnly ? "active" : "all"} className="w-full bg-white dark:bg-[#0a0a0a] border border-[#E2E8F0] dark:border-slate-800 px-4 py-3 text-sm font-medium outline-none focus:border-[#38A169] transition-all appearance-none cursor-pointer text-[#111827] dark:text-white" style={{ borderRadius: "var(--radius)" }}>
                    <option value="active">Active inventory only</option>
                    <option value="all">All dealers</option>
                  </select>
                </div>
                <DealersLocationButton />
                {sp.lat ? <input type="hidden" name="lat" value={sp.lat} /> : null}
                {sp.lng ? <input type="hidden" name="lng" value={sp.lng} /> : null}
                <button className="w-full bg-[#111827] dark:bg-white text-white dark:!text-black py-4 text-[10px] font-bold uppercase tracking-widest transition-transform hover:scale-[0.98]" style={{ borderRadius: "var(--radius)" }}>
                  Apply Filters
                </button>
              </form>
            </details>

            <div className="hidden lg:block bg-[#F7FAFC] dark:bg-[#111111] border border-[#E2E8F0] dark:border-slate-800 p-6" style={{ borderRadius: 'var(--radius)' }}>
              <h3 className="text-xs font-bold uppercase tracking-widest mb-6">Refine Network</h3>
              <form method="GET" className="space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-bold uppercase tracking-widest text-[#718096]">Search</label>
                   <input name="search" defaultValue={search} type="text" placeholder="Dealer name..." className="w-full bg-white dark:bg-[#0a0a0a] border border-[#E2E8F0] dark:border-slate-800 px-4 py-3 text-sm font-medium outline-none focus:border-[#38A169] transition-all text-[#111827] dark:text-white placeholder:text-slate-400" style={{ borderRadius: 'var(--radius)' }} />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-bold uppercase tracking-widest text-[#718096]">Region</label>
                   <select name="county" defaultValue={countyFilter} className="w-full bg-white dark:bg-[#0a0a0a] border border-[#E2E8F0] dark:border-slate-800 px-4 py-3 text-sm font-medium outline-none focus:border-[#38A169] transition-all appearance-none cursor-pointer text-[#111827] dark:text-white" style={{ borderRadius: 'var(--radius)' }}>
                      <option value="" className="dark:bg-[#0a0a0a]">All Regions</option>
                      {counties.map(c => <option key={c} value={c} className="dark:bg-[#0a0a0a]">{c}</option>)}
                   </select>
                </div>
                <label className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300">
                  <input type="checkbox" name="verified" value="1" defaultChecked={verifiedOnly} className="accent-[#38A169]" />
                  Verified only
                </label>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#718096]">Inventory</label>
                  <select name="inventory" defaultValue={withActiveInventoryOnly ? "active" : "all"} className="w-full bg-white dark:bg-[#0a0a0a] border border-[#E2E8F0] dark:border-slate-800 px-4 py-3 text-sm font-medium outline-none focus:border-[#38A169] transition-all appearance-none cursor-pointer text-[#111827] dark:text-white" style={{ borderRadius: 'var(--radius)' }}>
                    <option value="active">Active inventory only</option>
                    <option value="all">All dealers</option>
                  </select>
                </div>
                {sp.lat ? <input type="hidden" name="lat" value={sp.lat} /> : null}
                {sp.lng ? <input type="hidden" name="lng" value={sp.lng} /> : null}
                <DealersLocationButton />
                <button className="w-full bg-[#111827] dark:bg-white text-white dark:!text-black py-4 text-[10px] font-bold uppercase tracking-widest transition-transform hover:scale-[0.98]" style={{ borderRadius: 'var(--radius)' }}>
                   Apply Filters
                </button>
              </form>
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
  const response = responseTier(dealer.responseRate, dealer.totalLeads);
  const distance = formatDistance(dealer.distanceValue);

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
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {distance ? (
                  <span className="inline-flex items-center gap-1 text-[9px] font-black px-2 py-1 uppercase tracking-widest text-[#2F855A] bg-[#38A169]/10" style={{ borderRadius: "2px" }}>
                    <MapPin className="w-3 h-3" /> {distance}
                  </span>
                ) : null}
                <span className={`inline-flex items-center text-[9px] font-black px-2 py-1 uppercase tracking-widest ${response.tone}`} style={{ borderRadius: "2px" }}>
                  {response.label}
                </span>
              </div>
           </div>
           <div className="w-12 h-12 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center shrink-0 overflow-hidden shadow-sm" style={{ borderRadius: 'var(--radius)' }}>
              {brandImage ? <img src={brandImage} className="w-full h-full object-cover" /> : <span className="text-sm font-bold text-slate-300 dark:text-slate-500">{dealer.name[0]}</span>}
           </div>
        </div>

        <p className="text-xs text-[#718096] dark:text-slate-400 font-medium line-clamp-2 leading-relaxed mb-5">
           {dealer.description || "A cornerstone of our verified network, offering premium logistics and asset transparency."}
        </p>

        <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
           <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{dealer.activeCars || 0} Listed Units</span>
           <span className="text-[10px] font-bold text-[#38A169] uppercase tracking-widest hover:opacity-70 flex items-center gap-1 group-hover:translate-x-1 transition-all">
              Visit Station <ArrowUpRight className="w-3 h-3" />
           </span>
        </div>
      </div>
    </Link>
  );
}
