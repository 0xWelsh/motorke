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
    <div 
      className="fixed bottom-4 left-4 right-4 sm:right-auto sm:max-w-md w-auto sm:w-[400px] z-[9999] bg-white border border-slate-200 p-5 font-sans animate-in slide-in-from-bottom" 
      style={{ borderRadius: 0, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
    >
       <div className="flex justify-between items-start mb-4">
         <h3 className="font-black text-slate-900 uppercase tracking-widest text-[11px]">Privacy & Cookies</h3>
         <button onClick={decline} className="text-slate-400 hover:text-slate-600 transition-colors">
           <X size={16} />
         </button>
       </div>
       <p className="text-[13px] text-slate-600 font-medium leading-relaxed tracking-tight mb-5">
          We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. By clicking &quot;Accept&quot;, you consent to our use of cookies.
       </p>
       <div className="flex items-center gap-3">
         <button 
           onClick={accept} 
           className="flex-1 btn btn-primary"
         >
           Accept All
         </button>
         <button 
           onClick={decline} 
            className="flex-1 btn btn-neutral"
         >
           Decline
         </button>
       </div>
    </div>
  );
}
