export const dynamic = "force-dynamic";
import { requireDealer } from "@/lib/auth";
import { db } from "@/lib/db";
import AvatarUpload from "@/components/AvatarUpload";
import { User, Mail, Phone, Shield, Calendar, Plus } from "lucide-react";

export const metadata = { title: "Profile Settings — Motorke Dealer Portal" };

export default async function PortalProfilePage() {
  const currentUser = await requireDealer();
  
  const user = await db.user.findUnique({
    where: { id: currentUser.id },
    include: { dealer: true }
  });

  if (!user) return null;

  const inputCls = "w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-black outline-none focus:border-[var(--brand)] transition-all placeholder:text-white shadow-sm";
  const labelCls = "text-[10px] font-black uppercase tracking-[0.2em] text-white ml-1 mb-2.5 block";

  return (
    <div className="animate-in fade-in duration-700 max-w-4xl">
      <div className="mb-12">
        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--brand)] mb-2.5 block">Account Settings</span>
        <h1 className="text-5xl font-black text-black tracking-tight">Security & Identity</h1>
        <p className="text-black font-bold mt-2">Manage your dealership presence and access credentials.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          {/* Avatar Section */}
          <div className="bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-col sm:flex-row items-center gap-10">
              <div className="relative group">
                <AvatarUpload 
                  currentUrl={user.avatarUrl} 
                  userName={user.name} 
                  size="xl" 
                />
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center text-white shadow-lg">
                   <Plus size={14} strokeWidth={3} />
                </div>
              </div>
              <div className="text-center sm:text-left">
                <h2 className="text-2xl font-black text-black tracking-tight">{user.name}</h2>
                <p className="text-sm font-bold text-white mt-1">{user.email}</p>
                <div className="flex items-center justify-center sm:justify-start gap-2 mt-4">
                  <span className="text-[10px] font-black bg-emerald-50 text-black px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-100">
                    {user.role} Partner
                  </span>
                  {user.dealer?.verified && (
                    <span className="text-[10px] font-black bg-blue-50 text-black px-3 py-1 rounded-full uppercase tracking-widest border border-blue-100">
                      Verified Showroom
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Account Details */}
          <div className="bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 mb-10">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
               <h3 className="text-lg font-black text-black tracking-tight">Identity Details</h3>
            </div>
            
            <form action="/api/profile/update" method="POST" className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className={labelCls}>Legal Representative Name</label>
                  <input name="name" defaultValue={user.name} className={inputCls} placeholder="John Doe" />
                </div>
                <div>
                  <label className={labelCls}>Registered Email (Locked)</label>
                  <div className="relative">
                    <input name="email" type="email" defaultValue={user.email} className={`${inputCls} bg-slate-50/50 text-white cursor-not-allowed`} disabled />
                    <Shield className="absolute right-5 top-1/2 -translate-y-1/2 text-white" size={16} />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white rounded-2xl px-12 py-5 font-black text-sm tracking-widest transition-all shadow-xl shadow-slate-900/10 hover:scale-[1.02] uppercase">
                  Synchronize Profile
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-8">
          <div className="bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
               <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
               <h3 className="text-sm font-black text-black tracking-[0.1em] uppercase">Partnership Meta</h3>
            </div>
            <div className="space-y-6">
              {[
                { icon: User, label: "System Role", value: user.role },
                { icon: Mail, label: "Auth Scope", value: "Enterprise" },
                { icon: Shield, label: "Trust Score", value: user.emailVerified ? "100%" : "Pending" },
                { icon: Calendar, label: "Member For", value: new Date(user.createdAt).toLocaleDateString("en-KE", { month: "short", year: "numeric" }) },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="group">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon size={12} className="text-white group-hover:text-black transition-colors" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">{label}</span>
                  </div>
                  <p className="text-sm font-black text-black ml-5">{value}</p>
                </div>
              ))}
            </div>
            
            <div className="mt-10 pt-10 border-t border-slate-50">
               <p className="text-[10px] font-bold text-white italic leading-relaxed">
                 Need to change your registered email or dealership name? Contact our partner support team.
               </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
