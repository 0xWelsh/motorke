"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

export default function HumanCheck({ value, onChange }) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const widgetRef = useRef(null);
  const widgetIdRef = useRef(null);
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    if (!siteKey || !scriptReady) return;
    if (!window.turnstile || !widgetRef.current || widgetIdRef.current !== null) return;

    widgetIdRef.current = window.turnstile.render(widgetRef.current, {
      sitekey: siteKey,
      callback: (token) => onChange(token),
      "expired-callback": () => onChange(""),
      "error-callback": () => onChange(""),
      theme: "light",
    });

    return () => {
      if (widgetIdRef.current !== null && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [onChange, scriptReady, siteKey]);

  if (!siteKey) {
    return (
      <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
        <input
          type="checkbox"
          checked={value === "human-checked"}
          onChange={(event) => onChange(event.target.checked ? "human-checked" : "")}
          className="h-4 w-4 rounded border-slate-300"
        />
        Are you human?
      </label>
    );
  }

  return (
    <div className="space-y-2">
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
      />
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
        <div ref={widgetRef} />
      </div>
      <p className="text-[11px] font-semibold text-slate-500">Security check helps block automated abuse.</p>
    </div>
  );
}
