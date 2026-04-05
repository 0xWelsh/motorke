import { requireAdmin } from "@/lib/auth";
import Link from "next/link";
import { Check, ShieldCheck, Zap, Globe, ArrowRight, Building2 } from "lucide-react";

export const metadata = { title: "Billing & Subscriptions — Admin" };

export default async function AdminBillingPage() {
  await requireAdmin();

  const tiers = [
    {
      name: "Standard Partner",
      price: "15,000",
      description: "Perfect for independent dealerships looking to scale.",
      features: [
        "Up to 50 active listings",
        "Basic Analytics Dashboard",
        "Email Support",
        "Standard Market Intel"
      ],
      icon: <Building2 className="text-slate-400" size={24} />,
      btnText: "Current Plan",
      btnClass: "bg-slate-100 text-slate-400 cursor-not-allowed",
      priceId: ""
    },
    {
      name: "Premium Nexus",
      price: "45,000",
      description: "Uncapped performance and dedicated account management.",
      features: [
        "Unlimited active listings",
        "Advanced Analytics & ROI Tracking",
        "Direct WhatsApp AI Routing",
        "Priority Search Placement",
        "1-on-1 Account Manager"
      ],
      icon: <Zap className="text-emerald-500" size={24} />,
      btnText: "Upgrade to Premium",
      btnClass: "bg-slate-900 hover:bg-emerald-600 text-white shadow-xl shadow-slate-200 transition-all",
      priceId: "price_1xxxxxx" // Mock price ID
    }
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-700 max-w-6xl mx-auto py-10">
      <div className="text-center mb-16">
         <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-full text-[10px] font-black uppercase tracking-widest text-emerald-600">
            <ShieldCheck size={14} /> Subscription Management
         </div>
         <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-4">Choose Your Tier.</h1>
         <p className="text-slate-600 font-medium max-w-xl mx-auto">Access premium intelligence, uncap your inventory, and scale your dealership yield with Motorske Premium.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
         {tiers.map((t, i) => (
           <div key={i} className={`bg-white rounded-[2.5rem] p-10 border-2 transition-all duration-500 relative overflow-hidden ${i === 1 ? 'border-emerald-500 shadow-2xl scale-[1.02]' : 'border-slate-100 shadow-sm'}`}>
              
              {i === 1 && (
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-50 rounded-full blur-3xl pointer-events-none" />
              )}
              
              <div className="flex items-center justify-between mb-8 relative z-10">
                 {t.icon}
                 {i === 1 && <span className="bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg">Recommended</span>}
              </div>

              <div className="relative z-10 border-b border-slate-100 pb-8 mb-8">
                <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">{t.name}</h3>
                <p className="text-sm font-medium text-slate-500 leading-relaxed mb-6">{t.description}</p>
                <div className="flex items-end gap-2">
                   <span className="text-4xl font-black text-slate-900 tracking-tighter leading-none">KSh {t.price}</span>
                   <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pb-1">/ month</span>
                </div>
              </div>

              <ul className="space-y-4 mb-10 relative z-10">
                {t.features.map((f, idx) => (
                  <li key={idx} className="flex items-start gap-4">
                     <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
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
                  className={`w-full py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3 ${t.btnClass}`}
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
