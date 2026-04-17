// src/app/cars/page.js
import { db } from "@/lib/db";
import { formatPrice, formatCarPrice, formatMileage, BODY_TYPE_LABELS, FUEL_LABELS, BADGE_OPTIONS, whatsappLink } from "@/lib/utils";
import Link from "next/link";
import { ChevronRight, Search, MessageCircle, ShieldCheck, MapPin, ArrowUpRight } from "lucide-react";
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
    <div className="min-h-screen bg-[#f7f6f3]">
      <div className="w-full max-w-[2560px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-5 sm:py-6 lg:py-8 overflow-hidden">
        {/* Top Breadcrumb Bar */}
        <div className="block w-full mb-6 sm:mb-8 overflow-hidden text-[14px] font-medium">
          <div className="block w-full xl:w-1/4 2xl:w-1/4 xl:float-left xl:pr-3 mb-4 xl:mb-0">
            <div className="flex items-center gap-3 text-slate-800">
              <Link href="/" className="hover:text-black transition-colors">Home</Link>
              <span className="text-slate-400 text-xs mt-0.5">›</span>
              <Link href="/cars" className="hover:text-black transition-colors">Vehicles</Link>
              <span className="text-slate-400 text-xs mt-0.5">›</span>
              <span className="text-slate-900">Available</span>
            </div>
          </div>
          <div className="block w-full xl:w-3/4 2xl:w-3/4 xl:float-left text-slate-800 xl:pl-1 mt-1">
            Vehicles showing ({total.toLocaleString()})
          </div>
        </div>

        {/* Main Floating Matrix Container */}
        <div className="block -mx-2 sm:-mx-3">
          
          {/* Sidebar */}
          <aside className="block float-left w-full xl:w-1/4 px-2 sm:px-3 mb-6 xl:mb-0 relative z-20">
            <div className="xl:sticky xl:top-[84px] space-y-6">
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
              
              {/* Promo Banner to "fill this empty space brooo" */}
              <div className="hidden xl:block bg-white border border-[#ddd4c8] p-6 shadow-sm rounded-none">
                <span className="inline-block bg-[#111111] text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 mb-4">Concierge</span>
                <h3 className="text-base font-black text-slate-900 tracking-tight leading-tight mb-3">
                  Can't find the exact model you want?
                </h3>
                <p className="text-xs text-slate-600 font-medium leading-relaxed mb-5">
                  Set up a vehicle alert or let our expert team import or source a direct match from our private verified dealership network.
                </p>
                <button className="w-full bg-white border border-[#111111] hover:bg-[#111111] text-white hover:text-white text-[11px] font-black uppercase tracking-widest py-3 transition-colors rounded-full">
                  Request Vehicle
                </button>
              </div>
            </div>
          </aside>

          {/* Floating Cars */}
          {sortedCars.length === 0 ? (
            <div className="block float-left w-full xl:w-3/4 px-2 sm:px-3 py-20 text-center border border-[#ddd4c8] rounded-none bg-white">
              <div className="w-20 h-20 bg-[#faf7f2] rounded-none flex items-center justify-center mx-auto mb-6">
                <Search className="w-8 h-8 text-slate-300" />
              </div>
              <h2 className="text-2xl text-slate-900 mb-3">No cars match these filters</h2>
              <p className="text-base text-slate-600 font-medium mb-8 max-w-md mx-auto">Try broadening your search or resetting filters.</p>
              <Link href="/cars" className="rounded-full font-black inline-flex items-center gap-2 bg-[#111111] hover:bg-[#ff5a2f] text-white px-6 py-3 text-xs uppercase transition-colors">
                Reset Search <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <>
              {sortedCars.map((car, idx) => (
                <div key={car.id} className="block float-left w-full md:w-1/2 xl:w-1/4 px-2 sm:px-3 pb-6">
                  <InventoryCard car={car} userLat={userLat} userLng={userLng} priority={idx < 4} />
                </div>
              ))}
            </>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="block float-left w-full px-2 sm:px-3 mt-4 pb-4">
            <div className="min-w-max flex justify-center items-center gap-2 sm:gap-3 mx-auto">
              {page > 1 && (
                <Link href={getPageLink(page - 1)} className="w-10 h-10 sm:w-11 sm:h-11 rounded-none flex items-center justify-center bg-white border border-[#ddd4c8] text-slate-500 hover:text-black hover:bg-[#faf7f2] transition-all">
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 rotate-180" />
                </Link>
              )}

              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                  if (p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1)) {
                    return (
                      <Link key={p}
                        href={getPageLink(p)}
                        className={`w-10 h-10 sm:w-11 sm:h-11 rounded-none flex items-center justify-center text-xs font-extrabold transition-all ${
                          p === page
                            ? "bg-[#111111] text-white shadow-md"
                            : "bg-white border border-[#ddd4c8] text-white hover:bg-[#faf7f2]"
                        }`}
                      >
                        {p}
                      </Link>
                    );
                  }
                  if (p === 2 && page > 3) return <span key="e1" className="text-slate-400 px-1 font-extrabold">...</span>;
                  if (p === totalPages - 1 && page < totalPages - 2) return <span key="e2" className="text-slate-400 px-1 font-extrabold">...</span>;
                  return null;
                })}
              </div>

              {page < totalPages && (
                <Link href={getPageLink(page + 1)} className="w-10 h-10 sm:w-11 sm:h-11 rounded-none flex items-center justify-center bg-white border border-[#ddd4c8] text-slate-500 hover:text-black hover:bg-[#faf7f2] transition-all">
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </Link>
              )}
            </div>
          </div>
        )}
        </div>

        <div className="clear-both"></div>
      </div>
    </div>
  );
}

