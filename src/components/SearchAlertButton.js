"use client";
// src/components/SearchAlertButton.js
import { useState } from "react";
import { Bell, X, CheckCircle, Smartphone } from "lucide-react";
import { trackUiEvent } from "@/lib/analytics";

function normalizeKenyanPhone(value) {
  const digits = (value || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("254") && digits.length === 12) return digits;
  if (digits.startsWith("0") && digits.length === 10) return `254${digits.slice(1)}`;
  if (digits.length === 9 && /^(7|1)/.test(digits)) return `254${digits}`;
  return "";
}

function isValidKenyanPhone(value) {
  return /^254(7\d{8}|1\d{8})$/.test(value);
}

export default function SearchAlertButton({ filters = {} }) {
  const [isOpen, setIsOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [errorMessage, setError] = useState("");

  const activeFilters = [
    filters.make && `${filters.make}`,
    filters.model && `${filters.model}`,
    filters.maxPrice && `Under ${Number(filters.maxPrice).toLocaleString()}`,
  ].filter(Boolean).join(" • ") || "All new listings";

  async function handleSubscribe(e) {
    e.preventDefault();
    setError("");
    
    const normalized = normalizeKenyanPhone(phone);
    if (!isValidKenyanPhone(normalized)) {
      setError("Please enter a valid Kenyan WhatsApp number (07... or 254...)");
      return;
    }

    setStatus("loading");
    try {
      const res = await fetch("/api/search-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: normalized,
          make: filters.make || null,
          model: filters.model || null,
          maxPrice: filters.maxPrice ? parseInt(filters.maxPrice) : null,
          minYear: filters.minYOM ? parseInt(filters.minYOM) : null,
          bodyType: filters.bodyType || null,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        trackUiEvent("search_alert_subscribed", { ...filters });
      } else {
        throw new Error(data.error || "Failed to subscribe");
      }
    } catch (err) {
      setStatus("error");
      setError(err.message);
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--accent)] text-white text-[11px] font-black uppercase tracking-[0.12em] shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
        style={{ borderRadius: "12px" }}
      >
        <Bell className="w-3.5 h-3.5" />
        Alert me on WhatsApp
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="w-full max-w-md bg-[#0f0f0f] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300" 
            style={{ borderRadius: "24px" }}
          >
            {/* Header */}
            <div className="relative p-6 bg-[var(--accent)] text-white">
              <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 p-2 hover:bg-black/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <Bell className="w-8 h-8 mb-4 opacity-80" />
              <h3 className="text-xl font-black tracking-tight">Smart Search Alerts</h3>
              <p className="text-white/80 text-sm font-medium mt-1">Get notified the moment a match hits the yard.</p>
            </div>

            <div className="p-8">
              {status === "success" ? (
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-[var(--accent)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-[var(--accent)]" />
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2">You're all set!</h4>
                  <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                    We will send a WhatsApp message to <span className="font-bold text-white">{phone}</span> as soon as we find a car matching your criteria.
                  </p>
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="w-full h-12 bg-[var(--accent)] text-white text-xs font-bold uppercase tracking-widest rounded-xl"
                  >
                    Got it, thanks
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="space-y-6">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)] mb-3">Watching for</p>
                    <div className="p-3 bg-white/5 border border-white/[0.06] rounded-xl">
                      <p className="text-sm font-bold text-white">{activeFilters}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">WhatsApp Number</label>
                    <div className="relative">
                      <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                      <input 
                        required
                        type="tel"
                        placeholder="e.g. 0712 345 678"
                        value={phone}
                        onChange={(e) => { setPhone(e.target.value); setStatus("idle"); }}
                        className="w-full h-14 pl-11 pr-4 bg-white/5 border border-white/[0.06] text-lg font-bold text-white outline-none focus:border-[var(--accent)] transition-colors rounded-xl"
                      />
                    </div>
                    {errorMessage && <p className="text-xs font-bold text-red-500 mt-2">{errorMessage}</p>}
                  </div>

                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    No spam. We only send alerts for your specific search. No account or password required.
                  </p>

                  <button 
                    disabled={status === "loading"}
                    className="w-full h-14 bg-[var(--accent)] hover:bg-[#2F855A] disabled:opacity-50 text-white text-xs font-black uppercase tracking-[0.2em] shadow-lg shadow-[var(--accent)]/20 transition-all rounded-xl"
                  >
                    {status === "loading" ? "Setting up..." : "Activate Alert"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
