// src/app/admin/dealers/new/page.js
import { requireAdmin } from "@/lib/auth";

export const metadata = { title: "Add Dealership — Admin" };

const COUNTIES = [
  "Nairobi","Mombasa","Kisumu","Nakuru","Uasin Gishu","Kiambu","Machakos",
  "Kajiado","Muranga","Nyeri","Meru","Embu","Kilifi","Kwale","Laikipia","Other"
];

export default async function AdminNewDealerPage({ searchParams }) {
  await requireAdmin();
  const error = searchParams.error;

  const inputCls  = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-[#f97316]/50 transition-colors";
  const selectCls = "w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#f97316]/50 transition-colors";
  const labelCls  = "block text-xs text-white/40 uppercase tracking-wider mb-2";

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <a href="/admin/dealers" className="text-xs text-white/40 hover:text-white transition-colors">← Dealerships</a>
        <h1 className="text-3xl font-black mt-2">Add dealership</h1>
      </div>

      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-7">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3 mb-5">
            {error === "exists"  && "A dealership with that name already exists."}
            {error === "unknown" && "Something went wrong. Please try again."}
          </div>
        )}

        <form action="/api/admin/dealers" method="POST" className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Dealership name *</label>
              <input name="name" required placeholder="Prestige Auto Kenya" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>County *</label>
              <select name="county" required className={selectCls}>
                {COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>Location (area) *</label>
            <input name="location" required placeholder="Westlands, Nairobi" className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Full address</label>
            <input name="address" placeholder="Ring Road Westlands, opposite Sarit Centre" className={inputCls} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Phone *</label>
              <input name="phone" required placeholder="+254 720 100 200" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>WhatsApp number</label>
              <input name="whatsapp" placeholder="254720100200" className={inputCls} />
              <p className="text-xs text-white/20 mt-1">Country code, no +</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Email</label>
              <input name="email" type="email" placeholder="sales@dealership.co.ke" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Website</label>
              <input name="website" type="url" placeholder="https://dealership.co.ke" className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Description</label>
            <textarea name="description" rows={3}
              placeholder="Brief description shown on the dealer profile page..."
              className={`${inputCls} resize-none`} />
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="verified" className="w-4 h-4 accent-[#f97316]" />
              <span className="text-sm text-white/60">Verified dealer</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="featured" className="w-4 h-4 accent-[#f97316]" />
              <span className="text-sm text-white/60">Featured on homepage</span>
            </label>
          </div>

          <button type="submit"
            className="w-full bg-[#f97316] hover:bg-[#ea6c0b] text-white font-bold py-3 rounded-xl transition-colors">
            Create dealership →
          </button>
        </form>
      </div>
    </div>
  );
}
