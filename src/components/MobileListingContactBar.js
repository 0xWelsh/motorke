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
    <div className="pointer-events-auto mx-auto flex max-w-lg items-stretch gap-3 rounded-2xl border border-slate-200/90 bg-white/95 p-3 shadow-[0_8px_40px_rgba(15,23,42,0.14)] backdrop-blur-xl ring-1 ring-black/5 dark:border-zinc-700 dark:bg-zinc-950/95 dark:ring-white/10">
      <div className="flex min-w-0 flex-1 flex-col justify-center pl-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-700/90 dark:text-emerald-400">
          List price
        </p>
        <p className="truncate text-lg font-black tracking-tight text-slate-900 dark:text-white">
          {priceLabel}
        </p>
      </div>
      {whatsappHref ? (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onWhatsApp}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-3.5 text-[13px] font-bold text-white shadow-sm transition hover:bg-[#20bd5a] active:scale-[0.98]"
        >
          <MessageCircle className="h-6 w-6 shrink-0" aria-hidden />
          <span className="pr-0.5">WhatsApp</span>
        </a>
      ) : null}
      {callHref ? (
        <Link
          href={callHref}
          onClick={onCall}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3.5 text-[13px] font-bold text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.98]"
        >
          <Phone className="h-5 w-5 shrink-0" aria-hidden />
          Call
        </Link>
      ) : null}
    </div>
  );
}
