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
    ADMIN:  "bg-slate-900 text-white border-slate-900",
    DEALER: "bg-[#ff5a2f]/10 text-[#ff5a2f] border-[#ff5a2f]/20",
    BUYER:  "bg-[#f7f6f3] text-slate-600 border-[#ddd4c8] dark:border-slate-800",
  };

  return (
    <div className="animate-in fade-in duration-700">
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
             <div className="w-2 h-2 rounded-2xl bg-[#ff5a2f]" />
             <span className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500">Access Management</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            System Identities <span className="text-slate-500 font-medium ml-2">({users.length})</span>
          </h1>
        </div>
        
        <Link href="/admin/users/new" className="bg-slate-900 border border-slate-900 text-white px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-[#ff5a2f] hover:border-[#ff5a2f] transition-all shadow-none">
          <UserPlus size={14} /> Create Identity
        </Link>
      </div>

      {deleted && (
        <div className="bg-[#ff5a2f]/10 border border-[#ff5a2f]/20 text-[#ff5a2f] text-sm rounded-2xl px-4 py-3 mb-8">
          ✓ Profile deleted successfully
        </div>
      )}

      {/* ── DATA TABLE ── */}
      <div className="bg-white dark:bg-[#111111] border border-[#ddd4c8] dark:border-slate-800 rounded-[3rem] overflow-hidden shadow-none">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              {["User Profile", "Access Role", "Hub Association", "Status", "Joined On", ""].map((h) => (
                <th key={h} className="px-8 py-5 text-[11px] font-black uppercase tracking-[0.2em] text-slate-700">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user) => (
              <tr key={user.id} className="group hover:bg-slate-50/50 transition-colors">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[1.25rem] bg-slate-100 border border-[#ddd4c8] dark:border-slate-800 text-white group-hover:bg-slate-900 group-hover:text-white flex items-center justify-center font-black text-lg transition-all duration-500 shadow-none">
                      {user.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 dark:text-white tracking-tight">{user.name}</p>
                      <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mt-0.5">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                   <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-2xl text-[9px] font-black uppercase tracking-widest border ${roleStyles[user.role]}`}>
                      {user.role === 'ADMIN' && <ShieldCheck size={10} />}
                      {user.role === 'DEALER' && <Store size={10} />}
                      {user.role === 'BUYER' && <UserIcon size={10} />}
                      {user.role}
                   </span>
                </td>
                <td className="px-8 py-6">
                   <p className="text-xs font-black text-slate-600 uppercase tracking-tighter truncate max-w-[150px]">
                      {user.dealer?.name || <span className="text-slate-300">—</span>}
                   </p>
                </td>
                <td className="px-8 py-6">
                  <span className={`inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest ${
                    user.active ? "text-[#ff5a2f]" : "text-slate-400"
                  }`}>
                    {user.active ? <CheckCircle2 size={12} /> : <Ban size={12} />}
                    {user.active ? "Active" : "Locked"}
                  </span>
                </td>
                <td className="px-8 py-6 text-[11px] font-black text-slate-600 uppercase tracking-tighter">
                   {new Date(user.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex items-center justify-end gap-3 transition-all duration-300 opacity-0 group-hover:opacity-100">
                    <Link href={`/admin/users/${user.id}/edit`} className="flex items-center gap-2 px-4 py-2 bg-white hover:border-emerald-200 hover:text-[#ff5a2f] text-slate-700 font-black text-[11px] uppercase tracking-widest rounded-2xl transition-all border border-[#ddd4c8] dark:border-slate-800 shadow-none" title="Manage Profile">
                      <Edit3 size={14} /> Manage
                    </Link>
                    
                    <form action={`/api/admin/users/${user.id}/toggle`} method="POST">
                      <button type="submit" className={`p-2 transition-colors ${user.active ? "text-slate-400 hover:text-slate-900 dark:text-white" : "text-[#ff5a2f] hover:text-[#e54a1f]"}`} title={user.active ? "Lock Account" : "Unlock Account"}>
                        {user.active ? <Ban size={18} /> : <CheckCircle2 size={18} />}
                      </button>
                    </form>

                    <Link href={`/admin/users/${user.id}/edit#security`} className="p-2 text-slate-400 hover:text-[#ff5a2f] transition-colors" title="Reset Security">
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
            <Users size={40} className="mx-auto text-slate-200 mb-4" />
            <p className="text-sm font-black text-slate-600 uppercase tracking-widest">No profiles found</p>
          </div>
        )}
      </div>
    </div>
  );
}
