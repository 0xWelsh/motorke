// Served from the Vercel edge; re-rendered at most every 3600s.
// No searchParams or cookies on this route, so the output is cacheable.
export const revalidate = 3600;

import Link from "next/link";
import { ArrowRight, CheckCircle2, Car, BadgeCheck, PhoneCall, BarChart3, Clock, Users } from "lucide-react";
import { buildPageTitle, buildCanonicalMetadata } from "@/lib/seo-metadata";
import { getSupportWhatsAppHref } from "@/lib/site-contact";

export const metadata = {
  title: buildPageTitle("Sell your car in Kenya"),
  description:
    "Sell your car with BIDGARI — free listing, fair market valuation, and a sale handled end to end. Our team verifies, lists, and handles the paperwork for you.",
  ...buildCanonicalMetadata("/sell"),
};

const STEPS = [
  {
    num: "1",
    title: "Tell us about your car",
    desc: "Send photos and details online. Our team reviews your car and confirms ownership.",
  },
  {
    num: "2",
    title: "Get a fair valuation",
    desc: "We price your car against real market data so you sell fast, at the right price.",
  },
  {
    num: "3",
    title: "We list it for you",
    desc: "Your car goes live with verified specs, real photos, and Kenya-wide buyer reach.",
  },
  {
    num: "4",
    title: "We handle the sale",
    desc: "Our team handles enquiries, viewings, and paperwork. You get paid when it sells.",
  },
];

const PERKS = [
  {
    icon: Car,
    title: "Free listing",
    desc: "Listing your car costs nothing. No commission on the sale either.",
  },
  {
    icon: BadgeCheck,
    title: "Verified listing",
    desc: "Our team verifies specs, photos, and ownership so buyers trust your car instantly.",
  },
  {
    icon: PhoneCall,
    title: "We take the calls",
    desc: "Buyers contact the BIDGARI team, not you. We qualify enquiries so you don't waste time.",
  },
  {
    icon: BarChart3,
    title: "Fair market value",
    desc: "Pricing backed by real transaction data for your make, model, year, and condition.",
  },
  {
    icon: Clock,
    title: "Live in 48 hours",
    desc: "Most cars are valued and listed within two working days of submission.",
  },
  {
    icon: Users,
    title: "Kenya-wide reach",
    desc: "Your car is seen by buyers across Nairobi, Mombasa, Kisumu, and all 47 counties.",
  },
];

const FAQS = [
  {
    q: "Is listing really free?",
    a: "Yes. Listing and selling through BIDGARI costs you nothing — no listing fees, no commission on the sale.",
  },
  {
    q: "How is my car valued?",
    a: "We price against real transaction data for your make, model, year, mileage, and condition, then agree the asking price with you before your car goes live.",
  },
  {
    q: "Do I have to handle buyer calls?",
    a: "No. The BIDGARI team answers enquiries, arranges viewings, and negotiates on your behalf. You approve the buyer before anything moves.",
  },
  {
    q: "When do I get paid?",
    a: "Once the buyer completes the sale and the paperwork is signed, payment is released to you. We handle the process end to end.",
  },
];

