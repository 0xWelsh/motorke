// src/app/cars/page.js
import { db } from "@/lib/db";
import { formatPrice, formatMileage, BODY_TYPE_LABELS, FUEL_LABELS, BADGE_OPTIONS } from "@/lib/utils";
import Link from "next/link";
import { 
  MapPin, 
  Filter, 
  ChevronRight, 
  X, 
  ArrowUpDown,
  ShieldCheck,
  Search
} from "lucide-react";
import Image from "next/image";
import CarsSearch from "@/components/CarsSearch";
import { unstable_cache } from "next/cache";
import { CompareButton } from "@/components/CompareSelector";


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
  const sp           = await searchParams;
  const page         = parseInt(sp.page  || "1");
  const limit        = 12;
  const search       = sp.search       || "";
  const make         = sp.make         || "";
  const bodyType     = sp.bodyType     || "";
  const fuelType     = sp.fuelType     || "";
  const transmission = sp.transmission || "";
  const county       = sp.county       || "";
  const minPrice     = sp.minPrice ? parseInt(sp.minPrice) : undefined;
  const maxPrice     = sp.maxPrice ? parseInt(sp.maxPrice) : undefined;
  const sort         = sp.sort || "newest"; // newest, price_asc, price_desc, mileage_asc, year_desc
  
  const userLat  = sp.lat  ? parseFloat(sp.lat)  : null;
  const userLng  = sp.lng  ? parseFloat(sp.lng)  : null;

  const where = {
    available: true,
    ...(make         && { make: { equals: make, mode: "insensitive" } }),
    ...(bodyType     && { bodyType }),
    ...(fuelType     && { fuelType }),
    ...(transmission && { transmission }),
    ...(minPrice || maxPrice ? { price: { ...(minPrice && { gte: minPrice }), ...(maxPrice && { lte: maxPrice }) } } : {}),
    ...(county       && { dealer: { county: { equals: county, mode: "insensitive" } } }),
    ...(search       && { OR: [
      { make:    { contains: search, mode: "insensitive" } },
      { model:   { contains: search, mode: "insensitive" } },
      { variant: { contains: search, mode: "insensitive" } },
    ]}),
  };

  const orderBy = [];
  if (sort === "price_asc")    orderBy.push({ price: "asc" });
  else if (sort === "price_desc")   orderBy.push({ price: "desc" });
  else if (sort === "mileage_asc") orderBy.push({ mileage: "asc" });
  else if (sort === "year_desc")    orderBy.push({ year: "desc" });
  else {
    // Default: Featured first, then newest
    orderBy.push({ featured: "desc" });
    orderBy.push({ createdAt: "desc" });
  }

  const getAllMakes = unstable_cache(
    async () => {
      return db.car.findMany({ 
        where: { available: true }, 
        distinct: ["make"], 
        select: { make: true }, 
        orderBy: { make: "asc" } 
      });
    },
    ["all-makes"],
    { revalidate: 3600, tags: ["makes"] }
  );
  
  const getCars = unstable_cache(
    async (where, orderBy, page, limit) => {
      const [cars, total] = await Promise.all([
        db.car.findMany({
          where,
          include: {
            images:  { where: { isPrimary: true }, take: 1 },
            dealer:  { select: { id: true, name: true, slug: true, location: true, verified: true, lat: true, lng: true, county: true } },
          },
          orderBy: orderBy,
          skip:  (page - 1) * limit,
          take:  limit,
        }),
        db.car.count({ where }),
      ]);
      return { cars, total };
    },
    ["cars-list", JSON.stringify(where), JSON.stringify(orderBy), page.toString()],
    { revalidate: 300, tags: ["cars"] }
  );
  
  const [{ cars, total }, allMakes] = await Promise.all([
    getCars(where, orderBy, page, limit),
    getAllMakes(),
  ]);

  const sortedCars = userLat && userLng && !sort.includes("price") // Don't override price/mileage sort with distance
    ? [...cars].sort((a, b) => {
        const da = distance(userLat, userLng, a.dealer?.lat, a.dealer?.lng);
        const db2 = distance(userLat, userLng, b.dealer?.lat, b.dealer?.lng);
        return da - db2;
      })
    : cars;

  const totalPages = Math.ceil(total / limit);
  const hasFilters = search || make || bodyType || fuelType || transmission || county || minPrice || maxPrice;

  // Build pagination links with all current filters
  const getPageLink = (p) => {
    const params = new URLSearchParams(sp);
    params.set("page", p);
    return `/cars?${params.toString()}`;
  };

  return (
    <div className="bg-[#FCFCFD] min-h-screen pb-32">
      {/* ── BREADCRUMBS & CONTEXT ── */}
      <div className="container mx-auto px-6 pt-12 max-w-7xl">
        <div className="flex items-center gap-3 mb-10 overflow-x-auto pb-2 no-scrollbar">
           <Link href="/" className="text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-slate-900 transition-colors whitespace-nowrap">Home</Link>
           <ChevronRight size={10} className="text-slate-200 shrink-0" />
           <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 whitespace-nowrap">Inventory</span>
           {make && (
             <>
               <ChevronRight size={10} className="text-slate-200 shrink-0" />
               <span className="text-[10px] font-black uppercase tracking-widest text-[var(--brand)] whitespace-nowrap">{make}</span>
             </>
           )}
        </div>
      </div>

      <div className="container mx-auto px-6 max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-16">
          
          {/* ── SIDEBAR FILTERS (Left) ── */}
          <aside className="w-full lg:w-72 shrink-0">
            <div className="lg:sticky lg:top-24">
              <CarsSearch
                initialSearch={search}
                initialMake={make}
                initialBodyType={bodyType}
                initialFuelType={fuelType}
                initialTransmission={transmission}
                initialCounty={county}
                initialMinPrice={minPrice}
                initialMaxPrice={maxPrice}
                initialSort={sort}
                allMakes={allMakes}
                bodyTypeLabels={BODY_TYPE_LABELS}
                counties={COUNTIES}
              />
              
              {/* Sidebar Promotions / Info */}
              <div className="mt-12 p-8 bg-slate-900 rounded-[2.5rem] relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700" />
                 <h4 className="text-white text-lg font-black leading-tight mb-3">Direct Import Services</h4>
                 <p className="text-slate-400 text-[10px] font-bold leading-relaxed mb-6">Can't find what you're looking for? Let our professionals handle the sourcing and shipping from Japan or UK.</p>
                 <Link href="/import" className="text-[10px] font-black uppercase tracking-widest text-white flex items-center gap-2 hover:gap-4 transition-all">
                   Explore Direct Import <ChevronRight size={12} />
                 </Link>
              </div>
            </div>
          </aside>

          {/* ── MAIN CONTENT (Right) ── */}
          <main className="flex-1">
            {/* Header Content */}
            <div className="mb-16">
               <div className="flex items-center justify-between mb-6">
                  <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-none">
                    {make || "All Inventory"}
                  </h1>
                  <p className="text-xs font-black text-slate-300 uppercase tracking-widest">{total} Unique Units</p>
               </div>
               
               {/* Quick Sort Toggles / Results Summary */}
               <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-slate-100">
                  <div className="flex items-center gap-6">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Showing Results of Automobiles:</span>
                    <div className="flex items-center gap-1.5 p-1 bg-slate-50 rounded-xl border border-slate-100">
                       <button className="px-4 py-1.5 bg-white text-[9px] font-black uppercase tracking-widest rounded-lg shadow-sm">Available In Kenya</button>
                       <button className="px-4 py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 opacity-50 cursor-not-allowed">Direct Import</button>
                    </div>
                  </div>
               </div>
            </div>

            {/* Grid implementation */}
            {sortedCars.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-slate-100 rounded-[3rem] py-40 text-center shadow-sm">
                <Search className="mx-auto text-slate-100 mb-6" size={60} />
                <h2 className="text-2xl font-black text-slate-900 mb-2">No matches found.</h2>
                <p className="text-slate-400 font-bold max-w-xs mx-auto mb-10 leading-relaxed">We couldn't find any vehicles matching your current selection. Try broadening your criteria.</p>
                <Link href="/cars" className="bg-slate-900 text-white px-10 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-transform active:scale-95 shadow-xl shadow-slate-950/10">
                  Reset Inventory
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-10">
                {sortedCars.map((car, idx) => (
                  <InventoryCard key={car.id} car={car} userLat={userLat} userLng={userLng} priority={idx < 4} />
                ))}
              </div>
            )}

            {/* Pagination Implementation */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-3 mt-24 pt-12 border-t border-slate-50">
                {page > 1 && (
                  <Link href={getPageLink(page - 1)} className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white border border-slate-100 text-slate-400 hover:text-slate-900 transition-all hover:shadow-lg">
                    <ChevronRight className="w-5 h-5 rotate-180" />
                  </Link>
                )}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                  if (p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1)) {
                    return (
                      <Link key={p} href={getPageLink(p)}
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center text-[11px] font-black transition-all ${
                          p === page ? "bg-slate-900 text-white shadow-xl shadow-slate-900/20" : "bg-white border border-slate-100 text-slate-400 hover:bg-slate-50 shadow-sm"
                        }`}
                      >
                        {p.toString().padStart(2, '0')}
                      </Link>
                    );
                  }
                  if (p === 2 && page > 3) return <span key="e1" className="text-slate-200 px-2 font-black">...</span>;
                  if (p === totalPages - 1 && page < totalPages - 2) return <span key="e2" className="text-slate-200 px-2 font-black">...</span>;
                  return null;
                })}
                {page < totalPages && (
                  <Link href={getPageLink(page + 1)} className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white border border-slate-100 text-slate-400 hover:text-slate-900 transition-all hover:shadow-lg">
                    <ChevronRight className="w-5 h-5" />
                  </Link>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

/**
 * Premium minimalist vehicle card inspired by high-end marketplace aesthetics.
 */
function InventoryCard({ car, userLat, userLng, priority = false }) {
  const img   = car.images[0]?.url;
  const title = `${car.make} ${car.model}`;
  const dist  = userLat && car.dealer?.lat ? Math.round(distance(userLat, userLng, car.dealer.lat, car.dealer.lng)) : null;

  return (
    <Link href={`/cars/${car.id}`} className="group block bg-white border border-slate-50 hover:border-slate-200 rounded-[3rem] overflow-hidden transition-all duration-700 hover:shadow-2xl hover:shadow-slate-900/5">
      {/* High-Impact Thumbnail */}
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-50 border-b border-slate-50/50">
        {img ? (
          <Image 
            src={img} 
            alt={title} 
            fill 
            priority={priority}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2000ms] ease-out" 
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-slate-200 uppercase tracking-widest">Awaiting Capture</div>
        )}
        
        {/* Available Badge - Minimalist */}
        <div className="absolute top-6 right-6">
           <span className="px-3.5 py-2 bg-emerald-500 text-white text-[8px] font-black uppercase tracking-[0.2em] rounded-xl shadow-lg shadow-emerald-500/20">
             Available
           </span>
        </div>

        {/* Distance context */}
        {dist !== null && (
          <div className="absolute bottom-6 left-6">
             <div className="flex items-center gap-2 px-3 py-1.5 bg-white/95 backdrop-blur-md rounded-lg border border-white/20 shadow-sm">
                <MapPin size={10} className="text-[var(--brand)]" />
                <span className="text-[9px] font-black text-slate-900 uppercase tracking-tighter">{dist} km</span>
             </div>
          </div>
        )}
      </div>

      {/* Elegant Content Block */}
      <div className="p-10 flex flex-col items-start gap-5">
        <div className="flex flex-col gap-2 w-full">
           <div className="flex items-center gap-3">
              <span className="text-[11px] font-black text-slate-300 uppercase tracking-widest">{car.year}</span>
              <div className="w-1 h-1 rounded-full bg-slate-200" />
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1.5">
                {car.dealer?.verified && <ShieldCheck size={12} />}
                Verified Dealer
              </span>
           </div>
           <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-tight group-hover:text-[var(--brand)] transition-colors line-clamp-1">
             {title}
           </h3>
           {car.variant && (
             <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{car.variant}</p>
           )}
        </div>

        {/* Spec Row - Horizontal Minimalist Scroll */}
        <div className="flex flex-wrap gap-2 pt-2">
          {[
            car.fuelType && FUEL_LABELS[car.fuelType],
            car.transmission,
            car.engineCC && `${car.engineCC} CC`,
            BODY_TYPE_LABELS[car.bodyType]
          ].filter(Boolean).map((spec) => (
            <span key={spec} className="px-4 py-2 bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-widest rounded-xl border border-slate-100/50">
              {spec}
            </span>
          ))}
        </div>

        {/* Dynamic Price - Centered focus */}
        <div className="mt-8 pt-8 border-t border-slate-50 w-full flex items-center justify-between">
           <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Pricing Guide</span>
              <p className="text-2xl font-black text-slate-900 leading-none">
                <span className="text-sm font-bold text-slate-400 mr-2">KES</span>
                {formatPrice(car.price, true)}
              </p>
           </div>
           <div className="flex items-center gap-3">
              <CompareButton car={car} />
              <button className="w-12 h-12 rounded-[1.25rem] bg-slate-50 group-hover:bg-slate-900 text-slate-300 group-hover:text-white flex items-center justify-center transition-all duration-500 border border-slate-100">
                 <ChevronRight size={20} />
              </button>
           </div>
        </div>
      </div>
    </Link>
  );
}
