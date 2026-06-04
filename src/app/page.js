// src/app/page.js
export const dynamic = "force-dynamic";
import BrowsePanel from "@/components/BrowsePanel";
import {
  ArrowUpRight,
  ArrowRight,
  Building2,
  MessageCircle,
  GitCompare,
  RefreshCw,
  Search,
} from "lucide-react";
import Image from "next/image";
import HeroGridShowcase from "@/components/HeroGridShowcase";
import CarCard from "@/components/CarCard";
import TrackedLink from "@/components/TrackedLink";
import HomepageShopLinks from "@/components/home/HomepageShopLinks";
import HomepageTrending from "@/components/home/HomepageTrending";
import HomepageSpotlight from "@/components/home/HomepageSpotlight";
import HomepageDutyTeaser from "@/components/home/HomepageDutyTeaser";
import HomepageHeroCarFinder from "@/components/home/HomepageHeroCarFinder";
import HomepageSupportWhatsApp from "@/components/home/HomepageSupportWhatsApp";
import HomepageCompareDiscovery from "@/components/home/HomepageCompareDiscovery";
import SeasonalPromoModal from "@/components/SeasonalPromoModal";
import { getHomepageData } from "@/lib/homepage-cache";
import { getBrowseInventoryCounts } from "@/lib/browse-inventory-counts";
import { isActiveListingBoost } from "@/lib/listing-boost";
import { absoluteUrl, BRAND_MARK_SQUARE, getSiteOrigin, absoluteMediaUrl } from "@/lib/site-url";
import { carListingPath } from "@/lib/car-listing-url";
import { listPublishedSeoPages, SEO_CONTENT_TYPES } from "@/lib/seo-content";

const DIFFERENCE_BACKGROUND = "/images/backgrounds/pexels-nurcan-aytas-2150089535-32773507.jpg";
const HOMEPAGE_HERO_BACKGROUND = "/images/backgrounds/herosectionbackgroud.jpeg";

/** Pick the first usable car photo from a list to use as a section
 *  backdrop. Falls back to null when the section has no cars yet so
 *  the section renders a clean gradient instead of a broken <img>. */
function pickSectionBackdrop(cars) {
  for (const car of cars || []) {
    const url = car?.images?.[0]?.url;
    if (typeof url === "string" && url) return url;
  }
  return null;
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

/** Deterministic shuffle for SSR when no boosted listings are available. */
function shuffleWithSeed(items, seed = 0) {
  if (!Array.isArray(items) || items.length < 2) return items || [];
  const arr = [...items];
  let s = seed || 1;
  for (let i = arr.length - 1; i > 0; i -= 1) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const metadata = {
  title: "Buy Used and New Cars in Kenya | Verified Nairobi & Mombasa Dealers",
  description:
    "Find verified used cars for sale in Nairobi, Mombasa, and across Kenya. Compare total ownership costs, inspect specs, and contact trusted car dealers directly on Welsh Motorhub.",
  alternates: { canonical: "/" },
  openGraph: {
    url: absoluteUrl("/"),
    title: "Buy Used and New Cars for sale in Kenya | Welsh Motorhub",
    description:
      "Verified vehicle inventory from trusted Kenyan dealers in Nairobi and Mombasa. Compare costs, specs, and contact sellers directly.",
    type: "website",
  },
};

function homeStructuredData(origin, spotlightCars = [], newCars = []) {
  const allCars = [...spotlightCars, ...newCars.slice(0, 8)];
  
  const productSchemas = allCars.map((car, idx) => ({
    "@type": "Product",
    "name": `${car.year} ${car.make} ${car.model} ${car.variant || ""}`.trim(),
    "image": absoluteMediaUrl(car?.images?.[0]?.url || car?.image),
    "description": `Verified ${car.condition} ${car.make} ${car.model} for sale by ${car.dealer?.name || "verified dealer"} in ${car.dealer?.location || "Kenya"}.`,
    "offers": {
      "@type": "Offer",
      "url": absoluteUrl(carListingPath(car)),
      "priceCurrency": "KES",
      "price": car.price,
      "availability": "https://schema.org/InStock",
      "itemCondition": car.condition === "NEW" ? "https://schema.org/NewCondition" : "https://schema.org/UsedCondition"
    }
  }));

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
      {
        "@type": "ItemList",
        "name": "Featured Cars in Kenya",
        "numberOfItems": productSchemas.length,
        "itemListElement": productSchemas.map((p, i) => ({
          "@type": "ListItem",
          "position": i + 1,
          "item": p
        }))
      }
    ],
  };
}

