import { db } from "@/lib/db";
import { requireDealer } from "@/lib/auth";
import Link from "next/link";
import Image from "next/image";
import { formatCarPrice } from "@/lib/utils";
import { BODY_TYPE_LABELS, FUEL_LABELS, TRANSMISSION_LABELS } from "@/lib/constants";
import InventoryToggle from "@/components/InventoryToggle";
import { 
  Plus, 
  Car as CarIcon, 
  ExternalLink, 
  Edit3, 
  EyeOff,
  MessageSquare,
} from "lucide-react";

export default async function InventoryPage({ searchParams }) {
  const user   = await requireDealer();
  const sp     = await searchParams;
  const filter = sp.filter || "all";
  const search = (sp.search || "").toString().trim();
  const make = (sp.make || "").toString().trim();
  const bodyType = (sp.bodyType || "").toString().trim();
  const fuelType = (sp.fuelType || "").toString().trim();
  const transmission = (sp.transmission || "").toString().trim();
  const minPrice = sp.minPrice ? Number.parseInt(sp.minPrice, 10) : null;
  const maxPrice = sp.maxPrice ? Number.parseInt(sp.maxPrice, 10) : null;
  const minYear = sp.minYear ? Number.parseInt(sp.minYear, 10) : null;
  const maxYear = sp.maxYear ? Number.parseInt(sp.maxYear, 10) : null;
  const sort = (sp.sort || "newest").toString();
  const searchYear = Number.parseInt(search, 10);

  const where = {
    dealerId: user.dealerId,
    ...(filter === "live"   && { available: true  }),
    ...(filter === "sold"   && { available: false }),
    ...(make && { make: { equals: make, mode: "insensitive" } }),
    ...(bodyType && { bodyType }),
    ...(fuelType && { fuelType }),
    ...(transmission && { transmission }),
    ...((minPrice || maxPrice)
      ? { price: { ...(minPrice ? { gte: minPrice } : {}), ...(maxPrice ? { lte: maxPrice } : {}) } }
      : {}),
    ...((minYear || maxYear)
      ? { year: { ...(minYear ? { gte: minYear } : {}), ...(maxYear ? { lte: maxYear } : {}) } }
      : {}),
    ...(search && {
      OR: [
        { make: { contains: search, mode: "insensitive" } },
        { model: { contains: search, mode: "insensitive" } },
        { variant: { contains: search, mode: "insensitive" } },
        ...(Number.isFinite(searchYear) ? [{ year: searchYear }] : []),
      ],
    }),
  };

  const cars = await db.car.findMany({
    where,
    include: {
      images: { where: { isPrimary: true }, take: 1 },
      _count: { select: { leads: true } },
    },
    orderBy:
      sort === "price_asc"
        ? { price: "asc" }
        : sort === "price_desc"
          ? { price: "desc" }
          : sort === "views_desc"
            ? { views: "desc" }
            : { createdAt: "desc" },
  });

  const [liveCount, soldCount, totalCount, filterData] = await Promise.all([
    db.car.count({ where: { dealerId: user.dealerId, available: true  } }),
    db.car.count({ where: { dealerId: user.dealerId, available: false } }),
    db.car.count({ where: { dealerId: user.dealerId } }),
    db.car.findMany({
      where: { dealerId: user.dealerId },
      select: { make: true, bodyType: true, fuelType: true, transmission: true, year: true },
      distinct: ["make", "bodyType", "fuelType", "transmission", "year"],
      orderBy: { make: "asc" },
    }),
  ]);

  const draftCount = soldCount;
  const makeOptions = [...new Set(filterData.map((item) => item.make).filter(Boolean))];
  const bodyOptions = [...new Set(filterData.map((item) => item.bodyType).filter(Boolean))];
  const fuelOptions = [...new Set(filterData.map((item) => item.fuelType).filter(Boolean))];
  const transmissionOptions = [...new Set(filterData.map((item) => item.transmission).filter(Boolean))];
  const yearOptions = [...new Set(filterData.map((item) => item.year).filter(Boolean))].sort((a, b) => b - a);
  const filterState = { filter, search, make, bodyType, fuelType, transmission, minPrice, maxPrice, minYear, maxYear, sort };
  const hasAdvancedFilters = Boolean(
    filterState.search ||
    filterState.make ||
    filterState.bodyType ||
    filterState.fuelType ||
    filterState.transmission ||
    filterState.minPrice ||
    filterState.maxPrice ||
    filterState.minYear ||
    filterState.maxYear ||
    filterState.sort !== "newest"
  );
  const preserveFilterHref = (nextFilter) => {
    const params = new URLSearchParams();
    params.set("filter", nextFilter);
    if (search) params.set("search", search);
    if (make) params.set("make", make);
    if (bodyType) params.set("bodyType", bodyType);
    if (fuelType) params.set("fuelType", fuelType);
    if (transmission) params.set("transmission", transmission);
    if (minPrice) params.set("minPrice", String(minPrice));
    if (maxPrice) params.set("maxPrice", String(maxPrice));
    if (minYear) params.set("minYear", String(minYear));
    if (maxYear) params.set("maxYear", String(maxYear));
    if (sort && sort !== "newest") params.set("sort", sort);
    return `/portal/inventory?${params.toString()}`;
  };
  const presetHref = (preset) => {
    const params = new URLSearchParams();
    params.set("filter", preset.filter || "all");
    if (preset.bodyType) params.set("bodyType", preset.bodyType);
    if (preset.minPrice) params.set("minPrice", String(preset.minPrice));
    if (preset.maxPrice) params.set("maxPrice", String(preset.maxPrice));
    if (preset.sort) params.set("sort", preset.sort);
    return `/portal/inventory?${params.toString()}`;
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:gap-8 mb-5 sm:mb-10">
        <div>
          <h1 className="text-xl sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-1 sm:mb-2\">Inventory</h1>
          {hasAdvancedFilters ? (
            <div className="mt-2 flex items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-blue-700">
                Filters active
              </span>
              <Link href="/portal/inventory?filter=all" className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-600 hover:text-slate-900">
                Clear
              </Link>
            </div>
          ) : null}
          {/* One-line stats (mobile stays horizontally aligned) */}
          <div className="mt-2 flex items-center gap-2 flex-nowrap overflow-x-auto pb-1">
            <span className="inline-flex items-center gap-2 rounded-2xl border border-[#ddd4c8] bg-white/70 dark:bg-[#111111] px-2.5 py-1.5 sm:px-3 sm:py-2">
              <span className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-600 dark:text-slate-300">Total</span>
              <span className="text-[12px] font-black tabular-nums text-slate-900 dark:text-white">{totalCount}</span>
            </span>
            <span className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 sm:px-3 sm:py-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-[#2F855A]" aria-hidden />
              <span className="text-[10px] font-black uppercase tracking-[0.12em] text-emerald-800">Live</span>
              <span className="text-[12px] font-black tabular-nums text-emerald-800">{liveCount}</span>
            </span>
            <span className="inline-flex items-center gap-2 rounded-2xl border border-[#ddd4c8] bg-white/70 dark:bg-[#111111] px-2.5 py-1.5 sm:px-3 sm:py-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-slate-400" aria-hidden />
              <span className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-600 dark:text-slate-300">Drafts</span>
              <span className="text-[12px] font-black tabular-nums text-slate-900 dark:text-white">{draftCount}</span>
            </span>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Link href="/portal/cars/new"
            className="flex items-center justify-center sm:justify-start gap-2 bg-[#2F855A] hover:bg-[#38A169] text-white text-[11px] uppercase font-black tracking-[0.15em] sm:text-[11px] uppercase font-black tracking-[0.10em] font-semibold px-4 sm:px-6 py-2.5 sm:py-2.5 rounded-2xl transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[4px_4px_0px_0px_rgba(0,0,0,0.05)]">
            <Plus size={16} className="sm:block hidden" />
            <Plus size={14} className="sm:hidden" /> Add Vehicle
          </Link>
        </div>
      </div>

      <form method="GET" className="mb-4 sm:mb-6 rounded-2xl border border-[#ddd4c8] bg-white p-2.5 sm:p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.04)]">
        <input type="hidden" name="filter" value={filter} />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-2">
          <input
            name="search"
            defaultValue={search}
            placeholder="Search make, model, year..."
            className="h-10 px-3 border border-[#ddd4c8] text-[12px] font-medium outline-none focus:border-[#2F855A]"
          />
          <select name="make" defaultValue={make} className="h-10 px-3 border border-[#ddd4c8] text-[12px] font-medium outline-none focus:border-[#2F855A]">
            <option value="">All makes</option>
            {makeOptions.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
          <select name="bodyType" defaultValue={bodyType} className="h-10 px-3 border border-[#ddd4c8] text-[12px] font-medium outline-none focus:border-[#2F855A]">
            <option value="">All body shapes</option>
            {bodyOptions.map((value) => <option key={value} value={value}>{BODY_TYPE_LABELS[value] || value}</option>)}
          </select>
          <select name="fuelType" defaultValue={fuelType} className="h-10 px-3 border border-[#ddd4c8] text-[12px] font-medium outline-none focus:border-[#2F855A]">
            <option value="">All fuel types</option>
            {fuelOptions.map((value) => <option key={value} value={value}>{FUEL_LABELS[value] || value}</option>)}
          </select>
          <select name="transmission" defaultValue={transmission} className="h-10 px-3 border border-[#ddd4c8] text-[12px] font-medium outline-none focus:border-[#2F855A]">
            <option value="">All transmissions</option>
            {transmissionOptions.map((value) => <option key={value} value={value}>{TRANSMISSION_LABELS[value] || value}</option>)}
          </select>
          <select name="sort" defaultValue={sort} className="h-10 px-3 border border-[#ddd4c8] text-[12px] font-medium outline-none focus:border-[#2F855A]">
            <option value="newest">Newest first</option>
            <option value="price_asc">Price low to high</option>
            <option value="price_desc">Price high to low</option>
            <option value="views_desc">Most viewed</option>
          </select>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-6 gap-2 mt-2">
          <input name="minPrice" type="number" defaultValue={minPrice ?? ""} placeholder="Min price" className="h-10 px-3 border border-[#ddd4c8] text-[12px] font-medium outline-none focus:border-[#2F855A]" />
          <input name="maxPrice" type="number" defaultValue={maxPrice ?? ""} placeholder="Max price" className="h-10 px-3 border border-[#ddd4c8] text-[12px] font-medium outline-none focus:border-[#2F855A]" />
          <select name="minYear" defaultValue={minYear ?? ""} className="h-10 px-3 border border-[#ddd4c8] text-[12px] font-medium outline-none focus:border-[#2F855A]">
            <option value="">Min year</option>
            {yearOptions.map((value) => <option key={`min-${value}`} value={value}>{value}</option>)}
          </select>
          <select name="maxYear" defaultValue={maxYear ?? ""} className="h-10 px-3 border border-[#ddd4c8] text-[12px] font-medium outline-none focus:border-[#2F855A]">
            <option value="">Max year</option>
            {yearOptions.map((value) => <option key={`max-${value}`} value={value}>{value}</option>)}
          </select>
          <button type="submit" className="h-10 px-3 bg-[#111111] text-white text-[10px] font-black uppercase tracking-[0.12em]">Apply filters</button>
          <Link href={`/portal/inventory?filter=${filter}`} className="h-10 px-3 border border-[#ddd4c8] text-[10px] font-black uppercase tracking-[0.12em] inline-flex items-center justify-center">Reset row</Link>
        </div>
      </form>

      <div className="mb-4 sm:mb-6 flex flex-wrap gap-1.5 sm:gap-2">
        {[
          { label: "Daily Driver", bodyType: "SEDAN", maxPrice: 3500000, sort: "price_asc" },
          { label: "SUV Stock", bodyType: "SUV", sort: "views_desc" },
          { label: "Pickup Focus", bodyType: "PICKUP", sort: "newest" },
          { label: "Price Drop Window", maxPrice: 2500000, sort: "price_asc" },
          { label: "Premium Shelf", minPrice: 5000000, sort: "price_desc" },
        ].map((preset) => (
          <Link
            key={preset.label}
            href={presetHref(preset)}
            className="inline-flex items-center h-7 sm:h-8 px-2.5 sm:px-3 rounded-full border border-[#ddd4c8] bg-white text-[9px] sm:text-[10px] font-black uppercase tracking-[0.1em] sm:tracking-[0.12em] text-slate-700 hover:bg-[#fbfcfe]"
          >
            {preset.label}
          </Link>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex bg-white dark:bg-[#111111] border border-[#ddd4c8] dark:border-slate-800 p-1 rounded-2xl w-full overflow-x-auto mb-5 sm:mb-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[4px_4px_0px_0px_rgba(0,0,0,0.05)]">
        {[
          { key: "all",  label: "All", count: totalCount },
          { key: "live", label: "Available",     count: liveCount },
          { key: "sold", label: "Sold/Drafts",    count: soldCount },
        ].map(({ key, label, count }) => (
          <Link key={key} href={preserveFilterHref(key)}
            className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-2xl text-[10px] sm:text-[11px] uppercase font-black tracking-[0.08em] sm:tracking-[0.10em] transition-all flex items-center gap-1 sm:gap-2 flex-shrink-0 ${
              filter === key 
                ? "bg-[#2F855A] text-white" 
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10"
            }`}>
            {label} 
            <span className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
              filter === key ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400"
            }`}>
              {count}
            </span>
          </Link>
        ))}
      </div>

      {/* Grid */}
      {cars.length === 0 ? (
        <div className="bg-white dark:bg-[#111111] border border-[#ddd4c8] dark:border-slate-800 rounded-2xl p-8 sm:p-12 md:p-24 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[4px_4px_0px_0px_rgba(0,0,0,0.05)]">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#fbfcfe] dark:bg-[#111111] rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
             <CarIcon size={32} className="text-slate-700" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2">No vehicles listed</h2>
          <p className="text-[11px] uppercase font-black tracking-[0.10em] text-slate-700 max-w-xs mx-auto mb-6">Start building your inventory by adding your first vehicle.</p>
          <Link href="/portal/cars/new" className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#111111] hover:bg-[#111111] text-white text-[11px] uppercase font-black tracking-[0.10em] font-semibold rounded-2xl transition-colors">
            <Plus size={16} /> Add Your First Vehicle
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          {cars.map(car => (
            <div key={car.id} className="group bg-white dark:bg-[#111111] border border-[#ddd4c8] dark:border-slate-800 rounded-2xl overflow-hidden transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.04)] sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[4px_4px_0px_0px_rgba(0,0,0,0.05)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[8px_8px_0px_0px_rgba(0,0,0,0.05)] flex flex-col h-full">
              {/* Image & Status Badge */}
              <div className="relative aspect-[16/11] bg-[#fbfcfe] dark:bg-[#111111] overflow-hidden shrink-0">
                {car.images[0]
                  ? <Image src={car.images[0].url} alt={`${car.make} ${car.model}`} width={640} height={440} className="w-full h-full object-cover" />
                  : <div className="flex items-center justify-center h-full bg-[#fbfcfe] dark:bg-[#111111]">
                      <CarIcon size={28} className="text-slate-300" />
                    </div>
                }
                
                {/* Overlay Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  <span className={`text-[11px] uppercase font-black tracking-[0.15em] font-semibold px-3 py-1 rounded text-white ${
                    car.available 
                      ? "bg-[#111111]" 
                      : "bg-slate-400"
                  }`}>
                    {car.available ? "Live" : "Draft"}
                  </span>
                  {car.featured && (
                    <span className="bg-amber-100 text-amber-900 text-[11px] uppercase font-black tracking-[0.15em] font-semibold px-3 py-1 rounded">
                      Featured
                    </span>
                  )}
                </div>
              </div>

              {/* Info Body */}
              <div className="p-3.5 sm:p-5 flex flex-col flex-1">
                <div className="mb-3 sm:mb-4">
                  <h3 className="text-[14px] sm:text-base font-bold font-sans text-slate-900 dark:text-white truncate">
                    {car.year} {car.make} {car.model}
                  </h3>
                  <p className="text-[10px] sm:text-[11px] uppercase font-black tracking-[0.1em] sm:tracking-[0.15em] text-slate-700 capitalize mt-1 truncate">
                    {car.variant || "Standard"} · {car.fuelType}
                  </p>
                    {(() => {
                      const hoursSinceUpdate = (Date.now() - new Date(car.updatedAt).getTime()) / 3600000;
                      const freshness = hoursSinceUpdate <= 72
                        ? { label: "Fresh", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" }
                        : hoursSinceUpdate <= 24 * 14
                          ? { label: "Aging", cls: "bg-amber-50 text-amber-700 border-amber-200" }
                          : { label: "Stale", cls: "bg-rose-50 text-rose-700 border-rose-200" };
                      return (
                        <span className={`mt-2 inline-flex items-center px-2 py-1 border rounded text-[10px] font-black uppercase tracking-[0.12em] ${freshness.cls}`}>
                          {freshness.label}
                        </span>
                      );
                    })()}
                </div>

                <div className="flex items-center justify-between mb-3.5 sm:mb-5">
                  <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    {formatCarPrice(car)}
                  </p>
                  <div className="flex flex-col items-end text-right">
                    <div className="flex items-center gap-1 text-slate-700">
                       <MessageSquare size={12} />
                       <span className="text-[10px] sm:text-[11px] uppercase font-black tracking-[0.1em] sm:tracking-[0.15em] font-medium">{car._count.leads} Leads</span>
                    </div>
                    <span className="text-[10px] sm:text-[11px] uppercase font-black tracking-[0.1em] sm:tracking-[0.15em] text-slate-700 mt-0.5">{car.views} views</span>
                  </div>
                </div>

                {/* Actions Grid */}
                <div className="mt-auto grid grid-cols-2 gap-2 pt-3 sm:pt-4 border-t border-[#ddd4c8] dark:border-slate-800">
                  <Link href={`/portal/cars/${car.id}/edit`}
                    className="flex items-center justify-center gap-2 bg-[#fbfcfe] dark:bg-[#111111] hover:bg-slate-200 text-slate-900 dark:text-white text-[10px] sm:text-[11px] uppercase font-black tracking-[0.1em] sm:tracking-[0.15em] font-semibold p-2 sm:p-2.5 rounded-2xl transition-all">
                    <Edit3 size={14} /> Edit
                  </Link>
                  <InventoryToggle carId={car.id} available={car.available} />
                </div>
                
                <Link href={`/cars/${car.id}`} target="_blank"
                  className="mt-2.5 sm:mt-3 flex items-center justify-center gap-1.5 text-[10px] sm:text-[11px] uppercase font-black tracking-[0.1em] sm:tracking-[0.15em] font-medium text-slate-700 hover:text-slate-900 dark:text-white transition-colors py-1.5 sm:py-2">
                  View Listing <ExternalLink size={12} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
