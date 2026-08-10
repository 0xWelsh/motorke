import { ArrowRight } from "lucide-react";
import TrackedLink from "@/components/TrackedLink";

export default function HomepageDutyTeaser() {
  return (
    <section
      aria-labelledby="homepage-duty-heading"
      className="border-b border-slate-200 bg-[var(--bg)] py-8 sm:py-12"
    >
      <div className="home-shell">
        <div className="flex flex-col gap-6 border border-slate-200 bg-white p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8 rounded-xl shadow-sm">
          <div className="max-w-xl">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--accent)] mb-2">
              Import duty
            </p>
            <h2
              id="homepage-duty-heading"
              className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight"
            >
              Estimate tax before you commit
            </h2>
            <p className="mt-2 text-sm sm:text-base font-medium text-slate-500 leading-relaxed">
              CRSP-based calculator for Japanese imports. See duty, excise, and VAT, then compare with live dealer
              stock on the same site.
            </p>
          </div>
          <TrackedLink
            href="/duty"
            eventName="homepage_duty_click"
            eventPayload={{ area: "duty_teaser" }}
            className="btn-accent shrink-0"
          >
            Open calculator
            <ArrowRight className="h-4 w-4" aria-hidden />
          </TrackedLink>
        </div>
      </div>
    </section>
  );
}
