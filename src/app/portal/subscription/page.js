"use client";

import { useState } from "react";
import { CreditCard, CheckCircle2, ShieldCheck, Loader2, Smartphone, Sparkles, Zap, Crown, X, Banknote, Building2 } from "lucide-react";

const PLANS = [
  {
    id: "STARTER",
    name: "Starter",
    price: 0,
    period: "Forever Free",
    icon: Zap,
    color: "white",
    bgGlow: "from-white/5 to-white/0",
    borderColor: "border-white/10",
    features: [
      "Up to 5 vehicle listings",
      "Basic dealer profile page",
      "Standard search placement",
      "Email support",
    ],
    cta: "Current Plan",
    disabled: true,
  },
  {
    id: "PRO",
    name: "Pro",
    price: 2000,
    period: "/month",
    icon: Sparkles,
    color: "orange",
    bgGlow: "from-orange-500/20 to-orange-500/0",
    borderColor: "border-orange-500/30",
    popular: true,
    features: [
      "Unlimited vehicle listings",
      "Priority search placement",
      "Advanced analytics dashboard",
      "Lead tracking & management",
      "Verified dealer badge",
      "WhatsApp lead alerts",
    ],
    cta: "Upgrade to Pro",
  },
  {
    id: "ENTERPRISE",
    name: "Enterprise",
    price: 10000,
    period: "/month",
    icon: Crown,
    color: "amber",
    bgGlow: "from-amber-500/20 to-amber-500/0",
    borderColor: "border-amber-500/30",
    features: [
      "Everything in Pro",
      "API access & webhooks",
      "Multi-branch management",
      "Featured homepage placement",
      "Dedicated account manager",
      "Custom branded profile",
      "Priority customer support",
      "Bulk CSV inventory import",
    ],
    cta: "Go Enterprise",
  },
];

const PAYMENT_METHODS = [
  { id: "mpesa", label: "M-Pesa", icon: Smartphone, color: "text-black", desc: "Pay via Safaricom STK Push" },
  { id: "card", label: "Card", icon: CreditCard, color: "text-black", desc: "Visa / Mastercard" },
  { id: "bank", label: "Bank Transfer", icon: Building2, color: "text-black", desc: "Direct EFT / SWIFT" },
];

const colorMap = {
  white: {
    badge: "bg-white/10 text-white/60",
    icon: "bg-white/10 text-white/40",
    check: "text-white/30",
    btn: "bg-white/5 border-white/10 text-white/30 cursor-default",
    glow: "",
  },
  orange: {
    badge: "bg-orange-500/10 text-black",
    icon: "bg-orange-500/10 text-black",
    check: "text-black",
    btn: "bg-orange-600 hover:bg-orange-500 text-white shadow-[0_0_25px_rgba(234,88,12,0.3)] hover:shadow-[0_0_35px_rgba(234,88,12,0.5)]",
    glow: "shadow-[0_0_60px_rgba(234,88,12,0.1)]",
  },
  amber: {
    badge: "bg-amber-500/10 text-black",
    icon: "bg-amber-500/10 text-black",
    check: "text-black",
    btn: "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-[0_0_25px_rgba(245,158,11,0.3)] hover:shadow-[0_0_35px_rgba(245,158,11,0.5)]",
    glow: "shadow-[0_0_60px_rgba(245,158,11,0.08)]",
  },
};

