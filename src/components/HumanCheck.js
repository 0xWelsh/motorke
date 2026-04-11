"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

export default function HumanCheck({ value, onChange, onFallbackChange }) {
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const widgetRef = useRef(null);
  const widgetIdRef = useRef(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [scriptTimeout, setScriptTimeout] = useState(false);

  const provider = recaptchaSiteKey ? "recaptcha" : turnstileSiteKey ? "turnstile" : null;

  useEffect(() => {
    if (!provider) {
      // Keep local/dev forms submittable without exposing a visual fallback control.
      onChange("human-checked");
      onFallbackChange?.(false);
    }
  }, [onChange, onFallbackChange, provider]);

  useEffect(() => {
    if (!provider) return;
    const timeout = setTimeout(() => {
      if (!scriptReady) setScriptTimeout(true);
    }, 5000);

    return () => clearTimeout(timeout);
  }, [provider, scriptReady]);

  useEffect(() => {
    if (scriptReady) {
      setScriptTimeout(false);
      onFallbackChange?.(false);
    }
  }, [onFallbackChange, scriptReady]);

  useEffect(() => {
    if (!provider || !scriptReady || !widgetRef.current || widgetIdRef.current !== null) return;

    if (provider === "recaptcha") {
      if (!window.grecaptcha || !recaptchaSiteKey) return;

      window.grecaptcha.ready(() => {
        widgetIdRef.current = window.grecaptcha.render(widgetRef.current, {
          sitekey: recaptchaSiteKey,
          theme: "light",
          callback: (token) => onChange(token),
          "expired-callback": () => onChange(""),
          "error-callback": () => onChange(""),
        });
      });
      return;
    }

    if (provider === "turnstile") {
      if (!window.turnstile || !turnstileSiteKey) return;
      widgetIdRef.current = window.turnstile.render(widgetRef.current, {
        sitekey: turnstileSiteKey,
        callback: (token) => onChange(token),
        "expired-callback": () => onChange(""),
        "error-callback": () => onChange(""),
        theme: "light",
      });
    }

    return () => {
      if (widgetIdRef.current === null) return;
      if (provider === "turnstile" && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
      if (provider === "recaptcha" && window.grecaptcha) {
        window.grecaptcha.reset(widgetIdRef.current);
      }
      widgetIdRef.current = null;
    };
  }, [onChange, provider, recaptchaSiteKey, scriptReady, turnstileSiteKey]);

  if (!provider) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-500">
        Security verification is unavailable in this environment.
      </div>
    );
  }

  function useFallback() {
    onChange("widget-unavailable");
    onFallbackChange?.(true);
  }

  return (
    <div className="space-y-2">
      <Script
        src={provider === "recaptcha" ? "https://www.google.com/recaptcha/api.js?render=explicit" : "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"}
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
      />
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
        <div ref={widgetRef} />
      </div>
      {!scriptReady && !scriptTimeout && (
        <p className="text-[11px] font-semibold text-slate-500">Loading security check...</p>
      )}
      {scriptTimeout && !scriptReady && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-rose-600">Security check did not load. Refresh this page, or continue without it.</p>
          <button
            type="button"
            onClick={useFallback}
            className="text-[11px] font-bold text-slate-900 underline underline-offset-2 hover:text-black"
          >
            Continue without security check
          </button>
        </div>
      )}
      <p className="text-[11px] font-semibold text-slate-500">
        {provider === "recaptcha" ? "Verified by Google reCAPTCHA." : "Security check helps block automated abuse."}
      </p>
    </div>
  );
}

/* global grecaptcha */
/* global turnstile */
