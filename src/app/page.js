// src/app/page.js
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import Link from "next/link";
import BrowsePanel from "@/components/BrowsePanel";
import {
  ArrowUpRight, ArrowRight, MapPin, ShieldCheck, Star, BadgeCheck, Compass
} from "lucide-react";
import Image from "next/image";
import { unstable_cache } from "next/cache";
import HeroGridShowcase from "@/components/HeroGridShowcase";
import CarCard from "@/components/CarCard";
import TrackedLink from "@/components/TrackedLink";
import { analyzePrice } from "@/lib/market";
import { absoluteUrl, BRAND_MARK_SQUARE, getSiteOrigin } from "@/lib/site-url";
import { PUBLIC_ONLY_VERIFIED_DEALERS } from "@/lib/feature-flags";

const HERO_BACKGROUND = "/images/backgrounds/pexels-mikebirdy-10123994.jpg";
const DIFFERENCE_BACKGROUND = "/images/backgrounds/pexels-nurcan-aytas-2150089535-32773507.jpg";

function scoreMarketValue(marketAnalysis) {
  if (!marketAnalysis) return 6;
  if (marketAnalysis.comparison <= -10) return 24;
  if (marketAnalysis.comparison < 0) return 18;
  if (marketAnalysis.comparison <= 5) return 10;
  return 4;
}

function scoreFreshness(createdAt) {
  if (!createdAt) return 0;
  const ageDays = Math.max(
    0,
    Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24))
  );
  return Math.max(0, 20 - Math.min(20, ageDays));
}

function rankHotDeals(carsWithAnalysis) {
  const maxViews = carsWithAnalysis.reduce((max, car) => Math.max(max, car._count?.carViews || 0), 0) || 1;
  return [...carsWithAnalysis]
    .map((car) => {
      const viewScore = ((car._count?.carViews || 0) / maxViews) * 55;
      const freshnessScore = scoreFreshness(car.createdAt);
      const valueScore = scoreMarketValue(car.marketAnalysis);
      const trustScore = (car.dealer?.verified ? 8 : 0) + (car.featured ? 5 : 0);
      const hotScore = viewScore + freshnessScore + valueScore + trustScore;
      return { ...car, hotScore };
    })
    .sort((a, b) => b.hotScore - a.hotScore || (b._count?.carViews || 0) - (a._count?.carViews || 0))
    .slice(0, 8);
}

function rotateList(items, offset = 0) {
  if (!Array.isArray(items) || items.length === 0) return [];
  const safeOffset = ((offset % items.length) + items.length) % items.length;
  return [...items.slice(safeOffset), ...items.slice(0, safeOffset)];
}

function getRotationOffset(size) {
  if (!size) return 0;
  const now = new Date();
  // Rotate every 6 hours so the same cars don't dominate all day.
  const slot = Math.floor(now.getUTCHours() / 6);
  const daySeed =
    now.getUTCFullYear() * 1000 +
    Math.floor((Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - Date.UTC(now.getUTCFullYear(), 0, 0)) / 86400000);
  return (daySeed + slot) % size;
}


const getCachedData = unstable_cache(
  async () => {
    const week = new Date(); week.setDate(week.getDate() - 7);
    const publicCarWhere = {
      available: true,
      ...(PUBLIC_ONLY_VERIFIED_DEALERS && { dealer: { verified: true } }),
    };
    const partnerDealerWhere = { OR: [{ featured: true }, { verified: true }] };

    const [
      featured,
      hotThisWeek,
      newArrivals,
      dealers,
      highlightReviews,
      liveListingCount,
      partnerDealerCount,
      newThisWeekCount,
    ] = await Promise.all([
      db.car.findMany({
        where: { ...publicCarWhere, featured: true },
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          dealer: { select: { id: true, name: true, location: true, verified: true, slug: true } },
        },
        take: 8,
        orderBy: { createdAt: "desc" },
      }),
      db.car.findMany({
        where: publicCarWhere,
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          dealer: { select: { id: true, name: true, location: true, verified: true, slug: true } },
          _count: { select: { carViews: true } },
        },
        take: 100, // Get more to sort by views in memory
      }),
      db.car.findMany({
        where: { ...publicCarWhere, createdAt: { gte: week } },
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          dealer: { select: { id: true, name: true, location: true, slug: true } },
        },
        take: 8,
        orderBy: { createdAt: "desc" },
      }),
      db.dealer.findMany({
        where: partnerDealerWhere,
        include: {
          _count: { select: { cars: { where: { available: true } } } },
          users: { select: { avatarUrl: true }, take: 1 },
        },
        take: 8,
        orderBy: [{ featured: "desc" }, { verified: "desc" }, { createdAt: "desc" }],
      }),
      db.dealerReview.findMany({
        where: { comment: { not: null }, rating: { gte: 4 } },
        include: {
          user: { select: { name: true, avatarUrl: true } },
          dealer: { select: { name: true, county: true } }
        },
        take: 10,
        orderBy: { createdAt: "desc" },
      }),
      db.car.count({ where: publicCarWhere }),
      db.dealer.count({ where: partnerDealerWhere }),
      db.car.count({ where: { ...publicCarWhere, createdAt: { gte: week } } }),
    ]);
    return {
      featured,
      hotThisWeek,
      newArrivals,
      dealers,
      highlightReviews,
      liveListingCount,
      partnerDealerCount,
      newThisWeekCount,
    };
  },
  ["homepage-minimal-v6"],
  { revalidate: 900, tags: ["homepage"] }
);

