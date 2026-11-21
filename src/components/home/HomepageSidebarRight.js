"use client";
import Link from "next/link";
import { MapPin, ChevronRight, ShieldCheck } from "lucide-react";
import { PUBLIC_SUPPORT_PHONE } from "@/lib/site-contact";
import { telHrefFromMsisdn } from "@/lib/phone-hints";

const LOCATIONS = [
  "Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret",
  "Thika", "Naivasha", "Nyeri", "Meru", "Kericho",
  "Kakamega", "Machakos",
];

function Section({ title, children }) {
  return (
    <div className="border-b border-subtle last:border-b-0">
      <h3 className="px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-dim">
        {title}
      </h3>
      <div className="px-3 pb-3">{children}</div>
    </div>
  );
}

export default function HomepageSidebarRight() {
  const telHref = PUBLIC_SUPPORT_PHONE ? telHrefFromMsisdn(PUBLIC_SUPPORT_PHONE) : null;


  return (
    <aside className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
      <Section title="Locations">
        <div className="space-y-0.5">
          {LOCATIONS.map((c) => (
            <Link
              key={c}
              href={`/cars?county=${encodeURIComponent(c)}`}
              className="flex w-full items-center gap-1.5 rounded py-1 text-[12px] font-semibold text-muted transition-colors hover:text-text"
            >
              <MapPin className="h-3 w-3 shrink-0 text-ghost" aria-hidden />
              <span className="min-w-0 truncate">{c}</span>
            </Link>
          ))}
        </div>
      </Section>

      <Section title="Why BIDGARI">
        <p className="flex items-start gap-2 text-[11px] font-medium leading-relaxed text-muted">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" aria-hidden />
          Every listing is verified and sold through one trusted BIDGARI team.
        </p>
        <Link
          href="/how-to-buy"
          className="mt-2 flex w-full items-center gap-1.5 rounded py-1 text-[12px] font-semibold text-[var(--accent)] transition-colors hover:underline"
        >
          How it works
          <ChevronRight className="h-3 w-3 shrink-0" aria-hidden />
        </Link>
        {telHref && (
          <a
            href={telHref}
            className="mt-1 block text-[11px] font-bold text-secondary hover:text-[var(--accent)]"
          >
            Call us: {PUBLIC_SUPPORT_PHONE}
          </a>
        )}
      </Section>
    </aside>
  );
}
