// src/app/page.js
// 10 min, not 60s: renders are invalidated on publish/hide/delete via
// revalidateTag("homepage"), so the timer only needs to catch drift. At 60s
// nearly every crawler hit regenerated the page (ISR write + full CPU render).
export const revalidate = 600;
import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import TrackedLink from "@/components/TrackedLink";
import NikkyoSidebar from "@/components/NikkyoSidebar";
import HomepageSidebarRight from "@/components/home/HomepageSidebarRight";
import HomepageShopLinks from "@/components/home/HomepageShopLinks";
import HomepageTrending from "@/components/home/HomepageTrending";
import HomepageHeroCarFinder from "@/components/home/HomepageHeroCarFinder";
import HomepageSupportWhatsApp from "@/components/home/HomepageSupportWhatsApp";
import HomepageSafetyStrip from "@/components/home/HomepageSafetyStrip";
import HomepagePriceFilter from "@/components/home/HomepagePriceFilter";
import FeaturedCarsRail from "@/components/home/FeaturedCarsRail";
import { getFeaturedRailCars } from "@/lib/featured-rail";
import {
  HomeGridsSkeleton,
  HomeTrendingSkeleton,
  HomeSidebarSkeleton,
} from "@/components/home/HomeSkeletons";
import PushOptIn from "@/components/PushOptIn";
import { getHomepageData } from "@/lib/homepage-cache";
import { toCardCars } from "@/lib/car-card-dto";
import { getBrowseInventoryCounts } from "@/lib/browse-inventory-counts";
import { absoluteUrl, BRAND_MARK_SQUARE, getSiteOrigin, absoluteMediaUrl } from "@/lib/site-url";
import { carListingPath } from "@/lib/car-listing-url";
import { SEO_PRICE_BANDS } from "@/lib/seo-car-facets";

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

  return {
    heroCars: toCardCars(heroCars),
    recommendedCars: toCardCars(recommendedCars),
    newArrivalCars: toCardCars(newArrivalCars),
    dealCars: toCardCars(dealCars),
    frequentCars: toCardCars(frequentCars),
    luxury: toCardCars(luxuryEnhanced),
  };
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

async function FeaturedRailSlot() {
  const cars = await getFeaturedRailCars();
  if (!cars.length) return null;
  return <FeaturedCarsRail cars={cars} />;
}

async function InventoryRailSlot({ bundlePromise }) {
  const s = deriveHomeSections(await bundlePromise);
  // One category: everything we have, deduped, newest-weighted by the pool
  // order. No Recommended / New / Deals / Luxury split — just the inventory.
  const seen = new Set();
  const inventory = [
    ...(s.recommendedCars || []),
    ...(s.newArrivalCars || []),
    ...(s.dealCars || []),
    ...(s.luxury || []),
  ].filter((car) => {
    if (!car?.id || seen.has(car.id)) return false;
    seen.add(car.id);
    return true;
  });
  if (!inventory.length) return null;
  return (
    <div className="cv-auto">
      <FeaturedCarsRail
        cars={inventory}
        title="Our Inventory"
        sublabel=""
        featured={false}
        mosaic={false}
      />
    </div>
  );
}

async function TrendingSlot({ bundlePromise }) {
  const { frequentCars } = deriveHomeSections(await bundlePromise);
  if (!(frequentCars || []).length) return null;
  return (
    <div className="cv-auto">
      <HomepageTrending cars={frequentCars} />
    </div>
  );
}

async function SidebarSlot({ countsPromise }) {
  const inventoryCounts = await countsPromise;
  return <NikkyoSidebar inventoryCounts={inventoryCounts} />;
}

/**
 * Price bands, as buttons with live counts.
 *
 * Used-car buyers shop by budget in Kenya, and a visible count doubles as
 * depth proof ("135 cars under 4M"). Counts come from the same cached
 * inventory payload the sidebar uses, so this costs no extra query.
 */