export default function SubscriptionPage() {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [payMethod, setPayMethod] = useState("mpesa");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  const handlePayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus("idle");
    setMessage("");

    try {
      if (payMethod === "mpesa") {
        const res = await fetch("/api/mpesa/stkpush", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone, plan: selectedPlan })
        });
        const data = await res.json();
        if (!res.ok) { setStatus("error"); setMessage(data.error || "Payment failed."); setLoading(false); return; }
        
        setStatus("waiting");
        setMessage("STK Push sent! Check your phone and enter your M-Pesa PIN...");

        // Poll the real payment status every 3 seconds for up to 2 minutes
        const checkoutId = data.checkoutRequestId;
        let attempts = 0;
        const maxAttempts = 40; // 40 × 3s = 2 minutes
        
        const pollInterval = setInterval(async () => {
          attempts++;
          try {
            const statusRes = await fetch(`/api/mpesa/status?id=${checkoutId}`);
            const statusData = await statusRes.json();
            
            if (statusData.status === "COMPLETED") {
              clearInterval(pollInterval);
              setStatus("success");
              setLoading(false);
            } else if (statusData.status === "FAILED") {
              clearInterval(pollInterval);
              setStatus("error");
              setMessage("Payment was cancelled or failed. Please try again.");
              setLoading(false);
            }
          } catch (e) { /* keep polling */ }
          
          if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            setStatus("error");
            setMessage("Payment verification timed out. If you completed payment, it will be applied automatically. Contact support if needed.");
            setLoading(false);
          }
        }, 3000);

      } else if (payMethod === "card") {
        // Card payments will redirect to Pesapal/Flutterwave hosted checkout page
        setStatus("waiting");
        setMessage("Redirecting to secure card checkout...");
        // TODO: Replace with actual Pesapal/Flutterwave redirect when API keys are available
      
      } else if (payMethod === "bank") {
        setStatus("bank_details");
        setLoading(false);
      }
    } catch (err) {
      setStatus("error");
      setMessage("Network error. Please try again.");
      setLoading(false);
    }
  };

  const planObj = PLANS.find(p => p.id === selectedPlan);

  return (
    <div className="animate-in fade-in duration-700 max-w-6xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-white tracking-tight mb-2">Billing & Subscriptions</h1>
        <p className="text-sm font-medium text-white/50">Choose the plan that fits your dealership. Upgrade or downgrade anytime.</p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
        {PLANS.map((plan) => {
          const colors = colorMap[plan.color];
          const Icon = plan.icon;
          return (
            <div key={plan.id} className={`relative bg-surface border ${plan.borderColor} rounded-[2.5rem] p-8 flex flex-col ${colors.glow} transition-all duration-300 hover:scale-[1.02]`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-orange-600 text-white text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg shadow-orange-500/30">
                    Most Popular
                  </span>
                </div>
              )}
              <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-gradient-to-b ${plan.bgGlow} blur-[80px] pointer-events-none rounded-full`} />
              <div className="flex items-center gap-3 mb-6 relative">
                <div className={`w-11 h-11 rounded-2xl ${colors.icon} flex items-center justify-center`}>
                  <Icon size={20} />
                </div>
                <h3 className="text-lg font-black text-white">{plan.name}</h3>
              </div>
              <div className="mb-8 relative">
                <div className="flex items-end gap-1">
                  {plan.price === 0 ? (
                    <span className="text-3xl font-black text-white tracking-tighter">Free</span>
                  ) : (
                    <>
                      <span className="text-xs font-bold text-white/30 mb-1">KES</span>
                      <span className="text-3xl font-black text-white tracking-tighter">{plan.price.toLocaleString()}</span>
                    </>
                  )}
                  <span className="text-xs font-bold text-white/30 mb-1 ml-1">{plan.period}</span>
                </div>
              </div>
              <div className="space-y-3 mb-8 flex-1 relative">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <CheckCircle2 size={14} className={`${colors.check} shrink-0 mt-0.5`} />
                    <span className="text-sm text-white/60 font-medium leading-snug">{feature}</span>
                  </div>
                ))}
              </div>
              <button
                disabled={plan.disabled}
                onClick={() => !plan.disabled && setSelectedPlan(plan.id)}
                className={`w-full rounded-2xl py-4 font-black text-sm tracking-wide transition-all border border-transparent ${colors.btn}`}
              >
                {plan.cta}
              </button>
            </div>
          );
        })}
      </div>

      {/* ─── Payment Checkout Modal ─── */}
      {selectedPlan && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="w-full max-w-lg bg-surface border border-white/10 rounded-[2.5rem] p-10 relative animate-in zoom-in-95 duration-500 max-h-[90vh] overflow-y-auto">
            <button onClick={() => { setSelectedPlan(null); setStatus("idle"); setLoading(false); setPayMethod("mpesa"); }} className="absolute top-6 right-6 text-white/30 hover:text-white transition-colors z-10">
              <X size={20} />
            </button>

            {status === "success" ? (
              <div className="text-center animate-in zoom-in duration-500">
                <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                  <div className="absolute inset-0 border-2 border-emerald-500 rounded-full animate-ping opacity-20" />
                  <CheckCircle2 size={48} className="text-black" />
                </div>
                <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Payment Received!</h2>
                <p className="text-sm text-white/40 font-medium leading-relaxed">
                  Your {planObj?.name} subscription is now active. Welcome to the next level!
                </p>
                <button onClick={() => { setSelectedPlan(null); setStatus("idle"); }} className="mt-8 bg-white/10 hover:bg-white/20 text-white rounded-2xl px-8 py-3 font-black text-sm transition-all">
                  Close
                </button>
              </div>

            ) : status === "waiting" ? (
              <div className="text-center animate-in fade-in duration-500">
                <Loader2 size={48} className="animate-spin text-black mx-auto mb-6" />
                <h2 className="text-xl font-black text-white mb-2">Processing Payment</h2>
                <p className="text-sm text-white/50">{message}</p>
                <div className="mt-8 bg-black/20 p-4 rounded-xl border border-white/5 mx-auto max-w-[220px]">
                  <p className="text-[10px] font-black uppercase tracking-widest text-black animate-pulse">Awaiting Confirmation...</p>
                </div>
              </div>

            ) : status === "bank_details" ? (
              <div className="animate-in fade-in duration-500">
                <div className="text-center mb-8">
                  <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Building2 size={24} className="text-black" />
                  </div>
                  <h3 className="text-xl font-black text-white mb-1">Bank Transfer Details</h3>
                  <p className="text-xs text-white/40">Transfer <span className="text-white font-black">KES {planObj?.price.toLocaleString()}</span> to the following account</p>
                </div>
                <div className="bg-black/30 border border-white/5 rounded-2xl p-6 space-y-4 mb-6">
                  {[
                    ["Bank Name", "Equity Bank"],
                    ["Account Name", "Motorske Ltd"],
                    ["Account Number", "0123456789012"],
                    ["Branch", "Westlands, Nairobi"],
                    ["Swift Code", "EABOROBNXXX"],
                    ["Reference", `MOTORSKE-${selectedPlan}`],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{label}</span>
                      <span className="text-sm font-bold text-white">{value}</span>
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                  <p className="text-[10px] font-black text-black uppercase tracking-widest mb-1">Important</p>
                  <p className="text-xs text-white/50">After transferring, send your payment confirmation screenshot to <span className="text-white font-bold">billing@motorske.com</span> or WhatsApp <span className="text-white font-bold">+254 700 000 000</span>. Your plan will be activated within 24 hours.</p>
                </div>
                <button onClick={() => { setSelectedPlan(null); setStatus("idle"); }} className="w-full mt-6 bg-white/10 hover:bg-white/20 text-white rounded-2xl py-4 font-black text-sm transition-all">
                  Done
                </button>
              </div>

            ) : (
              <form onSubmit={handlePayment} className="space-y-6">
                {/* Header */}
                <div className="text-center mb-2">
                  <h3 className="text-xl font-black text-white mb-1">Choose Payment Method</h3>
                  <p className="text-xs text-white/40">
                    Upgrade to <span className="text-black font-black">{planObj?.name}</span> — <span className="text-white font-black">KES {planObj?.price.toLocaleString()}/mo</span>
                  </p>
                </div>

                {/* Payment Method Tabs */}
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_METHODS.map((method) => {
                    const MIcon = method.icon;
                    const active = payMethod === method.id;
                    return (
                      <button
                        type="button"
                        key={method.id}
                        onClick={() => setPayMethod(method.id)}
                        className={`flex items-center gap-3 p-4 rounded-2xl border text-left transition-all duration-200 ${
                          active 
                            ? "bg-white/10 border-white/20 scale-[1.02]" 
                            : "bg-white/[0.02] border-white/5 hover:bg-white/5"
                        }`}
                      >
                        <MIcon size={18} className={active ? method.color : "text-white/30"} />
                        <div>
                          <p className={`text-sm font-black ${active ? "text-white" : "text-white/50"}`}>{method.label}</p>
                          <p className="text-[9px] font-bold text-white/30 uppercase tracking-wider">{method.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Error */}
                {status === "error" && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-xs font-bold text-white">
                    {message}
                  </div>
                )}

                {/* Dynamic Input based on method */}
                {payMethod === "mpesa" && (
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/60 ml-2">
                      <Smartphone size={12} className="text-black" />
                      Safaricom Number
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. 0712 345 678"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-white font-medium outline-none focus:border-white/20 transition-colors"
                    />
                  </div>
                )}

                {payMethod === "card" && (
                  <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-2xl text-center">
                    <CreditCard size={32} className="text-black mx-auto mb-3" />
                    <p className="text-sm font-bold text-white/60">You will be redirected to a secure payment page to enter your card details.</p>
                    <p className="text-[10px] font-black text-black/60 uppercase tracking-widest mt-2">Powered by Pesapal</p>
                  </div>
                )}

                {payMethod === "bank" && (
                  <div className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-2xl text-center">
                    <Building2 size={32} className="text-black mx-auto mb-3" />
                    <p className="text-sm font-bold text-white/60">Click below to view our bank account details for direct transfer.</p>
                    <p className="text-[10px] font-black text-black/60 uppercase tracking-widest mt-2">Manual activation within 24hrs</p>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-2xl py-4 font-black tracking-wide transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <Banknote size={18} />}
                  {loading 
                    ? "Processing..." 
                    : payMethod === "bank" 
                      ? "View Bank Details" 
                      : `Pay KES ${planObj?.price.toLocaleString()}`
                  }
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
