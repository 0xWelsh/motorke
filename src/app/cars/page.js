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
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Market View</p>
              <p className="text-xs font-black text-slate-800">Nairobi Standard Time</p>
            </div>
            {/* Sort is now handled inside CarsSearch for a unified UI, but we could keep a quick toggle here if needed */}
          </div>
        </div>

        {/* ── CAR GRID ── */}
        {sortedCars.length === 0 ? (
          <div className="py-32 text-center border-2 border-dashed border-slate-100 rounded-[3rem] bg-white/50 shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
               <Search className="w-8 h-8 text-slate-200" />
            </div>
            <h2 className="text-xl font-black text-slate-800 mb-2">No matching units found.</h2>
            <p className="text-slate-400 font-medium mb-8">Try adjusting your filters or search terms.</p>
            <Link href="/cars" className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-colors">
              Reset Filters
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {sortedCars.map((car, idx) => (
              <InventoryCard key={car.id} car={car} userLat={userLat} userLng={userLng} priority={idx < 4} />
            ))}
          </div>
        )}

        {/* ── IMPROVED PAGINATION ── */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-24">
            {/* Previous Button */}
            {page > 1 && (
              <Link href={getPageLink(page - 1)} className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-50 border border-slate-100 text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-all shadow-sm">
                <ChevronRight className="w-4 h-4 rotate-180" />
              </Link>
            )}

            {/* Page Numbers with Ellipsis */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
              // Show: first, last, current, and neighbours
              if (p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1)) {
                return (
                  <Link key={p}
                    href={getPageLink(p)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-[11px] font-black transition-all ${
                      p === page ? "bg-[var(--brand)] text-white shadow-lg shadow-[var(--brand)]/10" : "bg-slate-50 border border-slate-100 text-slate-400 hover:bg-slate-100 hover:text-slate-900 shadow-sm"
                    }`}
                  >
                    {p.toString().padStart(2, '0')}
                  </Link>
                );
              }
              // Show ellipsis
              if (p === 2 && page > 3) return <span key="e1" className="text-slate-200 px-2 font-black">...</span>;
              if (p === totalPages - 1 && page < totalPages - 2) return <span key="e2" className="text-slate-200 px-2 font-black">...</span>;
              return null;
            })}

            {/* Next Button */}
            {page < totalPages && (
              <Link href={getPageLink(page + 1)} className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-50 border border-slate-100 text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-all shadow-sm">
                <ChevronRight className="w-4 h-4" />
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

  const specs = [
    car.fuelType && FUEL_LABELS[car.fuelType],
    car.transmission === "AUTOMATIC" ? "Auto" : car.transmission === "MANUAL" ? "Manual" : car.transmission,
    car.mileage ? `${Math.round(car.mileage / 1000)}k km` : null,
    car.engineCC ? `${car.engineCC}cc` : null,
    car.drivetrain,
    BODY_TYPE_LABELS[car.bodyType],
  ].filter(Boolean);

  return (
    <Link href={`/cars/${car.id}`} className="group block bg-white border border-slate-100 hover:border-[var(--brand-accent)]/30 overflow-hidden transition-all duration-500 rounded-3xl shadow-sm hover:shadow-xl">
      {/* Landscape thumbnail — sharp corners */}
      <div className="relative aspect-[16/10] bg-white/5 overflow-hidden">
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
          <div className="w-full h-full flex items-center justify-center text-slate-300 text-[10px] font-bold uppercase tracking-widest">No Image</div>
        )}
        {car.featured && (
          <span className="absolute top-3 right-3 bg-[var(--brand)] text-white text-[9px] font-black px-2.5 py-1 uppercase tracking-widest rounded-lg">
            Featured
          </span>
        )}
        {dist !== null && (
          <span className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm text-slate-900 text-[9px] font-bold px-2.5 py-1 rounded-lg border border-slate-100 shadow-sm">
            {dist}km away
          </span>
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

      {/* Content */}
      <div className="p-4 flex flex-col gap-3">
        {/* Year label + Car name */}
        <div className="flex items-center gap-2.5">
          <span className="text-[10px] font-black bg-[var(--brand-light)] text-[var(--brand)] px-2 py-0.5 uppercase tracking-wider shrink-0 rounded-md">
            {car.year}
          </span>
          <h3 className="font-bold text-slate-800 text-sm leading-tight truncate group-hover:text-[var(--brand-accent)] transition-colors">
            {title}
          </h3>
          {car.dealer?.verified && <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
        </div>

        {/* Description */}
        {car.description && (
          <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
            {car.description}
          </p>
        )}

        {/* Spec tags */}
        <div className="flex flex-wrap gap-1.5">
          {specs.map((s) => (
            <span key={s} className="text-[10px] font-semibold text-slate-500 bg-slate-50 border border-slate-100 px-2 py-1 rounded-lg">
              {s}
            </span>
          ))}
        </div>

        {/* Price + View Offer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-50 mt-auto">
          <p className="text-lg font-black text-slate-900">{formatPrice(car.price)}</p>
          <div className="flex items-center gap-3">
             <CompareButton car={car} />
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 group-hover:text-[var(--brand-accent)] transition-colors flex items-center gap-1">
               View Offer <ChevronRight className="w-3 h-3" />
             </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
