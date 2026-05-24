export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import Script from "next/script";
import { ChevronRight, Search } from "lucide-react";
import CarCard from "@/components/CarCard";
import { absoluteUrl, getSiteOrigin } from "@/lib/site-url";
import {
  hubTitleAndDescription,
  hubWhereClause,
  hubIntroParagraph,
  resolveCarHub,
  getSiblingHubLinks,
  getCountyHubLinks,
  getPopularMakeLinks,
} from "@/lib/seo-car-hubs";
import { db } from "@/lib/db";
import { slugifyCarSegment } from "@/lib/seo-car-slug";
import { fuelFacetLabel, priceBandSearchParams, SEO_PRICE_BANDS } from "@/lib/seo-car-facets";
import { BODY_TYPE_LABELS } from "@/lib/constants";
import { carListingPath } from "@/lib/car-listing-url";

const HUB_PER_PAGE = 24;

const hubCarSelect = {
  id: true,
  make: true,
  model: true,
  variant: true,
  year: true,
  price: true,
  engineCC: true,
  mileage: true,
  bodyType: true,
  fuelType: true,
  transmission: true,
  featured: true,
  featuredWeight: true,
  spotlightUntil: true,
  hotBadgeUntil: true,
  views: true,
  createdAt: true,
  badges: true,
  description: true,
  publicSlug: true,
  images: { where: { isPrimary: true }, take: 1 },
  dealer: {
    select: {
      id: true,
      name: true,
      slug: true,
      location: true,
      verified: true,
      county: true,
      whatsapp: true,
      featured: true,
      boostScore: true,
    },
  },
};

function redirectIfAliasHub(parts, resolvedPath, page) {
  const requested = `/cars/${(parts || []).join("/")}`;
  if (requested === resolvedPath) return;
  const suffix = page > 1 ? `?page=${page}` : "";
  permanentRedirect(`${resolvedPath}${suffix}`);
}

export async function generateMetadata({ params, searchParams }) {
  const { parts } = await params;
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp?.page || "1", 10) || 1);
  const resolved = await resolveCarHub(parts || []);
  if (!resolved) return {};

  redirectIfAliasHub(parts || [], resolved.path, page);

  const where = await hubWhereClause(resolved);
  const total = await db.car.count({ where });
  const { title, description } = hubTitleAndDescription(resolved, total);

  const path = resolved.path;
  const url = absoluteUrl(path);

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url,
      locale: "en_KE",
      siteName: "Welsh Motorhub",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

function faqSchema(resolved, total) {
  const n = `${total}`;
  let q = [];
  if (resolved.kind === "make") {
    q = [
      {
        question: `How many ${resolved.make} cars are listed on Welsh Motorhub?`,
        answer: `There are currently ${n} verified ${resolved.make} listings from Kenyan dealerships. Inventory updates as dealers publish new vehicles.`,
      },
      {
        question: "Are these vehicles from verified dealers?",
        answer:
          "Welsh Motorhub focuses on dealer inventory so buyers can compare stock and contact sellers directly.",
      },
    ];
  } else if (resolved.kind === "county") {
    q = [
      {
        question: `Where can I buy a car in ${resolved.county}?`,
        answer: `Browse ${n}+ listings from dealers serving ${resolved.county}. Compare prices and contact dealerships through Welsh Motorhub.`,
      },
    ];
  } else if (resolved.kind === "make_fuel" || resolved.kind === "make_body" || resolved.kind === "make_price_band") {
    q = [
      {
        question: "Can I browse more inventory from other brands?",
        answer:
          `Yes. Open Advanced filters from this page or browse all verified cars across Kenya.`,
      },
      {
        question: "Are listings from verified dealerships?",
        answer:
          "Welsh Motorhub lists dealer-published vehicles. Contact dealers directly via WhatsApp or phone from each listing.",
      },
    ];
  } else {
    q = [
      {
        question: "How do I contact a dealer about a listing?",
        answer:
          "Each vehicle page shows WhatsApp and phone options where the dealer supplied them. Message or call from the listing detail view.",
      },
    ];
  }
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: q.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

function breadcrumbsJsonLd(origin, crumbs) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: `${origin}${c.href}`,
    })),
  };
}

