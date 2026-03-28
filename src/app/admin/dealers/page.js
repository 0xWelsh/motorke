// src/app/admin/dealers/page.js
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import DeleteButton from "@/components/DeleteButton";
import { 
  Building2, 
  Plus, 
  ShieldCheck, 
  Star, 
  Edit3, 
  ExternalLink, 
  MapPin,
  Car,
  Users,
  MessageSquare,
  Activity
} from "lucide-react";

export const metadata = { title: "Dealer Network — Motorke Standard Admin" };

export default async function AdminDealersPage() {
  await requireAdmin();

  const dealers = await db.dealer.findMany({
    include: { _count: { select: { cars: true, users: true, leads: true } } },
    orderBy: { createdAt: "desc" },
  });

  const topStats = {
    units: dealers.reduce((acc, d) => acc + d._count.cars, 0),
    leads: dealers.reduce((acc, d) => acc + d._count.leads, 0),
    verified: dealers.filter(d => d.verified).length
  };

  const gradients = [
    "from-blue-500 to-cyan-500", "from-purple-500 to-pink-500",
    "from-orange-500 to-rose-500", "from-emerald-500 to-teal-500",
    "from-indigo-500 to-violet-500", "from-rose-500 to-orange-400"
  ];

  return (
    <div className="animate-in fade-in duration-700">
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
             <div className="w-2 h-2 rounded-full bg-orange-600" />
             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Network Operations</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Dealer Partners <span className="text-white/30 font-medium ml-2">({dealers.length})</span>
          </h1>
        </div>
        
        <Link href="/admin/dealers/new" className="bg-white/10 border border-white/10 text-pureWhite px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-orange-600 hover:text-white hover:border-orange-500 transition-all shadow-xl">
          <Plus size={14} /> Add Dealership
        </Link>
      </div>

      {/* ── METRICS BANNER ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 group">
         {[
            { l: "Network Units", v: topStats.units.toLocaleString(), i: <Car size={18} className="text-blue-500" /> },
            { l: "Verified Partners", v: topStats.verified.toLocaleString(), i: <ShieldCheck size={18} className="text-emerald-500" /> },
            { l: "Total Network Leads", v: topStats.leads.toLocaleString(), i: <MessageSquare size={18} className="text-orange-500" /> }
         ].map((m, idx) => (
            <div key={idx} className="bg-surface border border-white/5 rounded-[2rem] p-6 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
               <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">{m.l}</p>
                  <p className="text-2xl font-black text-white leading-none">{m.v}</p>
               </div>
               <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                  {m.i}
               </div>
            </div>
         ))}
      </div>

      {/* ── DATA TABLE ── */}
      <div className="bg-surface border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border-light bg-white/[0.02]">
              {["Dealership Hub", "Geographic", "Inventory", "Network", "Leads", "Verification", ""].map((h) => (
                <th key={h} className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-white/40">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light">
            {dealers.map((dealer) => {
              const gradient = gradients[dealer.id.charCodeAt(0) % gradients.length];
              return (
              <tr key={dealer.id} className="group hover:bg-white/5 transition-colors">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} text-white flex items-center justify-center font-black text-lg transition-transform duration-500 shadow-lg group-hover:scale-110 group-hover:shadow-xl`}>
                      {dealer.name[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-black text-white tracking-tight">{dealer.name}</p>
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mt-0.5">{dealer.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                   <div className="flex items-center gap-2 text-white/60">
                      <MapPin size={12} className="text-white/30" />
                      <p className="text-xs font-black uppercase tracking-tighter">{dealer.county}</p>
                   </div>
                   <p className="text-[10px] text-white/40 mt-1">{dealer.location}</p>
                </td>
                <td className="px-8 py-6">
                   <div className="flex items-center gap-2">
                      <Car size={14} className="text-white/30" />
                      <p className="text-sm font-black text-white">{dealer._count.cars}</p>
                   </div>
                </td>
                <td className="px-8 py-6 text-sm font-black text-white">
                   <div className="flex items-center gap-2">
                      <Users size={14} className="text-white/30" />
                      {dealer._count.users}
                   </div>
                </td>
                <td className="px-8 py-6 text-sm font-black text-orange-600">
                   <div className="flex items-center gap-2 bg-orange-500/10 px-3 py-1.5 rounded-xl border border-transparent inline-flex shadow-sm">
                      <MessageSquare size={14} className="text-orange-500" />
                      {dealer._count.leads}
                   </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex flex-wrap gap-2">
                    {dealer.verified && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-500/20 shadow-sm">
                        <ShieldCheck size={10} /> Verified
                      </span>
                    )}
                    {dealer.featured && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-500/10 text-orange-500 rounded-full text-[9px] font-black uppercase tracking-widest border border-orange-500/20 shadow-sm">
                        <Star size={10} fill="currentColor" /> Featured
                      </span>
                    )}
                    {!dealer.verified && !dealer.featured && (
                      <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Standard</span>
                    )}
                  </div>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <Link href={`/admin/dealers/${dealer.id}/edit`} className="p-2 text-white/40 hover:text-white transition-colors" title="Edit Hub">
                      <Edit3 size={16} />
                    </Link>
                    
                    <form action={`/api/admin/dealers/${dealer.id}/toggle-verified`} method="POST">
                      <button type="submit" className={`p-2 transition-colors ${dealer.verified ? "text-emerald-500 hover:text-white/40" : "text-white/40 hover:text-emerald-600 dark:text-white/30 dark:hover:text-emerald-500"}`} title={dealer.verified ? "Unverify" : "Verify Dealer"}>
                        <ShieldCheck size={18} />
                      </button>
                    </form>

                    <form action={`/api/admin/dealers/${dealer.id}/toggle-featured`} method="POST">
                      <button type="submit" className={`p-2 transition-colors ${dealer.featured ? "text-orange-500 hover:text-white/40" : "text-white/40 hover:text-orange-600 dark:text-white/30 dark:hover:text-orange-500"}`} title={dealer.featured ? "Remove Highlight" : "Feature Dealer"}>
                        <Star size={18} fill={dealer.featured ? "currentColor" : "none"} />
                      </button>
                    </form>

                    <Link href={`/dealers/${dealer.slug}`} target="_blank" className="p-2 text-white/40 hover:text-blue-500 transition-colors" title="Public Profile">
                      <ExternalLink size={16} />
                    </Link>

                    {dealer._count.cars === 0 && (
                      <DeleteButton action={`/api/admin/dealers/${dealer.id}/delete`} message="Permanently terminate this dealer profile?" />
                    )}
                  </div>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
        
        {dealers.length === 0 && (
          <div className="py-20 text-center">
            <Building2 size={40} className="mx-auto text-white/5 mb-4" />
            <p className="text-sm font-black text-white/30 uppercase tracking-widest">No dealers in network</p>
          </div>
        )}
      </div>
    </div>
  );
}
