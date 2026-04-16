import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { Settings, Save, AlertCircle } from "lucide-react";

export const metadata = { title: "Settings — Motorke Admin" };

export default async function AdminSettingsPage({ searchParams }) {
  await requireAdmin();

  const resolvedParams = await searchParams;
  const isSaved = resolvedParams?.saved === "1";
  const error = resolvedParams?.error;

  const rawSettings = await db.setting.findMany();
  const settings = rawSettings.reduce((acc, s) => {
    acc[s.key] = s.value;
    return acc;
  }, {});

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-700 max-w-4xl">
      <div className="flex flex-col md:flex-row justify-between mb-12 gap-8">
        <div>
           <div className="flex items-center gap-2 mb-2">
             <div className="w-2 h-2 rounded-none bg-slate-500" />
             <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">System</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Global Configurations</h1>
        </div>
      </div>

      {isSaved && (
        <div className="bg-#ff5a2f]/10 text-#e54a1f p-4 rounded-none mb-8 font-semibold flex items-center gap-2 text-sm shadow-none border border-#ff5a2f]/20">
           <Save size={16} /> Update applied successfully
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-none mb-8 font-semibold flex items-center gap-2 text-sm shadow-none border border-red-100">
          <AlertCircle size={16} /> There was an error saving settings.
        </div>
      )}

      <form action="/api/admin/settings" method="POST" className="bg-white rounded-3xl p-8 shadow-none border border-[#ddd4c8]">
         <div className="space-y-6 mb-8">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Duty Rate Multiple</label>
              <input 
                name="duty_rate" 
                defaultValue={settings.duty_rate || "1.35"} 
                className="w-full bg-[#f7f6f3] border border-[#ddd4c8] rounded-none px-5 py-4 focus:ring-2 focus:ring-slate-900 font-medium" 
                placeholder="Ex. 1.35 for 35%"
              />
              <p className="text-xs text-slate-400 mt-2">Multiplier applied to vehicle CRF values to guess final retail pricing in calculators.</p>
            </div>
            
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Platform Fee (Monthly)</label>
              <input 
                name="platform_fee" 
                defaultValue={settings.platform_fee || "45000"} 
                className="w-full bg-[#f7f6f3] border border-[#ddd4c8] rounded-none px-5 py-4 focus:ring-2 focus:ring-slate-900 font-medium" 
                placeholder="Ex. 45000"
              />
              <p className="text-xs text-slate-400 mt-2">The default monthly subscription KSH amount sent to Payment limits.</p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Global Support Email</label>
              <input 
                name="support_email" 
                defaultValue={settings.support_email || "support@motorske.com"} 
                className="w-full bg-[#f7f6f3] border border-[#ddd4c8] rounded-none px-5 py-4 focus:ring-2 focus:ring-slate-900 font-medium" 
                placeholder="support@domain.com"
              />
              <p className="text-xs text-slate-400 mt-2">Where default notifications and automated customer inquiries are CC'ed.</p>
            </div>
         </div>

         <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-none px-6 py-4 font-bold transition-colors flex items-center justify-center gap-2">
            <Settings size={18} /> Update Configurations
         </button>
      </form>
    </div>
  );
}
