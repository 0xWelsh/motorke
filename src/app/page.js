// src/app/page.js
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { formatPrice, formatCarPrice } from "@/lib/utils";
import Link from "next/link";
import NewsRibbon from "@/components/NewsRibbon";
import HeroReviews from "@/components/HeroReviews";
import BrowsePanel from "@/components/BrowsePanel";
import {
  ArrowUpRight, ArrowRight, Sparkles, ChevronRight, Bookmark, MapPin, ShieldCheck, Star, BadgeCheck, Compass
} from "lucide-react";
import Image from "next/image";
import { unstable_cache } from "next/cache";
import HeroShowcase from "@/components/HeroShowcase";
import HeroGridShowcase from "@/components/HeroGridShowcase";
import CarCard from "@/components/CarCard";
import TrackedLink from "@/components/TrackedLink";
import { analyzePrice } from "@/lib/market";
import { absoluteUrl, BRAND_MARK_SQUARE, getSiteOrigin } from "@/lib/site-url";

const HERO_BACKGROUND = "/images/backgrounds/hero-section-background.jpeg";
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
    const [featured, hotThisWeek, newArrivals, dealers, newsItems, dealerReviews, carReviews] = await Promise.all([
      db.car.findMany({
        where: { available: true, featured: true },
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          dealer: { select: { id: true, name: true, location: true, verified: true, slug: true } },
        },
        take: 8,
        orderBy: { createdAt: "desc" },
      }),
      db.car.findMany({
        where: { available: true },
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          dealer: { select: { id: true, name: true, location: true, verified: true, slug: true } },
          _count: { select: { carViews: true } },
        },
        take: 100, // Get more to sort by views in memory
      }),
      db.car.findMany({
        where: { available: true, createdAt: { gte: week } },
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          dealer: { select: { id: true, name: true, location: true, slug: true } },
        },
        take: 8,
        orderBy: { createdAt: "desc" },
      }),
      db.dealer.findMany({
        where: { OR: [{ featured: true }, { verified: true }] },
        include: {
          _count: { select: { cars: { where: { available: true } } } },
          users: { select: { avatarUrl: true }, take: 1 },
        },
        take: 8,
        orderBy: [{ featured: "desc" }, { verified: "desc" }, { createdAt: "desc" }],
      }),
      db.article.findMany({
        orderBy: { publishedAt: "desc" },
        take: 8,
        select: {
          id: true,
          title: true,
          url: true,
          sourceName: true,
          publishedAt: true,
        },
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
      db.carReview.findMany({
        where: { comment: { not: null }, rating: { gte: 4 } },
        include: {
          user: { select: { name: true, avatarUrl: true } },
          car: {
            select: {
              make: true,
              model: true,
              dealer: { select: { name: true, county: true } },
            },
          },
        },
        take: 10,
        orderBy: { createdAt: "desc" },
      }),
    ]);
    const combinedReviews = [
      ...(dealerReviews || []).map((r) => ({
        ...r,
        source: "dealer",
      })),
      ...(carReviews || []).map((r) => ({
        ...r,
        source: "car",
        dealer: r.car?.dealer || null,
        comment:
          r.comment ||
          `Great ${r.car?.make || ""} ${r.car?.model || ""} experience.`,
      })),
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 12);

    return { featured, hotThisWeek, newArrivals, dealers, newsItems, highlightReviews: combinedReviews };
  },
  ["homepage-minimal-v5"],
  { revalidate: 900, tags: ["homepage"] }
);