export default async function HomePage() {
  const [homepageBundle, browseInventoryCounts, seoComparisons] = await Promise.all([
    getHomepageData(),
    getBrowseInventoryCounts(),
    listPublishedSeoPages({ type: SEO_CONTENT_TYPES.COMPARISON, take: 4 }),
  ]);

  const {
    featured,
    hotThisWeek,
    newArrivals,
    dealers,
    newsItems,
    highlightReviews,
    heroBoosted,
    heroFallback,
    homepageSpotlight,
    mostViewedEnhanced,
    newEnhanced,
  } = homepageBundle;

  const boostedHero = (heroBoosted || []).filter((car) => isActiveListingBoost(car));
  const fallbackHeroPool =
    (heroFallback?.length ? heroFallback : null) ||
    [...(featured || []), ...(newArrivals || [])];
  const heroSeed = getRotationOffset(fallbackHeroPool.length);

  let heroPool;
  if (boostedHero.length > 0) {
    const rotatedBoosted = rotateList(boostedHero, getRotationOffset(boostedHero.length));
    if (rotatedBoosted.length >= 2) {
      heroPool = rotatedBoosted;
    } else {
      // Grid needs two cards; pad with one random listing when only one boost is active.
      const boostedIds = new Set(rotatedBoosted.map((c) => c.id));
      const filler = shuffleWithSeed(
        fallbackHeroPool.filter((c) => !boostedIds.has(c.id)),
        heroSeed
      )[0];
      heroPool = filler ? [...rotatedBoosted, filler] : rotatedBoosted;
    }
  } else {
    heroPool = shuffleWithSeed(fallbackHeroPool, heroSeed);
  }
  heroPool = heroPool.slice(0, 12);
  const heroCars = heroPool.slice(0, 8);

  /** Rotating random inventory (paid boosts fill slots first when active). */
  const spotlightCards = (homepageSpotlight || []).slice(0, 8);
  const spotlightIds = new Set(spotlightCards.map((c) => c.id));
  const trendingCars = (mostViewedEnhanced || []).filter((c) => !spotlightIds.has(c.id));

  const origin = getSiteOrigin();

  const newArrivalsBackdrop = pickSectionBackdrop(newEnhanced);

  return (
    <div className="min-h-screen pb-20 bg-white dark:bg-[#0a0a0a]">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(homeStructuredData(origin, spotlightCards, newEnhanced)),
        }}
      />
      {/* Dynamic Hero Section */}
      <section className="relative pt-3 pb-6 sm:pt-4 sm:pb-8 md:pt-6 md:pb-10 lg:pt-8 lg:pb-12 overflow-hidden border-b border-sky-100/80 dark:border-sky-950/40">
        <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
          <Image
            src={HOMEPAGE_HERO_BACKGROUND}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center scale-[1.02]"
          />
          {/* Light mode: soft white/sky wash so the lot photo stays ambient, not busy */}
          <div
            className="absolute inset-0 dark:hidden"
            style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.97) 0%, rgba(244,249,253,0.94) 42%, rgba(232,243,251,0.88) 100%)",
            }}
          />
          {/* Dark mode: deep navy fade so type and cards stay crisp */}
          <div
            className="absolute inset-0 hidden dark:block"
            style={{
              background:
                "linear-gradient(180deg, rgba(10,10,10,0.96) 0%, rgba(12,21,36,0.93) 45%, rgba(12,21,36,0.88) 100%)",
            }}
          />
        </div>
        <div className="home-shell relative z-10">
          
          {/* Page Header - Full Width */}
          <div className="mb-4 sm:mb-6 md:mb-8 lg:mb-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 text-center">
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-[4.25rem] font-bold text-[#111827] dark:text-white leading-[0.92] tracking-tight mb-3 sm:mb-4 max-w-4xl mx-auto">
              Precision pricing<br />
              <span className="editorial-hero-accent text-[#38A169]">For Precision Machines</span>
            </h1>

            <p className="text-base md:text-lg lg:text-[1.15rem] text-[#2D3748] dark:text-[#b9c5e0] leading-relaxed max-w-3xl lg:max-w-4xl font-medium mx-auto lg:hidden">
              Verified Kenyan inventory, transparent ownership costs, and direct dealer access.
            </p>
            <p className="hidden lg:block text-base md:text-lg lg:text-[1.15rem] text-[#2D3748] dark:text-[#b9c5e0] leading-relaxed max-w-3xl lg:max-w-4xl font-medium mx-auto">
              Find verified Kenyan inventory with transparent ownership costs in minutes.
              Compare up to three cars, inspect real running-cost and road-readiness signals, then contact real dealers directly.
            </p>
          </div>

          {/* Mobile hero — stacked filters, strips, and finder */}
          <div className="lg:hidden mx-auto w-full max-w-6xl space-y-4 sm:space-y-5 animate-in fade-in duration-1000 delay-200">
            <div className="mb-4 max-w-lg mx-auto w-full">
              <BrowsePanel layout="hero-mobile" inventoryCounts={browseInventoryCounts} />
            </div>

            <div className="w-full max-w-lg mx-auto">
              <HomepageShopLinks embedded />
            </div>

            <HeroGridShowcase cars={heroCars.length >= 2 ? heroCars : heroPool.slice(0, 6)} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4 w-full max-w-lg mx-auto">
              <TrackedLink
                href="/cars"
                eventName="homepage_explore_inventory_click"
                eventPayload={{ area: "hero" }}
                className="h-12 w-full inline-flex items-center justify-center bg-[#38A169] hover:bg-[#2F855A] text-white px-6 text-xs font-bold uppercase tracking-widest transition-all hover:scale-[0.98] active:scale-95"
                style={{ borderRadius: "var(--radius)" }}
              >
                Explore Inventory
              </TrackedLink>
              <TrackedLink
                href="/compare"
                eventName="homepage_compare_cars_click"
                eventPayload={{ area: "hero" }}
                className="h-12 w-full inline-flex items-center justify-center bg-white dark:bg-[#111111] border border-slate-200 dark:border-slate-800 text-[#111827] dark:text-white px-6 text-xs font-bold uppercase tracking-widest transition-all hover:border-[#111827] dark:hover:border-white"
                style={{ borderRadius: "var(--radius)" }}
              >
                Compare Cars
              </TrackedLink>
            </div>

            <TrackedLink
              href="/request-car"
              eventName="homepage_request_car_click"
              eventPayload={{ area: "hero_mobile" }}
              className="h-12 w-full max-w-lg mx-auto inline-flex items-center justify-center gap-2 border-2 border-[#38A169] bg-[#38A169]/10 text-[#1a3d2e] dark:text-[#bbf7d0] px-6 text-xs font-bold uppercase tracking-widest transition-all hover:bg-[#38A169]/20"
              style={{ borderRadius: "var(--radius)" }}
            >
              <Search className="w-4 h-4" aria-hidden />
              Request a Car
            </TrackedLink>

            <div
              className="p-4 border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#111111]/70 max-w-lg mx-auto text-center"
              style={{ borderRadius: "var(--radius)" }}
            >
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">
                Quick compare
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                Side-by-side specs, annual TCO, and road readiness in one clean sheet.
              </p>
              <TrackedLink
                href="/compare"
                eventName="homepage_quick_compare_click"
                eventPayload={{ area: "hero_card" }}
                className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#111827] dark:text-white hover:text-[#38A169] transition-colors justify-center w-full"
              >
                Start comparing <ArrowRight className="w-4 h-4" />
              </TrackedLink>
            </div>

            <div className="w-full max-w-lg mx-auto">
              <HomepageHeroCarFinder embedded />
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3 max-w-lg mx-auto">
              {[
                { label: "Verified dealers", value: `${dealers.length}+` },
                { label: "Live listings", value: `${(hotThisWeek || []).length}+` },
                { label: "Updated", value: "Daily" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="p-3 border border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-[#111111]/70 text-center"
                  style={{ borderRadius: "var(--radius)" }}
                >
                  <p className="text-lg sm:text-xl font-bold text-[#111827] dark:text-white">{item.value}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-500 mt-1">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Desktop hero — original two-column layout */}
          <div className="hidden lg:block mx-auto w-full max-w-6xl animate-in fade-in duration-1000 delay-200">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 lg:items-start">
              <div className="flex flex-col text-center lg:text-left">
                <div className="w-full min-w-0">
                  <BrowsePanel layout="desktop-hero" inventoryCounts={browseInventoryCounts} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4 mt-5 sm:mt-8 w-full max-w-lg mx-auto lg:max-w-none lg:mx-0">
                  <TrackedLink
                    href="/cars"
                    eventName="homepage_explore_inventory_click"
                    eventPayload={{ area: "hero" }}
                    className="h-12 w-full inline-flex items-center justify-center bg-[#38A169] hover:bg-[#2F855A] text-white px-6 text-xs font-bold uppercase tracking-widest transition-all hover:scale-[0.98] active:scale-95"
                    style={{ borderRadius: "var(--radius)" }}
                  >
                    Explore Inventory
                  </TrackedLink>
                  <TrackedLink
                    href="/compare"
                    eventName="homepage_compare_cars_click"
                    eventPayload={{ area: "hero" }}
                    className="h-12 w-full inline-flex items-center justify-center bg-white dark:bg-[#111111] border border-slate-200 dark:border-slate-800 text-[#111827] dark:text-white px-6 text-xs font-bold uppercase tracking-widest transition-all hover:border-[#111827] dark:hover:border-white"
                    style={{ borderRadius: "var(--radius)" }}
                  >
                    Compare Cars
                  </TrackedLink>
                </div>

                <TrackedLink
                  href="/request-car"
                  eventName="homepage_request_car_click"
                  eventPayload={{ area: "hero_desktop" }}
                  className="mt-3 h-12 w-full max-w-lg lg:max-w-none mx-auto lg:mx-0 inline-flex items-center justify-center gap-2 border-2 border-[#38A169] bg-[#38A169]/10 text-[#1a3d2e] dark:text-[#bbf7d0] px-6 text-xs font-bold uppercase tracking-widest transition-all hover:bg-[#38A169]/20"
                  style={{ borderRadius: "var(--radius)" }}
                >
                  <Search className="w-4 h-4" aria-hidden />
                  Request a Car
                </TrackedLink>

                <div
                  className="mt-6 sm:mt-7 p-4 border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#111111]/70 max-w-lg mx-auto lg:max-w-none text-center lg:text-left"
                  style={{ borderRadius: "var(--radius)" }}
                >
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">
                    Quick compare
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                    Side-by-side specs, annual TCO, and road readiness in one clean sheet.
                  </p>
                  <TrackedLink
                    href="/compare"
                    eventName="homepage_quick_compare_click"
                    eventPayload={{ area: "hero_card" }}
                    className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#111827] dark:text-white hover:text-[#38A169] transition-colors justify-center lg:justify-start w-full"
                  >
                    Start comparing <ArrowRight className="w-4 h-4" />
                  </TrackedLink>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-4 sm:mt-5 max-w-lg mx-auto lg:max-w-none lg:mx-0">
                  {[
                    { label: "Verified dealers", value: `${dealers.length}+` },
                    { label: "Live listings", value: `${(hotThisWeek || []).length}+` },
                    { label: "Updated", value: "Daily" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="p-3 border border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-[#111111]/70 text-center"
                      style={{ borderRadius: "var(--radius)" }}
                    >
                      <p className="text-lg sm:text-xl font-bold text-[#111827] dark:text-white">{item.value}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-500 mt-1">
                        {item.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="shrink-0 w-full max-w-xl mx-auto lg:max-w-none">
                  <HeroGridShowcase
                    cars={heroCars.length >= 2 ? heroCars : heroPool.slice(0, 6)}
                    reviews={highlightReviews}
                  />
                </div>
                <div className="flex-1 min-h-[12rem]">
                  <HomepageHeroCarFinder embedded className="h-full min-h-[12rem]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="hidden lg:block">
        <HomepageShopLinks />
      </div>

      <HomepageSpotlight cars={spotlightCards} />

      <HomepageTrending cars={trendingCars} />

      <HomepageCompareDiscovery comparisons={seoComparisons} />

      {/* Fresh Arrivals Section */}
      {newEnhanced.length > 0 && (
        <section className="relative py-10 sm:py-16 lg:py-24 border-y border-emerald-100/80 dark:border-emerald-950/30 overflow-hidden">
          {newArrivalsBackdrop && (
            <div className="absolute inset-0 -z-10 pointer-events-none">
              <Image
                src={newArrivalsBackdrop}
                fill
                sizes="100vw"
                alt=""
                className="object-cover opacity-[0.16] dark:opacity-[0.10]"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-white/96 via-white/94 to-white dark:from-[#0a0a0a]/96 dark:via-[#0a0a0a]/94 dark:to-[#0a0a0a]" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(56,161,105,0.08),transparent_55%)] dark:bg-[radial-gradient(ellipse_at_top_left,rgba(56,161,105,0.12),transparent_55%)]" />
            </div>
          )}
          {!newArrivalsBackdrop && (
            <div className="absolute inset-0 -z-10 bg-gradient-to-b from-emerald-50/30 to-white dark:from-emerald-950/15 dark:to-[#0a0a0a]" />
          )}
          <div className="home-shell">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 sm:mb-10 gap-4">
              <div className="max-w-2xl">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#2F855A] dark:text-emerald-400 mb-2">
                  This week
                </p>
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-normal editorial-heading text-[#111827] dark:text-white mb-3">
                  Fresh arrivals
                </h2>
                <p className="text-[#475569] dark:text-slate-400 text-base sm:text-lg font-medium leading-relaxed">
                  Cars that have been added this week.
                </p>
              </div>
              <TrackedLink
                href="/cars?sort=newest"
                eventName="homepage_fresh_arrivals_click"
                eventPayload={{ area: "fresh_arrivals" }}
                className="inline-flex h-11 items-center shrink-0 text-[#2F855A] dark:text-emerald-400 text-xs font-bold uppercase tracking-widest gap-2 hover:opacity-70 transition-opacity"
              >
                See all arrivals <ArrowUpRight className="w-4 h-4" />
              </TrackedLink>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-6 items-stretch">
              {newEnhanced.slice(0, 8).map((car) => (
                <div key={car.id} className="h-full">
                  <CarCard car={car} compact />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <HomepageDutyTeaser />

      {/* Editorial Information Block */}
      <section className="relative py-8 sm:py-16 lg:py-20 xl:py-24 bg-[#1A202C] text-white overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src={DIFFERENCE_BACKGROUND}
            fill
            className="object-cover opacity-20"
            alt=""
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1A202C] via-[#1A202C]/80 to-transparent" />
        </div>
        <div className="home-shell relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-12 items-center">
            <div>
              <p className="text-[#38A169] text-[10px] sm:text-xs font-bold uppercase tracking-[0.28em] sm:tracking-[0.32em] mb-3 sm:mb-5">
                The Difference
              </p>
              <h2 className="text-2xl sm:text-5xl font-bold leading-[1.12] mb-4 sm:mb-6">
                Less scrolling.<br />
                <span className="editorial-heading text-[#718096]">More real cars.</span>
              </h2>
              <p className="text-sm sm:text-lg text-[#A0AEC0] leading-relaxed max-w-xl font-medium">
                Welsh Motorhub is built around dealer inventory that you can tie to a real showroom; so you compare in one place,
                then move the conversation straight to WhatsApp or a phone call when you are ready. Fewer phantom posts, fewer
                dead ends.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6 items-stretch">
              {[
                {
                  title: "Yard-first listings",
                  icon: <Building2 className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden />,
                  desc: "Cars come from partner dealers with a physical presence, not scraped dumps or anonymous “DM for price” threads.",
                },
                {
                  title: "Straight to the seller",
                  icon: <MessageCircle className="h-6 w-6" aria-hidden />,
                  desc: "You reach the dealership’s line. Ask about finance, trade-in, or viewing without a mystery broker in the middle.",
                },
                {
                  title: "Compare before you commit",
                  icon: <GitCompare className="h-6 w-6" aria-hidden />,
                  desc: "Use specs, photos, and our tools to shortlist seriously, so your next step is a viewing, not another wild goose chase.",
                },
                {
                  title: "Stock that keeps pace",
                  icon: <RefreshCw className="h-6 w-6" aria-hidden />,
                  desc: "We expect listings to reflect what’s still on the floor. When something moves, it should come down quickly.",
                },
              ].map((item, i) => (
                <div key={i} className="flex h-full flex-col gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
                  <div className="text-[#38A169]" aria-hidden>
                    {item.icon}
                  </div>
                  <h3 className="font-bold text-lg">{item.title}</h3>
                  <p className="text-sm text-[#A0AEC0] leading-relaxed font-medium">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <HomepageSupportWhatsApp />
      <SeasonalPromoModal />
    </div>
  );
}