export const metadata = {
  title: "Cars & Dealer Network Kenya",
  description:
    "Find verified Kenyan vehicle inventory from trusted dealerships. Compare total cost of ownership, inspect specs side by side, and contact dealers on Welsh Motorhub.",
  alternates: { canonical: "/" },
  openGraph: {
    url: absoluteUrl("/"),
    title: "Welsh Motorhub — Find Your Car in Kenya",
    description:
      "Find verified Kenyan vehicle inventory from trusted dealerships. Compare costs and specs, contact dealers directly.",
    type: "website",
  },
};

function homeStructuredData(origin) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "Welsh Motorhub",
        url: origin,
        logo: absoluteUrl(BRAND_MARK_SQUARE),
        description:
          "Verified vehicle marketplace connecting buyers with trusted car dealers across Kenya.",
        address: {
          "@type": "PostalAddress",
          addressCountry: "KE",
        },
      },
      {
        "@type": "WebSite",
        name: "Welsh Motorhub",
        url: origin,
        description:
          "Browse used and new listings, compare vehicles, and connect with Kenyan dealerships.",
        potentialAction: {
          "@type": "SearchAction",
          target: `${origin}/cars?search={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };
}

export default async function HomePage() {
  const {
    featured,
    hotThisWeek,
    newArrivals,
    dealers,
    highlightReviews,
    liveListingCount,
    partnerDealerCount,
    newThisWeekCount,
  } = await getCachedData();

  // Build hot deals with blended scoring: demand + freshness + market value + dealer trust.
  const hotCandidates = (hotThisWeek || [])
    .filter(car => car && car._count?.carViews > 0)
    .sort((a, b) => (b._count?.carViews || 0) - (a._count?.carViews || 0))
    .slice(0, 30);

  const hotCandidatesWithAnalysis = await Promise.all(
    hotCandidates.map(async (car) => ({
      ...car,
      marketAnalysis: await analyzePrice(car),
    }))
  );
  const hotSorted = rankHotDeals(hotCandidatesWithAnalysis);

  // Priority: Hot This Week (with views) > Featured > New Arrivals
  const baseSpotlight = hotSorted.length > 0 ? hotSorted : (featured && featured.length > 0) ? featured : newArrivals;

  // Enhance cars with market intelligence
  const [spotlightEnhanced, hotEnhanced, newEnhanced] = await Promise.all([
    Promise.all((baseSpotlight || []).map(async (car) => {
      if (car.marketAnalysis) return car;
      return { ...car, marketAnalysis: await analyzePrice(car) };
    })),
    Promise.all((hotSorted || []).map(async (car) => {
      if (car.marketAnalysis) return car;
      return { ...car, marketAnalysis: await analyzePrice(car) };
    })),
    Promise.all((newArrivals || []).map(async c => ({ ...c, marketAnalysis: await analyzePrice(c) }))),
  ]);

  const spotlightPool = (hotEnhanced.length > 0 ? hotEnhanced : spotlightEnhanced).slice(0, 12);
  const spotlightRotated = rotateList(spotlightPool, getRotationOffset(spotlightPool.length));
  const heroCars = spotlightRotated.slice(0, 2);
  const spotlightShowcaseCars = spotlightRotated.slice(0, 3);

  const origin = getSiteOrigin();

  return (
    <div className="min-h-screen pb-20 bg-white dark:bg-[#0a0a0a]">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(homeStructuredData(origin)),
        }}
      />
      {/* Dynamic Hero Section */}
      <section className="relative border-b border-gray-100 pt-16 pb-10 dark:border-zinc-900 md:pt-20 md:pb-12 overflow-hidden">
        <div className="container relative z-10 mx-auto max-w-7xl px-6">
          <div className="mb-6 animate-in fade-in slide-in-from-bottom-8 text-center duration-700 md:mb-8 lg:text-left">
            <h1 className="mb-3 text-3xl font-bold leading-[1.05] tracking-tight text-[#111827] sm:text-5xl md:text-6xl dark:text-white">
              Buy cars with<br />
              <span className="editorial-heading text-[#38A169]">dealer-level clarity.</span>
            </h1>
            <p className="mx-auto max-w-2xl text-[15px] font-medium leading-relaxed text-[#2D3748] sm:text-base md:text-lg dark:text-[#b9c5e0] lg:mx-0">
              Verified inventory from Kenyan dealers. Compare up to three cars with specs and cost signals, then contact the dealer directly.
            </p>
          </div>

          <div className="mb-5 grid grid-cols-3 gap-2 sm:gap-2.5 lg:mb-6">
            {[
              {
                label: "Partner dealers",
                value: partnerDealerCount,
                hint: "Featured or verified on the network",
              },
              {
                label: "Live listings",
                value: liveListingCount,
                hint: PUBLIC_ONLY_VERIFIED_DEALERS ? "Available cars from verified dealers" : "Available cars on the marketplace",
              },
              {
                label: "New this week",
                value: newThisWeekCount,
                hint: "Listed in the last 7 days",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="border border-slate-200 bg-white/90 px-2.5 py-2.5 dark:border-slate-800 dark:bg-[#111111]/80 sm:px-3 sm:py-3"
                style={{ borderRadius: "var(--radius)" }}
                title={item.hint}
              >
                <p className="text-base font-bold tabular-nums text-[#111827] sm:text-lg dark:text-white">{item.value}</p>
                <p className="mt-0.5 text-[9px] font-bold uppercase leading-tight tracking-widest text-slate-500 dark:text-slate-500">
                  {item.label}
                </p>
              </div>
            ))}
          </div>

          <div className="grid animate-in fade-in grid-cols-1 gap-8 delay-150 duration-700 lg:grid-cols-12 lg:items-start lg:gap-8">
            <div className="text-center lg:col-span-7 lg:text-left xl:col-span-7">
              <div className="w-full text-left">
                <BrowsePanel />
              </div>

              <div className="mx-auto mt-6 grid max-w-md grid-cols-1 gap-2.5 sm:mt-7 sm:max-w-xl sm:grid-cols-2 sm:gap-3 lg:mx-0">
                <TrackedLink
                  href="/cars"
                  eventName="homepage_explore_inventory_click"
                  eventPayload={{ area: "hero" }}
                  className="inline-flex h-11 w-full items-center justify-center bg-[#38A169] px-5 text-xs font-bold uppercase tracking-widest text-white transition-all hover:bg-[#2F855A] active:scale-95 sm:h-12"
                  style={{ borderRadius: 'var(--radius)' }}
                >
                  Explore Inventory
                </TrackedLink>
                <TrackedLink
                  href="/compare"
                  eventName="homepage_compare_cars_click"
                  eventPayload={{ area: "hero" }}
                  className="inline-flex h-11 w-full items-center justify-center border border-slate-200 bg-white px-5 text-xs font-bold uppercase tracking-widest text-[#111827] transition-all hover:border-[#111827] dark:border-slate-800 dark:bg-[#111111] dark:text-white dark:hover:border-white sm:h-12"
                  style={{ borderRadius: 'var(--radius)' }}
                >
                  Compare Cars
                </TrackedLink>
              </div>

              <div
                className="mt-4 border border-slate-200 bg-white/90 p-3 dark:border-slate-800 dark:bg-[#111111]/75 sm:p-4"
                style={{ borderRadius: "var(--radius)" }}
              >
                <p className="mb-1.5 text-center text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 lg:text-left">
                  Quick compare
                </p>
                <p className="mb-3 text-center text-sm leading-snug text-slate-700 dark:text-slate-300 lg:text-left">
                  Specs, annual TCO, and road-readiness side by side.
                </p>
                <TrackedLink
                  href="/compare"
                  eventName="homepage_quick_compare_click"
                  eventPayload={{ area: "hero_card" }}
                  className="inline-flex w-full items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#111827] transition-colors hover:text-[#38A169] dark:text-white lg:inline-flex lg:w-auto lg:justify-start"
                >
                  Start comparing <ArrowRight className="h-4 w-4" />
                </TrackedLink>
              </div>
            </div>

            <div className="hidden lg:block lg:col-span-5 xl:col-span-5 lg:pl-2">
              <HeroGridShowcase 
                cars={heroCars.length >= 2 ? heroCars : spotlightEnhanced.slice(0, 2)} 
                reviews={highlightReviews} 
              />
            </div>
          </div>
        </div>

        {/* Mercedes Brand Background Texture */}
        <div className="absolute inset-0 -z-0 overflow-hidden pointer-events-none">
          <Image
            src={HERO_BACKGROUND}
            fill
            className="object-cover opacity-[0.2] sm:opacity-[0.16] lg:opacity-[0.12]"
            alt=""
            priority
          />
          {/* Softer left wash on small screens so the photo shows through; text stays readable */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/88 via-white/45 dark:from-[#0a0a0a]/88 dark:via-[#0a0a0a]/48 to-transparent lg:hidden" />
        </div>
      </section>


      {/* Spotlight / Trending Section */}
      {hotEnhanced.length > 0 && (
        <section className="py-16 sm:py-24 lg:py-28">
          <div className="container mx-auto px-6 max-w-7xl">
            <div className="mb-12 flex flex-col justify-between gap-5 md:mb-14 md:flex-row md:items-end">
              <div className="max-w-xl">
                <h2 className="mb-3 text-4xl font-normal editorial-heading text-[#111827] dark:text-white sm:text-5xl md:text-6xl">Spotlight</h2>
                <p className="text-base font-medium text-[#718096] dark:text-slate-400">
                  Listings with real buyer interest—ranked from recent views, freshness, and how the ask sits versus similar stock.
                </p>
              </div>
              <TrackedLink
                href="/cars?sort=popular"
                eventName="homepage_view_trending_click"
                eventPayload={{ area: "spotlight" }}
                className="text-[#111827] dark:text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:opacity-70 transition-opacity"
              >
                View Trending <ArrowUpRight className="w-4 h-4" />
              </TrackedLink>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-6 lg:items-stretch">
              <div
                className="flex h-full flex-col border border-black bg-[#fbfcfe] p-7 text-center dark:border-white dark:bg-zinc-900 lg:col-span-3 lg:p-8 lg:text-left"
                style={{ borderRadius: 'var(--radius)' }}
              >
                <div className="mb-5 flex justify-center gap-1.5 text-slate-300 dark:text-slate-700 lg:justify-start">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} />
                  ))}
                </div>
                <h3 className="mb-3 font-serif text-xl font-medium text-[#111827] dark:text-white sm:text-2xl">
                  Browse the full showroom
                </h3>
                <p className="mx-auto mb-6 max-w-[320px] text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400 lg:mx-0">
                  Every listing is uploaded by a real dealership. Filter by price, body type, location, and more—then open any car for full specs and dealer contact.
                </p>
                <Link
                  href="/cars"
                  className="mt-auto w-full bg-[#111827] py-3.5 text-[11px] font-black uppercase tracking-widest text-white transition-transform hover:scale-[0.99] dark:!bg-white dark:!text-[#111827]"
                  style={{ borderRadius: '4px' }}
                >
                  View all vehicles
                </Link>
              </div>

              {spotlightShowcaseCars.map((car) => (
                <div key={car.id} className="min-w-0 lg:col-span-1">
                  <CarCard car={car} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Dealerships */}
      {dealers.length > 0 && (
        <section className="py-16 sm:py-24 lg:py-28 bg-[#F7FAFC] dark:bg-[#111111]">
          <div className="container mx-auto px-6 max-w-7xl">
            <div className="mb-20 text-center max-w-3xl mx-auto">
              <h2 className="text-3xl sm:text-5xl font-bold text-[#111827] dark:text-white mb-6">Partner Dealerships</h2>
              <p className="text-[#718096] dark:text-slate-400 text-lg font-medium leading-relaxed">
                We work exclusively with certified dealerships that meet our strict standards for
                pricing transparency and vehicle verification.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {dealers.slice(0, 6).map((dealer) => (
                <Link
                  key={dealer.id}
                  href={`/dealers/${dealer.slug}`}
                  className="group block bg-white dark:bg-zinc-900 border border-[#E2E8F0] dark:border-slate-800 p-6 sm:p-8 transition-all hover:shadow-xl"
                  style={{ borderRadius: 'var(--radius)' }}
                >
                  <div className="flex items-center gap-5 mb-8">
                    <div className="w-16 h-16 shrink-0 border border-[#EDF2F7] dark:border-slate-800 overflow-hidden flex items-center justify-center p-2" style={{ borderRadius: 'var(--radius)' }}>
                      {dealer.logoUrl ? (
                        <img src={dealer.logoUrl} className="w-full h-full object-contain" alt="" />
                      ) : (
                        <span className="text-xl font-bold text-[#111827] dark:text-white">{dealer.name[0]}</span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-[#111827] dark:text-white text-lg mb-1 group-hover:text-[#38A169] transition-colors">{dealer.name}</h3>
                      <p className="text-xs font-bold text-[#718096] dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <MapPin className="w-3 h-3" /> {dealer.location}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-[#4A5568] dark:text-slate-300 leading-relaxed mb-10 line-clamp-2">
                    {dealer.description || "Partnering with Welsh Motorhub to provide premium verified vehicles."}
                  </p>
                  <div className="pt-6 border-t border-[#EDF2F7] dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-bold text-[#111827] dark:text-slate-300 uppercase tracking-widest">{dealer._count?.cars || 0} Units</span>
                    <span className="text-xs font-bold text-[#38A169] uppercase tracking-widest">Visit Showroom ›</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Editorial Information Block */}
      <section className="relative py-16 sm:py-28 lg:py-36 bg-[#1A202C] text-white overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src={DIFFERENCE_BACKGROUND}
            fill
            className="object-cover opacity-20"
            alt=""
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1A202C] via-[#1A202C]/80 to-transparent" />
        </div>
        <div className="container mx-auto px-6 max-w-7xl relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <div>
              <p className="text-[#38A169] text-xs font-bold uppercase tracking-[0.4em] mb-8">The Difference</p>
              <h2 className="text-4xl sm:text-6xl font-bold leading-[1.1] mb-10">
                Marketplace purity<br />
                <span className="editorial-heading text-[#718096]">without the hassle.</span>
              </h2>
              <p className="text-lg text-[#A0AEC0] leading-relaxed max-w-xl font-medium">
                Tired of recycled listings and unverified sellers? Welsh Motorhub provides a direct link
                to the actual stock sitting on dealership floors. No middlemen, no scraped data,
                just high-fidelity inventory.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
              {[
                { title: "Dealer Verified", icon: <ShieldCheck />, desc: "Every unit is hand-uploaded by real businesses." },
                { title: "Pricing Clarity", icon: <BadgeCheck />, desc: "Final listed prices shown upfront with no hidden calculations." },
                { title: "Direct Contact", icon: <Star />, desc: "Communicate directly via WhatsApp or Phone." },
                { title: "Fresh Stock", icon: <Compass />, desc: "Listings are removed the second they sell." },
              ].map((item, i) => (
                <div key={i} className="flex flex-col gap-4">
                  <div className="text-[#38A169]">{item.icon}</div>
                  <h3 className="font-bold text-lg">{item.title}</h3>
                  <p className="text-sm text-[#A0AEC0] leading-relaxed font-medium">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Fresh Arrivals Section */}
      {newEnhanced.length > 0 && (
        <section className="py-16 sm:py-24 lg:py-28">
          <div className="container mx-auto px-6 max-w-7xl">
            <div className="flex items-end justify-between mb-10 sm:mb-14">
              <div>
                <h2 className="text-3xl sm:text-5xl font-bold text-[#111827] dark:text-white mb-4">Fresh Arrivals</h2>
                <p className="text-[#718096] dark:text-slate-400 text-lg font-medium">The latest units added to our network within the last 7 days.</p>
              </div>
              <Link href="/cars?sort=newest" className="hidden sm:block text-xs font-bold uppercase tracking-widest bg-[#EDF2F7] dark:bg-[#111111] text-[#111827] dark:text-white px-8 py-4 transition-all hover:bg-[#E2E8F0]" style={{ borderRadius: 'var(--radius)' }}>
                See All Arrivals
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {newEnhanced.slice(0, 6).map((car) => (
                <CarCard key={car.id} car={car} />
              ))}
            </div>
            <div className="mt-8 sm:hidden">
              <Link href="/cars?sort=newest" className="block text-center text-xs font-bold uppercase tracking-widest bg-[#EDF2F7] dark:bg-[#111111] text-[#111827] dark:text-white px-6 py-4" style={{ borderRadius: 'var(--radius)' }}>
                See All Arrivals
              </Link>
            </div>
          </div>
        </section>
      )}

    </div>
  );
}
