// src/app/admin/dealers/new/page.js
import { requireAdmin } from "@/lib/auth";
import LocationPicker from "@/components/LocationPicker";

export const metadata = { title: "Add Dealership — Admin" };

const COUNTIES = [
  "Nairobi","Mombasa","Kisumu","Nakuru","Uasin Gishu","Kiambu","Machakos",
  "Kajiado","Muranga","Nyeri","Meru","Embu","Kilifi","Kwale","Laikipia","China (Import)", "Japan (Import)", "UK (Import)", "Other"
];

export default async function AdminNewDealerPage(props) {
  const searchParams = await props.searchParams;
  await requireAdmin();
  const error = searchParams?.error;

  const inputCls  = "w-full border border-[#ddd4c8] dark:border-slate-800 rounded-2xl bg-[#fbfcfe] dark:bg-[#111111] px-4 py-3.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-slate-900 focus:ring-0 transition-all";
  const selectCls = "w-full border border-[#ddd4c8] dark:border-slate-800 rounded-2xl bg-[#fbfcfe] dark:bg-[#111111] px-4 py-3.5 text-sm text-slate-900 dark:text-white outline-none focus:border-slate-900 focus:ring-0 transition-all";
  const labelCls  = "block text-[11px] font-black uppercase tracking-[0.16em] text-slate-900 dark:text-white mb-2";

  return (
    <div className="p-8 lg:p-12 max-w-3xl">
      <div className="mb-8">
        <a href="/admin/dealers" className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-500 hover:text-[#ff5a2f] transition-all">← Dealerships</a>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tighter mt-2">Add dealership</h1>
      </div>

      <div className="bg-white dark:bg-[#111111] border border-[#ddd4c8] dark:border-slate-800 p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)]">
        {error && (
          <div className="bg-[#111111] border border-red-500 rounded-2xl p-4 text-[11px] font-bold text-red-400 mb-6">
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
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-2 block">Country code, no +</p>
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Instagram URL</label>
              <input name="instagramUrl" type="url" placeholder="https://instagram.com/yourdealership" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Facebook URL</label>
              <input name="facebookUrl" type="url" placeholder="https://facebook.com/yourdealership" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>TikTok URL</label>
              <input name="tiktokUrl" type="url" placeholder="https://www.tiktok.com/@yourdealership" className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Description</label>
            <textarea name="description" rows={3}
              placeholder="Brief description shown on the dealer profile page..."
              className={`${inputCls} resize-none`} />
          </div>

          <div className="pt-2 border-t border-[#ddd4c8] dark:border-slate-800">
            <LocationPicker />
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="verified" className="w-4 h-4 border border-[#ddd4c8] dark:border-slate-800 rounded-2xl checked:bg-[#ff5a2f] checked:border-[#ff5a2f] cursor-pointer accent-[#ff5a2f]" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-700">Verified dealer</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="featured" className="w-4 h-4 border border-[#ddd4c8] dark:border-slate-800 rounded-2xl checked:bg-[#ff5a2f] checked:border-[#ff5a2f] cursor-pointer accent-[#ff5a2f]" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-700">Featured on homepage</span>
            </label>
          </div>

          <button type="submit"
            className="w-full bg-[#f97316] hover:bg-[#ea6c0b] text-white font-bold py-3 rounded-2xl transition-colors">
            Create dealership →
          </button>
        </form>
      </div>
    </div>
  );
}
