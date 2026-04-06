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
      include: {
        images: { where: { isPrimary: true }, take: 1 },
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
    <div className="min-h-screen">
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
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 mb-3 rounded-full border border-[#e7e1d8] bg-white px-3 py-1.5">
              <span className="h-2 w-2 rounded-full bg-[#ff5a2f] animate-pulse" />
              <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-500">Live Cars</span>
            </div>
            <h1 className="text-4xl md:text-5xl text-slate-900 tracking-tight">
              {search ? `Results for ${search}` : county ? `${county} Inventory` : "Explore Cars"}
            </h1>
            <p className="text-base md:text-lg text-slate-600 font-medium mt-2">
              {total.toLocaleString()} active listings from verified dealerships.
            </p>
          </div>
          <div className="hidden md:flex items-center gap-3 rounded-full border border-[#e7e1d8] bg-white px-4 py-2 shadow-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-600">Dealer-Verified Listings</p>
          </div>
        </div>

        {activeFilterPills.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {activeFilterPills.map((pill) => (
              <span key={pill} className="rounded-full border border-[#e7e1d8] bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-600">
                {pill}
              </span>
            ))}
          </div>
        )}

        {sortedCars.length === 0 ? (
          <div className="py-32 text-center border border-[#e7e1d8] rounded-[2rem] bg-white shadow-sm">
            <div className="w-20 h-20 bg-[#faf7f2] rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Search className="w-8 h-8 text-slate-300" />
            </div>
            <h2 className="text-2xl text-slate-900 mb-3">No cars match these filters</h2>
            <p className="text-base text-slate-600 font-medium mb-8 max-w-md mx-auto">Try broadening your search or resetting filters.</p>
            <Link href="/cars" className="mk-pill-btn inline-flex items-center gap-2 bg-[#111111] hover:bg-[#ff5a2f] text-white px-6 py-3 text-xs uppercase transition-colors">
              Reset Search <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedCars.map((car, idx) => (
              <InventoryCard key={car.id} car={car} userLat={userLat} userLng={userLng} priority={idx < 4} />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-3 mt-16">
            {page > 1 && (
              <Link href={getPageLink(page - 1)} className="w-11 h-11 rounded-full flex items-center justify-center bg-white border border-[#e7e1d8] text-slate-500 hover:text-black hover:bg-[#faf7f2] transition-all shadow-sm">
                <ChevronRight className="w-5 h-5 rotate-180" />
              </Link>
            )}

            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                if (p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1)) {
                  return (
                    <Link key={p}
                      href={getPageLink(p)}
                      className={`w-11 h-11 rounded-full flex items-center justify-center text-xs font-extrabold transition-all ${
                        p === page 
                          ? "bg-[#111111] text-white shadow-md" 
                          : "bg-white border border-[#e7e1d8] text-slate-600 hover:bg-[#faf7f2] shadow-sm"
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
              <Link href={getPageLink(page + 1)} className="w-11 h-11 rounded-full flex items-center justify-center bg-white border border-[#e7e1d8] text-slate-500 hover:text-black hover:bg-[#faf7f2] transition-all shadow-sm">
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
    <article className="group block bg-white border border-[#e8e2d9] hover:border-[#d8cec1] rounded-3xl overflow-hidden transition-all duration-500 hover:shadow-xl shadow-sm flex flex-col h-full">
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
            <span className="bg-[#111111] text-white text-[10px] font-extrabold px-3 py-1.5 uppercase tracking-[0.12em] rounded-full shadow-sm">
              Featured
            </span>
          )}
          {car.badges?.slice(0, 1).map((b) => (
            <span key={b} className={`text-[10px] font-extrabold px-3 py-1.5 rounded-full shadow-sm backdrop-blur-md ${BADGE_OPTIONS[b]?.color || "bg-white/90 text-slate-700"}`}>
              {b}
            </span>
          ))}
        </div>

        {dist !== null && (
          <span className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md text-slate-900 text-[10px] font-extrabold px-3 py-1.5 rounded-full border border-white shadow-sm">
            {dist}km away
          </span>
        )}
      </Link>

      <div className="p-6 flex flex-col flex-1 gap-4">
        <div className="flex items-center justify-between gap-3">
          <Link href={`/dealers/${car.dealer?.slug}`} className="inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-500 hover:text-black">
            {car.dealer?.verified && <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />}
            <span className="truncate max-w-[150px]">{car.dealer?.name}</span>
          </Link>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] inline-flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {car.dealer?.county || car.dealer?.location}
          </span>
        </div>

        <Link href={`/cars/${car.id}`} className="space-y-1.5">
          <h3 className="font-bold text-slate-900 text-lg leading-snug line-clamp-2 group-hover:text-black transition-colors">
            {title}
          </h3>
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-[0.08em]">{car.year}</p>
        </Link>

        <div className="flex flex-wrap gap-2">
          {specs.slice(0, 4).map((s) => (
            <span key={s} className="text-[11px] font-semibold text-slate-600 bg-[#faf7f2] border border-[#efe8df] px-2.5 py-1 rounded-full">
              {s}
            </span>
          ))}
        </div>

        <div className="mt-auto space-y-3 pt-4 border-t border-[#efe8df]">
          <div className="flex items-end justify-between">
            <p className="text-2xl font-bold text-slate-900 leading-none">{formatPrice(car.price)}</p>
            <Link href={`/cars/${car.id}`} className="mk-pill-btn inline-flex items-center gap-1.5 border border-[#e7e1d8] bg-white px-3 py-2 text-[10px] uppercase text-slate-700 hover:bg-[#faf7f2]">
              Details <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex items-center justify-between gap-2">
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
