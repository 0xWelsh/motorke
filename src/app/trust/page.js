// Served from the Vercel edge; re-rendered at most every 3600s.
// No searchParams or cookies on this route, so the output is cacheable.
export const revalidate = 3600;

import { ShieldCheck, BadgeCheck, Eye, BarChart3, Users, PhoneCall, FileSearch, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { buildPageTitle, buildCanonicalMetadata } from "@/lib/seo-metadata";

export const metadata = {
  title: buildPageTitle("How BIDGARI verifies listings"),
  description:
    "Learn how BIDGARI verifies listings, checks every car, and handles every sale — keeping Kenya's car marketplace transparent and trustworthy.",
  ...buildCanonicalMetadata("/trust"),
};

const VERIFICATION_STEPS = [
  {
    icon: FileSearch,
    title: "Vehicle sourcing",
    desc: "Every car is sourced from vetted owners and yards. We confirm ownership and documentation before a listing goes live.",
  },
  {
    icon: Eye,
    title: "Listing review",
    desc: "Each car listing is checked for accurate specs, real photos, correct pricing, and complete details. Incomplete listings get sent back.",
  },
  {
    icon: BadgeCheck,
    title: "Sale guarantee",
    desc: "Every sale is handled by BIDGARI. Our team handles the paperwork, so both the seller and the buyer are protected end to end.",
  },
  {
    icon: BarChart3,
    title: "Ongoing monitoring",
    desc: "We track listing quality and buyer feedback. Vehicles that don't meet our standards are removed.",
  },
];

const TRUST_SIGNALS = [
  {
    icon: ShieldCheck,
    title: "Verified vehicles",
    desc: "Every listing is checked for accurate specs, real photos, and clear ownership before it goes live.",
  },
  {
    icon: BarChart3,
    title: "Transparent pricing",
    desc: "See market ranges, duty estimates, and total ownership costs. No hidden fees, no bait-and-switch.",
  },
  {
    icon: Users,
    title: "Community reviews",
    desc: "Real buyers leave real feedback on every listing. Read their experiences before you reach out.",
  },
  {
    icon: PhoneCall,
    title: "One trusted team",
    desc: "Call or WhatsApp the BIDGARI team from any listing. One team handles your deal from start to finish.",
  },
];

const FAQS = [
  {
    q: "Who sells the cars on BIDGARI?",
    a: "All cars are sold under the BIDGARI brand. We source from vetted owners and yards, verify each vehicle, and handle the sale for you — from first enquiry to final paperwork.",
  },
  {
    q: "What if a listing is inaccurate?",
    a: "Report it. We investigate every report. Listings with inaccuracies are removed while we check, and repeat offenders lose access to the platform.",
  },
  {
    q: "Does BIDGARI inspect the cars?",
    a: "BIDGARI verifies every listing and reviews specs, photos, and ownership records before a car goes live. For the final condition check, we arrange viewing and recommend using a trusted mechanic before purchase.",
  },
  {
    q: "How do I know the price is fair?",
    a: "Each listing shows a market price range based on real transaction data for that make, model, year, and condition. You can also use our duty calculator and compare tool to make informed decisions.",
  },
];

export default function TrustPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] pt-20 pb-24">
      <div className="home-shell">
        {/* Hero */}
        <section className="text-center mb-16 sm:mb-20">
          <p className="meta-label text-[var(--accent)] mb-4">Trust & transparency</p>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight mb-6 max-w-3xl mx-auto leading-[1.1]">
            How we keep BIDGARI{" "}
            <span className="text-[var(--accent)]">trustworthy</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-500 leading-relaxed max-w-2xl mx-auto font-medium">
            A car marketplace is only as good as the cars on it. Here&apos;s how we verify listings, handle every sale, and protect buyers.
          </p>
        </section>

        {/* Trust badges strip */}
        <section className="mb-16 sm:mb-20 py-8 border-y border-slate-200">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {TRUST_SIGNALS.map((signal, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center mb-3">
                  <signal.icon className="w-5 h-5 text-[var(--accent)]" strokeWidth={1.5} />
                </div>
                <h3 className="text-xs font-bold text-slate-900 mb-1">{signal.title}</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed font-medium">{signal.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Verification process */}
        <section className="mb-16 sm:mb-20">
          <div className="text-center mb-10 sm:mb-14">
            <p className="meta-label text-[var(--accent)] mb-3">Our process</p>
            <h2 className="text-2xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              How we verify listings
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {VERIFICATION_STEPS.map((step, i) => (
              <div key={i} className="relative">
                {i < VERIFICATION_STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[60%] w-[calc(100%-20%)] h-px bg-gradient-to-r from-slate-200 to-transparent" aria-hidden />
                )}
                <div className="relative mx-auto w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-5">
                  <step.icon className="w-7 h-7 text-[var(--accent)]" strokeWidth={1.5} />
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[var(--accent)] text-black text-[10px] font-black flex items-center justify-center">
                    {i + 1}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2 text-center">{step.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed text-center font-medium">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* What buyers see */}
        <section className="mb-16 sm:mb-20 rounded-xl border border-slate-200 bg-white p-6 sm:p-10">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6">What you see on every listing</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              "BIDGARI Verified — every listing checked before it goes live",
              "Market price range — know if the asking price is fair",
              "Total cost estimate — duty, insurance, and running costs",
              "Real photos — no stock images, no filters",
              "One trusted team — WhatsApp or call from any listing",
              "Community reviews — read what other buyers experienced",
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" strokeWidth={2} />
                <span className="text-sm text-slate-500 font-medium">{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-16 sm:mb-20">
          <div className="text-center mb-10">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Frequently asked questions</h2>
          </div>
          <div className="max-w-2xl mx-auto space-y-0 divide-y divide-slate-100 border-t border-slate-200">
            {FAQS.map((faq, i) => (
              <div key={i} className="py-5">
                <h3 className="text-sm font-bold text-slate-900 mb-2">{faq.q}</h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <div className="rounded-xl border border-slate-200 bg-white p-8 sm:p-12">
            <h2 className="text-xl sm:text-3xl font-bold text-slate-900 mb-4">
              Ready to buy or sell with confidence?
            </h2>
            <p className="text-sm text-slate-500 mb-8 max-w-lg mx-auto font-medium">
              Browse verified inventory, or sell your car with the BIDGARI team handling the paperwork.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/cars" className="btn btn-primary btn-lg">
                Browse inventory
                <ArrowRight />
              </Link>
              <Link href="/sell" className="btn btn-neutral btn-lg">
                Sell your car
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
