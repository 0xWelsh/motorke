"use client";

// src/components/detail/SellerCard.js
import { BadgeCheck, Phone, MapPin } from "lucide-react";
import { SaveButton } from "@/components/CarActions";
import { useClientSession } from "@/hooks/use-client-session";
import { recordLeadIntent } from "@/lib/record-lead";
import { trackUiEvent } from "@/lib/analytics";

const WHATSAPP_ICON_PATH =
  "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z";

/**
 * Seller identity block at the top of the listing rail: who is selling,
 * where they are, and the two fastest ways to reach them.
 */
export default function SellerCard({
  dealer,
  carId,
  carTitle,
  locationLabel,
  whatsappHref,
  callHref,
  prettyPhone,
  count,
}) {
  const { user: clientUser } = useClientSession();

  function onWhatsApp() {
    recordLeadIntent({
      carId,
      dealerId: dealer?.id,
      name: "WhatsApp tap",
      message: `Buyer tapped WhatsApp for: ${carTitle}`,
      channel: "whatsapp",
    });
    trackUiEvent("open_whatsapp", {
      car_id: carId,
      dealer_id: dealer?.id,
      channel: "whatsapp",
      context: "seller_card",
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
      dealerId: dealer?.id,
      name: "Call tap",
      message: `Buyer tapped call for: ${carTitle}`,
      channel: "call",
    });
    trackUiEvent("open_call", {
      car_id: carId,
      dealer_id: dealer?.id,
      channel: "call",
      context: "seller_card",
    });
    fetch(`/api/cars/${carId}/track-action`, {
      method: "POST",
      body: JSON.stringify({ action: "call" }),
      headers: { "Content-Type": "application/json" },
      keepalive: true,
    }).catch(() => {});
  }

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-surface">
      {/* Seller header — one identity: BIDGARI. Dealerships are where the
         stock is sourced; buyers only ever deal with our team. */}
      <div className="flex items-center gap-3 px-4 py-4">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-surface-overlay ring-1 ring-border">
          <span className="flex h-full w-full items-center justify-center bg-[var(--sidebar-bar)] text-[18px] font-black text-white">
            B
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-[15px] font-bold text-text">BIDGARI</span>
            <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-500" aria-label="Verified seller" />
          </span>
          <p className="mt-0.5 text-[11px] leading-snug text-muted">
            Every car inspected, priced, and sold directly by our team.
          </p>
          {locationLabel && (
            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted">
              <MapPin className="h-3 w-3 shrink-0" aria-hidden />
              <span className="truncate">{locationLabel}</span>
            </p>
          )}
          {typeof count === "number" && count > 0 && (
            <p className="mt-0.5 text-[11px] text-dim">
              {count} vehicle{count !== 1 ? "s" : ""} available now
            </p>
          )}
        </div>
      </div>

      {/* Contact rows */}
      <div className="border-t border-subtle">
        {callHref && (
          <a
            href={callHref}
            onClick={onCall}
            className="flex items-center gap-2.5 px-4 py-3 text-[13px] transition-colors hover:bg-surface-hover"
          >
            <Phone className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
            <span className="min-w-0">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-dim">
                Phone
              </span>
              <span className="block truncate font-bold text-text">{prettyPhone}</span>
            </span>
          </a>
        )}

        {whatsappHref && (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onWhatsApp}
            className="flex items-center gap-2.5 border-t border-subtle px-4 py-3 text-[13px] transition-colors hover:bg-surface-hover"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden>
              <path d={WHATSAPP_ICON_PATH} />
            </svg>
            <span className="min-w-0 flex-1">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-dim">
                WhatsApp
              </span>
              <span className="block font-bold text-emerald-700">Chat now</span>
            </span>
          </a>
        )}
      </div>

      {/* Secondary actions — save only; call/WhatsApp already live above */}
      <div className="border-t border-subtle p-3">
        <SaveButton carId={carId} isLoggedIn={Boolean(clientUser)} className="w-full" />
      </div>
    </section>
  );
}
