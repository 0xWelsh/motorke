// src/app/dealers/page.js
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import { buildDealersDirectoryItemList } from "@/lib/seo-dealer";
import { ArrowUpRight, Building2, MapPin, ShieldCheck, Crown } from "lucide-react";
import NearbyDealersList from "@/components/NearbyDealersList";
import DealersLocationButton from "@/components/DealersLocationButton";
import DealersSortSelect from "@/components/DealersSortSelect";
import { unstable_cache } from "next/cache";

/** Self-hosted hero (user asset in public/) — anchored right; gradient mutes toward text on the left. */
const DEALERS_HERO_IMAGE = "/images/backgrounds/car-dealership.jpg";

export const metadata = {
  title: "Trusted car dealers in Kenya",
  description:
    "Search car dealers by name, county, or showroom on BIDGARI. Find verified yards in Nairobi, Kiambu, Mombasa, and across Kenya with live inventory.",
  alternates: { canonical: "/dealers" },
  keywords: [
    "car dealers Kenya",
    "BIDGARI dealers",
    "verified dealerships",
    "automotive showroom Kenya",
    "find car dealer by name Kenya",
  ],
  openGraph: {
    title: "Trusted car dealers in Kenya | BIDGARI",
    description:
      "Browse BIDGARI's verified dealer network: counties, cars in stock, and direct links to each showroom.",
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
  if (!totalLeads || totalLeads < 10) return null;
  if (responseRate >= 0.5) return { label: "Fast replies", tone: "text-[var(--accent)] bg-emerald-500/10" };
  if (responseRate >= 0.2) return { label: "Responsive", tone: "text-sky-300 bg-sky-500/10" };
  return null;
}

const getDealersBaseData = unstable_cache(
  async () => {
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

    return dealers.map((dealer) => {
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

      return { ...dealer, activeCars, totalLeads, respondedLeads, responseRate, score };
    });
  },
  ["dealers-index-base-v1"],
  { revalidate: 60, tags: ["dealers-index"] }
);

export default async function DealersPage({ searchParams }) {
  const sp = await searchParams;
  const search = (sp.search || "").toString().trim();
  const countyFilter = (sp.county || "").toString().trim();
  const verifiedOnly = sp.verified === "1";
  const inventoryMode = (sp.inventory || "active").toString();
  const withActiveInventoryOnly = inventoryMode !== "all";
  const sortMode = (sp.sort || "recommended").toString();
  const userLat = sp.lat ? parseFloat(sp.lat) : null;
  const userLng = sp.lng ? parseFloat(sp.lng) : null;
  const hasLocation = Number.isFinite(userLat) && Number.isFinite(userLng);

  const baseDealers = await getDealersBaseData();
  const enriched = baseDealers.map((dealer) => ({
    ...dealer,
    distanceValue: hasLocation ? distanceKm(userLat, userLng, dealer.lat, dealer.lng) : null,
  }));

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

  const getDistance = (d) => (d.distanceValue == null ? Number.POSITIVE_INFINITY : d.distanceValue);
  const rankedDealers = [...filtered].sort((a, b) => {
    if (sortMode === "nearest") {
      const da = getDistance(a);
      const db = getDistance(b);
      if (da !== db) return da - db;
      if (a.score !== b.score) return b.score - a.score;
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    }
    if (sortMode === "active") {
      if ((b.activeCars ?? 0) !== (a.activeCars ?? 0)) return (b.activeCars ?? 0) - (a.activeCars ?? 0);
      if (a.score !== b.score) return b.score - a.score;
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    }
    if (sortMode === "response") {
      if ((b.responseRate ?? 0) !== (a.responseRate ?? 0)) return (b.responseRate ?? 0) - (a.responseRate ?? 0);
      if (a.score !== b.score) return b.score - a.score;
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    }
    // default: "recommended" (score-based)
    if (a.score !== b.score) return b.score - a.score;
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });

  const counties = [...new Set(enriched.map((d) => d.county).filter(Boolean))].sort();
  const shownVerified = rankedDealers.filter((d) => d.verified).length;
  const shownCars = rankedDealers.reduce((s, d) => s + d.activeCars, 0);
  const dealersDirectoryLd = buildDealersDirectoryItemList(
    baseDealers.map((d) => ({ name: d.name, slug: d.slug }))
  );

  return (
    <div className="bg-gradient-to-b from-[#0a0a0a] via-[#0b0b0b] to-[#0a0a0a] min-h-screen pb-20">
      {dealersDirectoryLd ? (
        <Script
          id="dealers-directory-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(dealersDirectoryLd) }}
        />
      ) : null}
      <div className="pt-2 md:pt-3">
        <div className="relative w-full h-[240px] sm:h-[300px] lg:h-[340px] overflow-hidden bg-[#0a0a0a]">
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
            <div className="w-full max-w-lg md:max-w-xl text-left rounded-2xl bg-black/40 px-5 py-4 sm:px-6 sm:py-5 backdrop-blur-xl animate-dealers-hero-content supports-[backdrop-filter]:bg-black/28">
              <h1 className="text-2xl sm:text-4xl lg:text-[2.75rem] font-black text-white tracking-tight leading-[1.08] mb-3">
                <span className="text-white">Trusted</span>{" "}
                <span className="text-[var(--accent)]">dealer network</span>
              </h1>
              <p className="text-[13px] sm:text-sm text-white font-medium leading-relaxed mb-4 max-w-md">
                Verified dealer network across Kenya. Compare who is stocking what, then step into a profile that feels alive.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-black/35 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white backdrop-blur-sm">
                  <Building2 className="w-3.5 h-3.5 text-[var(--accent)]" />
                  <span className="text-[#ef3340] tabular-nums">{rankedDealers.length}</span> dealers
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-black/35 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white backdrop-blur-sm">
                  <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent)]" />
                  <span className="text-[#ef3340] tabular-nums">{shownVerified}</span> verified
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-black/35 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white backdrop-blur-sm">
                  <span className="font-black text-[#ef3340] tabular-nums">{shownCars}</span>
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

      <div className="relative z-10 w-full mx-auto px-4 sm:px-8 xl:px-10 max-w-[1880px] -mt-7 sm:-mt-9 lg:-mt-11 pt-1 sm:pt-2">
        <div className="h-px w-full max-w-md bg-gradient-to-r from-white/20 via-white/10 to-transparent mb-5 sm:mb-6" aria-hidden />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 sm:mb-6 pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <span className="text-white">Dealers</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
            <DealersSortSelect hasLocation={hasLocation} defaultValue={sortMode} />
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">
              Showing <span className="text-[#ef3340] tabular-nums">{rankedDealers.length}</span> dealer{rankedDealers.length === 1 ? "" : "s"}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-5 gap-y-6 lg:gap-y-8 items-start">
          
          {/* Sidebar */}
          <aside className="order-2 lg:order-1 lg:col-span-3 lg:sticky lg:top-[6.75rem] space-y-4 lg:space-y-5 text-white">
            <details className="lg:hidden overflow-hidden bg-[#111111] border border-white/[0.08] shadow-none pt-px pl-5 pr-5 pb-5 rounded-xl">
              <summary className="cursor-pointer list-none text-xs font-bold uppercase tracking-widest text-white py-5 flex items-center gap-2.5 [&::-webkit-details-marker]:hidden">
                <span className="h-6 w-[3px] shrink-0 rounded-full bg-[var(--accent)]" aria-hidden />
                Refine network
              </summary>
              <form method="GET" className="mt-4 space-y-4">
                <input type="hidden" name="sort" value={sortMode} />
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Search</label>
                  <input name="search" defaultValue={search} type="text" placeholder="Dealer name..." className="w-full bg-[#0a0a0a] border border-white/[0.08] px-4 py-3 text-sm font-medium outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/25 transition-all text-white placeholder:text-zinc-400 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Region</label>
                  <select name="county" defaultValue={countyFilter} className="w-full bg-[#0a0a0a] border border-white/[0.08] px-4 py-3 text-sm font-medium outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/25 transition-all appearance-none cursor-pointer text-white rounded-xl">
                    <option value="" className="bg-[#0a0a0a]">All Regions</option>
                    {counties.map(c => <option key={c} value={c} className="bg-[#0a0a0a]">{c}</option>)}
                  </select>
                </div>
                <label className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-300">
                  <input type="checkbox" name="verified" value="1" defaultChecked={verifiedOnly} className="accent-[var(--accent)]" />
                  Verified only
                </label>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Inventory</label>
                  <select name="inventory" defaultValue={withActiveInventoryOnly ? "active" : "all"} className="w-full bg-[#0a0a0a] border border-white/[0.08] px-4 py-3 text-sm font-medium outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/25 transition-all appearance-none cursor-pointer text-white rounded-xl">
                    <option value="active">Active inventory only</option>
                    <option value="all">All dealers</option>
                  </select>
                </div>
                <DealersLocationButton />
                {sp.lat ? <input type="hidden" name="lat" value={sp.lat} /> : null}
                {sp.lng ? <input type="hidden" name="lng" value={sp.lng} /> : null}
                <button className="w-full bg-white text-black py-3.5 text-[10px] font-black uppercase tracking-widest transition-transform hover:scale-[0.98] rounded-xl">
                  Apply filters
                </button>
              </form>
            </details>

            <div className="hidden lg:block overflow-hidden bg-[#111111] border border-white/[0.08] shadow-none p-6 rounded-xl">
              <h3 className="text-xs font-black uppercase tracking-widest mb-6 text-white flex items-center gap-2.5">
                <span className="h-6 w-[3px] shrink-0 rounded-full bg-[var(--accent)]" aria-hidden />
                Refine network
              </h3>
              <form method="GET" className="space-y-6">
                <input type="hidden" name="sort" value={sortMode} />
                <div className="space-y-2">
                   <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Search</label>
                   <input name="search" defaultValue={search} type="text" placeholder="Dealer name..." className="w-full bg-[#0a0a0a] border border-white/[0.08] px-4 py-3 text-sm font-medium outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/25 transition-all text-white placeholder:text-zinc-400 rounded-xl" />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Region</label>
                   <select name="county" defaultValue={countyFilter} className="w-full bg-[#0a0a0a] border border-white/[0.08] px-4 py-3 text-sm font-medium outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/25 transition-all appearance-none cursor-pointer text-white rounded-xl">
                      <option value="" className="bg-[#0a0a0a]">All Regions</option>
                      {counties.map(c => <option key={c} value={c} className="bg-[#0a0a0a]">{c}</option>)}
                   </select>
                </div>
                <label className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-300">
                  <input type="checkbox" name="verified" value="1" defaultChecked={verifiedOnly} className="accent-[var(--accent)]" />
                  Verified only
                </label>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Inventory</label>
                  <select name="inventory" defaultValue={withActiveInventoryOnly ? "active" : "all"} className="w-full bg-[#0a0a0a] border border-white/[0.08] px-4 py-3 text-sm font-medium outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/25 transition-all appearance-none cursor-pointer text-white rounded-xl">
                    <option value="active">Active inventory only</option>
                    <option value="all">All dealers</option>
                  </select>
                </div>
                {sp.lat ? <input type="hidden" name="lat" value={sp.lat} /> : null}
                {sp.lng ? <input type="hidden" name="lng" value={sp.lng} /> : null}
                <DealersLocationButton />
                <button className="w-full bg-white text-black py-3.5 text-[10px] font-black uppercase tracking-widest transition-transform hover:scale-[0.98] rounded-xl">
                   Apply filters
                </button>
              </form>
            </div>

            <details className="lg:hidden overflow-hidden bg-[#111111] border border-white/[0.08] shadow-none pt-px pl-5 pr-5 pb-5 rounded-xl">
              <summary className="cursor-pointer list-none text-xs font-bold uppercase tracking-widest text-white py-5 flex items-center gap-2.5 [&::-webkit-details-marker]:hidden">
                <span className="h-6 w-[3px] shrink-0 rounded-full bg-[var(--accent)]" aria-hidden />
                Proximity radar
              </summary>
              <div className="mt-4">
                <NearbyDealersList />
              </div>
            </details>

            <div className="hidden lg:block overflow-hidden bg-[#111111] border border-white/[0.08] shadow-none p-6 rounded-xl">
               <h3 className="text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-2.5 text-white">
                 <span className="h-6 w-[3px] shrink-0 rounded-full bg-[var(--accent)]" aria-hidden />
                 Proximity radar
               </h3>
               <NearbyDealersList />
            </div>
          </aside>

          {/* Grid */}
          <main className="order-1 lg:order-2 lg:col-span-9">
            {rankedDealers.length === 0 ? (
              <div className="py-24 text-center bg-[#111111] border border-white/[0.08] rounded-xl">
                <Building2 className="w-10 h-10 text-zinc-700 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">Network offline</h2>
                <p className="text-zinc-400 font-medium text-sm">We couldn&apos;t find any active dealers matching your criteria.</p>
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
    <Link
      href={`/dealers/${dealer.slug}`}
      aria-label={`${dealer.name} cars for sale in ${dealer.location || dealer.county || "Kenya"} | BIDGARI`}
      className="group flex flex-col h-full bg-[#111111] shadow-sm hover:shadow-lg border border-white/[0.06] transition-all hover:border-[var(--accent)]/40 rounded-xl"
    >
      <div className="relative aspect-[2.2/1] min-h-[88px] bg-white/[0.03] overflow-hidden rounded-t-xl">
        <img
          src={bannerImage}
          alt={`${dealer.name} showroom in ${dealer.location || dealer.county || "Kenya"}`}
          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-[1.1s] ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
           {dealer.verified && <span className="bg-yellow-500/15 text-yellow-500 text-[7px] font-black px-1.5 py-0.5 uppercase tracking-widest inline-flex items-center gap-0.5 rounded" style={{ borderRadius: "4px" }}><Crown className="w-2 h-2" aria-hidden />Verified</span>}
           {dealer.featured && <span className="bg-white text-black text-[7px] font-black px-1.5 py-0.5 uppercase tracking-widest rounded" style={{ borderRadius: "4px" }}>Premium</span>}
        </div>
      </div>

      <div className="flex-1 flex flex-col p-3 sm:p-3.5">
        <div className="flex items-start justify-between gap-2 mb-2">
           <div className="min-w-0">
              <h3 className="text-[15px] font-bold text-white group-hover:text-[var(--accent)] transition-colors truncate leading-tight">{dealer.name}</h3>
              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-1 flex items-center gap-1">
                 <MapPin className="w-3 h-3 text-[var(--accent)] shrink-0" /> <span className="truncate">{dealer.location || dealer.county}</span>
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1">
                {distance ? (
                  <span className="inline-flex items-center gap-0.5 text-[8px] font-black px-1.5 py-0.5 uppercase tracking-widest text-[var(--accent)] bg-emerald-500/10 rounded" style={{ borderRadius: "4px" }}>
                    <MapPin className="w-2.5 h-2.5" /> {distance}
                  </span>
                ) : null}
                {response ? (
                  <span className={`inline-flex items-center text-[8px] font-black px-1.5 py-0.5 uppercase tracking-widest ${response.tone} rounded`} style={{ borderRadius: "4px" }}>
                    {response.label}
                  </span>
                ) : null}
              </div>
           </div>
           <div className="w-9 h-9 bg-[#0a0a0a] border border-white/[0.08] flex items-center justify-center shrink-0 overflow-hidden rounded-lg">
              {brandImage ? <img src={brandImage} alt="" className="w-full h-full object-cover" /> : <span className="text-xs font-bold text-zinc-500">{dealer.name[0]}</span>}
           </div>
        </div>

        <p className="text-[11px] text-zinc-400 font-medium line-clamp-2 leading-snug mb-3 flex-1">
           {dealer.description || "Verified partner with transparent inventory and direct contact."}
        </p>

        <div className="mt-auto pt-2.5 flex items-center justify-between border-t border-white/[0.08]">
           <span className="text-[9px] font-black uppercase tracking-widest tabular-nums">
             <span className="text-[#ef3340]">{dealer.activeCars || 0}</span>{" "}
             <span className="text-zinc-400 font-bold">cars</span>
           </span>
           <span className="text-[9px] font-black text-[var(--accent)] uppercase tracking-widest flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
              Showroom <ArrowUpRight className="w-3 h-3" />
           </span>
        </div>
      </div>
    </Link>
  );
}
