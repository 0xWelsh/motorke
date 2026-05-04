"use client";
import { PUBLIC_SUPPORT_EMAIL } from "@/lib/site-contact";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { MessageCircle, Send, Camera, Share2, Mail, MapPin } from "lucide-react";

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
    <footer className="bg-[#1A202C] text-white pt-20 pb-10 mt-auto">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-20">
          
          {/* Brand Info */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block mb-6 transition-transform active:scale-95">
              <div className="relative h-8 w-32">
                <Image
                  src="/logos/logo-dark.png"
                  alt="Welsh Motorhub"
                  fill
                  className="object-contain"
                />
              </div>
            </Link>
            <p className="text-[#A0AEC0] text-sm leading-relaxed max-w-sm mb-8">
              Experience the future of automotive digital showrooms. Premium vehicles, 
              verified dealers, and a seamless buying journey across East Africa.
            </p>
            <div className="flex gap-4">
              {[MessageCircle, Send, Camera, Share2].map((Icon, i) => (
                <a key={i} href="#" className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-[#38A169] text-white transition-all" style={{ borderRadius: 'var(--radius)' }}>
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          {columns.map((col, i) => (
            <div key={i}>
              <h4 className="text-[12px] font-bold uppercase tracking-widest text-[#718096] mb-6">{col.title}</h4>
              <ul className="space-y-4">
                {col.links.map((link, j) => (
                  <li key={j}>
                    <Link href={link.href} className="text-[#A0AEC0] hover:text-white text-sm transition-colors font-medium">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="pt-10 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[#718096] text-xs font-medium">
            © {currentYear} Welsh Motorhub Platforms. All rights reserved.
          </p>
          <div className="flex items-center gap-8 text-[#718096]">
            <span className="flex items-center gap-2 text-xs">
              <MapPin size={14} /> Nairobi, Kenya
            </span>
            <a href={`mailto:${PUBLIC_SUPPORT_EMAIL}`} className="flex items-center gap-2 text-xs hover:text-white/90 transition-colors">
              <Mail size={14} /> {PUBLIC_SUPPORT_EMAIL}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
