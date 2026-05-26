"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

export default function HumanCheck({ value, onChange, onFallbackChange, compactMobile = false }) {
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const widgetRef = useRef(null);
  const widgetIdRef = useRef(null);
  // If the captcha script is already loaded from a previous page (Next.js
  // <Script> dedupes by src), `onLoad` never fires again on remount. We
  // detect that here so the widget can render straight away instead of
  // sitting in a perpetual "loading…" state until the timeout trips.
  const [scriptReady, setScriptReady] = useState(() => {
    if (typeof window === "undefined") return false;
    return Boolean(window.turnstile || window.grecaptcha);
  });
  const [scriptTimeout, setScriptTimeout] = useState(false);
  const [scriptError, setScriptError] = useState(false);
  const [provider, setProvider] = useState(null);

  // On mount, determine provider based on screen size (once per session)
  // Mobile prefers Turnstile (compact mode), desktop prefers reCAPTCHA
  useEffect(() => {
    const isMobile = window.innerWidth < 640;
    const selectedProvider = isMobile 
      ? (turnstileSiteKey ? "turnstile" : recaptchaSiteKey ? "recaptcha" : null)
      : (recaptchaSiteKey ? "recaptcha" : turnstileSiteKey ? "turnstile" : null);
    setProvider(selectedProvider);
  }, [recaptchaSiteKey, turnstileSiteKey]);

  // Store initial mobile state for Turnstile sizing (SSR-safe)
  const isMobileRef = useRef(false);
  useEffect(() => {
    if (typeof window !== "undefined") {
      isMobileRef.current = window.innerWidth < 640;
    }
  }, []);

  // If no provider is configured (dev / local), tell the parent to allow
  // submission. Server-side captcha.js mirrors this: when neither
  // RECAPTCHA_SECRET nor TURNSTILE_SECRET is set, the check is skipped.
  // We send a marker that's harmless on the server (it isn't on the
  // allow-list anymore; verification still bails to "not-configured").
  useEffect(() => {
    if (!provider) {
      onChange("dev-no-captcha");
      onFallbackChange?.(true);
    }
  }, [onChange, onFallbackChange, provider]);

  // Timeout if script doesn't load within 12s. Kenyan mobile connections
  // routinely take 5-8 seconds for third-party scripts; a 5s budget pushed
  // legitimate users into the fallback path.
  useEffect(() => {
    if (!provider || scriptReady) return undefined;
    const timeout = setTimeout(() => {
      if (!scriptReady) {
        setScriptTimeout(true);
      }
    }, 12000);

    return () => clearTimeout(timeout);
  }, [provider, scriptReady]);

  // Belt-and-suspenders: even after `provider` resolves on remount, the
  // script object may already be on `window` from a prior page. Re-check
  // before deciding to show the loading state.
  useEffect(() => {
    if (!provider || scriptReady) return;
    if (typeof window === "undefined") return;
    if (provider === "turnstile" && window.turnstile) {
      setScriptReady(true);
    } else if (provider === "recaptcha" && window.grecaptcha) {
      setScriptReady(true);
    }
  }, [provider, scriptReady]);

  // Clear timeout when script loads
  useEffect(() => {
    if (scriptReady) {
      setScriptTimeout(false);
      onFallbackChange?.(false);
    }
  }, [onFallbackChange, scriptReady]);

  // Render widget once script is ready
  useEffect(() => {
    if (!provider || !scriptReady || !widgetRef.current || widgetIdRef.current !== null) return;

    try {
      if (provider === "recaptcha") {
        if (!window.grecaptcha || !recaptchaSiteKey) return;

        window.grecaptcha.ready(() => {
          try {
            widgetIdRef.current = window.grecaptcha.render(widgetRef.current, {
              sitekey: recaptchaSiteKey,
              theme: "light",
              callback: (token) => onChange(token),
              "expired-callback": () => onChange(""),
              "error-callback": () => onChange(""),
            });
          } catch (e) {
            console.error("reCAPTCHA render error:", e);
            setScriptError(true);
          }
        });
        return;
      }

      if (provider === "turnstile") {
        if (!window.turnstile || !turnstileSiteKey) return;
        try {
          widgetIdRef.current = window.turnstile.render(widgetRef.current, {
            sitekey: turnstileSiteKey,
            callback: (token) => onChange(token),
            "expired-callback": () => onChange(""),
            "error-callback": () => onChange(""),
            theme: "light",
            size: isMobileRef.current ? "compact" : "normal",
          });
        } catch (e) {
          console.error("Turnstile render error:", e);
          setScriptError(true);
        }
      }
    } catch (e) {
      console.error("Widget setup error:", e);
      setScriptError(true);
    }

    return () => {
      if (widgetIdRef.current === null) return;
      try {
        if (provider === "turnstile" && window.turnstile) {
          window.turnstile.remove(widgetIdRef.current);
        }
        if (provider === "recaptcha" && window.grecaptcha) {
          window.grecaptcha.reset(widgetIdRef.current);
        }
      } catch (e) {
        console.error("Widget cleanup error:", e);
      }
      widgetIdRef.current = null;
    };
  }, [onChange, provider, recaptchaSiteKey, scriptReady, turnstileSiteKey]);

  // No provider configured
  if (!provider) {
    return (
      <div className="rounded-md sm:rounded-2xl border border-[#ddd4c8] dark:border-slate-800 bg-[#fbfcfe] dark:bg-[#111111] px-3 py-2 sm:px-4 sm:py-3 text-xs font-semibold text-slate-500">
        Security verification disabled (development mode)
      </div>
    );
  }

  function reloadPage() {
    if (typeof window !== "undefined") window.location.reload();
  }

  const mobileShellClass = compactMobile
    ? "rounded-md border border-[#ddd4c8] dark:border-slate-800 bg-white dark:bg-[#111111] p-1.5 flex justify-start overflow-hidden max-w-[280px] sm:max-w-none sm:rounded-2xl sm:p-3 sm:justify-center"
    : "rounded-md sm:rounded-2xl border border-[#ddd4c8] dark:border-slate-800 bg-white dark:bg-[#111111] p-1.5 sm:p-3 flex justify-start sm:justify-center";
  const mobileWidgetClass = compactMobile
    ? "inline-block origin-left scale-[0.92] sm:scale-100 sm:origin-center"
    : "inline-block";

  return (
    <div className="space-y-2 sm:space-y-3">
      <Script
        id={provider === "recaptcha" ? "wmh-recaptcha" : "wmh-turnstile"}
        src={provider === "recaptcha" ? "https://www.google.com/recaptcha/api.js?render=explicit" : "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"}
        strategy="afterInteractive"
        // onReady fires on first load AND on every remount once the script
        // is already in the DOM (e.g. navigating from /signup to /login).
        // Using onLoad alone leaves the widget stuck on the second page
        // because Next.js dedupes the script tag and onLoad never refires.
        onReady={() => setScriptReady(true)}
        onLoad={() => setScriptReady(true)}
        onError={() => {
          console.error("Failed to load security script");
          setScriptError(true);
          setScriptTimeout(true);
        }}
      />

      {!scriptReady && !scriptTimeout && !scriptError && (
        <div className="rounded-md sm:rounded-2xl border border-[#ddd4c8] dark:border-slate-800 bg-[#fbfcfe] dark:bg-[#111111] px-3 py-4 sm:px-4 sm:py-6 flex items-center justify-start sm:justify-center gap-2 sm:gap-3">
          <Loader2 size={16} className="animate-spin text-slate-400" />
          <p className="text-[11px] sm:text-xs font-semibold text-slate-600">Loading security check...</p>
        </div>
      )}

      {(scriptTimeout || scriptError) && !scriptReady && (
        <div className="space-y-2 sm:space-y-3 rounded-md sm:rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2.5 sm:px-4 sm:py-3">
          <p className="text-xs font-semibold text-amber-900">
            We couldn&rsquo;t load the security check. Check your connection and reload the page to try again.
          </p>
          <button
            type="button"
            onClick={reloadPage}
            className="text-xs font-bold text-slate-900 dark:text-white hover:text-black underline underline-offset-2 transition-colors"
          >
            Reload page
          </button>
        </div>
      )}

      {scriptReady && !scriptError && (
        <div className={mobileShellClass}>
          <div ref={widgetRef} className={mobileWidgetClass} />
        </div>
      )}

      <p className={`font-medium text-slate-500 ${compactMobile ? "text-[10px] sm:text-[11px]" : "text-[11px]"}`}>
        {provider === "recaptcha" ? "Protected by Google reCAPTCHA" : "Powered by Cloudflare Turnstile"}
      </p>
    </div>
  );
}

/* global grecaptcha */
/* global turnstile */
