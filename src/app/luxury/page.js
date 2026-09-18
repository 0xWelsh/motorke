import Link from "next/link";
import Image from "next/image";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { PUBLIC_ONLY_VERIFIED_DEALERS } from "@/lib/feature-flags";
import { publicDetailVisibilityClause } from "@/lib/car-sold-status";
import { absoluteUrl, absoluteMediaUrl } from "@/lib/site-url";
import { carListingPath } from "@/lib/car-listing-url";
import { formatCarPrice } from "@/lib/utils";
import LuxuryCollection from "@/components/LuxuryCollection";
import { ArrowUpRight } from "lucide-react";

export const metadata = {
  title: "The Collection | BIDGARI Luxury",
  description:
    "A curated collection of exceptional automobiles — Porsche, Range Rover, Mercedes-AMG, Bentley and more. Verified, handled end-to-end by BIDGARI.",
  alternates: { canonical: "/luxury" },
  openGraph: {
    url: absoluteUrl("/luxury"),
    title: "The Collection | BIDGARI Luxury",
    description:
      "Exceptional automobiles, curated by BIDGARI. Porsche, Range Rover, Mercedes-AMG, Bentley and more.",
    type: "website",
    images: [{ url: absoluteUrl("/og-luxury.jpg"), width: 1200, height: 630, alt: "BIDGARI Luxury Collection" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Collection | BIDGARI Luxury",
    description:
      "Exceptional automobiles, curated by BIDGARI. Porsche, Range Rover, Mercedes-AMG, Bentley and more.",
    images: [absoluteUrl("/og-luxury.jpg")],
  },
};

const getLuxuryCars = unstable_cache(
  async () => {
    return db.car.findMany({
      where: {
        ...publicDetailVisibilityClause(),
        isLuxury: true,
        ...(PUBLIC_ONLY_VERIFIED_DEALERS
          ? { dealer: { verificationStatus: "VERIFIED" } }
          : {}),
      },
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        dealer: {
          select: {
            id: true,
            name: true,
            slug: true,
            location: true,
            county: true,
          },
        },
      },
      orderBy: [{ views: "desc" }, { createdAt: "desc" }],
      take: 60,
    });
  },
  ["luxury-landing-cars-v4"],
  { revalidate: 120, tags: ["cars", "homepage"] },
);

async function getHeroCar() {
  const cars = await getLuxuryCars();
  if (!cars.length) return null;
  return cars[0];
}

export default async function LuxuryPage() {
  const [cars, heroCar] = await Promise.all([getLuxuryCars(), getHeroCar()]);
  const heroImage = heroCar?.images?.[0];

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Hero */}
      <section className="relative h-[85vh] min-h-[600px] max-h-[900px] overflow-hidden">
        {/* Background image */}
        {heroImage ? (
          <Image
            src={absoluteMediaUrl(heroImage.url)}
            alt={`${heroCar.year} ${heroCar.make} ${heroCar.model}`}
            fill
            className="object-cover animate-[slowZoom_20s_ease-in-out_infinite_alternate]"
            priority
            sizes="100vw"
          />
        ) : (
          <div className="absolute inset-0 bg-zinc-900" />
        )}

        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-zinc-950/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/60 to-transparent" />

        {/* Content */}
        <div className="absolute inset-0 flex items-end">
          <div className="w-full max-w-7xl mx-auto px-6 sm:px-8 pb-16 sm:pb-24">
            <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.3em] text-zinc-400 mb-4 sm:mb-6">
              BIDGARI Luxury
            </p>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-[0.95] mb-4 sm:mb-6">
              The
              <br />
              Collection
            </h1>
            <p className="text-sm sm:text-base text-zinc-400 font-medium max-w-md leading-relaxed mb-8 sm:mb-10">
              Exceptional automobiles, curated by BIDGARI.
            </p>
            <a
              href="#collection"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white border border-white/20 rounded-full px-6 py-3 hover:bg-white hover:text-black transition-all duration-300"
            >
              Explore Collection
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </a>
          </div>
        </div>

        {/* Hero car label */}
        {heroCar && (
          <div className="absolute top-6 right-6 sm:top-10 sm:right-10 text-right hidden sm:block">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-1">
              Now showing
            </p>
            <p className="text-sm font-bold text-white">
              {heroCar.year} {heroCar.make} {heroCar.model}
            </p>
            <p className="text-xs text-zinc-400 mt-0.5">{formatCarPrice(heroCar)}</p>
          </div>
        )}
      </section>

      {/* Collection */}
      <section id="collection" className="scroll-mt-0 px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <div className="max-w-7xl mx-auto">
          {/* Section header */}
          <div className="flex items-end justify-between gap-4 mb-8 sm:mb-12">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {cars.length} {cars.length === 1 ? "Vehicle" : "Vehicles"}
              </h2>
              <p className="text-xs text-zinc-500 mt-1 font-medium">
                Premium and high-end stock, verified by BIDGARI
              </p>
            </div>
            <Link
              href="/cars"
              className="shrink-0 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
            >
              All inventory <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Filters + Grid */}
          <LuxuryCollection cars={cars} />
        </div>
      </section>

      {/* Featured car — full width */}
      {heroCar && (
        <section className="px-4 sm:px-6 lg:px-8 pb-12 sm:pb-20">
          <div className="max-w-7xl mx-auto">
            <Link href={carListingPath(heroCar)} className="group block">
              <div className="relative overflow-hidden rounded-xl border border-zinc-800/60 bg-zinc-900 grid grid-cols-1 lg:grid-cols-2">
                <div className="relative aspect-[16/10] lg:aspect-auto lg:min-h-[400px] overflow-hidden">
                  {heroImage && (
                    <Image
                      src={absoluteMediaUrl(heroImage.url)}
                      alt={`${heroCar.year} ${heroCar.make} ${heroCar.model}`}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                  )}
                </div>
                <div className="flex flex-col justify-center p-8 sm:p-12">
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500 mb-3">
                    Featured
                  </p>
                  <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">
                    {heroCar.make}
                  </p>
                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight mb-4">
                    {heroCar.model}
                    {heroCar.variant ? ` ${heroCar.variant}` : ""}
                  </h3>
                  <p className="text-lg sm:text-xl font-bold text-white mb-6">
                    {formatCarPrice(heroCar)}
                  </p>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500 group-hover:text-white transition-colors">
                    View Vehicle <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="px-4 sm:px-6 lg:px-8 pb-16 sm:pb-24">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500 mb-4">
            Concierge
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-4">
            Can&apos;t find your specification?
          </h2>
          <p className="text-sm text-zinc-400 font-medium max-w-md mx-auto mb-8 leading-relaxed">
            Tell BIDGARI what you&apos;re looking for.
            We can help you locate the right vehicle.
          </p>
          <Link
            href="/request-car"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white border border-white/20 rounded-full px-6 py-3 hover:bg-white hover:text-black transition-all duration-300"
          >
            Request a Car <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
