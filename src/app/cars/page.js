// src/app/cars/page.js
import { db } from "@/lib/db";
import { formatPrice, formatCarPrice, formatMileage, BODY_TYPE_LABELS, FUEL_LABELS, BADGE_OPTIONS, whatsappLink } from "@/lib/utils";
import Link from "next/link";
import { ChevronRight, Search, MessageCircle, ShieldCheck, MapPin, ArrowUpRight } from "lucide-react";
import Image from "next/image";
import CarsSearch from "@/components/CarsSearch";
import { unstable_cache } from "next/cache";
import { CompareButton } from "@/components/CompareSelector";
import SearchMapToggle from "@/components/SearchMapToggle";


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

const getAllMakes = unstable_cache(
  async () => {
    return db.car.findMany({
      where: { available: true },
      distinct: ["make"],
      select: { make: true },
      orderBy: { make: "asc" },
    });
  },
  ["all-makes"],
  { revalidate: 3600, tags: ["makes"] }
);

export default async function CarsPage({ searchParams }) {
  const sp = await searchParams;
  const page = parseInt(sp.page || "1", 10);
  const limit = 12;
  const search = sp.search || "";
  const make = sp.make || "";
  const bodyType = sp.bodyType || "";
  const fuelType = sp.fuelType || "";
  const transmission = sp.transmission || "";
  const county = sp.county || "";
  const minPrice = sp.minPrice ? parseInt(sp.minPrice, 10) : undefined;
  const maxPrice = sp.maxPrice ? parseInt(sp.maxPrice, 10) : undefined;
  const sort = sp.sort || "newest";

  const userLat = sp.lat ? parseFloat(sp.lat) : null;
  const userLng = sp.lng ? parseFloat(sp.lng) : null;

  const where = {
    available: true,
    ...(make         && { make: { equals: make, mode: "insensitive" } }),
    ...(bodyType     && { bodyType }),
    ...(fuelType     && { fuelType }),
    ...(transmission && { transmission }),
    ...(minPrice || maxPrice ? { computedLandedPrice: { ...(minPrice && { gte: minPrice }), ...(maxPrice && { lte: maxPrice }) } } : {}),
    ...(county       && { dealer: { county: { equals: county, mode: "insensitive" } } }),
    ...(search       && { OR: [
      { make:    { contains: search, mode: "insensitive" } },
      { model:   { contains: search, mode: "insensitive" } },
      { variant: { contains: search, mode: "insensitive" } },
    ]}),
  };

  const orderBy =
    sort === "price_asc" ? [{ computedLandedPrice: "asc" }] :
    sort === "price_desc" ? [{ computedLandedPrice: "desc" }] :
    sort === "mileage_asc" ? [{ mileage: "asc" }] :
    sort === "year_desc" ? [{ year: "desc" }] :
    [{ featured: "desc" }, { createdAt: "desc" }];

  const [cars, total, allMakes] = await Promise.all([
    db.car.findMany({
      where,
      select: {
        id: true,
        make: true,
        model: true,
        variant: true,
        year: true,
        price: true,
        computedLandedPrice: true,
        dutyPaid: true,
        engineCC: true,
        mileage: true,
        bodyType: true,
        fuelType: true,
        transmission: true,
        featured: true,
        badges: true,
        description: true,
        images: {
          where: { isPrimary: true },
          take: 1,
        },
        dealer: {
          select: {
            id: true,
            name: true,
            slug: true,
            location: true,
            verified: true,
            lat: true,
            lng: true,
            county: true,
            whatsapp: true,
          },
        },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.car.count({ where }),
    getAllMakes(),
  ]);

  const sortedCars = userLat && userLng && sort === "newest"
    ? [...cars].sort((a, b) => {
        const da = distance(userLat, userLng, a.dealer?.lat, a.dealer?.lng);
        const db2 = distance(userLat, userLng, b.dealer?.lat, b.dealer?.lng);
        return da - db2;
      })
    : cars;

  const totalPages = Math.ceil(total / limit);

  const getPageLink = (p) => {
    const params = new URLSearchParams(sp);
    params.set("page", p);
    return `/cars?${params.toString()}`;
  };

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="container mx-auto px-6 max-w-7xl pt-32 sm:pt-40">
        
        {/* Header Section */}
        <div className="mb-16">
          <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-[#718096] dark:text-slate-400 mb-4">
            <Link href="/" className="hover:text-[#111827] dark:hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <span className="text-[#111827] dark:text-white">Inventory</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold text-[#111827] dark:text-white tracking-tight leading-[1.1] mb-6">
            Explore the <br />
            <span className="editorial-heading text-[#38A169]">Available Network.</span>
          </h1>
          <p className="text-[#718096] dark:text-slate-400 text-lg font-medium max-w-2xl">
            Currently listing {total.toLocaleString()} verified vehicles across East Africa.
            Every unit is checked for compliance and duty transparency.
          </p>
        </div>

        {/* Search and Filters Bar - Sticky on Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          <aside className="lg:col-span-3 lg:sticky lg:top-32 space-y-10">
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
            
            {/* Context Card */}
            <div className="bg-[#F7FAFC] dark:bg-[#111111] border border-[#E2E8F0] dark:border-slate-800 p-8" style={{ borderRadius: 'var(--radius)' }}>
              <h3 className="text-sm font-bold text-[#111827] dark:text-white uppercase tracking-widest mb-4">Concierge</h3>
              <p className="text-sm text-[#718096] dark:text-slate-400 leading-relaxed mb-6 font-medium">
                Can't find it? Our network has access to off-market inventory and direct Japan imports.
              </p>
              <Link href="/contact" className="block text-center bg-[#111827] text-white dark:bg-white dark:!text-black py-3 text-[10px] font-bold uppercase tracking-widest transition-transform hover:scale-[0.98]" style={{ borderRadius: 'var(--radius)' }}>
                Request Sourcing
              </Link>
            </div>
          </aside>

          <main className="lg:col-span-9">
            {/* Tools Area */}
            <div className="flex flex-col sm:flex-row justify-between items-center pb-8 border-b border-[#EDF2F7] mb-12 gap-6">
               <div className="flex items-center gap-6">
                 {sortedCars.length > 0 && <SearchMapToggle cars={sortedCars} />}
               </div>
               <div className="text-xs font-bold text-[#718096] uppercase tracking-widest">
                 Showing {(page - 1) * limit + 1} - {Math.min(page * limit, total)} of {total}
               </div>
            </div>

            {/* Results Grid */}
            {sortedCars.length === 0 ? (
              <div className="py-32 text-center bg-[#F7FAFC] dark:bg-[#111111] border border-[#EDF2F7] dark:border-slate-800" style={{ borderRadius: 'var(--radius)' }}>
                <Search className="w-12 h-12 text-[#CBD5E0] dark:text-slate-700 mx-auto mb-6" />
                <h2 className="text-2xl font-bold text-[#111827] dark:text-white mb-2">No matches found</h2>
                <p className="text-[#718096] dark:text-slate-400 font-medium mb-8">Try adjusting your filters or resetting your search.</p>
                <Link href="/cars" className="inline-flex bg-[#111827] dark:bg-white dark:text-[#111827] text-white px-8 py-3 text-xs font-bold uppercase tracking-widest" style={{ borderRadius: 'var(--radius)' }}>
                  Clear All Filters
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {sortedCars.map((car) => (
                  <InventoryCard key={car.id} car={car} userLat={userLat} userLng={userLng} />
                ))}
              </div>
            )}

            {/* Premium Pagination */}
            {totalPages > 1 && (
              <div className="mt-20 flex justify-center items-center gap-2">
                {page > 1 && (
                  <Link href={getPageLink(page - 1)} className="w-12 h-12 flex items-center justify-center border border-[#EDF2F7] dark:border-slate-800 text-[#111827] dark:text-white hover:bg-[#F7FAFC] dark:hover:bg-white/5 transition-colors" style={{ borderRadius: 'var(--radius)' }}>
                    <ChevronRight className="w-4 h-4 rotate-180" />
                  </Link>
                )}
                <div className="flex gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                    if (p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1)) {
                      return (
                        <Link key={p} href={getPageLink(p)} 
                          className={`w-12 h-12 flex items-center justify-center text-xs font-bold transition-all ${
                            p === page 
                              ? "bg-[#111827] dark:bg-white text-white dark:!text-black shadow-lg" 
                              : "border border-[#EDF2F7] dark:border-slate-800 text-[#718096] dark:text-slate-400 hover:bg-[#F7FAFC] dark:hover:bg-white/5"
                          }`}
                          style={{ borderRadius: 'var(--radius)' }}
                        >
                          {p}
                        </Link>
                      );
                    }
                    if ((p === 2 && page > 3) || (p === totalPages - 1 && page < totalPages - 2)) {
                       return <span key={p} className="w-12 h-12 flex items-end justify-center text-[#CBD5E0] dark:text-slate-700 pb-3">...</span>;
                    }
                    return null;
                  })}
                </div>
                {page < totalPages && (
                  <Link href={getPageLink(page + 1)} className="w-12 h-12 flex items-center justify-center border border-[#EDF2F7] dark:border-slate-800 text-[#111827] dark:text-white hover:bg-[#F7FAFC] dark:hover:bg-white/5 transition-colors" style={{ borderRadius: 'var(--radius)' }}>
                    <ChevronRight className="w-4 h-4" />
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

function InventoryCard({ car, userLat, userLng }) {
  const img   = car.images?.[0]?.url;
  const title = `${car.make} ${car.model}`;
  const dist  = userLat && car.dealer?.lat ? Math.round(distance(userLat, userLng, car.dealer.lat, car.dealer.lng)) : null;

  const compareCar = {
    ...car,
    image: img,
    model: `${car.make} ${car.model}`,
  };

  return (
    <article className="group flex flex-col h-full bg-white dark:bg-[#111111] border border-slate-100 dark:border-slate-800 transition-all hover:border-[#38A169] dark:hover:border-[#38A169] shadow-sm hover:shadow-xl" style={{ borderRadius: 'var(--radius)' }}>
      <Link href={`/cars/${car.id}`} className="relative aspect-[16/11] bg-slate-100 dark:bg-slate-900 overflow-hidden block" style={{ borderTopLeftRadius: 'var(--radius)', borderTopRightRadius: 'var(--radius)' }}>
        {img ? (
            <Image src={img} alt={title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">No Image Available</div>
        )}

        <div className="absolute top-4 left-4">
          <span className="bg-white/90 dark:bg-[#111111]/90 backdrop-blur-md text-[#111827] dark:text-white text-[9px] font-bold px-2 py-1 uppercase tracking-widest shadow-sm" style={{ borderRadius: '2px' }}>
            {car.dutyPaid ? "DUTY PAID" : "DIRECT IMPORT"}
          </span>
        </div>

        {dist !== null && (
          <span className="absolute bottom-4 right-4 bg-[#111827]/80 backdrop-blur-md text-white text-[9px] font-bold px-3 py-1.5 uppercase tracking-widest" style={{ borderRadius: '2px' }}>
            {dist}km away
          </span>
        )}
      </Link>

      <div className="flex flex-col flex-1 p-5">
        <div className="mb-4">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold px-1.5 py-0.5" style={{ borderRadius: '1px' }}>{car.year}</span>
            <Link href={`/cars/${car.id}`}>
              <h3 className="text-base font-bold text-[#111827] dark:text-white group-hover:text-[#38A169] transition-colors line-clamp-1">{title}</h3>
            </Link>
          </div>
          
          <p className="text-[11px] text-[#718096] dark:text-slate-400 font-medium mb-4 flex flex-wrap items-center gap-x-1.5">
             {car.horsepower && <span>{car.horsepower} HP</span>}
             {car.horsepower && car.torque && <span>•</span>}
             {car.torque && <span>{car.torque} Nm</span>}
             {(car.horsepower || car.torque) && car.fuelType && <span>•</span>}
             {car.fuelType && <span className="capitalize">{car.fuelType.toLowerCase()}</span>}
             {car.transmission && <span>•</span>}
             {car.transmission && <span className="capitalize">{car.transmission.toLowerCase()}</span>}
             {(!car.horsepower && !car.torque) && (
                <>
                   <span>{car.bodyType?.replace(/_/g, ' ')}</span>
                   {car.mileage && <span>• {Math.round(car.mileage).toLocaleString()} km</span>}
                </>
             )}
          </p>
          
          <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{car.dealer?.name || "Verified Dealer"}</p>
        </div>

        <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-50 dark:border-slate-800">
          <div>
            <p className="text-lg font-bold text-[#111827] dark:text-white">{formatCarPrice(car)}</p>
          </div>
          <div className="flex items-center gap-3">
            <CompareButton car={compareCar} className="w-4 h-4 text-slate-400 hover:text-[#111827] dark:hover:text-white transition-colors" />
            <Link href={`/cars/${car.id}`} className="bg-slate-50 dark:bg-slate-800 text-[#111827] dark:text-white text-[9px] font-bold uppercase tracking-widest px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" style={{ borderRadius: '2px' }}>
              View Offer
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
