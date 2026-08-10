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
             <div className="w-2 h-2 rounded-xl bg-zinc-400" />
             <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">System</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">Global Configurations</h1>
        </div>
      </div>

      {isSaved && (
        <div className="bg-[var(--accent)]/10 text-[var(--accent)] p-4 rounded-xl mb-8 font-semibold flex items-center gap-2 text-sm border border-[var(--accent)]/20">
           <Save size={16} /> Update applied successfully
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-8 font-semibold flex items-center gap-2 text-sm border border-red-100">
          <AlertCircle size={16} /> There was an error saving settings.
        </div>
      )}

      <form action="/api/admin/settings" method="POST" className="bg-[#1c1c1c] rounded-xl p-8 border border-white/[0.08]">
         <div className="space-y-6 mb-8">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Platform Fee (Monthly)</label>
              <input 
                name="platform_fee" 
                defaultValue={settings.platform_fee || "45000"} 
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-5 py-4 focus:ring-2 focus:ring-white/[0.2] font-medium" 
                placeholder="Ex. 45000"
              />
              <p className="text-xs text-zinc-400 mt-2">Reserved reference amount for future paid tiers (billing is off while access is free).</p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Global Support Email</label>
              <input 
                name="support_email" 
                defaultValue={settings.support_email || getSupportEmail()}
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-5 py-4 focus:ring-2 focus:ring-white/[0.2] font-medium" 
                placeholder="support@domain.com"
              />
              <p className="text-xs text-zinc-400 mt-2">Where default notifications and automated customer inquiries are CC'ed.</p>
            </div>
         </div>

         <details className="group mt-8">
           <summary className="cursor-pointer text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-300 transition-colors select-none">
             WhatsApp Lead Routing
           </summary>
            <div className="mt-4 space-y-4 border-t border-white/[0.06] pt-4">
              <p className="text-xs text-zinc-400">Phone numbers for the 3 salesmen. The WhatsApp button on car listings routes customers round-robin to these numbers. Include country code (e.g. 2547XXXXXXXX).</p>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Salesman 1</label>
                <input
                  name="salesman_whatsapp_1"
                  defaultValue={settings.salesman_whatsapp_1 || ""}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-5 py-4 focus:ring-2 focus:ring-white/[0.2] font-medium"
                  placeholder="2547XXXXXXXX"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Salesman 2</label>
                <input
                  name="salesman_whatsapp_2"
                  defaultValue={settings.salesman_whatsapp_2 || ""}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-5 py-4 focus:ring-2 focus:ring-white/[0.2] font-medium"
                  placeholder="2547XXXXXXXX"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Salesman 3</label>
                <input
                  name="salesman_whatsapp_3"
                  defaultValue={settings.salesman_whatsapp_3 || ""}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-5 py-4 focus:ring-2 focus:ring-white/[0.2] font-medium"
                  placeholder="2547XXXXXXXX"
                />
              </div>
            </div>
          </details>

          <button type="submit" className="w-full bg-white/[0.1] hover:bg-white/[0.15] text-white rounded-xl px-6 py-4 font-bold transition-colors flex items-center justify-center gap-2 mt-8">
             <Settings size={18} /> Update Configurations
          </button>
       </form>
    </div>
  );
}
