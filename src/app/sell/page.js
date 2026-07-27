import Link from "next/link";
import { ArrowRight, CheckCircle2, Car, BadgeCheck, PhoneCall, BarChart3, Clock, Users } from "lucide-react";
import { buildPageTitle, buildCanonicalMetadata } from "@/lib/seo-metadata";

export const metadata = {
  title: buildPageTitle("Sell your car — free dealer listings"),
  description:
    "List your car on BIDGARI for free. No commission, no middleman. Verified dealers get direct buyer enquiries via phone and WhatsApp.",
  ...buildCanonicalMetadata("/sell"),
};

const STEPS = [
  {
    num: "1",
    title: "Create your dealer account",
    desc: "Sign up with your business details. We verify your dealership — usually within 24 hours.",
  },
  {
    num: "2",
    title: "List your cars",
    desc: "Add photos, specs, pricing, and description. Our listing tool guides you through every field.",
  },
  {
    num: "3",
    title: "Get verified",
    desc: "Verified dealers get a trust badge. Buyers see it on every listing — it means a real business stands behind the car.",
  },
  {
    num: "4",
    title: "Receive enquiries",
    desc: "Buyers call or WhatsApp you directly from the listing. You negotiate, you close, you get paid.",
  },
];

const PERKS = [
  {
    icon: Car,
    title: "Free listing",
    desc: "No subscription required to start. List as many cars as you want, zero commission on sales.",
  },
  {
    icon: BadgeCheck,
    title: "Verified badge",
    desc: "Earn buyer trust with a verified badge on all your listings. Stand out from unverified sellers.",
  },
  {
    icon: PhoneCall,
    title: "Direct contact",
    desc: "Buyers contact you via phone or WhatsApp. No forms, no lead fees, no middlemen.",
  },
  {
    icon: BarChart3,
    title: "Market intelligence",
    desc: "See how your listings perform — views, enquiries, and market positioning data.",
  },
  {
    icon: Clock,
    title: "Go live in 24 hours",
    desc: "Once verified, your listings go live within hours. Start receiving enquiries the same day.",
  },
  {
    icon: Users,
    title: "Kenya-wide reach",
    desc: "Your cars are visible to buyers across Nairobi, Mombasa, Kisumu, and all 47 counties.",
  },
];

const FAQS = [
  {
    q: "Is listing really free?",
    a: "Yes. Creating an account and listing cars is completely free. We charge nothing on sales. Our revenue comes from optional premium plans that give you spotlight placement and boost features.",
  },
  {
    q: "How long does verification take?",
    a: "Most dealerships are verified within 24 hours. We check your business registration, physical showroom, and track record. You can start listing immediately and go fully live after verification.",
  },
  {
    q: "Can private sellers list?",
    a: "Yes. If you have a car to sell, you can create an individual seller account. Buyers will see you as a private seller with contact details. Verification is lighter for private sellers.",
  },
  {
    q: "How do buyers find my listings?",
    a: "Your listings appear in BIDGARI search results, browse pages, and comparison tools. Buyers filter by make, price, location, and body type — your cars show up when they match. Verified dealers get priority placement.",
  },
];

export default function SellPage() {
  return (
    <div className="min-h-screen bg-[#080808] pt-20 pb-24">
      <div className="home-shell">
        {/* Hero */}
        <section className="text-center mb-16 sm:mb-20">
          <p className="meta-label text-[var(--accent)] mb-4">For dealers</p>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight mb-6 max-w-3xl mx-auto leading-[1.1]">
            List your inventory.{" "}
            <span className="text-[var(--accent)]">Get direct buyer enquiries.</span>
          </h1>
          <p className="text-base sm:text-lg text-zinc-400 leading-relaxed max-w-2xl mx-auto font-medium mb-8">
            Free to list, zero commission, no middleman. Join verified Kenyan dealers already selling on BIDGARI.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
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
              Browse existing dealers
            </Link>
          </div>
        </section>

        {/* Steps */}
        <section className="mb-16 sm:mb-20">
          <div className="text-center mb-10 sm:mb-14">
            <p className="meta-label text-[var(--accent)] mb-3">Getting started</p>
            <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
              4 steps to start selling
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {STEPS.map((step, i) => (
              <div key={i} className="relative">
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[60%] w-[calc(100%-20%)] h-px bg-gradient-to-r from-white/[0.08] to-transparent" aria-hidden />
                )}
                <div className="relative mx-auto w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-5">
                  <span className="text-xl font-black text-[var(--accent)]">{step.num}</span>
                </div>
                <h3 className="text-base font-bold text-white mb-2 text-center">{step.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed text-center font-medium">
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
            <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
              Everything you get for free
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {PERKS.map((perk, i) => (
              <div
                key={i}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center mb-4">
                  <perk.icon className="w-5 h-5 text-[var(--accent)]" strokeWidth={1.5} />
                </div>
                <h3 className="text-base font-bold text-white mb-2">{perk.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed font-medium">{perk.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Comparison table */}
        <section className="mb-16 sm:mb-20">
          <div className="rounded-xl border border-white/[0.06] overflow-hidden">
            <div className="bg-white/[0.03] border-b border-white/[0.06] px-6 py-4">
              <h2 className="text-lg font-bold text-white">BIDGARI vs traditional channels</h2>
            </div>
            <div className="divide-y divide-white/[0.06]">
              {[
                { feature: "Listing cost", bidgari: "Free", other: "Varies" },
                { feature: "Commission on sale", bidgari: "Zero", other: "5–15%" },
                { feature: "Buyer contact method", bidgari: "Direct phone & WhatsApp", other: "Through agent" },
                { feature: "Verification", bidgari: "Trust badge on listings", other: "No verification" },
                { feature: "Market reach", bidgari: "Nationwide online", other: "Local walk-ins" },
                { feature: "Listing tools", bidgari: "Built-in, guided", other: "Manual / WhatsApp" },
              ].map((row, i) => (
                <div key={i} className="grid grid-cols-3 px-6 py-4 text-sm">
                  <span className="text-zinc-500 font-medium">{row.feature}</span>
                  <span className="text-[var(--accent)] font-bold text-center">{row.bidgari}</span>
                  <span className="text-zinc-600 text-center">{row.other}</span>
                </div>
              ))}
            </div>
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

        {/* Final CTA */}
        <section className="text-center">
          <div className="rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/5 p-8 sm:p-12">
            <h2 className="text-xl sm:text-3xl font-bold text-white mb-4">
              Ready to start selling?
            </h2>
            <p className="text-sm text-zinc-400 mb-8 max-w-lg mx-auto font-medium">
              Create your free dealer account and list your first car in under 3 minutes.
            </p>
            <Link
              href="/dealers/signup"
              className="inline-flex items-center justify-center h-12 px-8 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-black text-xs font-bold uppercase tracking-widest transition-all hover:scale-[0.98] active:scale-95 rounded-xl"
            >
              Create dealer account
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
