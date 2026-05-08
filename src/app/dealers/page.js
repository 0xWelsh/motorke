// src/app/dealers/page.js
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Building2, MapPin, ShieldCheck } from "lucide-react";
import NearbyDealersList from "@/components/NearbyDealersList";
import DealersLocationButton from "@/components/DealersLocationButton";

/** Self-hosted hero (user asset in public/) — anchored right; gradient mutes toward text on the left. */
const DEALERS_HERO_IMAGE = "/images/backgrounds/car-dealership.jpg";

export const metadata = {
  title: "Trusted car dealers in Kenya",
  description:
    "Discover verified car dealerships across Kenya. View locations, inventory counts, and open each dealer showroom on Welsh Motorhub.",
  alternates: { canonical: "/dealers" },
  keywords: ["car dealers Kenya", "Welsh Motorhub dealers", "verified dealerships", "automotive showroom Kenya"],
  openGraph: {
    title: "Trusted car dealers in Kenya | Welsh Motorhub",
    description:
      "Browse Welsh Motorhub’s verified dealer network: counties, cars in stock, and direct links to each showroom.",
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
  const shownVerified = rankedDealers.filter((d) => d.verified).length;
  const shownCars = rankedDealers.reduce((s, d) => s + d.activeCars, 0);

  return (
    <div className="bg-gradient-to-b from-[#f8fafc] via-white to-white dark:from-[#0a0a0a] dark:via-[#0b0b0b] dark:to-[#0a0a0a] min-h-screen pb-20">
      <div className="pt-16 md:pt-20">
        <div className="relative w-full h-[240px] sm:h-[300px] lg:h-[340px] overflow-hidden bg-slate-950">
          <Image
            src={DEALERS_HERO_IMAGE}
            alt="Car dealership showroom"
            fill
            priority
            sizes="100vw"
            className="object-cover object-right scale-[1.06] animate-dealers-hero-image"
          />
          {/* Left: heavy veil for type; right: photo stays vivid (anchored with object-right). */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, rgb(2, 6, 23) 0%, rgba(15, 23, 42, 0.94) 26%, rgba(15, 23, 42, 0.52) 52%, rgba(15, 23, 42, 0.14) 74%, transparent 88%)",
            }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent to-[56%]"
            aria-hidden
          />
          <div className="relative z-10 h-full max-w-[1880px] mx-auto px-4 sm:px-8 xl:px-10 flex items-center justify-start">
            <div className="w-full max-w-lg md:max-w-xl text-left rounded-2xl bg-black/40 px-5 py-4 sm:px-6 sm:py-5 backdrop-blur-xl shadow-[0_28px_90px_-20px_rgba(0,0,0,0.75),0_12px_40px_-24px_rgba(0,0,0,0.5)] animate-dealers-hero-content supports-[backdrop-filter]:bg-black/28">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white mb-2">Welsh Motorhub</p>
              <h1 className="text-2xl sm:text-4xl lg:text-[2.75rem] font-black text-white tracking-tight leading-[1.08] mb-3 drop-shadow-sm">
                Trusted <span className="text-[#4ade80]">dealer network</span>
              </h1>
              <p className="text-[13px] sm:text-sm text-white font-medium leading-relaxed mb-4 max-w-md [text-shadow:0_1px_2px_rgba(0,0,0,0.55)]">
                Verified showrooms across Kenya—compare who is stocking what, then step into a profile that feels alive.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-black/35 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white backdrop-blur-sm shadow-[0_10px_30px_-12px_rgba(0,0,0,0.55)]">
                  <Building2 className="w-3.5 h-3.5 text-[#4ade80]" />
                  {rankedDealers.length} dealers
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-black/35 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white backdrop-blur-sm shadow-[0_10px_30px_-12px_rgba(0,0,0,0.55)]">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#4ade80]" />
                  {shownVerified} verified
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-black/35 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white backdrop-blur-sm shadow-[0_10px_30px_-12px_rgba(0,0,0,0.55)]">
                  <span className="font-black text-[#f87171] tabular-nums">{shownCars}</span>
                  <span className="text-white">cars</span>
                </span>
              </div>
              {hasLocation ? (
                <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.14em] text-green-300">
                  Sorted by distance from you
                </p>
              ) : (
                <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.14em] text-white/85">
                  Enable location to see nearest dealers first
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="w-full mx-auto px-4 sm:px-8 xl:px-10 max-w-[1880px] pt-6 sm:pt-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 sm:mb-8 pb-3 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            <Link href="/" className="hover:text-slate-900 dark:hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <span className="text-slate-900 dark:text-white">Dealers</span>
          </div>
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            Showing {rankedDealers.length} dealer{rankedDealers.length === 1 ? "" : "s"}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-4 gap-y-8 lg:gap-y-10 items-start">
          
          {/* Sidebar */}
          <aside className="order-2 lg:order-1 lg:col-span-3 lg:sticky lg:top-32 space-y-4 lg:space-y-6 text-[#111827] dark:text-white">
            <details className="lg:hidden bg-[#F7FAFC] dark:bg-[#111111] border border-[#E2E8F0] dark:border-slate-800 p-5" style={{ borderRadius: "var(--radius)" }}>
              <summary className="cursor-pointer list-none text-xs font-bold uppercase tracking-widest text-slate-900 dark:text-slate-100">
                Refine Network
              </summary>
              <form method="GET" className="mt-4 space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">Search</label>
                  <input name="search" defaultValue={search} type="text" placeholder="Dealer name..." className="w-full bg-white dark:bg-[#0a0a0a] border border-[#E2E8F0] dark:border-slate-800 px-4 py-3 text-sm font-medium outline-none focus:border-[#38A169] transition-all text-[#111827] dark:text-white placeholder:text-slate-400" style={{ borderRadius: "var(--radius)" }} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">Region</label>
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
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">Inventory</label>
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
              <h3 className="text-xs font-bold uppercase tracking-widest mb-6 text-slate-900 dark:text-slate-100">Refine Network</h3>
              <form method="GET" className="space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">Search</label>
                   <input name="search" defaultValue={search} type="text" placeholder="Dealer name..." className="w-full bg-white dark:bg-[#0a0a0a] border border-[#E2E8F0] dark:border-slate-800 px-4 py-3 text-sm font-medium outline-none focus:border-[#38A169] transition-all text-[#111827] dark:text-white placeholder:text-slate-400" style={{ borderRadius: 'var(--radius)' }} />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">Region</label>
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
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">Inventory</label>
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
              <summary className="cursor-pointer list-none text-xs font-bold uppercase tracking-widest text-slate-900 dark:text-slate-100">
                Proximity Radar
              </summary>
              <div className="mt-4">
                <NearbyDealersList />
              </div>
            </details>

            <div className="hidden lg:block bg-[#F7FAFC] dark:bg-[#111111] border border-[#E2E8F0] dark:border-slate-800 p-6" style={{ borderRadius: 'var(--radius)' }}>
               <h3 className="text-xs font-bold uppercase tracking-widest mb-6 divider-line text-slate-900 dark:text-slate-100">Proximity Radar</h3>
               <NearbyDealersList />
            </div>
          </aside>

          {/* Grid */}
          <main className="order-1 lg:order-2 lg:col-span-9">
            {rankedDealers.length === 0 ? (
              <div className="py-24 text-center bg-[#F7FAFC] dark:bg-[#111111] border border-[#E2E8F0] dark:border-slate-800" style={{ borderRadius: 'var(--radius)' }}>
                <Building2 className="w-10 h-10 text-[#CBD5E0] dark:text-slate-700 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-[#111827] dark:text-white mb-2">Network offline</h2>
                <p className="text-slate-600 dark:text-slate-400 dark:text-slate-400 font-medium text-sm">We couldn&apos;t find any active dealers matching your criteria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
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
  const bannerImage = dealer.bannerUrl || "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&q=80&w=900";
  const response = responseTier(dealer.responseRate, dealer.totalLeads);
  const distance = formatDistance(dealer.distanceValue);

  return (
    <Link href={`/dealers/${dealer.slug}`} className="group flex flex-col h-full bg-white dark:bg-[#111111] shadow-sm hover:shadow-lg border border-slate-100/90 dark:border-slate-800 transition-all hover:border-[#22c55e]/50 dark:hover:border-[#22c55e]/40" style={{ borderRadius: "12px" }}>
      <div className="relative aspect-[2.2/1] min-h-[88px] bg-slate-100 dark:bg-slate-900 overflow-hidden" style={{ borderTopLeftRadius: "12px", borderTopRightRadius: "12px" }}>
        <img src={bannerImage} alt={dealer.name} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-[1.1s] ease-out" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
           {dealer.verified && <span className="bg-[#22c55e] text-white text-[7px] font-black px-1.5 py-0.5 uppercase tracking-widest" style={{ borderRadius: "4px" }}>Verified</span>}
           {dealer.featured && <span className="bg-[#111827] text-white text-[7px] font-black px-1.5 py-0.5 uppercase tracking-widest" style={{ borderRadius: "4px" }}>Premium</span>}
        </div>
      </div>

      <div className="flex-1 flex flex-col p-3 sm:p-3.5">
        <div className="flex items-start justify-between gap-2 mb-2">
           <div className="min-w-0">
              <h3 className="text-[15px] font-bold text-[#111827] dark:text-white group-hover:text-[#22c55e] transition-colors truncate leading-tight">{dealer.name}</h3>
              <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-1">
                 <MapPin className="w-3 h-3 text-[#22c55e] shrink-0" /> <span className="truncate">{dealer.location || dealer.county}</span>
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1">
                {distance ? (
                  <span className="inline-flex items-center gap-0.5 text-[8px] font-black px-1.5 py-0.5 uppercase tracking-widest text-[#15803d] dark:text-emerald-400 bg-emerald-500/10" style={{ borderRadius: "4px" }}>
                    <MapPin className="w-2.5 h-2.5" /> {distance}
                  </span>
                ) : null}
                <span className={`inline-flex items-center text-[8px] font-black px-1.5 py-0.5 uppercase tracking-widest ${response.tone}`} style={{ borderRadius: "4px" }}>
                  {response.label}
                </span>
              </div>
           </div>
           <div className="w-9 h-9 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center shrink-0 overflow-hidden" style={{ borderRadius: "8px" }}>
              {brandImage ? <img src={brandImage} alt="" className="w-full h-full object-cover" /> : <span className="text-xs font-bold text-slate-300 dark:text-slate-500">{dealer.name[0]}</span>}
           </div>
        </div>

        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium line-clamp-2 leading-snug mb-3 flex-1">
           {dealer.description || "Verified partner on Welsh Motorhub—transparent inventory and direct contact."}
        </p>

        <div className="mt-auto pt-2.5 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
           <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest tabular-nums">
             {dealer.activeCars || 0} <span className="text-slate-500 dark:text-slate-400 font-bold">cars</span>
           </span>
           <span className="text-[9px] font-black text-[#22c55e] uppercase tracking-widest flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
              Showroom <ArrowUpRight className="w-3 h-3" />
           </span>
        </div>
      </div>
    </Link>
  );
}
