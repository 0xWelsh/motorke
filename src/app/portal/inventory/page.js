import { db } from "@/lib/db";
import { requireDealer } from "@/lib/auth";
import Link from "next/link";
import { formatPrice, formatCarPrice } from "@/lib/utils";
import InventoryToggle from "@/components/InventoryToggle";
import { 
  Plus, 
  Search, 
  Filter, 
  Car as CarIcon, 
  ExternalLink, 
  Edit3, 
  Eye,
  EyeOff,
  MessageSquare,
} from "lucide-react";

export default async function InventoryPage({ searchParams }) {
  const user   = await requireDealer();
  const sp     = await searchParams;
  const filter = sp.filter || "all";

  const where = {
    dealerId: user.dealerId,
    ...(filter === "live"   && { available: true  }),
    ...(filter === "sold"   && { available: false }),
  };

  const cars = await db.car.findMany({
    where,
    include: {
      images: { where: { isPrimary: true }, take: 1 },
      _count: { select: { leads: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const [liveCount, soldCount, totalCount] = await Promise.all([
    db.car.count({ where: { dealerId: user.dealerId, available: true  } }),
    db.car.count({ where: { dealerId: user.dealerId, available: false } }),
    db.car.count({ where: { dealerId: user.dealerId } }),
  ]);

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-col gap-6 sm:gap-8 mb-8 sm:mb-10">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-1 sm:mb-2\">Inventory</h1>
          <p className="text-[11px] uppercase font-black tracking-[0.15em] sm:text-[11px] uppercase font-black tracking-[0.10em] text-slate-700 font-medium">
            {totalCount} total · {liveCount} live
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Link href="/portal/cars/bulk"
            className="flex items-center justify-center sm:justify-start gap-2 border border-[#ddd4c8] dark:border-slate-800 bg-white hover:bg-[#fbfcfe] dark:bg-[#111111] text-slate-700 text-[11px] uppercase font-black tracking-[0.15em] sm:text-[11px] uppercase font-black tracking-[0.10em] font-semibold px-4 sm:px-4 py-2.5 sm:py-2.5 rounded-2xl transition-all">
            <Plus size={16} className="sm:block hidden" />
            <Plus size={14} className="sm:hidden" /> Bulk Upload
          </Link>
          <Link href="/portal/cars/new"
            className="flex items-center justify-center sm:justify-start gap-2 bg-[#111111] hover:bg-[#111111] text-white text-[11px] uppercase font-black tracking-[0.15em] sm:text-[11px] uppercase font-black tracking-[0.10em] font-semibold px-4 sm:px-6 py-2.5 sm:py-2.5 rounded-2xl transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[4px_4px_0px_0px_rgba(0,0,0,0.05)]">
            <Plus size={16} className="sm:block hidden" />
            <Plus size={14} className="sm:hidden" /> Add Vehicle
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex bg-white dark:bg-[#111111] border border-[#ddd4c8] dark:border-slate-800 p-1 rounded-2xl w-full overflow-x-auto mb-8 sm:mb-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[4px_4px_0px_0px_rgba(0,0,0,0.05)]">
        {[
          { key: "all",  label: "All", count: totalCount },
          { key: "live", label: "Available",     count: liveCount },
          { key: "sold", label: "Sold/Drafts",    count: soldCount },
        ].map(({ key, label, count }) => (
          <Link key={key} href={`/portal/inventory?filter=${key}`}
            className={`px-2 sm:px-4 py-2 rounded-2xl text-[11px] uppercase font-black tracking-[0.10em] transition-all flex items-center gap-1 sm:gap-2 flex-shrink-0 ${
              filter === key 
                ? "bg-[#111111] text-white" 
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cars.map(car => (
            <div key={car.id} className="group bg-white dark:bg-[#111111] border border-[#ddd4c8] dark:border-slate-800 rounded-2xl overflow-hidden transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[4px_4px_0px_0px_rgba(0,0,0,0.05)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[8px_8px_0px_0px_rgba(0,0,0,0.05)] flex flex-col h-full">
              {/* Image & Status Badge */}
              <div className="relative aspect-[16/11] bg-[#fbfcfe] dark:bg-[#111111] overflow-hidden shrink-0">
                {car.images[0]
                  ? <img src={car.images[0].url} alt="" className="w-full h-full object-cover" />
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
              <div className="p-5 flex flex-col flex-1">
                <div className="mb-4">
                  <h3 className="text-base font-bold font-sans text-slate-900 dark:text-white truncate">
                    {car.year} {car.make} {car.model}
                  </h3>
                  <p className="text-[11px] uppercase font-black tracking-[0.15em] text-slate-700 capitalize mt-1 truncate">
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

                <div className="flex items-center justify-between mb-5">
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    {formatCarPrice(car)}
                  </p>
                  <div className="flex flex-col items-end text-right">
                    <div className="flex items-center gap-1 text-slate-700">
                       <MessageSquare size={12} />
                       <span className="text-[11px] uppercase font-black tracking-[0.15em] font-medium">{car._count.leads} Leads</span>
                    </div>
                    <span className="text-[11px] uppercase font-black tracking-[0.15em] text-slate-700 mt-0.5">{car.views} views</span>
                  </div>
                </div>

                {/* Actions Grid */}
                <div className="mt-auto grid grid-cols-2 gap-2 pt-4 border-t border-[#ddd4c8] dark:border-slate-800">
                  <Link href={`/portal/cars/${car.id}/edit`}
                    className="flex items-center justify-center gap-2 bg-[#fbfcfe] dark:bg-[#111111] hover:bg-slate-200 text-slate-900 dark:text-white text-[11px] uppercase font-black tracking-[0.15em] font-semibold p-2.5 rounded-2xl transition-all">
                    <Edit3 size={14} /> Edit
                  </Link>
                  <InventoryToggle carId={car.id} available={car.available} />
                </div>
                
                <Link href={`/cars/${car.id}`} target="_blank"
                  className="mt-3 flex items-center justify-center gap-1.5 text-[11px] uppercase font-black tracking-[0.15em] font-medium text-slate-700 hover:text-slate-900 dark:text-white transition-colors py-2">
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
