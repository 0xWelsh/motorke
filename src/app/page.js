// src/app/page.js
import { db } from "@/lib/db";
import { formatPrice, formatMileage, BODY_TYPE_LABELS } from "@/lib/utils";
import Link from "next/link";

async function getHomepageData() {
  if (!process.env.DATABASE_URL) {
    return {
      featuredCars: [],
      dealers: [],
      totalCars: 0,
      databaseUnavailable: true,
    };
  }

  try {
    const [featuredCars, dealers, totalCars] = await Promise.all([
      db.car.findMany({
        where:   { available: true, featured: true },
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          dealer: { select: { name: true, location: true, verified: true } },
        },
        take:    6,
        orderBy: { createdAt: "desc" },
      }),
      db.dealer.findMany({
        where:   { featured: true },
        include: { _count: { select: { cars: { where: { available: true } } } } },
        take:    5,
      }),
      db.car.count({ where: { available: true } }),
    ]);

    return {
      featuredCars,
      dealers,
      totalCars,
      databaseUnavailable: false,
    };
  } catch (error) {
    console.error("Failed to load homepage data:", error);

    return {
      featuredCars: [],
      dealers: [],
      totalCars: 0,
      databaseUnavailable: true,
    };
  }
}

export default async function HomePage() {
  const { featuredCars, dealers, totalCars, databaseUnavailable } = await getHomepageData();

  const makes = ["Toyota", "Subaru", "Mazda", "Mitsubishi", "Nissan", "Honda"];

  return (
    <div>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden px-4 pt-24 pb-20">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto text-center relative">
          {databaseUnavailable && (
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-1.5 text-sm text-amber-300 mb-6">
              Database not configured yet. Set <code>DATABASE_URL</code> to load live listings.
            </div>
          )}
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-sm text-white/60 mb-6">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            {totalCars} cars listed across Kenya
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight tracking-tight">
            Find your car.<br />
            <span className="text-[#f97316]">Compare dealers.</span><br />
            Drive away.
          </h1>
          <p className="text-lg text-white/50 max-w-xl mx-auto mb-10">
            Kenya's first platform to compare cars across multiple dealerships — Nairobi, Mombasa, Nakuru and beyond.
          </p>

          {/* Search bar */}
          <form action="/cars" method="GET" className="max-w-2xl mx-auto">
            <div className="flex gap-2 bg-white/5 border border-white/10 rounded-2xl p-2">
              <input
                name="search"
                placeholder="Search by make, model or keyword…"
                className="flex-1 bg-transparent px-4 py-3 text-white placeholder-white/30 outline-none text-sm"
              />
              <button
                type="submit"
                className="bg-[#f97316] hover:bg-[#ea6c0b] text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
              >
                Search
              </button>
            </div>
          </form>

          {/* Quick filters */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {makes.map((make) => (
              <a
                key={make}
                href={`/cars?make=${make}`}
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white rounded-full px-4 py-1.5 text-sm transition-all"
              >
                {make}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section className="border-y border-white/10 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-3xl font-black text-[#f97316]">{totalCars}+</div>
            <div className="text-sm text-white/40 mt-1">Cars listed</div>
          </div>
          <div>
            <div className="text-3xl font-black text-[#f97316]">{dealers.length}+</div>
            <div className="text-sm text-white/40 mt-1">Dealerships</div>
          </div>
          <div>
            <div className="text-3xl font-black text-[#f97316]">5</div>
            <div className="text-sm text-white/40 mt-1">Counties</div>
          </div>
        </div>
      </section>

      {/* ── Featured Cars ── */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black">Featured cars</h2>
          <Link href="/cars" className="text-[#f97316] hover:text-orange-400 text-sm font-medium transition-colors">
            View all →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {featuredCars.map((car) => (
            <CarCard key={car.id} car={car} />
          ))}
          {featuredCars.length === 0 && (
            <div className="col-span-full rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-sm text-white/50">
              Featured cars will appear here once the database is connected and listings are available.
            </div>
          )}
        </div>
      </section>

      {/* ── Browse by body type ── */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-black mb-6">Browse by type</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {[
            { type: "SUV",     icon: "🚙", label: "SUVs" },
            { type: "SEDAN",   icon: "🚗", label: "Sedans" },
            { type: "PICKUP",  icon: "🛻", label: "Pickups" },
            { type: "HATCHBACK", icon: "🚘", label: "Hatchbacks" },
            { type: "WAGON",   icon: "🚐", label: "Wagons" },
          ].map(({ type, icon, label }) => (
            <Link
              key={type}
              href={`/cars?bodyType=${type}`}
              className="card-hover flex flex-col items-center gap-2 bg-white/5 border border-white/10 hover:border-[#f97316]/40 rounded-2xl p-6 transition-all"
            >
              <span className="text-3xl">{icon}</span>
              <span className="text-sm font-semibold text-white/80">{label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Dealers ── */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black">Top dealerships</h2>
          <Link href="/dealers" className="text-[#f97316] hover:text-orange-400 text-sm font-medium transition-colors">
            All dealers →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {dealers.map((dealer) => (
            <Link
              key={dealer.id}
              href={`/dealers/${dealer.slug}`}
              className="card-hover flex items-center gap-4 bg-white/5 border border-white/10 hover:border-[#f97316]/30 rounded-2xl p-5 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-[#f97316]/20 flex items-center justify-center text-[#f97316] font-black text-lg flex-shrink-0">
                {dealer.name[0]}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm truncate">{dealer.name}</p>
                  {dealer.verified && (
                    <span className="text-[10px] bg-green-500/20 text-green-400 border border-green-500/30 rounded-full px-2 py-0.5 flex-shrink-0">✓ Verified</span>
                  )}
                </div>
                <p className="text-xs text-white/40 mt-0.5">{dealer.location}</p>
                <p className="text-xs text-[#f97316] mt-1">{dealer._count.cars} cars available</p>
              </div>
            </Link>
          ))}
          {dealers.length === 0 && (
            <div className="col-span-full rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-sm text-white/50">
              Featured dealerships will appear here after dealer records are available.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

// ── Car Card Component ──────────────────────────────────────
function CarCard({ car }) {
  const img = car.images[0]?.url;
  const title = `${car.year} ${car.make} ${car.model}`;

  return (
    <Link href={`/cars/${car.id}`} className="card-hover block bg-[#1a1a1a] border border-white/10 hover:border-[#f97316]/30 rounded-2xl overflow-hidden transition-all">
      <div className="relative aspect-[16/10] bg-white/5">
        {img ? (
          <img src={img} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full text-4xl">🚗</div>
        )}
        {car.featured && (
          <span className="absolute top-3 left-3 text-[10px] font-bold bg-[#f97316] text-white px-2.5 py-1 rounded-full uppercase tracking-wider">
            Featured
          </span>
        )}
        <span className="absolute top-3 right-3 text-[10px] font-semibold bg-black/60 backdrop-blur-sm text-white/80 px-2.5 py-1 rounded-full capitalize">
          {BODY_TYPE_LABELS[car.bodyType] || car.bodyType}
        </span>
      </div>
      <div className="p-4">
        <p className="font-bold text-white leading-snug">{title}</p>
        {car.variant && <p className="text-xs text-white/40 mt-0.5">{car.variant}</p>}
        <div className="flex items-center gap-3 mt-3 text-xs text-white/40">
          <span>{car.transmission}</span>
          <span>·</span>
          <span>{car.fuelType}</span>
          {car.mileage && <><span>·</span><span>{formatMileage(car.mileage)}</span></>}
        </div>
        <div className="flex items-center justify-between mt-4">
          <p className="text-lg font-black text-[#f97316]">{formatPrice(car.price)}</p>
          <div className="text-right">
            <p className="text-[11px] text-white/50 truncate max-w-[120px]">{car.dealer?.name}</p>
            <p className="text-[10px] text-white/30">{car.dealer?.location}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
