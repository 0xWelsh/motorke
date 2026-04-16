import { requireAdmin } from "@/lib/auth";
import Link from "next/link";
import { Check, ShieldCheck, Zap, Globe, ArrowRight, Building2 } from "lucide-react";

export const metadata = { title: "Billing — Admin" };

export default async function AdminBillingPage() {
  await requireAdmin();

  const tiers = [
    {
      name: "Standard Plan",
      price: "15,000",
      description: "Perfect for independent dealerships looking to scale.",
      features: [
        "Up to 50 active listings",
        "Basic Analytics",
        "Email Support",
        "Market Updates"
      ],
      icon: <Building2 className="text-slate-400" size={24} />,
      btnText: "Current Plan",
      btnClass: "bg-slate-100 text-slate-400 cursor-not-allowed",
      priceId: ""
    },
    {
      name: "Premium Plan",
      price: "45,000",
      description: "More reach and dedicated account support.",
      features: [
        "Unlimited active listings",
        "Advanced Analytics and ROI Tracking",
        "Direct WhatsApp Routing",
        "Priority Search Placement",
        "1-on-1 Account Manager"
      ],
      icon: <Zap className="text-[#ff5a2f]" size={24} />,
      btnText: "Upgrade to Premium",
      btnClass: "bg-slate-900 hover:bg-[#ff5a2f] text-white shadow-none shadow-none transition-all",
      priceId: "price_1xxxxxx" // Mock price ID
    }
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-700 max-w-6xl mx-auto py-10">
      <div className="text-center mb-16">
         <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-[#ff5a2f]]/10 border border-[#ff5a2f]]/20 rounded-none text-[10px] font-black uppercase tracking-widest text-[#ff5a2f]">
            <ShieldCheck size={14} /> Subscription Management
         </div>
        <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-4">Choose a Plan.</h1>
        <p className="text-slate-600 font-medium max-w-xl mx-auto">Manage plans, grow inventory, and unlock more dealer tools with Motorke Premium.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
         {tiers.map((t, i) => (
           <div key={i} className={`bg-white rounded-[2.5rem] p-10 border-2 transition-all duration-500 relative overflow-hidden ${i === 1 ? 'border-[#ff5a2f] shadow-none scale-[1.02]' : 'border-slate-100 shadow-none'}`}>
              
              {i === 1 && (
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#ff5a2f]]/10 rounded-none blur-3xl pointer-events-none" />
              )}
              
              <div className="flex items-center justify-between mb-8 relative z-10">
                 {t.icon}
                 {i === 1 && <span className="bg-[#ff5a2f] text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-none shadow-none">Recommended</span>}
              </div>

              <div className="relative z-10 border-b border-slate-100 pb-8 mb-8">
                <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">{t.name}</h3>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 leading-relaxed mb-6">{t.description}</p>
                <div className="flex items-end gap-2">
                   <span className="text-4xl font-black text-slate-900 tracking-tighter leading-none">KSh {t.price}</span>
                   <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pb-1">/ month</span>
                </div>
              </div>

              <ul className="space-y-4 mb-10 relative z-10">
                {t.features.map((f, idx) => (
                  <li key={idx} className="flex items-start gap-4">
                     <div className="w-5 h-5 rounded-none bg-[#ff5a2f]]/10 text-[#ff5a2f] flex items-center justify-center shrink-0 mt-0.5">
                       <Check size={12} strokeWidth={3} />
                     </div>
                     <span className="text-sm font-semibold text-slate-700">{f}</span>
                  </li>
                ))}
              </ul>

              <form action="/api/stripe/checkout" method="POST" className="relative z-10">
                 <input type="hidden" name="priceId" value={t.priceId} />
                 <button 
                  type={i === 1 ? "submit" : "button"} 
                  className={`w-full py-5 rounded-none text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3 ${t.btnClass}`}
                 >
                   {t.btnText} {i === 1 && <ArrowRight size={16} />}
                 </button>
              </form>
           </div>
         ))}
      </div>
    </div>
  );
}
