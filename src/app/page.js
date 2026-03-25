// src/app/page.js
import { db } from "@/lib/db";
import { formatPrice, formatMileage } from "@/lib/utils";
import Link from "next/link";
import LocationSearch from "@/components/LocationSearch";
import { 
  ChevronRight, 
  CheckCircle2, 
  ShieldCheck, 
  MessageSquare, 
  Calculator, 
  Search, 
  ArrowRight,
  Star,
  Fuel,
  Settings,
  Gauge,
  MapPin,
  TrendingUp
} from "lucide-react";

async function getData() {
  try {
    const week = new Date(); week.setDate(week.getDate() - 7);
    const [featured, newArrivals, dealers, totalCars, totalDealers] = await Promise.all([
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
    ]);
    return { featured, newArrivals, dealers, totalCars, totalDealers };
  } catch {
    return { featured: [], newArrivals: [], dealers: [], totalCars: 0, totalDealers: 0 };
  }
}

const BODY_TYPES = [
  { type: "SUV",       label: "SUVs",       img: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Paris_Motor_Show_2018%2C_Paris_%281Y7A2057%29.jpg/640px-Paris_Motor_Show_2018%2C_Paris_%281Y7A2057%29.jpg" },
  { type: "PICKUP",    label: "Pickups",    img: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Toyota_Hilux_2.4_Xtra_cab_4_WD_-_Flickr_-_Joost_J._Bakker_IJmuiden.jpg/640px-Toyota_Hilux_2.4_Xtra_cab_4_WD_-_Flickr_-_Joost_J._Bakker_IJmuiden.jpg" },
  { type: "SEDAN",     label: "Sedans",     img: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Toyota_Corolla_E180_sedan_2_China_2016-04-01.jpg/640px-Toyota_Corolla_E180_sedan_2_China_2016-04-01.jpg" },
  { type: "HATCHBACK", label: "Hatchbacks", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Infiniti_Q30_rear.jpg/640px-Infiniti_Q30_rear.jpg" },
  { type: "WAGON",     label: "Wagons",     img: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Lancia_Kappa_Station_Wagon_1Y7A6135.jpg/640px-Lancia_Kappa_Station_Wagon_1Y7A6135.jpg" },
];

const PRICE_RANGES = [
  { label: "Under 1M",  min: 0,       max: 1000000,  sub: "Entry level"   },
  { label: "1M – 2M",   min: 1000000, max: 2000000,  sub: "Most popular"  },
  { label: "2M – 4M",   min: 2000000, max: 4000000,  sub: "Mid range"     },
  { label: "4M – 7M",   min: 4000000, max: 7000000,  sub: "Premium"       },
  { label: "Above 7M",  min: 7000000, max: 99000000, sub: "Luxury"        },
];

const COUNTIES = [
  { name: "Nairobi",     img: "https://images.unsplash.com/photo-1581467655410-0c2bf55d9d6c?w=600&q=80" },
  { name: "Mombasa",     img: "https://images.unsplash.com/photo-1590159068301-443b772c7304?w=600&q=80" },
  { name: "Nakuru",      img: "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=600&q=80" },
  { name: "Kisumu",      img: "https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?w=600&q=80" },
];

const TRENDING = ["Toyota Hilux", "Toyota Prado", "Subaru Forester", "Mazda CX-5"];

export default async function HomePage() {
  const { featured, newArrivals, dealers, totalCars, totalDealers } = await getData();

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* ── HERO ── */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden">
        {/* Cinematic Background */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1920&q=85" 
            className="w-full h-full object-cover brightness-[0.2]" 
            alt="Hero Background"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-black via-black/60 to-transparent" />
        </div>

        <div className="container mx-auto px-6 relative z-10 max-w-6xl">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 backdrop-blur-md rounded-full px-4 py-2 text-xs font-bold text-amber-500 mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {totalCars.toLocaleString()} CARS LISTED · {totalDealers} TRUSTED DEALERSHIPS
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-[1.1] tracking-tight mb-6 animate-in fade-in slide-in-from-left-6 duration-1000">
            Find your perfect car. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">
              Compare every dealer.
            </span>
          </h1>
          
          <p className="text-lg text-slate-400 max-w-xl mb-10 leading-relaxed">
            Kenya&apos;s most sophisticated marketplace to compare cars across multiple 
            dealerships instantly. Search smarter, buy better.
          </p>

          <div className="max-w-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-2 rounded-2xl shadow-2xl mb-8">
            <LocationSearch />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <TrendingUp className="w-3 h-3 text-amber-500" /> Trending:
            </span>
            {TRENDING.map(t => (
              <Link key={t} href={`/cars?search=${encodeURIComponent(t)}`} 
                className="bg-white/5 hover:bg-amber-500 hover:text-black border border-white/10 px-4 py-1.5 rounded-full text-xs font-semibold text-slate-300 transition-all duration-300">
                {t}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <div className="container mx-auto px-6 -mt-16 relative z-20">
        <div className="grid grid-cols-2 md:grid-cols-4 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden divide-x divide-white/5">
          {[
            { v: `${totalCars}+`, l: "Listings", i: <Search className="w-5 h-5" /> },
            { v: totalDealers, l: "Verified Dealers", i: <ShieldCheck className="w-5 h-5" /> },
            { v: "47", l: "Counties", i: <MapPin className="w-5 h-5" /> },
            { v: "Free", l: "For Buyers", i: <CheckCircle2 className="w-5 h-5" /> },
          ].map((s, idx) => (
            <div key={idx} className="p-8 text-center hover:bg-white/5 transition-colors group">
              <div className="flex justify-center mb-3 text-amber-500 group-hover:scale-110 transition-transform">
                {s.i}
              </div>
              <p className="text-3xl font-black text-white mb-1">{s.v}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── BROWSE BY BODY TYPE ── */}
      <section className="container mx-auto px-6 pt-24 max-w-6xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-2 block">Curation</span>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Browse by Category</h2>
          </div>
          <Link href="/cars" className="group flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-amber-600 transition-colors">
            View all types <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {BODY_TYPES.map((b) => (
            <Link key={b.type} href={`/cars?bodyType=${b.type}`} 
              className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-white border border-slate-200 hover:border-amber-500 transition-all duration-300">
              <img src={b.img} alt={b.label} className="absolute inset-0 w-full h-full object-cover brightness-[0.8] group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <p className="text-lg font-black text-white">{b.label}</p>
                <div className="h-0.5 w-0 group-hover:w-full bg-amber-500 transition-all duration-300 mt-2" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── BUDGET ── */}
      <section className="container mx-auto px-6 pt-24 max-w-6xl">
        <div className="bg-slate-900 rounded-[2rem] p-10 md:p-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-[100px] rounded-full" />
          
          <div className="relative z-10 mb-12">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-2 block">Budgeting</span>
            <h2 className="text-3xl font-black text-white tracking-tight">Shop by Price Range</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 relative z-10">
            {PRICE_RANGES.map((r) => (
              <Link key={r.label} href={`/cars?minPrice=${r.min}&maxPrice=${r.max}`} 
                className="bg-white/5 border border-white/10 hover:border-amber-500 hover:bg-amber-500 group p-6 rounded-2xl transition-all duration-300">
                <p className="text-lg font-black text-white group-hover:text-black mb-1">{r.label}</p>
                <p className="text-xs font-bold text-slate-500 group-hover:text-black/60 uppercase">{r.sub}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED CARS ── */}
      {featured.length > 0 && (
        <section className="container mx-auto px-6 pt-24 max-w-6xl">
          <div className="flex items-end justify-between mb-12">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-2 block">Premium Listings</span>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Featured Collection</h2>
            </div>
            <Link href="/cars" className="group flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-amber-600">
              Explore More <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featured.map(car => <CarCard key={car.id} car={car} badge="Featured" isFeatured />)}
          </div>
        </section>
      )}

      {/* ── NEW ARRIVALS ── */}
      {newArrivals.length > 0 && (
        <section className="container mx-auto px-6 pt-24 max-w-6xl">
          <div className="flex items-end justify-between mb-12">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-2 block">Just Added</span>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">New Arrivals</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {newArrivals.map(car => <CarCard key={car.id} car={car} />)}
          </div>
        </section>
      )}

      {/* ── HOW IT WORKS ── */}
      <section className="bg-slate-900 mt-32 py-32 overflow-hidden relative">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-amber-500/5 blur-[120px] rounded-full" />
        <div className="container mx-auto px-6 max-w-6xl relative z-10">
          <div className="text-center mb-20">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-4 block">The Experience</span>
            <h2 className="text-4xl font-black text-white tracking-tight">How Motorke Works</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            {[
              { i: <Search />, t: "Search & Filter", d: "Scan thousands of listings from across Kenya in one place. Filter by mileage, price, or dealer reputation.", n: "01" },
              { i: <Settings />, t: "Compare Specs", d: "Use our intelligent comparison engine to see technical specs and features side-by-side.", n: "02" },
              { i: <MessageSquare />, t: "Contact Directly", d: "Instantly chat via WhatsApp or call verified dealers. No middlemen, no hidden fees.", n: "03" },
            ].map((step, idx) => (
              <div key={idx} className="relative group text-center">
                <div className="text-8xl font-black text-white/5 absolute -top-10 left-1/2 -translate-x-1/2 group-hover:text-amber-500/10 transition-colors">
                  {step.n}
                </div>
                <div className="w-16 h-16 bg-amber-500 text-black rounded-2xl flex items-center justify-center mx-auto mb-8 rotate-3 group-hover:rotate-0 transition-transform">
                  {step.i}
                </div>
                <h3 className="text-xl font-black text-white mb-4">{step.t}</h3>
                <p className="text-slate-500 leading-relaxed text-sm px-4">{step.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TOP DEALERSHIPS ── */}
      {dealers.length > 0 && (
        <section className="container mx-auto px-6 pt-32 max-w-6xl">
          <div className="flex items-end justify-between mb-12">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-2 block">Partners</span>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Verified Dealerships</h2>
            </div>
            <Link href="/dealers" className="group flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-amber-600">
              Browse all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {dealers.map(d => (
              <Link key={d.id} href={`/dealers/${d.slug}`} 
                className="bg-white border border-slate-200 p-8 rounded-[2rem] hover:border-amber-500 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group">
                <div className="w-16 h-16 bg-slate-900 text-amber-500 rounded-2xl flex items-center justify-center text-2xl font-black mb-6 group-hover:scale-110 transition-transform">
                  {d.name[0]}
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-black text-slate-900 line-clamp-1">{d.name}</h3>
                  {d.verified && <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />}
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">{d.location}</p>
                <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                  <span className="text-xs font-black text-amber-600">{d._count.cars} CARS</span>
                  <span className="text-[10px] font-black text-slate-300 uppercase">View Portal</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── TESTIMONIALS ── */}
      <section className="container mx-auto px-6 pt-32 pb-12 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { n: "James M.", c: "Nairobi", t: "Compared 3 dealers and saved KSh 200k. The comparison engine is a game changer.", v: "PO" },
            { n: "Aisha K.", c: "Mombasa", t: "Direct WhatsApp contact with verified dealers made it stress-free. Highly recommended.", v: "AK" },
            { n: "Peter O.", c: "Nakuru", t: "The duty calculator helped me budget for my import precisely. No surprises!", v: "JM" },
          ].map((test, i) => (
            <div key={i} className="bg-white border border-slate-200 p-10 rounded-[2rem] shadow-sm">
              <div className="flex gap-1 mb-6">
                {[1,2,3,4,5].map(s => <Star key={s} className="w-3 h-3 fill-amber-500 text-amber-500" />)}
              </div>
              <p className="text-slate-600 leading-relaxed italic mb-8 italic">“{test.t}”</p>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-400">
                  {test.v}
                </div>
                <div>
                  <p className="font-black text-sm text-slate-900">{test.n}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">{test.c}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── DEALER CTA ── */}
      <section className="container mx-auto px-6 pt-32">
        <div className="bg-slate-900 rounded-[3rem] p-12 md:p-24 text-center relative overflow-hidden">
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-amber-500/10 blur-[150px] rounded-full" />
          <div className="relative z-10 max-w-2xl mx-auto">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-6 block">Business</span>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-8 tracking-tight leading-tight">Sell faster on Kenya&apos;s premium platform.</h2>
            <p className="text-slate-400 mb-12 text-lg leading-relaxed">
              Reach verified buyers, manage your listings with ease, and grow your dealership footprint.
            </p>
            <div className="flex flex-col md:flex-row items-center justify-center gap-6">
              <Link href="/signup" className="w-full md:w-auto bg-amber-500 hover:bg-amber-400 text-black font-black px-12 py-5 rounded-2xl transition-all hover:scale-105">
                Join as Dealer
              </Link>
              <Link href="/login" className="text-white font-bold hover:text-amber-500 flex items-center gap-2">
                Already a member? Sign in <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function CarCard({ car, badge, isFeatured }) {
  const img = car.images[0]?.url;
  const title = `${car.year} ${car.make} ${car.model}`;
  
  return (
    <Link href={`/cars/${car.id}`} className="group block bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-2xl hover:border-amber-500 transition-all duration-300">
      <div className="relative aspect-[3/2] overflow-hidden bg-slate-100">
        {img ? (
          <img 
            src={img} 
            alt={title} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-300 italic text-xs uppercase font-black">
            No Photo Available
          </div>
        )}
        
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <span className="bg-black/80 backdrop-blur-md text-white text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-wider">
            {car.year}
          </span>
          {badge && (
            <span className="bg-amber-500 text-black text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-wider shadow-lg">
              {badge}
            </span>
          )}
        </div>

        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur shadow-xl px-3 py-1 rounded-lg">
           <p className="text-lg font-black text-slate-900">{formatPrice(car.price)}</p>
        </div>
      </div>

      <div className="p-6">
        <h3 className="font-black text-slate-900 group-hover:text-amber-600 transition-colors mb-1 truncate">{title}</h3>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">{car.variant || "Standard Edition"}</p>

        <div className="grid grid-cols-3 gap-2 py-4 border-y border-slate-50 mb-6">
          <div className="text-center">
            <Gauge className="w-3 h-3 text-slate-300 mx-auto mb-1" />
            <p className="text-[10px] font-black text-slate-900">{car.mileage ? Math.round(car.mileage/1000) + 'k' : '—'}</p>
          </div>
          <div className="text-center border-x border-slate-100 px-2">
            <Settings className="w-3 h-3 text-slate-300 mx-auto mb-1" />
            <p className="text-[10px] font-black text-slate-900 uppercase">{car.transmission?.charAt(0)}</p>
          </div>
          <div className="text-center">
            <Fuel className="w-3 h-3 text-slate-300 mx-auto mb-1" />
            <p className="text-[10px] font-black text-slate-900 uppercase truncate px-1">{car.fuelType?.split(' ')[0]}</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-full bg-slate-900 text-amber-500 flex items-center justify-center text-[10px] font-black">
              {car.dealer?.name?.[0]}
            </div>
            <p className="text-[10px] font-bold text-slate-500 truncate">{car.dealer?.name}</p>
          </div>
          <span className="text-[10px] font-black text-amber-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            VIEW <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}