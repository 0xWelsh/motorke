import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSupportEmail } from "@/lib/site-contact";
import { Settings, Save, AlertCircle } from "lucide-react";

export const metadata = { title: "Settings | BIDGARI Admin" };

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
             <div className="w-2 h-2 rounded-2xl bg-slate-500" />
             <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">System</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Global Configurations</h1>
        </div>
      </div>

      {isSaved && (
        <div className="bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 p-4 rounded-2xl mb-8 font-semibold flex items-center gap-2 text-sm border border-emerald-200/80 dark:border-emerald-800/50">
           <Save size={16} /> Update applied successfully
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-8 font-semibold flex items-center gap-2 text-sm border border-red-100">
          <AlertCircle size={16} /> There was an error saving settings.
        </div>
      )}

      <form action="/api/admin/settings" method="POST" className="bg-white rounded-3xl p-8 border border-[#ddd4c8] dark:border-slate-800">
         <div className="space-y-6 mb-8">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Platform Fee (Monthly)</label>
              <input 
                name="platform_fee" 
                defaultValue={settings.platform_fee || "45000"} 
                className="w-full bg-[#f7f6f3] border border-[#ddd4c8] dark:border-slate-800 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-slate-900 font-medium" 
                placeholder="Ex. 45000"
              />
              <p className="text-xs text-slate-400 mt-2">Reserved reference amount for future paid tiers (billing is off while access is free).</p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Global Support Email</label>
              <input 
                name="support_email" 
                defaultValue={settings.support_email || getSupportEmail()}
                className="w-full bg-[#f7f6f3] border border-[#ddd4c8] dark:border-slate-800 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-slate-900 font-medium" 
                placeholder="support@domain.com"
              />
              <p className="text-xs text-slate-400 mt-2">Where default notifications and automated customer inquiries are CC'ed.</p>
            </div>
         </div>

         <details className="group mt-8">
           <summary className="cursor-pointer text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors select-none">
             Circus Car Magazine Feature
           </summary>
           <div className="mt-4 space-y-4 border-t border-slate-100 dark:border-zinc-800 pt-4">
             <p className="text-xs text-slate-500">These control the magazine feature section on the public gallery page.</p>
             <div>
               <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Cover Image URL</label>
               <input
                 name="magazine_cover_url"
                 defaultValue={settings.magazine_cover_url || ""}
                 className="w-full bg-[#f7f6f3] border border-[#ddd4c8] dark:border-slate-800 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-slate-900 font-medium"
                 placeholder="https://..."
               />
             </div>
             <div>
               <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Purchase Link (Selar)</label>
               <input
                 name="magazine_link"
                 defaultValue={settings.magazine_link || "https://selar.com/m/CircusCarMagazine"}
                 className="w-full bg-[#f7f6f3] border border-[#ddd4c8] dark:border-slate-800 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-slate-900 font-medium"
                 placeholder="https://selar.com/..."
               />
             </div>
           </div>
         </details>

          <details className="group mt-8">
            <summary className="cursor-pointer text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors select-none">
              WhatsApp Lead Routing
            </summary>
            <div className="mt-4 space-y-4 border-t border-slate-100 dark:border-zinc-800 pt-4">
              <p className="text-xs text-slate-500">Phone numbers for the 3 salesmen. The WhatsApp button on car listings routes customers round-robin to these numbers. Include country code (e.g. 2547XXXXXXXX).</p>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Salesman 1</label>
                <input
                  name="salesman_whatsapp_1"
                  defaultValue={settings.salesman_whatsapp_1 || ""}
                  className="w-full bg-[#f7f6f3] border border-[#ddd4c8] dark:border-slate-800 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-slate-900 font-medium"
                  placeholder="2547XXXXXXXX"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Salesman 2</label>
                <input
                  name="salesman_whatsapp_2"
                  defaultValue={settings.salesman_whatsapp_2 || ""}
                  className="w-full bg-[#f7f6f3] border border-[#ddd4c8] dark:border-slate-800 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-slate-900 font-medium"
                  placeholder="2547XXXXXXXX"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Salesman 3</label>
                <input
                  name="salesman_whatsapp_3"
                  defaultValue={settings.salesman_whatsapp_3 || ""}
                  className="w-full bg-[#f7f6f3] border border-[#ddd4c8] dark:border-slate-800 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-slate-900 font-medium"
                  placeholder="2547XXXXXXXX"
                />
              </div>
            </div>
          </details>

          <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-2xl px-6 py-4 font-bold transition-colors flex items-center justify-center gap-2 mt-8">
             <Settings size={18} /> Update Configurations
          </button>
       </form>
    </div>
  );
}
