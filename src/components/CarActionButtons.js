"use client";
import { useState } from "react";
import { Calculator, SearchCheck, Gavel, X, Loader2, CheckCircle, ArrowLeft, ArrowRight } from "lucide-react";

const FIELDS = {
  finance: { icon: Calculator, label: "Get Finance" },
  inspection: { icon: SearchCheck, label: "Book Inspection" },
  offer: { icon: Gavel, label: "Pit the Price" },
};

const STEPS = ["Your Details", "Your Request", "Review"];

export default function CarActionButtons({ carId, dealerId, carTitle, price }) {
  const [active, setActive] = useState(null);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", offer: "", date: "", note: "" });
  const [error, setError] = useState("");

  const priceNum = parseInt(String(price).replace(/[^0-9]/g, ""), 10) || 0;

  const estimatedMonthly = (depositPct, termMonths, ratePct) => {
    const loan = priceNum * (1 - depositPct / 100);
    const monthlyRate = ratePct / 100 / 12;
    return Math.round(loan * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / (Math.pow(1 + monthlyRate, termMonths) - 1));
  };

  const monthly = priceNum > 0 ? estimatedMonthly(20, 48, 14) : 0;

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      const message = active === "offer" ? `Offer: KSh ${form.offer}` :
        active === "inspection" ? `Preferred date: ${form.date}` :
        form.note || "";
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          carId, dealerId,
          name: form.name.trim(),
          phone: form.phone.trim(),
          message,
          channel: active.toUpperCase(),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit");
      }
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const open = (key) => {
    setActive(key);
    setStep(0);
    setDone(false);
    setForm({ name: "", phone: "", offer: "", date: "", note: "" });
    setError("");
  };

  const close = () => setActive(null);
  const Icon = FIELDS[active]?.icon;

  const formatPrice = (v) => {
    if (!v) return "";
    const n = parseInt(String(v).replace(/[^0-9]/g, ""), 10);
    return n ? `KSh ${n.toLocaleString("en-KE")}` : "";
  };

  const canAdvance = () => {
    if (step === 0) return form.name.trim() && form.phone.trim().replace(/\D/g, "").length >= 9;
    if (step === 1) return true;
    return true;
  };

  const renderStep = () => {
    if (step === 0) {
      return (
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5 block">Your Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Jane Doe"
              required
              className="w-full border-b-2 border-zinc-200 pb-2.5 text-sm font-medium text-zinc-900 outline-none focus:border-zinc-900 transition-colors bg-transparent"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5 block">Phone Number</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="0712 345 678"
              required
              className="w-full border-b-2 border-zinc-200 pb-2.5 text-sm font-medium text-zinc-900 outline-none focus:border-zinc-900 transition-colors bg-transparent"
            />
          </div>
        </div>
      );
    }

    if (step === 1) {
      if (active === "offer") {
        return (
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5 block">Your Offer</label>
              <input
                type="text"
                value={formatPrice(form.offer)}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, "");
                  setForm({ ...form, offer: raw });
                }}
                placeholder="KSh 1,500,000"
                className="w-full border-b-2 border-zinc-200 pb-2.5 text-lg font-black text-zinc-900 outline-none focus:border-zinc-900 transition-colors bg-transparent"
              />
            </div>
          </div>
        );
      }

      if (active === "inspection") {
        return (
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5 block">Preferred Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full border-b-2 border-zinc-200 pb-2.5 text-sm font-medium text-zinc-900 outline-none focus:border-zinc-900 transition-colors bg-transparent"
              />
            </div>
          </div>
        );
      }

      return (
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5 block">Note (optional)</label>
            <textarea
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              rows={3}
              placeholder="Anything specific you want to ask?"
              className="w-full border-b-2 border-zinc-200 pb-2.5 text-sm font-medium text-zinc-900 outline-none focus:border-zinc-900 transition-colors bg-transparent resize-none"
            />
          </div>
        </div>
      );
    }

    if (step === 2) {
      return (
        <div className="space-y-3 bg-zinc-50 rounded-xl p-4">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Name</span>
            <span className="font-bold text-zinc-900">{form.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Phone</span>
            <span className="font-bold text-zinc-900">{form.phone}</span>
          </div>
          {active === "offer" && form.offer && (
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Offer</span>
              <span className="font-bold text-zinc-900">{formatPrice(form.offer)}</span>
            </div>
          )}
          {active === "inspection" && form.date && (
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Date</span>
              <span className="font-bold text-zinc-900">{form.date}</span>
            </div>
          )}
          {active === "finance" && (
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Enquiry</span>
              <span className="font-bold text-zinc-900">Finance pre-approval</span>
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <>
      <div className="flex gap-2.5">
        {Object.entries(FIELDS).map(([key, f]) => (
          <button
            key={key}
            onClick={() => open(key)}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border-2 border-zinc-900 px-3 py-3 text-[11px] font-black uppercase tracking-wider text-zinc-900 hover:bg-zinc-900 hover:text-white transition-all active:scale-[0.97]"
          >
            <f.icon className="w-4 h-4 shrink-0" />
            <span className="leading-tight">{f.label}</span>
          </button>
        ))}
      </div>

      {active && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={close}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={close} className="absolute top-4 right-4 text-zinc-300 hover:text-zinc-700 transition-colors">
              <X className="w-5 h-5" />
            </button>

            {done ? (
              <div className="text-center py-10">
                <CheckCircle className="w-12 h-12 text-zinc-900 mx-auto mb-4" />
                <h3 className="text-lg font-black text-zinc-900 mb-1">Request Sent!</h3>
                <p className="text-sm text-zinc-500">The dealer will contact you shortly.</p>
                <button onClick={close} className="mt-6 text-sm font-bold text-zinc-900 underline underline-offset-4 hover:no-underline">Close</button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center">
                    {Icon && <Icon className="w-5 h-5 text-zinc-700" />}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-black text-zinc-900">{FIELDS[active]?.label}</h3>
                    <p className="text-xs text-zinc-400 truncate">{carTitle}</p>
                  </div>
                </div>

                {active === "finance" && priceNum > 0 && step < 2 && (
                  <div className="mb-5 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Est. Monthly</p>
                    <p className="text-3xl font-black text-zinc-900">
                      KSh {monthly.toLocaleString("en-KE")}
                      <span className="text-sm font-bold text-zinc-400">/mo</span>
                    </p>
                    <p className="text-[10px] text-zinc-400 mt-1">
                      20% deposit · 48 months · 14% APR
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-2 mb-6">
                  {STEPS.map((s, i) => (
                    <div key={s} className="flex items-center gap-2 flex-1">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-colors ${
                        i === step ? "bg-zinc-900 text-white" :
                        i < step ? "bg-zinc-900 text-white" :
                        "bg-zinc-100 text-zinc-300"
                      }`}>
                        {i < step ? <CheckCircle className="w-3.5 h-3.5" /> : i + 1}
                      </div>
                      {i < 2 && <div className={`flex-1 h-px transition-colors ${i < step ? "bg-zinc-900" : "bg-zinc-200"}`} />}
                    </div>
                  ))}
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (step < 2) {
                      setStep(step + 1);
                    } else {
                      handleSubmit();
                    }
                  }}
                >
                  {renderStep()}

                  {error && (
                    <p className="mt-4 text-[11px] font-bold text-red-600">{error}</p>
                  )}

                  <div className="flex gap-2.5 mt-6">
                    {step > 0 && (
                      <button
                        type="button"
                        onClick={() => setStep(step - 1)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border-2 border-zinc-200 px-4 py-3 text-xs font-black uppercase tracking-wider text-zinc-500 hover:bg-zinc-50 transition-all"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Back
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={!canAdvance() || loading}
                      className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-3 text-xs font-black uppercase tracking-wider text-white bg-zinc-900 hover:bg-zinc-800 transition-all disabled:opacity-30 active:scale-[0.98] ${
                        step > 0 ? "flex-1" : "w-full"
                      }`}
                    >
                      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                      {loading ? "Sending..." : step < 2 ? (
                        <>Next <ArrowRight className="w-3.5 h-3.5" /></>
                      ) : "Submit"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
