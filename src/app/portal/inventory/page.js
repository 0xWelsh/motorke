import { db } from "@/lib/db";
import { requireDealer } from "@/lib/auth";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import InventoryToggle from "@/components/InventoryToggle";
import { 
  Plus, 
  Search, 
  Filter, 
  Car as CarIcon, 
  ExternalLink, 
  Edit3, 
  ChevronRight,
  Eye,
  EyeOff,
  MessageSquare,
  Activity
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
    <div className="animate-in fade-in duration-700 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-8">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-500 mb-2 block">Asset Management</span>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Inventory</h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold mt-2 flex items-center gap-2">
            <Activity size={14} className="text-emerald-500" />
            {totalCount} Total Units · {liveCount} Live
          </p>
        </div>
        <Link href="/portal/cars/new"
          className="flex items-center gap-2 bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 text-white text-sm font-bold px-6 py-3 rounded-xl transition-all shadow-md hover:scale-105 active:scale-95 tracking-wide">
          <Plus size={18} /> Add Vehicle
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 rounded-xl w-fit mb-10 shadow-sm">
        {[
          { key: "all",  label: "All Inventory", count: totalCount },
          { key: "live", label: "Available",     count: liveCount },
          { key: "sold", label: "Sold/Drafts",    count: soldCount },
        ].map(({ key, label, count }) => (
          <Link key={key} href={`/portal/inventory?filter=${key}`}
            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 flex items-center gap-3 ${
              filter === key 
                ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-md" 
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}>
            {label} 
            <span className={`px-2 py-0.5 rounded-md text-[11px] ${
              filter === key ? "bg-white/20 dark:bg-black/10" : "bg-slate-100 dark:bg-slate-800"
            }`}>
              {count}
            </span>
          </Link>
        ))}
      </div>

      {/* Grid */}
      {cars.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-24 text-center shadow-sm">
          <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
             <CarIcon size={32} className="text-slate-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No units found</h2>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 max-w-xs mx-auto">Try adjusting your filters or add a new vehicle to your showroom.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cars.map(car => (
            <div key={car.id} className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 rounded-2xl overflow-hidden transition-all duration-300 shadow-sm hover:shadow-lg flex flex-col h-full">
              {/* Image & Status Badge */}
              <div className="relative aspect-[16/11] bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0">
                {car.images[0]
                  ? <img src={car.images[0].url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  : <div className="flex items-center justify-center h-full bg-slate-50 dark:bg-slate-800">
                      <CarIcon size={32} className="text-slate-300 dark:text-slate-600" />
                    </div>
                }
                
                {/* Overlay Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  <span className={`text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm backdrop-blur-md ${
                    car.available 
                      ? "bg-emerald-500 text-white" 
                      : "bg-slate-900 text-white"
                  }`}>
                    {car.available ? "● Live" : "○ Draft"}
                  </span>
                  {car.featured && (
                    <span className="bg-amber-400 text-amber-950 text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
                      ★ Featured
                    </span>
                  )}
                </div>
              </div>

              {/* Info Body */}
              <div className="p-6 flex flex-col flex-1">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight truncate group-hover:text-emerald-500 transition-colors">
                      {car.year} {car.make} {car.model}
                    </h3>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 capitalize mt-1 truncate">
                      {car.variant || "Standard Trim"} · {car.fuelType}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-6">
                  <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                    {formatPrice(car.price)}
                  </p>
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                       <MessageSquare size={12} className="text-emerald-500" />
                       <span className="text-[11px] font-bold uppercase tracking-wider">{car._count.leads} Leads</span>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400 mt-0.5">{car.views} Views</span>
                  </div>
                </div>

                {/* Actions Grid */}
                <div className="mt-auto grid grid-cols-2 gap-3 pt-5 border-t border-slate-100 dark:border-slate-800">
                  <Link href={`/portal/cars/${car.id}/edit`}
                    className="flex items-center justify-center gap-2 bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-slate-900 dark:text-slate-300 hover:text-emerald-600 text-xs font-bold p-3 rounded-xl transition-all border border-slate-200 dark:border-slate-700 hover:border-emerald-200 shadow-sm">
                    <Edit3 size={14} /> Edit
                  </Link>
                  <InventoryToggle carId={car.id} available={car.available} />
                </div>
                
                <Link href={`/cars/${car.id}`} target="_blank"
                  className="mt-4 flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-emerald-500 transition-colors py-2 group/link">
                  Public Listing <ExternalLink size={14} className="group-hover/link:translate-x-1 group-hover/link:-translate-y-1 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
