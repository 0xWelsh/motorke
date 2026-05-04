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
      className="fixed bottom-4 left-4 right-4 sm:right-auto sm:max-w-md w-auto sm:w-[400px] z-[9999] bg-white dark:bg-[#111111] border border-slate-200 dark:border-slate-800 p-5 font-sans animate-in slide-in-from-bottom" 
      style={{ borderRadius: 0, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
    >
       <div className="flex justify-between items-start mb-4">
         <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-[11px]">Privacy & Cookies</h3>
         <button onClick={decline} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
           <X size={16} />
         </button>
       </div>
       <p className="text-[13px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed tracking-tight mb-5">
          We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. By clicking &quot;Accept&quot;, you consent to our use of cookies.
       </p>
       <div className="flex items-center gap-3">
         <button 
           onClick={accept} 
           className="flex-1 bg-[#ff5a2f] hover:bg-[#e0451a] text-white font-black text-[11px] uppercase tracking-widest py-3 transition-colors text-center"
         >
           Accept All
         </button>
         <button 
           onClick={decline} 
           className="flex-1 bg-slate-100 dark:bg-[#1a1a1a] hover:bg-slate-200 dark:hover:bg-[#222222] text-slate-900 dark:text-white font-black text-[11px] uppercase tracking-widest py-3 transition-colors border border-transparent text-center"
         >
           Decline
         </button>
       </div>
    </div>
  );
}
