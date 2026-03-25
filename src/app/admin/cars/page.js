// src/app/admin/cars/page.js
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
  Car
} from "lucide-react";

export const metadata = { title: "Inventory Management — Motorke Standard" };

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

  const [cars, total, dealers] = await Promise.all([
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
  ]);

  const pages = Math.ceil(total / limit);

  return (
    <div className="animate-in fade-in duration-700">
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
             <div className="w-2 h-2 rounded-full bg-orange-600" />
             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Inventory Core</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Vehicle Showcases <span className="text-slate-300 font-medium ml-2">({total})</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          <Link href="/admin/cars/bulk" className="bg-slate-50 border border-slate-100 text-slate-900 px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-white transition-all shadow-sm">
            <Upload size={14} /> Bulk
          </Link>
          <ClearAllButton />
          <Link href="/admin/cars/new" className="bg-slate-950 text-white px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-orange-600 transition-all shadow-xl shadow-slate-200">
            <Plus size={14} /> Add Listing
          </Link>
        </div>
      </div>

      {/* ── FILTERS ── */}
      <form method="GET" className="flex flex-wrap items-center gap-3 mb-8 bg-slate-50/50 p-4 rounded-[2rem] border border-slate-100">
        <div className="relative flex-1 min-w-[200px] group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
          <input 
            name="search" 
            defaultValue={search} 
            placeholder="Search make or model..." 
            className="w-full bg-white border border-slate-100 rounded-xl pl-11 pr-4 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-slate-900 transition-all"
          />
        </div>

        <select name="dealerId" defaultValue={dealerId} className="bg-white border border-slate-100 rounded-xl px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-slate-500 outline-none focus:border-slate-900 transition-all cursor-pointer">
          <option value="">All Dealers</option>
          {dealers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>

        <select name="status" defaultValue={status} className="bg-white border border-slate-100 rounded-xl px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-slate-500 outline-none focus:border-slate-900 transition-all cursor-pointer">
          <option value="">All Status</option>
          <option value="live">Live Only</option>
          <option value="hidden">Hidden Only</option>
        </select>

        <button type="submit" className="bg-slate-900 hover:bg-orange-600 text-white p-2.5 rounded-xl transition-all shadow-lg shadow-slate-200">
          <Filter size={16} />
        </button>

        {(search || dealerId || status) && (
          <Link href="/admin/cars" className="text-[10px] font-black uppercase tracking-widest text-orange-600 px-2">
            Clear
          </Link>
        )}
      </form>

      {/* ── DATA TABLE ── */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              {["Car Details", "Dealer Hub", "Investment", "Engagement", "Status", ""].map((h) => (
                <th key={h} className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {cars.map((car) => (
              <tr key={car.id} className="group hover:bg-slate-50/50 transition-colors">
                <td className="px-8 py-5">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-12 rounded-xl bg-slate-100 overflow-hidden ring-1 ring-slate-200 shrink-0">
                      {car.images[0] ? (
                        <img src={car.images[0].url} alt="" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                      ) : (
                        <div className="flex items-center justify-center h-full text-slate-300"><Car size={16} /></div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 tracking-tight">{car.year} {car.make} {car.model}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{car.variant || "Standard"}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-5">
                   <p className="text-xs font-black text-slate-600 uppercase tracking-tighter">{car.dealer.name}</p>
                </td>
                <td className="px-8 py-5">
                   <p className="text-sm font-black text-slate-900">{formatPrice(car.price)}</p>
                </td>
                <td className="px-8 py-5">
                   <div className="flex items-center gap-4">
                      <div className="text-center">
                         <p className="text-[10px] font-black text-slate-900">{car.views}</p>
                         <p className="text-[8px] font-black text-slate-300 uppercase">Views</p>
                      </div>
                      <div className="text-center">
                         <p className="text-[10px] font-black text-slate-900">{car._count.leads}</p>
                         <p className="text-[8px] font-black text-slate-300 uppercase">Leads</p>
                      </div>
                   </div>
                </td>
                <td className="px-8 py-5">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                    car.available ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
                  }`}>
                    <div className={`w-1 h-1 rounded-full ${car.available ? "bg-emerald-500" : "bg-slate-400"}`} />
                    {car.available ? "Live" : "Hidden"}
                  </span>
                </td>
                <td className="px-8 py-5 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link href={`/admin/cars/${car.id}/edit`} className="p-2 text-slate-400 hover:text-slate-900 transition-colors" title="Edit">
                      <Edit3 size={16} />
                    </Link>
                    <form action={`/api/admin/cars/${car.id}/toggle`} method="POST">
                      <button type="submit" className="p-2 text-slate-400 hover:text-orange-600 transition-colors" title={car.available ? "Hide" : "Show"}>
                        {car.available ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                      </button>
                    </form>
                    <Link href={`/cars/${car.id}`} target="_blank" className="p-2 text-slate-400 hover:text-blue-600 transition-colors" title="View Live">
                      <ExternalLink size={16} />
                    </Link>
                    <DeleteButton action={`/api/admin/cars/${car.id}/delete`} message="Permanently delete this listing?" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {cars.length === 0 && (
          <div className="py-20 text-center">
            <Car size={40} className="mx-auto text-slate-100 mb-4" />
            <p className="text-sm font-black text-slate-300 uppercase tracking-widest">No matching units found</p>
          </div>
        )}
      </div>

      {/* ── PAGINATION ── */}
      {pages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-12">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link key={p}
              href={`/admin/cars?page=${p}&search=${search}&dealerId=${dealerId}&status=${status}`}
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-[11px] font-black transition-all ${
                p === page ? "bg-slate-900 text-white shadow-xl shadow-slate-200" : "bg-white border border-slate-100 text-slate-400 hover:border-slate-900 hover:text-slate-900"
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
