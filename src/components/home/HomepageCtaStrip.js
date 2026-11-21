import Link from "next/link";
import {
  ShoppingCart, ArrowRightLeft, TrendingUp, HelpCircle,
  ShieldCheck, Sparkles, BadgeCheck, Car,
} from "lucide-react";

const CTAS = [
  { title: "First time buying?", subtitle: "We guide you through every step", href: "/how-to-buy", icon: ShoppingCart },
  { title: "Selling your car?", subtitle: "List it with BIDGARI, we handle the rest", href: "/sell", icon: BadgeCheck },
  { title: "Thinking of upgrading?", subtitle: "Compare your car vs what's next", href: "/compare", icon: ArrowRightLeft },
  { title: "Not sure what to buy?", subtitle: "Tell us your budget, we'll find options", href: "/cars?sort=price_asc", icon: HelpCircle },
  { title: "Show me something special", subtitle: "Curated luxury collection", href: "/luxury", icon: Sparkles },
  { title: "Looking for a deal?", subtitle: "Inspected stock, honest prices", href: "/cars?sort=price_asc", icon: TrendingUp },
  { title: "Is this car legit?", subtitle: "Every listing is inspected and verified", href: "/trust", icon: ShieldCheck },
  { title: "Browse all cars", subtitle: "Verified vehicles in stock", href: "/cars", icon: Car },
];

/**
 * Quick actions — plain editorial links, no cards. Cars & Bids keeps its
 * secondary navigation as quiet text rows; the boxes belong on listings,
 * not on section furniture.
 */
export default function HomepageCtaStrip() {
  return (
    <section aria-label="Quick actions" className="py-8 sm:py-10">
      <div className="home-shell grid gap-x-10 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
        {CTAS.map((cta) => {
          const Icon = cta.icon;
          return (
            <Link key={cta.href + cta.title} href={cta.href} className="group flex items-start gap-3">
              <Icon
                className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)] transition-transform group-hover:translate-x-0.5"
                strokeWidth={2}
                aria-hidden
              />
              <span className="min-w-0">
                <span className="block text-[13px] font-bold leading-snug text-text transition-colors group-hover:text-[var(--accent)]">
                  {cta.title}
                </span>
                <span className="mt-0.5 block text-[12px] leading-snug text-muted">{cta.subtitle}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
