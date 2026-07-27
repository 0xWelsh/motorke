"use client";
import { useState } from "react";
import Link from "next/link";
import { Search, FileText, MessageCircle, Car, BadgeCheck, Handshake } from "lucide-react";

const BUYER_STEPS = [
  {
    icon: Search,
    title: "Discover",
    desc: "Browse verified inventory from trusted dealers. Filter by make, price, body type, or county.",
  },
  {
    icon: FileText,
    title: "Compare",
    desc: "Side-by-side specs, total ownership costs, and road-readiness signals in one clean view.",
  },
  {
    icon: MessageCircle,
    title: "Connect",
    desc: "Call or WhatsApp the dealer directly from the listing. No middlemen, no waiting.",
  },
];

const SELLER_STEPS = [
  {
    icon: Car,
    title: "List your car",
    desc: "Submit your car details online. It takes less than 3 minutes. Free listing, no commission.",
  },
  {
    icon: BadgeCheck,
    title: "Get verified",
    desc: "We verify your dealership and listing to build buyer trust. Verified badges convert faster.",
  },
  {
    icon: Handshake,
    title: "Close the deal",
    desc: "Buyers contact you directly via phone or WhatsApp. You negotiate, you get paid. Simple.",
  },
];

export default function HomepageHowItWorks() {
  const [tab, setTab] = useState("buyer");
  const steps = tab === "buyer" ? BUYER_STEPS : SELLER_STEPS;

  return (
    <section className="py-14 sm:py-20 bg-[#080808]">
      <div className="home-shell">
        <div className="text-center mb-10 sm:mb-14">
          <p className="meta-label text-[var(--accent)] mb-3">How it works</p>
          <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
            {tab === "buyer" ? "Find your next car in 3 steps" : "Sell your car in 3 steps"}
          </h2>
        </div>

        {/* Tab switcher */}
        <div className="flex justify-center mb-10 sm:mb-14">
          <div className="inline-flex rounded-xl border border-white/[0.06] bg-white/[0.02] p-1">
            <button
              onClick={() => setTab("buyer")}
              className={`px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                tab === "buyer"
                  ? "bg-[var(--accent)] text-black"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Buying
            </button>
            <button
              onClick={() => setTab("seller")}
              className={`px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                tab === "seller"
                  ? "bg-[var(--accent)] text-black"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Selling
            </button>
          </div>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto">
          {steps.map((step, i) => (
            <div key={`${tab}-${i}`} className="relative text-center group">
              {/* Connector line (desktop) */}
              {i < steps.length - 1 && (
                <div className="hidden sm:block absolute top-8 left-[60%] w-[calc(100%-20%)] h-px bg-gradient-to-r from-white/[0.08] to-transparent" aria-hidden />
              )}

              <div className="relative mx-auto w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-5 group-hover:border-[var(--accent)]/30 group-hover:bg-[var(--accent)]/5 transition-all duration-300">
                <step.icon className="w-7 h-7 text-[var(--accent)]" strokeWidth={1.5} />
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[var(--accent)] text-black text-[10px] font-black flex items-center justify-center">
                  {i + 1}
                </span>
              </div>

              <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed max-w-[260px] mx-auto font-medium">
                {step.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="text-center mt-10 sm:mt-14">
          <Link
            href={tab === "buyer" ? "/cars" : "/dealers/signup"}
            className="inline-flex items-center justify-center h-12 px-8 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-black text-xs font-bold uppercase tracking-widest transition-all hover:scale-[0.98] active:scale-95 rounded-xl"
          >
            {tab === "buyer" ? "Browse inventory" : "Start listing free"}
          </Link>
        </div>
      </div>
    </section>
  );
}
