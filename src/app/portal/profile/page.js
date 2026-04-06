export const dynamic = "force-dynamic";
import { requireDealer } from "@/lib/auth";
import { db } from "@/lib/db";
import AvatarUpload from "@/components/AvatarUpload";
import DealerLogoUpload from "@/components/DealerLogoUpload";
import { User, Mail, Shield, Calendar, Plus, Building2, MapPin, Globe, Phone } from "lucide-react";

export const metadata = { title: "Profile Settings — Motorke Dealer Portal" };

const COUNTIES = [
  "Nairobi", "Mombasa", "Kisumu", "Nakuru", "Uasin Gishu", "Kiambu", "Machakos",
  "Kajiado", "Muranga", "Nyeri", "Meru", "Embu", "Kilifi", "Kwale", "Laikipia", "Other",
];

export default async function PortalProfilePage({ searchParams }) {
  const currentUser = await requireDealer();
  const sp = await searchParams;
  const saved = sp?.saved;
  const error = sp?.error;
  
  const user = await db.user.findUnique({
    where: { id: currentUser.id },
    include: {
      dealer: {
        include: {
          _count: { select: { cars: { where: { available: true } } } },
        },
      },
    },
  });

  if (!user) return null;

  const inputCls = "w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 text-sm font-bold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-all placeholder:text-slate-300 shadow-sm";
  const labelCls = "text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 mb-2.5 block";
  const selectCls = "w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 text-sm font-bold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-sm";

  return (
    <div className="animate-in fade-in duration-700 max-w-4xl">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Security & Identity</h1>
        <p className="text-slate-500 font-medium mt-1">Manage your dealership presence and access credentials.</p>
      </div>

      {saved && (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">
          Profile saved successfully.
        </div>
      )}
      {error && (
        <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-rose-700">
          Something went wrong. Please try again.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          {/* Personal Avatar Section */}
          <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row items-center gap-8">
              <div className="relative group hover:scale-105 transition-transform">
                <AvatarUpload 
                  currentUrl={user.avatarUrl} 
                  userName={user.name} 
                  size="xl" 
                />
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full border-[3px] border-white flex items-center justify-center text-white shadow-md">
                   <Plus size={14} strokeWidth={3} />
                </div>
              </div>
              <div className="text-center sm:text-left">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{user.name}</h2>
                <p className="text-sm font-medium text-slate-500 mt-0.5">{user.email}</p>
                <div className="flex items-center justify-center sm:justify-start gap-2 mt-4">
                  <span className="text-[10px] font-black bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-100">
                    {user.role} Partner
                  </span>
                  {user.dealer?.verified && (
                    <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-3 py-1 rounded-full uppercase tracking-widest border border-blue-100 flex items-center gap-1">
                      <Shield size={10} className="fill-blue-100" /> Verified Showroom
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Dealership Brand Section */}
          {user.dealer && (
            <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
                <div className="relative group hover:scale-105 transition-transform">
                  <DealerLogoUpload currentUrl={user.dealer.logoUrl} dealerName={user.dealer.name} size="xl" />
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#ff5a2f] rounded-full border-[3px] border-white flex items-center justify-center text-white shadow-md">
                    <Plus size={14} strokeWidth={3} />
                  </div>
                </div>

                <div className="text-center sm:text-left">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">{user.dealer.name}</h2>
                  <p className="text-sm font-medium text-slate-500 mt-0.5">Brand image shown to buyers on public dealer pages.</p>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-4">
                    <span className="text-[10px] font-black bg-slate-50 text-slate-600 px-3 py-1 rounded-full uppercase tracking-widest border border-slate-200">
                      {user.dealer.county}
                    </span>
                    <span className="text-[10px] font-black bg-slate-50 text-slate-600 px-3 py-1 rounded-full uppercase tracking-widest border border-slate-200">
                      {user.dealer._count?.cars || 0} Live Cars
                    </span>
                    {user.dealer.verified && (
                      <span className="text-[10px] font-black bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-200">
                        Verified Showroom
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Dealership Details */}
          {user.dealer && (
            <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-10">
                <div className="w-1.5 h-1.5 rounded-full bg-[#ff5a2f]" />
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Dealership Public Profile</h3>
              </div>

              <form action="/api/portal/profile" method="POST" className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className={labelCls}>Dealership Name</label>
                    <input name="name" defaultValue={user.dealer.name} className={inputCls} required />
                  </div>
                  <div>
                    <label className={labelCls}>County</label>
                    <select name="county" defaultValue={user.dealer.county} className={selectCls}>
                      {COUNTIES.map((county) => (
                        <option key={county} value={county}>{county}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Area / Location</label>
                  <input name="location" defaultValue={user.dealer.location || ""} className={inputCls} required />
                </div>

                <div>
                  <label className={labelCls}>Full Address</label>
                  <input name="address" defaultValue={user.dealer.address || ""} className={inputCls} placeholder="Street, building, nearby landmark" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className={labelCls}>Business Phone</label>
                    <input name="phone" defaultValue={user.dealer.phone || ""} className={inputCls} required />
                  </div>
                  <div>
                    <label className={labelCls}>WhatsApp</label>
                    <input name="whatsapp" defaultValue={user.dealer.whatsapp || ""} className={inputCls} placeholder="2547XXXXXXXX" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className={labelCls}>Business Email</label>
                    <input name="email" type="email" defaultValue={user.dealer.email || ""} className={inputCls} placeholder="sales@dealership.co.ke" />
                  </div>
                  <div>
                    <label className={labelCls}>Website</label>
                    <input name="website" type="url" defaultValue={user.dealer.website || ""} className={inputCls} placeholder="https://" />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Short About</label>
                  <textarea
                    name="description"
                    defaultValue={user.dealer.description || ""}
                    rows={4}
                    className={`${inputCls} resize-none`}
                    placeholder="Tell buyers what makes your showroom trustworthy and different."
                  />
                </div>

                <div className="pt-2">
                  <button type="submit" className="bg-slate-900 hover:bg-black text-white rounded-xl px-8 py-3.5 font-black text-xs tracking-widest transition-all shadow-md mt-2 hover:-translate-y-0.5 uppercase">
                    Save Dealership Profile
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Account Details */}
          <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-10">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
               <h3 className="text-lg font-black text-slate-900 tracking-tight">Identity Details</h3>
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
                    <input name="email" type="email" defaultValue={user.email} className={`${inputCls} bg-slate-50/50 text-slate-400 cursor-not-allowed`} disabled />
                    <Shield className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-200" size={16} />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button type="submit" className="bg-slate-900 hover:bg-black text-white rounded-xl px-8 py-3.5 font-black text-xs tracking-widest transition-all shadow-md mt-2 hover:-translate-y-0.5 uppercase">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-8">
          <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
               <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
               <h3 className="text-xs font-black text-slate-900 tracking-widest uppercase">Overview</h3>
            </div>
            <div className="space-y-6">
              {[
                { icon: User, label: "System Role", value: user.role },
                { icon: Building2, label: "Dealer Profile", value: user.dealer?.name || "Not linked" },
                { icon: MapPin, label: "Primary Location", value: user.dealer?.location || "Not set" },
                { icon: Phone, label: "Business Phone", value: user.dealer?.phone || "Not set" },
                { icon: Globe, label: "Website", value: user.dealer?.website || "Not set" },
                { icon: Mail, label: "Auth Scope", value: "Enterprise" },
                { icon: Shield, label: "Trust Score", value: user.emailVerified ? "100%" : "Pending" },
                { icon: Calendar, label: "Member For", value: new Date(user.createdAt).toLocaleDateString("en-KE", { month: "short", year: "numeric" }) },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="group">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon size={12} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
                  </div>
                  <p className="text-sm font-black text-slate-900 ml-5">{value}</p>
                </div>
              ))}
            </div>
            
            <div className="mt-10 pt-10 border-t border-slate-50">
               <p className="text-[10px] font-bold text-slate-400 italic leading-relaxed">
                 Need to change your registered email or dealership name? Contact our partner support team.
               </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
