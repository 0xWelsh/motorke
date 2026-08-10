import Link from "next/link";
import { Car, Search, Store, Calculator, ArrowUpRight } from "lucide-react";
import { absoluteUrl } from "@/lib/site-url";

export const metadata = {
  title: "How To Buy a Car on BIDGARI",
  description:
    "Three simple ways to buy on BIDGARI: browse verified stock, request a car, or let BIDGARI handle the whole deal for you. Transparent pricing, no middleman.",
  alternates: { canonical: "/how-to-buy" },
  openGraph: {
    url: absoluteUrl("/how-to-buy"),
    title: "How To Buy a Car on BIDGARI",
    description: "From stock, on request, or handled end-to-end by BIDGARI — pick how you want to buy.",
  },
};

const METHODS = [
  {
    icon: <Search className="h-5 w-5" />,
    title: "From Stock",
    tagline: "Buy instantly from verified listings",
    points: [
      "Browse 70+ verified cars across Kenya",
      "Filter by brand, price, body type, and county",
      "Compare specs and total cost before you contact",
      "Message the BIDGARI team directly on WhatsApp",
    ],
    href: "/cars",
    cta: "Browse stock",
  },
  {
    icon: <Car className="h-5 w-5" />,
    title: "Request a Car",
    tagline: "Ask BIDGARI to source your exact car",
    points: [
      "Post the make, model, year, and budget you want",
      "Our team responds with offers on WhatsApp",
      "No phone number is shared with sellers",
      "Requests stay live for 7 days",
    ],
    href: "/request-car",
    cta: "Make a request",
  },
  {
    icon: <Store className="h-5 w-5" />,
    title: "Handled by BIDGARI",
    tagline: "We handle the whole deal for you",
    points: [
      "BIDGARI verifies every car before it goes live",
      "Message our team on WhatsApp from any listing",
      "We guide you through inspection and paperwork",
      "No middlemen, no commissions on your purchase",
    ],
    href: "/cars",
    cta: "Browse stock",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Choose your car",
    desc: "Browse stock or post a request. Check photos, mileage, engine, and price on every listing.",
  },
  {
    n: "02",
    title: "Check the numbers",
    desc: "Use the duty calculator to understand import costs and compare two cars side by side.",
  },
  {
    n: "03",
    title: "Contact the BIDGARI team",
    desc: "Message us on WhatsApp or send an enquiry form — no middleman, no commission.",
  },
  {
    n: "04",
    title: "Inspect & transact",
    desc: "Arrange a viewing or inspection with our team, agree on terms, and close the deal.",
  },
];

export default function HowToBuyPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <section className="border-b border-slate-200 pt-14 sm:pt-16 pb-8 sm:pb-10 px-4 sm:px-6 bg-gradient-to-b from-white to-[var(--bg)]">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--accent)] mb-3">
            How To Buy
          </p>
          <h1 className="text-3xl sm:text-5xl font-bold text-slate-900 tracking-tight mb-4">
            Three ways to buy your next car
          </h1>
          <p className="text-slate-500 text-sm sm:text-base leading-relaxed max-w-xl mx-auto">
            Whether the car is already in stock or you need it sourced, BIDGARI handles the deal for you
            from first enquiry to final paperwork.
          </p>
        </div>
      </section>

      {/* Methods */}
      <section className="px-4 sm:px-6 py-8 sm:py-12">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {METHODS.map((m) => (
            <div
              key={m.title}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-sm transition-all hover:border-slate-300 hover:shadow-glass"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent)]/10 text-[var(--accent)]">
                {m.icon}
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">{m.title}</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">{m.tagline}</p>
              <ul className="mt-4 space-y-2.5 flex-1">
                {m.points.map((p) => (
                  <li key={p} className="flex items-start gap-2.5 text-[13px] text-slate-600">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                    {p}
                  </li>
                ))}
              </ul>
              <Link
                href={m.href}
                className="btn btn-primary mt-6 w-full"
              >
                {m.cta} <ArrowUpRight />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Steps */}
      <section className="border-t border-slate-200 bg-white px-4 sm:px-6 py-10 sm:py-14">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2">
            How it works
          </h2>
          <p className="text-center text-sm text-slate-500 mb-8 sm:mb-10">
            Every purchase follows the same simple, transparent path.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {STEPS.map((s) => (
              <div key={s.n} className="relative">
                <span className="text-[40px] font-black leading-none text-slate-100">{s.n}</span>
                <h3 className="mt-2 text-base font-black text-slate-900">{s.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Duty helper */}
      <section className="px-4 sm:px-6 py-10 sm:py-14">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-5 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Calculator className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">Curious about import costs?</h3>
              <p className="text-sm text-slate-500">
                Estimate duty and total landed cost for any vehicle in seconds.
              </p>
            </div>
          </div>
          <Link
            href="/duty"
            className="btn btn-neutral shrink-0"
          >
            Duty calculator <ArrowUpRight />
          </Link>
        </div>
      </section>
    </div>
  );
}
