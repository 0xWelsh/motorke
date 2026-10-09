"use client";
import { useState } from "react";
import { Calculator, SearchCheck, Gavel, X, Loader2, CheckCircle, ArrowLeft, ArrowRight } from "lucide-react";
import { recordLeadIntent } from "@/lib/record-lead";
import { trackUiEvent } from "@/lib/analytics";

const WHATSAPP_ICON_PATH =
  "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.895-11.893a11.821 11.821 0 00-3.48-8.413z";

const FIELDS = {
  finance: { icon: Calculator, label: "Get Finance" },
  inspection: { icon: SearchCheck, label: "Book Inspection" },
  offer: { icon: Gavel, label: "Pit the Price" },
};

const CONCERNS = [
  "Is it still available?",
  "Price negotiable?",
  "Can you deliver?",
  "Service history?",
  "Test drive possible?",
  "Financing options?",
  "Trade-in accepted?",
];

const STEPS = ["Your Details", "Your Request", "Review"];

export default function CarActionButtons({
  carId,
  dealerId,
  carTitle,
  price,
  whatsappHref,
  whatsappNumber,
  // The listing rail renders its own WhatsApp CTA above this block, so the
  // duplicate button (and its "or use a form" divider) can be suppressed.
  showWhatsapp = true,
}) {
  const [active, setActive] = useState(null);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", offer: "", date: "", note: "" });
  const [error, setError] = useState("");

  const prettyPhone = whatsappNumber
    ? `+${String(whatsappNumber).replace(/\D/g, "").replace(/^254/, "254 ").replace(/(254 )(\d{3})(\d{3})(\d{3})/, "$1$2 $3 $4")}`
    : "";

  function onWhatsApp() {
    recordLeadIntent({
      carId,
      dealerId,
      name: "WhatsApp tap",
      message: `Buyer tapped WhatsApp for: ${carTitle}`,
      channel: "whatsapp",
    });
    trackUiEvent("open_whatsapp", {
      car_id: carId,
      dealer_id: dealerId,
      channel: "whatsapp",
      context: "request_actions",
    });
    fetch(`/api/cars/${carId}/track-action`, {
      method: "POST",
      body: JSON.stringify({ action: "whatsapp" }),
      headers: { "Content-Type": "application/json" },
      keepalive: true,
    }).catch(() => {});
  }

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
      const parts = [];
      if (active === "offer" && form.offer) parts.push(`Offer: KES ${form.offer}`);
      if (active === "inspection" && form.date) parts.push(`Preferred date: ${form.date}`);
      if (form.note) parts.push(`Note: ${form.note}`);
      const message = parts.join(" | ");
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
    return n ? `KES ${n.toLocaleString("en-KE")}` : "";
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
      const toggleConcern = (concern) => {
        const current = form.note ? form.note.split(", ").filter((c) => c.trim()) : [];
        const exists = current.includes(concern);
        const updated = exists
          ? current.filter((c) => c !== concern)
          : [...current, concern];
        setForm({ ...form, note: updated.join(", ") });
      };

      return (
        <div className="space-y-5">
          {active === "offer" && (
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5 block">Your Offer</label>
              <input
                type="text"
                value={formatPrice(form.offer)}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, "");
                  setForm({ ...form, offer: raw });
                }}
                placeholder="KES 1,500,000"
                className="w-full border-b-2 border-zinc-200 pb-2.5 text-lg font-black text-zinc-900 outline-none focus:border-zinc-900 transition-colors bg-transparent"
              />
            </div>
          )}

          {active === "inspection" && (
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5 block">Preferred Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full border-b-2 border-zinc-200 pb-2.5 text-sm font-medium text-zinc-900 outline-none focus:border-zinc-900 transition-colors bg-transparent"
              />
            </div>
          )}

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5 block">Got questions? Tap to add</label>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {CONCERNS.map((concern) => {
                const active = form.note.includes(concern);
                return (
                  <button
                    key={concern}
                    type="button"
                    onClick={() => toggleConcern(concern)}
                    className={`text-[11px] font-bold px-2.5 py-1.5 rounded-full border transition-all ${
                      active
                        ? "bg-zinc-900 text-white border-zinc-900"
                        : "bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400"
                    }`}
                  >
                    {concern}
                  </button>
                );
              })}
            </div>
            <textarea
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              rows={2}
              placeholder="Or type your own message..."
              className="w-full border-b-2 border-zinc-200 pb-2 text-sm font-medium text-zinc-900 outline-none focus:border-zinc-900 transition-colors bg-transparent resize-none"
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
          {form.note && (
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Note</span>
              <span className="font-bold text-zinc-900 text-right max-w-[60%] truncate">{form.note}</span>
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <>
      {showWhatsapp && whatsappHref && (
        <div className="space-y-2">
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onWhatsApp}
            className="btn btn-success w-full"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d={WHATSAPP_ICON_PATH} />
            </svg>
            <span>Chat on WhatsApp</span>
          </a>
          {prettyPhone && (
            <p className="text-center text-[11px] font-medium text-slate-400">
              Instant reply on {prettyPhone}
            </p>
          )}
          <div className="flex items-center gap-2 py-0.5">
            <span className="h-px flex-1 bg-slate-200" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              or use a form
            </span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>
        </div>
      )}
      {/* Labels like "Book Inspection" clip in a narrow column, so the
          request buttons always stack full-width. */}
      <div className="flex flex-col gap-2">
        {Object.entries(FIELDS).map(([key, f]) => (
          <button
            key={key}
            onClick={() => open(key)}
            className="btn btn-neutral w-full whitespace-normal"
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
                      KES {monthly.toLocaleString("en-KE")}
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
