"use client";
// src/components/EnquiryForm.js
// Replaces the static form in the car detail page.
// Tracks both web form submissions and WhatsApp taps as leads.

import { useState } from "react";
import Link from "next/link";
import { whatsappLink } from "@/lib/utils";

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

export default function EnquiryForm({
  carId,
  dealerId,
  carTitle,
  dealer,
  userName = "",
  userEmail = "",
  whatsAppFirst = true,
  showQuickMessages = true,
  showSafetyBadge = true,
}) {
  const [state, setState]   = useState("idle"); // idle | sending | sent | error
  const [name, setName]     = useState(userName);
  const [phone, setPhone]   = useState("");
  const [email, setEmail]   = useState(userEmail);
  const [message, setMessage] = useState(`Hi, I'm interested in the ${carTitle}. Please get back to me with more details.`);
  const [website, setWebsite] = useState(""); // Honeypot field
  const [consent, setConsent] = useState(false);
  const [notifySimilar, setNotifySimilar] = useState(false);
  const [lastSubmitAt, setLastSubmitAt] = useState(0);
  const [errorText, setErrorText] = useState("");

  const waLink = dealer.whatsapp
    ? whatsappLink(dealer.whatsapp, carTitle, dealer.name)
    : null;
  const callLink = dealer.phone ? `tel:${dealer.phone}` : null;

  const quickMessages = [
    "Is this car still available?",
    "Can I book a viewing today?",
    "What is your best final price?",
  ];

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorText("");

    if (website.trim()) {
      setState("error");
      setErrorText("Submission blocked.");
      return;
    }

    if (!consent) {
      setState("error");
      setErrorText("Please confirm consent to be contacted.");
      return;
    }

    const now = Date.now();
    if (lastSubmitAt && now - lastSubmitAt < 15000) {
      setState("error");
      setErrorText("Please wait a few seconds before sending another enquiry.");
      return;
    }

    const normalizedPhone = normalizeKenyanPhone(phone);
    if (!isValidKenyanPhone(normalizedPhone)) {
      setState("error");
      setErrorText("Use a valid Kenyan number (e.g. 07XXXXXXXX or +2547XXXXXXXX).");
      return;
    }

    setState("sending");

    try {
      const leadMessage = notifySimilar
        ? `${message?.trim() || ""}\n\n[Notify me when similar listings appear]`
        : message;

      const res = await fetch("/api/leads", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          carId,
          dealerId,
          name,
          phone: normalizedPhone,
          email,
          message: leadMessage,
          channel: "web",
        }),
      });

      if (!res.ok) throw new Error("Failed");
      setState("sent");
      setLastSubmitAt(now);
    } catch {
      setState("error");
      setErrorText("Something went wrong. Please try WhatsApp instead.");
    }
  }

  // Track WhatsApp taps as leads too
  async function handleWhatsApp() {
    const normalizedPhone = normalizeKenyanPhone(phone);

    // Fire-and-forget — don't block the WhatsApp redirect
    fetch("/api/leads", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        carId,
        dealerId,
        name: name?.trim() || "WhatsApp tap",
        phone: normalizedPhone,
        email: email?.trim() || null,
        message: `Buyer tapped WhatsApp on: ${carTitle}${message?.trim() ? ` | Buyer note: ${message.trim()}` : ""}`,
        channel: "whatsapp",
      }),
    }).catch((error) => {
      console.error("Lead tracking for WhatsApp tap failed:", error);
    });

    // Track WhatsApp action for analytics
    fetch(`/api/cars/${carId}/track-action`, {
      method: "POST",
      body: JSON.stringify({ action: "whatsapp" }),
      headers: { "Content-Type": "application/json" }
    }).catch((error) => {
      console.error("WhatsApp action tracking failed:", error);
    });
  }

  function handleCall() {
    fetch(`/api/cars/${carId}/track-action`, {
      method: "POST",
      body: JSON.stringify({ action: "call" }),
      headers: { "Content-Type": "application/json" }
    }).catch((error) => {
      console.error("Call action tracking failed:", error);
    });
  }

  const inputCls = "w-full bg-[#fbfcfe] border border-[#ddd4c8] rounded-none px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-[var(--brand-accent)]/30 focus:bg-white transition-all shadow-sm";

  if (state === "sent") {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 bg-emerald-50 rounded-none flex items-center justify-center mx-auto mb-3">
          <span className="text-[#ff5a2f] text-xl">✓</span>
        </div>
        <p className="font-bold text-[#ff5a2f] mb-1">Enquiry sent!</p>
        <p className="text-xs text-slate-500">
          {dealer.name} will contact you on <span className="text-slate-800 font-semibold">{phone}</span> shortly.
        </p>
        {waLink && (
          <a href={waLink} target="_blank" rel="noopener noreferrer"
            onClick={handleWhatsApp}
            className="mt-4 inline-flex items-center gap-2 bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] text-xs font-semibold px-4 py-2.5 rounded-none hover:bg-[#25D366]/20 transition-colors">
            💬 Also message on WhatsApp
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* WhatsApp button — primary CTA */}
      {waLink && whatsAppFirst && (
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleWhatsApp}
          className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1fb558] text-slate-900 font-bold text-sm py-3.5 rounded-none transition-all w-full shadow-lg shadow-[#25D366]/10 active:scale-[0.98]"
        >
          💬 WhatsApp {dealer.name}
        </a>
      )}

      {waLink && whatsAppFirst && (
        <div className="flex items-center gap-3 my-1">
          <div className="flex-1 h-px bg-slate-100" />
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">or send a message</span>
          <div className="flex-1 h-px bg-slate-100" />
        </div>
      )}

      {state === "error" && (
        <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-none px-3 py-2">
          {errorText || "Something went wrong. Please try WhatsApp instead."}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-2.5">
        <input
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          className="hidden"
          aria-hidden="true"
        />
        <input
          value={name} onChange={(e) => setName(e.target.value)}
          required placeholder="Your name"
          className={inputCls}
        />
        <input
          type="tel"
          value={phone} onChange={(e) => setPhone(e.target.value)}
          required placeholder="Phone number (07xx or +2547xx...)"
          className={inputCls}
        />
        <p className="text-[11px] text-slate-500 -mt-1">We will use this number for dealer callback and WhatsApp updates.</p>
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

        {showQuickMessages && (
          <div className="flex flex-wrap gap-2 pt-1">
            {quickMessages.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setMessage(preset)}
                className="text-[10px] font-bold uppercase tracking-[0.08em] px-2.5 py-1.5 rounded-none border border-[#ddd4c8] text-slate-600 hover:bg-[#fbfcfe] hover:text-slate-900 transition-colors"
              >
                {preset}
              </button>
            ))}
          </div>
        )}

        {!showQuickMessages && (
          <label className="flex items-start gap-2.5 text-[11px] text-slate-500 pt-0.5">
            <input
              type="checkbox"
              checked={notifySimilar}
              onChange={(e) => setNotifySimilar(e.target.checked)}
              className="mt-0.5"
            />
            Notify me when similar listings appear
          </label>
        )}

        <button
          type="submit"
          disabled={state === "sending"}
          className="w-full bg-slate-700 hover:bg-slate-800 disabled:opacity-50 text-slate-900 font-bold py-3 rounded-none text-xs uppercase tracking-widest transition-all active:scale-[0.98]"
        >
          {state === "sending" ? "Sending..." : "Submit Enquiry"}
        </button>

        <label className="flex items-start gap-2.5 text-[11px] text-slate-500 pt-1">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5"
            required
          />
          I agree to the <Link href="/terms" className="underline underline-offset-2">Terms of Use</Link> and <Link href="/privacy" className="underline underline-offset-2">Privacy Policy</Link>.
        </label>
        
        {showSafetyBadge && (
          <div className="flex items-center justify-center gap-1.5 pt-2">
            <div className="w-3.5 h-3.5 rounded-none bg-emerald-100 flex items-center justify-center">
              <span className="text-[#ff5a2f] text-[8px]">✓</span>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Safe & Secure Enquiry</span>
          </div>
        )}
      </form>

      {!whatsAppFirst && (waLink || callLink) && (
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#ddd4c8]">
          {waLink ? (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleWhatsApp}
              className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1fb558] text-slate-900 font-bold text-xs py-2.5 rounded-none transition-colors"
            >
              WhatsApp
            </a>
          ) : (
            <span className="inline-flex items-center justify-center text-xs font-bold py-2.5 rounded-none bg-slate-100 text-slate-400">WhatsApp</span>
          )}
          {callLink ? (
            <a
              href={callLink}
              onClick={handleCall}
              className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-black text-white font-bold text-xs py-2.5 rounded-none transition-colors"
            >
              Call Now
            </a>
          ) : (
            <span className="inline-flex items-center justify-center text-xs font-bold py-2.5 rounded-none bg-slate-100 text-slate-400">Call</span>
          )}
        </div>
      )}
    </div>
  );
}
