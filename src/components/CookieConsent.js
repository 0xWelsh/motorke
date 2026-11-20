"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { setCookie } from "@/lib/personalization";

const COOKIE_CONSENT_KEY = "welsh-motorhub-cookies";
const LEGACY_COOKIE_CONSENT_KEY = "welsh-motors-cookies";

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only show if not previously accepted or declined
    if (!localStorage.getItem(COOKIE_CONSENT_KEY) && !localStorage.getItem(LEGACY_COOKIE_CONSENT_KEY)) {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  const accept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setCookie("wm_cookie_consent", "accepted");
    setCookie("wm_personalization", "on");
    setShow(false);
  };

  const decline = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "declined");
    setCookie("wm_cookie_consent", "declined");
    setCookie("wm_personalization", "off");
    setShow(false);
  };

  return (
    <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+3.5rem)] left-0 right-0 z-[9999] md:bottom-0 bg-white/95 backdrop-blur border-t border-slate-200 shadow-[0_-8px_30px_-12px_rgba(0,0,0,0.15)] font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
        <p className="text-[13px] text-slate-600 font-medium leading-snug flex-1">
          We use cookies to enhance your browsing, serve personalized content, and analyze traffic.
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={accept} className="btn btn-primary !px-5 !py-2 text-[13px]">
            Accept All
          </button>
          <button onClick={decline} className="btn btn-neutral !px-5 !py-2 text-[13px]">
            Decline
          </button>
          <button onClick={decline} aria-label="Dismiss" className="text-slate-400 hover:text-slate-600 transition-colors p-1">
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
