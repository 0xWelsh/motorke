"use client";
// src/components/EnquiryForm.js

import { useState } from "react";
import Link from "next/link";
import { whatsappLink } from "@/lib/utils";
import {
  PHONE_COUNTRY_CODE_HELPER,
  PHONE_PLACEHOLDER_INTERNATIONAL,
  telHrefFromMsisdn,
} from "@/lib/phone-hints";
import { PUBLIC_SUPPORT_WHATSAPP, PUBLIC_SUPPORT_PHONE } from "@/lib/site-contact";
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
  const [state, setState]   = useState("idle");
  const [name, setName]     = useState(userName);
  const [phone, setPhone]   = useState("");
  const [email, setEmail]   = useState(userEmail);
  const [message, setMessage] = useState(`Hi, I'm interested in the ${carTitle}. Please get back to me with more details.`);
  const [website, setWebsite] = useState("");
  const [consent, setConsent] = useState(false);
  const [notifySimilar, setNotifySimilar] = useState(false);
  const [lastSubmitAt, setLastSubmitAt] = useState(0);
  const [errorText, setErrorText] = useState("");

  const teamWhatsapp = PUBLIC_SUPPORT_WHATSAPP;
  const teamPhone = PUBLIC_SUPPORT_PHONE;
  const waLink = teamWhatsapp
    ? whatsappLink(teamWhatsapp, carTitle, "BIDGARI")
    : null;
  const callHref = teamPhone ? telHrefFromMsisdn(teamPhone) : "";
  const callLink = callHref || null;

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
      setErrorText(
        "Enter a valid Kenya mobile with country code (+254… or 254…), or local 07… / 7… ."
      );
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
      trackUiEvent("submit_lead", {
        car_id: carId,
        dealer_id: dealerId,
        channel: "web",
      });
    } catch {
      setState("error");
      setErrorText("Something went wrong. Please try our WhatsApp instead.");
    }
  }

  async function handleWhatsApp() {
    const normalizedPhone = normalizeKenyanPhone(phone);

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

    trackUiEvent("open_whatsapp", {
      car_id: carId,
      dealer_id: dealerId,
      channel: "whatsapp",
      context: "enquiry_form",
    });
    fetch(`/api/cars/${carId}/track-action`, {
      method: "POST",
      body: JSON.stringify({ action: "whatsapp" }),
      headers: { "Content-Type": "application/json" }
    }).catch((error) => {
      console.error("WhatsApp action tracking failed:", error);
    });
  }

  function handleCall() {
    trackUiEvent("open_call", {
      car_id: carId,
      dealer_id: dealerId,
      channel: "call",
      context: "enquiry_form",
    });
    fetch(`/api/cars/${carId}/track-action`, {
      method: "POST",
      body: JSON.stringify({ action: "call" }),
      headers: { "Content-Type": "application/json" }
    }).catch((error) => {
      console.error("Call action tracking failed:", error);
    });
  }

  const inputCls =
    "w-full bg-slate-50 border border-slate-300 px-3.5 py-2.5 sm:px-4 sm:py-3 text-[13px] sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30 transition-all rounded-lg";

  if (state === "sent") {
    return (
      <div className="text-center py-12 px-6 bg-white border border-slate-200 rounded-xl">
        <p className="font-extrabold text-slate-900 mb-2 uppercase tracking-widest text-xs">Enquiry Sent</p>
        <p className="text-xs text-slate-500 leading-relaxed">
          Thanks! Our team will contact you shortly regarding the <span className="font-bold text-slate-900">{carTitle}</span>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {state === "error" && (
        <p className="text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-lg">
          {errorText || "Submission failed. Please try our WhatsApp."}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          className="hidden"
          aria-hidden="true"
        />
        
        <div className="space-y-4">
          <input
            value={name} onChange={(e) => setName(e.target.value)}
            required placeholder="Your name *"
            className={inputCls}
          />
          <input
            value={email} onChange={(e) => setEmail(e.target.value)}
            type="email" required placeholder="Email address *"
            className={inputCls}
          />
          <div>
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              placeholder={PHONE_PLACEHOLDER_INTERNATIONAL}
              className={inputCls}
            />
            <p className="mt-1.5 text-[10px] font-medium text-slate-500 leading-snug">{PHONE_COUNTRY_CODE_HELPER}</p>
          </div>
          
          <textarea
            value={message} onChange={(e) => setMessage(e.target.value)}
            rows={5}
            placeholder="Hi, I'm interested..."
            className={`${inputCls} resize-none`}
          />
        </div>

        <div className="space-y-4 pt-2">
          <label className="flex items-start gap-3 text-[11px] text-slate-500 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={notifySimilar}
              onChange={(e) => setNotifySimilar(e.target.checked)}
              className="mt-1 accent-[var(--accent)]"
            />
            Notify me when similar listings appear
          </label>
          
          <label className="flex items-start gap-3 text-[11px] text-slate-500 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-1 accent-[var(--accent)]"
              required
            />
            <span>I agree to the <Link href="/terms" className="underline hover:text-slate-900 transition-colors">Terms of Use</Link> and <Link href="/privacy" className="underline hover:text-slate-900 transition-colors">Privacy Policy</Link></span>
          </label>
        </div>

        <div className="pt-4 space-y-4">
          <button
            type="submit"
            disabled={state === "sending"}
            className="w-full btn btn-primary btn-lg"
          >
            {state === "sending" ? "Processing..." : "Submit Enquiry"}
          </button>

          <div className="grid grid-cols-2 gap-3">
            {waLink && (
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleWhatsApp}
                className="flex min-h-12 items-center justify-center gap-2 btn btn-success btn-lg"
              >
                WhatsApp
              </a>
            )}
            {callLink && (
              <a
                href={callLink}
                onClick={handleCall}
                className="flex min-h-12 items-center justify-center gap-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-[10px] py-3.5 uppercase tracking-widest transition-all rounded-xl"
              >
                Call Now
              </a>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
