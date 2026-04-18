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
  Users,
  LogIn
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
    "from-\[#ff5a2f\]/10 to-\[#ff5a2f\]/20",
    "from-blue-50 to-blue-100",
    "from-slate-50 to-slate-100",
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-8">
        <div>
           <div className="flex items-center gap-2 mb-2">
             <div className="w-2 h-2 rounded-2xl bg-[#ff5a2f] shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
             <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Dealers</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Dealers <span className="text-slate-500 font-medium ml-3">/ {dealers.length} Total</span>
          </h1>
        </div>
        <Link href="/admin/dealers/new" className="bg-[#ff5a2f] text-white px-6 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 hover:bg-[#e54a1f] transition-all shadow-none">
          <UserPlus size={18} /> Add Dealer
        </Link>
      </div>

      {/* ── DEALER GRID ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {dealers.map((dealer) => {
          const gradient = gradients[dealer.id.charCodeAt(0) % gradients.length];
          return (
            <div key={dealer.id} className="bg-white dark:bg-[#111111] border border-[#ddd4c8] dark:border-slate-800 rounded-2xl p-6 hover:hover:border-[#ff5a2f] transition-all duration-300 group relative overflow-hidden">
               {/* Ambient Header */}
               <div className="flex items-start justify-between mb-8 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} text-slate-900 dark:text-white flex items-center justify-center font-bold text-xl border border-white/50 group-hover:scale-105 transition-transform duration-300`}>
                      {dealer.name[0]?.toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-none mb-1 group-hover:text-[#ff5a2f] transition-colors capitalize">{dealer.name}</h3>
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <MapPin size={12} />
                        <span className="text-xs font-semibold capitalize">{dealer.county || "Unknown"}</span>
                      </div>
                    </div>
                  </div>
                  <form action="/api/auth/impersonate" method="POST">
                    <input type="hidden" name="dealerId" value={dealer.id} />
                    <button type="submit" title="Login as Dealer" className="text-slate-600 hover:text-[#e54a1f] transition-colors p-2 bg-[#f7f6f3] rounded-2xl border border-[#ddd4c8] dark:border-slate-800 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                       <LogIn size={14} /> <span>Login</span>
                    </button>
                  </form>
               </div>

               {/* Metrics Panel */}
               <div className="grid grid-cols-3 gap-2 mb-8 relative z-10">
                  {[
                    { label: "Cars", value: dealer._count.cars, icon: <Car size={14} /> },
                    { label: "Leads",  value: dealer._count.leads, icon: <MessageSquare size={14} /> },
                    { label: "Users",  value: dealer._count.users, icon: <Users size={14} /> },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-[#f7f6f3] border border-slate-100 p-3 rounded-2xl hover:bg-white transition-all shadow-none">
                       <div className="flex items-center gap-1.5 text-slate-600 mb-1">
                          {stat.icon}
                          <span className="text-[11px] font-bold uppercase tracking-wider">{stat.label}</span>
                       </div>
                       <p className="text-lg font-black text-slate-900 dark:text-white">{stat.value}</p>
                    </div>
                  ))}
               </div>

               {/* Verification & Status */}
               <div className="flex items-center justify-between pt-6 border-t border-slate-100 relative z-10">
                 <div className="flex items-center gap-2">
                    {dealer.verified ? (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-2xl bg-[#ff5a2f]/10 border border-[#ff5a2f]/20 text-[#ff5a2f] text-xs font-bold shadow-none">
                        <ShieldCheck size={14} /> Verified
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 text-xs font-bold shadow-none">
                        <Activity size={14} /> Pending
                      </div>
                    )}
                 </div>
                 <Link href={`/admin/dealers/${dealer.id}/edit`} className="w-10 h-10 rounded-2xl border border-[#ddd4c8] dark:border-slate-800 flex items-center justify-center text-white hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all group-hover:scale-105">
                    <ArrowUpRight size={18} />
                 </Link>
               </div>
            </div>
          );
        })}

        {dealers.length === 0 && (
          <div className="col-span-full py-24 text-center">
            <div className="w-16 h-16 bg-[#f7f6f3] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Building2 size={24} className="text-slate-500" />
            </div>
            <p className="text-lg font-bold text-slate-900 dark:text-white">No Dealers Yet</p>
            <p className="text-sm text-slate-600 mt-1">No dealers have been approved yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
