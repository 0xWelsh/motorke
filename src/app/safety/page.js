// Served from the Vercel edge; re-rendered at most every 3600s.
// No searchParams or cookies on this route, so the output is cacheable.
export const revalidate = 3600;

import { ShieldAlert, ShieldCheck, PhoneCall, AlertTriangle, CheckCircle2, MessageCircle, Ban, FileWarning, ArrowRight } from "lucide-react";
import Link from "next/link";
import { buildPageTitle, buildCanonicalMetadata } from "@/lib/seo-metadata";
import {
  PUBLIC_SUPPORT_EMAIL,
  PUBLIC_SUPPORT_PHONE,
  getSupportWhatsAppHref,
} from "@/lib/site-contact";

export const metadata = {
  title: { absolute: buildPageTitle("Don't Get Scammed — buying cars safely in Kenya") },
  description:
    "Spot car-buying scams in Kenya before they cost you money. Fake deposits, ghost listings, bait-and-switch, and how BIDGARI keeps every sale safe.",
  ...buildCanonicalMetadata("/safety"),
};

const SCAMS = [
  {
    title: "Upfront deposit to a 'seller' you never met",
    desc: "A 'seller' asks for an M-Pesa deposit to 'hold' the car, then disappears. On BIDGARI, money only moves at handover, through the BIDGARI team.",
  },
  {
    title: "Impersonators posing as BIDGARI agents",
    desc: "Scammers use the BIDGARI name and our listing photos to build trust, then push a private WhatsApp number and demand payment. We never ask for money via WhatsApp or personal numbers.",
  },
  {
    title: "Bait-and-switch pricing",
    desc: "A too-good-to-be-true price that jumps once you 'commit' — the car always has a reason to be more expensive. If the price is far below market, it is a red flag.",
  },
  {
    title: "Ghost or cloned listings",
    desc: "Photos and details copied from a real listing, reposted by someone who doesn't own the car. Verify every listing reference ID with the BIDGARI team.",
  },
  {
    title: "Fake paperwork",
    desc: "Logbooks, NTSA searches, and transfer documents can be forged. We verify ownership records before any BIDGARI listing goes live.",
  },
];

const RED_FLAGS = [
  "The seller won't let you view the car in person.",
  "They ask for any payment before you inspect the vehicle and meet them.",
  "The 'deal' is far below market price and they rush you to decide.",
  "They only communicate via WhatsApp or phone and avoid the platform.",
  "They pressure you to pay to a personal number, not a business account.",
  "The logbook name doesn't match the seller's ID.",
  "They refuse to share the listing reference or verification details.",
  "They claim they're with BIDGARI but can't prove it — we never ask for money that way.",
];

const SAFE_STEPS = [
  {
    icon: CheckCircle2,
    title: "View the car first",
    desc: "Always inspect the vehicle in person and, ideally, bring a trusted mechanic. Never commit to a car you haven't seen.",
  },
  {
    icon: ShieldCheck,
    title: "Verify ownership",
    desc: "Check the logbook, ID, and NTSA search so the person selling is the registered owner.",
  },
  {
    icon: PhoneCall,
    title: "Go through BIDGARI",
    desc: "Contact the BIDGARI team from the listing — the official WhatsApp and phone numbers on this page are the only ones we use.",
  },
  {
    icon: Ban,
    title: "No upfront payments",
    desc: "Money changes hands only at handover, with the sale agreement and ownership transfer paperwork signed.",
  },
];

const OFFICIAL_CHANNELS = [
  {
    icon: MessageCircle,
    label: "Official WhatsApp",
    value: getSupportWhatsAppHref()
      ? "Chat with the BIDGARI team"
      : null,
    href: getSupportWhatsAppHref(),
  },
  {
    icon: PhoneCall,
    label: "Phone",
    value: PUBLIC_SUPPORT_PHONE || "Call the BIDGARI team",
    href: PUBLIC_SUPPORT_PHONE ? `tel:${PUBLIC_SUPPORT_PHONE.replace(/[^+\d]/g, "")}` : null,
  },
  {
    icon: ShieldCheck,
    label: "Email",
    value: PUBLIC_SUPPORT_EMAIL,
    href: `mailto:${PUBLIC_SUPPORT_EMAIL}`,
  },
];

