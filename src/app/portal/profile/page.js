export const dynamic = "force-dynamic";
import { requireDealer } from "@/lib/auth";
import { db } from "@/lib/db";
import AvatarUpload from "@/components/AvatarUpload";
import DealerLogoUpload from "@/components/DealerLogoUpload";
import DealerBannerUpload from "@/components/DealerBannerUpload";
import ImageGallery from "@/components/ImageGallery";
import ProfileCompletenessPanel from "@/components/ProfileCompletenessPanel";
import { User, Mail, Shield, Calendar, Plus, Building2, MapPin, Globe, Phone } from "lucide-react";

export const metadata = { title: "Profile Settings — Welsh Motors Dealer Portal" };

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
          gallery: true,
        },
      },
    },
  });

  if (!user) return null;

  const inputCls = "w-full bg-slate-50 dark:bg-[#111111] border-b-2 border-slate-200 dark:border-slate-800 rounded-none px-4 py-3 text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-slate-900 dark:focus:border-white transition-all placeholder:text-slate-400";
  const labelCls = "text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 block";
  const selectCls = "w-full bg-slate-50 dark:bg-[#111111] border-b-2 border-slate-200 dark:border-slate-800 rounded-none px-4 py-3 text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-slate-900 dark:focus:border-white transition-all";
  const dealerCompletionItems = user.dealer
    ? [
        { label: "Dealership name", done: Boolean(user.dealer.name?.trim()) },
        { label: "Location", done: Boolean(user.dealer.location?.trim()) },
        { label: "Business phone", done: Boolean(user.dealer.phone?.trim()) },
        { label: "WhatsApp", done: Boolean(user.dealer.whatsapp?.trim()) },
        { label: "About section", done: Boolean(user.dealer.description?.trim()) },
      ]
    : [];
  const dealerMissingFieldIds = [];
  if (user.dealer && !user.dealer.name?.trim()) dealerMissingFieldIds.push("dealer-name-field");
  if (user.dealer && !user.dealer.location?.trim()) dealerMissingFieldIds.push("dealer-location-field");
  if (user.dealer && !user.dealer.phone?.trim()) dealerMissingFieldIds.push("dealer-phone-field");
  if (user.dealer && !user.dealer.whatsapp?.trim()) dealerMissingFieldIds.push("dealer-whatsapp-field");
  if (user.dealer && !user.dealer.description?.trim()) dealerMissingFieldIds.push("dealer-description-field");

  return (
    <div className="w-full max-w-4xl pt-4 pb-12">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-1">Account Settings</h1>
        <p className="text-sm font-medium text-slate-500">Manage your dealer profile and account details.</p>
      </div>

      {saved && (
        <div className="mb-6 rounded-none bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
          Profile saved successfully.
        </div>
      )}
      {error && (
        <div className="mb-6 rounded-none bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          Something went wrong. Please try again.
        </div>
      )}

      {/* Account Overview - Top Section */}
      <div className="bg-white dark:bg-[#111111] rounded-none p-4 sm:p-8 shadow-sm mb-6 sm:mb-10">
        <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-4 sm:mb-6">Account Overview</h3>
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
              <div className="flex items-center gap-2 mb-1">
                <Icon size={14} className="text-slate-400" />
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{value}</p>
            </div>
          ))}
        </div>
        
        <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-[#e8e2d9] dark:border-slate-800">
          <p className="text-sm text-slate-500">
             Need to change your registered email or dealership name? Contact partner support.
           </p>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="space-y-6 sm:space-y-8">
          {/* Personal Avatar Section */}
          <div className="bg-white dark:bg-[#111111] rounded-none p-4 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
              <div className="relative">
                <AvatarUpload 
                  currentUrl={user.avatarUrl} 
                  userName={user.name} 
                  size="lg" 
                />
              </div>
              <div className="text-center sm:text-left flex-1">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{user.name}</h2>
                <p className="text-xs font-semibold tracking-widest uppercase text-slate-500 mt-1">{user.email}</p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-4">
                  <span className="text-[10px] font-black tracking-[0.15em] uppercase bg-slate-100 dark:bg-[#222222] text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-none">
                    {user.role}
                  </span>
                  {user.dealer?.verified && (
                    <span className="text-[10px] font-black tracking-[0.15em] uppercase text-blue-700 bg-blue-50 px-2.5 py-1 rounded-none flex items-center gap-1">
                      <Shield size={12} /> Verified
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Dealership Brand Section */}
          {user.dealer && (
            <div className="bg-white dark:bg-[#111111] rounded-none p-4 sm:p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                <div className="relative">
                  <DealerLogoUpload currentUrl={user.dealer.logoUrl} dealerName={user.dealer.name} size="lg" />
                </div>

                <div className="text-center sm:text-left flex-1">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{user.dealer.name}</h2>
                  <p className="text-sm font-medium text-slate-500 mt-1">Brand image shown to buyers on your dealer page.</p>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-4">
                    <span className="text-[10px] font-black tracking-[0.15em] uppercase bg-slate-100 dark:bg-[#222222] text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-none">
                      {user.dealer.county}
                    </span>
                    <span className="text-[10px] font-black tracking-[0.15em] uppercase bg-slate-100 dark:bg-[#222222] text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-none">
                      {user.dealer._count?.cars || 0} Live Cars
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-[#e8e2d9] dark:border-slate-800">
                <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">Banner Photo</p>
                <p className="text-sm text-slate-500 mb-6">
                  Upload a wide photo to display at the top of your dealer page.
                </p>
                <DealerBannerUpload currentUrl={user.dealer.bannerUrl} dealerName={user.dealer.name} />
              </div>

              {/* Dealership Gallery Section */}
              <div className="mt-8 pt-8 border-t border-[#e8e2d9] dark:border-slate-800">
                <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">Dealership Gallery</p>
                <p className="text-sm text-slate-500 mb-6">
                  Show off your dealership, staff, and environment. Add images and videos for a complete profile.
                </p>

                {/* Upload Images */}
                <form
                  className="mb-6 grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3"
                  action="/api/portal/gallery"
                  method="POST"
                >
                  <input type="hidden" name="type" value="image" />
                  <input
                    type="url"
                    name="url"
                    placeholder="Image URL (https://...)"
                    className="border px-3 py-2 rounded"
                    required
                  />
                  <input
                    type="text"
                    name="caption"
                    placeholder="Caption (optional)"
                    className="border px-3 py-2 rounded"
                  />
                  <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
                    Add Image
                  </button>
                </form>

                {/* Upload Video */}
                <form
                  className="mb-6"
                  action="/api/portal/gallery"
                  method="POST"
                  encType="multipart/form-data"
                  style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}
                >
                  <input type="hidden" name="type" value="video" />
                  <input type="url" name="url" placeholder="YouTube or video URL" className="border px-2 py-1 rounded" required />
                  <input type="text" name="caption" placeholder="Caption (optional)" className="border px-2 py-1 rounded" />
                  <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Add Video</button>
                </form>

                {/* Images */}
                {user.dealer.gallery?.filter(m => m.type === 'image').length > 0 && (
                  <div className="mb-6">
                    <ImageGallery
                      images={user.dealer.gallery.filter(m => m.type === 'image').map(img => ({ url: img.url, alt: img.caption }))}
                      title={user.dealer.name + " Gallery"}
                    />
                  </div>
                )}
                {/* Videos */}
                {user.dealer.gallery?.filter(m => m.type === 'video').length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {user.dealer.gallery.filter(m => m.type === 'video').map((vid, i) => (
                      <div key={vid.id} className="aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
                        {vid.url.match(/(youtube.com|youtu.be)/) ? (
                          <iframe
                            src={vid.url.replace('watch?v=', 'embed/')}
                            title={vid.caption || `Video ${i+1}`}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="w-full h-full"
                          />
                        ) : (
                          <video src={vid.url} controls className="w-full h-full object-cover" title={vid.caption || `Video ${i+1}`}></video>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Dealership Details */}
          {user.dealer && (
            <div className="bg-white dark:bg-[#111111] rounded-none p-4 sm:p-8 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Dealer Profile</h3>
              <ProfileCompletenessPanel
                title="Dealer profile completeness"
                items={dealerCompletionItems}
                missingFieldIds={dealerMissingFieldIds}
              />

              <form action="/api/portal/profile" method="POST" className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className={labelCls}>Dealership Name</label>
                    <input id="dealer-name-field" name="name" defaultValue={user.dealer.name} className={inputCls} required />
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
                  <input id="dealer-location-field" name="location" defaultValue={user.dealer.location || ""} className={inputCls} required />
                </div>

                <div>
                  <label className={labelCls}>Full Address</label>
                  <input name="address" defaultValue={user.dealer.address || ""} className={inputCls} placeholder="Street, building, nearby landmark" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className={labelCls}>Business Phone</label>
                    <input id="dealer-phone-field" name="phone" defaultValue={user.dealer.phone || ""} className={inputCls} required />
                  </div>
                  <div>
                    <label className={labelCls}>WhatsApp</label>
                    <input id="dealer-whatsapp-field" name="whatsapp" defaultValue={user.dealer.whatsapp || ""} className={inputCls} placeholder="2547XXXXXXXX" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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
                    id="dealer-description-field"
                    name="description"
                    defaultValue={user.dealer.description || ""}
                    rows={4}
                    className={`${inputCls} resize-none max-h-32`}
                    placeholder="Tell buyers what makes your showroom trustworthy and different."
                  />
                </div>

                <div className="pt-4 border-t border-[#e8e2d9] dark:border-slate-800 space-y-4">
                  <div>
                    <label className={labelCls}>Google Maps Link</label>
                    <input
                      name="googleMapsUrl"
                      type="url"
                      className={inputCls}
                      placeholder="Paste Google Maps share link (https://maps.google.com/...)"
                    />
                    <p className="mt-1 text-[11px] font-semibold text-slate-500">
                      Paste your dealership Maps link. We will auto-extract coordinates for nearby distance results.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label className={labelCls}>Latitude</label>
                      <input
                        name="lat"
                        type="number"
                        step="any"
                        defaultValue={user.dealer.lat ?? ""}
                        className={inputCls}
                        placeholder="-1.2921"
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Longitude</label>
                      <input
                        name="lng"
                        type="number"
                        step="any"
                        defaultValue={user.dealer.lng ?? ""}
                        className={inputCls}
                        placeholder="36.8219"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button type="submit" className="w-full sm:w-auto bg-[#111111] hover:bg-slate-800 text-white rounded-none px-8 py-3.5 sm:py-3 font-bold text-xs uppercase tracking-widest transition-all">
                    Save Profile
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Account Details */}
          <div className="bg-white dark:bg-[#111111] rounded-none p-4 sm:p-8 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Account Details</h3>
            
            <form action="/api/profile/update" method="POST" className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className={labelCls}>Legal Representative Name</label>
                  <input name="name" defaultValue={user.name} className={inputCls} placeholder="John Doe" />
                </div>
                <div>
                  <label className={labelCls}>Registered Email (Locked)</label>
                  <div className="relative">
                    <input name="email" type="email" defaultValue={user.email} className={`${inputCls} bg-[#fbfcfe] dark:bg-[#111111] text-slate-500 cursor-not-allowed`} disabled />
                    <Shield className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button type="submit" className="w-full sm:w-auto bg-[#111111] hover:bg-slate-800 text-white rounded-none px-8 py-3.5 sm:py-3 font-bold text-xs uppercase tracking-widest transition-all">
                  Save Changes
                </button>
              </div>
            </form>
          </div>

          {/* Security & Password */}
          <div className="bg-white dark:bg-[#111111] rounded-none p-4 sm:p-8 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Security & Password</h3>
            
            <form action="/api/profile/password" method="POST" className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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
                <button type="submit" className="w-full sm:w-auto bg-[#111111] hover:bg-[#ff5a2f] text-white rounded-none px-8 py-3.5 sm:py-3 font-bold text-xs uppercase tracking-widest transition-all">
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
    </div>
  );
}