const getCachedHomeEnriched = unstable_cache(
  async () => {
    const { featured, hotThisWeek, newArrivals, dealers, newsItems, highlightReviews } = await getCachedData();

    // Build hot deals with blended scoring: demand + freshness + market value + dealer trust.
    const hotCandidates = (hotThisWeek || [])
      .filter((car) => car && car._count?.carViews > 0)
      .sort((a, b) => (b._count?.carViews || 0) - (a._count?.carViews || 0))
      .slice(0, 12);

    const hotCandidatesWithAnalysis = await Promise.all(
      hotCandidates.map(async (car) => ({
        ...car,
        marketAnalysis: await analyzePrice(car),
      }))
    );
    const hotSorted = rankHotDeals(hotCandidatesWithAnalysis);

    // Priority: Hot This Week (with views) > Featured > New Arrivals
    const baseSpotlight =
      hotSorted.length > 0 ? hotSorted : featured && featured.length > 0 ? featured : newArrivals;

    // Enhance cars with market intelligence
    const [spotlightEnhanced, hotEnhanced, newEnhanced] = await Promise.all([
      Promise.all(
        (baseSpotlight || []).map(async (car) => {
          if (car.marketAnalysis) return car;
          return { ...car, marketAnalysis: await analyzePrice(car) };
        })
      ),
      Promise.all(
        (hotSorted || []).map(async (car) => {
          if (car.marketAnalysis) return car;
          return { ...car, marketAnalysis: await analyzePrice(car) };
        })
      ),
      Promise.all((newArrivals || []).slice(0, 6).map(async (c) => ({ ...c, marketAnalysis: await analyzePrice(c) }))),
    ]);

    return {
      featured,
      hotThisWeek,
      newArrivals,
      dealers,
      newsItems,
      highlightReviews,
      spotlightEnhanced,
      hotEnhanced,
      newEnhanced,
    };
  },
  ["homepage-enriched-v1"],
  { revalidate: 300, tags: ["homepage"] }
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
    newsItems,
    highlightReviews,
    spotlightEnhanced,
    hotEnhanced,
    newEnhanced,
  } = await getCachedHomeEnriched();

  const showcaseItems = [
    ...(featured || hotThisWeek || newArrivals || []).slice(0, 6).map(c => ({ ...c, type: 'car' })),
    ...(highlightReviews || []).slice(0, 6).map(r => ({ ...r, type: 'review' }))
  ].sort(() => Math.random() - 0.5);

  const spotlightPool = (hotEnhanced.length > 0 ? hotEnhanced : spotlightEnhanced).slice(0, 12);
  const spotlightRotated = rotateList(spotlightPool, getRotationOffset(spotlightPool.length));
  const heroCars = spotlightRotated.slice(0, 8);
  const spotlightCards = spotlightRotated.slice(0, 8);
  const heroPrimary = heroCars?.[0] || spotlightEnhanced?.[0] || null;

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
      <section className="relative pt-4 pb-8 md:pt-6 md:pb-10 lg:pt-8 lg:pb-12 overflow-hidden border-b border-gray-100 dark:border-zinc-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[min(90vw,1600px)] relative z-10">
          
          {/* Page Header - Full Width */}
          <div className="mb-6 md:mb-8 lg:mb-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 text-center lg:text-left">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[4.25rem] font-bold text-[#111827] dark:text-white leading-[0.92] tracking-tight mb-4 lg:max-w-4xl">
              Buy cars with<br />
              <span className="editorial-heading text-[#38A169]">dealer-level clarity.</span>
            </h1>

            <p className="text-base md:text-lg lg:text-[1.15rem] text-[#2D3748] dark:text-[#b9c5e0] leading-relaxed max-w-3xl lg:max-w-4xl font-medium mx-auto lg:mx-0">
              Find verified Kenyan inventory with transparent ownership costs in minutes.
              Compare up to three cars, inspect real running-cost and road-readiness signals, then contact real dealers directly.
            </p>
          </div>

          {/* Side-by-Side Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 lg:items-start animate-in fade-in duration-1000 delay-200">
            <div className="lg:col-span-6 xl:col-span-6 text-center lg:text-left">
              <div className="w-full text-left">
                <BrowsePanel />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-6 sm:mt-8 max-w-md sm:max-w-xl mx-auto lg:mx-0">
                <TrackedLink
                  href="/cars"
                  eventName="homepage_explore_inventory_click"
                  eventPayload={{ area: "hero" }}
                  className="h-12 w-full inline-flex items-center justify-center bg-[#38A169] hover:bg-[#2F855A] text-white px-6 text-xs font-bold uppercase tracking-widest transition-all hover:scale-[0.98] active:scale-95"
                  style={{ borderRadius: 'var(--radius)' }}
                >
                  Explore Inventory
                </TrackedLink>
                <TrackedLink
                  href="/compare"
                  eventName="homepage_compare_cars_click"
                  eventPayload={{ area: "hero" }}
                  className="h-12 w-full inline-flex items-center justify-center bg-white dark:bg-[#111111] border border-slate-200 dark:border-slate-800 text-[#111827] dark:text-white px-6 text-xs font-bold uppercase tracking-widest transition-all hover:border-[#111827] dark:hover:border-white"
                  style={{ borderRadius: 'var(--radius)' }}
                >
                  Compare Cars
                </TrackedLink>
              </div>

              <div className="mt-6 sm:mt-7 p-4 border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#111111]/70" style={{ borderRadius: "var(--radius)" }}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3 text-center lg:text-left">Quick compare</p>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-4 text-center lg:text-left">
                  Side-by-side specs, annual TCO, and road readiness in one clean sheet.
                </p>
                <TrackedLink
                  href="/compare"
                  eventName="homepage_quick_compare_click"
                  eventPayload={{ area: "hero_card" }}
                  className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#111827] dark:text-white hover:text-[#38A169] transition-colors justify-center lg:justify-start w-full lg:w-auto"
                >
                  Start comparing <ArrowRight className="w-4 h-4" />
                </TrackedLink>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-4 sm:mt-5">
                {[
                  { label: "Verified dealers", value: `${dealers.length}+` },
                  { label: "Live listings", value: `${(hotThisWeek || []).length}+` },
                  { label: "Updated", value: "Daily" },
                ].map((item) => (
                  <div key={item.label} className="p-3 border border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-[#111111]/70" style={{ borderRadius: "var(--radius)" }}>
                    <p className="text-lg sm:text-xl font-bold text-[#111827] dark:text-white">{item.value}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-500 mt-1">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="hidden lg:block lg:col-span-6 xl:col-span-6 lg:pl-3 xl:pl-5">
              <HeroGridShowcase 
                cars={heroCars.length >= 2 ? heroCars : spotlightEnhanced.slice(0, 6)} 
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


      {/* Hot Deals / Trending Section */}
      {hotEnhanced.length > 0 && (
        <section className="py-16 sm:py-20 lg:py-26 xl:py-32 bg-gradient-to-b from-white via-red-50/45 to-slate-50/85 dark:from-[#0a0a0a] dark:via-[#160a0b] dark:to-[#0d0f10] border-y border-red-100/60 dark:border-red-950/40">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[min(90vw,1600px)]">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
              <div className="max-w-2xl">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#dc2626] dark:text-red-400 mb-2">Hot deals</p>
                <h2 className="text-4xl sm:text-6xl lg:text-7xl font-normal editorial-heading text-[#111827] dark:text-white mb-3">Spotlight</h2>
                <p className="text-[#718096] dark:text-slate-400 text-base sm:text-lg font-medium">
                  Verified listings currently receiving the most buyer interest and strongest value signals.
                </p>
              </div>
              <TrackedLink
                href="/cars?sort=popular"
                eventName="homepage_view_trending_click"
                eventPayload={{ area: "spotlight" }}
                className="inline-flex h-11 items-center text-[#b91c1c] dark:text-red-300 text-xs font-bold uppercase tracking-widest gap-2 hover:opacity-70 transition-opacity"
              >
                View Trending <ArrowUpRight className="w-4 h-4" />
              </TrackedLink>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 items-stretch">
              {spotlightCards.map((car) => (
                <div key={car.id} className="h-full">
                  <CarCard car={car} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Dealerships */}
      {dealers.length > 0 && (
        <section className="py-10 sm:py-14 lg:py-18 xl:py-20 bg-[#F7FAFC] dark:bg-[#111111]">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[min(90vw,1600px)]">
            <div className="mb-10 text-center max-w-3xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-bold text-[#111827] dark:text-white mb-4">Partner Dealerships</h2>
              <p className="text-[#718096] dark:text-slate-400 text-lg font-medium leading-relaxed">
                We work exclusively with certified dealerships that meet our strict standards for
                pricing transparency and vehicle verification.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
              {dealers.slice(0, 6).map((dealer) => (
                <Link
                  key={dealer.id}
                  href={`/dealers/${dealer.slug}`}
                  className="group block h-full bg-white dark:bg-zinc-900 border border-[#E2E8F0] dark:border-slate-800 p-5 sm:p-6 transition-all hover:shadow-xl"
                  style={{ borderRadius: 'var(--radius)' }}
                >
                  <div className="flex items-center gap-4 mb-5">
                    <div className="relative w-16 h-16 shrink-0 border border-[#EDF2F7] dark:border-slate-800 overflow-hidden flex items-center justify-center p-2" style={{ borderRadius: 'var(--radius)' }}>
                      {dealer.logoUrl ? (
                        <Image src={dealer.logoUrl} fill className="object-contain" alt="" sizes="64px" />
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
                  <p className="text-sm text-[#4A5568] dark:text-slate-300 leading-relaxed mb-6 line-clamp-2">
                    {dealer.description || "Partnering with Welsh Motorhub to provide premium verified vehicles."}
                  </p>
                  <div className="pt-4 border-t border-[#EDF2F7] dark:border-slate-800 flex items-center justify-between">
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
      <section className="relative py-12 sm:py-16 lg:py-20 xl:py-24 bg-[#1A202C] text-white overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src={DIFFERENCE_BACKGROUND}
            fill
            className="object-cover opacity-20"
            alt=""
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1A202C] via-[#1A202C]/80 to-transparent" />
        </div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[min(90vw,1600px)] relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-[#38A169] text-xs font-bold uppercase tracking-[0.32em] mb-5">The Difference</p>
              <h2 className="text-3xl sm:text-5xl font-bold leading-[1.1] mb-6">
                Marketplace purity<br />
                <span className="editorial-heading text-[#718096]">without the hassle.</span>
              </h2>
              <p className="text-base sm:text-lg text-[#A0AEC0] leading-relaxed max-w-xl font-medium">
                Tired of recycled listings and unverified sellers? Welsh Motorhub provides a direct link
                to the actual stock sitting on dealership floors. No middlemen, no scraped data,
                just high-fidelity inventory.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-stretch">
              {[
                { title: "Dealer Verified", icon: <ShieldCheck />, desc: "Every unit is hand-uploaded by real businesses." },
                { title: "Pricing Clarity", icon: <BadgeCheck />, desc: "Final listed prices shown upfront with no hidden calculations." },
                { title: "Direct Contact", icon: <Star />, desc: "Communicate directly via WhatsApp or Phone." },
                { title: "Fresh Stock", icon: <Compass />, desc: "Listings are removed the second they sell." },
              ].map((item, i) => (
                <div key={i} className="flex h-full flex-col gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
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
        <section className="py-10 sm:py-14 lg:py-18 xl:py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[min(90vw,1600px)]">
            <div className="flex items-end justify-between mb-7 sm:mb-9">
              <div>
                <h2 className="text-3xl sm:text-5xl font-bold text-[#111827] dark:text-white mb-4">Fresh Arrivals</h2>
                <p className="text-[#718096] dark:text-slate-400 text-lg font-medium">The latest units added to our network within the last 7 days.</p>
              </div>
              <Link href="/cars?sort=newest" className="hidden sm:block text-xs font-bold uppercase tracking-widest bg-[#EDF2F7] dark:bg-[#111111] text-[#111827] dark:text-white px-8 py-4 transition-all hover:bg-[#E2E8F0]" style={{ borderRadius: 'var(--radius)' }}>
                See All Arrivals
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6 items-stretch">
              {newEnhanced.slice(0, 6).map((car) => (
                <div key={car.id} className="h-full">
                  <CarCard car={car} />
                </div>
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
