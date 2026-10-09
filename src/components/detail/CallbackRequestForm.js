"use client";

// src/components/detail/CallbackRequestForm.js
import { useState } from "react";
import { Loader2, PhoneCall, CheckCircle2 } from "lucide-react";
import { trackUiEvent } from "@/lib/analytics";
import {
  PHONE_COUNTRY_CODE_HELPER,
  PHONE_PLACEHOLDER_INTERNATIONAL,
} from "@/lib/phone-hints";

function normalizeKenyanPhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("254") && digits.length === 12) return digits;
  if (digits.startsWith("0") && digits.length === 10) return `254${digits.slice(1)}`;
  if (digits.length === 9 && /^(7|1)/.test(digits)) return `254${digits}`;
  return "";
}

function isValidKenyanPhone(value) {
  return /^254(7\d{8}|1\d{8})$/.test(value);
}

const inputCls =
  "w-full rounded-lg border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-[13px] text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-[var(--accent)] focus:bg-white focus:ring-1 focus:ring-[var(--accent)]/30";

/**
 * Compact "Request callback" form for the listing rail. Posts to the shared
 * /api/leads endpoint with channel CALLBACK so it lands in the same pipeline
 * as the other enquiry forms.
 */
export default function CallbackRequestForm({ carId, dealerId, carTitle }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const normalized = normalizeKenyanPhone(phone);
    if (!name.trim()) {
      setStatus("error");
      setError("Enter your name.");
      return;
    }
    if (!isValidKenyanPhone(normalized)) {
      setStatus("error");
      setError("Enter a valid Kenya mobile, e.g. 0712 345 678.");
      return;
    }

    setStatus("sending");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          carId,
          dealerId,
          name: name.trim(),
          phone: normalized,
          message: `Callback requested for: ${carTitle}`,
          channel: "CALLBACK",
        }),
      });
      if (!res.ok) throw new Error("failed");
      // The POST above already created the lead — don't fire a second one
      // through recordLeadIntent (the endpoint rate-limits per car anyway).
      setStatus("sent");
      trackUiEvent("submit_lead", {
        car_id: carId,
        dealer_id: dealerId,
        channel: "callback",
      });
    } catch {
      setStatus("error");
      setError("Could not send. Please try WhatsApp or call us instead.");
    }
  }

  if (status === "sent") {
    return (
      <div className="flex items-start gap-2.5 rounded-lg bg-emerald-50 px-4 py-4 text-[12px] leading-relaxed text-emerald-800">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <span>
          <strong className="font-bold">Callback requested.</strong> Our team will call
          you shortly about this car.
        </span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2.5">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
        aria-label="Your name"
        className={inputCls}
        maxLength={80}
      />
      <input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder={PHONE_PLACEHOLDER_INTERNATIONAL}
        aria-label="Your phone number"
        className={inputCls}
      />
      <p className="text-[10px] leading-snug text-slate-400">{PHONE_COUNTRY_CODE_HELPER}</p>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-[11px] font-bold text-red-600">{error}</p>
      )}

      <button type="submit" disabled={status === "sending"} className="btn btn-primary w-full">
        {status === "sending" ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <PhoneCall className="h-4 w-4" aria-hidden />
        )}
        {status === "sending" ? "Sending..." : "Call me back"}
      </button>
    </form>
  );
}
