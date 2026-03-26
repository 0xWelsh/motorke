// src/app/admin/users/page.js
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

export default async function AdminUsersPage() {
  await requireAdmin();

  const users = await db.user.findMany({
    include: { dealer: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  const roleStyles = {
    ADMIN:  "bg-slate-950 text-white border-slate-950",
    DEALER: "bg-orange-50 text-orange-600 border-orange-100",
    BUYER:  "bg-slate-50 text-slate-500 border-slate-100",
  };

  return (
    <div className="animate-in fade-in duration-700">
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
             <div className="w-2 h-2 rounded-full bg-orange-600" />
             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Access Management</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            System Identities <span className="text-slate-300 font-medium ml-2">({users.length})</span>
          </h1>
        </div>
        
        <Link href="/admin/users/new" className="bg-slate-950 text-white px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-orange-600 transition-all shadow-2xl shadow-slate-200">
          <UserPlus size={14} /> Create Identity
        </Link>
      </div>

      {/* ── DATA TABLE ── */}
      <div className="bg-white border border-slate-100 rounded-[3rem] overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              {["User Profile", "Access Role", "Hub Association", "Status", "Joined On", ""].map((h) => (
                <th key={h} className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {users.map((user) => (
              <tr key={user.id} className="group hover:bg-slate-50/50 transition-colors">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[1.25rem] bg-slate-100 text-slate-400 group-hover:bg-slate-950 group-hover:text-white flex items-center justify-center font-black text-lg transition-all duration-500 shadow-sm group-hover:shadow-xl group-hover:shadow-slate-200">
                      {user.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 tracking-tight">{user.name}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{user.email}</p>
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
                   <p className="text-xs font-black text-slate-600 uppercase tracking-tighter truncate max-w-[150px]">
                      {user.dealer?.name || <span className="text-slate-200">—</span>}
                   </p>
                </td>
                <td className="px-8 py-6">
                  <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest ${
                    user.active ? "text-emerald-600" : "text-rose-500"
                  }`}>
                    {user.active ? <CheckCircle2 size={12} /> : <Ban size={12} />}
                    {user.active ? "Active" : "Locked"}
                  </span>
                </td>
                <td className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-tighter">
                   {new Date(user.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <Link href={`/admin/users/${user.id}/edit`} className="p-2 text-slate-400 hover:text-slate-900 transition-colors" title="Edit Profile">
                      <Edit3 size={16} />
                    </Link>
                    
                    <form action={`/api/admin/users/${user.id}/toggle`} method="POST">
                      <button type="submit" className={`p-2 transition-colors ${user.active ? "text-rose-400 hover:text-rose-600" : "text-emerald-400 hover:text-emerald-600"}`} title={user.active ? "Lock Account" : "Unlock Account"}>
                        {user.active ? <Ban size={18} /> : <CheckCircle2 size={18} />}
                      </button>
                    </form>

                    <Link href={`/admin/users/${user.id}/reset-password`} className="p-2 text-slate-400 hover:text-orange-600 transition-colors" title="Reset Security">
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
            <Users size={40} className="mx-auto text-slate-100 mb-4" />
            <p className="text-sm font-black text-slate-300 uppercase tracking-widest">No profiles found</p>
          </div>
        )}
      </div>
    </div>
  );
}
