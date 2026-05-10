"use client";
import { PUBLIC_SUPPORT_EMAIL } from "@/lib/site-contact";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mail, MapPin } from "lucide-react";

export default function GlobalFooter() {
  const pathname = usePathname() || "";
  const currentYear = new Date().getFullYear();

  // Hide footer on specific routes
  if (pathname.startsWith("/portal") || pathname.startsWith("/admin") || pathname.startsWith("/account")) {
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
        { label: "Sell Your Car", href: "/signup" },
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
    <footer className="relative mt-auto overflow-hidden border-t border-emerald-200/70 dark:border-emerald-900/50 bg-gradient-to-b from-emerald-50/90 via-white to-slate-50/80 dark:from-[#0c1a14] dark:via-[#0a0f0d] dark:to-[#060807] text-slate-900 dark:text-white pt-14 sm:pt-16 pb-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/35 to-transparent dark:via-emerald-500/25" aria-hidden />
      <div className="container mx-auto px-6 max-w-7xl relative">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-x-6 gap-y-8 lg:gap-10 mb-14">
          
          {/* Brand Info */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex mb-6 transition-transform active:scale-95">
              <span className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-900 dark:text-white">
                Welsh Motorhub
              </span>
            </Link>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed max-w-sm mb-5">
              Welsh Motorhub brings dealer listings from across Kenya together in one place for browsing and comparing. Reach the showroom
              on WhatsApp or by phone when you are ready so you speak with the team behind the inventory, not a random middleman.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-lg border border-emerald-600/40 bg-emerald-600/10 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-emerald-800 transition-colors hover:bg-emerald-600 hover:text-white dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200 dark:hover:bg-emerald-600 dark:hover:text-white"
              >
                Contact us
              </Link>
              <Link
                href="/cars"
                className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 underline-offset-4 transition-colors hover:text-[#2F855A] dark:text-slate-400 dark:hover:text-[#4ade80]"
              >
                Browse cars
              </Link>
            </div>
          </div>

          {/* Link columns: 3-up on small screens, row slots on lg via contents */}
          <div className="grid grid-cols-3 gap-x-3 sm:gap-x-6 md:gap-x-8 lg:contents">
            {columns.map((col, i) => (
              <div key={i} className="min-w-0">
                <h4 className="text-[11px] sm:text-[12px] font-bold uppercase tracking-wide sm:tracking-widest text-emerald-800/90 dark:text-emerald-400/90 mb-3 sm:mb-5">
                  {col.title}
                </h4>
                <ul className="space-y-2.5 sm:space-y-4">
                  {col.links.map((link, j) => (
                    <li key={j}>
                      <Link
                        href={link.href}
                        className="text-slate-600 dark:text-slate-300 hover:text-[#2F855A] dark:hover:text-[#4ade80] text-xs sm:text-sm transition-colors font-medium leading-snug"
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
        <div className="pt-8 border-t border-emerald-200/60 dark:border-emerald-900/40 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-slate-600 dark:text-slate-400 text-xs font-medium">
            © {currentYear} Welsh Motorhub Platforms. All rights reserved.
          </p>
          <div className="flex items-center gap-8 text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-2 text-xs">
              <MapPin size={14} /> Nairobi, Kenya
            </span>
            <a href={`mailto:${PUBLIC_SUPPORT_EMAIL}`} className="flex items-center gap-2 text-xs hover:text-[#2F855A] dark:hover:text-[#4ade80] transition-colors">
              <Mail size={14} /> {PUBLIC_SUPPORT_EMAIL}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
