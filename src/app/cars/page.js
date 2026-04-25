// src/app/cars/page.js
import { db } from "@/lib/db";
import { formatPrice, formatCarPrice, formatMileage, whatsappLink } from "@/lib/utils";
import { BODY_TYPE_LABELS, FUEL_LABELS, BADGE_OPTIONS } from "@/lib/constants";
import Link from "next/link";
import { ChevronRight, Search, MessageCircle, ShieldCheck, MapPin, ArrowUpRight } from "lucide-react";
import Image from "next/image";
import CarsSearch from "@/components/CarsSearch";
import CarCard from "@/components/CarCard";
import { unstable_cache } from "next/cache";
import { CompareButton } from "@/components/CompareSelector";
import SearchMapToggle from "@/components/SearchMapToggle";


export const metadata = { title: "Inventory — Welsh Motors Standard" };

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
  const model = sp.model || "";
  const steering = sp.steering || "";
  const minYOM = sp.minYOM ? parseInt(sp.minYOM, 10) : undefined;
  const maxYOM = sp.maxYOM ? parseInt(sp.maxYOM, 10) : undefined;
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
    ...(model        && { model: { equals: model, mode: "insensitive" } }),
    ...(steering     && { steering }),
    ...(minYOM || maxYOM ? { year: { ...(minYOM && { gte: minYOM }), ...(maxYOM && { lte: maxYOM }) } } : {}),
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
    [
      { featuredWeight: "desc" },
      { dealer: { featured: "desc" } },
      { dealer: { boostScore: "desc" } },
      { createdAt: "desc" }
    ];

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
      <div className="w-full px-4 sm:px-8 pt-32 sm:pt-40">
        
        {/* Adjusted Top Bar with Breadcrumbs and Count */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-12 gap-8 border-b border-slate-100 dark:border-zinc-900 pb-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] text-[#718096] dark:text-slate-400">
              <Link href="/" className="hover:text-[#111827] dark:hover:text-white transition-colors">Home</Link>
              <ChevronRight className="w-3 h-3" />
              <Link href="/cars" className="hover:text-[#111827] dark:hover:text-white transition-colors">Vehicles</Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-[#111827] dark:text-white">Available</span>
            </div>
            <div className="flex items-center gap-6">
               {sortedCars.length > 0 && <SearchMapToggle cars={sortedCars} />}
               <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#718096] dark:text-slate-400">
                 Showing {(page - 1) * limit + 1} - {Math.min(page * limit, total)} of {total}
               </div>
            </div>
          </div>
          
          <div className="text-[11px] font-black uppercase tracking-[0.2em] text-[#38A169]">
            Network Availability: {total} Units Verified
          </div>
        </div>

        {/* Side-by-Side Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12 items-start">
          
          {/* Sidebar - Spans rows as long as it needs */}
          <div className="lg:col-span-1 lg:row-span-[10] lg:sticky lg:top-40 space-y-10">
            <CarsSearch
              initialSearch={search}
              initialMake={make}
              initialBodyType={bodyType}
              initialFuelType={fuelType}
              initialTransmission={transmission}
              initialCounty={county}
              initialMinPrice={sp.minPrice}
              initialMaxPrice={sp.maxPrice}
              initialSort={sort}
              allMakes={allMakes}
              bodyTypeLabels={BODY_TYPE_LABELS}
              counties={COUNTIES}
            />
            
            {/* Context Card */}
            <div className="bg-[#F7FAFC] dark:bg-[#111111] border border-[#E2E8F0] dark:border-slate-800 p-8" style={{ borderRadius: 'var(--radius)' }}>
              <h3 className="text-sm font-bold text-[#111827] dark:text-white uppercase tracking-widest mb-4">Concierge</h3>
              <p className="text-sm text-[#718096] dark:text-slate-400 leading-relaxed mb-6 font-medium">
                Can't find it? Our network has access to off-market inventory and premium stock from the best dealerships in the country.
              </p>
              <Link href="/contact" className="block text-center bg-[#111827] text-white dark:bg-white dark:!text-black py-3 text-[10px] font-bold uppercase tracking-widest transition-transform hover:scale-[0.98]" style={{ borderRadius: 'var(--radius)' }}>
                Request Sourcing
              </Link>
            </div>
          </div>

          {/* Results Grid - Each car is 1 column. 
              The flow starts immediately next to the Sidebar.
          */}
          {sortedCars.map((car) => (
            <div key={car.id} className="lg:col-span-1 h-full">
              <CarCard 
                car={car} 
                distance={userLat && car.dealer?.lat ? Math.round(distance(userLat, userLng, car.dealer.lat, car.dealer.lng)) : null} 
              />
            </div>
          ))}

          {sortedCars.length === 0 && (
            <div className="lg:col-span-3 py-32 text-center bg-[#F7FAFC] dark:bg-[#111111] border border-[#EDF2F7] dark:border-slate-800" style={{ borderRadius: 'var(--radius)' }}>
              <Search className="w-12 h-12 text-[#CBD5E0] dark:text-slate-700 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-[#111827] dark:text-white mb-2">No matches found</h2>
              <p className="text-[#718096] dark:text-slate-400 font-medium mb-8">Try adjusting your filters or resetting your search.</p>
              <Link href="/cars" className="inline-flex bg-[#111827] dark:bg-white dark:text-[#111827] text-white px-8 py-3 text-xs font-bold uppercase tracking-widest" style={{ borderRadius: 'var(--radius)' }}>
                Clear All Filters
              </Link>
            </div>
          )}

          {/* Pagination - Full Width below all content */}
          {totalPages > 1 && (
            <div className="lg:col-span-4 mt-20 flex justify-center items-center gap-2 border-t border-slate-100 pt-10">
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
        </div>
      </div>
    </div>
  );
}
