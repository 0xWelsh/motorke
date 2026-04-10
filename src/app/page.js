// src/app/page.js
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { formatPrice, BADGE_OPTIONS } from "@/lib/utils";
import Link from "next/link";
import LocationSearch from "@/components/LocationSearch";
import NewsRibbon from "@/components/NewsRibbon";
import HotThisWeek from "@/components/HotThisWeek";
import HeroReviews from "@/components/HeroReviews";
import {
  ArrowUpRight, ChevronRight, MapPin, ShieldCheck, Sparkles
} from "lucide-react";
import Image from "next/image";
import { unstable_cache } from "next/cache";

const getCachedData = unstable_cache(
  async () => {
    const week = new Date(); week.setDate(week.getDate() - 7);
    const [featured, newArrivals, dealers, newsItems] = await Promise.all([
      db.car.findMany({
        where: { available: true, featured: true },
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          dealer: { select: { id: true, name: true, location: true, verified: true, slug: true } },
        },
        take: 8,
        orderBy: { createdAt: "desc" },
      }),
      db.car.findMany({
        where: { available: true, createdAt: { gte: week } },
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          dealer: { select: { id: true, name: true, location: true, slug: true } },
        },
        take: 8,
        orderBy: { createdAt: "desc" },
      }),
      db.dealer.findMany({
        where: { OR: [{ featured: true }, { verified: true }] },
        include: {
          _count: { select: { cars: { where: { available: true } } } },
          users: { select: { avatarUrl: true }, take: 1 },
        },
        take: 8,
        orderBy: [{ featured: "desc" }, { verified: "desc" }, { createdAt: "desc" }],
      }),
      db.article.findMany({
        orderBy: { publishedAt: "desc" },
        take: 8,
        select: {
          id: true,
          title: true,
          url: true,
          sourceName: true,
          publishedAt: true,
        },
      }),
    ]);
    return { featured, newArrivals, dealers, newsItems };
  },
  ["homepage-minimal-v3"],
  { revalidate: 900, tags: ["homepage"] }
);

const HERO_TEXTURE = "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1600&q=80";

