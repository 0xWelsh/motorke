// src/app/admin/dealers/[id]/edit/page.js
import { requireAdmin } from "@/lib/auth";
import DeleteButton from "@/components/DeleteButton";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";

export const metadata = { title: "Edit Dealership — Admin" };

const COUNTIES = [
  "Nairobi","Mombasa","Kisumu","Nakuru","Uasin Gishu","Kiambu","Machakos",
  "Kajiado","Muranga","Nyeri","Meru","Embu","Kilifi","Kwale","Laikipia","Other"
];

export default async function AdminEditDealerPage({ params, searchParams }) {
  const { id } = await params;
  const sp = await searchParams;
  await requireAdmin();

  const dealer = await db.dealer.findUnique({ where: { id: id } });
  if (!dealer) notFound();

  const saved  = sp.saved;
  const error  = sp.error;

  const inputCls  = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-[#f97316]/50 transition-colors";
  const selectCls = "w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#f97316]/50 transition-colors";
  const labelCls  = "block text-xs text-white/40 uppercase tracking-wider mb-2";

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <a href="/admin/dealers" className="text-xs text-white/40 hover:text-white transition-colors">← Dealerships</a>
        <h1 className="text-3xl font-black mt-2">{dealer.name}</h1>
      </div>

      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-7">
        {saved && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm rounded-xl px-4 py-3 mb-5">
            ✓ Changes saved
          </div>
        )}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3 mb-5">
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
              <input name="phone" required defaultValue={dealer.phone} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>WhatsApp number</label>
              <input name="whatsapp" defaultValue={dealer.whatsapp || ""}
                placeholder="254720100200" className={inputCls} />
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

          <div>
            <label className={labelCls}>Description</label>
            <textarea name="description" rows={3} defaultValue={dealer.description || ""}
              className={`${inputCls} resize-none`} />
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="verified" defaultChecked={dealer.verified}
                className="w-4 h-4 accent-[#f97316]" />
              <span className="text-sm text-white/60">Verified dealer</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="featured" defaultChecked={dealer.featured}
                className="w-4 h-4 accent-[#f97316]" />
              <span className="text-sm text-white/60">Featured on homepage</span>
            </label>
          </div>

          <button type="submit"
            className="w-full bg-[#f97316] hover:bg-[#ea6c0b] text-white font-bold py-3 rounded-xl transition-colors">
            Save changes
          </button>
        </form>
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