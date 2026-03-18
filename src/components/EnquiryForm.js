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
  }

  const inputCls = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-[#f97316]/50 transition-colors";

  if (state === "sent") {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
          <span className="text-green-400 text-xl">✓</span>
        </div>
        <p className="font-bold text-green-400 mb-1">Enquiry sent!</p>
        <p className="text-xs text-white/40">
          {dealer.name} will contact you on <span className="text-white/60">{phone}</span> shortly.
        </p>
        {waLink && (
          <a href={waLink} target="_blank" rel="noopener noreferrer"
            onClick={handleWhatsApp}
            className="mt-4 inline-flex items-center gap-2 bg-[#25D366]/15 border border-[#25D366]/30 text-[#25D366] text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-[#25D366]/25 transition-colors">
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
          className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1fb558] text-white font-bold text-sm py-3 rounded-xl transition-colors w-full"
        >
          💬 WhatsApp {dealer.name}
        </a>
      )}

      <div className="flex items-center gap-3 my-1">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-xs text-white/20">or send a message</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      {state === "error" && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
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
          className="w-full bg-white/10 hover:bg-white/15 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
        >
          {state === "sending" ? "Sending…" : "Send enquiry"}
        </button>
      </form>
    </div>
  );
}