function InventoryCard({ car, userLat, userLng, priority = false }) {
  const img   = car.images[0]?.url;
  const title = `${car.make} ${car.model}${car.variant ? ` ${car.variant}` : ""}`;
  const dist  = userLat && car.dealer?.lat ? Math.round(distance(userLat, userLng, car.dealer.lat, car.dealer.lng)) : null;

  const specs = [
    car.bodyType && BODY_TYPE_LABELS[car.bodyType],
    car.fuelType && FUEL_LABELS[car.fuelType],
    car.transmission === "AUTOMATIC" ? "Auto" : car.transmission === "MANUAL" ? "Manual" : car.transmission,
    car.mileage ? formatMileage(car.mileage) : null,
  ].filter(Boolean);

  const compareCar = {
    ...car,
    image: img,
    model: `${car.make} ${car.model}`,
  };

  return (
    <article className="group block bg-white border border-[#e8e2d9] hover:border-slate-300 overflow-hidden transition-all duration-500 flex flex-col h-full rounded-none">
      <Link href={`/cars/${car.id}`} className="relative aspect-[16/10] bg-slate-50 overflow-hidden shrink-0">
        {img ? (
            <Image 
              src={img} 
              alt={title} 
              fill 
              priority={priority}
              className="w-full h-full object-cover transition-transform duration-700" 
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold uppercase tracking-widest">No Image</div>
        )}

        <div className="absolute top-3 right-3 flex items-start justify-end">
          <span className="bg-emerald-400 text-white text-[10px] font-bold px-2 py-1 shadow-sm uppercase tracking-wider">
            AVAILABLE
          </span>
        </div>

        {dist !== null && (
          <span className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md text-slate-900 text-[10px] font-extrabold px-3 py-1.5 border border-white">
            {dist}km away
          </span>
        )}
      </Link>

      <div className="p-6 flex flex-col flex-1 gap-4">
        <div className="space-y-3">
          <div className="flex items-baseline gap-2">
            <span className="bg-slate-100 text-slate-900 text-[11px] font-semibold px-1.5 py-0.5 border border-slate-200">{car.year}</span>
            <Link href={`/cars/${car.id}`} className="font-bold text-slate-900 text-base sm:text-lg leading-tight hover:text-[#ff5a2f] transition-colors line-clamp-1">
              {title}
            </Link>
          </div>
          
          <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">
            {specs.join(" • ")} {car.description ? `- ${car.description}` : ""}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {car.bodyType && <span className="text-[10px] font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5">{car.bodyType.replace(/_/g, ' ')}</span>}
          {car.fuelType && <span className="text-[10px] font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5">{car.fuelType}</span>}
          {car.mileage && <span className="text-[10px] font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5">{Math.round(car.mileage).toLocaleString("en-US")} CC</span>}
        </div>

        <div className="mt-auto flex items-end justify-between pt-4 border-t border-slate-200 gap-3">
          <p className="text-lg lg:text-xl font-bold text-slate-900">{formatCarPrice(car)}</p>
          <div className="flex items-center gap-1.5">
            <Link href={`/cars/${car.id}`} className="flex items-center justify-center px-5 py-2.5 bg-slate-900 hover:bg-[#ff5a2f] text-white text-[11px] font-black uppercase tracking-widest rounded-full transition-all shadow-sm">
              View Offer
            </Link>
            <CompareButton car={compareCar} className=" h-full" />
          </div>
        </div>
      </div>
    </article>
  );
}
