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
  MoreVertical
} from "lucide-react";
import ExportButton from "@/components/admin/ExportButton";

export const metadata = { title: "Asset Registry — Motorske Control" };

export default async function AdminCarsPage({ searchParams }) {
  await requireAdmin();
  const sp       = await searchParams;
  const search   = sp.search   || "";
  const dealerId = sp.dealerId || "";
  const status   = sp.status   || "";
  const page     = parseInt(sp.page || "1");
  const limit    = 20;

  const where = {
    ...(search   && { OR: [
      { make:  { contains: search, mode: "insensitive" } },
      { model: { contains: search, mode: "insensitive" } },
    ]}),
    ...(dealerId && { dealerId }),
    ...(status === "live"   && { available: true  }),
    ...(status === "hidden" && { available: false }),
  };

  const [cars, total, dealers, liveCount, hiddenCount, viewsAgg] = await Promise.all([
    db.car.findMany({
      where,
      include: {
        dealer: { select: { name: true } },
        images: { where: { isPrimary: true }, take: 1 },
        _count: { select: { leads: true } },
      },
      orderBy: { createdAt: "desc" },
      skip:  (page - 1) * limit,
      take:  limit,
    }),
    db.car.count({ where }),
    db.dealer.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.car.count({ where: { ...where, available: true } }),
    db.car.count({ where: { ...where, available: false } }),
    db.car.aggregate({ where, _sum: { views: true } })
  ]);

  const totalViews = viewsAgg._sum.views || 0;
  const pages = Math.ceil(total / limit);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
      {/* ── HEADER ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-12 gap-8">
        <div>
          <div className="flex items-center gap-3 mb-3">
             <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
             <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-emerald-500/60">Asset Registry Console</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">
            Vehicle Showcases <span className="text-white/20 font-medium ml-3">/ {total} Units</span>
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
          <Link href="/admin/cars/bulk" className="bg-white/5 border border-white/10 text-white/60 px-6 py-3.5 rounded-2xl text-[11px] font-bold uppercase tracking-widest flex items-center gap-3 hover:bg-white/10 hover:text-white transition-all">
            <Upload size={16} /> Bulk Import
          </Link>
          <ClearAllButton />
          <Link href="/admin/cars/new" className="bg-emerald-600 text-white px-8 py-3.5 rounded-2xl text-[11px] font-bold uppercase tracking-widest flex items-center gap-3 hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-900/10">
            <Plus size={16} /> New Listing
          </Link>
        </div>
      </div>

      {/* ── METRICS GRID ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 group">
         {[
            { l: "Operational States", v: liveCount, d: "Active on Terminal", i: <ToggleRight size={20} className="text-emerald-500" /> },
            { l: "Registry Cache", v: hiddenCount, d: "Drafts / Archive", i: <ToggleLeft size={20} className="text-white/20" /> },
            { l: "Network Impressions", v: totalViews.toLocaleString(), d: "Global Reach", i: <Zap size={20} className="text-emerald-500" /> }
         ].map((m, idx) => (
            <div key={idx} className="bg-[#0a0c10] border border-white/5 rounded-3xl p-8 flex items-center justify-between shadow-2xl hover:border-emerald-500/20 transition-all group/card">
               <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-white/40 mb-2">{m.l}</p>
                  <p className="text-3xl font-black text-white leading-none mb-2">{m.v}</p>
                  <p className="text-[10px] font-medium text-white/20 uppercase tracking-tighter">{m.d}</p>
               </div>
               <div className="w-12 h-12 rounded-2xl bg-white/[0.03] flex items-center justify-center border border-white/5 group-hover/card:bg-emerald-600/10 transition-colors">
                  {m.i}
               </div>
            </div>
         ))}
      </div>

      {/* ── ADVANCED FILTERS ── */}
      <form method="GET" className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-10 bg-[#0a0c10] border border-white/5 p-4 rounded-3xl shadow-xl">
        <div className="lg:col-span-5 relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-emerald-500 transition-colors" />
          <input 
            name="search" 
            defaultValue={search} 
            placeholder="Filter by Make, Model, or Plate..." 
            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-medium text-white outline-none focus:border-emerald-500/30 focus:bg-white/[0.05] transition-all placeholder:text-white/20"
          />
        </div>

        <div className="lg:col-span-3">
          <select name="dealerId" defaultValue={dealerId} className="w-full bg-black border border-white/5 rounded-2xl px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-white/40 outline-none focus:border-emerald-500/30 transition-all cursor-pointer hover:bg-white/5">
            <option value="">All Partners</option>
            {dealers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>

        <div className="lg:col-span-2">
          <select name="status" defaultValue={status} className="w-full bg-black border border-white/5 rounded-2xl px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-white/40 outline-none focus:border-emerald-500/30 transition-all cursor-pointer hover:bg-white/5">
            <option value="">All States</option>
            <option value="live">Live Only</option>
            <option value="hidden">Hidden Only</option>
          </select>
        </div>

        <div className="lg:col-span-2 flex items-center gap-2">
          <button type="submit" className="flex-1 bg-white/10 hover:bg-emerald-600 text-white py-3.5 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 font-bold text-[11px] uppercase tracking-widest">
            <Filter size={16} /> Apply
          </button>
          
          {(search || dealerId || status) && (
            <Link href="/admin/cars" className="p-3.5 rounded-2xl bg-white/5 text-white/40 hover:text-rose-500 transition-all" title="Reset Filters">
              <Trash2 size={16} />
            </Link>
          )}
        </div>
      </form>

      {/* ── DATA REGISTRY ── */}
      <div className="bg-[#0a0c10] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                {["Configuration", "Node", "Appraisal", "Engagement", "Telemetry", ""].map((h) => (
                  <th key={h} className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-white/20">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {cars.map((car) => (
                <tr key={car.id} className="group hover:bg-white/[0.02] transition-colors relative">
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-5">
                       <div className="w-20 h-14 rounded-2xl bg-white/5 overflow-hidden shrink-0 border border-white/5 relative shadow-2xl">
                        {car.images[0] ? (
                          <img src={car.images[0].url} alt="" className="w-full h-full object-cover grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" />
                        ) : (
                          <div className="flex items-center justify-center h-full text-white/10"><Car size={20} /></div>
                        )}
                      </div>
                      <div>
                        <p className="text-base font-black text-white tracking-tight leading-none mb-1.5">{car.year} {car.make} {car.model}</p>
                        <div className="flex items-center gap-2">
                           <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{car.variant || "Standard Spec"}</span>
                           <div className="w-1 h-1 rounded-full bg-white/10" />
                           <span className="text-[10px] font-bold text-emerald-500/60 uppercase tracking-widest">#{car.id.slice(-4)}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                     <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">{car.dealer.name}</p>
                     <p className="text-[9px] font-medium text-white/10 uppercase tracking-tighter">Verified Partner</p>
                  </td>
                  <td className="px-10 py-6">
                     <p className="text-base font-black text-white tracking-tighter">{formatPrice(car.price)}</p>
                     <p className="text-[10px] font-bold text-emerald-500/40 uppercase tracking-widest mt-1">Market Val</p>
                  </td>
                  <td className="px-10 py-6">
                     <div className="flex items-center gap-6">
                        <div>
                           <p className="text-sm font-black text-white">{car.views.toLocaleString()}</p>
                           <p className="text-[9px] font-bold text-white/10 uppercase tracking-widest">Views</p>
                        </div>
                        <div className="w-px h-6 bg-white/5" />
                        <div>
                           <p className="text-sm font-black text-white">{car._count.leads}</p>
                           <p className="text-[9px] font-bold text-white/10 uppercase tracking-widest">Leads</p>
                        </div>
                     </div>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex flex-col gap-2 items-start">
                       <span className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all ${
                         car.available 
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]" 
                          : "bg-white/5 text-white/20 border-white/10"
                       }`}>
                         <div className={`w-1.5 h-1.5 rounded-full ${car.available ? "bg-emerald-500 animate-pulse" : "bg-white/10"}`} />
                         {car.available ? "Terminal Live" : "Cache Only"}
                       </span>
                       <span className="text-[10px] font-bold text-white/10 uppercase tracking-[0.2em] ml-1">
                          Since {new Date(car.createdAt).toLocaleDateString("en-KE", { month: "short", day: "numeric" })}
                       </span>
                    </div>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <Link href={`/admin/cars/${car.id}/edit`} className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors" title="Edit Master">
                        <Edit3 size={16} />
                      </Link>
                      <form action={`/api/admin/cars/${car.id}/toggle`} method="POST">
                        <button type="submit" className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors" title={car.available ? "Decommission" : "Provision"}>
                          {car.available ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                        </button>
                      </form>
                      <Link href={`/cars/${car.id}`} target="_blank" className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:text-blue-500 hover:bg-blue-500/10 transition-colors" title="Live Terminal">
                        <ExternalLink size={16} />
                      </Link>
                      <DeleteButton action={`/api/admin/cars/${car.id}/delete`} message="Permanently purge this asset from the registry?" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {cars.length === 0 && (
          <div className="py-32 text-center">
            <div className="w-20 h-20 bg-white/[0.02] rounded-full border border-white/5 flex items-center justify-center mx-auto mb-8">
               <Layers size={32} className="text-white/10" />
            </div>
            <p className="text-lg font-black text-white/20 uppercase tracking-[0.3em]">No Assets Identified</p>
            <p className="text-sm font-medium text-white/10 mt-2">Adjust your filters or initiate a new registry entry.</p>
          </div>
        )}
      </div>

      {/* ── PAGINATION ── */}
      {pages > 1 && (
        <div className="flex justify-center items-center gap-3 mt-16">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link key={p}
              href={`/admin/cars?page=${p}&search=${search}&dealerId=${dealerId}&status=${status}`}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center text-[11px] font-black tracking-widest transition-all ${
                p === page 
                  ? "bg-emerald-600 text-white shadow-[0_0_25px_rgba(16,185,129,0.3)] scale-110" 
                  : "bg-[#0a0c10] border border-white/5 text-white/20 hover:border-white/30 hover:text-white"
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
