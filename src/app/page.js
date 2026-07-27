// src/app/page.js
export const revalidate = 60;
import BrowsePanel from "@/components/BrowsePanel";
import { Search } from "lucide-react";
import HeroGridShowcase from "@/components/LazyHeroGridShowcase";
import TrackedLink from "@/components/TrackedLink";
import HomepageShopLinks from "@/components/home/HomepageShopLinks";
import HomepageTrending from "@/components/home/HomepageTrending";
import HomepageSpotlight from "@/components/home/HomepageSpotlight";
import HomepageDeals from "@/components/home/HomepageDeals";
import HomepageNewArrivals from "@/components/home/HomepageNewArrivals";
import HomepageHeroCarFinder from "@/components/home/HomepageHeroCarFinder";
import HomepageSupportWhatsApp from "@/components/home/HomepageSupportWhatsApp";
import HomepagePriceFilter from "@/components/home/HomepagePriceFilter";
import HeroCarousel from "@/components/home/HeroCarousel";
import { getHomepageData } from "@/lib/homepage-cache";
import { getBrowseInventoryCounts } from "@/lib/browse-inventory-counts";
import { absoluteUrl, BRAND_MARK_SQUARE, getSiteOrigin, absoluteMediaUrl } from "@/lib/site-url";
import { carListingPath } from "@/lib/car-listing-url";

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
  const productSchemas = allCars.map((car) => ({
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
        description: "Verified vehicle marketplace connecting buyers with trusted car dealers across Kenya.",
        address: { "@type": "PostalAddress", addressCountry: "KE" },
      },
      {
        "@type": "WebSite",
        name: "BIDGARI",
        url: origin,
        description: "Browse used and new listings, compare vehicles, and connect with Kenyan dealerships.",
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
    newArrivals,
    dealers,
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
    <div className="min-h-screen pb-20 bg-[#141414]">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(homeStructuredData(origin, spotlightCards, newEnhanced)),
        }}
      />

      {/* Hero */}
      <section className="relative pt-6 pb-8 sm:pt-10 sm:pb-12 lg:pt-14 lg:pb-16">
        <div className="home-shell">
          <div className="max-w-3xl mx-auto text-center mb-8 sm:mb-10 lg:mb-12">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight mb-4">
              Find your next car
            </h1>
            <p className="text-zinc-400 text-base sm:text-lg max-w-xl mx-auto">
              Verified inventory from dealers across Kenya. Compare specs, costs, and contact sellers directly.
            </p>
          </div>

          {/* Mobile */}
          <div className="lg:hidden mx-auto max-w-2xl space-y-4">
            <BrowsePanel layout="hero-mobile-slim" inventoryCounts={browseInventoryCounts} />
            <HeroCarousel cars={heroCars} />
            <div className="flex gap-3">
              <TrackedLink
                href="/cars"
                eventName="homepage_explore_inventory_click"
                eventPayload={{ area: "hero" }}
                className="flex-1 h-12 inline-flex items-center justify-center bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-black text-xs font-bold uppercase tracking-widest transition-all rounded-xl"
              >
                Browse Cars
              </TrackedLink>
              <TrackedLink
                href="/request-car"
                eventName="homepage_request_car_click"
                eventPayload={{ area: "hero_mobile" }}
                className="flex-1 h-12 inline-flex items-center justify-center gap-2 border border-white/10 text-white text-xs font-bold uppercase tracking-widest transition-all hover:bg-white/5 rounded-xl"
              >
                <Search className="w-4 h-4" />
                Request a Car
              </TrackedLink>
            </div>
          </div>

          {/* Desktop */}
          <div className="hidden lg:block max-w-6xl mx-auto">
            <div className="grid grid-cols-2 gap-10 items-start">
              <div className="space-y-6">
                <BrowsePanel layout="desktop-hero" inventoryCounts={browseInventoryCounts} />
                <div className="flex gap-3">
                  <TrackedLink
                    href="/cars"
                    eventName="homepage_explore_inventory_click"
                    eventPayload={{ area: "hero" }}
                    className="flex-1 h-12 inline-flex items-center justify-center bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-black text-xs font-bold uppercase tracking-widest transition-all rounded-xl"
                  >
                    Browse Cars
                  </TrackedLink>
                  <TrackedLink
                    href="/compare"
                    eventName="homepage_compare_cars_click"
                    eventPayload={{ area: "hero" }}
                    className="flex-1 h-12 inline-flex items-center justify-center border border-white/10 text-white text-xs font-bold uppercase tracking-widest transition-all hover:bg-white/5 rounded-xl"
                  >
                    Compare
                  </TrackedLink>
                </div>
                <TrackedLink
                  href="/request-car"
                  eventName="homepage_request_car_click"
                  eventPayload={{ area: "hero_desktop" }}
                  className="flex h-12 w-full items-center justify-center gap-2 border border-white/10 text-white text-xs font-bold uppercase tracking-widest transition-all hover:bg-white/5 rounded-xl"
                >
                  <Search className="w-4 h-4" />
                  Request a Car
                </TrackedLink>
              </div>
              <div className="space-y-4">
                <HeroGridShowcase
                  cars={heroCars.length >= 2 ? heroCars : heroPool.slice(0, 6)}
                  reviews={[]}
                />
                <HomepageHeroCarFinder embedded className="min-h-[12rem]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Price filter chips */}
      <div className="home-shell mb-6 sm:mb-8">
        <HomepagePriceFilter />
      </div>

      {/* Quick links */}
      <HomepageShopLinks />

      {/* Listings */}
      <HomepageSpotlight cars={spotlightCards} />
      <HomepageNewArrivals cars={newEnhanced} />
      <HomepageDeals cars={dealsEnhanced} />
      <HomepageTrending cars={trendingCars} />

      {/* Mobile car finder */}
      <div className="lg:hidden mt-8">
        <div className="home-shell">
          <HomepageHeroCarFinder embedded />
        </div>
      </div>

      <HomepageSupportWhatsApp />
    </div>
  );
}
