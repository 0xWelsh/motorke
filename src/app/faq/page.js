"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, HelpCircle, Shield, Zap, MapPin, CreditCard } from "lucide-react";

const faqs = {
  "For Buyers": [
    {
      q: "How does Motorke guarantee vehicle quality?",
      a: "Every car listed on Motorke comes from verified dealers or certified auction platforms. All vehicles include a detailed inspection history, mileage verification, and ownership records. We vet dealers for credibility before they list.",
    },
    {
      q: "Why should I buy through Motorke instead of going direct to a dealer?",
      a: "Motorke gives you choice and clarity. Compare 1000+ curated vehicles from Kenya's best dealers in one place. You see real mileage, verified pricing, and can filter by what matters (price, condition, fuel type, location). Plus, our transparent dealer reviews help you make informed decisions.",
    },
    {
      q: "How do I know the car I'm buying is actually available?",
      a: "Every listing is live and tied to the dealer's inventory system. If a car is sold, the dealer must update their inventory immediately. Our 'Mark as Sold' feature ensures no ghost listings. If you find a car marked available but it's sold, contact us immediately—we'll investigate.",
    },
    {
      q: "Can I negotiate the price on Motorke?",
      a: "Yes! Use the enquiry form or call the dealer directly (phone numbers are on every listing). Motorke connects you; the final negotiation happens between you and the dealer. Some dealers are more flexible on price, especially for cash buyers or bulk purchases.",
    },
    {
      q: "What if I have a bad experience with a dealer?",
      a: "Leave a detailed review on their dealer profile. Your honest feedback helps other buyers and holds dealers accountable. If you believe fraud has occurred, contact us at sec@welsh.co.ke immediately with evidence.",
    },
    {
      q: "Can I compare cars side-by-side?",
      a: "Yes! Save cars you like, then click 'Compare' to see specs, pricing, mileage, and features side-by-side. You can compare up to 10 cars at once. This helps you spot which deal is actually better.",
    },
    {
      q: "What does 'verified' mean on a dealer's profile?",
      a: "A verified dealer has passed our background check, provided business registration proof, and maintains consistent, honest listings. They're held to higher standards. Trust the badge.",
    },
    {
      q: "Do you help with financing?",
      a: "Not directly, but many dealers offer financing options. You'll see 'Financing Available' tags on listings. We also show estimated duty costs (for imported vehicles) so you can plan your total investment.",
    },
    {
      q: "How do I get better deal notifications?",
      a: "When you save a car, Motorke learns your preferences. If a similar car appears at a lower price, we'll email you. Check your notifications regularly—sometimes deals move fast.",
    },
    {
      q: "Is my personal data safe on Motorke?",
      a: "Yes. We use industry-standard encryption, don't sell your data to third parties, and comply with Kenya data protection laws. See our Privacy Policy for full details.",
    },
  ],
  "For Dealers": [
    {
      q: "How much does it cost to list on Motorke?",
      a: "Motorke offers a FREE tier (list up to 20 vehicles) and a PRO tier (unlimited listings + analytics + lead prioritization). PRO is KSh 3,999/month or KSh 39,990/year. Cancel anytime.",
    },
    {
      q: "Why list on Motorke instead of managing my own website?",
      a: "Motorke brings 1000s of verified buyers to you monthly. You skip building a website, handling payments, or managing leads manually. Our platform does it—you focus on selling.",
    },
    {
      q: "How do I upload my inventory quickly?",
      a: "Use our bulk upload feature (CSV/Excel). Add up to 500 cars at once. Or add manually, one car at a time. Mobile app lets you photograph and upload on the spot.",
    },
    {
      q: "Will Motorke help me negotiate with buyers?",
      a: "No. We connect you; you handle the sale. Buyers use the enquiry form or call you directly. We recommend responding within 2 hours for best conversion rates.",
    },
    {
      q: "Can I track which cars perform best?",
      a: "Yes! PRO dealers get analytics: view count, enquiry source, lead quality, time-to-sale. You'll see which cars interest buyers and optimize your inventory.",
    },
    {
      q: "What if a car sells elsewhere? Can I remove it quickly?",
      a: "Instant 'Mark as Sold' button. The car hides from search immediately. No awkward conversations with buyers.",
    },
    {
      q: "How do reviews work for dealers?",
      a: "Buyers leave public reviews after purchase or enquiry. Your rating is transparent—5 stars builds trust, low ratings hurt visibility. Respond to reviews professionally and fix legitimate issues.",
    },
    {
      q: "Can I list cars from auctions or franchises?",
      a: "Yes, as long as you have legal authority to sell them (trading license, auction certificate, etc.). We verify dealer credibility before approval.",
    },
    {
      q: "What's the contract between Motorke and me as a dealer?",
      a: "You keep 100% of sale price. Motorke makes money from PRO subscriptions, not commissions. We're aligned: we only win when you win.",
    },
    {
      q: "Will Motorke help me handle customer service?",
      a: "You're responsible for your customers. But we provide tools: messaging integration, lead assignment, customer history. Premium dealers get dedicated support.",
    },
  ],
  "Technical & Logistics": [
    {
      q: "What's the duty calculator and is it accurate?",
      a: "The duty calculator estimates import taxes for vehicles. It uses current Kenya Revenue Authority rates (engine size, vehicle age, import value). It's a guide—official duty depends on your HS code and CIF value. Consult a clearing agent for exact quotes.",
    },
    {
      q: "Can I save my location to find cars nearby?",
      a: "Yes! Enable location on your profile. Motorke shows distance from your saved location to each vehicle. 'Nearby Dealers' feature highlights cars close to you. Update your location anytime.",
    },
    {
      q: "What phone numbers do I call if I have questions?",
      a: "Support: email sec@welsh.co.ke or visit our contact page. Response time: 24-48 hours.",
    },
    {
      q: "Does Motorke work on mobile?",
      a: "100%. Fully responsive web app. Add to homescreen to use like a native app. Photos upload via camera. Optimized for 3G+.",
    },
    {
      q: "Can I use Motorke offline?",
      a: "Partially. Basic features (saved cars, recent views) work offline. New searches and live updates require internet. When you're online again, data syncs.",
    },
    {
      q: "What's your refund policy if I'm unhappy?",
      a: "PRO subscriptions: 14-day money-back guarantee. No questions asked. Cancel in 'Settings' anytime.",
    },
  ],
  "Trust & Security": [
    {
      q: "How do I know I won't get scammed?",
      a: "Red flags: dealer won't show car in person, asks for money upfront without viewing, misrepresents mileage, offers deals too good to be true. ALWAYS test-drive and verify ownership with NTSA before money changes hands. We vet dealers, but final verification is your responsibility.",
    },
    {
      q: "What if a dealer lists a stolen car?",
      a: "Report it immediately at sec@welsh.co.ke with proof. We work with law enforcement and will remove the car and ban the dealer. Motorke has zero tolerance.",
    },
    {
      q: "Do you facilitate payment?",
      a: "No. Payment happens between you and the dealer. We recommend cash or M-Pesa at vehicle handover with ownership transfer paperwork signed. Use a lawyer if the deal is large (>2M KSh).",
    },
    {
      q: "Is it safe to call a dealer from Motorke?",
      a: "Yes. Phone numbers are from verified dealer profiles. If a number seems fake or scammy, report it—we investigate and may ban the dealer.",
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
    "For Buyers": <Shield className="w-5 h-5 text-[#38A169]" />,
    "For Dealers": <Zap className="w-5 h-5 text-[#111827] dark:text-white" />,
    "Technical & Logistics": <MapPin className="w-5 h-5 text-[#718096]" />,
    "Trust & Security": <CreditCard className="w-5 h-5 text-[#111827] dark:text-white" />,
  };

  return (
    <div className="mb-12">
      <div className="flex items-center gap-3 mb-8">
        {icons[category]}
        <h2 className="text-[10px] font-bold text-[#111827] dark:text-white uppercase tracking-[0.2em]">{category}</h2>
      </div>

      <div className="space-y-4">
        {items.map((item, idx) => (
          <div
            key={idx}
            className={`border transition-all duration-300 ${
              openId === idx 
                ? "border-[#38A169]/30 bg-slate-50 dark:bg-[#111111]/40" 
                : "border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600"
            }`}
            style={{ borderRadius: 'var(--radius)' }}
          >
            <button
              onClick={() => setOpenId(openId === idx ? null : idx)}
              className="w-full px-8 py-6 flex items-start justify-between gap-4 bg-transparent transition"
            >
              <span className={`text-left font-bold uppercase tracking-tight text-[11px] sm:text-xs leading-relaxed ${
                openId === idx ? "text-[#111827] dark:text-white" : "text-[#718096] dark:text-slate-500"
              }`}>
                {item.q}
              </span>
              <ChevronDown
                className={`w-5 h-5 transition-transform ${
                  openId === idx ? "rotate-180 text-[#38A169]" : "text-slate-400 dark:text-slate-600"
                }`}
              />
            </button>

            {openId === idx && (
              <div className="px-8 pb-8 animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="text-sm font-medium text-[#718096] dark:text-slate-400 leading-relaxed max-w-3xl">{item.a}</p>
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
    <div className="bg-white dark:bg-[#0a0a0a] min-h-screen transition-colors duration-300">
      {/* Header */}
      <section className="bg-white dark:bg-[#0a0a0a] pt-32 sm:pt-40 pb-20 px-6 border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#718096] dark:text-slate-500 mb-8">
            <span>Resources</span>
            <span>/</span>
            <span className="text-[#111827] dark:text-white">Knowledge Base</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold text-[#111827] dark:text-white tracking-tight leading-[1.1] mb-6">
            Frequently <br />
            <span className="editorial-heading text-[#718096] dark:text-slate-400">Asked Questions.</span>
          </h1>
          <p className="text-[#718096] dark:text-slate-400 text-lg font-medium max-w-2xl mx-auto leading-relaxed">
            Everything you need to know about buying, selling, and trusting the Motorke network. 
            Direct, transparent, and verified.
          </p>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          {Object.entries(faqs).map(([category, items]) => (
            <FAQCategory key={category} category={category} items={items} />
          ))}

          {/* Need Support */}
          <div className="mt-32 pt-20 border-t border-slate-100 dark:border-slate-800 text-center">
             <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#718096] dark:text-slate-500 mb-6">Still have questions?</h3>
             <h4 className="text-3xl font-bold text-[#111827] dark:text-white mb-10">Reach our support terminal.</h4>
             <Link href="/contact" className="inline-block bg-[#111827] dark:bg-white text-white dark:!text-black px-12 py-5 text-xs font-bold uppercase tracking-widest transition-transform hover:scale-[0.98] shadow-2xl" style={{ borderRadius: 'var(--radius)' }}>
                Contact Support Hub
             </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
