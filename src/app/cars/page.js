// src/app/cars/page.js
import { db } from "@/lib/db";
import { formatPrice, formatMileage, BODY_TYPE_LABELS, FUEL_LABELS, BADGE_OPTIONS, whatsappLink, estimateDuty } from "@/lib/utils";
import Link from "next/link";
import { 
  MapPin, 
  Filter, 
  ChevronRight, 
  X, 
  ArrowUpDown,
  ShieldCheck,
  Search,
  MessageCircle,
  Play
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
            dealer:  { select: { id: true, name: true, slug: true, location: true, verified: true, lat: true, lng: true, county: true, whatsapp: true } },
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
    <div className="bg-background min-h-screen">
      {/* ── MINIMAL FILTER BAR ── */}
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

      <div className="container mx-auto px-6 py-16 max-w-7xl">
        {/* ── RESULTS HEADER ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <div className="space-y-2">
            <div className="flex items-center gap-3 mb-3">
               <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500/50" />
               <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-slate-400">Live Inventory</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
              {search ? `Results for "${search}"` : county ? `Verified in ${county}` : "Explore Inventory"}
            </h1>
            <p className="text-lg text-slate-500 font-medium">
              Browse {total} premium units across verified Kenyan dealerships.
            </p>
          </div>
          
          <div className="flex items-center gap-8">
            <div className="text-right hidden sm:block space-y-1">
              <p className="text-xs font-extrabold uppercase tracking-widest text-slate-300">Market View</p>
              <p className="text-sm font-extrabold text-slate-800 tracking-tight">Nairobi Standard Time</p>
            </div>
          </div>
        </div>

        {/* ── CAR GRID ── */}
        {sortedCars.length === 0 ? (
          <div className="py-40 text-center border border-slate-200 rounded-[3rem] bg-white shadow-sm">
            <div className="w-24 h-24 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-8">
               <Search className="w-10 h-10 text-slate-200" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 mb-3">No matching units found.</h2>
            <p className="text-lg text-slate-500 font-medium mb-10 max-w-md mx-auto">Try adjusting your filters or search terms to find what you're looking for.</p>
            <Link href="/cars" className="inline-flex items-center gap-3 bg-brand text-white px-10 py-4 rounded-2xl font-extrabold text-xs uppercase tracking-widest hover:bg-brand-accent transition-all shadow-lg shadow-brand/10">
              Clear All Filters
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
            {sortedCars.map((car, idx) => (
              <InventoryCard key={car.id} car={car} userLat={userLat} userLng={userLng} priority={idx < 4} />
            ))}
          </div>
        )}

        {/* ── IMPROVED PAGINATION ── */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-3 mt-32">
            {/* Previous Button */}
            {page > 1 && (
              <Link href={getPageLink(page - 1)} className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:border-brand-accent/40 hover:text-brand transition-all shadow-sm">
                <ChevronRight className="w-5 h-5 rotate-180" />
              </Link>
            )}

            {/* Page Numbers with Ellipsis */}
            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                // Show: first, last, current, and neighbours
                if (p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1)) {
                  return (
                    <Link key={p}
                      href={getPageLink(p)}
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xs font-extrabold transition-all ${
                        p === page 
                          ? "bg-brand text-white shadow-xl shadow-brand/20 scale-110" 
                          : "bg-white border border-slate-200 text-slate-400 hover:border-brand-accent/40 hover:text-brand shadow-sm"
                      }`}
                    >
                      {p.toString().padStart(2, '0')}
                    </Link>
                  );
                }
                // Show ellipsis
                if (p === 2 && page > 3) return <span key="e1" className="text-slate-300 px-3 font-extrabold">...</span>;
                if (p === totalPages - 1 && page < totalPages - 2) return <span key="e2" className="text-slate-300 px-3 font-extrabold">...</span>;
                return null;
              })}
            </div>

            {/* Next Button */}
            {page < totalPages && (
              <Link href={getPageLink(page + 1)} className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:border-brand-accent/40 hover:text-brand transition-all shadow-sm">
                <ChevronRight className="w-5 h-5" />
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function InventoryCard({ car, userLat, userLng, priority = false }) {
  const img   = car.images[0]?.url;
  const title = `${car.make} ${car.model}${car.variant ? ` ${car.variant}` : ""}`;
  const dist  = userLat && car.dealer?.lat ? Math.round(distance(userLat, userLng, car.dealer.lat, car.dealer.lng)) : null;
  const totalLanded = car.imported && !car.dutyPaid ? car.price + estimateDuty(car.price, car.year) : null;

  const specs = [
    car.fuelType && FUEL_LABELS[car.fuelType],
    car.transmission === "AUTOMATIC" ? "Auto" : "Manual",
    car.mileage ? `${Math.round(car.mileage / 1000)}k km` : null,
    car.engineCC ? `${car.engineCC}cc` : null,
    car.drivetrain,
  ].filter(Boolean);

  return (
    <div className="group block bg-white border border-slate-200 hover:border-brand-accent/40 rounded-[2.5rem] overflow-hidden transition-all duration-500 hover:shadow-xl shadow-sm flex flex-col h-full">
      <Link href={`/cars/${car.id}`} className="relative aspect-[16/10] bg-slate-50 overflow-hidden shrink-0">
        {img ? (
            <Image 
              src={img} 
              alt={title} 
              fill 
              priority={priority}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs font-bold uppercase tracking-widest">No Image</div>
        )}

        {/* Video Indicator */}
        {car.videoUrl && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
             <Play className="w-5 h-5 text-white fill-white ml-0.5" />
          </div>
        )}

        <div className="absolute top-4 left-4 flex flex-wrap gap-2">
          {car.featured && (
            <span className="bg-brand text-white text-[10px] font-extrabold px-3 py-1.5 uppercase tracking-widest rounded-xl shadow-lg">
              Featured
            </span>
          )}
          {car.badges?.slice(0, 1).map((b) => (
            <span key={b} className={`text-[10px] font-extrabold px-3 py-1.5 rounded-xl shadow-sm backdrop-blur-md ${BADGE_OPTIONS[b]?.color || "bg-white/90 text-slate-700"}`}>
              {b}
            </span>
          ))}
        </div>

        {dist !== null && (
          <span className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md text-slate-900 text-[10px] font-extrabold px-3 py-1.5 rounded-xl border border-white shadow-sm">
            {dist}km away
          </span>
        )}
      </Link>

      <div className="p-6 flex flex-col flex-1 gap-4">
        <Link href={`/cars/${car.id}`} className="space-y-1.5">
          <div className="flex items-center gap-2.5">
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
        </Link>

        <div className="flex flex-wrap gap-2">
          {specs.slice(0, 4).map((s) => (
            <span key={s} className="text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-100/50 px-2.5 py-1 rounded-lg">
              {s}
            </span>
          ))}
        </div>

        <div className="mt-auto space-y-4 pt-4 border-t border-slate-50">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-2xl font-extrabold text-slate-900 leading-none">{formatPrice(car.price)}</p>
              {totalLanded && (
                <p className="text-[10px] font-extrabold text-brand uppercase tracking-wider">Est. {formatPrice(totalLanded)} Total</p>
              )}
            </div>
            <Link href={`/cars/${car.id}`} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-brand-light hover:text-brand transition-all">
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>

          {/* Quick WhatsApp Inquiry */}
          {car.dealer?.whatsapp && (
            <a 
              href={whatsappLink(car.dealer.whatsapp, title, car.dealer.name)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-[1.25rem] bg-emerald-50 text-emerald-600 text-xs font-extrabold uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all border border-emerald-100 shadow-sm"
            >
              <MessageCircle className="w-4 h-4 fill-current" /> WhatsApp Dealer
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
