// src/app/page.js
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { formatPrice, BADGE_OPTIONS } from "@/lib/utils";
import Link from "next/link";
import LocationSearch from "@/components/LocationSearch";
import NewsRibbon from "@/components/NewsRibbon";
import HeroReviews from "@/components/HeroReviews";
import {
  ArrowUpRight, ChevronRight, MapPin, ShieldCheck, Sparkles, TrendingUp, Users, Zap, Lock, CheckCircle, Star
} from "lucide-react";
import Image from "next/image";
import { unstable_cache } from "next/cache";

const getCachedData = unstable_cache(
  async () => {
    const week = new Date(); week.setDate(week.getDate() - 7);
    const [featured, hotThisWeek, newArrivals, dealers, newsItems] = await Promise.all([
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
        where: { available: true },
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          dealer: { select: { id: true, name: true, location: true, verified: true, slug: true } },
          _count: { select: { carViews: true } },
        },
        take: 100, // Get more to sort by views in memory
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
    return { featured, hotThisWeek, newArrivals, dealers, newsItems };
  },
  ["homepage-minimal-v5"],
  { revalidate: 900, tags: ["homepage"] }
);

const HERO_TEXTURE = "/images/mercedes.jpg";

export default async function HomePage() {
  const { featured, hotThisWeek, newArrivals, dealers, newsItems } = await getCachedData();
  
  // Sort hot cars by view count and take top 8
  const hotSorted = (hotThisWeek || [])
    .filter(car => car && car._count?.carViews > 0)
    .sort((a, b) => (b._count?.carViews || 0) - (a._count?.carViews || 0))
    .slice(0, 8);
  
  // Priority: Hot This Week (with views) > Featured > New Arrivals
  const spotlight = hotSorted.length > 0 ? hotSorted : (featured && featured.length > 0) ? featured : newArrivals;
  const heroPrimary = spotlight?.[0] || null;
  const heroSecondary = spotlight?.[1] || null;

  return (
    <div className="min-h-screen pb-28">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image src={HERO_TEXTURE} fill priority className="object-cover opacity-[0.04]" alt="" />
          <div className="absolute inset-0 bg-[#f7f6f3]" />
          <div className="absolute inset-0 bg-[#f7f6f3]" />
          <div className="absolute -top-24 -right-20 h-80 w-80 rounded-none bg-[#ff5a2f]/5 blur-3xl" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 max-w-7xl pt-2 pb-14 sm:pt-3 sm:pb-20 md:pt-8 md:pb-24 relative z-10">
          <NewsRibbon initialNews={newsItems} />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 items-center">
            <div className="lg:col-span-7">
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-slate-900 leading-[0.92] tracking-tight mb-6 sm:mb-7">
                Buy cars with
                <br />
                <span className="text-[#ff5a2f]">dealer-level clarity.</span>
              </h1>

              <p className="text-base sm:text-lg md:text-xl text-slate-600 mb-6 sm:mb-7 leading-relaxed max-w-2xl font-medium">
                Explore inventory from verified showrooms, compare units side by side, and reach real dealership teams without noisy listings.
              </p>

              <div className="w-full max-w-lg mb-6">
                <LocationSearch />
              </div>

              <div className="flex flex-col sm:flex-row justify-center sm:justify-start items-stretch sm:items-center gap-4 sm:gap-3 mb-10">
                <Link href="/cars" className=" flex justify-center items-center gap-2 bg-[#ff5a2f] hover:bg-[#e54a1f] text-white px-7 py-3.5 text-xs font-black uppercase transition-all shadow-lg hover:shadow-[#ff5a2f]/30 active:scale-95">
                  Search Now <ArrowUpRight className="w-4 h-4" />
                </Link>
                <Link href="/dealers" className=" flex justify-center items-center gap-2 bg-white border-2 border-[#111111] text-slate-900 px-7 py-3 text-xs font-black uppercase hover:bg-[#f5f5f5] transition-all active:scale-95">
                  View Dealers
                </Link>
              </div>

              <div className="flex flex-wrap gap-2.5 mb-8">
                {["SUV", "Pickup", "Sedan", "Hybrid", "Electric"].map((type) => (
                  <Link
                    key={type}
                    href={`/cars?search=${encodeURIComponent(type)}`}
                    className="px-4 py-2 rounded-none border border-[#ddd4c8] bg-white text-[11px] font-black uppercase tracking-[0.12em] text-slate-700 hover:border-slate-400 hover:text-slate-900"
                  >
                    {type}
                  </Link>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-[#ddd4c8] max-w-2xl mb-8">
                {[
                  { label: "Verified Profiles", value: "Trust Signals" },
                  { label: "Transparent Specs", value: "No Guesswork" },
                  { label: "Direct Contact", value: "Fast Follow-up" },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400 mb-1">{item.label}</p>
                    <p className="text-sm font-black text-slate-900">{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap gap-3 items-center">
                {[
                  { Icon: Lock, label: "SSL Secured" },
                  { Icon: CheckCircle, label: "Verified Dealers" },
                  { Icon: Star, label: "5-Star Support" },
                ].map(({ Icon, label }) => (
                  <div key={label} className="flex items-center gap-2 px-4 py-2.5 rounded-none bg-[#f7f6f3] border border-[#ddd4c8] text-xs font-black text-slate-700">
                    <Icon className="w-4 h-4 text-orange-600" />
                    {label}
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 hidden lg:flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                {heroPrimary && (
                  <HeroCarPanel car={heroPrimary} tall />
                )}
                <div className="flex flex-col gap-4">
                  {heroSecondary && <HeroCarPanel car={heroSecondary} />}
                  <HeroReviews />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-[#f7f6f3] from-[#f7f6f3] to-[#f7f6f3] border-b border-[#ddd4c8] py-12 sm:py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            {[
              { label: "Total Cars", value: "500+", icon: TrendingUp },
              { label: "Verified Dealers", value: "50+", icon: ShieldCheck },
              { label: "Happy Buyers", value: "10K+", icon: Users },
              { label: "Avg Response", value: "< 2hrs", icon: Zap },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="text-center">
                <div className="w-12 h-12 rounded-none bg-white border border-[#e8e2d9] flex items-center justify-center mx-auto mb-3 shadow-sm">
                  <Icon className="w-6 h-6 text-[#ff5a2f]" />
                </div>
                <p className="text-2xl sm:text-3xl font-black text-slate-900 mb-1">{value}</p>
                <p className="text-xs sm:text-sm font-semibold text-slate-600 uppercase tracking-wide">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Us Section */}
      <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-20 max-w-7xl">
        <div className="mb-12">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400 mb-3">Platform</p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 mb-4 max-w-2xl">Why buyers choose Motorke</h2>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl">Transparent pricing, verified sellers, and direct communication—no middlemen, no surprises.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: ShieldCheck, label: "Curated Stock", desc: "We focus on verified vehicles. Our listings are never scraped or recycled — each car is individually inspected before publishing." },
            { icon: Lock, label: "Secure Payments", desc: "Multiple payment options including bank transfer, M-Pesa, and card payments through trusted financial partners." },
            { icon: TrendingUp, label: "Transparent Pricing", desc: "All prices shown in USD with breakdown: vehicle cost, inspection fees, shipping, and duty estimates clearly displayed." },
            { icon: Zap, label: "Direct Dealer Access", desc: "Connect directly with verified dealers. No middlemen — get instant responses and negotiate transparently." },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="p-6 rounded-none border border-[#e8e2d9] bg-white hover:shadow-md transition-all group">
              <div className="w-12 h-12 rounded-none bg-[#ff5a2f]/10 flex items-center justify-center mb-4 group-hover:bg-[#ff5a2f]/20 transition-colors">
                <Icon className="w-6 h-6 text-[#ff5a2f]" />
              </div>
              <h3 className="font-black text-slate-900 mb-2">{label}</h3>
              <p className="text-sm text-slate-600">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Hot This Week */}
      {hotSorted.length > 0 && (
        <section className="bg-[#111111] py-16 sm:py-24 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#ff5a2f]/10 rounded-none blur-3xl -z-0" />
          <div className="container mx-auto px-4 sm:px-6 max-w-7xl relative z-10">
            <div className="mb-14">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-white/60 mb-3">Trending</p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black">Hot This Week</h2>
              <p className="text-base text-white/70 mt-2">Most viewed and inquired vehicles right now</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hotSorted.slice(0, 5).map((car) => {
                const carSpecs = [
                  car.engine ? `${car.engine}` : null,
                  car.transmission === "AUTOMATIC" ? "AT" : "MT",
                  car.driveType,
                  car.fuelType
                ].filter(Boolean).join(" • ");

                const carDescription = [
                  carSpecs,
                  car.description || "",
                ].filter(Boolean).join(" ");

                return (
                  <Link
                    key={car.id}
                    href={`/cars/${car.id}`}
                    className="group block bg-white/10 backdrop-blur-sm border border-white/10 hover:border-white/20 overflow-hidden rounded-none transition-all duration-500 flex flex-col h-full"
                  >
                    <div className="relative aspect-[16/9] bg-white/5 overflow-hidden">
                      {car.images[0]?.url ? (
                        <Image
                          src={car.images[0].url}
                          alt={`${car.year} ${car.make} ${car.model}`}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/30 text-xs font-black">No Image</div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    </div>

                    <div className="p-6 flex flex-col flex-1 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-baseline gap-2">
                          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/60">{car.year}</p>
                          <h3 className="font-black text-white text-base leading-tight group-hover:text-[#ff5a2f] transition-colors">
                            {car.make} {car.model} {car.variant && `(${car.variant})`}
                          </h3>
                        </div>
                        
                        <p className="text-sm text-white/80 line-clamp-4 leading-relaxed">
                          {carDescription}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {car.bodyType && <span className="text-[10px] font-black text-white/80 bg-white/10 px-2.5 py-1 rounded-none uppercase tracking-wide">{car.bodyType.replace(/_/g, ' ')}</span>}
                        {car.fuelType && <span className="text-[10px] font-black text-white/80 bg-white/10 px-2.5 py-1 rounded-none uppercase tracking-wide">{car.fuelType}</span>}
                        {car.mileage && <span className="text-[10px] font-black text-white/80 bg-white/10 px-2.5 py-1 rounded-none uppercase tracking-wide">{Math.round(car.mileage)}km</span>}
                      </div>

                      <div className="mt-auto flex items-end justify-between pt-4 border-t border-white/10 gap-3">
                        <div>
                          <p className="text-lg font-black text-white leading-none">{formatPrice(car.price)}</p>
                        </div>
                        <span className="px-5 py-2.5 text-xs font-black uppercase text-white border border-white/20 rounded-none hover:bg-white/10 transition-all whitespace-nowrap">
                          View Offer
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}
            
      <section className="container mx-auto px-4 sm:px-6 py-16 sm:py-24 max-w-7xl">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400 mb-3">Showcase</p>
        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-12">Premium Selections</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Info Card */}
          <div className="group block bg-white border border-[#e8e2d9] overflow-hidden transition-all duration-500 flex flex-col h-full p-6 sm:p-8">
            <div className="flex gap-1 mb-6">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 text-slate-400" fill="currentColor" />
              ))}
            </div>

            <h3 className="text-2xl font-black text-slate-900 mb-3">Explore our premium collection</h3>
            <p className="text-sm text-slate-600 mb-8 leading-relaxed flex-1">
              Browse our curated selection of premium vehicles imported directly from Japan. Quality assured with transparent pricing and full vehicle history.
            </p>

            <Link href="/cars" className="inline-flex  items-center justify-center w-full bg-slate-900 hover:bg-slate-800 text-white px-6 py-3.5 text-xs font-black uppercase transition-all shadow-md">
              View All Vehicles
            </Link>
          </div>

          {/* Car Cards */}
          {spotlight.slice(0, 5).map((car) => <CarCard key={car.id} car={car} />)}
        </div>
      </section>

      <section className="bg-[#f7f6f3] from-[#f7f6f3] to-slate-100 py-14 sm:py-20 border-t border-[#ddd4c8]">
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
          <div className="py-8 md:py-10">
            <div className="flex items-center justify-between mb-10 gap-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400 mb-3">Network</p>
                <h2 className="text-3xl sm:text-4xl font-black text-slate-900">Verified Dealerships</h2>
              </div>
              <Link href="/dealers" className="hidden sm:inline-flex  items-center gap-2 bg-[#ff5a2f] hover:bg-[#e54a1f] text-white px-5 py-3 text-xs font-black uppercase transition-all shadow-md">
                View All Dealers <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
              {dealers.slice(0, 8).map((dealer) => (
                <DealerCard key={dealer.id} dealer={dealer} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {newArrivals.length > 0 && (
        <section className="container mx-auto px-4 sm:px-6 py-16 sm:py-24 max-w-7xl border-t border-[#ddd4c8]">
          <div className="flex items-end justify-between mb-12 sm:mb-14 gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400 mb-3">Fresh</p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900">New Arrivals</h2>
            </div>
            <Link href="/cars?sort=newest" className="hidden sm:inline-flex  items-center gap-2 bg-[#ff5a2f] hover:bg-[#e54a1f] text-white px-5 py-3 text-xs font-black uppercase transition-all shadow-md">
              Latest Cars <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {newArrivals.slice(0, 8).map((car) => <CarCard key={car.id} car={car} />)}
          </div>
        </section>
      )}

      <section className="container mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-20 max-w-7xl">
        <div className="rounded-none overflow-hidden border border-[#ddd4c8] bg-[#111111] p-6 sm:p-10 md:p-16 text-white relative shadow-none">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-none bg-[#ff5a2f]/20 blur-3xl" />
          <div className="absolute -left-32 -bottom-20 h-80 w-80 rounded-none bg-[#ff5a2f]/10 blur-3xl" />
          
          <div className="relative z-10 max-w-2xl">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-white/60 mb-4">For Dealerships</p>
            <h3 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight mb-6">
              Your cars deserve better than a social media album.
            </h3>
            <p className="text-base sm:text-lg text-white/80 mb-10 font-medium">
              Get a modern digital storefront, profile your brand, reach verified buyers, and capture leads in one clean system. No fees. No middlemen.
            </p>
            <Link href="/signup" className=" inline-flex items-center gap-2 bg-[#ff5a2f] hover:bg-[#e54a1f] text-white px-8 py-4 text-xs font-black uppercase transition-all shadow-lg hover:shadow-[#ff5a2f]/40 active:scale-95">
              Create Dealer Account <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function HeroCarPanel({ car, tall = false }) {
  const image = car.images[0]?.url;
  const title = `${car.year} ${car.make} ${car.model}`;

  return (
    <Link
      href={`/cars/${car.id}`}
      className={[
        "group relative overflow-hidden border border-[#e8e2d9] bg-white",
        tall ? "min-h-[420px]" : "min-h-[200px]",
      ].join(" ")}
    >
      {image ? (
        <Image src={image} alt={title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
      ) : (
        <div className="absolute inset-0 bg-[#f3eee7]" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
      <div className="absolute left-4 right-4 bottom-4 text-white">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/80 mb-1">{car.dealer?.name}</p>
        <p className="font-black leading-tight">{title}</p>
        <p className="text-sm font-black mt-1 text-white/90">{formatPrice(car.price)}</p>
      </div>
    </Link>
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
        <div className="w-14 h-14 rounded-none bg-[#faf7f2] border border-[#ede6dd] flex items-center justify-center text-xl font-black text-slate-900 overflow-hidden">
          {brandImage ? (
            <img src={brandImage} alt={dealer.name} className="w-full h-full object-cover" />
          ) : (
            dealer.name?.[0]
          )}
        </div>
        {dealer.verified && (
          <span className="inline-flex items-center gap-1.5 rounded-none border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">
            <ShieldCheck className="w-3.5 h-3.5" /> Verified
          </span>
        )}
      </div>

      <h3 className="text-lg font-black text-slate-900 group-hover:text-black mb-2 line-clamp-1">{dealer.name}</h3>
      <p className="text-xs text-slate-500 font-black uppercase tracking-[0.12em] flex items-center gap-1.5 mb-6">
        <MapPin className="w-3.5 h-3.5" /> {dealer.location}
      </p>

      <div className="flex items-center justify-between border-t border-[#efe8df] pt-4">
        <div>
          <p className="text-2xl font-black text-slate-900 leading-none">{dealer._count?.cars || 0}</p>
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400 mt-1">Live Cars</p>
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
  const title = `${car.year} ${car.make} ${car.model}${car.variant ? ` (${car.variant})` : ""}`;
  
  // Build detailed specs string
  const specs = [
    car.engine ? `${car.engine}` : null,
    car.transmission === "AUTOMATIC" ? "AT" : "MT",
    car.driveType,
    car.fuelType
  ].filter(Boolean).join(" • ");

  // Build full description from car fields
  const fullDescription = [
    specs,
    car.description || "",
  ].filter(Boolean).join(" ");

  return (
    <article className="group block bg-white border border-[#e8e2d9] hover:border-[#d8cec1] overflow-hidden transition-all duration-500 flex flex-col h-full">
      <Link href={`/cars/${car.id}`} className="relative aspect-[16/9] bg-[#f4efe8] overflow-hidden shrink-0">
        {img ? (
          <Image
            src={img}
            alt={title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-700"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-black uppercase tracking-widest">No Image</div>
        )}

        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {car.badges?.slice(0, 2).map((b) => (
            <span key={b} className={`text-[10px] font-black px-2.5 py-1 rounded-none backdrop-blur-md ${BADGE_OPTIONS[b]?.color || "bg-white/95 text-slate-700"}`}>
              {b}
            </span>
          ))}
        </div>

        <div className="absolute top-3 right-3">
          <span className="inline-block text-[11px] font-black px-3 py-1.5 rounded-none bg-emerald-500 text-white">AVAILABLE</span>
        </div>
      </Link>

      <div className="p-6 flex flex-col flex-1 gap-4">
        <Link href={`/cars/${car.id}`} className="space-y-3">
          <div className="flex items-baseline gap-2">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">{car.year}</p>
            <h3 className="font-black text-slate-900 text-base leading-tight group-hover:text-black transition-colors">
              {car.make} {car.model} {car.variant && `(${car.variant})`}
            </h3>
          </div>
          
          <p className="text-sm text-slate-700 line-clamp-4 leading-relaxed">
            {fullDescription}
          </p>
        </Link>

        <div className="flex flex-wrap gap-2">
          {car.bodyType && <span className="text-[10px] font-black text-slate-700 bg-slate-100 px-2.5 py-1 rounded-none uppercase tracking-wide">{car.bodyType.replace(/_/g, ' ')}</span>}
          {car.fuelType && <span className="text-[10px] font-black text-slate-700 bg-slate-100 px-2.5 py-1 rounded-none uppercase tracking-wide">{car.fuelType}</span>}
          {car.mileage && <span className="text-[10px] font-black text-slate-700 bg-slate-100 px-2.5 py-1 rounded-none uppercase tracking-wide">{Math.round(car.mileage)}km</span>}
        </div>

        <div className="mt-auto flex items-end justify-between pt-4 border-t border-[#efe8df] gap-3">
          <div>
            <p className="text-lg font-black text-slate-900 leading-none">{formatPrice(car.price)}</p>
          </div>
          <Link href={`/cars/${car.id}`} className="inline-flex px-5 py-2.5 text-xs font-black uppercase text-white border border-[#ddd4c8] rounded hover:bg-slate-900 hover:text-white transition-all whitespace-nowrap">
            View Offer
          </Link>
        </div>
      </div>
    </article>
  );
}
