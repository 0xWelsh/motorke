// src/app/page.js
export const revalidate = 60;
import CarsSearchBar from "@/components/CarsSearchBar";
import TrackedLink from "@/components/TrackedLink";
import NikkyoSidebar from "@/components/NikkyoSidebar";
import HomepageSidebarRight from "@/components/home/HomepageSidebarRight";
import HomepageShopLinks from "@/components/home/HomepageShopLinks";
import HomepageTrending from "@/components/home/HomepageTrending";
import HomepageNikkyoGrids from "@/components/home/HomepageNikkyoGrids";
import HomepageHeroCarFinder from "@/components/home/HomepageHeroCarFinder";
import HomepageSupportWhatsApp from "@/components/home/HomepageSupportWhatsApp";
import HomepageSafetyStrip from "@/components/home/HomepageSafetyStrip";
import HomepagePriceFilter from "@/components/home/HomepagePriceFilter";
import HomepageCtaStrip from "@/components/home/HomepageCtaStrip";
import HomepageShapeGrid from "@/components/home/HomepageShapeGrid";
import HomepageMakeGrid from "@/components/home/HomepageMakeGrid";
import HeroCarousel from "@/components/home/HeroCarousel";
import PushOptIn from "@/components/PushOptIn";
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

function uniqueCars(list) {
  const seen = new Set();
  const out = [];
  for (const car of list || []) {
    if (!car || !car.id || seen.has(car.id)) continue;
    seen.add(car.id);
    out.push(car);
  }
  return out;
}

/**
 * Fill a homepage grid section to `target` cards, pulling replacements
 * from a shared pool so every row is complete (no blank space).
 * Tracks `usedIds` so no car repeats across sections.
 */
function fillGrid(section, usedIds, pool, target) {
  const sectionIds = new Set((section || []).map((c) => c?.id).filter(Boolean));
  const out = uniqueCars(section).filter((c) => !usedIds.has(c.id));
  for (const car of pool || []) {
    if (out.length >= target) break;
    if (!car || !car.id || sectionIds.has(car.id) || usedIds.has(car.id)) continue;
    out.push(car);
  }
  const filled = out.slice(0, target);
  filled.forEach((c) => usedIds.add(c.id));
  return filled;
}

export const metadata = {
  title: "Cars for Sale in Kenya | Buy Used & New Cars | BIDGARI",
  description:
    "Find verified cars for sale in Kenya — Nairobi, Mombasa, Kisumu, and across the country. Compare prices, inspect specs, and buy handled end-to-end by BIDGARI.",
  alternates: { canonical: "/" },
  openGraph: {
    url: absoluteUrl("/"),
    title: "Cars for Sale in Kenya | BIDGARI",
    description:
      "Verified cars for sale in Nairobi and Mombasa. Compare costs, specs, and buy handled end-to-end by BIDGARI.",
    type: "website",
  },
};

function homeStructuredData(origin, spotlightCars = [], newCars = []) {
  const allCars = [...spotlightCars, ...newCars.slice(0, 8)];
  const productSchemas = allCars.map((car) => ({
    "@type": "Product",
    "name": `${car.year} ${car.make} ${car.model} ${car.variant || ""}`.trim(),
    "image": absoluteMediaUrl(car?.images?.[0]?.url || car?.image),
    "description": `Verified ${car.condition} ${car.make} ${car.model} for sale in ${car.dealer?.location || "Kenya"} by BIDGARI.`,
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
        description: "Verified vehicle marketplace, with one trusted team handling every sale for Kenyan buyers.",
        address: { "@type": "PostalAddress", addressCountry: "KE" },
      },
      {
        "@type": "WebSite",
        name: "BIDGARI",
        url: origin,
        description: "Browse used and new listings, compare vehicles, and buy handled end-to-end by BIDGARI.",
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
    hotThisWeek,
    luxuryEnhanced,
  } = homepageBundle;

  const heroPool = seededShuffle(
    [...(heroFallback?.length ? heroFallback : [...(featured || []), ...(newArrivals || [])])],
    Math.floor(Date.now() / 60000),
  );
  const heroCars = heroPool.slice(0, 8);

  const spotlightCards = (homepageSpotlight || []).slice(0, 16);
  const spotlightIds = new Set(spotlightCards.map((c) => c.id));
  const trendingCars = (mostViewedEnhanced || []).filter((c) => !spotlightIds.has(c.id));

  const fillPool = uniqueCars(hotThisWeek || []);
  const usedIds = new Set();
  const recommendedCars = fillGrid(spotlightCards, usedIds, seededShuffle(fillPool, 42), 16);
  const newArrivalCars = fillGrid(newEnhanced || [], usedIds, seededShuffle(fillPool, 137), 16);
  const dealCars = fillGrid(dealsEnhanced || [], usedIds, seededShuffle(fillPool, 256), 16);
  const frequentCars = fillGrid(trendingCars, usedIds, seededShuffle(fillPool, 999), 16);

  const origin = getSiteOrigin();

  return (
    <div className="min-h-screen pb-10 bg-[var(--bg)]">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(homeStructuredData(origin, spotlightCards, newEnhanced)),
        }}
      />

      {/* Nikkyo-style two-column from the top: sidebar + main content */}
      <section className="border-b border-slate-200 bg-[var(--bg)]">
        <div className="home-shell">
          <div className="lg:grid lg:grid-cols-[190px_minmax(0,1fr)] xl:grid-cols-[190px_minmax(0,1fr)_240px] lg:gap-3 xl:gap-3 lg:items-start lg:py-6">
            <aside className="hidden lg:block lg:sticky lg:top-28 lg:self-start">
              <NikkyoSidebar inventoryCounts={browseInventoryCounts} />
            </aside>

            <main className="min-w-0 py-5 lg:py-0">
              {/* Announcement */}
              <p className="mb-4 text-center text-[11px] sm:text-xs font-bold text-[var(--accent)]">
                <TrackedLink
                  href="/how-to-buy"
                  eventName="homepage_announcement_click"
                  eventPayload={{ area: "announcement" }}
                  className="underline underline-offset-2 hover:text-[var(--accent-hover)]"
                >
                  Every listing is verified and sold through BIDGARI
                </TrackedLink>
              </p>

              {/* Keyword search */}
              <CarsSearchBar />

              {/* Hero banner carousel */}
              <div className="mt-5">
                <HeroCarousel cars={heroCars} />
              </div>

              {/* CTA strip */}
              <HomepageCtaStrip />

              {/* Search by Shape icon grid */}
              <div className="mt-7">
                <HomepageShapeGrid />
              </div>

              {/* Search by Make logo grid */}
              <div className="mt-7">
                <HomepageMakeGrid />
              </div>

              {/* Inventory sections */}
              <div className="mt-7 sm:mt-8">
                <HomepageNikkyoGrids
                  recommended={recommendedCars}
                  newArrivals={newArrivalCars}
                  deals={dealCars}
                  luxury={luxuryEnhanced}
                />
              </div>
            </main>

            <aside className="hidden xl:block xl:sticky xl:top-28 xl:self-start">
              <HomepageSidebarRight />
            </aside>
          </div>
        </div>
      </section>

      {/* Price filter chips */}
      <div className="home-shell py-6 sm:py-8">
        <HomepagePriceFilter />
      </div>

      {/* Quick links */}
      <HomepageShopLinks />

      <HomepageSafetyStrip />

      {/* Push notification opt-in */}
      <div className="home-shell mt-6">
        <PushOptIn variant="banner" />
      </div>

      <HomepageTrending cars={frequentCars} />

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
