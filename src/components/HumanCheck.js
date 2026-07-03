"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

export default function HumanCheck({ value, onChange, onFallbackChange, compactMobile = false }) {
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const widgetRef = useRef(null);
  const widgetIdRef = useRef(null);
  const [scriptReady, setScriptReady] = useState(() => {
    if (typeof window === "undefined") return false;
    return Boolean(window.turnstile || window.grecaptcha);
  });
  const [scriptTimeout, setScriptTimeout] = useState(false);
  const [scriptError, setScriptError] = useState(false);
  const [provider, setProvider] = useState(null);

  useEffect(() => {
    const isMobile = window.innerWidth < 640;
    const selectedProvider = isMobile
      ? (turnstileSiteKey ? "turnstile" : recaptchaSiteKey ? "recaptcha" : null)
      : (recaptchaSiteKey ? "recaptcha" : turnstileSiteKey ? "turnstile" : null);
    setProvider(selectedProvider);
  }, [recaptchaSiteKey, turnstileSiteKey]);

  const isMobileRef = useRef(false);
  useEffect(() => {
    if (typeof window !== "undefined") {
      isMobileRef.current = window.innerWidth < 640;
    }
  }, []);

  useEffect(() => {
    if (!provider) {
      onChange("dev-no-captcha");
      onFallbackChange?.(true);
    }
  }, [onChange, onFallbackChange, provider]);

  useEffect(() => {
    if (!provider || scriptReady) return undefined;
    const timeout = setTimeout(() => {
      if (!scriptReady) {
        setScriptTimeout(true);
      }
    }, 12000);
    return () => clearTimeout(timeout);
  }, [provider, scriptReady]);

  useEffect(() => {
    if (!provider || scriptReady) return;
    if (typeof window === "undefined") return;
    if (provider === "turnstile" && window.turnstile) {
      setScriptReady(true);
    } else if (provider === "recaptcha" && window.grecaptcha) {
      setScriptReady(true);
    }
  }, [provider, scriptReady]);

  useEffect(() => {
    if (scriptReady) {
      setScriptTimeout(false);
      onFallbackChange?.(false);
    }
  }, [onFallbackChange, scriptReady]);

  useEffect(() => {
    if (!provider || !scriptReady || !widgetRef.current || widgetIdRef.current !== null) return;

    try {
      if (provider === "recaptcha") {
        if (!window.grecaptcha || !recaptchaSiteKey) return;

        window.grecaptcha.ready(() => {
          try {
            widgetIdRef.current = window.grecaptcha.render(widgetRef.current, {
              sitekey: recaptchaSiteKey,
              theme: "dark",
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
            theme: "dark",
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

  if (!provider) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-xs font-medium text-zinc-500">
        Security check disabled
      </div>
    );
  }

  function reloadPage() {
    if (typeof window !== "undefined") window.location.reload();
  }

  const shellClass = "rounded-lg border border-zinc-800 bg-zinc-900/50 p-2 flex justify-center overflow-hidden";

  return (
    <div className="space-y-2">
      <Script
        id={provider === "recaptcha" ? "wmh-recaptcha" : "wmh-turnstile"}
        src={provider === "recaptcha" ? "https://www.google.com/recaptcha/api.js?render=explicit" : "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"}
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
        onLoad={() => setScriptReady(true)}
        onError={() => {
          console.error("Failed to load security script");
          setScriptError(true);
          setScriptTimeout(true);
        }}
      />

      {!scriptReady && !scriptTimeout && !scriptError && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-3 flex items-center justify-center gap-2">
          <Loader2 size={14} className="animate-spin text-zinc-400" />
          <p className="text-xs font-medium text-zinc-500">Loading security check...</p>
        </div>
      )}

      {(scriptTimeout || scriptError) && !scriptReady && (
        <div className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2.5">
          <p className="text-xs font-medium text-zinc-400">
            We couldn&rsquo;t load the security check. Check your connection and reload the page to try again.
          </p>
          <button
            type="button"
            onClick={reloadPage}
            className="text-xs font-semibold text-[#38A169] hover:underline underline-offset-2 transition-colors"
          >
            Reload page
          </button>
        </div>
      )}

      {scriptReady && !scriptError && (
        <div className={shellClass}>
          <div ref={widgetRef} />
        </div>
      )}

      <p className="text-[10px] font-medium text-zinc-600">
        {provider === "recaptcha" ? "Protected by Google reCAPTCHA" : "Powered by Cloudflare Turnstile"}
      </p>
    </div>
  );
}

/* global grecaptcha */
/* global turnstile */
