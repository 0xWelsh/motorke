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
    color: "slate",
    borderColor: "border-[#ddd4c8]",
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
    color: "slate",
    borderColor: "border-[#ddd4c8]",
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
    color: "slate",
    borderColor: "border-[#ddd4c8]",
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
  { id: "mpesa", label: "M-Pesa", icon: Smartphone, color: "text-#ff5a2f", desc: "Pay via Safaricom STK Push" },
  { id: "card", label: "Card", icon: CreditCard, color: "text-#ff5a2f", desc: "Visa / Mastercard" },
  { id: "bank", label: "Bank Transfer", icon: Building2, color: "text-amber-500", desc: "Direct EFT / SWIFT" },
];

const colorMap = {
  slate: {
    badge: "bg-[#fbfcfe] text-slate-700",
    icon: "bg-[#fbfcfe] text-slate-700",
    check: "text-slate-700",
    btn: "bg-[#111111] hover:bg-[#111111] text-white",
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
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Billing & Subscriptions</h1>
        <p className="text-slate-700 font-medium">Choose the plan that fits your dealership. Upgrade or downgrade anytime.</p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        {PLANS.map((plan) => {
          const colors = colorMap[plan.color];
          const Icon = plan.icon;
          return (
            <div key={plan.id} className={`relative bg-white border ${plan.borderColor} rounded-none p-6 flex flex-col transition-none duration-300 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[8px_8px_0px_0px_rgba(0,0,0,0.05)]`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-[#111111] text-white text-[10px] uppercase font-black tracking-[0.15em] font-semibold px-4 py-1.5 rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[8px_8px_0px_0px_rgba(0,0,0,0.05)]">
                    Most Popular
                  </span>
                </div>
              )}
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-none ${colors.icon} flex items-center justify-center`}>
                  <Icon size={20} />
                </div>
                <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
              </div>
              <div className="mb-6">
                <div className="flex items-end gap-1">
                  {plan.price === 0 ? (
                    <span className="text-3xl font-bold text-slate-900">Free</span>
                  ) : (
                    <>
                      <span className="text-[10px] uppercase font-black tracking-[0.15em] font-medium text-slate-700 mb-1">KES</span>
                      <span className="text-3xl font-bold text-slate-900">{plan.price.toLocaleString()}</span>
                    </>
                  )}
                  <span className="text-[10px] uppercase font-black tracking-[0.15em] font-medium text-slate-700 mb-1 ml-1">{plan.period}</span>
                </div>
              </div>
              <div className="space-y-2 mb-6 flex-1">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle2 size={14} className={`${colors.check} shrink-0 mt-0.5`} />
                    <span className="text-[11px] uppercase font-black tracking-[0.10em] text-slate-700 font-medium">{feature}</span>
                  </div>
                ))}
              </div>
              <button
                disabled={plan.disabled}
                onClick={() => !plan.disabled && setSelectedPlan(plan.id)}
                className={`w-full rounded-none py-3 font-semibold text-[11px] uppercase font-black tracking-[0.10em] transition-none border border-transparent ${plan.disabled ? 'bg-[#fbfcfe] text-slate-700 cursor-default' : colors.btn}`}
              >
                {plan.cta}
              </button>
            </div>
          );
        })}
      </div>

      {/* ─── Payment Checkout Modal ─── */}
      {selectedPlan && (
        <div className="fixed inset-0 bg-[#111111]/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="w-full max-w-lg bg-white border border-[#ddd4c8] rounded-none p-6 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => { setSelectedPlan(null); setStatus("idle"); setLoading(false); setPayMethod("mpesa"); }} className="absolute top-6 right-6 text-slate-700 hover:text-slate-700 transition-colors">
              <X size={20} />
            </button>

            {status === "success" ? (
              <div className="text-center">
                <div className="w-24 h-24 bg-emerald-50 rounded-none flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={48} className="text-#ff5a2f" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Payment Received!</h2>
                <p className="text-[11px] uppercase font-black tracking-[0.10em] text-slate-700 font-medium">
                  Your {planObj?.name} subscription is now active. Welcome to the next level!
                </p>
                <button onClick={() => { setSelectedPlan(null); setStatus("idle"); }} className="mt-6 bg-[#fbfcfe] hover:bg-slate-200 text-slate-900 rounded-none px-8 py-3 font-semibold text-[11px] uppercase font-black tracking-[0.10em] transition-none">
                  Close
                </button>
              </div>

            ) : status === "waiting" ? (
              <div className="text-center">
                <Loader2 size={48} className="animate-spin text-slate-700 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-slate-900 mb-2">Processing Payment</h2>
                <p className="text-[11px] uppercase font-black tracking-[0.10em] text-slate-700">{message}</p>
                <div className="mt-6 bg-[#fbfcfe] p-4 rounded-none border border-[#ddd4c8] mx-auto max-w-[220px]">
                  <p className="text-[10px] uppercase font-black tracking-[0.15em] font-semibold uppercase tracking-wider text-slate-700">Awaiting Confirmation...</p>
                </div>
              </div>

            ) : status === "bank_details" ? (
              <div>
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-[#fbfcfe] rounded-none flex items-center justify-center mx-auto mb-3">
                    <Building2 size={24} className="text-slate-700" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-1">Bank Transfer Details</h3>
                  <p className="text-[10px] uppercase font-black tracking-[0.15em] text-slate-700">Transfer <span className="text-slate-900 font-bold">KES {planObj?.price.toLocaleString()}</span> to the following account</p>
                </div>
                <div className="bg-[#fbfcfe] border border-[#ddd4c8] rounded-none p-6 space-y-3 mb-4">
                  {[
                    ["Bank Name", "Equity Bank"],
                    ["Account Name", "Motorske Ltd"],
                    ["Account Number", "0123456789012"],
                    ["Branch", "Westlands, Nairobi"],
                    ["Swift Code", "EABOROBNXXX"],
                    ["Reference", `MOTORSKE-${selectedPlan}`],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-black tracking-[0.15em] font-semibold uppercase tracking-wider text-slate-700">{label}</span>
                      <span className="text-[11px] uppercase font-black tracking-[0.10em] font-bold text-slate-900">{value}</span>
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-none">
                  <p className="text-[10px] uppercase font-black tracking-[0.15em] font-semibold text-amber-900 uppercase tracking-wider mb-1">Important</p>
                  <p className="text-[10px] uppercase font-black tracking-[0.15em] text-slate-700">After transferring, send your payment confirmation screenshot to <span className="text-slate-900 font-bold">billing@motorske.com</span> or WhatsApp <span className="text-slate-900 font-bold">+254 700 000 000</span>. Your plan will be activated within 24 hours.</p>
                </div>
                <button onClick={() => { setSelectedPlan(null); setStatus("idle"); }} className="w-full mt-4 bg-[#fbfcfe] hover:bg-slate-200 text-slate-900 rounded-none py-3 font-semibold text-[11px] uppercase font-black tracking-[0.10em] transition-none">
                  Done
                </button>
              </div>

            ) : (
              <form onSubmit={handlePayment} className="space-y-4">
                {/* Header */}
                <div className="text-center mb-1">
                  <h3 className="text-xl font-bold text-slate-900 mb-1">Choose Payment Method</h3>
                  <p className="text-[10px] uppercase font-black tracking-[0.15em] text-slate-700">
                    Upgrade to <span className="text-slate-900 font-bold">{planObj?.name}</span> — <span className="text-slate-900 font-bold">KES {planObj?.price.toLocaleString()}/mo</span>
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
                        className={`flex items-center gap-3 p-4 rounded-none border text-left transition-none duration-200 ${
                          active 
                            ? "bg-[#fbfcfe] border-[#ddd4c8]" 
                            : "bg-[#fbfcfe] border-[#ddd4c8] hover:bg-[#fbfcfe]"
                        }`}
                      >
                        <MIcon size={18} className={active ? "text-slate-700" : "text-slate-700"} />
                        <div>
                          <p className={`text-[11px] uppercase font-black tracking-[0.10em] font-semibold ${active ? "text-slate-900" : "text-slate-700"}`}>{method.label}</p>
                          <p className="text-[10px] uppercase font-black tracking-[0.15em] font-medium text-slate-700">{method.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Error */}
                {status === "error" && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-none text-[10px] uppercase font-black tracking-[0.15em] font-semibold text-red-700">
                    {message}
                  </div>
                )}

                {/* Dynamic Input based on method */}
                {payMethod === "mpesa" && (
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] uppercase font-black tracking-[0.15em] font-semibold uppercase tracking-wider text-slate-700">
                      <Smartphone size={14} className="text-slate-700" />
                      Safaricom Number
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. 0712 345 678"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full bg-[#fbfcfe] border border-[#ddd4c8] rounded-none px-4 py-3 text-slate-900 font-medium outline-none focus:border-slate-400 transition-colors"
                    />
                  </div>
                )}

                {payMethod === "card" && (
                  <div className="p-6 bg-blue-50 border border-blue-200 rounded-none text-center">
                    <CreditCard size={32} className="text-#ff5a2f mx-auto mb-3" />
                    <p className="text-[11px] uppercase font-black tracking-[0.10em] font-medium text-slate-700">You will be redirected to a secure payment page to enter your card details.</p>
                    <p className="text-[10px] uppercase font-black tracking-[0.15em] font-semibold text-#ff5a2f uppercase tracking-wider mt-2">Powered by Pesapal</p>
                  </div>
                )}

                {payMethod === "bank" && (
                  <div className="p-6 bg-amber-50 border border-amber-200 rounded-none text-center">
                    <Building2 size={32} className="text-amber-600 mx-auto mb-3" />
                    <p className="text-[11px] uppercase font-black tracking-[0.10em] font-medium text-slate-700">Click below to view our bank account details for direct transfer.</p>
                    <p className="text-[10px] uppercase font-black tracking-[0.15em] font-semibold text-amber-600 uppercase tracking-wider mt-2">Manual activation within 24hrs</p>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#111111] hover:bg-[#111111] disabled:opacity-50 text-white rounded-none py-3 font-semibold tracking-wide transition-none flex items-center justify-center gap-2"
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
