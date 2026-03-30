// src/app/page.js
import { db } from "@/lib/db";
import { formatPrice, formatMileage, BADGE_OPTIONS } from "@/lib/utils";
import Link from "next/link";
import LocationSearch from "@/components/LocationSearch";
import { 
  ChevronRight, 
  CheckCircle2, 
  ShieldCheck, 
  MessageSquare, 
  Search, 
  ArrowRight,
  MapPin,
  TrendingUp,
  Settings,
  Newspaper,
  Flame,
  Clock,
  Car,
  Wallet,
  Banknote,
  Briefcase,
  Trophy,
  Gem
} from "lucide-react";
import ClientRecentSection from "@/components/ClientRecentSection";
import Image from "next/image";
import { unstable_cache } from "next/cache";

const getCachedData = unstable_cache(
  async () => {
    const week = new Date(); week.setDate(week.getDate() - 7);
    const [featured, newArrivals, dealers, totalCars, totalDealers, priceCounts] = await Promise.all([
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
      ])
    ]);
    return { featured, newArrivals, dealers, totalCars, totalDealers, priceCounts };
  },
  ["homepage-data"],
  { revalidate: 900, tags: ["homepage"] }
);

const BODY_TYPES = [
  { type: "SUV_FULL",      label: "Full-Size SUV",     img: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400&q=80" },
  { type: "SUV_COMPACT",   label: "Compact SUV",      img: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=400&q=80" },
  { type: "PICKUP_DOUBLE", label: "Double Cab",        img: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400&q=80" },
  { type: "SEDAN",         label: "Luxury Sedan",      img: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&q=80" },
  { type: "HATCHBACK",     label: "City Hatchback",    img: "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=400&q=80" },
  { type: "VAN_PASSENGER", label: "People Carrier",    img: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&q=80" },
  { type: "TRUCK_LIGHT",   label: "Light Truck",       img: "https://images.unsplash.com/photo-1599256631102-12713e279471?w=400&q=80" },
  { type: "MOTORCYCLE",    label: "Motorbikes",        img: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=400&q=80" },
];

const PRICE_RANGES = [
  { label: "Under 1M",  min: 0,       max: 1000000,  sub: "Budget Friendly", icon: <Wallet className="w-5 h-5" /> },
  { label: "1M – 2M",   min: 1000000, max: 2000000,  sub: "Everyday Cars",   icon: <Banknote className="w-5 h-5" /> },
  { label: "2M – 4M",   min: 2000000, max: 4000000,  sub: "Executive Tier",  icon: <Briefcase className="w-5 h-5" /> },
  { label: "4M – 7M",   min: 4000000, max: 7000000,  sub: "Premium Utility", icon: <Trophy className="w-5 h-5" /> },
  { label: "Above 7M",  min: 7000000, max: 99000000, sub: "Luxury Selection",icon: <Gem className="w-5 h-5" /> },
];

const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=1920&q=80",
  "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1920&q=80",
  "https://images.unsplash.com/photo-1619682817481-e994891cd1f5?w=1920&q=80",
  "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1920&q=80",
  "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=1920&q=80",
];

const TRENDING = ["Toyota Hilux", "Toyota Prado", "Subaru Forester", "Mazda CX-5"];

export default async function HomePage() {
  const { featured, newArrivals, dealers, totalCars, totalDealers, priceCounts } = await getCachedData();
  const heroImage = HERO_IMAGES[Math.floor(Math.random() * HERO_IMAGES.length)];

  return (
    <div className="bg-background min-h-screen pb-20">
      {/* ── IMMERSIVE HERO ── */}
      <section className="relative h-[85vh] min-h-[650px] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image 
            src={heroImage} 
            fill 
            priority 
            className="w-full h-full object-cover opacity-60" 
            alt="Motorke" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(234,88,12,0.15),transparent_50%)]" />
        </div>

        <div className="container mx-auto px-6 relative z-10 max-w-6xl">
          <div className="max-w-4xl">
            
            {/* Live Inventory Badge */}
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8 shadow-2xl">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">
                Live: <span className="text-white">{totalCars.toLocaleString()}</span> Verified Units Available
              </span>
            </div>

            {/* Main Premium Typography */}
            <h1 className="text-6xl md:text-8xl font-black text-white leading-[0.95] tracking-tighter mb-8">
              The Premium <br />
              <span className="text-orange-600 drop-shadow-[0_0_30px_rgba(234,88,12,0.4)]">Collection.</span>
            </h1>
            
            <p className="text-xl text-white/50 max-w-xl mb-12 leading-relaxed font-medium">
              Kenya&apos;s most refined automotive gallery. <br />
              Secure verified luxury and utility units directly from premium dealerships.
            </p>
            
            <div className="w-full max-w-2xl mb-12">
              <LocationSearch />
              
              {/* Sleek Quick Filters */}
              <div className="flex flex-wrap items-center gap-3 mt-8">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mr-2">Quick Access</span>
                {["SUVs", "Luxury Sedans", "Performance"].map(t => (
                  <Link key={t} href={`/cars?search=${encodeURIComponent(t)}`} 
                    className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white hover:bg-orange-600 hover:border-orange-500 transition-all shadow-sm">
                    {t}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Vanguard Dealer Trust Banner */}
        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#0a0a0a] to-transparent pt-24 pb-8 z-20 pointer-events-none">
           <div className="container mx-auto px-6 max-w-6xl flex justify-center md:justify-end">
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-[2rem] bg-black/40 backdrop-blur-xl border border-white/5 shadow-2xl">
                 <ShieldCheck className="w-4 h-4 text-orange-500" />
                 <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50">
                    Curated from <strong className="text-white">{totalDealers}</strong> Vanguard Dealerships across Kenya
                 </span>
              </div>
           </div>
        </div>
      </section>

      {/* ── MINIMAL BUDGET DISCOVERY ── */}
      <section className="container mx-auto px-6 py-32 max-w-6xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <h2 className="text-3xl font-black text-white tracking-tight">Browse by Value</h2>
            <p className="text-white/40 font-medium mt-1">Select an investment tier to explore verified inventory.</p>
          </div>
          <div className="hidden md:block h-px flex-1 mx-12 bg-white/10" />
          <div className="text-right">
             <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Inventory Split</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-px bg-white/5 border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
          {PRICE_RANGES.map((r, i) => (
            <Link key={r.label} href={`/cars?minPrice=${r.min}&maxPrice=${r.max}`} 
              className="group bg-[#0a0a0a] hover:bg-[#111111] p-10 flex flex-col items-center text-center transition-all duration-300">
              <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white/30 group-hover:text-orange-500 group-hover:border-orange-500/30 group-hover:shadow-[0_0_20px_rgba(234,88,12,0.2)] transition-all mb-8">
                {r.icon}
              </div>
              <p className="text-xl font-black text-white mb-1 group-hover:text-orange-500 transition-colors">{r.label}</p>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-8">{r.sub}</p>
              
              <div className="mt-auto pt-6 border-t border-white/5 w-full flex items-center justify-center gap-2">
                <span className="text-[11px] font-black text-white">{priceCounts[i]}</span>
                <span className="text-[10px] font-bold text-white/30 uppercase tracking-tighter">Active Units</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── WELCOME BACK / RECOMMENDATIONS ── */}
      <ClientRecentSection />

      {/* ── AUTO NEWS & INSIGHTS ── */}
      <section className="container mx-auto px-6 py-32 max-w-6xl border-t border-white/5">
        <div className="flex items-center justify-between mb-16">
          <div className="flex items-center gap-4">
            <Newspaper className="w-6 h-6 text-white" />
            <h2 className="text-3xl font-black text-white tracking-tight">Market Intelligence</h2>
          </div>
          <Link href="/news" className="text-xs font-black uppercase tracking-widest text-orange-600 border-b-2 border-orange-600 pb-1">
            All Stories
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {[
            {
              title: "KRA Announces Revised Duty Rates for 2026 Vehicle Imports",
              tag: "Policy",
              date: "24 Mar 2026",
              img: "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&q=80"
            },
            {
              title: "The Rise of Electric Vehicles: Kenya's Growing Charging Infrastructure",
              tag: "Trends",
              date: "22 Mar 2026",
              img: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800&q=80"
            },
            {
              title: "Port of Mombasa: Record 5,000 Units Landed This Week",
              tag: "Logistics",
              date: "20 Mar 2026",
              img: "https://images.unsplash.com/photo-1493946740624-75b8787c3299?w=800&q=80"
            }
          ].map((news, i) => (
            <Link key={i} href="#" className="group block">
              <div className="aspect-[16/10] overflow-hidden rounded-2xl bg-[#0a0a0a] border border-white/5 mb-6 relative">
                <Image 
                  src={news.img} 
                  alt={news.title} 
                  fill 
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" 
                />
              </div>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[10px] font-black text-white uppercase tracking-widest">{news.tag}</span>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <span className="text-[10px] font-bold text-white/40 uppercase">{news.date}</span>
              </div>
              <h3 className="text-lg font-bold text-white leading-snug group-hover:text-orange-500 transition-colors">{news.title}</h3>
            </Link>
          ))}
        </div>
      </section>

      {/* ── FEATURED CARS ── */}
      {featured.length > 0 && (
        <section className="container mx-auto px-6 py-32 max-w-6xl bg-[#0a0a0a] rounded-[3rem] border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-600/10 blur-[100px] rounded-full pointer-events-none" />
          <div className="flex items-end justify-between mb-16 px-6 relative z-10">
            <div>
              <h2 className="text-3xl font-black text-white tracking-tight">The Selection</h2>
              <p className="text-white/40 font-medium mt-1">Hand-picked premium inventory.</p>
            </div>
            <Link href="/cars" className="text-xs font-black uppercase tracking-widest text-white/30 hover:text-white transition-colors">
              Explore Collection
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 px-6 relative z-10">
            {featured.map(car => <CarCard key={car.id} car={car} />)}
          </div>
        </section>
      )}

      {/* ── NEW ARRIVALS ── */}
      {newArrivals.length > 0 && (
        <section className="container mx-auto px-6 py-32 max-w-6xl">
          <div className="flex items-end justify-between mb-16">
            <h2 className="text-3xl font-black text-white tracking-tight">Just Landed</h2>
            <div className="h-px flex-1 mx-12 bg-white/10" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {newArrivals.map(car => <CarCard key={car.id} car={car} />)}
          </div>
        </section>
      )}

      {/* ── STATS BAR ── */}
      <div className="container mx-auto px-6 py-32">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/5 border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
          {[
            { v: `${totalCars}+`, l: "Active Units", i: <Car className="w-5 h-5" /> },
            { v: totalDealers, l: "Verified Hubs", i: <ShieldCheck className="w-5 h-5" /> },
            { v: "Live", l: "Comparison", i: <Flame className="w-5 h-5" /> },
            { v: "24/7", l: "Dealer Access", i: <Clock className="w-5 h-5" /> },
          ].map((s, idx) => (
            <div key={idx} className="p-12 text-center bg-[#0a0a0a] group">
              <div className="flex justify-center mb-6 text-white/20 group-hover:text-orange-500 group-hover:drop-shadow-[0_0_15px_rgba(234,88,12,0.5)] transition-all">
                {s.i}
              </div>
              <p className="text-4xl font-black text-white mb-2">{s.v}</p>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">{s.l}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CarCard({ car }) {
  const img = car.images[0]?.url;
  const title = `${car.make} ${car.model}${car.variant ? ` ${car.variant}` : ""}`;
  
  return (
    <Link href={`/cars/${car.id}`} className="group block bg-surface border border-white/5 hover:border-orange-500/30 overflow-hidden transition-all duration-300">
      {/* Landscape thumbnail — sharp corners */}
      <div className="relative aspect-[16/10] bg-white/5 overflow-hidden">
        {img ? (
          <Image 
            src={img} 
            alt={title} 
            fill 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/20 text-[10px] font-bold uppercase tracking-widest">No Image</div>
        )}
        {/* Badges */}
        {car.badges?.length > 0 && (
          <div className="absolute bottom-3 left-3 flex flex-wrap gap-1">
            {car.badges.map((b) => (
              <span key={b} className={`text-[9px] font-bold px-2 py-0.5 border ${BADGE_OPTIONS[b]?.color || "bg-white/10 text-white/60 border-white/10"}`}>
                {b}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col gap-2.5">
        {/* Year label + Car name */}
        <div className="flex items-center gap-2.5">
          <span className="text-[10px] font-black bg-white/10 text-orange-400 px-2 py-0.5 uppercase tracking-wider shrink-0">
            {car.year}
          </span>
          <h3 className="font-bold text-white text-sm leading-tight truncate group-hover:text-orange-500 transition-colors">
            {title}
          </h3>
        </div>

        {/* Spec tags */}
        <div className="flex flex-wrap gap-1.5">
          {[
            car.mileage ? `${Math.round(car.mileage / 1000)}k km` : null,
            car.fuelType?.split(' ')[0],
            car.transmission === "AUTOMATIC" ? "Auto" : car.transmission,
            car.drivetrain,
          ].filter(Boolean).map((s) => (
            <span key={s} className="text-[10px] font-semibold text-white/50 bg-white/5 border border-white/5 px-2 py-0.5">
              {s}
            </span>
          ))}
        </div>

        {/* Price + View Offer */}
        <div className="flex items-center justify-between pt-2.5 border-t border-white/5 mt-auto">
          <p className="text-base font-black text-orange-500">{formatPrice(car.price)}</p>
          <span className="text-[10px] font-black uppercase tracking-widest text-white/30 group-hover:text-orange-500 transition-colors flex items-center gap-1">
            View Offer <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}
