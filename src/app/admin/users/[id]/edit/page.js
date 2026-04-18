// src/app/admin/users/[id]/edit/page.js
export const dynamic = "force-dynamic";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import DeleteButton from "@/components/DeleteButton";
import AdminAvatarUpload from "@/components/AdminAvatarUpload";
import { 
  ChevronLeft, 
  User, 
  Lock, 
  AlertTriangle,
  Mail,
  Shield,
  Building2,
  Key
} from "lucide-react";

export const metadata = { title: "Edit User — Admin" };

export default async function AdminEditUserPage(props) {
  await requireAdmin();
  const params = await props.params;
  const searchParams = await props.searchParams;

  const [user, dealers] = await Promise.all([
    db.user.findUnique({
      where:   { id: params.id },
      include: { dealer: { select: { name: true } } },
    }),
    db.dealer.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  if (!user) notFound();

  const saved = searchParams?.saved;
  const error = searchParams?.error;

  const inputCls  = "w-full bg-white dark:bg-[#111111] border border-[#ddd4c8] dark:border-slate-800 rounded-2xl px-4 py-3.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-slate-800 transition-all font-bold";
  const selectCls = "w-full bg-white dark:bg-[#111111] border border-[#ddd4c8] dark:border-slate-800 rounded-2xl px-4 py-3.5 text-sm text-slate-900 dark:text-white outline-none focus:border-slate-800 transition-all font-bold appearance-none";
  const labelCls  = "block text-[11px] font-black uppercase tracking-[0.15em] text-slate-500 mb-2";

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
      <div className="mb-10">
        <Link href="/admin/users" className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400 hover:text-slate-900 dark:text-white transition-colors mb-8">
          <ChevronLeft size={14} /> Back to Directory
        </Link>
        
        <div className="flex flex-col sm:flex-row sm:items-center gap-6 bg-white p-8 rounded-[2rem] border border-[#ddd4c8] dark:border-slate-800 shadow-none">
          <div className="shrink-0 flex items-center justify-center bg-[#f7f6f3] border border-dashed border-[#ddd4c8] dark:border-slate-800 rounded-3xl p-2 h-28 w-28">
             <AdminAvatarUpload currentUrl={user.avatarUrl} targetId={user.id} targetType="user" name={user.name} size="lg" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{user.name}</h1>
            <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest mt-1 mb-3">{user.email}</p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex px-3 py-1 rounded-2xl bg-slate-100 text-slate-600 text-[11px] font-black uppercase tracking-widest">
                ID: {user.id.slice(-8)}
              </span>
              <span className={`inline-flex px-3 py-1 rounded-2xl text-[11px] font-black uppercase tracking-widest ${user.active ? 'bg-[#ff5a2f]]/10 text-[#ff5a2f]' : 'bg-red-50 text-red-600'}`}>
                {user.active ? 'Active' : 'Locked'}
              </span>
              <span className="inline-flex px-3 py-1 rounded-2xl bg-slate-100 text-slate-700 text-[11px] font-black uppercase tracking-widest">
                {user.role}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* PROFILE EDIT FORM */}
          <div className="bg-white dark:bg-[#111111] border border-[#ddd4c8] dark:border-slate-800 rounded-[2rem] p-8 shadow-none">
            <div className="flex items-center gap-3 mb-8 pb-6 border-b border-slate-100">
               <div className="w-10 h-10 rounded-2xl bg-[#f7f6f3] border border-slate-100 flex items-center justify-center text-slate-500">
                  <User size={18} />
               </div>
               <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">Profile Information</h2>
                  <p className="text-xs font-medium text-slate-500">Update general account details</p>
               </div>
            </div>

            {saved === "profile" && (
              <div className="bg-[#ff5a2f]]/10 border border-[#ff5a2f]]/20 text-[#ff5a2f] text-sm font-bold rounded-2xl px-4 py-3 mb-8 flex items-center gap-2 animate-in fade-in">
                ✓ Profile saved successfully
              </div>
            )}
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-sm font-bold rounded-2xl px-4 py-3 mb-8 flex items-center gap-2 animate-in fade-in">
                <AlertTriangle size={16} /> 
                {error === "exists" ? "That email is already in use." : 
                 error === "notallowed" ? "You cannot grant Admin rights." : 
                 error === "self_delete" ? "You cannot delete your own account." : 
                 error === "delete_failed" ? "Failed to delete user." : 
                 error === "short" ? "Password must be at least 8 characters long." : 
                 "Something went wrong."}
              </div>
            )}

            <form action={`/api/admin/users/${params.id}`} method="POST" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelCls}>Full Name</label>
                  <div className="relative">
                     <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><User size={16} /></span>
                     <input name="name" required defaultValue={user.name} className={`${inputCls} pl-11`} placeholder="e.g. John Doe" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Email Address</label>
                  <div className="relative">
                     <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Mail size={16} /></span>
                     <input name="email" type="email" required defaultValue={user.email} className={`${inputCls} pl-11`} placeholder="john@example.com" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>System Role</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Shield size={16} /></span>
                    <select name="role" defaultValue={user.role} className={`${selectCls} pl-11`}>
                      <option value="DEALER">Dealer</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Linked Dealership</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Building2 size={16} /></span>
                    <select name="dealerId" defaultValue={user.dealerId || ""} className={`${selectCls} pl-11`}>
                      <option value="">Unassigned</option>
                      {dealers.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button type="submit" className="bg-slate-900 border border-slate-900 text-white px-8 h-12 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-[#ff5a2f] hover:border-[#ff5a2f] transition-all shadow-none">
                  Save Details
                </button>
              </div>
            </form>
          </div>

          {/* RESET PASSWORD */}
          <div id="security" className="bg-white dark:bg-[#111111] border border-[#ddd4c8] dark:border-slate-800 rounded-[2rem] p-8 shadow-none">
            <div className="flex items-center gap-3 mb-8 pb-6 border-b border-slate-100">
               <div className="w-10 h-10 rounded-2xl bg-[#f7f6f3] border border-slate-100 flex items-center justify-center text-slate-500">
                  <Lock size={18} />
               </div>
               <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">Force Password Reset</h2>
                  <p className="text-xs font-medium text-slate-500">Generate a new temporary password</p>
               </div>
            </div>

            {saved === "password" && (
              <div className="bg-[#ff5a2f]]/10 border border-[#ff5a2f]]/20 text-[#ff5a2f] text-sm font-bold rounded-2xl px-4 py-3 mb-8 flex items-center gap-2 animate-in fade-in">
                ✓ New password successfully set
              </div>
            )}

            <form action={`/api/admin/users/${params.id}/reset-password`} method="POST" className="space-y-6">
              <div>
                <label className={labelCls}>New Password</label>
                <div className="relative">
                   <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Key size={16} /></span>
                   <input name="password" type="password" required minLength={8} className={`${inputCls} pl-11`} placeholder="Requires at least 8 characters..." />
                </div>
                <p className="text-xs text-slate-500 font-medium mt-3">
                  Upon saving, the user's active sessions will be terminated and they will need to sign in with this new password.
                </p>
              </div>
              <div className="pt-4 flex justify-end">
                <button type="submit" className="bg-white dark:bg-[#111111] border border-[#ddd4c8] dark:border-slate-800 text-slate-700 px-8 h-12 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:border-slate-800 hover:text-slate-900 dark:text-white transition-all shadow-none">
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* SIDEBAR */}
        <div className="space-y-8">
           <div className="bg-red-50 border border-red-100 rounded-[2rem] p-8">
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-red-200/50">
                 <div className="w-10 h-10 rounded-2xl bg-red-100 border border-red-200 flex items-center justify-center text-red-600">
                    <AlertTriangle size={18} />
                 </div>
                 <div>
                    <h2 className="text-lg font-black text-red-900">Danger Zone</h2>
                 </div>
              </div>
              
              <ul className="text-xs font-medium text-red-700 space-y-3 mb-8 leading-relaxed list-disc list-inside px-2">
                 <li>Deleting this profile permanently removes access</li>
                 <li>All active sessions will be killed instantly</li>
                 <li>Data tied exclusively to this user may be anonymized or erased</li>
              </ul>

              <DeleteButton 
                action={`/api/admin/users/${params.id}/delete`} 
                message="Permanently delete this user's profile and revoke access? This cannot be undone." 
                label="Delete Profile" 
                className="w-full bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-[11px] h-12 rounded-2xl transition-colors shadow-red-600/20"
              />
           </div>
        </div>
      </div>
    </div>
  );
}
