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
  MessageSquare
} from "lucide-react";

export const metadata = { title: "Dealer Network — Motorke Standard Admin" };

export default async function AdminDealersPage() {
  await requireAdmin();

  const dealers = await db.dealer.findMany({
    include: { _count: { select: { cars: true, users: true, leads: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="animate-in fade-in duration-700">
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
             <div className="w-2 h-2 rounded-full bg-orange-600" />
             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Network Operations</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Dealer Partners <span className="text-slate-300 font-medium ml-2">({dealers.length})</span>
          </h1>
        </div>
        
        <Link href="/admin/dealers/new" className="bg-slate-950 text-white px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-orange-600 transition-all shadow-2xl shadow-slate-200">
          <Plus size={14} /> Add Dealership
        </Link>
      </div>

      {/* ── DATA TABLE ── */}
      <div className="bg-white border border-slate-100 rounded-[3rem] overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              {["Dealership Hub", "Geographic", "Inventory", "Network", "Leads", "Verification", ""].map((h) => (
                <th key={h} className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {dealers.map((dealer) => (
              <tr key={dealer.id} className="group hover:bg-slate-50/50 transition-colors">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 group-hover:bg-slate-950 group-hover:text-white flex items-center justify-center font-black text-lg transition-all duration-500 shadow-sm group-hover:shadow-xl group-hover:shadow-slate-200">
                      {dealer.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 tracking-tight">{dealer.name}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{dealer.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                   <div className="flex items-center gap-2 text-slate-600">
                      <MapPin size={12} className="text-slate-300" />
                      <p className="text-xs font-black uppercase tracking-tighter">{dealer.county}</p>
                   </div>
                   <p className="text-[10px] text-slate-400 mt-1">{dealer.location}</p>
                </td>
                <td className="px-8 py-6">
                   <div className="flex items-center gap-2">
                      <Car size={14} className="text-slate-300" />
                      <p className="text-sm font-black text-slate-900">{dealer._count.cars}</p>
                   </div>
                </td>
                <td className="px-8 py-6 text-sm font-black text-slate-900">
                   <div className="flex items-center gap-2">
                      <Users size={14} className="text-slate-300" />
                      {dealer._count.users}
                   </div>
                </td>
                <td className="px-8 py-6 text-sm font-black text-orange-600">
                   <div className="flex items-center gap-2">
                      <MessageSquare size={14} className="text-orange-200" />
                      {dealer._count.leads}
                   </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex flex-wrap gap-2">
                    {dealer.verified && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100 shadow-sm">
                        <ShieldCheck size={10} /> Verified
                      </span>
                    )}
                    {dealer.featured && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-orange-100 shadow-sm">
                        <Star size={10} fill="currentColor" /> Featured
                      </span>
                    )}
                    {!dealer.verified && !dealer.featured && (
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Standard</span>
                    )}
                  </div>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <Link href={`/admin/dealers/${dealer.id}/edit`} className="p-2 text-slate-400 hover:text-slate-900 transition-colors" title="Edit Hub">
                      <Edit3 size={16} />
                    </Link>
                    
                    <form action={`/api/admin/dealers/${dealer.id}/toggle-verified`} method="POST">
                      <button type="submit" className={`p-2 transition-colors ${dealer.verified ? "text-emerald-500 hover:text-slate-400" : "text-slate-300 hover:text-emerald-500"}`} title={dealer.verified ? "Unverify" : "Verify Dealer"}>
                        <ShieldCheck size={18} />
                      </button>
                    </form>

                    <form action={`/api/admin/dealers/${dealer.id}/toggle-featured`} method="POST">
                      <button type="submit" className={`p-2 transition-colors ${dealer.featured ? "text-orange-500 hover:text-slate-400" : "text-slate-300 hover:text-orange-500"}`} title={dealer.featured ? "Remove Highlight" : "Feature Dealer"}>
                        <Star size={18} fill={dealer.featured ? "currentColor" : "none"} />
                      </button>
                    </form>

                    <Link href={`/dealers/${dealer.slug}`} target="_blank" className="p-2 text-slate-400 hover:text-blue-600 transition-colors" title="Public Profile">
                      <ExternalLink size={16} />
                    </Link>

                    {dealer._count.cars === 0 && (
                      <DeleteButton action={`/api/admin/dealers/${dealer.id}/delete`} message="Permanently terminate this dealer profile?" />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {dealers.length === 0 && (
          <div className="py-20 text-center">
            <Building2 size={40} className="mx-auto text-slate-100 mb-4" />
            <p className="text-sm font-black text-slate-300 uppercase tracking-widest">No dealers in network</p>
          </div>
        )}
      </div>
    </div>
  );
}
