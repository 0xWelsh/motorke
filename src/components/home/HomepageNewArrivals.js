import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import TrackedLink from "@/components/TrackedLink";
import ScrollableCarGrid from "@/components/home/ScrollableCarGrid";

function pickSectionBackdrop(cars) {
  for (const car of cars || []) {
    const url = car?.images?.[0]?.url;
    if (typeof url === "string" && url) return url;
  }
  return null;
}

export default function HomepageNewArrivals({ cars = [] }) {
  if (!cars.length) return null;

  const backdrop = pickSectionBackdrop(cars);
  const items = cars.slice(0, 8);

  return (
    <section className="relative py-8 sm:py-12 lg:py-16 border-b border-white/[0.06] overflow-hidden">
      {backdrop && (
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <Image
            src={backdrop}
            fill
            sizes="100vw"
            alt=""
            className="object-cover opacity-[0.10]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#222222]/96 via-[#222222]/94 to-[#141414]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(34,197,94,0.12),transparent_55%)]" />
        </div>
      )}
      {!backdrop && (
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-emerald-950/15 to-[#141414]" />
      )}
      <div className="home-shell">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-5 sm:mb-7 gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--accent)] mb-2">
              This week
            </p>
            <h2 className="text-[clamp(1.75rem,4.5vw,2.75rem)] leading-[1] tracking-[-0.02em] editorial-heading font-semibold text-white">
              New arrivals
            </h2>
          </div>
          <TrackedLink
            href="/cars?sort=newest"
            eventName="homepage_fresh_arrivals_click"
            eventPayload={{ area: "fresh_arrivals" }}
            className="inline-flex h-11 items-center shrink-0 text-white text-xs font-bold uppercase tracking-widest gap-2 hover:text-[var(--accent)] transition-colors"
          >
            See all arrivals <ArrowUpRight className="w-4 h-4" />
          </TrackedLink>
        </div>

        <ScrollableCarGrid cars={items} />
      </div>
    </section>
  );
}
