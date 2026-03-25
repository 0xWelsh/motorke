// src/app/cars/page.js
import { db } from "@/lib/db";
import { formatPrice, formatMileage, BODY_TYPE_LABELS, FUEL_LABELS } from "@/lib/utils";
import Link from "next/link";
import { 
  Search, 
  MapPin, 
  Filter, 
  ChevronRight, 
  X, 
  ArrowUpDown,
  ShieldCheck,
  Zap,
  Fuel,
  Settings2
} from "lucide-react";

export const metadata = { title: "Inventory — Motorke Standard" };

function distance(lat1, lng1, lat2, lng2) {
  if (!lat1 || !lat2) return 9999;
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

const COUNTIES = ["Nairobi","Mombasa","Nakuru","Kisumu","Uasin Gishu","Kiambu","Machakos","Meru"];

export default async function CarsPage({ searchParams }) {
  const sp       = await searchParams;
  const page     = parseInt(sp.page  || "1");
  const limit    = 12;
  const search   = sp.search   || "";
  const make     = sp.make     || "";
  const bodyType = sp.bodyType || "";
  const fuelType = sp.fuelType || "";
  const county   = sp.county   || "";
  const minPrice = sp.minPrice ? parseInt(sp.minPrice) : undefined;
  const maxPrice = sp.maxPrice ? parseInt(sp.maxPrice) : undefined;
  const userLat  = sp.lat  ? parseFloat(sp.lat)  : null;
  const userLng  = sp.lng  ? parseFloat(sp.lng)  : null;

  const where = {
    available: true,
    ...(make     && { make: { equals: make, mode: "insensitive" } }),
    ...(bodyType && { bodyType }),
    ...(fuelType && { fuelType }),
    ...(minPrice || maxPrice ? { price: { ...(minPrice && { gte: minPrice }), ...(maxPrice && { lte: maxPrice }) } } : {}),
    ...(county   && { dealer: { county: { equals: county, mode: "insensitive" } } }),
    ...(search   && { OR: [
      { make:    { contains: search, mode: "insensitive" } },
      { model:   { contains: search, mode: "insensitive" } },
      { variant: { contains: search, mode: "insensitive" } },
    ]}),
  };

  const [cars, total, allMakes] = await Promise.all([
    db.car.findMany({
      where,
      include: {
        images:  { where: { isPrimary: true }, take: 1 },
        dealer:  { select: { id: true, name: true, slug: true, location: true, verified: true, lat: true, lng: true, county: true } },
      },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      skip:  (page - 1) * limit,
      take:  limit,
    }),
    db.car.count({ where }),
    // Always fetch all distinct makes alphabetically, regardless of other filters
    db.car.findMany({ 
      where: { available: true }, 
      distinct: ["make"], 
      select: { make: true }, 
      orderBy: { make: "asc" } 
    }),
  ]);

  const sortedCars = userLat && userLng
    ? [...cars].sort((a, b) => {
        const da = distance(userLat, userLng, a.dealer?.lat, a.dealer?.lng);
        const db2 = distance(userLat, userLng, b.dealer?.lat, b.dealer?.lng);
        return da - db2;
      })
    : cars;

  const pages = Math.ceil(total / limit);
  const hasFilters = search || make || bodyType || fuelType || county || minPrice || maxPrice;

  return (
    <div className="bg-white min-h-screen">
      {/* ── MINIMAL FILTER BAR ── */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-100 py-4 shadow-sm">
        <div className="container mx-auto px-6 max-w-7xl">
          <form method="GET" className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[240px] group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
              <input 
                name="search" 
                defaultValue={search} 
                placeholder="Search inventory..." 
                className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-11 pr-4 py-2.5 text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-slate-900 transition-all"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select name="make" defaultValue={make} className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-slate-500 outline-none focus:border-slate-900 transition-all cursor-pointer">
                <option value="">All Makes</option>
                {allMakes.map(m => <option key={m.make} value={m.make}>{m.make}</option>)}
              </select>

              <select name="bodyType" defaultValue={bodyType} className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-slate-500 outline-none focus:border-slate-900 transition-all cursor-pointer">
                <option value="">All Types</option>
                {Object.entries(BODY_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>

              <select name="county" defaultValue={county} className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-slate-500 outline-none focus:border-slate-900 transition-all cursor-pointer">
                <option value="">All Counties</option>
                {COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <button type="submit" className="bg-slate-900 hover:bg-orange-600 text-white p-2.5 rounded-xl transition-all">
                <Filter className="w-4 h-4" />
              </button>

              {hasFilters && (
                <Link href="/cars" className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl transition-all">
                  <X className="w-4 h-4" />
                </Link>
              )}
            </div>
          </form>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12 max-w-7xl">
        {/* ── RESULTS HEADER ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Live Inventory</span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">
              {search ? `Results for "${search}"` : county ? `Verified in ${county}` : "All Showcases"}
            </h1>
            <p className="text-slate-500 font-medium mt-1">
              Displaying {total} premium automotive units.
            </p>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Market View</p>
              <p className="text-xs font-black text-slate-900">Nairobi Standard Time</p>
            </div>
            <button className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-600 hover:text-slate-900 transition-all">
               <ArrowUpDown className="w-3 h-3" /> Sort: Relevance
            </button>
          </div>
        </div>

        {/* ── CAR GRID ── */}
        {sortedCars.length === 0 ? (
          <div className="py-32 text-center border-2 border-dashed border-slate-100 rounded-[3rem]">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
               <Search className="w-8 h-8 text-slate-200" />
            </div>
            <h2 className="text-xl font-black text-slate-900 mb-2">No matching units found.</h2>
            <p className="text-slate-400 font-medium mb-8">Try adjusting your filters or search terms.</p>
            <Link href="/cars" className="inline-flex items-center gap-2 bg-slate-900 text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest">
              Reset Filters
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {sortedCars.map((car) => (
              <InventoryCard key={car.id} car={car} userLat={userLat} userLng={userLng} />
            ))}
          </div>
        )}

        {/* ── PAGINATION ── */}
        {pages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-24">
            {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
              <Link key={p}
                href={`/cars?page=${p}&search=${search}&make=${make}&bodyType=${bodyType}&fuelType=${fuelType}&county=${county}`}
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-[11px] font-black transition-all ${
                  p === page ? "bg-slate-900 text-white shadow-xl shadow-slate-200" : "bg-white border border-slate-100 text-slate-400 hover:border-slate-900 hover:text-slate-900"
                }`}
              >
                {p.toString().padStart(2, '0')}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function InventoryCard({ car, userLat, userLng }) {
  const img   = car.images[0]?.url;
  const title = `${car.year} ${car.make} ${car.model}`;
  const dist  = userLat && car.dealer?.lat ? Math.round(distance(userLat, userLng, car.dealer.lat, car.dealer.lng)) : null;

  return (
    <Link href={`/cars/${car.id}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-slate-50 mb-6 shadow-sm group-hover:shadow-2xl transition-all duration-700">
        {img ? (
          <img 
            src={img} 
            alt={title} 
            className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-[1.5s]" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-200 uppercase font-black text-[10px] tracking-[0.2em]">Pending Imagery</div>
        )}
        
        {/* Top Badges */}
        <div className="absolute top-5 left-5 right-5 flex justify-between items-start pointer-events-none">
          <div className="flex flex-col gap-2">
            {car.featured && (
              <span className="bg-slate-900/90 backdrop-blur-md text-white text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg border border-white/10">
                Premium
              </span>
            )}
            <span className="bg-white/90 backdrop-blur-md text-slate-900 text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg border border-slate-100">
              {car.year}
            </span>
          </div>
          {dist !== null && (
            <span className="bg-orange-600/90 backdrop-blur-md text-white text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
               {dist}km Away
            </span>
          )}
        </div>

        {/* Bottom Overlay Info */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        <div className="absolute bottom-8 left-8 right-8 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-700">
           <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1">View Full Details</p>
           <div className="h-px w-full bg-white/20" />
        </div>
      </div>

      <div className="px-2">
        <div className="flex items-start justify-between mb-3 gap-4">
          <div>
            <h3 className="font-black text-slate-900 text-lg leading-tight group-hover:text-orange-600 transition-colors truncate mb-1">{title}</h3>
            <div className="flex items-center gap-2">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{car.variant || "Standard Edition"}</p>
               {car.dealer?.verified && <ShieldCheck className="w-3 h-3 text-emerald-500" />}
            </div>
          </div>
          <p className="text-xl font-black text-slate-900 shrink-0">{formatPrice(car.price)}</p>
        </div>

        <div className="grid grid-cols-3 gap-px bg-slate-100 border border-slate-100 rounded-xl overflow-hidden mb-4">
          <div className="bg-white py-2.5 flex flex-col items-center">
             <Settings2 className="w-3 h-3 text-slate-300 mb-1" />
             <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">{car.transmission?.charAt(0)}T</span>
          </div>
          <div className="bg-white py-2.5 flex flex-col items-center">
             <Zap className="w-3 h-3 text-slate-300 mb-1" />
             <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">{car.mileage ? Math.round(car.mileage/1000) + 'k' : '—'}</span>
          </div>
          <div className="bg-white py-2.5 flex flex-col items-center">
             <Fuel className="w-3 h-3 text-slate-300 mb-1" />
             <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">{car.fuelType?.charAt(0)}L</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
           <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 uppercase">
                 {car.dealer?.name[0]}
              </div>
              <p className="text-[10px] font-black text-slate-900 uppercase tracking-tighter">{car.dealer?.name}</p>
           </div>
           <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-orange-600 group-hover:translate-x-1 transition-all" />
        </div>
      </div>
    </Link>
  );
}
