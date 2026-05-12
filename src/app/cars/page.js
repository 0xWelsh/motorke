// src/app/cars/page.js
import { db } from "@/lib/db";
import { formatPrice, formatCarPrice, formatMileage, whatsappLink } from "@/lib/utils";
import { BODY_TYPE_LABELS, FUEL_LABELS, BADGE_OPTIONS } from "@/lib/constants";
import Link from "next/link";
import { ChevronRight, Search, Sparkles } from "lucide-react";
import Image from "next/image";
import CarsSearch from "@/components/CarsSearch";
import CarCard from "@/components/CarCard";
import CarsQuickActions from "@/components/CarsQuickActions";
import TrackEventOnMount from "@/components/TrackEventOnMount";
import { unstable_cache } from "next/cache";
import { cookies, headers } from "next/headers";
import { getSession } from "@/lib/auth";
import { PUBLIC_ONLY_VERIFIED_DEALERS } from "@/lib/feature-flags";
import { isSearchBot, rotationSeed, sortByTierAndSeed } from "@/lib/shuffle";


export const metadata = {
  title: "Browse cars for sale in Kenya",
  description:
    "Search verified cars for sale across Kenya. Filter by make, price, body type, county, and dealership. Compare listings and contact dealers on Welsh Motorhub.",
  alternates: { canonical: "/cars" },
  keywords: [
    "used cars Kenya",
    "cars Nairobi",
    "car inventory Kenya",
    "vehicle search",
    "Welsh Motorhub cars",
  ],
  openGraph: {
    title: "Browse cars for sale in Kenya | Welsh Motorhub",
    description:
      "Verified vehicle inventory from trusted Kenyan dealers. Smart filters, transparent pricing context, and dealer contact in one place.",
    type: "website",
    url: "/cars",
  },
};

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

function median(values = []) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

