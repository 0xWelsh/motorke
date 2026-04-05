// src/app/admin/approvals/page.js
export const dynamic = "force-dynamic";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import DeleteButton from "@/components/DeleteButton";
import { 
  Building2, 
  ShieldCheck, 
  MapPin,
  Car,
  Users,
  MessageSquare,
  Edit3,
  ExternalLink,
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle
} from "lucide-react";

export const metadata = { title: "Moderation Queue — Motorske Admin" };

export default async function AdminApprovalsPage() {
  await requireAdmin();

  const dealers = await db.dealer.findMany({
    where: { verified: false },
    include: { _count: { select: { cars: true, users: true, leads: true } } },
    orderBy: { createdAt: "desc" },
  });

  const gradients = [
    "from-emerald-500 to-teal-500", "from-blue-500 to-indigo-500",
    "from-teal-500 to-emerald-600", "from-cyan-500 to-blue-500",
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-8">
        <div>
          <div className="flex items-center gap-3 mb-3">
             <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)] animate-pulse" />
             <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-amber-500/60">Verification Gateway</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">
            Pending Approvals <span className="text-white/20 font-medium ml-3">/ {dealers.length} Requests</span>
          </h1>
        </div>
      </div>

      {/* ── DATA TABLE ── */}
      <div className="bg-[#0a0c10] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                {["Partner Proposal", "Operational Node", "Status", ""].map((h) => (
                  <th key={h} className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-white/20">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {dealers.map((dealer) => {
                const gradient = gradients[dealer.id.charCodeAt(0) % gradients.length];
                return (
                <tr key={dealer.id} className="group hover:bg-white/[0.02] transition-colors">
                  <td className="px-10 py-7">
                    <div className="flex items-center gap-5">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} text-white flex items-center justify-center font-black text-xl shadow-lg group-hover:scale-105 transition-transform duration-500`}>
                        {dealer.name[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-lg font-black text-white tracking-tight leading-none mb-1.5">{dealer.name}</p>
                        <div className="flex items-center gap-3">
                           <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{dealer.phone}</span>
                           <div className="w-1 h-1 rounded-full bg-white/10" />
                           <span className="text-[10px] font-bold text-emerald-500/60 uppercase tracking-widest">Entry: {new Date(dealer.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-7">
                     <div className="flex items-center gap-2.5 text-white/60 mb-1">
                        <MapPin size={14} className="text-emerald-500/40" />
                        <p className="text-xs font-bold uppercase tracking-widest">{dealer.county || "Unknown Territory"}</p>
                     </div>
                     <p className="text-[11px] font-medium text-white/20 uppercase tracking-tighter">{dealer.location}</p>
                  </td>
                  <td className="px-10 py-7">
                     <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/5 border border-amber-500/10 rounded-full w-fit">
                        <Clock size={12} className="text-amber-500/60" />
                        <span className="text-[10px] font-bold text-amber-500/60 uppercase tracking-widest">
                          Awaiting Validation
                        </span>
                     </div>
                  </td>
                  <td className="px-10 py-7 text-right">
                    <div className="flex items-center justify-end gap-3 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-300">
                      <Link href={`/admin/dealers/${dealer.id}/edit`} className="h-11 px-6 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all border border-white/5 flex items-center gap-2" title="Audit Profile">
                        <Edit3 size={14} /> Inspect
                      </Link>
                      
                      <form action={`/api/admin/dealers/${dealer.id}/toggle-verified`} method="POST">
                        <button type="submit" 
                          className="h-11 px-6 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-500 hover:text-white font-bold text-[10px] uppercase tracking-widest border border-emerald-500/20 hover:border-emerald-600 rounded-xl transition-all shadow-lg flex items-center gap-2"
                        >
                          <CheckCircle2 size={14} /> Authorize
                        </button>
                      </form>

                      <DeleteButton action={`/api/admin/dealers/${dealer.id}/delete`} message="Permanently reject and purge this partner application?" label="Reject" />
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {dealers.length === 0 && (
          <div className="py-32 text-center">
            <div className="w-20 h-20 bg-white/[0.02] rounded-full border border-white/5 flex items-center justify-center mx-auto mb-8">
               <ShieldCheck size={32} className="text-emerald-500/20" />
            </div>
            <p className="text-lg font-black text-white/20 uppercase tracking-[0.3em]">Queue Purged</p>
            <p className="text-sm font-medium text-white/10 mt-2">All partner nodes have been successfully validated.</p>
          </div>
        )}
      </div>
    </div>
  );
}
