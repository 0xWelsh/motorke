// src/app/cars/page.js
import { db } from "@/lib/db";
import { formatPrice, formatMileage, BODY_TYPE_LABELS, FUEL_LABELS } from "@/lib/utils";
import Link from "next/link";
import { CompareButton } from "@/components/CompareSelector";

export const metadata = { title: "Browse Cars — Motorke Kenya" };

export default async function CarsPage({ searchParams }) {
  const page     = parseInt(searchParams.page || "1");
  const limit    = 12;
  const search   = searchParams.search || "";
  const make     = searchParams.make || "";
  const bodyType = searchParams.bodyType || "";
  const fuelType = searchParams.fuelType || "";
  const minPrice = searchParams.minPrice ? parseInt(searchParams.minPrice) : undefined;
  const maxPrice = searchParams.maxPrice ? parseInt(searchParams.maxPrice) : undefined;

  const where = {
    available: true,
    ...(make     && { make:     { equals: make,     mode: "insensitive" } }),
    ...(bodyType && { bodyType: { equals: bodyType } }),
    ...(fuelType && { fuelType: { equals: fuelType } }),
    ...(minPrice || maxPrice ? { price: { ...(minPrice && { gte: minPrice }), ...(maxPrice && { lte: maxPrice }) } } : {}),
    ...(search && {
      OR: [
        { make:  { contains: search, mode: "insensitive" } },
        { model: { contains: search, mode: "insensitive" } },
        { variant: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const [cars, total] = await Promise.all([
    db.car.findMany({
      where,
      include: {
        images:  { where: { isPrimary: true }, take: 1 },
        dealer:  { select: { id: true, name: true, slug: true, location: true, verified: true } },
      },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      skip:  (page - 1) * limit,
      take:  limit,
    }),
    db.car.count({ where }),
  ]);

  const pages = Math.ceil(total / limit);

  // Unique makes for filter
  const allMakes = await db.car.findMany({
    where:    { available: true },
    distinct: ["make"],
    select:   { make: true },
    orderBy:  { make: "asc" },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-black mb-2">Browse cars</h1>
        <p className="text-white/40">{total} cars from dealerships across Kenya</p>
      </div>

      {/* Filters */}
      <form method="GET" className="flex flex-wrap gap-3 mb-10 p-5 bg-white/5 border border-white/10 rounded-2xl">
        <input
          name="search"
          defaultValue={search}
          placeholder="Search make or model…"
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-[#f97316]/50 min-w-[180px]"
        />
        <select name="make" defaultValue={make}
          className="bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/70 outline-none focus:border-[#f97316]/50">
          <option value="">All makes</option>
          {allMakes.map((m) => (
            <option key={m.make} value={m.make}>{m.make}</option>
          ))}
        </select>
        <select name="bodyType" defaultValue={bodyType}
          className="bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/70 outline-none focus:border-[#f97316]/50">
          <option value="">All types</option>
          {Object.entries(BODY_TYPE_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
        <select name="fuelType" defaultValue={fuelType}
          className="bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/70 outline-none focus:border-[#f97316]/50">
          <option value="">All fuels</option>
          {Object.entries(FUEL_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
        <select name="minPrice" defaultValue={searchParams.minPrice || ""}
          className="bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/70 outline-none focus:border-[#f97316]/50">
          <option value="">Min price</option>
          {[500000,1000000,2000000,3000000,5000000].map(p => (
            <option key={p} value={p}>KSh {(p/1000000).toFixed(1)}M</option>
          ))}
        </select>
        <select name="maxPrice" defaultValue={searchParams.maxPrice || ""}
          className="bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/70 outline-none focus:border-[#f97316]/50">
          <option value="">Max price</option>
          {[1000000,2000000,3000000,5000000,8000000,15000000].map(p => (
            <option key={p} value={p}>KSh {(p/1000000).toFixed(1)}M</option>
          ))}
        </select>
        <button type="submit"
          className="bg-[#f97316] hover:bg-[#ea6c0b] text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors">
          Filter
        </button>
        {(search || make || bodyType || fuelType) && (
          <a href="/cars" className="flex items-center text-sm text-white/40 hover:text-white transition-colors px-2">
            Clear ×
          </a>
        )}
      </form>

      {/* Grid */}
      {cars.length === 0 ? (
        <div className="text-center py-24 text-white/30">
          <p className="text-5xl mb-4">🔍</p>
          <p className="text-lg">No cars match your filters</p>
          <a href="/cars" className="mt-4 inline-block text-[#f97316] text-sm">Clear filters</a>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {cars.map((car) => {
            const img   = car.images[0]?.url;
            const title = `${car.year} ${car.make} ${car.model}`;
            return (
              <Link key={car.id} href={`/cars/${car.id}`}
                className="card-hover block bg-[#1a1a1a] border border-white/10 hover:border-[#f97316]/30 rounded-2xl overflow-hidden transition-all">
                <div className="relative aspect-[16/10] bg-white/5">
                  {img
                    ? <img src={img} alt={title} className="w-full h-full object-cover" />
                    : <div className="flex items-center justify-center h-full text-4xl">🚗</div>
                  }
                  {car.featured && (
                    <span className="absolute top-2 left-2 text-[10px] font-bold bg-[#f97316] text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Featured
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <p className="font-bold text-sm leading-snug">{title}</p>
                  {car.variant && <p className="text-xs text-white/40 mt-0.5 truncate">{car.variant}</p>}
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <span className="text-[10px] bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-white/50">{car.transmission}</span>
                    <span className="text-[10px] bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-white/50">{FUEL_LABELS[car.fuelType]}</span>
                    {car.mileage && <span className="text-[10px] bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-white/50">{formatMileage(car.mileage)}</span>}
                  </div>
                  <div className="flex items-end justify-between mt-3">
                    <p className="text-base font-black text-[#f97316]">{formatPrice(car.price)}</p>
                    <p className="text-[10px] text-white/30 text-right truncate max-w-[100px]">{car.dealer?.name}</p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <CompareButton carId={car.id} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex justify-center gap-2 mt-12">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <a
              key={p}
              href={`/cars?page=${p}&search=${search}&make=${make}&bodyType=${bodyType}&fuelType=${fuelType}`}
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-semibold transition-colors ${
                p === page
                  ? "bg-[#f97316] text-white"
                  : "bg-white/5 border border-white/10 text-white/50 hover:text-white"
              }`}
            >
              {p}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
