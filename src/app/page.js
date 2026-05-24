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
import HomepageHeroTrustMetrics from "@/components/home/HomepageHeroTrustMetrics";
import HomepageSupportWhatsApp from "@/components/home/HomepageSupportWhatsApp";
import { getHomepageData } from "@/lib/homepage-cache";
import { db } from "@/lib/db";
import { PUBLIC_ONLY_VERIFIED_DEALERS } from "@/lib/feature-flags";
import { absoluteUrl, BRAND_MARK_SQUARE, getSiteOrigin } from "@/lib/site-url";

const HERO_BACKGROUND = "/images/mercedes.jpg";
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
  const dealerScope = PUBLIC_ONLY_VERIFIED_DEALERS ? { verified: true } : {};

  const [
    {
      featured,
      hotThisWeek,
      newArrivals,
      dealers,
      newsItems,
      highlightReviews,
      spotlightEnhanced,
      paidSpotlight,
      hotEnhanced,
      mostViewedEnhanced,
      newEnhanced,
    },
    liveListingCount,
    verifiedDealerCount,
  ] = await Promise.all([
    getHomepageData(),
    db.car.count({
      where: { available: true, dealer: dealerScope },
    }),
    db.dealer.count({ where: dealerScope }),
  ]);

  const heroPool = (hotEnhanced.length > 0 ? hotEnhanced : spotlightEnhanced).slice(0, 12);
  const heroRotated = rotateList(heroPool, getRotationOffset(heroPool.length));
  const heroCars = heroRotated.slice(0, 8);

  /** Paid Spotlight only — organic trending must not fill this block. */
  const spotlightCards = (paidSpotlight || []).slice(0, 8);
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
          __html: JSON.stringify(homeStructuredData(origin)),
        }}
      />
      {/* Premium cinematic hero */}
      <section className="relative overflow-hidden border-b border-white/5 bg-[#060708] pt-6 pb-10 sm:pt-8 sm:pb-12 md:pb-14 lg:pt-10 lg:pb-16">
        <div className="absolute inset-0 pointer-events-none">
          <Image
            src={HERO_BACKGROUND}
            fill
            className="object-cover object-[center_42%] scale-[1.03]"
            alt=""
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/65 to-[#060708]" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/55 to-black/25 lg:to-black/10" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_20%_0%,rgba(56,161,105,0.14),transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_100%_100%,rgba(0,0,0,0.45),transparent_50%)]" />
        </div>

        <div className="home-shell relative z-10">
          <div className="mb-8 sm:mb-10 md:mb-12 animate-in fade-in slide-in-from-bottom-6 duration-1000 text-center">
            <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.28em] text-[#6ee7a8]/90 mb-4">
              Kenya&apos;s trusted car marketplace
            </p>
            <h1 className="text-[2.35rem] sm:text-5xl md:text-6xl lg:text-[4.5rem] font-bold text-white leading-[0.94] tracking-[-0.03em] mb-5 max-w-4xl mx-auto">
              Buy cars with
              <br />
              <span className="editorial-hero-accent hero-accent-luxury">dealer-level clarity.</span>
            </h1>
            <p className="text-base md:text-lg lg:text-xl text-slate-300/95 leading-relaxed max-w-2xl mx-auto font-medium">
              Verified inventory, transparent ownership costs, and direct dealer contact — built for buyers who want confidence, not guesswork.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-12 lg:items-start animate-in fade-in duration-1000 delay-150">
            <div className="lg:col-span-6 xl:col-span-6 text-center">
              <div className="w-full max-w-xl mx-auto hero-glass-panel rounded-2xl p-4 sm:p-5">
                <BrowsePanel variant="hero" />
                <HomepageHeroTrustMetrics
                  listingCount={liveListingCount}
                  dealerCount={verifiedDealerCount}
                  className="mt-5 sm:mt-6"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 sm:mt-8 w-full sm:max-w-xl mx-auto">
                <TrackedLink
                  href="/cars"
                  eventName="homepage_explore_inventory_click"
                  eventPayload={{ area: "hero" }}
                  className="h-12 w-full inline-flex items-center justify-center bg-[#38A169] hover:bg-[#2F855A] text-white px-6 text-[11px] font-bold uppercase tracking-[0.18em] shadow-[0_12px_32px_-8px_rgba(56,161,105,0.55)] transition-all hover:scale-[0.99] active:scale-[0.97]"
                  style={{ borderRadius: "var(--radius)" }}
                >
                  Explore Inventory
                </TrackedLink>
                <TrackedLink
                  href="/compare"
                  eventName="homepage_compare_cars_click"
                  eventPayload={{ area: "hero" }}
                  className="h-12 w-full inline-flex items-center justify-center border border-white/20 bg-white/10 text-white px-6 text-[11px] font-bold uppercase tracking-[0.18em] backdrop-blur-md transition-all hover:bg-white/15 hover:border-white/35"
                  style={{ borderRadius: "var(--radius)" }}
                >
                  Compare Cars
                </TrackedLink>
              </div>

              <div
                className="mt-6 sm:mt-7 hero-glass-panel max-w-xl mx-auto text-center rounded-2xl p-4 sm:p-5"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-3">
                  Quick compare
                </p>
                <p className="text-sm text-slate-300 leading-relaxed mb-4">
                  Side-by-side specs, annual TCO, and road readiness in one clean sheet.
                </p>
                <TrackedLink
                  href="/compare"
                  eventName="homepage_quick_compare_click"
                  eventPayload={{ area: "hero_card" }}
                  className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white hover:text-[#6ee7a8] transition-colors justify-center w-full"
                >
                  Start comparing <ArrowRight className="w-4 h-4" />
                </TrackedLink>
              </div>
            </div>

            <div className="hidden lg:block lg:col-span-6 xl:col-span-6 lg:pl-2 xl:pl-4">
              <HeroGridShowcase
                cars={heroCars.length >= 2 ? heroCars : spotlightEnhanced.slice(0, 6)}
                reviews={highlightReviews}
              />
            </div>
          </div>

          <div className="mt-10 sm:mt-12 max-w-4xl mx-auto">
            <HomepageHeroCarFinder variant="hero" />
          </div>
        </div>
      </section>

      <HomepageShopLinks />

      <HomepageSpotlight cars={spotlightCards} />

      <HomepageTrending cars={trendingCars} />

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
                  The newest listings added by verified dealers in the last seven days.
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

      <HomepageSupportWhatsApp />
    </div>
  );
}