function normalizeCounter(items = []) {
  return items.reduce((acc, value) => {
    if (!value) return acc;
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
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

const defaultCarsSelect = {
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
      featured: true,
      boostScore: true,
    },
  },
};

const getDefaultCarsPage = unstable_cache(
  async () => {
    const where = {
      available: true,
      ...(PUBLIC_ONLY_VERIFIED_DEALERS && { dealer: { verified: true } }),
    };
    const orderBy = [
      { featuredWeight: "desc" },
      { dealer: { featured: "desc" } },
      { dealer: { verified: "desc" } },
      { dealer: { boostScore: "desc" } },
      { views: "desc" },
      { createdAt: "desc" },
    ];

    const [cars, total] = await Promise.all([
      db.car.findMany({
        where,
        select: defaultCarsSelect,
        orderBy,
        take: 14,
      }),
      db.car.count({ where }),
    ]);

    return { cars, total };
  },
  ["cars-default-page-v1"],
  { revalidate: 60, tags: ["cars-listing"] }
);

// Allowed per-page sizes. 14 is the design default (6 top tier + 8 below);
// 28/56/84 are 2x/4x/6x multiples so the grid still fills cleanly.
const PER_PAGE_OPTIONS = [14, 28, 56, 84];
const DEFAULT_PER_PAGE = 14;

export default async function CarsPage({ searchParams }) {
  const sp = await searchParams;
  const rawPage = Number.parseInt(sp.page || "1", 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const rawPerPage = Number.parseInt(sp.perPage || "", 10);
  const limit = PER_PAGE_OPTIONS.includes(rawPerPage) ? rawPerPage : DEFAULT_PER_PAGE;
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
  const userId = session?.user?.id;

  const searchTokens = normalizeText(search).split(" ").filter(Boolean).slice(0, 6);

  // Visitor-stable, day-rotating seed. Within each quality tier the
  // listing order is reshuffled per visitor so older cars get fair
  // exposure instead of living on page 7 forever. Search engine bots
  // skip the shuffle to keep the SEO surface consistent across crawls.
  const headerStore = await headers();
  const cookieStore = await cookies();
  const userAgent = headerStore.get("user-agent") || "";
  const ipHeader = headerStore.get("x-forwarded-for") || headerStore.get("x-real-ip") || "";
  const ip = ipHeader.split(",")[0]?.trim() || "0.0.0.0";
  const cookieRotationId = cookieStore.get("wmh-rot")?.value || null;
  const isBot = isSearchBot(userAgent);
  const seed = rotationSeed({ userId, cookieRotationId, ip, userAgent });

  // Rotation only applies to the unfiltered/text-free browse experience
  // on the default sort. Explicit sorts (price, year, mileage) and
  // typed searches stay deterministic so users see what they asked for.
  const wantsRotation = sort === "newest" && !searchTokens.length && !isBot;
  // Distance ranking re-orders results by proximity + freshness; that
  // would undo the seeded shuffle so we only run it when we are not
  // rotating (i.e. on searches that include "newest" sort).
  const shouldUseDistanceRanking = sort === "newest" && !wantsRotation;

  let effectiveLat = userLat;
  let effectiveLng = userLng;
  if (shouldUseDistanceRanking && (effectiveLat == null || effectiveLng == null)) {
    effectiveLat = effectiveLat ?? session?.user?.lat ?? null;
    effectiveLng = effectiveLng ?? session?.user?.lng ?? null;
  }

  const isDefaultFastPath =
    !search &&
    !make &&
    !model &&
    !steering &&
    !minYOM &&
    !maxYOM &&
    !bodyType &&
    !fuelType &&
    !transmission &&
    !county &&
    !minPrice &&
    !maxPrice &&
    sort === "newest" &&
    page === 1 &&
    isBot; // crawlers keep the cached, deterministic 14-card first page
  const where = {
    available: true,
    ...(PUBLIC_ONLY_VERIFIED_DEALERS && { dealer: { verified: true } }),
    ...(make         && { make: { equals: make, mode: "insensitive" } }),
    ...(model        && { model: { equals: model, mode: "insensitive" } }),
    ...(steering     && { steering }),
    ...(minYOM || maxYOM ? { year: { ...(minYOM && { gte: minYOM }), ...(maxYOM && { lte: maxYOM }) } } : {}),
    ...(bodyType     && { bodyType }),
    ...(fuelType     && { fuelType }),
    ...(transmission && { transmission }),
    ...(minPrice || maxPrice ? { price: { ...(minPrice && { gte: minPrice }), ...(maxPrice && { lte: maxPrice }) } } : {}),
    ...(county && {
      dealer: {
        ...(PUBLIC_ONLY_VERIFIED_DEALERS && { verified: true }),
        county: { equals: county, mode: "insensitive" },
      },
    }),
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
        featured: true,
        boostScore: true,
        lat: true,
        lng: true,
        county: true,
        whatsapp: true,
      },
    },
  };

  const ROTATION_POOL_SIZE = 600;
  const [carsData, allMakes, personalizedCarsRaw] = await Promise.all([
    isDefaultFastPath
      ? getDefaultCarsPage()
      : Promise.all([
          db.car.findMany({
            where,
            select: carSelect,
            orderBy,
            ...(searchTokens.length > 0
              ? { take: 300 }
              : wantsRotation
              ? { take: ROTATION_POOL_SIZE }
              : { skip: (page - 1) * limit, take: limit }),
          }),
          db.car.count({ where }),
        ]).then(([cars, total]) => ({ cars, total })),
    getAllMakes(),
    userId
      ? db.carView.findMany({
          where: { userId },
          select: {
            car: {
              select: {
                id: true,
                make: true,
                bodyType: true,
                fuelType: true,
                price: true,
                dealer: {
                  select: {
                    verified: true,
                    county: true,
                  },
                },
              },
            },
          },
          orderBy: { viewedAt: "desc" },
          take: 20,
        }).then(async (views) => {
          const recentCars = views.map((item) => item.car).filter(Boolean);
          if (!recentCars.length) return [];
          const makeCounts = normalizeCounter(recentCars.map((car) => car.make));
          const bodyCounts = normalizeCounter(recentCars.map((car) => car.bodyType));
          const fuelCounts = normalizeCounter(recentCars.map((car) => car.fuelType));
          const countyCounts = normalizeCounter(recentCars.map((car) => car.dealer?.county));
          const prices = recentCars.map((car) => Number(car.price)).filter((value) => Number.isFinite(value) && value > 0);
          const preferredPrice = median(prices);
          const verifiedViews = recentCars.filter((car) => car.dealer?.verified).length;
          const prefersVerified = verifiedViews / recentCars.length >= 0.55;
          const topMake = Object.keys(makeCounts).sort((a, b) => makeCounts[b] - makeCounts[a])[0];
          const topBody = Object.keys(bodyCounts).sort((a, b) => bodyCounts[b] - bodyCounts[a])[0];
          const topFuel = Object.keys(fuelCounts).sort((a, b) => fuelCounts[b] - fuelCounts[a])[0];
          const topCounty = Object.keys(countyCounts).sort((a, b) => countyCounts[b] - countyCounts[a])[0];

          const candidateCars = await db.car.findMany({
            where: {
              available: true,
              ...(PUBLIC_ONLY_VERIFIED_DEALERS && { dealer: { verified: true } }),
              ...(prefersVerified ? { dealer: { ...(PUBLIC_ONLY_VERIFIED_DEALERS ? { verified: true } : {}), verified: true } } : {}),
              ...(topMake || topBody || topFuel || topCounty
                ? {
                    OR: [
                      ...(topMake ? [{ make: { equals: topMake, mode: "insensitive" } }] : []),
                      ...(topBody ? [{ bodyType: topBody }] : []),
                      ...(topFuel ? [{ fuelType: topFuel }] : []),
                      ...(topCounty ? [{ dealer: { ...(PUBLIC_ONLY_VERIFIED_DEALERS ? { verified: true } : {}), county: { equals: topCounty, mode: "insensitive" } } }] : []),
                    ],
                  }
                : {}),
            },
            select: carSelect,
            orderBy: [{ createdAt: "desc" }],
            take: 36,
          });

          const scoreValue = (counts, key, maxWeight) => {
            if (!key || !counts[key]) return 0;
            return Math.min(maxWeight, counts[key] * maxWeight);
          };
          return candidateCars
            .map((car) => {
              const priceDistance =
                preferredPrice && Number.isFinite(car.price)
                  ? Math.abs(Number(car.price) - preferredPrice) / Math.max(preferredPrice, 1)
                  : 1;
              const priceScore = preferredPrice ? Math.max(0, 24 - Math.min(24, priceDistance * 100)) : 8;
              const countyScore = topCounty && car.dealer?.county === topCounty ? 10 : 0;
              const isNearUser =
                effectiveLat != null && effectiveLng != null && car.dealer?.lat != null && car.dealer?.lng != null;
              const distanceKm = isNearUser
                ? distance(effectiveLat, effectiveLng, car.dealer.lat, car.dealer.lng)
                : null;
              const distanceScore =
                distanceKm != null
                  ? Math.max(0, 14 - Math.min(14, distanceKm))
                  : 0;
              const verifiedScore = prefersVerified && car.dealer?.verified ? 10 : car.dealer?.verified ? 5 : 0;
              const affinityScore =
                scoreValue(makeCounts, car.make, 28) +
                scoreValue(bodyCounts, car.bodyType, 18) +
                scoreValue(fuelCounts, car.fuelType, 12);
              const freshness = Math.max(0, 8 - Math.min(8, (Date.now() - new Date(car.createdAt).getTime()) / 86400000));
              const reasons = [];
              if (makeCounts[car.make] >= 2) reasons.push(`You often view ${car.make}`);
              if (car.bodyType && bodyCounts[car.bodyType] >= 2) reasons.push(`Matches your ${BODY_TYPE_LABELS[car.bodyType] || car.bodyType} preference`);
              if (car.fuelType && fuelCounts[car.fuelType] >= 2) reasons.push(`Fuel choice: ${FUEL_LABELS[car.fuelType] || car.fuelType}`);
              if (preferredPrice && priceDistance <= 0.18) reasons.push("Within your usual price range");
              if (topCounty && car.dealer?.county === topCounty) reasons.push(`Popular in ${topCounty} for you`);
              if (distanceKm != null && distanceKm <= 25) reasons.push("Near your location");
              if (prefersVerified && car.dealer?.verified) reasons.push("From a verified dealer you prefer");
              if (!reasons.length && car.dealer?.verified) reasons.push("From a verified dealer");
              if (!reasons.length) reasons.push("Aligned with your recent browsing");
              return { car, score: affinityScore + priceScore + countyScore + distanceScore + verifiedScore + freshness, reasons };
            })
            .sort((a, b) => b.score - a.score)
            .map((item) => ({
              ...item.car,
              recommendationReasons: item.reasons.slice(0, 2),
            }))
            .slice(0, 10);
        })
      : Promise.resolve([]),
  ]);
  const rawCars = carsData.cars;
  const totalFromDb = carsData.total;

  const searchMatchedCars = searchTokens.length > 0
    ? rawCars
        .map((car) => ({ car, searchScore: getSearchScore(car, searchTokens) }))
        .filter((item) => item.searchScore >= 0.6)
        .sort((a, b) => b.searchScore - a.searchScore)
        .map((item) => item.car)
    : rawCars;
  const total = searchTokens.length > 0 ? searchMatchedCars.length : totalFromDb;
  // When rotation is active, sortByTierAndSeed re-orders the pool so
  // featured/verified cars still anchor the top but the rest cycle per
  // visitor/day. The DB returned up to ROTATION_POOL_SIZE rows in
  // quality order; we sort by (tier, seededRank) and then slice the
  // requested page locally.
  const cars = searchTokens.length > 0
    ? searchMatchedCars.slice((page - 1) * limit, page * limit)
    : wantsRotation
    ? sortByTierAndSeed(searchMatchedCars, seed).slice((page - 1) * limit, page * limit)
    : searchMatchedCars;

  const sortedCars = shouldUseDistanceRanking
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
  const visibleIds = new Set(carsWithDistance.map((car) => car.id));
  const personalizedCars = (personalizedCarsRaw || [])
    .filter((car) => !visibleIds.has(car.id))
    .slice(0, 4);
  const personalizedCarsWithDistance = personalizedCars.map((car) => ({
    ...car,
    distanceValue:
      effectiveLat != null && effectiveLng != null && car.dealer?.lat != null && car.dealer?.lng != null
        ? distance(effectiveLat, effectiveLng, car.dealer.lat, car.dealer.lng)
        : null,
  }));
  const topCars = carsWithDistance.slice(0, 6);
  const lowerCars = carsWithDistance.slice(6);

  // The rotation pool is capped (ROTATION_POOL_SIZE rows) so pagination
  // must stop at the last page that actually contains cars; otherwise
  // buyers can click into empty pages once the catalog grows past the
  // pool. Once the catalog regularly exceeds the pool we should switch
  // to a SQL-side seeded order, but for now this guard keeps the UX
  // honest.
  const navigableTotal = wantsRotation
    ? Math.min(total, searchMatchedCars.length)
    : total;
  const totalPages = Math.max(1, Math.ceil(navigableTotal / limit));
  const shownOnPageCount = sortedCars.length;
  const rangeStart = shownOnPageCount === 0 ? 0 : (page - 1) * limit + 1;
  const rangeEnd = (page - 1) * limit + shownOnPageCount;

  const getPageLink = (p) => {
    const params = new URLSearchParams(sp);
    params.set("page", p);
    return `/cars?${params.toString()}`;
  };

  // Per-page selector links — preserve every other filter / sort and
  // reset to page 1 because the row numbering changes with the new size.
  const getPerPageLink = (size) => {
    const params = new URLSearchParams(sp);
    if (size === DEFAULT_PER_PAGE) {
      params.delete("perPage");
    } else {
      params.set("perPage", String(size));
    }
    params.delete("page");
    const qs = params.toString();
    return qs ? `/cars?${qs}` : "/cars";
  };

  return (
    <div className="min-h-screen bg-white pb-20">
      <TrackEventOnMount
        name="cars_listing_view"
        payload={{
          search: search || "",
          make: make || "",
          body_type: bodyType || "",
          fuel_type: fuelType || "",
          transmission: transmission || "",
          county: county || "",
          sort: sort || "newest",
          page,
          result_count: total,
        }}
      />
      <div className="w-full px-4 sm:px-8 pt-3 sm:pt-4">
        
        {/* Compact breadcrumb strip */}
        <div className="flex items-center justify-between mb-6 gap-4 border-b border-slate-100 dark:border-zinc-900 pb-3">
          <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.18em] text-[#718096] dark:text-slate-400">
            <Link href="/" className="hover:text-[#111827] dark:hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/cars" className="hover:text-[#111827] dark:hover:text-white transition-colors">Vehicles</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-[#111827] dark:text-white">Available</span>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[#718096] dark:text-slate-400 whitespace-nowrap">
              {shownOnPageCount > 0
                ? <>Showing <span className="text-[#111827] dark:text-white">{rangeStart}–{rangeEnd}</span> of {total}</>
                : <>0 of {total}</>}
            </div>
            <p className="mt-1 text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
              Allow location to see nearest cars first.
            </p>
          </div>
        </div>

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 sm:gap-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#718096] dark:text-slate-400">
            Per page
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            {PER_PAGE_OPTIONS.map((size) => {
              const isActive = limit === size;
              return (
                <Link
                  key={size}
                  href={getPerPageLink(size)}
                  scroll={false}
                  prefetch={false}
                  aria-current={isActive ? "page" : undefined}
                  className={[
                    "px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] border transition-colors",
                    isActive
                      ? "bg-[#111827] text-white border-[#111827] dark:bg-white dark:text-[#111827] dark:border-white"
                      : "bg-white text-[#111827] border-[#EDF2F7] hover:border-[#111827] dark:bg-[#111111] dark:text-white dark:border-slate-800 dark:hover:border-white",
                  ].join(" ")}
                  style={{ borderRadius: "var(--radius)" }}
                >
                  {size}
                </Link>
              );
            })}
          </div>
        </div>

        <CarsQuickActions />

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
              initialLat={sp.lat || ""}
              initialLng={sp.lng || ""}
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
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
                {topCars.map((car) => (
                  <CarCard key={`top-${car.id}`} car={car} distance={car.distanceValue ?? null} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Row 3 onward: full width under sidebar, 4 columns on desktop */}
        {lowerCars.length > 0 && (
          <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            {lowerCars.map((car) => (
              <CarCard key={`lower-${car.id}`} car={car} distance={car.distanceValue ?? null} />
            ))}
          </div>
        )}

        {personalizedCarsWithDistance.length > 0 && (
          <section className="mt-8 border border-slate-200 bg-white p-4 sm:p-5" style={{ borderRadius: "var(--radius)" }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-[#2F855A]">
                  <Sparkles className="w-3.5 h-3.5" />
                  Personalized Feed
                </p>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Picked for you based on your browsing</h3>
              </div>
              <Link href="/cars?sort=views_desc" className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-600 hover:text-[#2F855A]">
                Explore more →
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
              {personalizedCarsWithDistance.map((car) => (
                <div key={`personal-${car.id}`} className="space-y-1.5">
                  <p className="text-[10px] font-black uppercase tracking-[0.11em] text-[#2F855A]">
                    {car.recommendationReasons?.[0] || "Picked for you"}
                  </p>
                  <details className="group">
                    <summary className="list-none inline-flex cursor-pointer items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.11em] text-slate-500 hover:text-slate-700">
                      <span>Why am I seeing this?</span>
                      <span className="transition-transform group-open:rotate-45">+</span>
                    </summary>
                    <div className="mt-1 border border-slate-200 bg-slate-50 p-2">
                      <ul className="space-y-1">
                        {(car.recommendationReasons?.length ? car.recommendationReasons : ["Aligned with your recent browsing"]).map((reason, idx) => (
                          <li key={`${car.id}-reason-${idx}`} className="text-[11px] font-semibold text-slate-600">
                            - {reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </details>
                  <CarCard car={car} distance={car.distanceValue ?? null} />
                </div>
              ))}
            </div>
          </section>
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
