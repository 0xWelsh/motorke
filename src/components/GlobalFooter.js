"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mail, MapPin, MessageCircle } from "lucide-react";
import PushOptIn from "@/components/PushOptIn";
import BrandLogo from "@/components/BrandLogo";
import { PUBLIC_SUPPORT_EMAIL, getSupportWhatsAppHref } from "@/lib/site-contact";

const COLUMNS = [
  {
    title: "Browse",
    links: [
      { label: "All cars", href: "/cars" },
      { label: "Luxury", href: "/luxury" },
      { label: "Compare cars", href: "/compare" },
      { label: "Duty calculator", href: "/duty" },
      { label: "Cars in Nairobi", href: "/kenya" },
      { label: "Request a car", href: "/request-car" },
    ],
  },
  {
    title: "Selling",
    links: [
      { label: "Sell your car", href: "/sell" },
      { label: "Dealers", href: "/dealers" },
      { label: "Showrooms", href: "/showrooms" },
      { label: "How it works", href: "/how-to-buy" },
      { label: "Testimonials", href: "/testimonials" },
    ],
  },
  {
    title: "Trust",
    links: [
      { label: "Safety guide", href: "/safety" },
      { label: "Report a scam", href: "/report" },
      { label: "Trust & verification", href: "/trust" },
      { label: "Help center", href: "/faq" },
      { label: "Contact us", href: "/contact" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Our mission", href: "/mission" },
      { label: "Guides", href: "/guides" },
      { label: "Blog", href: "/blog" },
      { label: "Privacy policy", href: "/privacy" },
      { label: "Terms of service", href: "/terms" },
    ],
  },
];

export default function GlobalFooter() {
  const pathname = usePathname() || "";
  const currentYear = new Date().getFullYear();

  if (pathname.startsWith("/admin") || pathname.startsWith("/account")) {
    return null;
  }

  const whatsappHref = getSupportWhatsAppHref();

  return (
    <footer className="relative mt-auto border-t border-border bg-surface">
      <div className="container mx-auto max-w-7xl px-6">
        <div className="grid gap-x-8 gap-y-10 py-12 sm:py-16 lg:grid-cols-[minmax(0,2fr)_minmax(0,5fr)]">
          {/* Brand block */}
          <div className="min-w-0">
            <Link href="/" className="inline-flex h-8 items-center transition-opacity hover:opacity-80">
              <BrandLogo />
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
              Kenya&rsquo;s verified car marketplace. Every listing inspected, every
              payment made at handover — one trusted team from first message to
              final paperwork.
            </p>
            <p className="mt-3 max-w-sm text-[12px] italic leading-relaxed text-dim">
              About the name: <span className="font-semibold not-italic">bid</span> +{" "}
              <span className="font-semibold not-italic">gari</span>. Nobody is
              bidding — the gari is simply for sale.
            </p>
            <div className="mt-5 space-y-2.5 text-[13px] font-medium text-muted">
              <a
                href={`mailto:${PUBLIC_SUPPORT_EMAIL}`}
                className="flex items-center gap-2.5 transition-colors hover:text-[var(--accent)]"
              >
                <Mail size={14} className="shrink-0 text-dim" /> {PUBLIC_SUPPORT_EMAIL}
              </a>
              {whatsappHref && (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 transition-colors hover:text-[var(--accent)]"
                >
                  <MessageCircle size={14} className="shrink-0 text-dim" /> WhatsApp support
                </a>
              )}
              <p className="flex items-center gap-2.5">
                <MapPin size={14} className="shrink-0 text-dim" /> Nairobi, Kenya
              </p>
            </div>
            <div className="mt-5">
              <PushOptIn variant="compact" />
            </div>
          </div>

          {/* Link columns */}
          <nav
            aria-label="Footer"
            className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4"
          >
            {COLUMNS.map((col) => (
              <div key={col.title} className="min-w-0">
                <h4 className="mb-3.5 text-[10px] font-black uppercase tracking-[0.22em] text-dim">
                  {col.title}
                </h4>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.href + link.label}>
                      <Link
                        href={link.href}
                        className="text-[13px] font-medium leading-snug text-muted transition-colors hover:text-[var(--accent)]"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-start justify-between gap-3 border-t border-border py-6 sm:flex-row sm:items-center">
          <p className="text-xs font-medium text-dim">
            © {currentYear} BIDGARI Ltd. All rights reserved.
          </p>
          <p className="text-xs font-semibold tracking-wide text-dim">
            Built in Nairobi 🇰🇪 — for the way Kenya buys cars
          </p>
        </div>
      </div>
    </footer>
  );
}
