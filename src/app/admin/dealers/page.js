// src/app/admin/dealers/page.js
export const dynamic = "force-dynamic";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { 
  Building2, 
  MapPin, 
  ChevronRight, 
  Plus, 
  UserPlus, 
  BarChart3, 
  ShieldCheck, 
  ExternalLink,
  MessageSquare,
  Car,
  MoreVertical,
  Activity,
  ArrowUpRight
} from "lucide-react";

export const metadata = { title: "Partner Network — Motorske Control" };

export default async function AdminDealersPage() {
  await requireAdmin();

  const dealers = await db.dealer.findMany({
    include: {
      _count: { select: { cars: true, leads: true, users: true } },
    },
    orderBy: { name: "asc" },
  });

  const gradients = [
    "from-slate-100 to-slate-200",
    "from-emerald-50 to-emerald-100",
    "from-blue-50 to-blue-100",
    "from-slate-50 to-slate-100",
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-8">
        <div>
           <div className="flex items-center gap-3 mb-3">
             <div className="w-2 h-2 rounded-full bg-emerald-600 shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
             <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-400">Node Management Hub</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            Partner Network <span className="text-slate-300 font-medium ml-3">/ {dealers.length} Licensed Nodes</span>
          </h1>
        </div>
        <Link href="/admin/dealers/new" className="bg-slate-900 text-white px-10 py-5 rounded-2xl text-[12px] font-bold uppercase tracking-widest flex items-center gap-3 hover:bg-emerald-600 transition-all shadow-xl shadow-slate-200">
          <UserPlus size={18} /> Authorize Partner
        </Link>
      </div>

      {/* ── DEALER GRID ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {dealers.map((dealer) => {
          const gradient = gradients[dealer.id.charCodeAt(0) % gradients.length];
          return (
            <div key={dealer.id} className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm hover:shadow-2xl hover:border-emerald-200 transition-all duration-500 group relative overflow-hidden">
               {/* Ambient Header */}
               <div className="flex items-start justify-between mb-10 relative z-10">
                  <div className="flex items-center gap-5">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} text-slate-900 flex items-center justify-center font-black text-2xl shadow-sm border border-white/50 group-hover:scale-105 transition-transform duration-500`}>
                      {dealer.name[0]?.toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tighter leading-none mb-2 group-hover:text-emerald-600 transition-colors uppercase">{dealer.name}</h3>
                      <div className="flex items-center gap-2 text-slate-400">
                        <MapPin size={12} className="text-emerald-600/40" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">{dealer.county || "Global Node"}</span>
                      </div>
                    </div>
                  </div>
                  <button className="text-slate-200 hover:text-slate-900 transition-colors">
                     <MoreVertical size={20} />
                  </button>
               </div>

               {/* Metrics Panel */}
               <div className="grid grid-cols-3 gap-3 mb-10 relative z-10">
                  {[
                    { label: "Assets", value: dealer._count.cars, icon: <Car size={12} /> },
                    { label: "Yield",  value: dealer._count.leads, icon: <Activity size={12} /> },
                    { label: "Users",  value: dealer._count.users, icon: <Users size={12} /> },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-slate-50 border border-slate-100 p-4 rounded-2xl hover:bg-white transition-all shadow-sm">
                       <div className="flex items-center gap-1.5 text-slate-300 mb-2">
                          {stat.icon}
                          <span className="text-[9px] font-bold uppercase tracking-widest leading-none">{stat.label}</span>
                       </div>
                       <p className="text-xl font-black text-slate-900 leading-none">{stat.value}</p>
                    </div>
                  ))}
               </div>

               {/* Verification & Status */}
               <div className="flex items-center justify-between pt-8 border-t border-slate-100 relative z-10">
                 <div className="flex items-center gap-2">
                    {dealer.verified ? (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-[10px] font-black uppercase tracking-tighter shadow-sm">
                        <ShieldCheck size={12} /> Authorized Partner
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-100 text-amber-600 text-[10px] font-black uppercase tracking-tighter shadow-sm">
                        <Activity size={12} /> Pending Audit
                      </div>
                    )}
                 </div>
                 <Link href={`/admin/dealers/${dealer.id}/edit`} className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm group-hover:scale-110">
                    <ArrowUpRight size={18} />
                 </Link>
               </div>
               
               <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 opacity-0 group-hover:opacity-100 blur-[80px] -mr-32 -mt-32 transition-opacity pointer-events-none" />
            </div>
          );
        })}

        {dealers.length === 0 && (
          <div className="col-span-full py-40 text-center">
            <Building2 size={48} className="mx-auto text-slate-200 mb-8" />
            <p className="text-xl font-black text-slate-900 uppercase tracking-tighter">Partner Network Empty</p>
            <p className="text-sm font-medium text-slate-400 mt-2">No dealership hubs have been authorized yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
