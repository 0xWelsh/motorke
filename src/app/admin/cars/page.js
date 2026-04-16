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

export const metadata = { title: "Cars Inventory — Motorske Admin" };

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
           <div className="flex items-center gap-2 mb-2">
             <div className="w-2 h-2 rounded-none bg-#ff5a2f shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
             <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Inventory</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            Cars <span className="text-slate-500 font-medium ml-3">/ {total} Total</span>
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
          <Link href="/admin/cars/bulk" className="bg-white border border-[#ddd4c8] text-slate-900 px-5 py-2.5 rounded-none text-sm font-bold flex items-center gap-2 hover:bg-[#f7f6f3] transition-all shadow-none">
            <Upload size={16} /> Bulk Import
          </Link>
          <ClearAllButton />
          <Link href="/admin/cars/new" className="bg-#ff5a2f text-white px-5 py-2.5 rounded-none text-sm font-bold flex items-center gap-2 hover:bg-#e54a1f transition-all shadow-none">
            <Plus size={16} /> New Car
          </Link>
        </div>
      </div>

      {/* ── SEARCH & FILTERS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-8 bg-white border border-[#ddd4c8] p-4 rounded-none shadow-none">
         <form className="lg:col-span-12 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-#ff5a2f transition-colors" />
            <input 
              name="search"
              defaultValue={search}
              placeholder="Search by Make, Model, VIN or Plate Number..."
              className="w-full bg-[#f7f6f3] border border-[#ddd4c8] rounded-none pl-10 pr-4 py-3 text-[11px] font-bold uppercase tracking-widest text-slate-900 outline-none focus:border-#ff5a2f/50 focus:ring-2 focus:ring-#ff5a2f/10 transition-all placeholder:text-slate-400"
            />
         </form>
      </div>

      {/* ── DATA REGISTRY ── */}
      <div className="bg-white border border-[#ddd4c8] rounded-none overflow-hidden shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="border-b border-[#ddd4c8] bg-[#f7f6f3]">
                {["ID", "Car", "Dealership", "Metrics", "Price", ""].map((h) => (
                  <th key={h} className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cars.map((car) => (
                <tr key={car.id} className="group hover:bg-[#f7f6f3] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="text-xs font-bold text-slate-900 uppercase">
                        #{car.id.slice(-4)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-900 mb-0.5 group-hover:text-#ff5a2f transition-colors">{car.year} {car.make} {car.model}</p>
                    <div className="flex items-center gap-2">
                       <span className="text-xs text-slate-600 uppercase">{car.plate || "No Plate"}</span>
                       <div className="w-1 h-1 rounded-none bg-slate-300" />
                       <span className="text-xs text-slate-600 uppercase">{car.vin || "No VIN"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                     <p className="text-sm font-semibold text-slate-900">{car.dealer.name}</p>
                  </td>
                  <td className="px-6 py-4">
                     <div className="flex items-center gap-4">
                       <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                          <Eye size={14} />
                          <span className="text-sm font-bold text-slate-900 dark:text-white">{car.views.toLocaleString()}</span>
                       </div>
                       <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                          <MessageSquare size={14} />
                          <span className="text-sm font-bold text-slate-900 dark:text-white">{car._count.leads}</span>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                     <p className="text-sm font-bold text-slate-900 dark:text-white">{formatPrice(car.price)}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <Link href={`/admin/cars/${car.id}/edit`} className="p-2 bg-white dark:bg-slate-800 border border-[#ddd4c8] dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-#ff5a2f hover:border-#ff5a2f dark:hover:text-emerald-400 rounded-none transition-all shadow-none" title="Edit Car">
                        <Edit3 size={16} />
                      </Link>
                      
                      <form action={`/api/admin/cars/${car.id}/toggle-visibility`} method="POST">
                        <button type="submit" 
                          className={`p-2 border rounded-none transition-all shadow-none ${
                            car.available 
                              ? "bg-white dark:bg-slate-800 border-emerald-200 dark:border-#ff5a2f/30 text-#ff5a2f dark:text-#ff5a2f hover:bg-#ff5a2f]/10 dark:hover:bg-#ff5a2f/10" 
                              : "bg-[#f7f6f3] dark:bg-slate-800 border-[#ddd4c8] dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700"
                          }`}
                          title={car.available ? "Hide" : "Publish"}
                        >
                          {car.available ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                        </button>
                      </form>

                      <DeleteButton action={`/api/admin/cars/${car.id}/delete`} message="Permanently delete this car from inventory?" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {cars.length === 0 && (
          <div className="py-24 text-center">
            <div className="w-16 h-16 bg-[#f7f6f3] dark:bg-slate-800 rounded-none flex items-center justify-center mx-auto mb-4">
               <Car size={24} className="text-slate-400 dark:text-slate-500" />
            </div>
            <p className="text-lg font-bold text-slate-900 dark:text-white">No Cars Found</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">There are no cars matching your search.</p>
          </div>
        )}
      </div>

      {/* ── PAGINATION ── */}
      {pages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link key={p}
              href={`/admin/cars?page=${p}&search=${search}`}
              className={`w-10 h-10 rounded-none flex items-center justify-center text-sm font-bold transition-all ${
                p === page 
                  ? "bg-#ff5a2f text-white shadow-none shadow-#ff5a2f/20" 
                  : "bg-white dark:bg-slate-800 border border-[#ddd4c8] dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-#ff5a2f hover:text-#ff5a2f"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
