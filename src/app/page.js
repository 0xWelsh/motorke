// src/app/page.js
export const revalidate = 60;
import { Suspense } from "react";
import { ArrowRight } from "lucide-react";
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
import {
  HomeHeroSkeleton,
  HomeGridsSkeleton,
  HomeTrendingSkeleton,
  HomeSidebarSkeleton,
} from "@/components/home/HomeSkeletons";
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
  // Emit Product schemas only for cars that can actually be a Product rich
  // result — a missing price or image otherwise produces an "invalid" snippet.
  const allCars = [...spotlightCars, ...newCars.slice(0, 8)]
    .filter((car) => Boolean(car.price) && Boolean(car?.images?.[0]?.url || car?.image));
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

// ── Derived sections: pure JS over the cached bundle, re-derivable per slot ──
function deriveHomeSections(bundle) {
  const {
    featured,
    newArrivals,
    heroFallback,
    homepageSpotlight,
    mostViewedEnhanced,
    newEnhanced,
    dealsEnhanced,
    hotThisWeek,
    luxuryEnhanced,
  } = bundle || {};

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

  return { heroCars, recommendedCars, newArrivalCars, dealCars, frequentCars, luxury: luxuryEnhanced };
}

// Streaming slots: each awaits the shared cached promise inside its own
// Suspense boundary, so message + search paint first and data-backed sections
// fill in progressively with skeletons instead of a blank wait.
async function LdSlot({ bundlePromise, origin }) {
  const bundle = await bundlePromise;
  const spotlightCards = (bundle?.homepageSpotlight || []).slice(0, 16);
  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(homeStructuredData(origin, spotlightCards, bundle?.newEnhanced)),
      }}
    />
  );
}

async function HeroSlot({ bundlePromise }) {
  const { heroCars } = deriveHomeSections(await bundlePromise);
  return (
    <div className="mt-7">
      <p className="mb-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
        Featured — freshly inspected stock
      </p>
      <HeroCarousel cars={heroCars} />
    </div>
  );
}

async function GridsSlot({ bundlePromise }) {
  const s = deriveHomeSections(await bundlePromise);
  return (
    <HomepageNikkyoGrids
      recommended={s.recommendedCars}
      newArrivals={s.newArrivalCars}
      deals={s.dealCars}
      luxury={s.luxury}
    />
  );
}

async function TrendingSlot({ bundlePromise }) {
  const { frequentCars } = deriveHomeSections(await bundlePromise);
  return <HomepageTrending cars={frequentCars} />;
}

async function SidebarSlot({ countsPromise }) {
  const inventoryCounts = await countsPromise;
  return <NikkyoSidebar inventoryCounts={inventoryCounts} />;
}

export default async function HomePage() {
  // Kick both cached fetches immediately but do NOT await here — the static
  // shell (car finder, CTA strip, shape/make grids) renders first, and
  // data-backed sections stream in under Suspense below.
  const bundlePromise = getHomepageData();
  const countsPromise = getBrowseInventoryCounts();
  const origin = getSiteOrigin();

  return (
    <div className="min-h-screen pb-10 bg-[var(--bg)]">
      <Suspense fallback={null}>
        <LdSlot bundlePromise={bundlePromise} origin={origin} />
      </Suspense>


      {/* Nikkyo-style two-column from the top: sidebar + main content */}
      <section className="border-b border-slate-200 bg-[var(--bg)]">
        <div className="home-shell">
          <div className="lg:grid lg:grid-cols-[190px_minmax(0,1fr)] xl:grid-cols-[190px_minmax(0,1fr)_240px] lg:gap-3 xl:gap-3 lg:items-start lg:py-6">
            <aside className="hidden lg:block lg:sticky lg:top-28 lg:self-start">
              <Suspense fallback={<HomeSidebarSkeleton />}>
                <SidebarSlot countsPromise={countsPromise} />
              </Suspense>
            </aside>

            <main className="min-w-0 py-5 lg:py-0">
              {/* SEO H1 (kept hidden — the page leads with the featured carousel) */}
              <h1 className="sr-only">Cars for sale in Kenya — buy a verified car through BIDGARI</h1>

              {/* Hero banner carousel — leads the page, above search + filter */}
              <Suspense fallback={<HomeHeroSkeleton />}>
                <HeroSlot bundlePromise={bundlePromise} />
              </Suspense>

              {/* Car finder */}
              <div className="home-shell mt-7">
                <HomepageHeroCarFinder embedded />
              </div>

              {/* Browse inventory */}
              <div className="mt-4">
                <TrackedLink
                  href="/cars"
                  eventName="homepage_browse_click"
                  eventPayload={{ area: "header" }}
                  className="btn btn-primary btn-lg w-full sm:w-auto"
                >
                  Browse all cars <ArrowRight className="h-4 w-4" aria-hidden />
                </TrackedLink>
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
              <div className="mt-7 sm:mt-8 cv-auto">
                <Suspense fallback={<HomeGridsSkeleton />}>
                  <GridsSlot bundlePromise={bundlePromise} />
                </Suspense>
              </div>
            </main>

            <aside className="hidden xl:block xl:sticky xl:top-28 xl:self-start">
              <HomepageSidebarRight />
            </aside>
          </div>
        </div>
      </section>

      {/* Price filter chips */}
      <div className="home-shell py-6 sm:py-8 cv-auto">
        <HomepagePriceFilter />
      </div>

      {/* Quick links + safety + push — below the fold, skip offscreen render */}
      <div className="cv-auto">
        <HomepageShopLinks />
        <HomepageSafetyStrip />
        <div className="home-shell mt-6">
          <PushOptIn variant="banner" />
        </div>
      </div>

      <div className="cv-auto">
        <Suspense
          fallback={
            <div className="border-b border-slate-200 bg-[var(--bg)] py-6 sm:py-8">
              <div className="home-shell">
                <HomeTrendingSkeleton />
              </div>
            </div>
          }
        >
          <TrendingSlot bundlePromise={bundlePromise} />
        </Suspense>
      </div>

      <HomepageSupportWhatsApp />
    </div>
  );
}
