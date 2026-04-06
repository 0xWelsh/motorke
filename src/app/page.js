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
    <div className="bg-background min-h-screen pb-32">

      {/* ── HERO ── */}
      <section className="relative min-h-[650px] flex items-center overflow-hidden border-b border-slate-100">
        {/* Immersive glassmorphism overlay */}
        <div className="absolute inset-0 z-0">
          <Image src={HERO_CAR} fill priority className="object-cover scale-105" alt="" style={{ filter: "blur(4px)" }} />
          <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-white/80 to-brand-light/40" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(3,105,161,0.05),transparent_50%)]" />
        </div>

        <div className="container mx-auto px-6 max-w-7xl py-24 relative z-10">
          <div className="max-w-3xl">
            {/* Premium Status Badge */}
            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-white border border-slate-200/60 shadow-sm mb-10 backdrop-blur-sm">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-extrabold text-slate-700 uppercase tracking-widest">
                {totalCars.toLocaleString()} <span className="text-brand">Verified Units</span> Available Now
              </span>
            </div>

            <h1 className="text-6xl md:text-8xl font-extrabold text-slate-900 leading-[0.95] tracking-tighter mb-10">
              Find your perfect car<br />
              <span className="text-brand drop-shadow-sm">across all dealerships instantly.</span>
            </h1>

            <p className="text-xl md:text-2xl text-slate-600 mb-12 leading-relaxed max-w-2xl font-medium">
              Compare live listings from {totalDealers} trusted dealerships across the country; no more endless scrolling!
            </p>

            <div className="w-full max-w-2xl mb-10">
              <LocationSearch />
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400 mr-2">Quick Search</span>
              {["SUVs", "Pickups", "Sedans", "Hatchbacks"].map(t => (
                <Link key={t} href={`/cars?search=${encodeURIComponent(t)}`}
                  className="px-5 py-2.5 rounded-xl bg-white border border-slate-200/60 shadow-sm text-xs font-extrabold uppercase tracking-widest text-slate-600 hover:border-brand-accent hover:text-brand hover:bg-brand-light transition-all">
                  {t}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── BROWSE BY BUDGET ── */}
      <section className="container mx-auto px-6 py-32 max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="space-y-2">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Browse by Budget</h2>
            <p className="text-lg text-slate-500 font-medium">Find the perfect match within your price range.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {PRICE_RANGES.map((r, i) => (
            <Link key={r.label} href={`/cars?minPrice=${r.min}&maxPrice=${r.max}`}
              className="group bg-white border border-slate-200 hover:border-brand-accent/30 rounded-3xl p-8 flex flex-col items-center text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-brand group-hover:border-brand-accent/20 group-hover:bg-brand-light transition-all mb-6 text-2xl">
                {r.icon}
              </div>
              <p className="text-lg font-extrabold text-slate-900 mb-1 group-hover:text-brand transition-colors">{r.label}</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 opacity-80">{r.sub}</p>
              <div className="mt-auto pt-6 border-t border-slate-100 w-full flex items-center justify-center gap-2">
                <span className="text-base font-extrabold text-slate-800">{priceCounts[i]}</span>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">Units Available</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── RECENT / RECOMMENDATIONS ── */}
      <ClientRecentSection />

      {/* ── FEATURED CARS ── */}
      {featured.length > 0 && (
        <section className="container mx-auto px-6 py-32 max-w-7xl">
          <div className="flex items-end justify-between mb-12">
            <div className="space-y-2">
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Featured Listings</h2>
              <p className="text-lg text-slate-500 font-medium">Hand-picked inventory from our most trusted partners.</p>
            </div>
            <Link href="/cars" className="hidden sm:flex items-center gap-2 px-6 py-3 rounded-2xl bg-brand text-white text-xs font-extrabold uppercase tracking-widest hover:bg-brand-accent transition-all shadow-lg shadow-brand/10">
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featured.map((car, idx) => <CarCard key={car.id} car={car} priority={idx < 3} />)}
          </div>
        </section>
      )}

      {/* ── NEW ARRIVALS ── */}
      {newArrivals.length > 0 && (
        <section className="bg-slate-900 py-32 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-brand-accent/5 blur-3xl" />
          <div className="container mx-auto px-6 max-w-7xl relative z-10">
            <div className="flex items-end justify-between mb-12">
              <div className="space-y-2">
                <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">Just Landed</h2>
                <p className="text-lg text-slate-400 font-medium">The latest inventory added in the last 7 days.</p>
              </div>
              <Link href="/cars?sort=newest" className="text-sm font-extrabold uppercase tracking-widest text-brand-accent hover:text-white transition-colors flex items-center gap-2">
                See More <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {newArrivals.map((car, idx) => <CarCard key={car.id} car={car} priority={idx < 4} />)}
            </div>
          </div>
        </section>
      )}

      {/* ── MARKET NEWS ── */}
      <section className="container mx-auto px-6 py-32 max-w-7xl">
        <div className="flex items-center justify-between mb-16">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-slate-50 text-slate-400">
              <Newspaper className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Market Intelligence</h2>
              <p className="text-lg text-slate-500 font-medium">Insights and updates from the Kenyan automotive landscape.</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {(articles?.length > 0 ? articles : [
            { title: "KRA Announces Revised Duty Rates for 2026 Vehicle Imports", category: "Policy", publishedAt: "2026-03-24T00:00:00Z", urlToImage: "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&q=80", url: "#" },
            { title: "The Rise of Electric Vehicles: Kenya's Growing Charging Infrastructure", category: "Trends", publishedAt: "2026-03-22T00:00:00Z", urlToImage: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800&q=80", url: "#" },
            { title: "Port of Mombasa: Record 5,000 Units Landed This Week", category: "Logistics", publishedAt: "2026-03-20T00:00:00Z", urlToImage: "https://images.unsplash.com/photo-1493946740624-75b8787c3299?w=800&q=80", url: "#" },
          ]).map((news, i) => (
            <Link key={i} href={news.url || "#"} target={news.url?.startsWith("http") ? "_blank" : undefined} className="group block space-y-5">
              <div className="aspect-[16/9] overflow-hidden rounded-3xl bg-slate-100 relative shadow-md">
                {news.urlToImage ? (
                  <Image src={news.urlToImage} alt={news.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs font-bold uppercase tracking-widest">No Image</div>
                )}
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1.5 rounded-xl bg-white/90 backdrop-blur-md text-[10px] font-extrabold text-brand uppercase tracking-widest shadow-sm">{news.category}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-xs font-bold text-slate-400">
                  <span>{new Date(news.publishedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-200" />
                  <span>5 min read</span>
                </div>
                <h3 className="text-xl font-extrabold text-slate-800 leading-snug group-hover:text-brand transition-colors line-clamp-2">{news.title}</h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="container mx-auto px-6 py-16 max-w-7xl">
        <div className="bg-white border border-slate-200 rounded-[3rem] p-12 md:p-20 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-light/20 blur-3xl -mr-32 -mt-32 rounded-full" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 relative z-10">
            {[
              { v: `${totalCars}+`, l: "Active Units", i: <Car className="w-7 h-7" /> },
              { v: totalDealers, l: "Verified Dealers", i: <ShieldCheck className="w-7 h-7" /> },
              { v: "Live", l: "Comparison", i: <Flame className="w-7 h-7" /> },
              { v: "24/7", l: "Dealer Access", i: <Clock className="w-7 h-7" /> },
            ].map((s, idx) => (
              <div key={idx} className="space-y-4 text-center lg:text-left">
                <div className="flex justify-center lg:justify-start text-brand">
                  {s.i}
                </div>
                <div className="space-y-1">
                  <p className="text-5xl font-extrabold text-slate-900 tracking-tight">{s.v}</p>
                  <p className="text-sm font-bold uppercase tracking-widest text-slate-400">{s.l}</p>
                </div>
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
    <Link href={`/cars/${car.id}`} className="group block bg-white border border-slate-100 hover:border-brand-accent/40 rounded-3xl overflow-hidden transition-all duration-500 hover:shadow-xl shadow-sm">
      <div className="relative aspect-[16/10] bg-slate-50 overflow-hidden">
        {img ? (
          <Image
            src={img} alt={title} fill priority={priority}
            className="object-cover group-hover:scale-105 transition-transform duration-700"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs font-bold uppercase tracking-widest">No Image</div>
        )}
        {car.badges?.length > 0 && (
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            {car.badges.slice(0, 2).map((b) => (
              <span key={b} className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg shadow-sm backdrop-blur-md ${BADGE_OPTIONS[b]?.color || "bg-white/90 text-slate-700"}`}>
                {b}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold bg-brand-light text-brand px-2 py-0.5 rounded-md tracking-tight">
              {car.year}
            </span>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {car.make}
            </span>
          </div>
          <h3 className="font-extrabold text-slate-900 text-lg leading-snug truncate group-hover:text-brand transition-colors">
            {title}
          </h3>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            car.mileage ? `${Math.round(car.mileage / 1000)}k km` : null,
            car.fuelType?.split(" ")[0],
            car.transmission === "AUTOMATIC" ? "Auto" : "Manual",
          ].filter(Boolean).map((s) => (
            <span key={s} className="text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-100/50 px-2.5 py-1 rounded-lg">
              {s}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-50 mt-2">
          <p className="text-xl font-extrabold text-slate-900">{formatPrice(car.price)}</p>
          <span className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-brand-light group-hover:text-brand transition-all">
            <ChevronRight className="w-4 h-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}
