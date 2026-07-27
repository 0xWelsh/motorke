"use client";

import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { PUBLIC_SUPPORT_EMAIL, PUBLIC_SUPPORT_PHONE } from "@/lib/site-contact";
import { telHrefFromMsisdn } from "@/lib/phone-hints";

export default function SiteTopBar() {
  const telHref = PUBLIC_SUPPORT_PHONE ? telHrefFromMsisdn(PUBLIC_SUPPORT_PHONE) : null;

  return (
    <div className="relative border-b border-white/[0.04] bg-[#0a0a0a] text-zinc-400">
      <div className="home-shell">
        <div className="flex h-9 sm:h-10 items-center justify-between gap-3 text-[10px] sm:text-[11px] font-semibold">
          <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1">
            <a
              href={`mailto:${PUBLIC_SUPPORT_EMAIL}`}
              className="inline-flex items-center gap-1.5 hover:text-[var(--accent)] transition-colors min-w-0"
            >
              <Mail className="h-3.5 w-3.5 shrink-0 text-zinc-500" aria-hidden />
              <span className="truncate max-w-[11rem] sm:max-w-none">{PUBLIC_SUPPORT_EMAIL}</span>
            </a>
            {telHref ? (
              <a
                href={telHref}
                className="inline-flex items-center gap-1.5 hover:text-[var(--accent)] transition-colors"
              >
                <Phone className="h-3.5 w-3.5 shrink-0 text-zinc-500" aria-hidden />
                <span>{PUBLIC_SUPPORT_PHONE}</span>
              </a>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-3 sm:gap-4">
            <Link href="/contact" className="hover:text-[var(--accent)] transition-colors whitespace-nowrap">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
