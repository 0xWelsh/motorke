import { ArrowRight } from "lucide-react";
import TrackedLink from "@/components/TrackedLink";

export default function HomepageDutyTeaser() {
  return (
    <section
      aria-labelledby="homepage-duty-heading"
      className="border-b border-white/[0.06] bg-[#080808] py-10 sm:py-14"
    >
      <div className="home-shell">
        <div className="flex flex-col gap-6 border border-white/[0.06] bg-[#0f0f0f] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8 rounded-xl">
          <div className="max-w-xl">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--accent)] mb-2">
              Import duty
            </p>
            <h2
              id="homepage-duty-heading"
              className="text-2xl sm:text-3xl font-normal editorial-heading text-white"
            >
              Estimate tax before you commit
            </h2>
            <p className="mt-2 text-sm sm:text-base font-medium text-zinc-400 leading-relaxed">
              CRSP-based calculator for Japanese imports. See duty, excise, and VAT, then compare with live dealer
              stock on the same site.
            </p>
          </div>
          <TrackedLink
            href="/duty"
            eventName="homepage_duty_click"
            eventPayload={{ area: "duty_teaser" }}
            className="inline-flex h-12 shrink-0 items-center justify-center gap-2 border border-[var(--accent)] bg-[var(--accent)] px-6 text-xs font-bold uppercase tracking-widest text-black transition-all hover:bg-[var(--accent-hover)] hover:border-[var(--accent-hover)] rounded-xl"
          >
            Open calculator
            <ArrowRight className="h-4 w-4" aria-hidden />
          </TrackedLink>
        </div>
      </div>
    </section>
  );
}
