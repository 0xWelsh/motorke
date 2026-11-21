"use client";

import Link from "next/link";
import { Phone, MessageCircle } from "lucide-react";
import { telHrefFromMsisdn } from "@/lib/phone-hints";
import { recordLeadIntent } from "@/lib/record-lead";
import { trackUiEvent } from "@/lib/analytics";

export default function MobileListingContactBar({
  carId,
  dealerId,
  carTitle,
  dealerName,
  priceLabel,
  whatsappHref,
  callHref,
}) {
  function onWhatsApp() {
    recordLeadIntent({
      carId,
      dealerId,
      name: "WhatsApp tap",
      message: `Buyer tapped mobile WhatsApp bar for: ${carTitle}`,
      channel: "whatsapp",
    });
    trackUiEvent("open_whatsapp", {
      car_id: carId,
      dealer_id: dealerId,
      channel: "whatsapp",
      context: "mobile_sticky_bar",
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
      message: `Buyer tapped mobile call bar for: ${carTitle}`,
      channel: "call",
    });
    trackUiEvent("open_call", {
      car_id: carId,
      dealer_id: dealerId,
      channel: "call",
      context: "mobile_sticky_bar",
    });
    fetch(`/api/cars/${carId}/track-action`, {
      method: "POST",
      body: JSON.stringify({ action: "call" }),
      headers: { "Content-Type": "application/json" },
      keepalive: true,
    }).catch(() => {});
  }

  return (
    <div className="pointer-events-auto mx-auto flex max-w-lg items-stretch gap-3 rounded-2xl border border-border bg-glass/95 p-3 shadow-sm backdrop-blur-xl ring-1 ring-border">
      <div className="flex min-w-0 flex-1 flex-col justify-center pl-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          List price
        </p>
        <p className="truncate text-lg font-black tracking-tight text-text">
          {priceLabel}
        </p>
      </div>
      {whatsappHref ? (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onWhatsApp}
          className="btn btn-success btn-sm shrink-0"
        >
          <MessageCircle aria-hidden />
          <span className="pr-0.5">WhatsApp</span>
        </a>
      ) : null}
      {callHref ? (
        <Link
          href={callHref}
          onClick={onCall}
          className="btn btn-neutral btn-sm shrink-0"
        >
          <Phone aria-hidden />
          Call
        </Link>
      ) : null}
    </div>
  );
}
