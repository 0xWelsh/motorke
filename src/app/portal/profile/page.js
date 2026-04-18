export const dynamic = "force-dynamic";
import { requireDealer } from "@/lib/auth";
import { db } from "@/lib/db";
import AvatarUpload from "@/components/AvatarUpload";
import DealerLogoUpload from "@/components/DealerLogoUpload";
import DealerBannerUpload from "@/components/DealerBannerUpload";
import LocationPicker from "@/components/LocationPicker";
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

  const inputCls = "w-full bg-white dark:bg-[#111111] border border-[#ddd4c8] dark:border-slate-800 rounded-2xl px-4 py-2.5 text-[11px] uppercase font-black tracking-[0.10em] font-medium text-slate-900 dark:text-white outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-700 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[4px_4px_0px_0px_rgba(0,0,0,0.05)]";
  const labelCls = "text-[11px] uppercase font-black tracking-[0.15em] font-bold uppercase tracking-wide text-slate-700 mb-2 block";
  const selectCls = "w-full bg-white dark:bg-[#111111] border border-[#ddd4c8] dark:border-slate-800 rounded-2xl px-4 py-2.5 text-[11px] uppercase font-black tracking-[0.10em] font-medium text-slate-900 dark:text-white outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[4px_4px_0px_0px_rgba(0,0,0,0.05)]";

  return (
    <div className="w-full max-w-4xl">
      <div className="mb-8 sm:mb-10">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-1 sm:mb-2\">Account Settings</h1>
        <p className="text-[11px] uppercase font-black tracking-[0.15em] sm:text-[11px] uppercase font-black tracking-[0.10em] text-slate-700 font-medium\">Manage your dealer profile and account details.</p>
      </div>

      {saved && (
        <div className="mb-6 rounded-2xl border border-[#ddd4c8] dark:border-slate-800 bg-[#fbfcfe] dark:bg-[#111111] px-4 py-3 text-[11px] uppercase font-black tracking-[0.15em] font-semibold text-slate-700\">
          Profile saved successfully.
        </div>
      )}
      {error && (
        <div className="mb-6 rounded-2xl border border-[#ddd4c8] dark:border-slate-800 bg-[#fbfcfe] dark:bg-[#111111] px-4 py-3 text-[11px] uppercase font-black tracking-[0.15em] font-semibold text-slate-700\">
          Something went wrong. Please try again.
        </div>
      )}

      {/* Account Overview - Top Section */}
      <div className="bg-white dark:bg-[#111111] border border-[#ddd4c8] dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[4px_4px_0px_0px_rgba(0,0,0,0.05)] mb-8 sm:mb-10\">
        <h3 className="text-[11px] uppercase font-black tracking-[0.15em] font-bold text-slate-900 dark:text-white uppercase tracking-wide mb-4 sm:mb-6\">Account Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6\">
          {[
            { icon: User, label: "Role", value: user.role },
            { icon: Building2, label: "Dealership", value: user.dealer?.name || "Not linked" },
            { icon: MapPin, label: "Location", value: user.dealer?.location || "Not set" },
            { icon: Phone, label: "Phone", value: user.dealer?.phone || "Not set" },
            { icon: Globe, label: "Website", value: user.dealer?.website || "Not set" },
            { icon: Mail, label: "Scope", value: "Enterprise" },
            { icon: Shield, label: "Trust", value: user.emailVerified ? "100%" : "Pending" },
            { icon: Calendar, label: "Member Since", value: new Date(user.createdAt).toLocaleDateString("en-KE", { month: "short", year: "numeric" }) },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label}>
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                <Icon size={12} className="text-slate-700" />
                <span className="text-[11px] sm:text-[11px] uppercase font-black tracking-[0.15em] font-bold text-slate-700 uppercase tracking-wide">{label}</span>
              </div>
              <p className="text-[11px] uppercase font-black tracking-[0.15em] sm:text-[11px] uppercase font-black tracking-[0.10em] font-semibold text-slate-900 dark:text-white truncate">{value}</p>
            </div>
          ))}
        </div>
        
        <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-[#ddd4c8] dark:border-slate-800">
          <p className="text-[11px] uppercase font-black tracking-[0.15em] text-slate-700 leading-relaxed">
             Need to change your registered email or dealership name? Contact partner support.
           </p>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="space-y-8">
          {/* Personal Avatar Section */}
          <div className="bg-white dark:bg-[#111111] border border-[#ddd4c8] dark:border-slate-800 rounded-2xl p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[4px_4px_0px_0px_rgba(0,0,0,0.05)]">
            <div className="flex flex-col sm:flex-row items-center gap-8">
              <div className="relative">
                <AvatarUpload 
                  currentUrl={user.avatarUrl} 
                  userName={user.name} 
                  size="xl" 
                />
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#111111] rounded-2xl border-[3px] border-white flex items-center justify-center text-white shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[8px_8px_0px_0px_rgba(0,0,0,0.05)]">
                   <Plus size={14} strokeWidth={3} />
                </div>
              </div>
              <div className="text-center sm:text-left">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{user.name}</h2>
                <p className="text-[11px] uppercase font-black tracking-[0.10em] text-slate-700 mt-0.5">{user.email}</p>
                <div className="flex items-center justify-center sm:justify-start gap-2 mt-4">
                  <span className="text-[11px] uppercase font-black tracking-[0.15em] font-semibold bg-[#fbfcfe] dark:bg-[#111111] text-slate-700 px-3 py-1 rounded border border-[#ddd4c8] dark:border-slate-800">
                    {user.role}
                  </span>
                  {user.dealer?.verified && (
                    <span className="text-[11px] uppercase font-black tracking-[0.15em] font-semibold bg-[#fbfcfe] dark:bg-[#111111] text-slate-700 px-3 py-1 rounded border border-[#ddd4c8] dark:border-slate-800 flex items-center gap-1">
                      <Shield size={10} /> Verified
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Dealership Brand Section */}
          {user.dealer && (
            <div className="bg-white dark:bg-[#111111] border border-[#ddd4c8] dark:border-slate-800 rounded-2xl p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[4px_4px_0px_0px_rgba(0,0,0,0.05)]">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
                <div className="relative">
                  <DealerLogoUpload currentUrl={user.dealer.logoUrl} dealerName={user.dealer.name} size="xl" />
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#111111] rounded-2xl border-[3px] border-white flex items-center justify-center text-white shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[8px_8px_0px_0px_rgba(0,0,0,0.05)]">
                    <Plus size={14} strokeWidth={3} />
                  </div>
                </div>

                <div className="text-center sm:text-left">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{user.dealer.name}</h2>
                  <p className="text-[11px] uppercase font-black tracking-[0.10em] text-slate-700 mt-0.5">Brand image shown to buyers on your dealer page.</p>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-4">
                    <span className="text-[11px] uppercase font-black tracking-[0.15em] font-semibold bg-[#fbfcfe] dark:bg-[#111111] text-slate-700 px-3 py-1 rounded border border-[#ddd4c8] dark:border-slate-800">
                      {user.dealer.county}
                    </span>
                    <span className="text-[11px] uppercase font-black tracking-[0.15em] font-semibold bg-[#fbfcfe] dark:bg-[#111111] text-slate-700 px-3 py-1 rounded border border-[#ddd4c8] dark:border-slate-800">
                      {user.dealer._count?.cars || 0} Live
                    </span>
                    {user.dealer.verified && (
                      <span className="text-[11px] uppercase font-black tracking-[0.15em] font-semibold bg-[#fbfcfe] dark:bg-[#111111] text-slate-700 px-3 py-1 rounded border border-[#ddd4c8] dark:border-slate-800">
                        Verified
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-[#ddd4c8] dark:border-slate-800">
                <p className="text-[11px] uppercase font-black tracking-[0.15em] font-bold uppercase tracking-wide text-slate-700 mb-3">Banner Photo</p>
                <p className="text-[11px] uppercase font-black tracking-[0.10em] text-slate-700 mb-4">
                  Upload a wide photo to display at the top of your dealer page.
                </p>
                <DealerBannerUpload currentUrl={user.dealer.bannerUrl} dealerName={user.dealer.name} />
              </div>
            </div>
          )}

          {/* Dealership Details */}
          {user.dealer && (
            <div className="bg-white dark:bg-[#111111] border border-[#ddd4c8] dark:border-slate-800 rounded-2xl p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[4px_4px_0px_0px_rgba(0,0,0,0.05)]">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-8">Dealer Profile</h3>

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

                <div className="pt-4 border-t border-[#ddd4c8] dark:border-slate-800">
                  <LocationPicker defaultLat={user.dealer.lat} defaultLng={user.dealer.lng} />
                </div>

                <div className="pt-4">
                  <button type="submit" className="bg-[#111111] hover:bg-[#111111] text-white rounded-2xl px-6 py-2.5 font-semibold text-[11px] uppercase font-black tracking-[0.10em] transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[4px_4px_0px_0px_rgba(0,0,0,0.05)] uppercase">
                    Save Profile
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Account Details */}
          <div className="bg-white dark:bg-[#111111] border border-[#ddd4c8] dark:border-slate-800 rounded-2xl p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[4px_4px_0px_0px_rgba(0,0,0,0.05)]">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-8">Account Details</h3>
            
            <form action="/api/profile/update" method="POST" className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className={labelCls}>Legal Representative Name</label>
                  <input name="name" defaultValue={user.name} className={inputCls} placeholder="John Doe" />
                </div>
                <div>
                  <label className={labelCls}>Registered Email (Locked)</label>
                  <div className="relative">
                    <input name="email" type="email" defaultValue={user.email} className={`${inputCls} bg-[#fbfcfe] dark:bg-[#111111] text-slate-700 cursor-not-allowed`} disabled />
                    <Shield className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-700" size={16} />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button type="submit" className="bg-[#111111] hover:bg-[#111111] text-white rounded-2xl px-6 py-2.5 font-semibold text-[11px] uppercase font-black tracking-[0.10em] transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[4px_4px_0px_0px_rgba(0,0,0,0.05)] uppercase">
                  Save Changes
                </button>
              </div>
            </form>
          </div>

          {/* Security & Password */}
          <div className="bg-white dark:bg-[#111111] border border-[#ddd4c8] dark:border-slate-800 rounded-2xl p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[4px_4px_0px_0px_rgba(0,0,0,0.05)]">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-8">Security & Password</h3>
            
            <form action="/api/profile/password" method="POST" className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className={labelCls}>New Password</label>
                  <input name="password" type="password" minLength={6} className={inputCls} placeholder="Enter a secure password" required />
                </div>
                <div>
                  <label className={labelCls}>Confirm Password</label>
                  <input name="confirm" type="password" minLength={6} className={inputCls} placeholder="Confirm your new password" required />
                </div>
              </div>

              <div className="pt-2">
                <button type="submit" className="bg-[#111111] hover:bg-[#ff5a2f] text-white rounded-2xl px-6 py-2.5 font-bold text-[11px] uppercase font-black tracking-[0.15em] transition-all border border-transparent">
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
    </div>
  );
}