function PriceBandRow({ priceBands }) {
  const bands = (SEO_PRICE_BANDS || []).filter((b) => (priceBands?.[b.slug] ?? 0) > 0);
  if (!bands.length) return null;

  return (
    <nav aria-label="Browse by price" className="mt-6 sm:mt-8">
      <h2 className="mb-2 text-[11px] font-black uppercase tracking-[0.2em] text-dim">
        Browse by budget
      </h2>
      {/* A 3-column grid rather than flex-wrap. With six bands, wrapping
          produced three ragged rows of different widths; the grid keeps every
          row flush on both edges and stays even if a band's count changes. */}
      <div className="grid grid-cols-3 gap-2">
        {bands.map((band) => {
          const count = priceBands[band.slug];
          // Compact display label — the full SEO label ("under KES 1M")
          // truncated to "Under KES…" in a 3-col grid on a 390px phone.
          const short = band.label
            .replace(/^under\s+/i, "Under ")
            .replace(/^over\s+/i, "Over ")
            .replace(/kes\s+/i, "")
            .replace(/\s*–\s*/g, "–");
          return (
            <Link
              key={band.slug}
              href={`/cars/${band.slug}`}
              className="flex min-w-0 items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-2 py-2.5 text-center text-[12px] font-semibold leading-tight text-secondary transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              <span className="min-w-0 truncate">{short}</span>
              <span className="shrink-0 rounded bg-surface-overlay px-1.5 py-0.5 text-[10px] font-bold text-muted">
                {count}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

async function PriceBandSlot({ countsPromise }) {
  const counts = await countsPromise;
  return <PriceBandRow priceBands={counts?.priceBands} />;
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
      <section className="border-b border-border bg-[var(--bg)]">
        <div className="home-shell">
          <div className="lg:grid lg:grid-cols-[190px_minmax(0,1fr)] xl:grid-cols-[190px_minmax(0,1fr)_240px] lg:gap-3 xl:gap-3 lg:items-start lg:py-6">
            <aside className="hidden lg:block lg:sticky lg:top-28 lg:self-start">
              <Suspense fallback={<HomeSidebarSkeleton />}>
                <SidebarSlot countsPromise={countsPromise} />
              </Suspense>
            </aside>

            <main className="min-w-0 py-5 lg:py-0">
              {/* SEO H1 (kept hidden — the page leads with search, not a carousel) */}
              <h1 className="sr-only">Cars for sale in Kenya — buy a verified car through BIDGARI</h1>

              {/* Cars first: the Featured rail owns the top of the page —
                  five random listings, mosaic cards, sliding sideways. The
                  car finder + budget pills sit beneath it. */}
              <Suspense
                fallback={
                  <div className="mt-1 h-[460px] animate-pulse rounded-xl bg-surface-overlay" />
                }
              >
                <FeaturedRailSlot />
              </Suspense>

              {/* Search first. A marketplace's primary job is "find me a car",
                  so the finder and the browse-all entry sit at the very top
                  rather than below a hero carousel. */}
              <div>
                <HomepageHeroCarFinder embedded />
              </div>

              {/* Equal halves rather than content-width buttons. At content width they
                  left ~73px dead on the right of a 366px row, which read as
                  a broken edge on a phone. */}
              <div className="mt-4 grid grid-cols-2 gap-2.5">
                <TrackedLink
                  href="/cars"
                  eventName="homepage_browse_click"
                  eventPayload={{ area: "top" }}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-surface text-[13px] font-bold text-text transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                >
                  Browse all cars <ArrowRight className="h-4 w-4" aria-hidden />
                </TrackedLink>

                {/* The seller doorway. Every other action on this page is a
                    browsing action, and all 356 listings currently come from a
                    single seller — supply is the binding constraint, so it gets
                    a first-class entry point beside the buyer CTA. */}
                <TrackedLink
                  href="/sell"
                  eventName="homepage_sell_click"
                  eventPayload={{ area: "top" }}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-surface text-[13px] font-bold text-text transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                >
                  Sell your car
                </TrackedLink>
              </div>

              {/* Budget bands sit directly under the browse CTA as their own
                  block. Nesting them inside the CTA's flex row made them wrap
                  onto a line below the button and drift far down the page. */}
              <Suspense fallback={<div className="mt-6 sm:mt-8 h-16" />}>
                <PriceBandSlot countsPromise={countsPromise} />
              </Suspense>

              {/* Inventory sections */}
              <div className="mt-7 sm:mt-8">
                <Suspense fallback={<HomeGridsSkeleton />}>
                  <InventoryRailSlot bundlePromise={bundlePromise} />
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

      <div>
        <Suspense
          fallback={
            <div className="border-b border-border bg-[var(--bg)] py-6 sm:py-8">
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
