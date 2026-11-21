"use client";

import { PUBLIC_SUPPORT_EMAIL } from "@/lib/site-contact";
import { useState } from "react";
import Link from "next/link";
import { ChevronDown, HelpCircle, Shield, Zap, MapPin, CreditCard } from "lucide-react";

const faqs = {
  "For Buyers": [
    {
      q: "How does BIDGARI guarantee vehicle quality?",
      a: "Every car listed on BIDGARI is sourced from vetted owners and yards and verified before it goes live. Listings include inspection details, mileage verification, and ownership records.",
    },
    {
      q: "Why should I buy through BIDGARI instead of going direct to a seller?",
      a: "BIDGARI gives you choice and clarity. Compare curated vehicles in one place, see real mileage and verified pricing, and filter by what matters (price, condition, fuel type, location). Every sale is handled by the BIDGARI team, so you're never left dealing with a stranger.",
    },
    {
      q: "How do I know the car I'm buying is actually available?",
      a: "Every listing is live and tied to our inventory. When a car sells, it's removed immediately, so there are no ghost listings. If you find a car marked available but it's already sold, contact us immediately and we'll investigate.",
    },
    {
      q: "Can I negotiate the price on BIDGARI?",
      a: "Yes! Send an enquiry or contact the BIDGARI team from the listing. We negotiate on your behalf with the seller and confirm the final price with you before anything moves.",
    },
    {
      q: "What if I have a bad experience with a seller?",
      a: `Leave a review on the listing. Your honest feedback helps other buyers and keeps our sellers accountable. If you believe fraud has occurred, contact us at ${PUBLIC_SUPPORT_EMAIL} immediately with evidence.`,
    },
    {
      q: "Can I compare cars side-by-side?",
      a: "Yes! Save cars you like, then click 'Compare' to see specs, pricing, mileage, and features side-by-side. You can compare up to 10 cars at once. This helps you spot which deal is actually better.",
    },
    {
      q: "What does 'verified' mean on a listing?",
      a: "A verified listing has passed our checks: accurate specs, real photos, and clear ownership records. Every BIDGARI listing is verified before it goes live.",
    },
    {
      q: "Do you help with financing?",
      a: "Not directly, but our team can point you to financing options for your budget. Compare total costs — price, duty, insurance, and running costs — before you decide.",
    },
    {
      q: "How do I get better deal notifications?",
      a: "When you save a car, BIDGARI learns your preferences. If a similar car appears at a lower price, we'll email you. Check your notifications regularly; sometimes deals move fast.",
    },
    {
      q: "Is my personal data safe on BIDGARI?",
      a: "Yes. We use industry-standard encryption, don't sell your data to third parties, and comply with Kenya data protection laws. See our Privacy Policy for full details.",
    },
  ],
  "For Sellers": [
    {
      q: "How much does it cost to sell through BIDGARI?",
      a: "Nothing. Listing and selling through BIDGARI is free — no listing fees, no commission on the sale.",
    },
    {
      q: "Why sell through BIDGARI instead of on my own?",
      a: "We bring serious buyers to your car and handle enquiries, viewings, and paperwork. You skip the listings headache and deal with one trusted team.",
    },
    {
      q: "How do I get my car listed quickly?",
      a: "Send photos and details online. Our team verifies and values your car, and most listings go live within 48 hours.",
    },
    {
      q: "Will BIDGARI negotiate with buyers for me?",
      a: "Yes. Our team handles enquiries and negotiations on your behalf. You approve the buyer and the price before anything moves.",
    },
    {
      q: "Can I track how my car is doing?",
      a: "Yes! We keep you updated on views and enquiries for your listing, and share buyer feedback so you know what's working.",
    },
    {
      q: "What if my car sells elsewhere?",
      a: "Just tell us and we'll remove your listing right away. No lock-in, no penalties.",
    },
    {
      q: "How do reviews work for sellers?",
      a: "Buyers can leave public feedback on your listing after the sale. Good feedback builds trust and helps your car sell faster.",
    },
    {
      q: "Can I sell a car I bought from an auction or import?",
      a: "Yes, as long as you can prove legal ownership. We verify documentation before your car goes live.",
    },
    {
      q: "What's the arrangement between BIDGARI and me as a seller?",
      a: "You agree the asking price with us and keep 100% of the sale. BIDGARI doesn't take a cut — we handle the sale end to end.",
    },
    {
      q: "Does BIDGARI help with the paperwork?",
      a: "Yes. We prepare the sale agreement and guide the ownership transfer so the sale completes smoothly.",
    },
  ],
  "Technical & Logistics": [
    {
      q: "How should I interpret listed prices on BIDGARI?",
      a: "Prices shown on listings are the asking price on BIDGARI. Always confirm the final transaction amount, optional add-ons, and transfer fees with the BIDGARI team before payment.",
    },
    {
      q: "Can I save my location to find cars nearby?",
      a: "Yes! Enable location on your profile. BIDGARI shows distance from your saved location to each vehicle. The 'Nearby' view highlights cars close to you. Update your location anytime.",
    },
    {
      q: "What phone numbers do I call if I have questions?",
      a: `Support: email ${PUBLIC_SUPPORT_EMAIL} or visit our contact page. Response time: 24-48 hours.`,
    },
    {
      q: "Does BIDGARI work on mobile?",
      a: "100%. Fully responsive web app. Add to homescreen to use like a native app. Photos upload via camera. Optimized for 3G+.",
    },
    {
      q: "Can I use BIDGARI offline?",
      a: "Partially. Basic features (saved cars, recent views) work offline. New searches and live updates require internet. When you're online again, data syncs.",
    },
    {
      q: "What's your refund policy if I'm unhappy?",
      a: "Today there are no subscriptions to cancel; access is free. If we introduce paid tiers, we'll publish a refund and cancellation policy before anyone is charged.",
    },
  ],
  "Trust & Security": [
    {
      q: "How do I know I won't get scammed?",
      a: "Red flags: a seller who won't let you view the car, asks for money upfront without a viewing, misrepresents mileage, or offers a deal too good to be true. ALWAYS view the car and verify ownership with NTSA before money changes hands. Every BIDGARI sale is handled by our team, but final verification is your responsibility.",
    },
    {
      q: "What if a seller lists a stolen car?",
      a: `Report it immediately at ${PUBLIC_SUPPORT_EMAIL} with proof. We work with law enforcement and will remove the car and ban the seller. BIDGARI has zero tolerance.`,
    },
    {
      q: "Do you facilitate payment?",
      a: "Payment happens between you and the seller, handled by the BIDGARI team. We recommend cash or M-Pesa at vehicle handover with ownership transfer paperwork signed. Use a lawyer if the deal is large (>2M KES).",
    },
    {
      q: "Is it safe to contact a seller from BIDGARI?",
      a: "Yes. Every listing is vetted before it goes live. If something seems off, report it and we'll investigate and remove the listing if needed.",
    },
    {
      q: "How do I know the seller or agent I'm talking to is really BIDGARI?",
      a: "We only ever contact you through our official channels: the contact forms on this site, our verified support email, and the phone/WhatsApp numbers listed on our Contact and Safety pages. We never ask for payment or deposits on WhatsApp, and never direct you to a personal M-Pesa number. If someone claims to be BIDGARI, check them against the official channels on our Safety page before sending anything.",
    },
    {
      q: "Should I pay a deposit before viewing a car?",
      a: "No. A request for money upfront — an M-Pesa deposit, 'booking fee', or 'refundable holding fee' — before you've seen the car and met the seller is a classic scam signal. On BIDGARI, money only moves at handover, with the sale agreement and ownership transfer signed.",
    },
    {
      q: "What if I've been scammed or targeted by a scammer?",
      a: `Stop communicating immediately and report it. Email ${PUBLIC_SUPPORT_EMAIL} with the listing reference (if any), the scammer's number, and screenshots, or use our report-a-scam form. We investigate every report, remove fraudulent listings, and work with law enforcement where possible. Also report the M-Pesa number to your service provider so it can be flagged.`,
    },
    {
      q: "What's your data privacy policy?",
      a: "Read full policy on our Privacy page. TL;DR: We encrypt sensitive data, don't sell to third parties, comply with Kenya data law. You control your data.",
    },
  ],
};

