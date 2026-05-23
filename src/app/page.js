// src/app/page.js
export const dynamic = "force-dynamic";
import { formatPrice, formatCarPrice } from "@/lib/utils";
import Link from "next/link";
import NewsRibbon from "@/components/NewsRibbon";
import HeroReviews from "@/components/HeroReviews";
import BrowsePanel from "@/components/BrowsePanel";
import {
  ArrowUpRight,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Bookmark,
  Building2,
  MessageCircle,
  GitCompare,
  RefreshCw,
} from "lucide-react";
import Image from "next/image";
import HeroShowcase from "@/components/HeroShowcase";
import HeroGridShowcase from "@/components/HeroGridShowcase";
import CarCard from "@/components/CarCard";
import TrackedLink from "@/components/TrackedLink";
import { getHomepageData } from "@/lib/homepage-cache";
import { absoluteUrl, BRAND_MARK_SQUARE, getSiteOrigin } from "@/lib/site-url";

const HERO_BACKGROUND = "/images/backgrounds/hero-section-background.jpeg";
const DIFFERENCE_BACKGROUND = "/images/backgrounds/pexels-nurcan-aytas-2150089535-32773507.jpg";

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

export const metadata = {
  title: "Buy Used and New Cars in Kenya",
  description:
    "Find verified cars from trusted dealers in Kenya. Compare total ownership costs, inspect specs, and contact dealers directly on Welsh Motorhub.",
  alternates: { canonical: "/" },
  openGraph: {
    url: absoluteUrl("/"),
    title: "Buy Used and New Cars in Kenya | Welsh Motorhub",
    description:
      "Verified vehicle inventory from trusted Kenyan dealers. Compare costs, specs, and contact sellers directly.",
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
    paidSpotlight,
    hotEnhanced,
    newEnhanced,
  } = await getHomepageData();

  const showcaseItems = [
    ...(featured || hotThisWeek || newArrivals || []).slice(0, 6).map(c => ({ ...c, type: 'car' })),
    ...(highlightReviews || []).slice(0, 6).map(r => ({ ...r, type: 'review' }))
  ].sort(() => Math.random() - 0.5);

  const heroPool = (hotEnhanced.length > 0 ? hotEnhanced : spotlightEnhanced).slice(0, 12);
  const heroRotated = rotateList(heroPool, getRotationOffset(heroPool.length));
  const heroCars = heroRotated.slice(0, 8);
  const heroPrimary = heroCars?.[0] || spotlightEnhanced?.[0] || null;

  /** Paid Spotlight only — organic trending must not fill this block. */
  const spotlightCards = (paidSpotlight || []).slice(0, 8);

  const origin = getSiteOrigin();

  const spotlightBackdrop = pickSectionBackdrop(spotlightCards);
  const newArrivalsBackdrop = pickSectionBackdrop(newEnhanced);

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
      <section className="relative pt-3 pb-6 sm:pt-4 sm:pb-8 md:pt-6 md:pb-10 lg:pt-8 lg:pb-12 overflow-hidden border-b border-gray-100 dark:border-zinc-900">
        <div className="home-shell relative z-10">
          
          {/* Page Header - Full Width */}
          <div className="mb-5 sm:mb-6 md:mb-8 lg:mb-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 text-center lg:text-left">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[4.25rem] font-bold text-[#111827] dark:text-white leading-[0.92] tracking-tight mb-4 lg:max-w-4xl">
              Buy cars with<br />
              <span className="editorial-hero-accent text-[#38A169]">dealer-level clarity.</span>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4 mt-5 sm:mt-8 w-full sm:max-w-xl lg:mx-0">
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


      {/* Paid Spotlight — only active dealer placements (see spotlightUntil) */}
      {spotlightCards.length > 0 && (
        <section className="relative py-10 sm:py-16 lg:py-24 xl:py-28 border-y border-red-100/80 dark:border-red-950/40 overflow-hidden">
          {spotlightBackdrop && (
            <div className="absolute inset-0 -z-10 pointer-events-none">
              <Image
                src={spotlightBackdrop}
                fill
                sizes="100vw"
                alt=""
                className="object-cover opacity-[0.22] dark:opacity-[0.14]"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-white/96 via-white/94 to-white dark:from-[#0a0a0a]/96 dark:via-[#0a0a0a]/94 dark:to-[#0a0a0a]" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(220,38,38,0.08),transparent_55%)] dark:bg-[radial-gradient(ellipse_at_top_right,rgba(220,38,38,0.14),transparent_55%)]" />
            </div>
          )}
          {!spotlightBackdrop && (
            <div className="absolute inset-0 -z-10 bg-gradient-to-b from-red-50/40 to-white dark:from-red-950/20 dark:to-[#0a0a0a]" />
          )}
          <div className="home-shell">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 sm:mb-10 gap-4">
              <div className="max-w-2xl">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-red-600 dark:text-red-400 mb-2">
                  Spotlight
                </p>
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-normal editorial-heading text-[#111827] dark:text-white mb-3">
                  Featured on the homepage
                </h2>
                <p className="text-[#475569] dark:text-slate-400 text-base sm:text-lg font-medium leading-relaxed">
                  Paid placements from verified dealers. Spotlight listings rank higher in search and stay pinned here for the full boost period.
                </p>
              </div>
              <TrackedLink
                href="/cars?sort=views_desc"
                eventName="homepage_view_trending_click"
                eventPayload={{ area: "spotlight_footer" }}
                className="inline-flex h-11 items-center text-[#b91c1c] dark:text-red-300 text-xs font-bold uppercase tracking-widest gap-2 hover:opacity-70 transition-opacity shrink-0"
              >
                Browse all cars <ArrowUpRight className="w-4 h-4" />
              </TrackedLink>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-6 items-stretch">
              {spotlightCards.map((car, index) => (
                <div
                  key={car.id}
                  className={[
                    "h-full",
                    index === 0 && spotlightCards.length >= 3 ? "col-span-2 lg:col-span-2 lg:row-span-2" : "",
                  ].join(" ")}
                >
                  <CarCard car={car} showSpotlight />
                </div>
              ))}
            </div>

            <p className="mt-6 sm:mt-8 text-center text-[11px] font-semibold text-slate-500 dark:text-zinc-500">
              Dealers: put your stock in Spotlight from{" "}
              <TrackedLink
                href="/portal/subscription"
                eventName="homepage_spotlight_dealer_cta"
                eventPayload={{ area: "spotlight_footer" }}
                className="font-black uppercase tracking-[0.12em] text-[#2F855A] hover:underline"
              >
                Plans &amp; billing
              </TrackedLink>
            </p>
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
        <div className="home-shell relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-[#38A169] text-xs font-bold uppercase tracking-[0.32em] mb-5">The Difference</p>
              <h2 className="text-3xl sm:text-5xl font-bold leading-[1.1] mb-6">
                Less scrolling.<br />
                <span className="editorial-heading text-[#718096]">More real cars.</span>
              </h2>
              <p className="text-base sm:text-lg text-[#A0AEC0] leading-relaxed max-w-xl font-medium">
                Welsh Motorhub is built around dealer inventory that you can tie to a real showroom; so you compare in one place,
                then move the conversation straight to WhatsApp or a phone call when you are ready. Fewer phantom posts, fewer
                dead ends.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-stretch">
              {[
                {
                  title: "Yard-first listings",
                  icon: <Building2 className="h-6 w-6" aria-hidden />,
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

      {/* Fresh Arrivals Section */}
      {newEnhanced.length > 0 && (
        <section className="relative py-10 sm:py-14 lg:py-18 xl:py-20 border-y border-slate-100 dark:border-zinc-900 overflow-hidden">
          {/* Use the most recent arrival as the backdrop so the section
              feels alive — newest cars literally set the tone. */}
          {newArrivalsBackdrop && (
            <div className="absolute inset-0 -z-10 pointer-events-none">
              <Image
                src={newArrivalsBackdrop}
                fill
                sizes="100vw"
                alt=""
                className="object-cover opacity-[0.14] dark:opacity-[0.10]"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-white/96 via-white/94 to-white dark:from-[#0a0a0a]/96 dark:via-[#0a0a0a]/94 dark:to-[#0a0a0a]" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(56,161,105,0.07),transparent_55%)] dark:bg-[radial-gradient(ellipse_at_top_left,rgba(56,161,105,0.10),transparent_55%)]" />
            </div>
          )}
          <div className="home-shell">
            <div className="flex items-end justify-between mb-6 sm:mb-9 gap-4">
              <div>
                <p className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#2F855A] dark:text-emerald-400 mb-2">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#38A169]" aria-hidden />
                  This week
                </p>
                <h2 className="text-3xl sm:text-5xl font-bold text-[#111827] dark:text-white mb-3 sm:mb-4">Fresh Arrivals</h2>
                <p className="text-[#475569] dark:text-slate-400 text-base sm:text-lg font-medium">The latest units added to our network within the last 7 days.</p>
              </div>
              <Link href="/cars?sort=newest" className="hidden sm:block text-xs font-bold uppercase tracking-widest bg-[#EDF2F7] dark:bg-[#111111] text-[#111827] dark:text-white px-8 py-4 transition-all hover:bg-[#E2E8F0] dark:hover:bg-zinc-900" style={{ borderRadius: 'var(--radius)' }}>
                See All Arrivals
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 lg:gap-6 items-stretch">
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
