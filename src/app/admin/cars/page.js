// src/app/admin/cars/page.js
export const dynamic = "force-dynamic";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import DeleteButton from "@/components/DeleteButton";
import ClearAllButton from "@/components/ClearAllButton";
import { 
  Search, 
  Filter, 
  ChevronRight, 
  Plus, 
  Upload, 
  Trash2, 
  Eye, 
  Edit3,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  Car,
  Activity,
  Layers,
  ShieldCheck,
  Zap,
  MoreVertical,
  ArrowUpDown,
  MessageSquare
} from "lucide-react";
import ExportButton from "@/components/admin/ExportButton";

export const metadata = { title: "Asset Registry — Motorske Control" };

export default async function AdminCarsPage({ searchParams }) {
  await requireAdmin();
  const sp = await searchParams;
  const search = sp.search || "";
  const page = parseInt(sp.page || "1");
  const limit = 20;

  const where = search ? {
    OR: [
      { make:  { contains: search, mode: "insensitive" } },
      { model: { contains: search, mode: "insensitive" } },
      { plate: { contains: search, mode: "insensitive" } },
      { vin:   { contains: search, mode: "insensitive" } },
    ]
  } : {};

  const [cars, total] = await Promise.all([
    db.car.findMany({
      where,
      include: { dealer: { select: { name: true } }, _count: { select: { leads: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.car.count({ where }),
  ]);

  const pages = Math.ceil(total / limit);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
      {/* ── HEADER ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-12 gap-8">
        <div>
           <div className="flex items-center gap-3 mb-3">
             <div className="w-2 h-2 rounded-full bg-emerald-600 shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
             <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-800">Inventory Telemetry</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            Asset Registry <span className="text-slate-500 font-medium ml-3">/ {total} Units</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          <ExportButton 
            filename="motorske-inventory.csv" 
            data={cars.map(c => ({
              ID: c.id,
              Make: c.make,
              Model: c.model,
              Year: c.year,
              Price: c.price,
              Dealer: c.dealer.name,
              Views: c.views,
              Leads: c._count.leads,
              Status: c.available ? "Live" : "Hidden",
              CreatedAt: c.createdAt
            }))} 
          />
          <Link href="/admin/cars/bulk" className="bg-white border border-slate-200 text-slate-900 px-6 py-3.5 rounded-2xl text-[11px] font-bold uppercase tracking-widest flex items-center gap-3 hover:bg-slate-50 hover:text-black transition-all shadow-sm">
            <Upload size={16} /> Bulk Import
          </Link>
          <ClearAllButton />
          <Link href="/admin/cars/new" className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl text-[11px] font-bold uppercase tracking-widest flex items-center gap-3 hover:bg-emerald-600 transition-all shadow-xl shadow-slate-200">
            <Plus size={16} /> New Listing
          </Link>
        </div>
      </div>

      {/* ── SEARCH & FILTERS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-8 bg-white border border-slate-200 p-4 rounded-3xl shadow-sm">
         <form className="lg:col-span-10 relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-emerald-600 transition-colors" />
            <input 
              name="search"
              defaultValue={search}
              placeholder="Filter by Make, Model, VIN or Plate Number..."
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-medium text-slate-900 outline-none focus:border-emerald-500/30 focus:bg-white transition-all placeholder:text-slate-600"
            />
         </form>
         <button className="lg:col-span-2 bg-slate-50 border border-slate-100 text-slate-700 rounded-2xl flex items-center justify-center gap-2 hover:bg-white hover:border-slate-300 transition-all group">
            <Filter size={16} className="group-hover:text-emerald-600" />
            <span className="text-[11px] font-bold uppercase tracking-widest">Sort Spec</span>
         </button>
      </div>

      {/* ── DATA REGISTRY ── */}
      <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                {["Asset ID", "Spec & Variant", "Partner Hub", "Performance", "Price Vector", ""].map((h) => (
                  <th key={h} className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-slate-700">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cars.map((car) => (
                <tr key={car.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-10 py-7">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-black text-xs group-hover:bg-slate-900 group-hover:text-white transition-all border border-slate-200 shadow-sm">
                        {car.id.slice(-4).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Stock ID</p>
                        <p className="text-xs font-black text-slate-900 leading-none truncate w-24">#{car.id.slice(0, 8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-7">
                    <p className="text-base font-black text-slate-900 tracking-tight leading-none mb-1.5 group-hover:text-emerald-600 transition-colors">{car.year} {car.make} {car.model}</p>
                    <div className="flex items-center gap-3">
                       <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{car.plate || "No Plate"}</span>
                       <div className="w-1 h-1 rounded-full bg-slate-200" />
                       <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{car.vin || "No VIN"}</span>
                    </div>
                  </td>
                  <td className="px-10 py-7">
                     <p className="text-sm font-bold text-slate-900 mb-1">{car.dealer.name}</p>
                     <div className="flex items-center gap-1.5">
                        <div className="w-1 h-1 rounded-full bg-emerald-500" />
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Verified Branch</p>
                     </div>
                  </td>
                  <td className="px-10 py-7">
                     <div className="flex flex-col gap-2">
                         <div className="flex items-center gap-4">
                           <div className="flex items-center gap-1.5 text-slate-600">
                              <Eye size={12} className="text-emerald-600/40" />
                              <span className="text-[11px] font-black tracking-tighter">{car.views.toLocaleString()}</span>
                           </div>
                           <div className="flex items-center gap-1.5 text-slate-600">
                              <MessageSquare size={12} className="text-emerald-600/40" />
                              <span className="text-[11px] font-black tracking-tighter">{car._count.leads}</span>
                           </div>
                        </div>
                        <div className="w-24 h-1 bg-slate-100 rounded-full overflow-hidden">
                           <div className="h-full bg-emerald-600 transition-all duration-1000" style={{ width: `${Math.min(100, (car.views / 500) * 100)}%` }} />
                        </div>
                     </div>
                  </td>
                  <td className="px-10 py-7">
                     <p className="text-lg font-black text-slate-900 tracking-tighter mb-1">{formatPrice(car.price)}</p>
                     <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-[0.2em]">Market Valuated</p>
                  </td>
                  <td className="px-10 py-7 text-right">
                    <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <Link href={`/admin/cars/${car.id}/edit`} className="p-3 bg-white border border-slate-200 text-slate-700 hover:text-emerald-600 hover:border-emerald-200 rounded-xl transition-all shadow-sm" title="Modify Spec">
                        <Edit3 size={16} />
                      </Link>
                      
                      <form action={`/api/admin/cars/${car.id}/toggle-visibility`} method="POST">
                        <button type="submit" 
                          className={`p-3 border rounded-xl transition-all shadow-sm ${
                            car.available 
                              ? "bg-white border-emerald-100 text-emerald-600 hover:bg-emerald-50" 
                              : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-white"
                          }`}
                          title={car.available ? "Depublish Asset" : "Live Authorization"}
                        >
                          {car.available ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                        </button>
                      </form>

                      <DeleteButton action={`/api/admin/cars/${car.id}/delete`} message="Permanently purge this asset from global registry?" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {cars.length === 0 && (
          <div className="py-32 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full border border-slate-100 flex items-center justify-center mx-auto mb-8">
               <Car size={32} className="text-slate-400" />
            </div>
            <p className="text-xl font-black text-slate-900 uppercase tracking-tighter">Inventory Purged</p>
            <p className="text-sm font-medium text-slate-600 mt-2 tracking-wide">No assets matching those coordinates were located.</p>
          </div>
        )}
      </div>

      {/* ── PAGINATION ── */}
      {pages > 1 && (
        <div className="flex justify-center items-center gap-3 mt-16">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link key={p}
              href={`/admin/cars?page=${p}&search=${search}`}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center text-[11px] font-black tracking-widest transition-all ${
                p === page 
                  ? "bg-slate-900 text-white shadow-xl shadow-slate-200 scale-110" 
                  : "bg-white border border-slate-200 text-slate-700 hover:border-emerald-200 hover:text-emerald-600"
              }`}
            >
              {p.toString().padStart(2, '0')}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