export default async function HomePage() {
  const { featured, newArrivals, dealers, newsItems } = await getCachedData();
  const spotlight = featured.length > 0 ? featured : newArrivals;
  const heroPrimary = spotlight[0] || null;
  const heroSecondary = spotlight[1] || null;

  return (
    <div className="min-h-screen pb-28">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image src={HERO_TEXTURE} fill priority className="object-cover opacity-10" alt="" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,90,47,0.12),transparent_40%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_25%,rgba(17,17,17,0.08),transparent_38%)]" />
          <div className="absolute -top-24 -right-20 h-80 w-80 rounded-full bg-[#ff5a2f]/10 blur-3xl" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 max-w-7xl pt-2 pb-14 sm:pt-3 sm:pb-20 md:pt-8 md:pb-24 relative z-10">
          <NewsRibbon initialNews={newsItems} />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 items-center">
            <div className="lg:col-span-7">
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-slate-900 leading-[0.92] tracking-tight mb-6 sm:mb-7">
                Buy cars with
                <br />
                <span className="text-[#ff5a2f]">dealer-level clarity.</span>
              </h1>

              <p className="text-base sm:text-lg md:text-xl text-slate-600 mb-8 sm:mb-9 leading-relaxed max-w-2xl font-medium">
                Explore inventory from verified showrooms, compare units side by side, and reach real dealership teams without noisy listings.
              </p>

              <div className="w-full max-w-2xl mb-10">
                <LocationSearch />
              </div>

              <div className="flex flex-wrap items-center gap-3 mb-7">
                <Link href="/cars" className="mk-pill-btn inline-flex items-center gap-2 bg-[#111111] hover:bg-[#ff5a2f] text-white px-6 py-3 text-xs uppercase transition-colors">
                  Explore Cars <ArrowUpRight className="w-4 h-4" />
                </Link>
                <Link href="/dealers" className="mk-pill-btn inline-flex items-center gap-2 bg-white border border-[#e7e1d8] text-slate-900 px-6 py-3 text-xs uppercase hover:bg-[#faf7f2] transition-colors">
                  Visit Dealers <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="flex flex-wrap gap-2.5 mb-8">
                {["SUV", "Pickup", "Sedan", "Hybrid", "Electric"].map((type) => (
                  <Link
                    key={type}
                    href={`/cars?search=${encodeURIComponent(type)}`}
                    className="px-4 py-2 rounded-full border border-[#e7e1d8] bg-white text-[11px] font-bold uppercase tracking-[0.12em] text-slate-700 hover:border-[#ff5a2f]/40 hover:text-slate-900"
                  >
                    {type}
                  </Link>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-[#e7e1d8] max-w-2xl">
                {[
                  { label: "Verified Profiles", value: "Trust Signals" },
                  { label: "Transparent Specs", value: "No Guesswork" },
                  { label: "Direct Contact", value: "Fast Follow-up" },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400 mb-1">{item.label}</p>
                    <p className="text-sm font-bold text-slate-800">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 hidden lg:flex flex-col gap-6">
              <HotThisWeek />
              <HeroReviews />
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 sm:px-6 py-14 sm:py-20 max-w-7xl">
        <div className="flex items-end justify-between mb-8 sm:mb-10 gap-5">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400 mb-3">Cars</p>
            <h2 className="text-2xl sm:text-3xl md:text-5xl text-slate-900">Featured Inventory</h2>
          </div>
          <Link href="/cars" className="hidden sm:inline-flex mk-pill-btn items-center gap-2 border border-[#e7e1d8] bg-white px-5 py-3 text-xs uppercase text-slate-900 hover:bg-[#faf7f2]">
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {spotlight.slice(0, 8).map((car) => <CarCard key={car.id} car={car} />)}
        </div>
      </section>

      <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 max-w-7xl border-y border-[#e7e1d8]">
        <div className="py-8 md:py-10">
          <div className="flex items-center justify-between mb-8 gap-4">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400 mb-3">Dealers</p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl text-slate-900">Verified Dealerships</h2>
            </div>
            <Link href="/dealers" className="hidden sm:inline-flex mk-pill-btn items-center gap-2 border border-[#e7e1d8] bg-white px-5 py-3 text-xs uppercase text-slate-900 hover:bg-[#faf7f2]">
              All Dealers <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {dealers.slice(0, 8).map((dealer) => (
              <DealerCard key={dealer.id} dealer={dealer} />
            ))}
          </div>
        </div>
      </section>

      {newArrivals.length > 0 && (
        <section className="container mx-auto px-4 sm:px-6 py-8 max-w-7xl">
          <div className="flex items-end justify-between mb-8 sm:mb-10 gap-4">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400 mb-3">Fresh</p>
              <h2 className="text-2xl sm:text-3xl md:text-5xl text-slate-900">New Arrivals</h2>
            </div>
            <Link href="/cars?sort=newest" className="hidden sm:inline-flex mk-pill-btn items-center gap-2 border border-[#e7e1d8] bg-white px-5 py-3 text-xs uppercase text-slate-900 hover:bg-[#faf7f2]">
              Latest Cars <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {newArrivals.slice(0, 8).map((car) => <CarCard key={car.id} car={car} />)}
          </div>
        </section>
      )}

      <section className="container mx-auto px-4 sm:px-6 pt-12 sm:pt-16 max-w-7xl">
        <div className="rounded-[2rem] overflow-hidden border border-[#e8e2d9] bg-[#111111] p-6 sm:p-10 md:p-14 text-white relative">
          <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-[#ff5a2f]/30 blur-3xl" />
          <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/70 mb-3">For Dealerships</p>
          <h3 className="text-2xl sm:text-3xl md:text-5xl leading-tight max-w-3xl mb-5">
            Your cars deserve better than a social media album.
          </h3>
          <p className="text-base md:text-lg text-white/80 max-w-2xl mb-8 font-medium">
            Get a modern digital storefront, profile your brand, and capture buyer leads in one clean system.
          </p>
          <Link href="/signup" className="mk-pill-btn inline-flex items-center gap-2 bg-white text-black px-6 py-3 text-xs uppercase hover:bg-[#ffe6db] transition-colors">
            Create Dealer Account <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function DealerCard({ dealer }) {
  const brandImage = dealer.logoUrl || dealer.users?.[0]?.avatarUrl;

  return (
    <Link
      href={`/dealers/${dealer.slug}`}
      className="group border-y border-[#e8e2d9] py-5 transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-14 h-14 rounded-xl bg-[#faf7f2] border border-[#ede6dd] flex items-center justify-center text-xl font-black text-slate-900 overflow-hidden">
          {brandImage ? (
            <img src={brandImage} alt={dealer.name} className="w-full h-full object-cover" />
          ) : (
            dealer.name?.[0]
          )}
        </div>
        {dealer.verified && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-emerald-700">
            <ShieldCheck className="w-3.5 h-3.5" /> Verified
          </span>
        )}
      </div>

      <h3 className="text-lg font-bold text-slate-900 group-hover:text-black mb-2 line-clamp-1">{dealer.name}</h3>
      <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.12em] flex items-center gap-1.5 mb-6">
        <MapPin className="w-3.5 h-3.5" /> {dealer.location}
      </p>

      <div className="flex items-center justify-between border-t border-[#efe8df] pt-4">
        <div>
          <p className="text-2xl font-bold text-slate-900 leading-none">{dealer._count?.cars || 0}</p>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400 mt-1">Live Cars</p>
        </div>
        <span className="mk-inline-action inline-flex items-center gap-1">
          View <ChevronRight className="w-4 h-4" />
        </span>
      </div>
    </Link>
  );
}

function CarCard({ car }) {
  const img = car.images[0]?.url;
  const title = `${car.year} ${car.make} ${car.model}${car.variant ? ` ${car.variant}` : ""}`;

  return (
    <article className="group block bg-white border border-[#e8e2d9] hover:border-[#d8cec1] overflow-hidden transition-all duration-500 flex flex-col h-full">
      <Link href={`/cars/${car.id}`} className="relative aspect-[16/10] bg-[#f4efe8] overflow-hidden shrink-0">
        {img ? (
          <Image
            src={img}
            alt={title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-700"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold uppercase tracking-widest">No Image</div>
        )}

        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {car.badges?.slice(0, 2).map((b) => (
            <span key={b} className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full backdrop-blur-md ${BADGE_OPTIONS[b]?.color || "bg-white/95 text-slate-700"}`}>
              {b}
            </span>
          ))}
        </div>
      </Link>

      <div className="p-5 flex flex-col flex-1 gap-4">
        <Link href={`/cars/${car.id}`} className="space-y-1">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-400">{car.make}</p>
          <h3 className="font-bold text-slate-900 text-lg leading-snug line-clamp-2 group-hover:text-black transition-colors">
            {title}
          </h3>
        </Link>

        <div className="flex flex-wrap gap-2">
          {[car.fuelType, car.transmission === "AUTOMATIC" ? "Auto" : "Manual", car.bodyType].filter(Boolean).map((value) => (
            <span key={value} className="text-[11px] font-bold text-slate-600 bg-[#faf7f2] border border-[#efe8df] px-2.5 py-1 rounded-full uppercase tracking-wide">
              {value}
            </span>
          ))}
        </div>

        <div className="mt-auto flex items-end justify-between pt-4 border-t border-[#efe8df]">
          <div>
            <p className="text-xl font-bold text-slate-900 leading-none">{formatPrice(car.price)}</p>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400 mt-1 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> {car.dealer?.name}
            </p>
          </div>
          <Link href={`/cars/${car.id}`} className="w-9 h-9 rounded-lg border border-[#e8e2d9] bg-white flex items-center justify-center text-slate-700 hover:bg-[#111111] hover:text-white transition-all">
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}
