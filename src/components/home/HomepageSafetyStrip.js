import Link from "next/link";
import { ShieldCheck, HandCoins, BadgeCheck, Flag, ArrowRight } from "lucide-react";

/**
 * Safety band — the trust pitch the whole marketplace leans on, given as
 * three concrete promises instead of a thin warning strip.
 */
const POINTS = [
  {
    icon: BadgeCheck,
    title: "Every listing is inspected",
    body: "Real photos, verified ownership, and a physical check before a car goes live.",
  },
  {
    icon: HandCoins,
    title: "You pay at handover",
    body: "Never send a deposit to a private number. BIDGARI money moves only when keys move.",
  },
  {
    icon: ShieldCheck,
    title: "One team, start to finish",
    body: "The same BIDGARI desk handles your enquiry, viewing, and paperwork — no ghost brokers.",
  },
];

export default function HomepageSafetyStrip() {
  return (
    <section className="py-10 sm:py-14 bg-surface-overlay">
      <div className="home-shell">
        <div className="overflow-hidden rounded-2xl border border-border bg-surface">
          <div className="flex flex-col gap-6 p-6 sm:p-8 md:flex-row md:items-start md:gap-10 lg:p-10">
            <div className="md:w-64 md:shrink-0">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent-dim">
                <ShieldCheck className="h-6 w-6 text-[var(--accent)]" strokeWidth={1.8} aria-hidden />
              </div>
              <h2 className="mt-4 text-xl sm:text-2xl font-black tracking-tight text-text">
                Don&rsquo;t get scammed.
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Car fraud in Kenya runs on deposits and ghost brokers. BIDGARI is built so
                neither can touch you.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Link href="/safety" className="btn btn-primary btn-sm">
                  Safety guide <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
                <Link
                  href="/report"
                  className="inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-muted transition-colors hover:text-[var(--accent-red)]"
                >
                  <Flag className="h-3.5 w-3.5" aria-hidden /> Report a scam
                </Link>
              </div>
            </div>

            <div className="grid flex-1 gap-4 sm:grid-cols-3">
              {POINTS.map((p) => (
                <div
                  key={p.title}
                  className="rounded-xl border border-border bg-surface-hover p-4"
                >
                  <p.icon className="h-5 w-5 text-[var(--accent)]" strokeWidth={1.8} aria-hidden />
                  <h3 className="mt-3 text-[13px] font-bold leading-snug text-text">{p.title}</h3>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">{p.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