export default function SellPage() {
  const whatsappHref = getSupportWhatsAppHref("Hi BIDGARI team, I'd like to sell my car.");
  const sellHref = whatsappHref || "/contact";

  return (
    <div className="min-h-screen bg-[var(--bg)] pt-20 pb-24">
      <div className="home-shell">
        {/* Hero */}
        <section className="text-center mb-16 sm:mb-20">
          <p className="meta-label text-[var(--accent)] mb-4">For sellers</p>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-text tracking-tight mb-6 max-w-3xl mx-auto leading-[1.1]">
            Sell your car.{" "}
            <span className="text-[var(--accent)]">We handle the rest.</span>
          </h1>
          <p className="text-base sm:text-lg text-muted leading-relaxed max-w-2xl mx-auto font-medium mb-8">
            Free to list, fairly valued, and handled by the BIDGARI team. Tell us about your car and we&apos;ll do the rest.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href={sellHref} className="btn btn-primary btn-lg">
              Sell your car
              <ArrowRight />
            </Link>
            <Link href="/cars" className="btn btn-neutral btn-lg">
              Browse inventory
            </Link>
          </div>

          {/* Self-service path for verified accounts */}
          <div className="mt-8 inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-2xl border border-border bg-surface px-5 py-3">
            <span className="text-sm text-muted font-medium">In a hurry? List it yourself —</span>
            <Link href="/sell/new" className="text-sm font-black text-[var(--accent)] hover:underline">
              self-service listing
            </Link>
            <span className="text-xs text-dim">(for verified accounts; a human reviews it before it goes live)</span>
          </div>
        </section>

        {/* Steps */}
        <section className="mb-16 sm:mb-20">
          <div className="text-center mb-10 sm:mb-14">
            <p className="meta-label text-[var(--accent)] mb-3">Getting started</p>
            <h2 className="text-2xl sm:text-4xl font-bold text-text tracking-tight">
              4 steps to selling your car
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {STEPS.map((step, i) => (
              <div key={i} className="relative">
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[60%] w-[calc(100%-20%)] h-px bg-gradient-to-r 5080-surface-overlay to-transparent" aria-hidden />
                )}
                <div className="relative mx-auto w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center mb-5">
                  <span className="text-xl font-black text-[var(--accent)]">{step.num}</span>
                </div>
                <h3 className="text-base font-bold text-text mb-2 text-center">{step.title}</h3>
                <p className="text-sm text-muted leading-relaxed text-center font-medium">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Perks */}
        <section className="mb-16 sm:mb-20">
          <div className="text-center mb-10 sm:mb-14">
            <p className="meta-label text-[var(--accent)] mb-3">Why BIDGARI</p>
            <h2 className="text-2xl sm:text-4xl font-bold text-text tracking-tight">
              Everything you get for free
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {PERKS.map((perk, i) => (
              <div
                key={i}
                className="rounded-xl border border-border bg-surface p-6 hover:bg-surface-hover hover:border-border transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-xl bg-accent-wash border border-accent-dim flex items-center justify-center mb-4">
                  <perk.icon className="w-5 h-5 text-[var(--accent)]" strokeWidth={1.5} />
                </div>
                <h3 className="text-base font-bold text-text mb-2">{perk.title}</h3>
                <p className="text-sm text-muted leading-relaxed font-medium">{perk.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Comparison table */}
        <section className="mb-16 sm:mb-20">
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="bg-surface-hover border-b border-border px-6 py-4">
              <h2 className="text-lg font-bold text-text">BIDGARI vs selling the hard way</h2>
            </div>
            <div className="divide-y divide-border">
              {[
                { feature: "Listing cost", bidgari: "Free", other: "Varies" },
                { feature: "Commission on sale", bidgari: "Zero", other: "5–15%" },
                { feature: "Buyer enquiries", bidgari: "BIDGARI team handles", other: "You chase leads" },
                { feature: "Valuation", bidgari: "Real market data", other: "Lowball offers" },
                { feature: "Paperwork", bidgari: "Handled by BIDGARI", other: "You handle it" },
                { feature: "Market reach", bidgari: "Nationwide online", other: "Local walk-ins" },
              ].map((row, i) => (
                <div key={i} className="grid grid-cols-3 px-6 py-4 text-sm">
                  <span className="text-muted font-medium">{row.feature}</span>
                  <span className="text-[var(--accent)] font-bold text-center">{row.bidgari}</span>
                  <span className="text-dim text-center">{row.other}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-16 sm:mb-20">
          <div className="text-center mb-10">
            <h2 className="text-xl sm:text-2xl font-bold text-text">Frequently asked questions</h2>
          </div>
          <div className="max-w-2xl mx-auto space-y-0 divide-y divide-border border-t border-border">
            {FAQS.map((faq, i) => (
              <div key={i} className="py-5">
                <h3 className="text-sm font-bold text-text mb-2">{faq.q}</h3>
                <p className="text-sm text-muted leading-relaxed font-medium">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="text-center">
          <div className="rounded-xl border border-accent-dim bg-accent-wash p-8 sm:p-12">
            <h2 className="text-xl sm:text-3xl font-bold text-text mb-4">
              Ready to sell your car?
            </h2>
            <p className="text-sm text-muted mb-8 max-w-lg mx-auto font-medium">
              Tell us about it and we&apos;ll come back with a valuation within 48 hours.
            </p>
            <Link href={sellHref} className="btn btn-primary btn-lg">
              Sell your car
              <ArrowRight />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
