export const dynamic = "force-dynamic";
import { requireAdmin } from "@/lib/auth";
import LocationPicker from "@/components/LocationPicker";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";

export const metadata = { title: "Add Branch | Admin" };

const COUNTIES = [
  "Nairobi","Mombasa","Kisumu","Nakuru","Uasin Gishu","Kiambu","Machakos",
  "Kajiado","Muranga","Nyeri","Meru","Embu","Kilifi","Kwale","Laikipia","Other"
];

export default async function AdminNewBranchPage({ params, searchParams }) {
  const { id } = await params;
  await requireAdmin();
  
  const dealer = await db.dealer.findUnique({ where: { id } });
  if (!dealer) notFound();

  const sp = await searchParams;
  const error = sp.error;

  const inputCls  = "w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-[#38A169]/55 transition-colors";
  const selectCls = "w-full bg-surface border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-[#38A169]/55 transition-colors";
  const labelCls  = "block text-xs text-white/40 uppercase tracking-wider mb-2";

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <a href={`/admin/dealers/${dealer.id}/edit`} className="text-xs text-white/40 hover:text-white transition-colors">← Back to {dealer.name}</a>
        <h1 className="text-3xl font-black mt-2">Add new branch</h1>
        <p className="text-white/40 uppercase tracking-widest text-[9px] mt-1 font-bold">For {dealer.name}</p>
      </div>

      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-7">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-2xl px-4 py-3 mb-5">
            {error === "missing" ? "Branch name is required." : "Something went wrong. Please try again."}
          </div>
        )}

        <form action={`/api/admin/dealers/${dealer.id}/branches`} method="POST" className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Branch Name *</label>
              <input name="name" required placeholder="Mombasa Road Branch" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>County *</label>
              <select name="county" required defaultValue={dealer.county} className={selectCls}>
                {COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>Location (area) *</label>
            <input name="location" required placeholder="Mlolongo, Mombasa Road" className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Full address</label>
            <input name="address" placeholder="Along Mombasa Rd, adjacent to Mulinge Rd" className={inputCls} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Direct Phone</label>
              <input name="phone" placeholder="+254 700 000 000" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Direct WhatsApp</label>
              <input name="whatsapp" placeholder="254700000000" className={inputCls} />
            </div>
          </div>

          <div className="pt-2 border-t border-white/5">
            <LocationPicker />
          </div>

          <button type="submit"
            className="w-full bg-[#2F855A] hover:bg-[#38A169] text-white font-bold py-3 rounded-2xl transition-colors">
            Create Branch
          </button>
        </form>
      </div>
    </div>
  );
}
