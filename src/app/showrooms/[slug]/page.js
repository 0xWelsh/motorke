export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import Script from "next/script";
import { db } from "@/lib/db";
import { PUBLIC_ONLY_VERIFIED_DEALERS } from "@/lib/feature-flags";
import CarCard from "@/components/CarCard";
import { absoluteUrl, getSiteOrigin } from "@/lib/site-url";
import {
  listLocationHubSlugs,
  locationHubDealerWhere,
  locationHubMetadata,
  resolveLocationHub,
} from "@/lib/seo-location-hubs";
import { buildBreadcrumbListSchema } from "@/lib/seo-schema";
import { slugifyCarSegment } from "@/lib/seo-car-slug";

export async function generateStaticParams() {
  return listLocationHubSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const hub = resolveLocationHub(slug);
  if (!hub) return { title: "Showroom area not found" };

  const dealerWhere = {
    ...locationHubDealerWhere(hub),
    ...(PUBLIC_ONLY_VERIFIED_DEALERS ? { verified: true } : {}),
  };

  const [dealerCount, carCount] = await Promise.all([
    db.dealer.count({ where: dealerWhere }),
    db.car.count({
      where: {
        available: true,
        ...(PUBLIC_ONLY_VERIFIED_DEALERS && { dealer: { verified: true } }),
        dealer: dealerWhere,
      },
    }),
  ]);

  return locationHubMetadata(hub, { dealerCount, carCount });
}

export default async function ShowroomLocationPage({ params }) {
  const { slug } = await params;
  const hub = resolveLocationHub(slug);
  if (!hub) notFound();

  const dealerWhere = {
    ...locationHubDealerWhere(hub),
    ...(PUBLIC_ONLY_VERIFIED_DEALERS ? { verified: true } : {}),
  };

  const [dealers, cars] = await Promise.all([
    db.dealer.findMany({
      where: dealerWhere,
      include: { _count: { select: { cars: { where: { available: true } } } } },
      orderBy: [{ featured: "desc" }, { verified: "desc" }, { name: "asc" }],
      take: 24,
    }),
    db.car.findMany({
      where: {
        available: true,
        ...(PUBLIC_ONLY_VERIFIED_DEALERS && { dealer: { verified: true } }),
        dealer: dealerWhere,
      },
      select: {
        id: true,
        publicSlug: true,
        make: true,
        model: true,
        variant: true,
        year: true,
        price: true,
        mileage: true,
        transmission: true,
        fuelType: true,
        engineCC: true,
        vehicleType: true,
        bodyType: true,
        description: true,
        available: true,
        soldAt: true,
        views: true,
        images: { where: { isPrimary: true }, take: 1 },
        dealer: { select: { name: true, slug: true, verified: true, location: true } },
      },
      orderBy: [{ featuredWeight: "desc" }, { createdAt: "desc" }],
      take: 24,
    }),
  ]);

  const origin = getSiteOrigin();
  const pageUrl = absoluteUrl(hub.path);

  const breadcrumbLd = buildBreadcrumbListSchema([
    { name: "Home", path: "/" },
    { name: "Dealers", path: "/dealers" },
    { name: hub.label, path: hub.path },
  ]);

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Car dealers on ${hub.label}`,
    url: pageUrl,
    numberOfItems: dealers.length,
    itemListElement: dealers.map((d, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: d.name,
      url: absoluteUrl(`/dealers/${d.slug}`),
    })),
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0a0a0a] pb-16">
      <Script
        id="showroom-location-breadcrumb"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <Script
        id="showroom-location-itemlist"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }}
      />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <nav className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-6">
          <Link href="/" className="hover:text-[#38A169]">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link href="/dealers" className="hover:text-[#38A169]">
            Dealers
          </Link>
          <span className="mx-2">/</span>
          <span className="text-slate-800 dark:text-slate-200">{hub.label}</span>
        </nav>

        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-3">
          Car dealers on {hub.label}
        </h1>
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mb-2">{hub.description}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-10">
          {dealers.length} showroom{dealers.length === 1 ? "" : "s"}, {cars.length} live listing
          {cars.length === 1 ? "" : "s"}, {hub.county} County
        </p>

        {dealers.length > 0 ? (
          <section className="mb-12">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-[#38A169] mb-4">Dealers in this area</h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {dealers.map((d) => (
                <li key={d.id}>
                  <Link
                    href={`/dealers/${d.slug}`}
                    className="block p-4 bg-white dark:bg-[#111] border border-slate-200 dark:border-zinc-800 rounded-xl hover:border-[#38A169]/40 transition-colors"
                  >
                    <p className="font-bold text-slate-900 dark:text-white">{d.name}</p>
                    <p className="text-xs text-slate-500 mt-1">{d.location || hub.label}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#38A169] mt-2">
                      {d._count.cars} in stock
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {cars.length > 0 ? (
          <section>
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-[#38A169] mb-4">Featured listings</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {cars.map((car, index) => (
                <CarCard key={car.id} car={car} priority={index < 2} />
              ))}
            </div>
            <p className="mt-8">
              <Link
                href={`/cars/${slugifyCarSegment(hub.county)}`}
                className="font-bold text-[#38A169] hover:underline"
              >
                Browse all cars in {hub.county}
              </Link>
            </p>
          </section>
        ) : (
          <p className="text-slate-500">No live listings in this corridor yet. Browse all dealers in {hub.county}.</p>
        )}
      </div>
    </div>
  );
}
