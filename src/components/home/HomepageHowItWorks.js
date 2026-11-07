"use client";
import { useState } from "react";
import Link from "next/link";
import { Search, FileText, MessageCircle, Car, BadgeCheck, Handshake } from "lucide-react";

const BUYER_STEPS = [
  {
    icon: Search,
    title: "Discover",
    desc: "Browse verified BIDGARI inventory. Filter by make, price, body type, or county.",
  },
  {
    icon: FileText,
    title: "Compare",
    desc: "Side-by-side specs, total ownership costs, and road-readiness signals in one clean view.",
  },
  {
    icon: MessageCircle,
    title: "Connect",
    desc: "Call or WhatsApp the BIDGARI team from any listing. One team handles your deal end to end.",
  },
];

const SELLER_STEPS = [
  {
    icon: Car,
    title: "Tell us about your car",
    desc: "Share photos and details online. We review your car and confirm ownership — no fees, no commission.",
  },
  {
    icon: BadgeCheck,
    title: "We list it for you",
    desc: "Your car goes live with verified specs, real photos, and a fair market price agreed with you.",
  },
  {
    icon: Handshake,
    title: "We handle the sale",
    desc: "Our team handles enquiries, viewings, and paperwork. You get paid when it sells. Simple.",
  },
];

export default function HomepageHowItWorks() {
  const [tab, setTab] = useState("buyer");
  const steps = tab === "buyer" ? BUYER_STEPS : SELLER_STEPS;

  return (
    <section className="py-10 sm:py-14 bg-white border-y border-slate-200">
      <div className="home-shell">
        <div className="text-center mb-8 sm:mb-10">
          <p className="meta-label text-[var(--accent)] mb-3">How it works</p>
          <h2 className="text-2xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            {tab === "buyer" ? "Find your next car in 3 steps" : "Sell your car in 3 steps"}
          </h2>
        </div>

        {/* Tab switcher */}
        <div className="flex justify-center mb-8 sm:mb-10">
          <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1">
            <button
              onClick={() => setTab("buyer")}
              className={`px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                tab === "buyer"
                  ? "bg-[var(--accent)] text-white"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Buying
            </button>
            <button
              onClick={() => setTab("seller")}
              className={`px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                tab === "seller"
                  ? "bg-[var(--accent)] text-white"
                  : "text-slate-500 hover:text-slate-900"
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
                <div className="hidden sm:block absolute top-8 left-[60%] w-[calc(100%-20%)] h-px bg-gradient-to-r from-slate-200 to-transparent" aria-hidden />
              )}

              <div className="relative mx-auto w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-5 group-hover:border-accent-glow group-hover:bg-accent-wash transition-all duration-300">
                <step.icon className="w-7 h-7 text-[var(--accent)]" strokeWidth={1.5} />
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[var(--accent)] text-white text-[10px] font-black flex items-center justify-center">
                  {i + 1}
                </span>
              </div>

              <h3 className="text-lg font-bold text-slate-900 mb-2">{step.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed max-w-[260px] mx-auto font-medium">
                {step.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="text-center mt-8 sm:mt-10">
          <Link
            href={tab === "buyer" ? "/cars" : "/sell"}
            className="btn-accent"
          >
            {tab === "buyer" ? "Browse inventory" : "Sell your car"}
          </Link>
        </div>
      </div>
    </section>
  );
}