export default function SafetyPage() {
  const whatsappHref = getSupportWhatsAppHref();

  return (
    <div className="min-h-screen bg-[var(--bg)] pt-20 pb-24">
      <div className="home-shell">
        {/* Hero */}
        <section className="text-center mb-16 sm:mb-20">
          <p className="meta-label text-[var(--accent)] mb-4">Buyer safety</p>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-text tracking-tight mb-6 max-w-4xl mx-auto leading-[1.1]">
            Don't get <span className="text-[var(--accent)]">scammed</span> buying a car in Kenya
          </h1>
          <p className="text-base sm:text-lg text-muted leading-relaxed max-w-2xl mx-auto font-medium">
            Car scams cost Kenyans millions every year. Here&apos;s how the most common ones work, how to spot them, and how BIDGARI keeps your money safe.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/report" className="btn btn-primary">
              Report a scam <ArrowRight />
            </Link>
            <Link href="/cars" className="btn btn-neutral">
              Browse verified listings
            </Link>
          </div>
        </section>

        {/* Common scams */}
        <section className="mb-16 sm:mb-24">
          <div className="flex items-center gap-3 mb-8 sm:mb-12">
            <ShieldAlert className="w-6 h-6 text-rose-500" />
            <h2 className="text-xl sm:text-2xl font-bold text-text tracking-tight">
              The scams we see most in Kenya
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {SCAMS.map((scam, i) => (
              <div key={i} className="rounded-xl border border-rose-200 bg-surface p-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-bold text-text mb-2">{scam.title}</h3>
                    <p className="text-xs text-muted leading-relaxed font-medium">{scam.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Red flags */}
        <section className="mb-16 sm:mb-24">
          <div className="flex items-center gap-3 mb-8 sm:mb-12">
            <FileWarning className="w-6 h-6 text-amber-500" />
            <h2 className="text-xl sm:text-2xl font-bold text-text tracking-tight">
              Red flags to walk away from
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {RED_FLAGS.map((flag, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl border border-border bg-surface px-5 py-4">
                <span className="text-[10px] font-black text-rose-500 mt-0.5 shrink-0">FLAG</span>
                <p className="text-xs sm:text-sm text-muted font-medium leading-relaxed">{flag}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Safe steps */}
        <section className="mb-16 sm:mb-24">
          <div className="flex items-center gap-3 mb-8 sm:mb-12">
            <ShieldCheck className="w-6 h-6 text-[var(--accent)]" />
            <h2 className="text-xl sm:text-2xl font-bold text-text tracking-tight">
              How to buy safely
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {SAFE_STEPS.map((step, i) => (
              <div key={i} className="rounded-xl border border-border bg-surface p-6">
                <step.icon className="w-6 h-6 text-[var(--accent)] mb-4" strokeWidth={1.5} />
                <h3 className="text-sm font-bold text-text mb-2">{step.title}</h3>
                <p className="text-xs text-muted leading-relaxed font-medium">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* What BIDGARI does */}
        <section className="rounded-2xl bg-slate-900 p-8 sm:p-12 mb-16 sm:mb-24">
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-6">
            What BIDGARI does to keep you safe
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              "Every listing is verified before it goes live — specs, photos, and ownership records.",
              "Every sale is handled by the BIDGARI team. You never deal with a stranger.",
              "Money moves only at handover, with paperwork signed. We never ask for deposits on WhatsApp.",
            ].map((point, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-sm text-ghost leading-relaxed font-medium">{point}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Official channels */}
        <section className="mb-16 sm:mb-24">
          <h2 className="text-xl sm:text-2xl font-bold text-text tracking-tight mb-4 text-center">
            Only ever deal with our official channels
          </h2>
          <p className="text-sm sm:text-base text-muted font-medium max-w-2xl mx-auto text-center mb-10 leading-relaxed">
            Scammers impersonate us. If someone claims to be BIDGARI, verify it through one of these — and never send money to a personal number.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6">
            {OFFICIAL_CHANNELS.filter((c) => c.value).map((ch, i) => (
              ch.href ? (
                <a
                  key={i}
                  href={ch.href}
                  target={ch.href.startsWith("http") ? "_blank" : undefined}
                  rel={ch.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="group rounded-xl border border-border bg-surface p-6 text-center hover:border-accent-glow hover:shadow-lg transition-all"
                >
                  <ch.icon className="w-6 h-6 text-[var(--accent)] mx-auto mb-3" strokeWidth={1.5} />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-dim mb-1">{ch.label}</p>
                  <p className="text-sm font-bold text-text group-hover:text-[var(--accent)] transition-colors break-words">{ch.value}</p>
                </a>
              ) : (
                <div key={i} className="rounded-xl border border-border bg-surface p-6 text-center">
                  <ch.icon className="w-6 h-6 text-[var(--accent)] mx-auto mb-3" strokeWidth={1.5} />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-dim mb-1">{ch.label}</p>
                  <p className="text-sm font-bold text-text break-words">{ch.value}</p>
                </div>
              )
            ))}
          </div>
          {whatsappHref && (
            <p className="text-xs text-dim font-medium text-center mt-6">
              Message us on WhatsApp with the listing reference if you&apos;re unsure a listing is real.
            </p>
          )}
        </section>

        {/* CTA */}
        <section className="text-center rounded-2xl border border-border bg-surface p-8 sm:p-14">
          <h2 className="text-2xl sm:text-3xl font-bold text-text tracking-tight mb-4">
            Think you&apos;ve been targeted or scammed?
          </h2>
          <p className="text-sm sm:text-base text-muted font-medium max-w-xl mx-auto mb-8 leading-relaxed">
            Report it to us and we&apos;ll investigate immediately, remove fraudulent listings, and alert other buyers. Include the listing reference if you have one.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/report" className="btn btn-primary btn-lg">
              Report a scam <ArrowRight />
            </Link>
            <Link href="/trust" className="btn btn-neutral btn-lg">
              How we verify listings
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
