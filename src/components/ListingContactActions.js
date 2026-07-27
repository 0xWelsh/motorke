"use client";

import Link from "next/link";
import { Phone, MessageCircle } from "lucide-react";
import { recordLeadIntent } from "@/lib/record-lead";
import { trackUiEvent } from "@/lib/analytics";

export default function ListingContactActions({
  carId,
  dealerId,
  carTitle,
  whatsappHref,
  callHref,
  className = "",
}) {
  function onWhatsApp() {
    recordLeadIntent({
      carId,
      dealerId,
      name: "WhatsApp tap",
      message: `Buyer tapped desktop WhatsApp for: ${carTitle}`,
      channel: "whatsapp",
    });
    trackUiEvent("open_whatsapp", {
      car_id: carId,
      dealer_id: dealerId,
      channel: "whatsapp",
      context: "desktop_summary",
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
      message: `Buyer tapped desktop call for: ${carTitle}`,
      channel: "call",
    });
    trackUiEvent("open_call", {
      car_id: carId,
      dealer_id: dealerId,
      channel: "call",
      context: "desktop_summary",
    });
    fetch(`/api/cars/${carId}/track-action`, {
      method: "POST",
      body: JSON.stringify({ action: "call" }),
      headers: { "Content-Type": "application/json" },
      keepalive: true,
    }).catch(() => {});
  }

  if (!whatsappHref && !callHref) return null;

  return (
    <div className={`grid grid-cols-1 gap-2 sm:grid-cols-2 ${className}`.trim()}>
      {whatsappHref ? (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onWhatsApp}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-[12px] font-bold text-white shadow-sm transition hover:bg-[#20bd5a] active:scale-[0.98]"
        >
          <MessageCircle className="h-4 w-4 shrink-0" aria-hidden />
          WhatsApp
        </a>
      ) : null}
      {callHref ? (
        <Link
          href={callHref}
          onClick={onCall}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-[#1c1c1c] px-4 py-3 text-[12px] font-bold text-white shadow-sm transition hover:bg-white/[0.06] active:scale-[0.98]"
        >
          <Phone className="h-4 w-4 shrink-0" aria-hidden />
          Call Us
        </Link>
      ) : null}
    </div>
  );
}
