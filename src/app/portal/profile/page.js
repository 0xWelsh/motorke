export const dynamic = "force-dynamic";
import { requireDealer } from "@/lib/auth";
import { db } from "@/lib/db";
import AvatarUpload from "@/components/AvatarUpload";
import { User, Mail, Phone, Shield, Calendar } from "lucide-react";

export const metadata = { title: "Profile Settings — Motorke Dealer Portal" };

export default async function PortalProfilePage() {
  const currentUser = await requireDealer();
  
  const user = await db.user.findUnique({
    where: { id: currentUser.id },
    include: { dealer: true }
  });

  if (!user) return null;

  const inputCls = "w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-sm font-medium text-white outline-none focus:border-orange-500/50 transition-colors placeholder:text-white/20";
  const labelCls = "text-[10px] font-black uppercase tracking-widest text-white/40 ml-1 mb-2 block";

  return (
    <div className="animate-in fade-in duration-700 max-w-2xl">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-white tracking-tight mb-2">Profile Settings</h1>
        <p className="text-sm font-medium text-white/50">Manage your account details and profile appearance.</p>
      </div>

      {/* Avatar Section */}
      <div className="bg-surface border border-white/5 rounded-[2.5rem] p-10 mb-8">
        <div className="flex items-center gap-8">
          <AvatarUpload 
            currentUrl={user.avatarUrl} 
            userName={user.name} 
            size="lg" 
          />
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">{user.name}</h2>
            <p className="text-xs font-bold text-white/40 mt-1">{user.email}</p>
            <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mt-2">
              {user.role} Account
            </p>
            <p className="text-[10px] text-white/30 mt-3">Click your photo to upload a new one</p>
          </div>
        </div>
      </div>

      {/* Account Details */}
      <div className="bg-surface border border-white/5 rounded-[2.5rem] p-10 mb-8">
        <h3 className="text-lg font-black text-white mb-8">Account Information</h3>
        
        <form action="/api/profile/update" method="POST" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Full Name</label>
              <input name="name" defaultValue={user.name} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Email Address</label>
              <input name="email" type="email" defaultValue={user.email} className={inputCls} disabled />
            </div>
          </div>

          <button type="submit" className="bg-orange-600 hover:bg-orange-500 text-white rounded-2xl px-8 py-4 font-black text-sm tracking-wide transition-all shadow-[0_0_15px_rgba(234,88,12,0.3)]">
            Save Changes
          </button>
        </form>
      </div>

      {/* Account Stats */}
      <div className="bg-surface border border-white/5 rounded-[2.5rem] p-10">
        <h3 className="text-lg font-black text-white mb-6">Account Details</h3>
        <div className="space-y-4">
          {[
            { icon: User, label: "Role", value: user.role },
            { icon: Mail, label: "Email", value: user.email },
            { icon: Shield, label: "Email Verified", value: user.emailVerified ? "Yes" : "No" },
            { icon: Calendar, label: "Member Since", value: new Date(user.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" }) },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
              <div className="flex items-center gap-3">
                <Icon size={14} className="text-white/30" />
                <span className="text-xs font-bold text-white/40 uppercase tracking-widest">{label}</span>
              </div>
              <span className="text-sm font-black text-white">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
