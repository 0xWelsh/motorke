"use client";

import { MessageCircle } from "lucide-react";
import { getSupportWhatsAppHref } from "@/lib/site-contact";
import { trackUiEvent } from "@/lib/analytics";

export default function HomepageSupportWhatsApp() {
  const href = getSupportWhatsAppHref();
  if (!href) return null;

  function onClick() {
    trackUiEvent("open_whatsapp", {
      channel: "whatsapp",
      context: "homepage_support_fab",
    });
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      aria-label="Chat with BIDGARI support on WhatsApp"
      className="fixed z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_8px_32px_rgba(37,211,102,0.45)] ring-2 ring-white/90 transition-all hover:bg-[#20bd5a] hover:scale-105 active:scale-95 dark:ring-zinc-900/80 bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-4 sm:bottom-6 sm:right-6"
    >
      <MessageCircle className="h-7 w-7" aria-hidden />
      <span className="sr-only">WhatsApp support</span>
    </a>
  );
}
