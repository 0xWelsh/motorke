// src/app/cars/page.js
export const dynamic = "force-dynamic";
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
    async (where, page, limit) => {
      const [cars, total] = await Promise.all([
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
      ]);
      return { cars, total };
    },
    ["cars-list", JSON.stringify(where), page.toString()],
    { revalidate: 300, tags: ["cars"] }
  );
  
  const [{ cars, total }, allMakes] = await Promise.all([
    getCars(where, page, limit),
    getAllMakes(),
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
    <div className="bg-background min-h-screen">
      {/* ── MINIMAL FILTER BAR ── */}
      <CarsSearch
        initialSearch={search}
        initialMake={make}
        initialBodyType={bodyType}
        initialFuelType={fuelType}
        initialCounty={county}
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
               <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Live Inventory</span>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight">
              {search ? `Results for "${search}"` : county ? `Verified in ${county}` : "All Showcases"}
            </h1>
            <p className="text-white/50 font-medium mt-1">
              Displaying {total} premium automotive units.
            </p>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Market View</p>
              <p className="text-xs font-black text-white">Nairobi Standard Time</p>
            </div>
            <button className="flex items-center gap-2 bg-white/5 border border-white/10 px-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white/50 hover:text-white transition-all">
               <ArrowUpDown className="w-3 h-3" /> Sort: Relevance
            </button>
          </div>
        </div>

        {/* ── CAR GRID ── */}
        {sortedCars.length === 0 ? (
          <div className="py-32 text-center border-2 border-dashed border-white/10 rounded-[3rem]">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
               <Search className="w-8 h-8 text-white/20" />
            </div>
            <h2 className="text-xl font-black text-white mb-2">No matching units found.</h2>
            <p className="text-white/40 font-medium mb-8">Try adjusting your filters or search terms.</p>
            <Link href="/cars" className="inline-flex items-center gap-2 bg-white/10 text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/20 transition-colors">
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

        {/* ── PAGINATION ── */}
        {pages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-24">
            {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
              <Link key={p}
                href={`/cars?page=${p}&search=${search}&make=${make}&bodyType=${bodyType}&fuelType=${fuelType}&county=${county}`}
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-[11px] font-black transition-all ${
                  p === page ? "bg-orange-600 text-white shadow-[0_0_15px_rgba(234,88,12,0.4)]" : "bg-white/5 border border-transparent text-white/40 hover:bg-white/10 hover:text-white"
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
    <Link href={`/cars/${car.id}`} className="group block bg-surface border border-white/5 hover:border-orange-500/30 overflow-hidden transition-all duration-300">
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
          <div className="w-full h-full flex items-center justify-center text-white/20 text-[10px] font-bold uppercase tracking-widest">No Image</div>
        )}
        {car.featured && (
          <span className="absolute top-3 right-3 bg-orange-600 text-pureWhite text-[9px] font-black px-2.5 py-1 uppercase tracking-widest">
            Featured
          </span>
        )}
        {dist !== null && (
          <span className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm text-orange-400 text-[9px] font-bold px-2.5 py-1">
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
          <span className="text-[10px] font-black bg-white/10 text-orange-400 px-2 py-0.5 uppercase tracking-wider shrink-0">
            {car.year}
          </span>
          <h3 className="font-bold text-white text-sm leading-tight truncate group-hover:text-orange-500 transition-colors">
            {title}
          </h3>
          {car.dealer?.verified && <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
        </div>

        {/* Description */}
        {car.description && (
          <p className="text-xs text-white/40 leading-relaxed line-clamp-2">
            {car.description}
          </p>
        )}

        {/* Spec tags */}
        <div className="flex flex-wrap gap-1.5">
          {specs.map((s) => (
            <span key={s} className="text-[10px] font-semibold text-white/50 bg-white/5 border border-white/5 px-2 py-0.5">
              {s}
            </span>
          ))}
        </div>

        {/* Price + View Offer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/5 mt-auto">
          <p className="text-lg font-black text-orange-500">{formatPrice(car.price)}</p>
          <span className="text-[10px] font-black uppercase tracking-widest text-white/30 group-hover:text-orange-500 transition-colors flex items-center gap-1">
            View Offer <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}
