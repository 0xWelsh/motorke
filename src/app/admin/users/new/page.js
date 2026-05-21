// src/app/admin/users/new/page.js
export const dynamic = "force-dynamic";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { 
  ChevronLeft, 
  UserPlus, 
  Mail, 
  Lock, 
  Shield, 
  Building2, 
  AlertTriangle,
  Lightbulb
} from "lucide-react";

export const metadata = { title: "Create Identity | Admin" };

export default async function AdminNewUserPage(props) {
  await requireAdmin();
  const searchParams = await props.searchParams;
  const dealers = await db.dealer.findMany({ orderBy: { name: "asc" } });
  const error   = searchParams?.error;

  const inputCls  = "w-full bg-white dark:bg-[#111111] border border-[#ddd4c8] dark:border-slate-800 rounded-2xl px-4 py-3.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-slate-800 transition-all font-bold";
  const selectCls = "w-full bg-white dark:bg-[#111111] border border-[#ddd4c8] dark:border-slate-800 rounded-2xl px-4 py-3.5 text-sm text-slate-900 dark:text-white outline-none focus:border-slate-800 transition-all font-bold appearance-none";
  const labelCls  = "block text-[11px] font-black uppercase tracking-[0.15em] text-slate-500 mb-2";

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
      <div className="mb-10">
        <Link href="/admin/users" className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400 hover:text-slate-900 dark:text-white transition-colors mb-6">
          <ChevronLeft size={14} /> Back to Directory
        </Link>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Provision Identity</h1>
        <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest mt-2 max-w-xl">
          Create a secure login for a new dealership partner or another system administrator.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white dark:bg-[#111111] border border-[#ddd4c8] dark:border-slate-800 rounded-[2rem] p-8 shadow-none">
            <div className="flex items-center gap-3 mb-8 pb-6 border-b border-slate-100">
               <div className="w-10 h-10 rounded-2xl bg-[#f7f6f3] border border-slate-100 flex items-center justify-center text-slate-500">
                  <UserPlus size={18} />
               </div>
               <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">Identity Details</h2>
                  <p className="text-xs font-medium text-slate-500">Set up credentials and roles</p>
               </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-sm font-bold rounded-2xl px-4 py-3 mb-8 flex items-center gap-2 animate-in fade-in">
                <AlertTriangle size={16} />
                {error === "exists"   && "A user with that email already exists."}
                {error === "mismatch" && "Passwords do not match."}
                {error === "notallowed" && "You cannot create another Admin user."}
                {error === "unknown"  && "Something went wrong. Please try again."}
              </div>
            )}

            <form action="/api/admin/users" method="POST" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className={labelCls}>Full Name</label>
                  <div className="relative">
                     <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><UserPlus size={16} /></span>
                     <input name="name" required placeholder="e.g. Jane Doe" className={`${inputCls} pl-11`} />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className={labelCls}>Contact Email</label>
                  <div className="relative">
                     <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Mail size={16} /></span>
                     <input name="email" type="email" required placeholder="partner@dealership.co.ke" className={`${inputCls} pl-11`} />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Initial Password</label>
                  <div className="relative">
                     <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Lock size={16} /></span>
                     <input name="password" type="password" required minLength={8} className={`${inputCls} pl-11`} placeholder="Required..." />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Confirm Password</label>
                  <div className="relative">
                     <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Lock size={16} /></span>
                     <input name="confirm" type="password" required minLength={8} className={`${inputCls} pl-11`} placeholder="Matches above..." />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>System Role</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Shield size={16} /></span>
                    <select name="role" className={`${selectCls} pl-11`}>
                      <option value="DEALER">Dealer Partner</option>
                      <option value="ADMIN">System Admin</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Link Dealership</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Building2 size={16} /></span>
                    <select name="dealerId" defaultValue="" className={`${selectCls} pl-11`}>
                      <option value="" disabled>Select a dealership</option>
                      {dealers.map((d) => (
                        <option key={d.id} value={d.id}>{d.name} — {d.location}</option>
                      ))}
                    </select>
                  </div>
                  <p className="text-[11px] uppercase font-black tracking-widest text-slate-400 mt-2 ml-1">Not required for Admins</p>
                </div>
              </div>

              <div className="pt-8 mt-4 border-t border-slate-100 flex justify-end">
                <button type="submit" className="bg-slate-900 border border-slate-900 text-white px-8 h-12 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-[#38A169] hover:border-[#38A169] transition-all flex items-center gap-2">
                  Provision Identity
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* SIDEBAR ONBOARDING TIP */}
        <div className="space-y-8">
           <div className="bg-[#f7f6f3] border border-[#ddd4c8] dark:border-slate-800 rounded-[2rem] p-8 shadow-none">
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-[#ddd4c8] dark:border-slate-800/60">
                 <div className="w-10 h-10 rounded-2xl bg-[#f7f6f3] border border-slate-100 flex items-center justify-center text-slate-500 shadow-none">
                    <Lightbulb size={18} />
                 </div>
                 <div>
                    <h2 className="text-lg font-black text-slate-900 dark:text-white">Partner Setup</h2>
                 </div>
              </div>
              
              <ol className="text-xs font-medium text-slate-600 space-y-4 mb-2 leading-relaxed">
                 <li className="flex gap-3 relative">
                    <span className="w-5 h-5 shrink-0 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-[11px]">1</span>
                    <span>Ensure the <Link href="/admin/dealers/new" className="text-slate-900 dark:text-white font-black underline">dealership profile</Link> is created first.</span>
                 </li>
                 <li className="flex gap-3 relative">
                    <span className="w-5 h-5 shrink-0 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-[11px]">2</span>
                    <span>Create their login identity here.</span>
                 </li>
                 <li className="flex gap-3 relative">
                    <span className="w-5 h-5 shrink-0 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-[11px]">3</span>
                    <span>Share the temporary credentials over a secure channel.</span>
                 </li>
                 <li className="flex gap-3 relative">
                    <span className="w-5 h-5 shrink-0 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-[11px]">4</span>
                    <span>The partner will log in at <code className="font-bold text-slate-900 dark:text-white">/portal</code> and start uploading cars.</span>
                 </li>
              </ol>
           </div>
        </div>

      </div>
    </div>
  );
}
