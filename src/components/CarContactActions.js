"use client";
import { useState } from "react";
import { Phone, Share2 } from "lucide-react";
import { SaveButton } from "@/components/CarActions";
import { useClientSession } from "@/hooks/use-client-session";
import { recordLeadIntent } from "@/lib/record-lead";
import { trackUiEvent } from "@/lib/analytics";

const WHATSAPP_ICON_PATH =
  "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z";

export default function CarContactActions({ whatsappHref, callHref, carId, dealerId, carTitle, isLoggedIn = null }) {
  const [copied, setCopied] = useState(false);
  const { user: clientUser } = useClientSession();
  const effectiveLoggedIn = isLoggedIn !== null ? isLoggedIn : Boolean(clientUser);

  function onWhatsApp() {
    recordLeadIntent({
      carId,
      dealerId,
      name: "WhatsApp tap",
      message: `Buyer tapped WhatsApp for: ${carTitle}`,
      channel: "whatsapp",
    });
    trackUiEvent("open_whatsapp", {
      car_id: carId,
      dealer_id: dealerId,
      channel: "whatsapp",
      context: "contact_actions",
    });
    fetch(`/api/cars/${carId}/track-action`, {
      method: "POST",
      body: JSON.stringify({ action: "whatsapp" }),
      headers: { "Content-Type": "application/json" },
      keepalive: true,
    }).catch(() => {});
  }

  function onCall() {
    recordLeadIntent({
      carId,
      dealerId,
      name: "Call tap",
      message: `Buyer tapped call for: ${carTitle}`,
      channel: "call",
    });
    trackUiEvent("open_call", {
      car_id: carId,
      dealer_id: dealerId,
      channel: "call",
      context: "contact_actions",
    });
    fetch(`/api/cars/${carId}/track-action`, {
      method: "POST",
      body: JSON.stringify({ action: "call" }),
      headers: { "Content-Type": "application/json" },
      keepalive: true,
    }).catch(() => {});
  }

  async function handleShare() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const title = typeof document !== "undefined" ? document.title : "BIDGARI";
    if (typeof navigator !== "undefined" && navigator.share) {
      try { await navigator.share({ title, url }); } catch {}
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  const numberDigits = whatsappHref?.match(/wa\.me\/(\d+)/)?.[1] || "";
  const prettyPhone = numberDigits
    ? `+${numberDigits.slice(0, 3)} ${numberDigits.slice(3, 6)} ${numberDigits.slice(6, 9)} ${numberDigits.slice(9)}`.trim()
    : "";

  return (
    <div className="space-y-2.5">
      {whatsappHref && (
        <div className="space-y-1.5">
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onWhatsApp}
          className="btn btn-success w-full"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d={WHATSAPP_ICON_PATH} />
          </svg>
          Chat on WhatsApp
        </a>
        {prettyPhone && (
          <p className="text-center text-[11px] font-medium text-slate-400">
            Instant reply on {prettyPhone}
          </p>
        )}
        </div>
      )}
      {callHref && (
        <a
          href={callHref}
          onClick={onCall}
          className="btn btn-neutral w-full"
        >
          <Phone />
          Call BIDGARI
        </a>
      )}
      <div className="grid grid-cols-2 gap-2.5">
        <SaveButton carId={carId} isLoggedIn={effectiveLoggedIn} className="w-full" />
        <button
          type="button"
          onClick={handleShare}
          className="btn btn-neutral w-full"
        >
          <Share2 />
          {copied ? "Copied" : "Share"}
        </button>
      </div>
    </div>
  );
}
