"use client";
import { PUBLIC_SUPPORT_EMAIL } from "@/lib/site-contact";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mail, MapPin } from "lucide-react";

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
        { label: "Dealers", href: "/dealers" },
        { label: "Compare", href: "/compare" },
        { label: "Request a Car", href: "/request-car" },
        { label: "Sell Your Car", href: "/signup" },
        { label: "Magazine", href: "https://selar.com/m/CircusCarMagazine", external: true },
      ],
    },
    {
      title: "Support",
      links: [
        { label: "Help Center", href: "/faq" },
        { label: "Contact Us", href: "/contact" },
        { label: "Privacy Policy", href: "/privacy" },
        { label: "Terms of Service", href: "/terms" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About Us", href: "/mission" },
        { label: "Partner Dealers", href: "/dealers" },
        { label: "Trust & Safety", href: "/faq" },
        { label: "Contact Team", href: "/contact" },
      ],
    },
  ];

  return (
    <footer className="relative mt-auto border-t border-white/[0.06] bg-[#080808] text-white pt-12 sm:pt-16 pb-8">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-x-6 gap-y-10 lg:gap-10 mb-12">

          {/* Brand Info */}
          <div className="lg:col-span-2">
            <div className="mb-5">
              <Link href="/" className="group inline-flex items-center transition-opacity active:opacity-80">
                <span className="text-[11px] font-black uppercase tracking-[0.24em] text-white">
                  BIDGARI
                </span>
              </Link>
              <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Kenya's Car Marketplace
              </p>
            </div>
            <p className="text-zinc-400 text-sm leading-relaxed max-w-sm mb-5">
              BIDGARI brings dealer listings from across Kenya together in one place for browsing and comparing. Reach the showroom
              on WhatsApp or by phone when you are ready so you speak with the team behind the inventory, not a random middleman.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] bg-transparent px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-white transition-all hover:border-[var(--accent)] hover:bg-[var(--accent)]/5 hover:text-[var(--accent)]"
              >
                Contact us
              </Link>
              <Link
                href="/cars"
                className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 transition-colors hover:text-[var(--accent)]"
              >
                Browse cars →
              </Link>
            </div>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-3 gap-x-3 sm:gap-x-6 md:gap-x-8 lg:contents">
            {columns.map((col, i) => (
              <div key={i} className="min-w-0">
                <h4 className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-3 sm:mb-5">
                  {col.title}
                </h4>
                <ul className="space-y-2.5 sm:space-y-3">
                  {col.links.map((link, j) => (
                    <li key={j}>
                      <Link
                        href={link.href}
                        {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                        className="text-zinc-400 hover:text-[var(--accent)] text-xs sm:text-sm transition-colors font-medium leading-snug"
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
        <div className="pt-6 border-t border-white/[0.06] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
          <p className="text-zinc-500 text-xs font-medium">
            © {currentYear} BIDGARI Ltd. All rights reserved.
          </p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 text-zinc-500">
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
