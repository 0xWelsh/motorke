"use client";

import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { PUBLIC_SUPPORT_EMAIL, PUBLIC_SUPPORT_PHONE } from "@/lib/site-contact";
import { telHrefFromMsisdn } from "@/lib/phone-hints";

export default function SiteTopBar() {
  const telHref = PUBLIC_SUPPORT_PHONE ? telHrefFromMsisdn(PUBLIC_SUPPORT_PHONE) : null;

  return (
    <div className="relative border-b border-[#2F855A]/30 bg-gradient-to-r from-[#1a3d2e] via-[#22543d] to-[#1a3d2e] text-white">
      <div className="home-shell">
        <div className="flex h-9 sm:h-10 items-center justify-between gap-3 text-[10px] sm:text-[11px] font-semibold">
          <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1">
            <a
              href={`mailto:${PUBLIC_SUPPORT_EMAIL}`}
              className="inline-flex items-center gap-1.5 hover:text-emerald-100 transition-colors min-w-0"
            >
              <Mail className="h-3.5 w-3.5 shrink-0 text-emerald-200/90" aria-hidden />
              <span className="truncate max-w-[11rem] sm:max-w-none">{PUBLIC_SUPPORT_EMAIL}</span>
            </a>
            {telHref ? (
              <a
                href={telHref}
                className="inline-flex items-center gap-1.5 hover:text-emerald-100 transition-colors"
              >
                <Phone className="h-3.5 w-3.5 shrink-0 text-emerald-200/90" aria-hidden />
                <span>{PUBLIC_SUPPORT_PHONE}</span>
              </a>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-3 sm:gap-4">
            <Link href="/contact" className="hover:text-emerald-100 transition-colors whitespace-nowrap">
              Contact
            </Link>
            <Link
              href="/portal"
              className="rounded-full bg-white/12 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider hover:bg-white/20 transition-colors whitespace-nowrap"
            >
              Dealer portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
