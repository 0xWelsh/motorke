// src/app/admin/dealers/page.js
export const dynamic = "force-dynamic";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { 
  Building2, 
  Search, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Plus, 
  MoreVertical, 
  ChevronRight, 
  ShieldCheck, 
  Clock,
  Car,
  TrendingUp,
  ArrowRight,
  ExternalLink
} from "lucide-react";
import { formatPrice } from "@/lib/utils";

export const metadata = { title: "Partner Network — Motorske Admin" };

export default async function AdminDealersPage({ searchParams }) {
  await requireAdmin();
  const sp     = await searchParams;
  const search = sp.search || "";

  const dealers = await db.dealer.findMany({
    where: search ? {
      OR: [
        { name:     { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
      ]
    } : {},
    include: {
       _count: { select: { cars: true, leads: true } },
       cars: { select: { price: true }, where: { available: true } }
    },
    orderBy: { name: "asc" }
  });

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
      {/* ── HEADER ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-12 gap-8">
        <div>
           <div className="flex items-center gap-3 mb-3">
             <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
             <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-emerald-500/60">Partner Ecosystem</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">Authorized Dealerships</h1>
        </div>
        
        <Link href="/admin/dealers/new" className="bg-emerald-600 text-white px-8 py-3.5 rounded-2xl text-[11px] font-bold uppercase tracking-widest flex items-center gap-3 hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-900/10">
          <Plus size={16} /> Add Partner Node
        </Link>
      </div>

      {/* ── SEARCH BAR ── */}
      <div className="relative mb-10 group">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-emerald-500 transition-colors" />
        <form method="GET">
           <input 
             name="search"
             defaultValue={search}
             placeholder="Identify partners by name, location, or license ID..." 
             className="w-full bg-[#0a0c10] border border-white/5 rounded-3xl pl-16 pr-6 py-5 text-sm font-medium text-white outline-none focus:border-emerald-500/30 focus:bg-black transition-all placeholder:text-white/20 shadow-2xl"
           />
        </form>
      </div>

      {/* ── DEALER GRID ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {dealers.map((dealer) => {
           const inventoryValue = dealer.cars.reduce((acc, car) => acc + car.price, 0);
           return (
             <div key={dealer.id} className="bg-[#0a0c10] border border-white/5 rounded-[2.5rem] p-8 hover:border-emerald-500/20 transition-all duration-500 group relative flex flex-col">
                <div className="absolute top-0 right-0 p-6 text-white/[0.02] group-hover:text-emerald-500/[0.05] transition-colors pointer-events-none">
                   <Building2 size={100} strokeWidth={1} />
                </div>

                <div className="flex items-start justify-between mb-8 relative z-10">
                   <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-white/40 group-hover:bg-emerald-600/10 group-hover:text-emerald-500 transition-all duration-500">
                      {dealer.logo ? (
                         <img src={dealer.logo} alt="" className="w-full h-full object-contain p-2 grayscale group-hover:grayscale-0 transition-all" />
                      ) : (
                         <Building2 size={24} />
                      )}
                   </div>
                   <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-bold uppercase tracking-widest">
                      Verified Hub
                   </div>
                </div>

                <div className="relative z-10 flex-1">
                   <h3 className="text-xl font-black text-white tracking-tight mb-2 group-hover:text-emerald-400 transition-colors uppercase">{dealer.name}</h3>
                   <div className="flex items-center gap-2 text-[10px] font-bold text-white/20 uppercase tracking-widest mb-6">
                      <MapPin size={12} className="text-emerald-500/40" />
                      {dealer.location}
                   </div>

                   <div className="grid grid-cols-2 gap-4 mb-8">
                      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                         <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-1">Inventory</p>
                         <p className="text-lg font-black text-white tracking-tight">{dealer._count.cars} Units</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                         <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-1">Leads</p>
                         <p className="text-lg font-black text-white tracking-tight">{dealer._count.leads} Yield</p>
                      </div>
                   </div>
                   
                   <div className="space-y-3">
                      <div className="flex items-center justify-between text-[11px]">
                         <span className="text-white/20 font-bold uppercase tracking-widest">Portfolio Value</span>
                         <span className="text-emerald-500 font-black">{formatPrice(inventoryValue)}</span>
                      </div>
                      <div className="w-full h-1 bg-white/[0.03] rounded-full overflow-hidden border border-white/5">
                         <div className="h-full bg-emerald-600/30 w-full animate-pulse" />
                      </div>
                   </div>
                </div>

                <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between relative z-10">
                   <div className="flex items-center gap-3">
                      <Link href={`tel:${dealer.phone}`} className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white/20 hover:text-white hover:bg-white/10 transition-all border border-white/5" title="Contact Node">
                         <Phone size={14} />
                      </Link>
                      <Link href={`mailto:${dealer.email}`} className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white/20 hover:text-white hover:bg-white/10 transition-all border border-white/5" title="Email Liaison">
                         <Mail size={14} />
                      </Link>
                   </div>
                   <Link href={`/admin/dealers/${dealer.id}`} className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white/40 hover:bg-white/10 hover:text-white transition-all flex items-center gap-2">
                       Full Profile <ExternalLink size={12} />
                   </Link>
                </div>
             </div>
           );
        })}

        {dealers.length === 0 && (
           <div className="col-span-full py-40 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
              <Building2 size={40} className="mx-auto text-white/10 mb-6" />
              <p className="text-lg font-black text-white/20 uppercase tracking-[0.4em]">No Authorized Nodes Found</p>
              <p className="text-sm font-medium text-white/10 mt-3">Try adjusting your search criteria.</p>
           </div>
        )}
      </div>
    </div>
  );
}
