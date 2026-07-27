import { ShieldCheck, BadgeCheck, Eye, BarChart3, Users, PhoneCall, FileSearch, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { buildPageTitle, buildCanonicalMetadata } from "@/lib/seo-metadata";

export const metadata = {
  title: buildPageTitle("How BIDGARI verifies listings"),
  description:
    "Learn how BIDGARI verifies dealers, checks listings, and keeps Kenya's car marketplace transparent and trustworthy.",
  ...buildCanonicalMetadata("/trust"),
};

const VERIFICATION_STEPS = [
  {
    icon: FileSearch,
    title: "Dealer registration",
    desc: "Every dealership submits business details, NTSA registration, and showroom location. We verify identity before anything goes live.",
  },
  {
    icon: Eye,
    title: "Listing review",
    desc: "Each car listing is checked for accurate specs, real photos, correct pricing, and complete details. Incomplete listings get sent back.",
  },
  {
    icon: BadgeCheck,
    title: "Verification badge",
    desc: "Dealers who pass verification earn a trust badge on all their listings. Buyers see it instantly — it means a real business stands behind the car.",
  },
  {
    icon: BarChart3,
    title: "Ongoing monitoring",
    desc: "We track listing quality, response times, and buyer feedback. Dealers who drop standards lose their verified status.",
  },
];

const TRUST_SIGNALS = [
  {
    icon: ShieldCheck,
    title: "Verified dealers",
    desc: "Every dealership is verified before listing. Business registration, physical showroom, and track record confirmed.",
  },
  {
    icon: BarChart3,
    title: "Transparent pricing",
    desc: "See market ranges, duty estimates, and total ownership costs. No hidden fees, no bait-and-switch.",
  },
  {
    icon: Users,
    title: "Community reviews",
    desc: "Real buyers leave real feedback on dealers. Read experiences before you reach out.",
  },
  {
    icon: PhoneCall,
    title: "Direct contact",
    desc: "Call or WhatsApp the dealer from the listing. You deal with the actual seller — no intermediary.",
  },
];

const FAQS = [
  {
    q: "Can any dealer list on BIDGARI?",
    a: "Any registered Kenyan car dealership can apply. We verify business registration, showroom location, and track record before approval. Private sellers can also list through our dealer partnership program.",
  },
  {
    q: "What if a listing is inaccurate?",
    a: "Report it. We investigate every report. Dealers with repeated inaccuracies lose their verified badge and may be removed from the platform.",
  },
  {
    q: "Does BIDGARI inspect the cars?",
    a: "BIDGARI is a marketplace, not an inspection service. We verify dealers and review listings for accuracy. For physical inspections, we recommend using a trusted mechanic before purchase.",
  },
  {
    q: "How do I know the price is fair?",
    a: "Each listing shows a market price range based on real transaction data for that make, model, year, and condition. You can also use our duty calculator and compare tool to make informed decisions.",
  },
];

export default function TrustPage() {
  return (
    <div className="min-h-screen bg-[#080808] pt-20 pb-24">
      <div className="home-shell">
        {/* Hero */}
        <section className="text-center mb-16 sm:mb-20">
          <p className="meta-label text-[var(--accent)] mb-4">Trust & transparency</p>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight mb-6 max-w-3xl mx-auto leading-[1.1]">
            How we keep BIDGARI{" "}
            <span className="text-[var(--accent)]">trustworthy</span>
          </h1>
          <p className="text-base sm:text-lg text-zinc-400 leading-relaxed max-w-2xl mx-auto font-medium">
            A car marketplace is only as good as the people on it. Here&apos;s how we verify dealers, review listings, and protect buyers.
          </p>
        </section>

        {/* Trust badges strip */}
        <section className="mb-16 sm:mb-20 py-8 border-y border-white/[0.06]">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {TRUST_SIGNALS.map((signal, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center mb-3">
                  <signal.icon className="w-5 h-5 text-[var(--accent)]" strokeWidth={1.5} />
                </div>
                <h3 className="text-xs font-bold text-white mb-1">{signal.title}</h3>
                <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">{signal.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Verification process */}
        <section className="mb-16 sm:mb-20">
          <div className="text-center mb-10 sm:mb-14">
            <p className="meta-label text-[var(--accent)] mb-3">Our process</p>
            <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
              How we verify dealers
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {VERIFICATION_STEPS.map((step, i) => (
              <div key={i} className="relative">
                {i < VERIFICATION_STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[60%] w-[calc(100%-20%)] h-px bg-gradient-to-r from-white/[0.08] to-transparent" aria-hidden />
                )}
                <div className="relative mx-auto w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-5">
                  <step.icon className="w-7 h-7 text-[var(--accent)]" strokeWidth={1.5} />
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[var(--accent)] text-black text-[10px] font-black flex items-center justify-center">
                    {i + 1}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mb-2 text-center">{step.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed text-center font-medium">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* What buyers see */}
        <section className="mb-16 sm:mb-20 rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-10">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-6">What you see on every listing</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              "Verified dealer badge — a real business stands behind this car",
              "Market price range — know if the asking price is fair",
              "Total cost estimate — duty, insurance, and running costs",
              "Real photos — no stock images, no filters",
              "Direct contact — call or WhatsApp the dealer instantly",
              "Dealer reviews — read what other buyers experienced",
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" strokeWidth={2} />
                <span className="text-sm text-zinc-300 font-medium">{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-16 sm:mb-20">
          <div className="text-center mb-10">
            <h2 className="text-xl sm:text-2xl font-bold text-white">Frequently asked questions</h2>
          </div>
          <div className="max-w-2xl mx-auto space-y-0 divide-y divide-white/[0.06] border-t border-white/[0.06]">
            {FAQS.map((faq, i) => (
              <div key={i} className="py-5">
                <h3 className="text-sm font-bold text-white mb-2">{faq.q}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed font-medium">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-8 sm:p-12">
            <h2 className="text-xl sm:text-3xl font-bold text-white mb-4">
              Ready to buy or sell with confidence?
            </h2>
            <p className="text-sm text-zinc-400 mb-8 max-w-lg mx-auto font-medium">
              Browse verified inventory from trusted Kenyan dealers, or list your car for free.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/cars"
                className="inline-flex items-center justify-center h-12 px-8 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-black text-xs font-bold uppercase tracking-widest transition-all hover:scale-[0.98] rounded-xl"
              >
                Browse inventory
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
              <Link
                href="/dealers/signup"
                className="inline-flex items-center justify-center h-12 px-8 border border-white/[0.08] bg-white/[0.03] text-white text-xs font-bold uppercase tracking-widest transition-all hover:bg-white/[0.06] rounded-xl"
              >
                List as a dealer
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
