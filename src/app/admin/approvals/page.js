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
  ExternalLink
} from "lucide-react";

export const metadata = { title: "Pending Approvals — Motorke Standard Admin" };

export default async function AdminApprovalsPage() {
  await requireAdmin();

  const dealers = await db.dealer.findMany({
    where: { verified: false },
    include: { _count: { select: { cars: true, users: true, leads: true } } },
    orderBy: { createdAt: "desc" },
  });

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
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Verification Queue</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Pending Approvals <span className="text-white/30 font-medium ml-2">({dealers.length})</span>
          </h1>
        </div>
      </div>

      {/* ── DATA TABLE ── */}
      <div className="bg-surface border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border-light bg-white/[0.02]">
              {["Dealership Hub", "Geographic", "Verification", ""].map((h) => (
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
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mt-0.5">{dealer.phone}</p>
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
                   <span className="text-[10px] font-black text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-full uppercase tracking-widest border border-amber-500/20">
                     Awaiting Review
                   </span>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex items-center justify-end gap-3 transition-all duration-300">
                    <Link href={`/admin/dealers/${dealer.id}/edit`} className="flex items-center gap-2 px-4 py-2 bg-orange-600/20 hover:bg-orange-600 text-orange-500 hover:text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all border border-orange-500/20 hover:border-orange-500 shadow-lg" title="Manage Hub">
                      <Edit3 size={14} /> Review Options
                    </Link>
                    
                    <form action={`/api/admin/dealers/${dealer.id}/toggle-verified`} method="POST">
                      <button type="submit" 
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-500 hover:text-white font-black text-[10px] uppercase tracking-widest border border-emerald-500/20 hover:border-emerald-500 rounded-xl transition-all shadow-lg"
                        title="Approve Dealer"
                      >
                        <ShieldCheck size={14} /> Approve
                      </button>
                    </form>

                    <DeleteButton action={`/api/admin/dealers/${dealer.id}/delete`} message="Reject application and permanently terminate this profile?" label="Reject" />
                  </div>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
        
        {dealers.length === 0 && (
          <div className="py-24 text-center">
            <ShieldCheck size={48} className="mx-auto text-emerald-500/30 mb-4" />
            <p className="text-sm font-black text-white/30 uppercase tracking-widest">All Caught Up</p>
            <p className="text-xs font-medium text-white/20 mt-1">There are no pending dealership approvals right now.</p>
          </div>
        )}
      </div>
    </div>
  );
}
