// src/app/admin/users/page.js
export const dynamic = "force-dynamic";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Store, 
  User as UserIcon, 
  Edit3, 
  RefreshCw, 
  Ban, 
  CheckCircle2,
  ChevronRight
} from "lucide-react";

export const metadata = { title: "User Directory — Motorke Standard Admin" };

export default async function AdminUsersPage(props) {
  const searchParams = await props.searchParams;
  await requireAdmin();
  const deleted = searchParams?.deleted;

  const users = await db.user.findMany({
    include: { dealer: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  const roleStyles = {
    ADMIN:  "bg-white/10 text-white border-white/20",
    DEALER: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    BUYER:  "bg-white/5 text-white/50 border-white/10",
  };

  return (
    <div className="animate-in fade-in duration-700">
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
             <div className="w-2 h-2 rounded-full bg-orange-600" />
             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Access Management</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            System Identities <span className="text-white/30 font-medium ml-2">({users.length})</span>
          </h1>
        </div>
        
        <Link href="/admin/users/new" className="bg-white/10 border border-white/10 text-pureWhite px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-orange-600 hover:border-orange-500 transition-all shadow-xl">
          <UserPlus size={14} /> Create Identity
        </Link>
      </div>

      {deleted && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm rounded-xl px-4 py-3 mb-8">
          ✓ Profile deleted successfully
        </div>
      )}

      {/* ── DATA TABLE ── */}
      <div className="bg-surface border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10">
              {["User Profile", "Access Role", "Hub Association", "Status", "Joined On", ""].map((h) => (
                <th key={h} className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-white/40">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.map((user) => (
              <tr key={user.id} className="group hover:bg-white/5 transition-colors">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[1.25rem] bg-white/5 border border-white/10 text-white/40 group-hover:bg-white/10 group-hover:text-white flex items-center justify-center font-black text-lg transition-all duration-500 shadow-sm">
                      {user.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-black text-white tracking-tight">{user.name}</p>
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mt-0.5">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                   <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm ${roleStyles[user.role]}`}>
                      {user.role === 'ADMIN' && <ShieldCheck size={10} />}
                      {user.role === 'DEALER' && <Store size={10} />}
                      {user.role === 'BUYER' && <UserIcon size={10} />}
                      {user.role}
                   </span>
                </td>
                <td className="px-8 py-6">
                   <p className="text-xs font-black text-white/60 uppercase tracking-tighter truncate max-w-[150px]">
                      {user.dealer?.name || <span className="text-white/20">—</span>}
                   </p>
                </td>
                <td className="px-8 py-6">
                  <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest ${
                    user.active ? "text-emerald-500" : "text-rose-500"
                  }`}>
                    {user.active ? <CheckCircle2 size={12} /> : <Ban size={12} />}
                    {user.active ? "Active" : "Locked"}
                  </span>
                </td>
                <td className="px-8 py-6 text-[11px] font-black text-white/40 uppercase tracking-tighter">
                   {new Date(user.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex items-center justify-end gap-3 transition-all duration-300">
                    <Link href={`/admin/users/${user.id}/edit`} className="flex items-center gap-2 px-4 py-2 bg-orange-600/20 hover:bg-orange-600 text-orange-500 hover:text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all border border-orange-500/20 hover:border-orange-500 shadow-lg" title="Manage Profile">
                      <Edit3 size={14} /> Manage
                    </Link>
                    
                    <form action={`/api/admin/users/${user.id}/toggle`} method="POST">
                      <button type="submit" className={`p-2 transition-colors ${user.active ? "text-rose-500 hover:text-white/40" : "text-emerald-500 hover:text-white/40"}`} title={user.active ? "Lock Account" : "Unlock Account"}>
                        {user.active ? <Ban size={18} /> : <CheckCircle2 size={18} />}
                      </button>
                    </form>

                    <Link href={`/admin/users/${user.id}/reset-password`} className="p-2 text-white/40 hover:text-orange-500 transition-colors" title="Reset Security">
                      <RefreshCw size={16} />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {users.length === 0 && (
          <div className="py-20 text-center">
            <Users size={40} className="mx-auto text-white/5 mb-4" />
            <p className="text-sm font-black text-white/30 uppercase tracking-widest">No profiles found</p>
          </div>
        )}
      </div>
    </div>
  );
}
