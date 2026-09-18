"use client";
import { PUBLIC_SUPPORT_EMAIL } from "@/lib/site-contact";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mail, MapPin } from "lucide-react";
import PushOptIn from "@/components/PushOptIn";

export default function GlobalFooter() {
  const pathname = usePathname() || "";
  const currentYear = new Date().getFullYear();

  if (pathname.startsWith("/admin") || pathname.startsWith("/account")) {
    return null;
  }

  const columns = [
    {
      title: "Navigation",
      links: [
        { label: "Home", href: "/" },
        { label: "Inventory", href: "/cars" },
        { label: "Luxury", href: "/luxury" },
        { label: "Kenya", href: "/kenya" },
        { label: "How to Buy", href: "/how-to-buy" },
        { label: "Compare", href: "/compare" },
        { label: "Request a Car", href: "/request-car" },
        { label: "Sell Your Car", href: "/signup" },
      ],
    },
    {
      title: "Support",
      links: [
        { label: "Help Center", href: "/faq" },
        { label: "Contact Us", href: "/contact" },
        { label: "Don't Get Scammed", href: "/safety" },
        { label: "Privacy Policy", href: "/privacy" },
        { label: "Terms of Service", href: "/terms" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About Us", href: "/mission" },
        { label: "Trust & Safety", href: "/faq" },
        { label: "Contact Team", href: "/contact" },
      ],
    },
  ];

  return (
    <footer className="relative mt-auto border-t border-slate-200 bg-white text-slate-800 pt-12 sm:pt-16 pb-8">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-x-6 gap-y-10 lg:gap-10 mb-12">

          {/* Brand Info */}
          <div className="lg:col-span-2">
            <div className="mb-5">
              <Link href="/" className="group inline-flex items-center transition-opacity active:opacity-80">
                <span className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-900">
                  BIDGARI
                </span>
              </Link>
              <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Kenya's Car Marketplace
              </p>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed max-w-sm mb-5">
              Verified inventory from across Kenya, with one trusted BIDGARI team handling your
              enquiry from first message to final paperwork.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/contact"
                className="btn btn-neutral btn-sm"
              >
                Contact us
              </Link>
              <Link
                href="/cars"
                className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition-colors hover:text-[var(--accent)]"
              >
                Browse cars →
              </Link>
            </div>
            <div className="mt-4">
              <PushOptIn variant="compact" />
            </div>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-3 gap-x-3 sm:gap-x-6 md:gap-x-8 lg:contents">
            {columns.map((col, i) => (
              <div key={i} className="min-w-0">
                <h4 className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-3 sm:mb-5">
                  {col.title}
                </h4>
                <ul className="space-y-2.5 sm:space-y-3">
                  {col.links.map((link, j) => (
                    <li key={j}>
                      <Link
                        href={link.href}
                        {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                        className="text-slate-500 hover:text-[var(--accent)] text-xs sm:text-sm transition-colors font-medium leading-snug"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
          <p className="text-slate-400 text-xs font-medium">
            © {currentYear} BIDGARI Ltd. All rights reserved.
          </p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 text-slate-400">
            <span className="inline-flex items-center gap-2 text-xs">
              <MapPin size={13} className="shrink-0" /> Nairobi, Kenya
            </span>
            <a
              href={`mailto:${PUBLIC_SUPPORT_EMAIL}`}
              className="inline-flex items-center gap-2 text-xs hover:text-[var(--accent)] transition-colors break-all"
            >
              <Mail size={13} className="shrink-0" /> {PUBLIC_SUPPORT_EMAIL}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
