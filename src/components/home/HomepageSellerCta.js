import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { getSupportWhatsAppHref } from "@/lib/site-contact";

const PERKS = [
  "Free listing — zero commission",
  "Fair market valuation by our team",
  "Kenya-wide buyer reach",
  "We handle the paperwork for you",
];

export default function HomepageSellerCta() {
  const whatsappHref = getSupportWhatsAppHref("Hi BIDGARI team, I'd like to sell my car.");
  return (
    <section className="py-10 sm:py-14 bg-[var(--bg)] border-y border-slate-200">
      <div className="home-shell">
        <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-10 lg:p-12 relative overflow-hidden shadow-sm">
          {/* Accent glow */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-accent-wash rounded-full blur-3xl" aria-hidden />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div>
              <p className="meta-label text-[var(--accent)] mb-3">For sellers</p>
              <h2 className="text-2xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-4 leading-tight">
                Sell your car.<br />
                <span className="text-slate-400">We handle the rest.</span>
              </h2>
              <p className="text-sm sm:text-base text-slate-500 leading-relaxed mb-6 font-medium max-w-lg">
                Sell through BIDGARI. We verify, value, and list your car for free — and handle the sale to serious buyers across Kenya.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                {PERKS.map((perk, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[var(--accent)] shrink-0" strokeWidth={2} />
                    <span className="text-xs sm:text-sm text-slate-600 font-medium">{perk}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href={whatsappHref || "/contact"}
                  className="btn-accent"
                >
                  Sell your car
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/sell"
                  className="btn-outline"
                >
                  How selling works
                </Link>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: "Free", label: "List without commission" },
                { value: "48h", label: "Valued & live" },
                { value: "47", label: "Counties covered" },
                { value: "100%", label: "Handled end to end" },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-center hover:bg-white hover:border-slate-300 transition-all"
                >
                  <div className="text-2xl sm:text-3xl font-black text-[var(--accent)] mb-1">{stat.value}</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
