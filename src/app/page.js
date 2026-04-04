// src/app/page.js
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { formatPrice, BADGE_OPTIONS } from "@/lib/utils";
import Link from "next/link";
import LocationSearch from "@/components/LocationSearch";
import {
  ChevronRight, ShieldCheck, Newspaper,
  Flame, Clock, Car, Wallet, Banknote, Briefcase, Trophy, Gem
} from "lucide-react";
import ClientRecentSection from "@/components/ClientRecentSection";
import Image from "next/image";
import { unstable_cache } from "next/cache";

const getCachedData = unstable_cache(
  async () => {
    const week = new Date(); week.setDate(week.getDate() - 7);
    const [featured, newArrivals, dealers, totalCars, totalDealers, priceCounts, articles] = await Promise.all([
      db.car.findMany({
        where: { available: true, featured: true },
        include: { images: { where: { isPrimary: true }, take: 1 }, dealer: { select: { name: true, location: true, verified: true, slug: true } } },
        take: 6, orderBy: { createdAt: "desc" },
      }),
      db.car.findMany({
        where: { available: true, createdAt: { gte: week } },
        include: { images: { where: { isPrimary: true }, take: 1 }, dealer: { select: { name: true, location: true } } },
        take: 4, orderBy: { createdAt: "desc" },
      }),
      db.dealer.findMany({
        where: { featured: true },
        include: { _count: { select: { cars: { where: { available: true } } } } },
        take: 4,
      }),
      db.car.count({ where: { available: true } }),
      db.dealer.count(),
      Promise.all([
        db.car.count({ where: { available: true, price: { lt: 1000000 } } }),
        db.car.count({ where: { available: true, price: { gte: 1000000, lt: 2000000 } } }),
        db.car.count({ where: { available: true, price: { gte: 2000000, lt: 4000000 } } }),
        db.car.count({ where: { available: true, price: { gte: 4000000, lt: 7000000 } } }),
        db.car.count({ where: { available: true, price: { gte: 7000000 } } }),
      ]),
      db.article.findMany({
        take: 3,
        orderBy: { publishedAt: "desc" }
      }).then(async (articles) => {
        if (articles.length < 3) {
          try {
            const { fetchAutomotiveNews } = await import("@/lib/news");
            await fetchAutomotiveNews(); // Seed database directly
            return db.article.findMany({ take: 3, orderBy: { publishedAt: "desc" } });
          } catch (e) {
            console.error("Failed to automatically fetch fresh news:", e);
            return articles;
          }
        }
        return articles;
      }),
    ]);
    return { featured, newArrivals, dealers, totalCars, totalDealers, priceCounts, articles };
  },
  ["homepage-data"],
  { revalidate: 900, tags: ["homepage"] }
);

const PRICE_RANGES = [
  { label: "Under 1M", min: 0, max: 1000000, sub: "Budget Friendly", icon: <Wallet className="w-5 h-5" /> },
  { label: "1M – 2M", min: 1000000, max: 2000000, sub: "Everyday Cars", icon: <Banknote className="w-5 h-5" /> },
  { label: "2M – 4M", min: 2000000, max: 4000000, sub: "Executive Tier", icon: <Briefcase className="w-5 h-5" /> },
  { label: "4M – 7M", min: 4000000, max: 7000000, sub: "Premium Utility", icon: <Trophy className="w-5 h-5" /> },
  { label: "Above 7M", min: 7000000, max: 99000000, sub: "Luxury Selection", icon: <Gem className="w-5 h-5" /> },
];

const HERO_CAR = "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=900&q=85";

