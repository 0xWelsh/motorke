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
import { getSession } from "@/lib/auth";


export const metadata = { title: "Inventory — Welsh Motors Standard" };

function distance(lat1, lng1, lat2, lng2) {
  if ([lat1, lng1, lat2, lng2].some((value) => value == null || Number.isNaN(value))) return 9999;
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

const COUNTIES = ["Nairobi","Mombasa","Nakuru","Kisumu","Uasin Gishu","Kiambu","Machakos","Meru"];

function normalizeText(value = "") {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshtein(a = "", b = "") {
  const s = String(a);
  const t = String(b);
  if (!s.length) return t.length;
  if (!t.length) return s.length;
  const dp = Array.from({ length: t.length + 1 }, (_, i) => i);
  for (let i = 1; i <= s.length; i += 1) {
    let prev = i - 1;
    dp[0] = i;
    for (let j = 1; j <= t.length; j += 1) {
      const temp = dp[j];
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;
      dp[j] = Math.min(
        dp[j] + 1,
        dp[j - 1] + 1,
        prev + cost
      );
      prev = temp;
    }
  }
  return dp[t.length];
}

function getSearchScore(car, searchTokens = []) {
  if (!searchTokens.length) return 0;
  const haystack = normalizeText(
    `${car.make || ""} ${car.model || ""} ${car.variant || ""} ${car.dealer?.name || ""}`
  );
  const words = haystack.split(" ").filter(Boolean);
  let totalScore = 0;

  for (const token of searchTokens) {
    if (!token) continue;
    let best = 0;
    for (const word of words) {
      if (!word) continue;
      if (word.includes(token) || token.includes(word)) {
        best = Math.max(best, 1);
        continue;
      }
      const lenGap = Math.abs(word.length - token.length);
      if (lenGap > 1) continue;
      const dist = levenshtein(word, token);
      if (dist <= 1) best = Math.max(best, 0.82);
      else if (dist === 2 && token.length >= 6) best = Math.max(best, 0.68);
    }
    totalScore += best;
  }

  return totalScore / searchTokens.length;
}

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
  const session = await getSession();
  const savedLat = session?.user?.lat ?? null;
  const savedLng = session?.user?.lng ?? null;
  const effectiveLat = userLat ?? savedLat;
  const effectiveLng = userLng ?? savedLng;

  const searchTokens = normalizeText(search).split(" ").filter(Boolean);
  const where = {
    available: true,
    ...(make         && { make: { equals: make, mode: "insensitive" } }),
    ...(model        && { model: { equals: model, mode: "insensitive" } }),
    ...(steering     && { steering }),
    ...(minYOM || maxYOM ? { year: { ...(minYOM && { gte: minYOM }), ...(maxYOM && { lte: maxYOM }) } } : {}),
    ...(bodyType     && { bodyType }),
    ...(fuelType     && { fuelType }),
    ...(transmission && { transmission }),
    ...(minPrice || maxPrice ? { price: { ...(minPrice && { gte: minPrice }), ...(maxPrice && { lte: maxPrice }) } } : {}),
    ...(county       && { dealer: { county: { equals: county, mode: "insensitive" } } }),
  };

  const orderBy =
    sort === "price_asc" ? [{ price: "asc" }] :
    sort === "price_desc" ? [{ price: "desc" }] :
    sort === "mileage_asc" ? [{ mileage: "asc" }] :
    sort === "year_desc" ? [{ year: "desc" }] :
    [
      { featuredWeight: "desc" },
      { dealer: { featured: "desc" } },
      { dealer: { verified: "desc" } },
      { dealer: { boostScore: "desc" } },
      { views: "desc" },
      { createdAt: "desc" }
    ];

  const carSelect = {
    id: true,
    make: true,
    model: true,
    variant: true,
    year: true,
    price: true,
    engineCC: true,
    mileage: true,
    bodyType: true,
    fuelType: true,
    transmission: true,
    featured: true,
    featuredWeight: true,
    views: true,
    createdAt: true,
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
  };

  const [rawCars, totalFromDb, allMakes] = await Promise.all([
    db.car.findMany({
      where,
      select: carSelect,
      orderBy,
      ...(searchTokens.length > 0
        ? { take: 500 }
        : { skip: (page - 1) * limit, take: limit }),
    }),
    db.car.count({ where }),
    getAllMakes(),
  ]);

  const searchMatchedCars = searchTokens.length > 0
    ? rawCars
        .map((car) => ({ car, searchScore: getSearchScore(car, searchTokens) }))
        .filter((item) => item.searchScore >= 0.6)
        .sort((a, b) => b.searchScore - a.searchScore)
        .map((item) => item.car)
    : rawCars;
  const total = searchTokens.length > 0 ? searchMatchedCars.length : totalFromDb;
  const cars = searchTokens.length > 0
    ? searchMatchedCars.slice((page - 1) * limit, page * limit)
    : searchMatchedCars;

  const sortedCars = sort === "newest"
    ? [...cars].sort((a, b) => {
        const distanceA = effectiveLat != null && effectiveLng != null
          ? distance(effectiveLat, effectiveLng, a.dealer?.lat, a.dealer?.lng)
          : null;
        const distanceB = effectiveLat != null && effectiveLng != null
          ? distance(effectiveLat, effectiveLng, b.dealer?.lat, b.dealer?.lng)
          : null;
        const distanceScore = (d) => (d == null || !Number.isFinite(d) ? 0 : Math.max(0, 20 - Math.min(20, d)));
        const freshnessScore = (createdAt) => {
          const days = Math.max(0, (Date.now() - new Date(createdAt).getTime()) / 86400000);
          return Math.max(0, 20 - Math.min(20, days));
        };
        const rankScore = (car, d) =>
          (Number(car.featuredWeight || 0) * 6) +
          (car.dealer?.featured ? 22 : 0) +
          (car.dealer?.verified ? 8 : 0) +
          Math.min(Number(car.dealer?.boostScore || 0), 30) +
          Math.min(Number(car.views || 0) / 25, 12) +
          freshnessScore(car.createdAt) +
          distanceScore(d);
        return rankScore(b, distanceB) - rankScore(a, distanceA);
      })
    : cars;
  const carsWithDistance = sortedCars.map((car) => ({
    ...car,
    distanceValue:
      effectiveLat != null && effectiveLng != null && car.dealer?.lat != null && car.dealer?.lng != null
        ? distance(effectiveLat, effectiveLng, car.dealer.lat, car.dealer.lng)
        : null,
  }));
  const topCars = carsWithDistance.slice(0, 6);
  const lowerCars = carsWithDistance.slice(6);

  const totalPages = Math.ceil(total / limit);

  const getPageLink = (p) => {
    const params = new URLSearchParams(sp);
    params.set("page", p);
    return `/cars?${params.toString()}`;
  };

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="w-full px-4 sm:px-8 pt-32 sm:pt-40">
        
        {/* Compact breadcrumb strip */}
        <div className="flex items-center justify-between mb-6 gap-4 border-b border-slate-100 dark:border-zinc-900 pb-3">
          <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.18em] text-[#718096] dark:text-slate-400">
            <Link href="/" className="hover:text-[#111827] dark:hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/cars" className="hover:text-[#111827] dark:hover:text-white transition-colors">Vehicles</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-[#111827] dark:text-white">Available</span>
          </div>
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[#718096] dark:text-slate-400 whitespace-nowrap">
            Vehicles Showing ({total})
          </div>
        </div>

        {/* Main layout: sidebar + top rows */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-x-4 gap-y-10">
          {/* Sidebar */}
          <div id="cars-filter-sidebar" className="self-start lg:col-span-1">
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
          </div>

          {/* Top two rows: 3 columns beside sidebar */}
          <div className="min-w-0 lg:col-span-3">
            {sortedCars.length === 0 && (
              <div className="py-32 text-center bg-[#F7FAFC] dark:bg-[#111111] border border-[#EDF2F7] dark:border-slate-800" style={{ borderRadius: 'var(--radius)' }}>
                <Search className="w-12 h-12 text-[#CBD5E0] dark:text-slate-700 mx-auto mb-6" />
                <h2 className="text-2xl font-bold text-[#111827] dark:text-white mb-2">No matches found</h2>
                <p className="text-[#718096] dark:text-slate-400 font-medium mb-8">Try adjusting your filters or resetting your search.</p>
                <Link href="/cars" className="inline-flex bg-[#111827] dark:bg-white dark:text-[#111827] text-white px-8 py-3 text-xs font-bold uppercase tracking-widest" style={{ borderRadius: 'var(--radius)' }}>
                  Clear All Filters
                </Link>
              </div>
            )}
            {topCars.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {topCars.map((car) => (
                  <CarCard key={`top-${car.id}`} car={car} distance={car.distanceValue ?? null} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Row 3 onward: full width under sidebar, 4 columns on desktop */}
        {lowerCars.length > 0 && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {lowerCars.map((car) => (
              <CarCard key={`lower-${car.id}`} car={car} distance={car.distanceValue ?? null} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-20 flex justify-center items-center gap-2 border-t border-slate-100 pt-10">
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
  );
}
