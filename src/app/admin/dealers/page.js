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
  ArrowUpRight,
  Users
} from "lucide-react";

export const metadata = { title: "Dealers — Motorke Admin" };

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
           <div className="flex items-center gap-2 mb-2">
             <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
             <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Dealers</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Dealers <span className="text-slate-500 font-medium ml-3">/ {dealers.length} Total</span>
          </h1>
        </div>
        <Link href="/admin/dealers/new" className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-emerald-600 dark:hover:bg-emerald-500 dark:hover:text-white transition-all shadow-md">
          <UserPlus size={18} /> Add Dealer
        </Link>
      </div>

      {/* ── DEALER GRID ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {dealers.map((dealer) => {
          const gradient = gradients[dealer.id.charCodeAt(0) % gradients.length];
          return (
            <div key={dealer.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:border-emerald-500 dark:hover:border-emerald-500/50 transition-all duration-300 group relative overflow-hidden">
               {/* Ambient Header */}
               <div className="flex items-start justify-between mb-8 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gradient} text-slate-900 flex items-center justify-center font-bold text-xl shadow-sm border border-white/50 dark:border-white/10 group-hover:scale-105 transition-transform duration-300`}>
                      {dealer.name[0]?.toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-none mb-1 group-hover:text-emerald-500 transition-colors capitalize">{dealer.name}</h3>
                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                        <MapPin size={12} />
                        <span className="text-xs font-semibold capitalize">{dealer.county || "Unknown"}</span>
                      </div>
                    </div>
                  </div>
                  <button className="text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                     <MoreVertical size={20} />
                  </button>
               </div>

               {/* Metrics Panel */}
               <div className="grid grid-cols-3 gap-2 mb-8 relative z-10">
                  {[
                    { label: "Cars", value: dealer._count.cars, icon: <Car size={14} /> },
                    { label: "Leads",  value: dealer._count.leads, icon: <MessageSquare size={14} /> },
                    { label: "Users",  value: dealer._count.users, icon: <Users size={14} /> },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-3 rounded-xl hover:bg-white dark:hover:bg-slate-700 transition-all shadow-sm">
                       <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 mb-1">
                          {stat.icon}
                          <span className="text-[10px] font-bold uppercase tracking-wider">{stat.label}</span>
                       </div>
                       <p className="text-lg font-black text-slate-900 dark:text-white">{stat.value}</p>
                    </div>
                  ))}
               </div>

               {/* Verification & Status */}
               <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800 relative z-10">
                 <div className="flex items-center gap-2">
                    {dealer.verified ? (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold shadow-sm">
                        <ShieldCheck size={14} /> Verified
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold shadow-sm">
                        <Activity size={14} /> Pending
                      </div>
                    )}
                 </div>
                 <Link href={`/admin/dealers/${dealer.id}/edit`} className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-900 dark:hover:bg-slate-100 hover:text-white dark:hover:text-slate-900 hover:border-slate-900 dark:hover:border-slate-100 transition-all shadow-sm group-hover:scale-105">
                    <ArrowUpRight size={18} />
                 </Link>
               </div>
            </div>
          );
        })}

        {dealers.length === 0 && (
          <div className="col-span-full py-24 text-center">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 size={24} className="text-slate-400 dark:text-slate-500" />
            </div>
            <p className="text-lg font-bold text-slate-900 dark:text-white">No Dealers Yet</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">No dealers have been approved yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