function FAQCategory({ category, items }) {
  const [openId, setOpenId] = useState(null);

  const icons = {
    "For Buyers": <Shield className="w-5 h-5 text-[var(--accent)]" />,
    "For Sellers": <Zap className="w-5 h-5 text-text" />,
    "Technical & Logistics": <MapPin className="w-5 h-5 text-muted" />,
    "Trust & Security": <CreditCard className="w-5 h-5 text-text" />,
  };

  return (
    <div className="mb-12">
      <div className="flex items-center gap-3 mb-8">
        {icons[category]}
        <h2 className="text-[10px] font-bold text-text uppercase tracking-[0.2em]">{category}</h2>
      </div>

      <div className="space-y-4">
        {items.map((item, idx) => (
          <div
            key={idx}
            className={`border transition-all duration-300 ${
              openId === idx 
                ? "border-accent-glow bg-surface-hover" 
                : "border-border hover:border-border"
            }`}
            style={{ borderRadius: 'var(--radius)' }}
          >
            <button
              onClick={() => setOpenId(openId === idx ? null : idx)}
              className="w-full px-8 py-6 flex items-start justify-between gap-4 bg-transparent transition"
            >
              <span className={`text-left font-bold uppercase tracking-tight text-[11px] sm:text-xs leading-relaxed ${
                openId === idx ? "text-text" : "text-muted"
              }`}>
                {item.q}
              </span>
              <ChevronDown
                className={`w-5 h-5 transition-transform ${
                  openId === idx ? "rotate-180 text-[var(--accent)]" : "text-muted"
                }`}
              />
            </button>

            {openId === idx && (
              <div className="px-8 pb-8 animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="text-sm font-medium text-muted leading-relaxed max-w-3xl">{item.a}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FAQPage() {
  return (
    <div className="bg-[var(--bg)] min-h-screen">
      {/* Header */}
      <section className="bg-[var(--bg)] pt-32 sm:pt-40 pb-20 px-6 border-b border-border">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted mb-8">
            <span>Resources</span>
            <span>/</span>
            <span className="text-text">Knowledge Base</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold text-text tracking-tight leading-[1.1] mb-6">
            Frequently <br />
            <span className="font-black tracking-tight text-muted">Asked Questions.</span>
          </h1>
          <p className="text-muted text-lg font-medium max-w-2xl mx-auto leading-relaxed">
            Everything you need to know about buying, selling, and trusting the BIDGARI network. 
            Direct, transparent, and verified.
          </p>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-20 sm:py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          {Object.entries(faqs).map(([category, items]) => (
            <FAQCategory key={category} category={category} items={items} />
          ))}

          {/* Need Support */}
          <div className="mt-24 sm:mt-32 pt-16 sm:pt-20 border-t border-border text-center">
             <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted mb-6">Still have questions?</h3>
             <h4 className="text-2xl sm:text-3xl font-bold text-text mb-10">Reach our support terminal.</h4>
             <Link href="/contact" className="btn btn-primary btn-lg">
                Contact Support Hub
             </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
