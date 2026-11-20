import Link from "next/link";
import {
  ShoppingCart, ArrowRightLeft, TrendingUp, HelpCircle,
  ShieldCheck, Sparkles, BadgeCheck, Car,
} from "lucide-react";

const CTAS = [
  {
    title: "First time buying?",
    subtitle: "We guide you through every step",
    href: "/how-to-buy",
    icon: ShoppingCart,
    iconBg: "bg-accent-wash text-accent",
  },
  {
    title: "Selling your car?",
    subtitle: "List it with BIDGARI, we handle the rest",
    href: "/sell",
    icon: BadgeCheck,
    iconBg: "bg-emerald-100 text-emerald-600",
  },
  {
    title: "Thinking of upgrading?",
    subtitle: "Compare your car vs what's next",
    href: "/compare",
    icon: ArrowRightLeft,
    iconBg: "bg-violet-100 text-violet-600",
  },
  {
    title: "Not sure what to buy?",
    subtitle: "Tell us your budget, we'll find options",
    href: "/cars?sort=price_asc",
    icon: HelpCircle,
    iconBg: "bg-amber-100 text-amber-600",
  },
  {
    title: "Show me something special",
    subtitle: "Curated luxury collection",
    href: "/luxury",
    icon: Sparkles,
    iconBg: "bg-rose-100 text-rose-600",
  },
  {
    title: "Looking for a deal?",
    subtitle: "Inspected stock, honest prices, sold by BIDGARI",
    href: "/cars?sort=price_asc",
    icon: TrendingUp,
    iconBg: "bg-orange-100 text-orange-600",
  },
  {
    title: "Is this car legit?",
    subtitle: "Every listing is inspected and verified",
    href: "/trust",
    icon: ShieldCheck,
    iconBg: "bg-teal-100 text-teal-600",
  },
  {
    title: "Browse all cars",
    subtitle: "300+ verified vehicles in stock",
    href: "/cars",
    icon: Car,
    iconBg: "bg-slate-100 text-slate-600",
  },
];

export default function HomepageCtaStrip() {
  return (
    <section aria-label="Quick actions" className="py-6 sm:py-8">
      <div className="home-shell">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap sm:justify-center">
          {CTAS.map((cta) => {
            const Icon = cta.icon;
            return (
              <Link
                key={cta.href + cta.title}
                href={cta.href}
                className="group flex shrink-0 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 transition-all hover:border-slate-300 hover:shadow-md sm:flex-1 sm:min-w-[200px] sm:max-w-[260px]"
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${cta.iconBg}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-slate-900 group-hover:text-[var(--accent)] transition-colors">
                    {cta.title}
                  </span>
                  <span className="block text-[11px] text-slate-500 leading-tight mt-0.5">
                    {cta.subtitle}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
