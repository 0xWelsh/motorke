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
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--brand)] mb-2.5 block">Asset Management</span>
          <h1 className="text-5xl font-black text-slate-900 tracking-tight">Inventory</h1>
          <p className="text-slate-500 font-bold mt-2 flex items-center gap-2">
            <Activity size={14} className="text-emerald-500" />
            {totalCount} Total Units · {liveCount} Live on Marketplace
          </p>
        </div>
        <Link href="/portal/cars/new"
          className="flex items-center gap-2 bg-[var(--brand)] hover:bg-[var(--brand-accent)] text-white text-[13px] font-black px-10 py-4 rounded-2xl transition-all shadow-xl shadow-[var(--brand)]/20 hover:scale-105 active:scale-95 uppercase tracking-widest">
          <Plus size={18} /> Add Vehicle
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex bg-white/50 backdrop-blur-sm border border-slate-100 p-1.5 rounded-2xl w-fit mb-10 shadow-sm">
        {[
          { key: "all",  label: "All Inventory", count: totalCount },
          { key: "live", label: "Available",     count: liveCount },
          { key: "sold", label: "Sold/Drafts",    count: soldCount },
        ].map(({ key, label, count }) => (
          <Link key={key} href={`/portal/inventory?filter=${key}`}
            className={`px-8 py-3 rounded-xl text-xs font-black transition-all duration-300 flex items-center gap-3 ${
              filter === key 
                ? "bg-slate-900 text-white shadow-lg shadow-slate-900/10" 
                : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
            }`}>
            {label} 
            <span className={`px-2 py-0.5 rounded-md text-[10px] ${
              filter === key ? "bg-white/20 text-white" : "bg-slate-100 text-slate-400"
            }`}>
              {count}
            </span>
          </Link>
        ))}
      </div>

      {/* Grid */}
      {cars.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-[3rem] p-32 text-center shadow-sm">
          <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
             <CarIcon size={40} className="text-slate-200" />
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-2">No units found</h2>
          <p className="text-sm font-medium text-slate-400 max-w-xs mx-auto">Try adjusting your filters or add a new vehicle to your showroom.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {cars.map(car => (
            <div key={car.id} className="group bg-white border border-slate-100 hover:border-emerald-100 rounded-[2.5rem] overflow-hidden transition-all duration-500 shadow-sm hover:shadow-2xl flex flex-col h-full">
              {/* Image & Status Badge */}
              <div className="relative aspect-[16/11] bg-slate-100 overflow-hidden shrink-0">
                {car.images[0]
                  ? <img src={car.images[0].url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  : <div className="flex items-center justify-center h-full bg-slate-50">
                      <CarIcon size={48} className="text-slate-200" />
                    </div>
                }
                
                {/* Overlay Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  <span className={`text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm backdrop-blur-md ${
                    car.available 
                      ? "bg-emerald-500/90 text-white" 
                      : "bg-slate-900/90 text-white"
                  }`}>
                    {car.available ? "● Live Marketplace" : "○ Hidden/Sold"}
                  </span>
                  {car.featured && (
                    <span className="bg-amber-400 text-amber-950 text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm">
                      ★ Featured
                    </span>
                  )}
                </div>
              </div>

              {/* Info Body */}
              <div className="p-8 flex flex-col flex-1">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="min-w-0">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight truncate group-hover:text-[var(--brand)] transition-colors">
                      {car.year} {car.make} {car.model}
                    </h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 truncate">
                      {car.variant || "Standard Trim"} · {car.fuelType}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-8">
                  <p className="text-2xl font-black text-slate-900 tracking-tighter">
                    {formatPrice(car.price)}
                  </p>
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1.5 text-slate-400">
                       <MessageSquare size={12} className="text-[var(--brand)]" />
                       <span className="text-[10px] font-black uppercase tracking-tight">{car._count.leads} Leads</span>
                    </div>
                    <span className="text-[9px] font-bold text-slate-300 uppercase mt-0.5">{car.views} Unique Views</span>
                  </div>
                </div>

                {/* Actions Grid */}
                <div className="mt-auto grid grid-cols-2 gap-3 pt-6 border-t border-slate-50">
                  <Link href={`/portal/cars/${car.id}/edit`}
                    className="flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-900 text-xs font-black p-4 rounded-2xl transition-all border border-slate-100">
                    <Edit3 size={14} /> Edit
                  </Link>
                  <InventoryToggle carId={car.id} available={car.available} />
                </div>
                
                <Link href={`/cars/${car.id}`} target="_blank"
                  className="mt-3 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 hover:text-[var(--brand)] transition-colors py-2 group/link">
                  Public Listing <ChevronRight size={12} className="group-hover/link:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