export default async function CarHubPage({ params, searchParams }) {
  const { parts } = await params;
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page || "1", 10) || 1);

  const resolved = await resolveCarHub(parts || []);
  if (!resolved) notFound();

  redirectIfAliasHub(parts || [], resolved.path, page);

  const where = await hubWhereClause(resolved);

  const [total, cars, siblingMakes, countyLinks, popularMakes] = await Promise.all([
    db.car.count({ where }),
    db.car.findMany({
      where,
      select: hubCarSelect,
      orderBy: [
        { featuredWeight: "desc" },
        { dealer: { featured: "desc" } },
        { dealer: { verified: "desc" } },
        { views: "desc" },
        { createdAt: "desc" },
      ],
      skip: (page - 1) * HUB_PER_PAGE,
      take: HUB_PER_PAGE,
    }),
    resolved.kind === "make" ||
    resolved.kind === "make_model" ||
    resolved.kind === "make_county" ||
    resolved.kind === "make_fuel" ||
    resolved.kind === "make_body" ||
    resolved.kind === "make_price_band"
      ? getSiblingHubLinks(resolved.make)
      : Promise.resolve([]),
    resolved.kind === "make" ||
    resolved.kind === "make_fuel" ||
    resolved.kind === "make_body" ||
    resolved.kind === "make_price_band"
      ? getCountyHubLinks()
      : Promise.resolve([]),
    resolved.kind === "county" ? getPopularMakeLinks(16) : Promise.resolve([]),
  ]);

  const origin = getSiteOrigin();
  const path = resolved.path;

  function buildCrumbs() {
    const out = [{ name: "Home", href: "/" }, { name: "Cars", href: "/cars" }];
    switch (resolved.kind) {
      case "county":
        out.push({ name: resolved.county, href: path });
        break;
      case "make":
        out.push({ name: resolved.make, href: path });
        break;
      case "make_model":
        out.push({
          name: resolved.make,
          href: `/cars/${slugifyCarSegment(resolved.make)}`,
        });
        out.push({ name: resolved.model, href: path });
        break;
      case "make_county":
        out.push({
          name: resolved.make,
          href: `/cars/${slugifyCarSegment(resolved.make)}`,
        });
        out.push({ name: resolved.county, href: path });
        break;
      case "make_fuel":
        out.push({
          name: resolved.make,
          href: `/cars/${slugifyCarSegment(resolved.make)}`,
        });
        out.push({ name: fuelFacetLabel(resolved.fuelType), href: path });
        break;
      case "make_body":
        out.push({
          name: resolved.make,
          href: `/cars/${slugifyCarSegment(resolved.make)}`,
        });
        out.push({
          name: BODY_TYPE_LABELS[resolved.bodyType] || resolved.bodyType,
          href: path,
        });
        break;
      case "make_price_band":
        out.push({
          name: resolved.make,
          href: `/cars/${slugifyCarSegment(resolved.make)}`,
        });
        out.push({ name: resolved.band.label, href: path });
        break;
      case "global_body":
      case "global_body_price":
      case "global_price":
        out.push({ name: resolved.h1 || "Browse", href: path });
        break;
      default:
        break;
    }
    return out;
  }

  const crumbs = buildCrumbs();

  const h1 =
    resolved.h1 ||
    (resolved.kind === "county"
      ? `Cars for sale in ${resolved.county}`
      : resolved.kind === "make"
        ? `${resolved.make} for sale`
        : resolved.kind === "make_model"
          ? `${resolved.make} ${resolved.model} for sale`
          : resolved.kind === "make_county"
            ? `${resolved.make} for sale in ${resolved.county}`
            : resolved.kind === "make_fuel"
              ? `${resolved.make} ${fuelFacetLabel(resolved.fuelType)} for sale`
              : resolved.kind === "make_body"
                ? `${resolved.make} ${BODY_TYPE_LABELS[resolved.bodyType] || resolved.bodyType} for sale`
                : resolved.kind === "make_price_band"
                  ? `${resolved.make} (${resolved.band.label}) for sale`
                  : "Cars for sale");

  const introCopy = hubIntroParagraph(resolved, total);

  const qsAllFilters = () => {
    if (resolved.kind === "make") return `/cars?make=${encodeURIComponent(resolved.make)}`;
    if (resolved.kind === "make_model") {
      return `/cars?make=${encodeURIComponent(resolved.make)}&model=${encodeURIComponent(resolved.model)}`;
    }
    if (resolved.kind === "county") return `/cars?county=${encodeURIComponent(resolved.county)}`;
    if (resolved.kind === "make_county") {
      return `/cars?make=${encodeURIComponent(resolved.make)}&county=${encodeURIComponent(resolved.county)}`;
    }
    if (resolved.kind === "make_fuel") {
      return `/cars?make=${encodeURIComponent(resolved.make)}&fuelType=${encodeURIComponent(resolved.fuelType)}`;
    }
    if (resolved.kind === "make_body") {
      return `/cars?make=${encodeURIComponent(resolved.make)}&bodyType=${encodeURIComponent(resolved.bodyType)}`;
    }
    if (resolved.kind === "make_price_band") {
      const pq = priceBandSearchParams(resolved.band);
      const u = new URLSearchParams();
      u.set("make", resolved.make);
      if (pq.minPrice != null) u.set("minPrice", String(pq.minPrice));
      if (pq.maxPrice != null) u.set("maxPrice", String(pq.maxPrice));
      return `/cars?${u.toString()}`;
    }
    if (resolved.kind === "global_body") {
      return `/cars?bodyType=${encodeURIComponent(resolved.bodyType)}`;
    }
    if (resolved.kind === "global_body_price") {
      const band = SEO_PRICE_BANDS.find((b) => b.slug === resolved.bandSlug);
      const pq = band ? priceBandSearchParams(band) : {};
      const u = new URLSearchParams();
      u.set("bodyType", resolved.bodyType);
      if (pq.minPrice != null) u.set("minPrice", String(pq.minPrice));
      if (pq.maxPrice != null) u.set("maxPrice", String(pq.maxPrice));
      return `/cars?${u.toString()}`;
    }
    if (resolved.kind === "global_price") {
      const pq = priceBandSearchParams(resolved.band);
      const u = new URLSearchParams();
      if (pq.minPrice != null) u.set("minPrice", String(pq.minPrice));
      if (pq.maxPrice != null) u.set("maxPrice", String(pq.maxPrice));
      return `/cars?${u.toString()}`;
    }
    return "/cars";
  };

  const totalPages = Math.max(1, Math.ceil(total / HUB_PER_PAGE));

  const itemListLd = cars.length
    ? {
        "@context": "https://schema.org",
        "@type": "ItemList",
        numberOfItems: total,
        itemListOrder: "https://schema.org/ItemListOrderDescending",
        itemListElement: cars.map((car, idx) => ({
          "@type": "ListItem",
          position: (page - 1) * HUB_PER_PAGE + idx + 1,
          url: absoluteUrl(carListingPath(car)),
          name: `${car.year} ${car.make} ${car.model}`,
        })),
      }
    : null;

  return (
    <div className="min-h-screen bg-white pb-20 dark:bg-[#09090b]">
      <Script
        id="hub-faq-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema(resolved, total)) }}
      />
      <Script
        id="hub-breadcrumb-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd(origin, crumbs)) }}
      />
      {itemListLd ? (
        <Script
          id="hub-itemlist-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }}
        />
      ) : null}

      <div className="w-full px-2.5 sm:px-8 pt-4 sm:pt-6 overflow-x-hidden">
        <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-zinc-500">
          {crumbs.map((c, i) => (
            <span key={c.href + i} className="flex items-center gap-1.5">
              {i > 0 ? <ChevronRight className="size-3" /> : null}
              {i < crumbs.length - 1 ? (
                <Link href={c.href} className="hover:text-[#38A169]">
                  {c.name}
                </Link>
              ) : (
                <span className="text-slate-900 dark:text-white">{c.name}</span>
              )}
            </span>
          ))}
        </nav>

        <header className="mb-6 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white px-4 py-5 dark:border-zinc-800 dark:from-zinc-950 dark:to-zinc-900 sm:px-6">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#38A169]">
            Verified dealer inventory, Kenya
          </p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">{h1}</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-zinc-400">
            {introCopy || hubTitleAndDescription(resolved, total).description}{" "}
            <Link href={qsAllFilters()} className="font-semibold text-[#38A169] underline-offset-4 hover:underline">
              Open advanced filters
            </Link>
          </p>
          <p className="mt-3 text-xs font-semibold text-slate-500 dark:text-zinc-500">
            {total.toLocaleString("en-KE")} listings match this hub
          </p>
        </header>

        {cars.length === 0 ? (
          <div
            className="py-20 text-center border border-[#EDF2F7] dark:border-zinc-800 bg-[#F7FAFC] dark:bg-[#111111]"
            style={{ borderRadius: "var(--radius)" }}
          >
            <Search className="w-11 h-11 text-slate-300 dark:text-zinc-700 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No listings here right now</h2>
            <p className="text-slate-500 mb-6">Try the main inventory search. Stock changes daily.</p>
            <Link
              href="/cars"
              className="inline-flex bg-[#111827] dark:bg-[#38A169] text-white px-8 py-3 text-xs font-bold uppercase tracking-widest"
              style={{ borderRadius: "var(--radius)" }}
            >
              Browse all cars
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {cars.map((car) => (
              <CarCard key={car.id} car={car} />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-10 flex justify-center gap-2 flex-wrap">
            {page > 1 ? (
              <Link
                href={`${path}?page=${page - 1}`}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold dark:border-zinc-700"
              >
                Previous
              </Link>
            ) : null}
            <span className="flex items-center px-3 text-sm text-slate-600 dark:text-zinc-400">
              Page {page} / {totalPages}
            </span>
            {page < totalPages ? (
              <Link
                href={`${path}?page=${page + 1}`}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold dark:border-zinc-700"
              >
                Next
              </Link>
            ) : null}
          </div>
        )}

        {(siblingMakes.length > 0 || countyLinks.length > 0) && (
          <section className="mt-14 border-t border-slate-200 pt-10 dark:border-zinc-800">
            {countyLinks.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#38A169] mb-3">{resolved.make} by county</h2>
                <div className="flex flex-wrap gap-2">
                  {countyLinks.map((l) => (
                    <Link
                      key={l.href}
                      href={`/cars/${slugifyCarSegment(resolved.make)}/${slugifyCarSegment(l.label)}`}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-[#38A169] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200"
                    >
                      {l.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {siblingMakes.length > 0 ? (
              <div>
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#38A169] mb-3">Popular makes</h2>
                <div className="flex flex-wrap gap-2">
                  {siblingMakes.map((m) => (
                    <Link
                      key={m.href}
                      href={m.href}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-[#38A169] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200"
                    >
                      {m.label}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        )}

        {resolved.kind === "county" && popularMakes.length > 0 && (
          <section className="mt-10 border-t border-slate-200 pt-10 dark:border-zinc-800">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#38A169] mb-3">Browse by brand</h2>
            <div className="flex flex-wrap gap-2">
              {popularMakes.map((m) => (
                <Link
                  key={m.href}
                  href={m.href}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-[#38A169] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200"
                >
                  {m.label}
                </Link>
              ))}
            </div>
            <p className="mt-4 text-sm text-slate-600 dark:text-zinc-400">
              Or open{" "}
              <Link href="/cars" className="font-semibold text-[#38A169] underline-offset-4 hover:underline">
                advanced search
              </Link>{" "}
              with filters.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
