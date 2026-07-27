import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const PERKS = [
  "Free listing — zero commission",
  "Verified badge builds buyer trust",
  "Direct phone & WhatsApp contact",
  "No middleman — you negotiate",
];

export default function HomepageSellerCta() {
  return (
    <section className="py-14 sm:py-20 bg-[#222222]">
      <div className="home-shell">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-10 lg:p-14 relative overflow-hidden">
          {/* Accent glow */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-[var(--accent)]/5 rounded-full blur-3xl" aria-hidden />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div>
              <p className="meta-label text-[var(--accent)] mb-3">For dealers</p>
              <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight mb-4 leading-tight">
                List your inventory.<br />
                <span className="text-zinc-500">Get direct buyer enquiries.</span>
              </h2>
              <p className="text-sm sm:text-base text-zinc-400 leading-relaxed mb-6 font-medium max-w-lg">
                Join verified Kenyan dealers already selling on BIDGARI. Free to list, no commission, and buyers contact you directly.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                {PERKS.map((perk, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[var(--accent)] shrink-0" strokeWidth={2} />
                    <span className="text-xs sm:text-sm text-zinc-300 font-medium">{perk}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/dealers/signup"
                  className="inline-flex items-center justify-center h-12 px-8 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-black text-xs font-bold uppercase tracking-widest transition-all hover:scale-[0.98] active:scale-95 rounded-xl"
                >
                  Start listing free
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
                <Link
                  href="/dealers"
                  className="inline-flex items-center justify-center h-12 px-8 border border-white/[0.08] bg-white/[0.03] text-white text-xs font-bold uppercase tracking-widest transition-all hover:bg-white/[0.06] hover:border-white/[0.15] rounded-xl"
                >
                  Browse dealers
                </Link>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: "500+", label: "Verified dealers" },
                { value: "1,200+", label: "Active listings" },
                { value: "Free", label: "No commission" },
                { value: "24h", label: "Go live fast" },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 text-center hover:bg-white/[0.04] hover:border-white/[0.08] transition-all"
                >
                  <div className="text-2xl sm:text-3xl font-black text-[var(--accent)] mb-1">{stat.value}</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