export default async function HomePage() {
  const { featured, newArrivals, dealers, totalCars, totalDealers, priceCounts, articles } = await getCachedData();

  return (
    <div className="bg-background min-h-screen pb-20">

      {/* ── HERO ── */}
      <section className="relative min-h-[600px] flex items-center overflow-hidden border-b border-slate-100">
        {/* Immersive glassmorphism overlay */}
        <div className="absolute inset-0 z-0">
          <Image src={HERO_CAR} fill priority className="object-cover scale-105" alt="" style={{ filter: "blur(4px)" }} />
          <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-white/80 to-brand-light/40" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(3,105,161,0.05),transparent_50%)]" />
        </div>

        <div className="container mx-auto px-6 max-w-7xl py-20 relative z-10">
          <div className="max-w-2xl">
            {/* Live badge */}
            {/* Premium Status Badge */}
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white border border-slate-200/60 shadow-sm mb-8 backdrop-blur-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-black text-slate-600 uppercase tracking-[0.15em]">
                {totalCars.toLocaleString()} <span className="text-[var(--brand)] font-black">Verified Listings</span> Live
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-[1] tracking-tighter mb-8">
              Find your perfect car<br />
              <span className="text-[var(--brand)] drop-shadow-sm">across all dealerships instantly.</span>
            </h1>

            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
              Compare live listings from {totalDealers} trusted dealerships across the country; no more endless scrolling!
            </p>

            <div className="w-full max-w-xl mb-6">
              <LocationSearch />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mr-1">Discovery Tiers</span>
              {["SUVs", "Pickups", "Sedans", "Hatchbacks"].map(t => (
                <Link key={t} href={`/cars?search=${encodeURIComponent(t)}`}
                  className="px-4 py-2 rounded-xl bg-white border border-slate-200/60 shadow-sm text-[11px] font-black uppercase tracking-widest text-slate-600 hover:border-[var(--brand-accent)]/40 hover:text-[var(--brand)] hover:bg-[var(--brand-light)] transition-all">
                  {t}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── BROWSE BY BUDGET ── */}
      <section className="container mx-auto px-6 py-20 max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Browse by Budget</h2>
            <p className="text-slate-500 mt-1">Select a price range to explore available inventory.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {PRICE_RANGES.map((r, i) => (
            <Link key={r.label} href={`/cars?minPrice=${r.min}&maxPrice=${r.max}`}
              className="group bg-white border border-slate-200 hover:border-emerald-200 rounded-2xl p-6 flex flex-col items-center text-center transition-all duration-200 hover:shadow-md"
              style={{ "--hover-shadow": "0 4px 20px rgba(6,95,70,0.08)" }}>
              <div className="w-11 h-11 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-[var(--brand)] group-hover:border-[var(--brand-accent)]/20 group-hover:bg-[var(--brand-light)] transition-all mb-4 text-xl">
                {r.icon}
              </div>
              <p className="text-base font-black text-slate-900 mb-0.5 group-hover:text-[var(--brand)] transition-colors">{r.label}</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 opacity-70 group-hover:opacity-100 transition-opacity">{r.sub}</p>
              <div className="mt-auto pt-4 border-t border-slate-100 w-full flex items-center justify-center gap-1.5">
                <span className="text-sm font-black text-slate-800">{priceCounts[i]}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">units</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── RECENT / RECOMMENDATIONS ── */}
      <ClientRecentSection />

      {/* ── FEATURED CARS ── */}
      {featured.length > 0 && (
        <section className="container mx-auto px-6 py-20 max-w-7xl">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Featured Listings</h2>
              <p className="text-slate-500 mt-1">Hand-picked inventory from top dealers.</p>
            </div>
            <Link href="/cars" className="text-xs font-bold uppercase tracking-widest text-[var(--brand-accent)] hover:text-[var(--brand)] transition-colors flex items-center gap-1">
              View All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featured.map((car, idx) => <CarCard key={car.id} car={car} priority={idx < 3} />)}
          </div>
        </section>
      )}

      {/* ── NEW ARRIVALS ── */}
      {newArrivals.length > 0 && (
        <section className="bg-white border-y border-slate-100">
          <div className="container mx-auto px-6 py-20 max-w-7xl">
            <div className="flex items-end justify-between mb-10">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Just Landed</h2>
              <Link href="/cars?sort=newest" className="text-xs font-bold uppercase tracking-widest text-[var(--brand-accent)] hover:text-[var(--brand)] transition-colors flex items-center gap-1">
                See More <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              {newArrivals.map((car, idx) => <CarCard key={car.id} car={car} priority={idx < 4} />)}
            </div>
          </div>
        </section>
      )}

      {/* ── MARKET NEWS ── */}
      <section className="container mx-auto px-6 py-20 max-w-7xl">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <Newspaper className="w-5 h-5 text-slate-400" />
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Market Intelligence</h2>
          </div>
          <Link href="/news" className="text-xs font-bold uppercase tracking-widest text-[var(--brand-accent)] hover:text-[var(--brand)] transition-colors">
            All Stories
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {(articles?.length > 0 ? articles : [
            { title: "KRA Announces Revised Duty Rates for 2026 Vehicle Imports", category: "Policy", publishedAt: "2026-03-24T00:00:00Z", urlToImage: "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&q=80", url: "#" },
            { title: "The Rise of Electric Vehicles: Kenya's Growing Charging Infrastructure", category: "Trends", publishedAt: "2026-03-22T00:00:00Z", urlToImage: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800&q=80", url: "#" },
            { title: "Port of Mombasa: Record 5,000 Units Landed This Week", category: "Logistics", publishedAt: "2026-03-20T00:00:00Z", urlToImage: "https://images.unsplash.com/photo-1493946740624-75b8787c3299?w=800&q=80", url: "#" },
          ]).map((news, i) => (
            <Link key={i} href={news.url || "#"} target={news.url?.startsWith("http") ? "_blank" : undefined} className="group block">
              <div className="aspect-[16/10] overflow-hidden rounded-2xl bg-slate-100 mb-4 relative">
                {news.urlToImage ? (
                  <Image src={news.urlToImage} alt={news.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300 text-[10px] font-bold uppercase tracking-widest">No Image</div>
                )}
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-black text-[var(--brand)] uppercase tracking-widest">{news.category}</span>
                <span className="w-1 h-1 rounded-full bg-slate-200" />
                <span className="text-[10px] font-black text-slate-500 uppercase opacity-60">
                  {new Date(news.publishedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>
              <h3 className="text-base font-black text-slate-800 leading-snug group-hover:text-[var(--brand)] transition-colors line-clamp-2">{news.title}</h3>
            </Link>
          ))}
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="bg-white border-t border-slate-100">
        <div className="container mx-auto px-6 py-16 max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { v: `${totalCars}+`, l: "Active Units", i: <Car className="w-5 h-5" /> },
              { v: totalDealers, l: "Verified Dealers", i: <ShieldCheck className="w-5 h-5" /> },
              { v: "Live", l: "Comparison Tool", i: <Flame className="w-5 h-5" /> },
              { v: "24/7", l: "Dealer Access", i: <Clock className="w-5 h-5" /> },
            ].map((s, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-100 rounded-2xl p-8 text-center group hover:border-[var(--brand-accent)]/20 hover:bg-[var(--brand-light)] transition-all">
                <div className="flex justify-center mb-4 text-slate-300 group-hover:text-[var(--brand)] transition-colors">
                  {s.i}
                </div>
                <p className="text-4xl font-black text-slate-900 mb-1">{s.v}</p>
                <p className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-400 opacity-80">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}

function CarCard({ car, priority = false }) {
  const img = car.images[0]?.url;
  const title = `${car.make} ${car.model}${car.variant ? ` ${car.variant}` : ""}`;

  return (
    <Link href={`/cars/${car.id}`} className="group block bg-white border border-slate-100 hover:border-[var(--brand-accent)]/30 rounded-[2rem] overflow-hidden transition-all duration-500 hover:shadow-xl shadow-sm">
      <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
        {img ? (
          <Image
            src={img} alt={title} fill priority={priority}
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300 text-[11px] font-bold uppercase tracking-widest">No Image</div>
        )}
        {car.badges?.length > 0 && (
          <div className="absolute bottom-3 left-3 flex flex-wrap gap-1">
            {car.badges.map((b) => (
              <span key={b} className={`text-[9px] font-bold px-2 py-0.5 rounded ${BADGE_OPTIONS[b]?.color || "bg-white text-slate-600 border border-slate-200"}`}>
                {b}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black bg-[var(--brand-light)] text-[var(--brand)] px-2 py-0.5 rounded-md shrink-0">
            {car.year}
          </span>
          <h3 className="font-bold text-slate-800 text-sm leading-tight truncate group-hover:text-[var(--brand-accent)] transition-colors">
            {title}
          </h3>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {[
            car.mileage ? `${Math.round(car.mileage / 1000)}k km` : null,
            car.fuelType?.split(" ")[0],
            car.transmission === "AUTOMATIC" ? "Auto" : car.transmission,
            car.drivetrain,
          ].filter(Boolean).map((s) => (
            <span key={s} className="text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded">
              {s}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2.5 border-t border-slate-50 mt-auto">
          <p className="text-lg font-black text-slate-900">{formatPrice(car.price)}</p>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-[var(--brand-accent)] transition-colors flex items-center gap-1">
            View <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}
