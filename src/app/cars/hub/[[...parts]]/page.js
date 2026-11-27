// Programmatic make/model/price hubs are high-cardinality and heavily crawled.
// Stock changes bust them via revalidateHubPathsForCar(); the timer is a
// backstop, so 1h instead of 5 min keeps ISR writes down.
export const revalidate = 3600;

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
import { withDbRetry } from "@/lib/db-retry";
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
  vehicleType: true,
  condition: true,
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
  available: true,
  soldAt: true,
  location: true,
  dutyPaid: true,
  negotiable: true,
  publicSlug: true,
  images: { orderBy: [{ isPrimary: "desc" }, { order: "asc" }], take: 5 },
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
  const total = await withDbRetry(() => db.car.count({ where }));
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
      siteName: "BIDGARI",
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
        question: `How many ${resolved.make} cars are listed on BIDGARI?`,
        answer: `There are currently ${n} verified ${resolved.make} listings for sale in Kenya. Inventory updates regularly as new stock is published.`,
      },
      {
        question: "Are these listings verified?",
        answer:
          "Every listing is verified by BIDGARI. Our team handles your enquiry, inspection, and paperwork end to end.",
      },
    ];
  } else if (resolved.kind === "county") {
    q = [
      {
        question: `Where can I buy a car in ${resolved.county}?`,
        answer: `Browse ${n}+ verified listings in ${resolved.county}. Compare prices and buy handled end-to-end by BIDGARI.`,
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
        question: "Are these listings verified?",
        answer:
          "Every listing on BIDGARI is verified and sold under the BIDGARI brand — one team handles your enquiry from first message to paperwork.",
      },
    ];
  } else {
    q = [
      {
        question: "How do I enquire about a listing?",
        answer:
          "Each vehicle page has a WhatsApp button and a call option straight to the BIDGARI team. Message or call from the listing detail view.",
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

async function buildModelAggs(resolved) {
  const where = await hubWhereClause(resolved);
  const make = resolved.make;
  const model = resolved.model;

  const [
    priceAgg,
    yearAgg,
    engineAgg,
    fuelDist,
    transDist,
    bodyDist,
    dealerDist,
    firstCar,
  ] = await Promise.all([
    withDbRetry(() => db.car.aggregate({ where, _min: { price: true }, _max: { price: true } })),
    withDbRetry(() => db.car.aggregate({ where, _min: { year: true }, _max: { year: true } })),
    withDbRetry(() => db.car.aggregate({ where, _min: { engineCC: true }, _max: { engineCC: true } })),
    withDbRetry(() => db.car.groupBy({ by: ["fuelType"], where, _count: true, orderBy: { _count: { fuelType: "desc" } } })),
    withDbRetry(() => db.car.groupBy({ by: ["transmission"], where, _count: true, orderBy: { _count: { transmission: "desc" } } })),
    withDbRetry(() => db.car.groupBy({ by: ["bodyType"], where, _count: true, orderBy: { _count: { bodyType: "desc" } } })),
    withDbRetry(() => db.car.groupBy({ by: ["dealerId"], where, _count: true, orderBy: { _count: { dealerId: "desc" } }, take: 10 })),
    withDbRetry(() => db.car.findFirst({ where, select: { id: true }, orderBy: { createdAt: "desc" } })),
  ]);

  const dealerIds = dealerDist.map((d) => d.dealerId).filter(Boolean);
  const dealers = dealerIds.length
    ? await withDbRetry(() =>
        db.dealer.findMany({
          where: { id: { in: dealerIds }, type: { not: "PRIVATE" } },
          select: { id: true, name: true, slug: true },
        })
      )
    : [];

  const siblingWhere = await hubWhereClause({ kind: "make", make });
  const siblingRows = await withDbRetry(() =>
    db.car.findMany({
      where: siblingWhere,
      distinct: ["model"],
      select: { model: true },
      orderBy: { model: "asc" },
    })
  );
  const siblingModels = siblingRows
    .map((r) => r.model)
    .filter(Boolean)
    .filter((m) => m !== model)
    .slice(0, 6);

  const siblingCars = await Promise.all(
    siblingModels.map(async (m) => {
      const c = await withDbRetry(() =>
        db.car.findFirst({
          where: { ...siblingWhere, model: { equals: m, mode: "insensitive" } },
          select: { id: true },
          orderBy: { createdAt: "desc" },
        })
      );
      return c ? { model: m, carId: c.id } : null;
    })
  );

  const topFuel = fuelDist.find((f) => f.fuelType);
  const topTrans = transDist.find((t) => t.transmission);
  const topBody = bodyDist.find((b) => b.bodyType);

  return {
    priceMin: priceAgg._min.price,
    priceMax: priceAgg._max.price,
    yearMin: yearAgg._min.year,
    yearMax: yearAgg._max.year,
    engineMin: engineAgg._min.engineCC,
    engineMax: engineAgg._max.engineCC,
    topFuel: topFuel ? { label: topFuel.fuelType, count: topFuel._count } : null,
    topTrans: topTrans ? { label: topTrans.transmission, count: topTrans._count } : null,
    topBody: topBody
      ? { label: BODY_TYPE_LABELS[topBody.bodyType] || topBody.bodyType, count: topBody._count }
      : null,
    dealers: dealers
      .map((d) => ({ ...d, count: dealerDist.find((dd) => dd.dealerId === d.id)?._count ?? 0 }))
      .sort((a, b) => b.count - a.count),
    siblingLinks: siblingCars.filter(Boolean),
    firstCarId: firstCar?.id ?? null,
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

  // Quick-filter chips (price / fuel / gearbox) refine the hub server-side.
  // Wrapped in AND so hub-derived clauses (e.g. price-band hubs) are never
  // silently overwritten.
  const minPrice = parseInt(sp.minPrice || "", 10) || 0;
  const maxPrice = parseInt(sp.maxPrice || "", 10) || 0;
  const quick = {
    ...(minPrice || maxPrice
      ? { price: { ...(minPrice && { gte: minPrice }), ...(maxPrice && { lte: maxPrice }) } }
      : {}),
    ...(sp.fuelType ? { fuelType: { in: String(sp.fuelType).split(",").filter(Boolean) } } : {}),
    ...(sp.transmission ? { transmission: String(sp.transmission).split(",")[0] } : {}),
  };
  const filteredWhere = Object.keys(quick).length ? { AND: [where, quick] } : where;

  function hubHref(nextSp) {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(nextSp)) {
      if (k !== "page" && v) q.set(k, String(v));
    }
    const s = q.toString();
    return s ? `${resolved.path}?${s}` : resolved.path;
  }
  function toggleHref(key, value) {
    const next = { ...sp };
    if (key === "price") {
      const active = (next.minPrice || "") === String(minPrice || "") && (next.maxPrice || "") === String(maxPrice || "");
      delete next.minPrice;
      delete next.maxPrice;
      if (!active) {
        if (value.min) next.minPrice = value.min;
        if (value.max) next.maxPrice = value.max;
      }
    } else {
      next[key] = next[key] === value ? "" : value;
    }
    return hubHref(next);
  }
  const isPriceActive = (v) =>
    (parseInt(v.min || "0", 10) || 0) === minPrice && (parseInt(v.max || "0", 10) || 0) === maxPrice;

  const [total, cars, siblingMakes, countyLinks, popularMakes] = await Promise.all([
    withDbRetry(() => db.car.count({ where: filteredWhere })),
    withDbRetry(() => db.car.findMany({
      where: filteredWhere,
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
    })),
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

  const modelAggs =
    resolved.kind === "make_model" && total > 0 ? await buildModelAggs(resolved) : null;

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
    <div className="min-h-screen bg-surface pb-20">
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
        <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
          {crumbs.map((c, i) => (
            <span key={c.href + i} className="flex items-center gap-1.5">
              {i > 0 ? <ChevronRight className="size-3" /> : null}
              {i < crumbs.length - 1 ? (
                <Link href={c.href} className="hover:text-[var(--accent)]">
                  {c.name}
                </Link>
              ) : (
                <span className="text-text">{c.name}</span>
              )}
            </span>
          ))}
        </nav>

        <header className="mb-6 rounded-xl border border-border bg-gradient-to-br from-surface-hover to-white px-4 py-5 sm:px-6">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--accent)]">
            Verified inventory, Kenya
            </p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-text sm:text-3xl">{h1}</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            {introCopy || hubTitleAndDescription(resolved, total).description}{" "}
            <Link href={qsAllFilters()} className="font-semibold text-[var(--accent)] underline-offset-4 hover:underline">
              Open advanced filters
            </Link>
          </p>
          <p className="mt-3 text-xs font-semibold text-muted">
            {total.toLocaleString("en-KE")} listings match this hub
          </p>
        </header>

        {/* Quick filters — refine this hub in place (server-side, no JS). */}
        <div className="mb-6 flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[10px] font-bold uppercase tracking-[0.14em] text-muted">Refine:</span>
          {[
            { label: "Under 1M", min: "", max: "1000000" },
            { label: "1M – 3M", min: "1000000", max: "3000000" },
            { label: "3M – 5M", min: "3000000", max: "5000000" },
            { label: "Over 5M", min: "5000000", max: "" },
          ].map((v) => {
            const active = isPriceActive(v);
            return (
              <Link key={v.label} href={toggleHref("price", v)}
                className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors ${active ? "border-[var(--accent)] bg-[var(--accent)] text-white" : "border-border bg-surface text-muted hover:border-strong"}`}>
                {v.label}
              </Link>
            );
          })}
          <span className="mx-1 text-ghost" aria-hidden>|</span>
          {["PETROL", "DIESEL", "HYBRID", "ELECTRIC"].map((f) => {
            const active = sp.fuelType === f;
            return (
              <Link key={f} href={toggleHref("fuelType", f)}
                className={`rounded-full border px-3 py-1 text-[11px] font-semibold capitalize transition-colors ${active ? "border-[var(--accent)] bg-[var(--accent)] text-white" : "border-border bg-surface text-muted hover:border-strong"}`}>
                {f.toLowerCase()}
              </Link>
            );
          })}
          <span className="mx-1 text-ghost" aria-hidden>|</span>
          {["AUTOMATIC", "MANUAL"].map((t) => {
            const active = sp.transmission === t;
            return (
              <Link key={t} href={toggleHref("transmission", t)}
                className={`rounded-full border px-3 py-1 text-[11px] font-semibold capitalize transition-colors ${active ? "border-[var(--accent)] bg-[var(--accent)] text-white" : "border-border bg-surface text-muted hover:border-strong"}`}>
                {t.toLowerCase()}
              </Link>
            );
          })}
          {(minPrice || maxPrice || sp.fuelType || sp.transmission) ? (
            <Link href={hubHref({})} className="ml-1 text-[11px] font-bold text-[var(--accent)] underline-offset-4 hover:underline">
              Clear
            </Link>
          ) : null}
        </div>

        {modelAggs ? (
          <div className="mb-8 rounded-xl border border-border bg-gradient-to-br from-surface-hover to-white px-4 py-5 sm:px-6">
            <div className="mb-4 grid grid-cols-1 gap-x-4 gap-y-7 sm:grid-cols-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">Price range</p>
                <p className="mt-0.5 text-lg font-black text-text">
                  {modelAggs.priceMin != null
                    ? `KES ${Number(modelAggs.priceMin).toLocaleString("en-KE")}`
                    : "—"}
                  {" "}–{" "}
                  {modelAggs.priceMax != null
                    ? `KES ${Number(modelAggs.priceMax).toLocaleString("en-KE")}`
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">Year range</p>
                <p className="mt-0.5 text-lg font-black text-text">
                  {modelAggs.yearMin || "—"} – {modelAggs.yearMax || "—"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">Engine</p>
                <p className="mt-0.5 text-lg font-black text-text">
                  {modelAggs.engineMin ? `${modelAggs.engineMin} cc` : "—"}
                  {modelAggs.engineMax && modelAggs.engineMax !== modelAggs.engineMin
                    ? ` – ${modelAggs.engineMax} cc`
                    : ""}
                </p>
              </div>
            </div>

            {(modelAggs.topFuel || modelAggs.topTrans || modelAggs.topBody) && (
              <div className="mb-4 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
                  Most common:
                </span>
                {modelAggs.topFuel ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-0.5 text-xs font-semibold text-secondary">
                    Fuel: {modelAggs.topFuel.label} ({modelAggs.topFuel.count})
                  </span>
                ) : null}
                {modelAggs.topTrans ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-0.5 text-xs font-semibold text-secondary">
                    {modelAggs.topTrans.label}: {modelAggs.topTrans.count}
                  </span>
                ) : null}
                {modelAggs.topBody ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-0.5 text-xs font-semibold text-secondary">
                    {modelAggs.topBody.label}: {modelAggs.topBody.count}
                  </span>
                ) : null}
              </div>
            )}

            {modelAggs.siblingLinks.length > 0 && modelAggs.firstCarId && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted mb-1.5">
                  Compare
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {modelAggs.siblingLinks.map((s) => (
                    <Link
                      key={s.model}
                      href={`/compare?a=${modelAggs.firstCarId}&b=${s.carId}`}
                      className="rounded-lg border border-[var(--accent-dim)] bg-accent-wash px-2.5 py-1 text-xs font-semibold text-accent hover:bg-accent-dim"
                    >
                      {resolved.model} vs {s.model}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}

        {cars.length === 0 ? (
          <div
            className="py-20 text-center border border-[#EDF2F7] bg-[#F7FAFC]"
            style={{ borderRadius: "var(--radius)" }}
          >
            <Search className="w-11 h-11 text-ghost mx-auto mb-4" />
            <h2 className="text-xl font-bold text-text mb-2">No listings here right now</h2>
            <p className="text-muted mb-6">Try the main inventory search. Stock changes daily.</p>
            <Link
              href="/cars"
              className="inline-flex bg-[var(--accent)] text-white px-8 py-3 text-xs font-bold uppercase tracking-widest"
              style={{ borderRadius: "var(--radius)" }}
            >
              Browse all cars
            </Link>
            <Link
              href="/newad"
              className="ml-3 inline-flex border border-border px-8 py-3 text-xs font-bold uppercase tracking-widest text-secondary hover:border-strong"
              style={{ borderRadius: "var(--radius)" }}
            >
              List your car
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-3">
            {cars.map((car, index) => (
              <CarCard key={car.id} car={car} spacious priority={index < 3} />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-10 flex justify-center gap-2 flex-wrap">
            {page > 1 ? (
              <Link
                href={`${path}?${new URLSearchParams({ ...sp, page: String(page - 1) }).toString()}`}
                className="rounded-lg border border-border px-4 py-2 text-sm font-semibold"
              >
                Previous
              </Link>
            ) : null}
            <span className="flex items-center px-3 text-sm text-muted">
              Page {page} / {totalPages}
            </span>
            {page < totalPages ? (
              <Link
                href={`${path}?${new URLSearchParams({ ...sp, page: String(page + 1) }).toString()}`}
                className="rounded-lg border border-border px-4 py-2 text-sm font-semibold"
              >
                Next
              </Link>
            ) : null}
          </div>
        )}

        {(siblingMakes.length > 0 || countyLinks.length > 0) && (
          <section className="mt-14 border-t border-border pt-10">
            {countyLinks.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent)] mb-3">{resolved.make} by county</h2>
                <div className="flex flex-wrap gap-2">
                  {countyLinks.map((l) => (
                    <Link
                      key={l.href}
                      href={`/cars/${slugifyCarSegment(resolved.make)}/${slugifyCarSegment(l.label)}`}
                      className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-secondary hover:border-[var(--accent)]"
                    >
                      {l.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {siblingMakes.length > 0 ? (
              <div>
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent)] mb-3">Popular makes</h2>
                <div className="flex flex-wrap gap-2">
                  {siblingMakes.map((m) => (
                    <Link
                      key={m.href}
                      href={m.href}
                      className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-secondary hover:border-[var(--accent)]"
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
          <section className="mt-10 border-t border-border pt-10">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent)] mb-3">Browse by brand</h2>
            <div className="flex flex-wrap gap-2">
              {popularMakes.map((m) => (
                <Link
                  key={m.href}
                  href={m.href}
                  className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-secondary hover:border-[var(--accent)]"
                >
                  {m.label}
                </Link>
              ))}
            </div>
            <p className="mt-4 text-sm text-muted">
              Or open{" "}
              <Link href="/cars" className="font-semibold text-[var(--accent)] underline-offset-4 hover:underline">
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
