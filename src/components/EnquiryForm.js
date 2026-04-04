"use client";
// src/components/EnquiryForm.js
// Replaces the static form in the car detail page.
// Tracks both web form submissions and WhatsApp taps as leads.

import { useState } from "react";
import { whatsappLink } from "@/lib/utils";

export default function EnquiryForm({ carId, dealerId, carTitle, dealer }) {
  const [state, setState]   = useState("idle"); // idle | sending | sent | error
  const [name, setName]     = useState("");
  const [phone, setPhone]   = useState("");
  const [email, setEmail]   = useState("");
  const [message, setMessage] = useState("");

  const waLink = dealer.whatsapp
    ? whatsappLink(dealer.whatsapp, carTitle, dealer.name)
    : null;

  async function handleSubmit(e) {
    e.preventDefault();
    setState("sending");

    try {
      const res = await fetch("/api/leads", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          carId, dealerId, name, phone, email, message,
          channel: "web",
        }),
      });

      if (!res.ok) throw new Error("Failed");
      setState("sent");
    } catch {
      setState("error");
    }
  }

  // Track WhatsApp taps as leads too
  async function handleWhatsApp() {
    // Fire-and-forget — don't block the WhatsApp redirect
    fetch("/api/leads", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        carId, dealerId,
        name:    "WhatsApp enquiry",
        phone:   dealer.whatsapp || "",
        message: `Buyer tapped WhatsApp on: ${carTitle}`,
        channel: "whatsapp",
      }),
    }).catch(() => {});

    // Track WhatsApp action for analytics
    fetch(`/api/cars/${carId}/track-action`, {
      method: "POST",
      body: JSON.stringify({ action: "whatsapp" }),
      headers: { "Content-Type": "application/json" }
    }).catch(() => {});
  }

  const inputCls = "w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm text-black placeholder-slate-400 outline-none focus:border-[var(--brand-accent)]/30 focus:bg-white transition-all shadow-sm";

  if (state === "sent") {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
          <span className="text-black text-xl">✓</span>
        </div>
        <p className="font-bold text-black mb-1">Enquiry sent!</p>
        <p className="text-xs text-black">
          {dealer.name} will contact you on <span className="text-black font-semibold">{phone}</span> shortly.
        </p>
        {waLink && (
          <a href={waLink} target="_blank" rel="noopener noreferrer"
            onClick={handleWhatsApp}
            className="mt-4 inline-flex items-center gap-2 bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-[#25D366]/20 transition-colors">
            💬 Also message on WhatsApp
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* WhatsApp button — primary CTA */}
      {waLink && (
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleWhatsApp}
          className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1fb558] text-white font-bold text-sm py-3.5 rounded-xl transition-all w-full shadow-lg shadow-[#25D366]/10 active:scale-[0.98]"
        >
          💬 WhatsApp {dealer.name}
        </a>
      )}

      <div className="flex items-center gap-3 my-1">
        <div className="flex-1 h-px bg-slate-100" />
        <span className="text-[10px] text-white font-bold uppercase tracking-widest">or send a message</span>
        <div className="flex-1 h-px bg-slate-100" />
      </div>

      {state === "error" && (
        <p className="text-xs text-white bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
          Something went wrong. Please try WhatsApp instead.
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-2.5">
        <input
          value={name} onChange={(e) => setName(e.target.value)}
          required placeholder="Your name"
          className={inputCls}
        />
        <input
          value={phone} onChange={(e) => setPhone(e.target.value)}
          required placeholder="Phone number (07xx…)"
          className={inputCls}
        />
        <input
          value={email} onChange={(e) => setEmail(e.target.value)}
          type="email" placeholder="Email (optional)"
          className={inputCls}
        />
        <textarea
          value={message} onChange={(e) => setMessage(e.target.value)}
          rows={3}
          placeholder="Any questions about this car?"
          className={`${inputCls} resize-none`}
        />
        <button
          type="submit"
          disabled={state === "sending"}
          className="w-full bg-[var(--brand)] hover:bg-[var(--brand-accent)] disabled:opacity-50 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-[var(--brand)]/10 active:scale-[0.98]"
        >
          {state === "sending" ? "Sending…" : "Send enquiry"}
        </button>
        
        <div className="flex items-center justify-center gap-1.5 pt-2">
          <div className="w-3.5 h-3.5 rounded-full bg-emerald-100 flex items-center justify-center">
            <span className="text-black text-[8px]">✓</span>
          </div>
          <span className="text-[10px] font-bold text-white uppercase tracking-widest">Safe & Secure Enquiry</span>
        </div>
      </form>
    </div>
  );
}
