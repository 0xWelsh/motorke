"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Settings, Bookmark, MessageSquare, History, Phone, ShieldCheck, Clock, MapPin, Eye, EyeOff } from "lucide-react";
import { formatCarPrice, whatsappLink } from "@/lib/utils";
import { PHONE_COUNTRY_CODE_HELPER, PHONE_PLACEHOLDER_INTERNATIONAL, telHrefFromMsisdn } from "@/lib/phone-hints";
import { clsx } from "clsx";
import BuyerLocationSettings from "./BuyerLocationSettings";
import CarCard from "./CarCard";
import { carListingPath } from "@/lib/car-listing-url";
import { RECENT_COOKIE_KEY, readRecentCarsFromStorage, readJsonCookie } from "@/lib/personalization";
import ProfileCompletenessPanel from "./ProfileCompletenessPanel";
import PhoneVerificationControl from "./PhoneVerificationControl";
import { PHONE_VERIFICATION_ENABLED } from "@/lib/feature-flags";


const fmtDate = (iso) => new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });

export default function AccountTabs({ tab: init, user, savedCars, enquiries }) {
  const [tab, setTab] = useState(init || "profile");
  const [saved, setSaved] = useState(savedCars);
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone || "");
  const [profMsg, setProfMsg] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [pwErr, setPwErr] = useState("");
  const [recent, setRecent] = useState([]);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    try {
      const localRecent = readRecentCarsFromStorage();
      if (Array.isArray(localRecent) && localRecent.length > 0) {
        setRecent(localRecent);
        return;
      }
      const cookieRecent = readJsonCookie(RECENT_COOKIE_KEY, []);
      if (Array.isArray(cookieRecent)) {
        setRecent(cookieRecent);
      }
    } catch {}
  }, []);

  const tabs = [
    { id: "profile", label: "Profile Settings", icon: <Settings size={14} /> },
    { id: "saved", label: `Watchlist (${saved.length})`, icon: <Bookmark size={14} /> },
    { id: "enquiries", label: `Enquiries (${enquiries.length})`, icon: <MessageSquare size={14} /> },
    { id: "recent", label: "Browsing History", icon: <History size={14} /> },
  ];

  async function saveProfile(e) {
    e.preventDefault();
    const res = await fetch("/api/account/profile", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone }),
    });
    setProfMsg(res.ok ? "success" : "error");
    setTimeout(() => setProfMsg(""), 3000);
  }

  async function changePassword(e) {
    e.preventDefault();
    setPwErr(""); setPwMsg("");
    const fd = new FormData(e.target);
    const cur = fd.get("current"), np = fd.get("new"), cf = fd.get("confirm");
    if (np !== cf) { setPwErr("Passwords don't match."); return; }
    if (np.length < 8) { setPwErr("Must be at least 8 characters."); return; }
    const res = await fetch("/api/portal/password", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ current: cur, newPassword: np, confirm: cf }),
    });
    if (res.ok) { setPwMsg("success"); e.target.reset(); setTimeout(() => setPwMsg(""), 3000); }
    else setPwErr("Current password is incorrect.");
  }

  async function unsave(carId) {
    await fetch(`/api/saved/${carId}`, { method: "DELETE" });
    setSaved(prev => prev.filter(c => c.id !== carId));
  }

  const inputCls = "w-full bg-white dark:bg-[#111111] border border-[#ddd4c8] dark:border-slate-800 focus:border-[#ff5a2f] focus:ring-1 focus:ring-blue-100 rounded-2xl py-2.5 px-4 text-sm font-medium text-slate-900 dark:text-white outline-none transition-colors placeholder:text-slate-400";
  const labelCls = "text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 block";
  const buyerProfileItems = [
    { label: "Profile photo", done: Boolean(user.avatarUrl) },
    { label: "Full name", done: Boolean(name?.trim()) },
    { label: "Email", done: Boolean(user.email?.trim()) },
    { label: "Location", done: Number.isFinite(user.lat) && Number.isFinite(user.lng) },
    { label: "Watchlist started", done: saved.length > 0 },
  ];
  const buyerMissingFieldIds = [];
  if (!name?.trim()) buyerMissingFieldIds.push("buyer-name-input");
  if (!(Number.isFinite(user.lat) && Number.isFinite(user.lng))) buyerMissingFieldIds.push("buyer-location-settings");

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Tab bar */}
      <div className="border-b border-[#ddd4c8] dark:border-slate-800 bg-white px-6 pt-0 overflow-x-auto">
        <div className="flex items-center gap-6 min-w-max">
          {tabs.map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={clsx(
                "flex items-center gap-2 py-4 text-xs font-bold uppercase tracking-widest transition-all border-b-2",
                tab === id
                  ? "text-slate-900 dark:text-white border-b-2 border-slate-900"
                  : "text-slate-500 hover:text-slate-700 border-b-2 border-transparent"
              )}
            >
              {icon} {label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 sm:p-8">
        {/* ── PROFILE ── */}
        {tab === "profile" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-2xl bg-[#ff5a2f]" /> General Details
                </h2>
                <p className="text-sm font-medium text-slate-500 mt-1 mb-8">Ensure your contact details are accurate so sellers can reach you.</p>
              </div>
              <ProfileCompletenessPanel
                title="Buyer profile completeness"
                items={buyerProfileItems}
                missingFieldIds={buyerMissingFieldIds}
              />
              {!user.avatarUrl && (
                <p className="text-[11px] font-semibold text-slate-500 -mt-2">
                  Add your photo from the account header for a complete profile.
                </p>
              )}

              {profMsg === "success" && <Alert type="success">Profile identity synchronized.</Alert>}
              {profMsg === "error" && <Alert type="error">Could not sync profile identity.</Alert>}

              <form onSubmit={saveProfile} className="space-y-6">
                <div>
                  <label className={labelCls}>Full Legal Name</label>
                  <input
                    id="buyer-name-input"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    className={inputCls}
                    placeholder="e.g. John Doe"
                  />
                </div>
                <div>
                  <label className={labelCls}>Primary Email</label>
                  <input value={email} onChange={e => setEmail(e.target.value)} type="email" required className={clsx(inputCls, "bg-[#fbfcfe] dark:bg-[#111111]/50 text-slate-400 cursor-not-allowed")} disabled />
                </div>
                <div>
                  <label className={labelCls}>Contact phone</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder={PHONE_PLACEHOLDER_INTERNATIONAL}
                    className={inputCls}
                  />
                  <p className="mt-1.5 text-[10px] font-medium text-slate-500">{PHONE_COUNTRY_CODE_HELPER}</p>
                  {PHONE_VERIFICATION_ENABLED ? (
                    <div className="mt-2">
                      <PhoneVerificationControl phone={phone} />
                    </div>
                  ) : null}
                </div>
                <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition">
                  Save Changes
                </button>
              </form>
            </div>

            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-2xl bg-rose-500" /> Security Access
                </h2>
                <p className="text-sm font-medium text-slate-500 mt-1 mb-8">Maintain healthy security hygiene by rotating passwords periodically.</p>
              </div>

              {pwMsg === "success" && <Alert type="success">Security vault updated.</Alert>}
              {pwErr && <Alert type="error">{pwErr}</Alert>}

              <form onSubmit={changePassword} className="space-y-6">
                <div>
                  <label className={labelCls}>Current Password</label>
                  <div className="relative group">
                    <input name="current" type={showCurrent ? "text" : "password"} required className={inputCls} placeholder="••••••••" />
                    <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                      {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>New Password</label>
                    <div className="relative group">
                      <input name="new" type={showNew ? "text" : "password"} required minLength={8} className={inputCls} placeholder="••••••••" />
                      <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                        {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Verify Password</label>
                    <input name="confirm" type={showNew ? "text" : "password"} required minLength={8} className={inputCls} placeholder="••••••••" />
                  </div>
                </div>
                <button type="submit" className="bg-red-600 hover:bg-red-700 text-slate-900 dark:text-white px-6 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition">
                  Update Password
                </button>
              </form>
            </div>

            {/* Location Settings */}
            <div id="buyer-location-settings" className="lg:col-span-2 border-t border-[#ddd4c8] dark:border-slate-800 pt-8">
              <BuyerLocationSettings initialLat={user.lat} initialLng={user.lng} />
            </div>
          </div>
        )}

        {/* ── SAVED CARS ── */}
        {tab === "saved" && (
          saved.length === 0
            ? <Empty icon={<Bookmark size={32} className="text-amber-500" />} title="No Watchlist Assets" desc="You haven't bookmarked any listings yet. When you find an interesting unit, save it to track price changes." href="/cars" cta="Explore Inventory Drop" />
            : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {saved.map(car => (
                  <div key={car.id} className="relative flex flex-col h-full">
                    <CarCard 
                      car={car} 
                      onRemove={unsave}
                    />
                    <div className="mt-4 px-2">
                       <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Tracked {fmtDate(car.savedAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )
        )}

        {/* ── ENQUIRIES ── */}
        {tab === "enquiries" && (
          enquiries.length === 0
            ? <Empty icon={<MessageSquare size={32} className="text-[#ff5a2f]" />} title="No Messages Yet" desc="Messages and inquiries you send to dealers will appear here." href="/cars" cta="Browse Cars" />
            : (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {enquiries.map(e => (
                  <div key={e.id} className="bg-white dark:bg-[#111111] border border-[#ddd4c8] dark:border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row gap-6 shadow-sm group hover:border-[#ff5a2f]/30 transition-colors">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center font-black text-xl text-[#ff5a2f] shrink-0">
                      {e.dealer.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                        <div>
                          <h3 className="font-black text-slate-900 dark:text-white text-lg tracking-tight leading-tight">{e.dealer.name}</h3>
                          <Link href={carListingPath(e.car)} className="text-xs font-bold text-[#ff5a2f] hover:text-blue-800 transition-colors line-clamp-1 block mt-1">
                            Regarding:{" "}
                            <span className="font-sans font-semibold text-[#ff5a2f]">
                              {e.car.year} {e.car.make} {e.car.model}
                            </span>{" "}
                            — {fmt(e.car.price)}
                          </Link>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={clsx(
                            "px-3 py-1 rounded-2xl text-[11px] font-black uppercase tracking-widest border",
                            e.channel === "whatsapp" ? "bg-emerald-50 text-[#ff5a2f] border-emerald-100" : "bg-[#fbfcfe] dark:bg-[#111111] text-slate-500 border-[#ddd4c8] dark:border-slate-800"
                          )}>
                            {e.channel === "whatsapp" ? "WhatsApp Sent" : "Form Sent"}
                          </span>
                          <span className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5"><Clock size={12}/> {fmtDate(e.createdAt)}</span>
                        </div>
                      </div>
                      
                      {e.message && (
                        <div className="bg-[#fbfcfe] dark:bg-[#111111] rounded-2xl p-5 mb-5 border border-[#ddd4c8] dark:border-slate-800">
                          <p className="text-sm font-medium text-slate-600">"{e.message}"</p>
                        </div>
                      )}
                      
                      <div className="flex flex-wrap gap-2">
                        {e.dealer.phone && telHrefFromMsisdn(e.dealer.phone) ? (
                          <a href={telHrefFromMsisdn(e.dealer.phone)} className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-2xl text-xs font-semibold transition">
                            <Phone size={14} /> Call
                          </a>
                        ) : null}
                        {e.dealer.whatsapp ? (
                          <a
                            href={whatsappLink(e.dealer.whatsapp, `${e.car.year} ${e.car.make} ${e.car.model}`, e.dealer.name)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-[#ff5a2f] hover:bg-emerald-700 text-slate-900 dark:text-white px-4 py-2 rounded-2xl text-xs font-semibold transition"
                          >
                            <MessageSquare size={14} className="fill-white" /> WhatsApp
                          </a>
                        ) : null}
                        {!e.car.available && (
                          <span className="flex items-center gap-2 bg-rose-50 text-rose-500 border border-rose-100 px-4 py-2.5 rounded-2xl text-xs font-black">
                            Unit Sold
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
        )}

        {/* ── RECENTLY VIEWED ── */}
        {tab === "recent" && (
          recent.length === 0
            ? <Empty icon={<History size={32} className="text-indigo-500" />} title="Blank Horizon" desc="Cars you examine will automatically be cached here for rapid access." href="/cars" cta="Scan Marketplace" />
            : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {recent.map(car => (
                  <CarCard 
                    key={car.id} 
                    car={{
                      ...car,
                      // Ensure images is an array for CarCard
                      images: car.image ? [{ url: car.image }] : (car.images || [])
                    }} 
                  />
                ))}
              </div>
            )
        )}
      </div>
    </div>
  );
}

function Alert({ type, children }) {
  return (
    <div className={clsx(
      "flex items-center gap-3 px-5 py-4 rounded-2xl border mb-6",
      type === "success" ? "bg-emerald-50 border-emerald-100 text-emerald-800" : "bg-rose-50 border-rose-100 text-rose-800"
    )}>
      {type === "success" ? <ShieldCheck size={18} className="text-[#ff5a2f]" /> : <div className="text-rose-500 font-bold">⚠</div>}
      <span className="text-xs font-bold">{children}</span>
    </div>
  );
}

function Empty({ icon, title, desc, href, cta }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center max-w-lg mx-auto bg-[#fbfcfe] dark:bg-[#111111] border border-[#ddd4c8] dark:border-slate-800 rounded-3xl animate-in zoom-in-95 duration-500">
      <div className="w-20 h-20 bg-white rounded-2xl border border-[#ddd4c8] dark:border-slate-800 shadow-sm flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">{title}</h3>
      <p className="text-sm font-medium text-slate-500 mb-8">{desc}</p>
      <Link href={href} className="bg-slate-900 hover:bg-black text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg transition-transform hover:-translate-y-0.5">
        {cta}
      </Link>
    </div>
  );
}
