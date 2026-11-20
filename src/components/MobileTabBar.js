"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Calculator, Heart, PlusCircle } from "lucide-react";

// Mobile-only bottom tab bar. Every tab points at a route that exists and
// works unauthenticated (Saved/Sell bounce to login, which is expected UX).
const TABS = [
  {
    href: "/",
    label: "Home",
    icon: Home,
    active: (p) => p === "/",
  },
  {
    href: "/cars",
    label: "Cars",
    icon: Search,
    active: (p) => p.startsWith("/cars") || p.startsWith("/search"),
  },
  {
    href: "/duty",
    label: "Duty",
    icon: Calculator,
    active: (p) => p.startsWith("/duty"),
  },
  {
    href: "/account?tab=saved",
    label: "Saved",
    icon: Heart,
    active: (p) => p.startsWith("/account"),
  },
  {
    href: "/newad",
    label: "Sell",
    icon: PlusCircle,
    active: (p) => p.startsWith("/newad") || p.startsWith("/dashboard"),
  },
];

export default function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {TABS.map((tab) => {
          const isActive = tab.active(pathname);
          const Icon = tab.icon;
          return (
            <li key={tab.label}>
              <Link
                href={tab.href}
                aria-current={isActive ? "page" : undefined}
                className={`relative flex flex-col items-center gap-0.5 py-2 text-[10px] font-bold tracking-wide transition-colors ${
                  isActive ? "text-[var(--accent)]" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <span className="relative">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
