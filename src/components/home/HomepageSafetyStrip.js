import { ShieldAlert, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function HomepageSafetyStrip() {
  return (
    <section className="py-8 sm:py-10 bg-slate-900">
      <div className="home-shell">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
          <div className="flex items-center gap-3">
            <div className="shrink-0 w-11 h-11 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-rose-400" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Don't get scammed buying a car</h3>
              <p className="text-xs text-dim font-medium leading-relaxed">
                Never pay a deposit to a private number. We only take money at handover, through BIDGARI.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 md:ml-auto">
            <Link
              href="/safety"
              className="inline-flex items-center gap-2 text-xs font-bold text-white hover:text-rose-300 transition-colors"
            >
              Safety guide <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/report"
              className="btn btn-primary btn-sm"
            >
              Report a scam
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
