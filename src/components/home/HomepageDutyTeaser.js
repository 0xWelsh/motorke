import { ArrowRight } from "lucide-react";
import TrackedLink from "@/components/TrackedLink";

export default function HomepageDutyTeaser() {
  return (
    <section
      aria-labelledby="homepage-duty-heading"
      className="border-b border-slate-100 bg-slate-50/80 py-10 sm:py-14 dark:border-zinc-900 dark:bg-zinc-950/40"
    >
      <div className="home-shell">
        <div
          className="flex flex-col gap-6 border border-slate-200 bg-white p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8 dark:border-zinc-800 dark:bg-[#111111]"
          style={{ borderRadius: "var(--radius)" }}
        >
          <div className="max-w-xl">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#2F855A] dark:text-emerald-400 mb-2">
              Import duty
            </p>
            <h2
              id="homepage-duty-heading"
              className="text-2xl sm:text-3xl font-normal editorial-heading text-[#111827] dark:text-white"
            >
              Estimate tax before you commit
            </h2>
            <p className="mt-2 text-sm sm:text-base font-medium text-slate-600 dark:text-zinc-400 leading-relaxed">
              CRSP-based calculator for Japanese imports. See duty, excise, and VAT, then compare with live dealer
              stock on the same site.
            </p>
          </div>
          <TrackedLink
            href="/duty"
            eventName="homepage_duty_click"
            eventPayload={{ area: "duty_teaser" }}
            className="inline-flex h-12 shrink-0 items-center justify-center gap-2 border border-transparent bg-[#111827] px-6 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-[#2F855A] dark:border-[#2F855A] dark:bg-[#2F855A] dark:text-white dark:hover:bg-[#276749] dark:hover:border-[#276749]"
            style={{ borderRadius: "var(--radius)" }}
          >
            Open calculator
            <ArrowRight className="h-4 w-4" aria-hidden />
          </TrackedLink>
        </div>
      </div>
    </section>
  );
}
