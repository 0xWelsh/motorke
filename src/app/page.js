// src/app/page.js
export const revalidate = 60;
import BrowsePanel from "@/components/BrowsePanel";
import {
  ArrowRight,
  Building2,
  Search,
  Shield,
  BarChart3,
  Phone,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import HeroGridShowcase from "@/components/LazyHeroGridShowcase";
import CarCard from "@/components/CarCard";
import TrackedLink from "@/components/TrackedLink";
import HomepageShopLinks from "@/components/home/HomepageShopLinks";
import HomepageTrending from "@/components/home/HomepageTrending";
import HomepageSpotlight from "@/components/home/HomepageSpotlight";
import HomepageDeals from "@/components/home/HomepageDeals";
import HomepageNewArrivals from "@/components/home/HomepageNewArrivals";
import HomepageDutyTeaser from "@/components/home/HomepageDutyTeaser";
import HomepageHeroCarFinder from "@/components/home/HomepageHeroCarFinder";
import HomepageSupportWhatsApp from "@/components/home/HomepageSupportWhatsApp";
import HomepagePriceFilter from "@/components/home/HomepagePriceFilter";
import HeroCarousel from "@/components/home/HeroCarousel";
import SeasonalPromoModal from "@/components/SeasonalPromoModal";
import { getHomepageData } from "@/lib/homepage-cache";
import { getBrowseInventoryCounts } from "@/lib/browse-inventory-counts";
import { absoluteUrl, BRAND_MARK_SQUARE, getSiteOrigin, absoluteMediaUrl } from "@/lib/site-url";
import { carListingPath } from "@/lib/car-listing-url";
import FadeIn from "@/components/ui/FadeIn";

const DIFFERENCE_BACKGROUND = "/images/backgrounds/pexels-nurcan-aytas-2150089535-32773507.jpg";

/** Deterministic shuffle seeded by time window so ISR caching works. */
function seededShuffle(arr, seed) {
  const out = [...arr];
  let m = out.length;
  let s = seed;
  while (m) {
    m--;
    s = (s * 9301 + 49297) % 233280;
    const i = Math.floor((s / 233280) * (m + 1));
    [out[m], out[i]] = [out[i], out[m]];
  }
  return out;
}

export const metadata = {
  title: "Buy Used and New Cars in Kenya | Verified Nairobi & Mombasa Dealers",
  description:
    "Find verified used cars for sale in Nairobi, Mombasa, and across Kenya. Compare total ownership costs, inspect specs, and contact trusted car dealers directly on BIDGARI.",
  alternates: { canonical: "/" },
  openGraph: {
    url: absoluteUrl("/"),
    title: "Buy Used and New Cars for sale in Kenya | BIDGARI",
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
    ...(car.price
      ? {
          "offers": {
            "@type": "Offer",
            "url": absoluteUrl(carListingPath(car)),
            "priceCurrency": "KES",
            "price": car.price,
            "availability": "https://schema.org/InStock",
            "itemCondition": car.condition === "NEW" ? "https://schema.org/NewCondition" : "https://schema.org/UsedCondition"
          }
        }
      : {}),
  }));

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "BIDGARI",
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
        name: "BIDGARI",
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
  const [homepageBundle, browseInventoryCounts] = await Promise.all([
    getHomepageData(),
    getBrowseInventoryCounts(),
  ]);

  const {
    featured,
    hotThisWeek,
    newArrivals,
    dealers,
    newsItems,
    highlightReviews,
    heroFallback,
    homepageSpotlight,
    mostViewedEnhanced,
    newEnhanced,
    dealsEnhanced,
  } = homepageBundle;

  const heroPool = seededShuffle(
    [...(heroFallback?.length ? heroFallback : [...(featured || []), ...(newArrivals || [])])],
    Math.floor(Date.now() / 60000),
  );
  const heroCars = heroPool.slice(0, 8);

  const spotlightCards = (homepageSpotlight || []).slice(0, 8);
  const spotlightIds = new Set(spotlightCards.map((c) => c.id));
  const trendingCars = (mostViewedEnhanced || []).filter((c) => !spotlightIds.has(c.id));

  const origin = getSiteOrigin();

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
          <div className="absolute inset-0 dark:hidden">
            <img src="/images/backgrounds/car-dealership.jpg" alt="" className="w-full h-full object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-white/85" />
          </div>
          <div className="absolute inset-0 hidden dark:block bg-[#0a0a0a]" />
        </div>
        <div className="home-shell relative z-10">
          
          {/* Page Header - Full Width */}
          <div className="mb-4 sm:mb-6 md:mb-8 lg:mb-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 text-center">
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-[4.25rem] font-bold text-slate-900 dark:text-white leading-[0.92] tracking-tight mb-3 sm:mb-4 max-w-4xl mx-auto">
              Precision pricing<br />
              <span className="editorial-hero-accent text-brand-accent">For Precision Machines</span>
            </h1>

            <p className="text-base md:text-lg lg:text-[1.15rem] text-body-muted dark:text-slate-300 leading-relaxed max-w-3xl lg:max-w-4xl font-medium mx-auto lg:hidden">
              Verified Kenyan inventory, transparent ownership costs, and direct dealer access.
            </p>
            <p className="hidden lg:block text-base md:text-lg lg:text-[1.15rem] text-body-muted dark:text-slate-300 leading-relaxed max-w-3xl lg:max-w-4xl font-medium mx-auto">
              Find verified Kenyan inventory with transparent ownership costs in minutes.
              Compare up to three cars, inspect real running-cost and road-readiness signals, then contact real dealers directly.
            </p>
          </div>

          {/* Mobile hero — compact: search, brands, carousel, CTAs */}
          <div className="lg:hidden mx-auto w-full max-w-6xl space-y-4 sm:space-y-5 animate-in fade-in duration-1000 delay-200">
            <div className="mb-4 max-w-lg mx-auto w-full">
              <BrowsePanel layout="hero-mobile-slim" inventoryCounts={browseInventoryCounts} />
            </div>

            <HeroCarousel cars={heroCars} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4 w-full max-w-lg mx-auto">
              <TrackedLink
                href="/cars"
                eventName="homepage_explore_inventory_click"
                eventPayload={{ area: "hero" }}
                className="h-12 w-full inline-flex items-center justify-center bg-brand-accent hover:opacity-90 text-white px-6 text-xs font-bold uppercase tracking-widest transition-all hover:scale-[0.98] active:scale-95"
                style={{ borderRadius: "var(--radius)" }}
              >
                Explore Inventory
              </TrackedLink>
              <TrackedLink
                href="/request-car"
                eventName="homepage_request_car_click"
                eventPayload={{ area: "hero_mobile" }}
                className="h-12 w-full inline-flex items-center justify-center gap-2 border-2 border-brand-accent bg-brand-accent/10 text-brand-accent dark:text-emerald-400 px-6 text-xs font-bold uppercase tracking-widest transition-all hover:bg-brand-accent/20"
                style={{ borderRadius: "var(--radius)" }}
              >
                <Search className="w-4 h-4" aria-hidden />
                Request a Car
              </TrackedLink>
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
                    className="h-12 w-full inline-flex items-center justify-center bg-brand-accent hover:opacity-90 text-white px-6 text-xs font-bold uppercase tracking-widest transition-all hover:scale-[0.98] active:scale-95"
                    style={{ borderRadius: "var(--radius)" }}
                  >
                    Explore Inventory
                  </TrackedLink>
                  <TrackedLink
                    href="/compare"
                    eventName="homepage_compare_cars_click"
                    eventPayload={{ area: "hero" }}
                    className="h-12 w-full inline-flex items-center justify-center bg-white dark:bg-[#111111] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white px-6 text-xs font-bold uppercase tracking-widest transition-all hover:border-slate-900 dark:hover:border-white"
                    style={{ borderRadius: "var(--radius)" }}
                  >
                    Compare Cars
                  </TrackedLink>
                </div>

                <TrackedLink
                  href="/request-car"
                  eventName="homepage_request_car_click"
                  eventPayload={{ area: "hero_desktop" }}
                  className="mt-3 h-12 w-full max-w-lg lg:max-w-none mx-auto lg:mx-0 inline-flex items-center justify-center gap-2 border-2 border-brand-accent bg-brand-accent/10 text-brand-accent dark:text-emerald-400 px-6 text-xs font-bold uppercase tracking-widest transition-all hover:bg-brand-accent/20"
                  style={{ borderRadius: "var(--radius)" }}
                >
                  <Search className="w-4 h-4" aria-hidden />
                  Request a Car
                </TrackedLink>

                <div
                  className="mt-6 sm:mt-7 p-4 border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#111111]/70 max-w-lg mx-auto lg:max-w-none text-center lg:text-left"
                  style={{ borderRadius: "var(--radius)" }}
                >
                  <p className="meta-label mb-3">
                    Quick compare
                  </p>
                  <p className="text-sm text-body-muted dark:text-slate-300 leading-relaxed mb-4">
                    Side-by-side specs, annual TCO, and road readiness in one clean sheet.
                  </p>
                  <TrackedLink
                    href="/compare"
                    eventName="homepage_quick_compare_click"
                    eventPayload={{ area: "hero_card" }}
                    className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-900 dark:text-white hover:text-brand-accent transition-colors justify-center lg:justify-start w-full"
                  >
                    Start comparing <ArrowRight className="w-4 h-4" />
                  </TrackedLink>
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

      {/* Quick filter chips */}
      <FadeIn delay={0.15}>
      <div className="home-shell relative -mt-3 sm:-mt-4 mb-6 sm:mb-8 z-20">
        <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
          {[
            { label: "All Inventory", href: "/cars" },
            { label: "Toyota", href: "/cars?make=Toyota" },
            { label: "Nissan", href: "/cars?make=Nissan" },
            { label: "Subaru", href: "/cars?make=Subaru" },
            { label: "BMW", href: "/cars?make=BMW" },
            { label: "Mercedes", href: "/cars?make=Mercedes-Benz" },
            { label: "SUV", href: "/cars?bodyType=SUV" },
            { label: "Nairobi", href: "/cars?location=Nairobi" },
          ].map((chip) => (
            <Link
              key={chip.label}
              href={chip.href}
              className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#111]/80 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all"
            >
              {chip.label}
            </Link>
          ))}
        </div>

        <div className="mt-4 sm:mt-5">
          <HomepagePriceFilter />
        </div>
      </div>
      </FadeIn>

      <HomepageShopLinks />

      <FadeIn delay={0.1}><HomepageSpotlight cars={spotlightCards} /></FadeIn>

      <FadeIn delay={0.15}><HomepageNewArrivals cars={newEnhanced} /></FadeIn>

      <FadeIn delay={0.2}><HomepageDeals cars={dealsEnhanced} /></FadeIn>

      <FadeIn delay={0.25}><HomepageTrending cars={trendingCars} /></FadeIn>

      {/* Mobile car finder (visible below lg) */}
      <div className="lg:hidden mt-8 mb-0">
        <div className="home-shell">
          <HomepageHeroCarFinder embedded />
        </div>
      </div>

      <FadeIn delay={0.3}><HomepageDutyTeaser /></FadeIn>

      {/* The Difference */}
      <FadeIn delay={0.35}>
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
              <p className="meta-label text-brand-accent mb-3 sm:mb-5">
                The Difference
              </p>
              <h2 className="text-2xl sm:text-5xl font-bold leading-[1.12] mb-4 sm:mb-6">
                See cars from real dealerships.<br />
                <span className="editorial-heading text-slate-400">Without leaving home.</span>
              </h2>
              <p className="text-sm sm:text-lg text-slate-400 leading-relaxed max-w-xl font-medium">
                We work with dealers across Kenya to put their inventory online. You get to browse quality cars, compare them side by side, and contact the seller directly. No need to spend your weekend walking through yards just to find out what is available.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6 items-stretch">
              {[
                {
                  title: "Quality inventory online",
                  icon: <Shield className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden />,
                  desc: "Every car you see is listed by a dealer with a physical showroom. What you see is what they have on the lot.",
                },
                {
                  title: "Compare without the runaround",
                  icon: <Building2 className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden />,
                  desc: "Put up to three cars next to each other and look at specs, pricing, and running costs in one place. No hopping between websites.",
                },
                {
                  title: "Know the full cost upfront",
                  icon: <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden />,
                  desc: "Our duty calculator and landed price tool show you what a car will cost once it hits Kenyan roads. No surprises when you go to register it.",
                },
                {
                  title: "Talk to the dealer directly",
                  icon: <Phone className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden />,
                  desc: "Call or WhatsApp the person selling the car right from the listing. No middlemen, no contact forms that go nowhere.",
                },
              ].map((item, i) => (
                <div key={i} className="flex h-full flex-col gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
                  <div className="text-brand-accent" aria-hidden>
                    {item.icon}
                  </div>
                  <h3 className="font-bold text-lg">{item.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed font-medium">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      </FadeIn>

      <FadeIn delay={0.4}><HomepageSupportWhatsApp /></FadeIn>
      <SeasonalPromoModal />
    </div>
  );
}
