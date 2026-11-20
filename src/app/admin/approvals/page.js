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

export const metadata = { title: "Approvals | BIDGARI Admin" };

export default async function AdminApprovalsPage() {
  await requireAdmin();

  const dealers = await db.dealer.findMany({
    where: { verified: false },
    include: { _count: { select: { cars: true, users: true, leads: true } } },
    orderBy: { createdAt: "desc" },
  });

  const gradients = [
    "from-white/[0.06] to-white/[0.08]",
    "from-[var(--accent)]/10 to-[var(--accent)]/15",
    "from-blue-500/10 to-blue-500/15",
    "from-white/[0.03] to-white/[0.06]",
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-8">
        <div>
          <div className="flex items-center gap-3 mb-3">
             <div className="w-2 h-2 rounded-xl bg-[var(--accent)] shadow-[0_0_8px_rgba(47,133,90,0.45)] animate-pulse" />
             <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-700">Dealer Approval</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            Pending Approvals <span className="text-slate-500 font-medium ml-3">/ {dealers.length} Dealers</span>
          </h1>
        </div>
      </div>

      {/* ── DATA REGISTRY ── */}
      <div className="bg-[#1c1c1c] border border-white/[0.08] rounded-xl overflow-hidden shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.03]">
                {["Dealer", "Details", "Status", ""].map((h) => (
                  <th key={h} className="px-10 py-6 text-[11px] font-black uppercase tracking-[0.25em] text-slate-700">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {dealers.map((dealer) => {
                const gradient = gradients[dealer.id.charCodeAt(0) % gradients.length];
                return (
                <tr key={dealer.id} className="group hover:bg-white/[0.03] transition-colors">
                  <td className="px-10 py-7">
                    <div className="flex items-center gap-5">
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gradient} text-white flex items-center justify-center font-black text-xl border border-white group-hover:scale-105 transition-transform duration-500`}>
                        {dealer.name[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-lg font-black text-slate-900 tracking-tight leading-none mb-1.5 uppercase group-hover:text-[var(--accent)] transition-colors">{dealer.name}</p>
                        <div className="flex items-center gap-3">
                           <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{dealer.phone}</span>
                           <div className="w-1 h-1 rounded-xl bg-white/[0.06]" />
                           <span className="text-[11px] font-bold text-[var(--accent)] uppercase tracking-widest">Entry: {new Date(dealer.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-7">
                     <div className="flex items-center gap-2.5 text-slate-700 mb-1">
                        <MapPin size={14} className="text-[var(--accent)]" />
                        <p className="text-xs font-bold uppercase tracking-widest">{dealer.county || "Unknown Territory"}</p>
                     </div>
                     <p className="text-[11px] font-medium text-slate-500 uppercase tracking-tighter">{dealer.location}</p>
                  </td>
                  <td className="px-10 py-7">
                     <div className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)]/10 border border-[var(--accent)]/20 rounded-xl w-fit shadow-none">
                        <Clock size={12} className="text-[var(--accent)]" />
                        <span className="text-[11px] font-bold text-[var(--accent)] uppercase tracking-widest">
                          Awaiting Validation
                        </span>
                     </div>
                  </td>
                  <td className="px-10 py-7 text-right">
                    <div className="flex items-center justify-end gap-3 sm:opacity-0 lg:group-hover:opacity-100 transition-all duration-300">
                      <Link href={`/admin/dealers/${dealer.id}/edit`} className="h-11 px-6 bg-[#1c1c1c] border border-white/[0.08] text-slate-700 hover:text-slate-900 hover:border-white/[0.15] font-bold text-[11px] uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 shadow-none" title="Audit Profile">
                        <Edit3 size={14} /> Inspect
                      </Link>
                      
                      <form action={`/api/admin/dealers/${dealer.id}/toggle-verified`} method="POST">
                        <button type="submit" 
                          className="h-11 px-6 bg-[var(--accent)] hover:bg-[var(--accent)] text-slate-900 font-bold text-[11px] uppercase tracking-widest border border-transparent rounded-xl transition-all flex items-center gap-2"
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
            <div className="w-20 h-20 bg-white/[0.03] rounded-xl border border-white/[0.06] flex items-center justify-center mx-auto mb-8">
               <ShieldCheck size={32} className="text-slate-500" />
            </div>
            <p className="text-xl font-black text-slate-900 uppercase tracking-tighter">Queue Purged</p>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mt-2 tracking-wide">All partner nodes have been successfully validated.</p>
          </div>
        )}
      </div>
    </div>
  );
}
