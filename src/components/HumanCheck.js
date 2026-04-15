"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

export default function HumanCheck({ value, onChange, onFallbackChange }) {
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const widgetRef = useRef(null);
  const widgetIdRef = useRef(null);
  const [scriptReady, setScriptReady] = useState(false);
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

  // Store initial mobile state for Turnstile sizing
  const isMobileRef = useRef(window.innerWidth < 640);

  // If no provider configured, auto-approve for development
  useEffect(() => {
    if (!provider) {
      onChange("human-checked");
      onFallbackChange?.(false);
    }
  }, [onChange, onFallbackChange, provider]);

  // Timeout if script doesn't load within 5 seconds
  useEffect(() => {
    if (!provider) return;
    const timeout = setTimeout(() => {
      if (!scriptReady) {
        setScriptTimeout(true);
      }
    }, 5000);

    return () => clearTimeout(timeout);
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
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-500">
        Security verification disabled (development mode)
      </div>
    );
  }

  function useFallback() {
    onChange("widget-unavailable");
    onFallbackChange?.(true);
  }

  return (
    <div className="space-y-3">
      <Script
        src={provider === "recaptcha" ? "https://www.google.com/recaptcha/api.js?render=explicit" : "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"}
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
        onError={() => {
          console.error("Failed to load security script");
          setScriptError(true);
          setScriptTimeout(true);
        }}
      />

      {!scriptReady && !scriptTimeout && !scriptError && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 flex items-center justify-center gap-3">
          <Loader2 size={16} className="animate-spin text-slate-400" />
          <p className="text-xs font-semibold text-slate-600">Loading security check...</p>
        </div>
      )}

      {(scriptTimeout || scriptError) && !scriptReady && (
        <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-xs font-semibold text-amber-900">
            Security check unavailable. You can continue without it.
          </p>
          <button
            type="button"
            onClick={useFallback}
            className="text-xs font-bold text-slate-900 hover:text-black underline underline-offset-2 transition-colors"
          >
            Continue anyway
          </button>
        </div>
      )}

      {scriptReady && !scriptError && (
        <div className="flex justify-center rounded-lg border border-slate-200 bg-white p-3">
          <div ref={widgetRef} className="inline-block" />
        </div>
      )}

      <p className="text-[11px] font-medium text-slate-500">
        {provider === "recaptcha" ? "Protected by Google reCAPTCHA" : "Powered by Cloudflare Turnstile"}
      </p>
    </div>
  );
}

/* global grecaptcha */
/* global turnstile */
