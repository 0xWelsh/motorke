// src/app/admin/dealers/[id]/edit/page.js
export const dynamic = "force-dynamic";
import { requireAdmin } from "@/lib/auth";
import DeleteButton from "@/components/DeleteButton";
import { db } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  PHONE_COUNTRY_CODE_HELPER,
  PHONE_PLACEHOLDER_INTERNATIONAL,
  WHATSAPP_STORE_HELPER,
} from "@/lib/phone-hints";
import LocationPicker from "@/components/LocationPicker";
import AdminAvatarUpload from "@/components/AdminAvatarUpload";
import { MapPin } from "lucide-react";

export const metadata = { title: "Edit Dealership | Admin" };

const COUNTIES = [
  "Nairobi","Mombasa","Kisumu","Nakuru","Uasin Gishu","Kiambu","Machakos",
  "Kajiado","Muranga","Nyeri","Meru","Embu","Kilifi","Kwale","Laikipia","China (Import)", "Japan (Import)", "UK (Import)", "Other"
];

export default async function AdminEditDealerPage({ params, searchParams }) {
  const { id } = await params;
  const sp = await searchParams;
  await requireAdmin();

  const dealer = await db.dealer.findUnique({ 
    where: { id: id },
    include: { branches: true } 
  });
  if (!dealer) notFound();

  const saved  = sp.saved;
  const error  = sp.error;

  const inputCls  = "w-full border border-[#ddd4c8] dark:border-slate-800 rounded-2xl bg-[#fbfcfe] dark:bg-[#111111] px-4 py-3.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-slate-900 focus:ring-0 transition-all";
  const selectCls = "w-full border border-[#ddd4c8] dark:border-slate-800 rounded-2xl bg-[#fbfcfe] dark:bg-[#111111] px-4 py-3.5 text-sm text-slate-900 dark:text-white outline-none focus:border-slate-900 focus:ring-0 transition-all";
  const labelCls  = "block text-[11px] font-black uppercase tracking-[0.16em] text-slate-900 dark:text-white mb-2";

  return (
    <div className="p-8 lg:p-12 max-w-3xl">
      <div className="mb-8">
        <a href="/admin/dealers" className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-500 hover:text-[#2F855A] transition-all">← Dealerships</a>
        <div className="flex items-center gap-5 mt-4">
          <AdminAvatarUpload currentUrl={dealer.logoUrl} targetId={dealer.id} targetType="dealer" name={dealer.name} size="lg" />
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{dealer.name}</h1>
            <p className="text-xs text-white/40 mt-1">Click the logo to upload or change it</p>
            <Link
              href={`/admin/cars/new?dealerId=${dealer.id}`}
              className="mt-3 inline-flex items-center justify-center rounded-xl bg-[#2F855A] px-4 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-white shadow-sm transition hover:bg-[#38A169]"
            >
              Add car to inventory
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#111111] border border-[#ddd4c8] dark:border-slate-800 p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)]">
        {saved && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm rounded-2xl px-4 py-3 mb-5">
            ✓ Changes saved
          </div>
        )}
        {error && (
          <div className="bg-[#111111] border border-red-500 rounded-2xl p-4 text-[11px] font-bold text-red-400 mb-6">
            Something went wrong. Please try again.
          </div>
        )}

        <form action={`/api/admin/dealers/${dealer.id}`} method="POST" className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Dealership name *</label>
              <input name="name" required defaultValue={dealer.name} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>County *</label>
              <select name="county" defaultValue={dealer.county} className={selectCls}>
                {COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>Location (area) *</label>
            <input name="location" required defaultValue={dealer.location} className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Full address</label>
            <input name="address" defaultValue={dealer.address || ""} className={inputCls} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Phone *</label>
              <input
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                required
                defaultValue={dealer.phone}
                placeholder={PHONE_PLACEHOLDER_INTERNATIONAL}
                className={inputCls}
              />
              <p className="text-[11px] font-medium text-slate-500 mt-2">{PHONE_COUNTRY_CODE_HELPER}</p>
            </div>
            <div>
              <label className={labelCls}>WhatsApp</label>
              <input
                name="whatsapp"
                type="tel"
                inputMode="numeric"
                defaultValue={dealer.whatsapp || ""}
                placeholder="254720100200"
                className={inputCls}
              />
              <p className="text-[11px] font-medium text-slate-500 mt-2">{WHATSAPP_STORE_HELPER}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Email</label>
              <input name="email" type="email" defaultValue={dealer.email || ""} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Website</label>
              <input name="website" type="url" defaultValue={dealer.website || ""} className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Instagram URL</label>
              <input name="instagramUrl" type="url" defaultValue={dealer.instagramUrl || ""} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Facebook URL</label>
              <input name="facebookUrl" type="url" defaultValue={dealer.facebookUrl || ""} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>TikTok URL</label>
              <input name="tiktokUrl" type="url" defaultValue={dealer.tiktokUrl || ""} className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Description</label>
            <textarea name="description" rows={3} defaultValue={dealer.description || ""}
              className={`${inputCls} resize-none`} />
          </div>

          <div className="pt-2 border-t border-[#ddd4c8] dark:border-slate-800">
            <LocationPicker defaultLat={dealer.lat} defaultLng={dealer.lng} />
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="verified" defaultChecked={dealer.verified}
                className="w-4 h-4 border border-[#ddd4c8] dark:border-slate-800 rounded-2xl checked:bg-[#2F855A] checked:border-[#2F855A] cursor-pointer accent-[#2F855A]" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-700">Verified dealer</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="featured" defaultChecked={dealer.featured}
                className="w-4 h-4 border border-[#ddd4c8] dark:border-slate-800 rounded-2xl checked:bg-[#2F855A] checked:border-[#2F855A] cursor-pointer accent-[#2F855A]" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-700">Featured on homepage</span>
            </label>
          </div>

          <button type="submit"
            className="w-full bg-[#2F855A] hover:bg-[#38A169] text-white font-bold py-3 rounded-2xl transition-colors">
            Save changes
          </button>
        </form>
      </div>

      {/* Branch Management */}
      <div className="mt-6 bg-[#1a1a1a] border border-white/10 rounded-2xl p-7">
        <div className="flex items-center justify-between mb-6">
           <div>
             <h2 className="font-black text-white">Branch Locations</h2>
             <p className="text-xs text-white/40 mt-1">Add additional map-pinned locations for this dealership.</p>
           </div>
           <a href={`/admin/dealers/${dealer.id}/branches/new`} className="px-4 py-2 bg-[#2F855A]/15 hover:bg-[#2F855A] text-[#38A169] hover:text-white border border-[#2F855A]/30 hover:border-[#2F855A] rounded-2xl text-[11px] font-black uppercase tracking-widest transition-colors">
              + Add Branch
           </a>
        </div>
        
        {dealer.branches && dealer.branches.length > 0 ? (
           <div className="space-y-3">
             {dealer.branches.map(b => (
               <div key={b.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl">
                 <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-2xl bg-[#2F855A]/15 text-[#38A169] flex items-center justify-center">
                     <MapPin size={16} />
                   </div>
                   <div>
                     <p className="text-sm font-bold text-white">{b.name}</p>
                     <p className="text-xs text-white/40 mt-0.5">{b.location}</p>
                   </div>
                 </div>
                 <DeleteButton action={`/api/admin/dealers/${dealer.id}/branches/${b.id}/delete`} message="Remove this branch?" />
               </div>
             ))}
           </div>
        ) : (
           <div className="py-8 text-center bg-white/[0.02] border border-white/5 rounded-2xl border-dashed">
             <p className="text-xs font-bold text-white/30 uppercase tracking-widest">No branches added</p>
           </div>
        )}
      </div>

      {/* Danger zone */}
      <div className="mt-6 bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
        <h3 className="font-bold text-red-400 mb-1">Danger zone</h3>
        <p className="text-xs text-white/30 mb-4">
          Deleting a dealership removes all their listings and portal accounts permanently.
        </p>
        <DeleteButton action={`/api/admin/dealers/${dealer.id}/delete`} message="Delete this dealership and ALL their cars? Cannot be undone." label="Delete" />
      </div>
    </div>
  );
}
