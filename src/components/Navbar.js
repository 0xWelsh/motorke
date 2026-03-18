"use client";
// src/components/Navbar.js
import { useState } from "react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/cars",    label: "Browse Cars"   },
    { href: "/dealers", label: "Dealerships"   },
    { href: "/compare", label: "Compare"       },
    { href: "/duty",    label: "Duty calc"     },
  ];

  return (
    <nav className="border-b border-white/10 bg-[#0f0f0f]/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <a href="/" className="flex items-center gap-2 flex-shrink-0">
            <span className="text-2xl font-black tracking-tight text-white">
              Motor<span className="text-[#f97316]">ke</span>
            </span>
            <span className="text-xs text-white/40 font-medium tracking-widest uppercase mt-1 hidden sm:block">
              Kenya
            </span>
          </a>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {links.map(({ href, label }) => (
              <a key={href} href={href}
                className="text-sm text-white/60 hover:text-white transition-colors">
                {label}
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <a href="/login"
            className="hidden md:inline-flex items-center gap-2 bg-[#f97316] hover:bg-[#ea6c0b] text-white text-sm font-semibold px-4 py-2 rounded-full transition-colors">
            Dealer login
          </a>

          {/* Mobile hamburger */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden w-10 h-10 flex flex-col items-center justify-center gap-1.5 rounded-xl hover:bg-white/5 transition-colors"
            aria-label="Menu"
          >
            <span className={`block w-5 h-0.5 bg-white transition-all ${open ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`block w-5 h-0.5 bg-white transition-all ${open ? "opacity-0" : ""}`} />
            <span className={`block w-5 h-0.5 bg-white transition-all ${open ? "-rotate-45 -translate-y-2" : ""}`} />
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {open && (
        <div className="md:hidden border-t border-white/10 bg-[#0f0f0f] px-4 py-4 space-y-1">
          {links.map(({ href, label }) => (
            <a key={href} href={href}
              onClick={() => setOpen(false)}
              className="block px-4 py-3 text-sm text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-all">
              {label}
            </a>
          ))}
          <a href="/login"
            onClick={() => setOpen(false)}
            className="block px-4 py-3 text-sm text-[#f97316] font-semibold hover:bg-[#f97316]/10 rounded-xl transition-all mt-2 border border-[#f97316]/30">
            Dealer login →
          </a>
        </div>
      )}
    </nav>
  );
}
