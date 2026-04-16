// src/app/cars/page.js
import { db } from "@/lib/db";
import { formatPrice, formatMileage, BODY_TYPE_LABELS, FUEL_LABELS, BADGE_OPTIONS, whatsappLink } from "@/lib/utils";
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
    ...(minPrice || maxPrice ? { price: { ...(minPrice && { gte: minPrice }), ...(maxPrice && { lte: maxPrice }) } } : {}),
    ...(county       && { dealer: { county: { equals: county, mode: "insensitive" } } }),
    ...(search       && { OR: [
      { make:    { contains: search, mode: "insensitive" } },
      { model:   { contains: search, mode: "insensitive" } },
      { variant: { contains: search, mode: "insensitive" } },
    ]}),
  };

  const orderBy =
    sort === "price_asc" ? [{ price: "asc" }] :
    sort === "price_desc" ? [{ price: "desc" }] :
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

  const activeFilterPills = [
    search ? `Search: ${search}` : null,
    make ? `Make: ${make}` : null,
    bodyType ? `Type: ${BODY_TYPE_LABELS[bodyType] || bodyType}` : null,
    fuelType ? `Fuel: ${FUEL_LABELS[fuelType] || fuelType}` : null,
    transmission ? `Gearbox: ${transmission}` : null,
    county ? `County: ${county}` : null,
    minPrice ? `Min: ${formatPrice(minPrice)}` : null,
    maxPrice ? `Max: ${formatPrice(maxPrice)}` : null,
  ].filter(Boolean);

  const getPageLink = (p) => {
    const params = new URLSearchParams(sp);
    params.set("page", p);
    return `/cars?${params.toString()}`;
  };

  return (
    <div className="min-h-screen bg-[#f7f6f3]">
      <div className="max-w-[1520px] mx-auto px-5 sm:px-8 lg:px-12 py-5 sm:py-6 lg:py-8">
        <div className="grid grid-cols-1 xl:grid-cols-[300px_minmax(0,1fr)] gap-5 lg:gap-8 items-start">
          <aside className="xl:sticky xl:top-[84px]">
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
          </aside>

          <section className="min-w-0">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 sm:mb-8 gap-4 sm:gap-6">
              <div>
                <div className="inline-flex items-center gap-2 mb-2 border-b border-[#e7e1d8] pb-1">
                  <span className="h-2 w-2 rounded-full bg-[#ff5a2f] animate-pulse" />
                  <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-500">Live Cars</span>
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl text-slate-900 tracking-tight leading-tight">
                  {search ? `Results for ${search}` : county ? `${county} Inventory` : "Explore Cars"}
                </h1>
                <p className="text-sm sm:text-base text-slate-600 font-medium mt-2">
                  {total.toLocaleString()} active listings from verified dealerships.
                </p>
              </div>
              <div className="hidden md:flex items-center gap-2.5 rounded-xl border border-[#e7e1d8] bg-white px-3 py-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-600">Dealer-Verified Listings</p>
              </div>
            </div>

            {activeFilterPills.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {activeFilterPills.map((pill) => (
                  <span key={pill} className="rounded-lg border border-[#ddd4c8] bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-600">
                    {pill}
                  </span>
                ))}
              </div>
            )}

            {sortedCars.length === 0 ? (
              <div className="py-20 text-center border border-[#ddd4c8] rounded-2xl bg-white">
                <div className="w-20 h-20 bg-[#faf7f2] rounded-xl flex items-center justify-center mx-auto mb-6">
                  <Search className="w-8 h-8 text-slate-300" />
                </div>
                <h2 className="text-2xl text-slate-900 mb-3">No cars match these filters</h2>
                <p className="text-base text-slate-600 font-medium mb-8 max-w-md mx-auto">Try broadening your search or resetting filters.</p>
                <Link href="/cars" className="mk-pill-btn inline-flex items-center gap-2 bg-[#111111] hover:bg-[#ff5a2f] text-white px-6 py-3 text-xs uppercase transition-colors">
                  Reset Search <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
                {sortedCars.map((car, idx) => (
                  <InventoryCard key={car.id} car={car} userLat={userLat} userLng={userLng} priority={idx < 4} />
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="mt-10 sm:mt-12 overflow-x-auto pb-2">
                <div className="min-w-max flex justify-center items-center gap-2 sm:gap-3 mx-auto">
                  {page > 1 && (
                    <Link href={getPageLink(page - 1)} className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg flex items-center justify-center bg-white border border-[#ddd4c8] text-slate-500 hover:text-black hover:bg-[#faf7f2] transition-all">
                      <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 rotate-180" />
                    </Link>
                  )}

                  <div className="flex items-center gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                      if (p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1)) {
                        return (
                          <Link key={p}
                            href={getPageLink(p)}
                            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-lg flex items-center justify-center text-xs font-extrabold transition-all ${
                              p === page
                                ? "bg-[#111111] text-white shadow-md"
                                : "bg-white border border-[#ddd4c8] text-slate-600 hover:bg-[#faf7f2]"
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
                    <Link href={getPageLink(page + 1)} className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg flex items-center justify-center bg-white border border-[#ddd4c8] text-slate-500 hover:text-black hover:bg-[#faf7f2] transition-all">
                      <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    </Link>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
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
    <article className="group block bg-white border border-[#e8e2d9] hover:border-[#d8cec1] overflow-hidden transition-all duration-500 flex flex-col h-full">
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
          <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold uppercase tracking-widest">No Image</div>
        )}

        <div className="absolute top-4 left-4 flex flex-wrap gap-2">
          {car.featured && (
            <span className="bg-[#111111] text-white text-[10px] font-extrabold px-3 py-1.5 uppercase tracking-[0.12em] rounded-full">
              Featured
            </span>
          )}
          {car.badges?.slice(0, 1).map((b) => (
            <span key={b} className={`text-[10px] font-extrabold px-3 py-1.5 rounded-full backdrop-blur-md ${BADGE_OPTIONS[b]?.color || "bg-white/90 text-slate-700"}`}>
              {b}
            </span>
          ))}
        </div>

        {dist !== null && (
          <span className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md text-slate-900 text-[10px] font-extrabold px-3 py-1.5 rounded-full border border-white">
            {dist}km away
          </span>
        )}
      </Link>

      <div className="p-6 flex flex-col flex-1 gap-4">
        <div className="space-y-3">
          <div className="flex items-baseline gap-2">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-500">{car.year}</p>
            <Link href={`/cars/${car.id}`} className="font-bold text-slate-900 text-base sm:text-lg leading-tight group-hover:text-[#ff5a2f] transition-colors font-serif">
              {title}
            </Link>
          </div>
          
          <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">
            {car.description || `${car.make} ${car.model} - A quality ${car.bodyType?.toLowerCase() || 'vehicle'} with ${car.fuelType?.toLowerCase()} engine and ${car.transmission?.toLowerCase()} transmission.`}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {car.bodyType && <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full uppercase tracking-wide">{car.bodyType.replace(/_/g, ' ')}</span>}
          {car.fuelType && <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full uppercase tracking-wide">{car.fuelType}</span>}
          {car.mileage && <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full uppercase tracking-wide">{Math.round(car.mileage)}km</span>}
        </div>

        <div className="mt-auto flex items-end justify-between pt-4 border-t border-slate-200 gap-3">
          <div>
            <p className="text-[10px] font-medium text-slate-500 mb-1">Price</p>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-slate-900">KSh {(car.price / 1000000).toFixed(1)}M</p>
          </div>
          <div className="flex items-center gap-2">
            <CompareButton car={compareCar} />
            {car.dealer?.whatsapp && (
              <a
                href={whatsappLink(car.dealer.whatsapp, title, car.dealer.name)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 shrink-0 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-colors inline-flex items-center justify-center"
                aria-label="Chat dealer on WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
