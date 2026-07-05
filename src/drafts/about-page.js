import Image from "next/image";
import { Shield, Users, MapPin, Building2, TrendingUp, Award, Quote } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "About BIDGARI — Kenya's Trusted Car Marketplace",
  description:
    "BIDGARI connects Kenyan car buyers with verified dealers. Transparent pricing, no middleman. Learn about our team, track record, and mission.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="bg-white dark:bg-[#0a0a0a] min-h-screen transition-colors duration-300">
      {/* Header — split layout with photo */}
      <section className="bg-white dark:bg-[#0a0a0a] pt-32 sm:pt-40 pb-24 sm:pb-32 px-6 border-b border-slate-100 dark:border-slate-800 relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#718096] dark:text-slate-500 mb-8">
                <span>Corporate</span>
                <span>/</span>
                <span className="text-[#111827] dark:text-white">About Us</span>
              </div>
              <h1 className="text-5xl sm:text-7xl font-bold text-[#111827] dark:text-white tracking-tight leading-[1.05] mb-8">
                Built for <br />
                <span className="editorial-heading text-[#38A169]">Trust.</span>
              </h1>
              <p className="text-xl text-[#718096] dark:text-slate-400 font-medium max-w-2xl leading-relaxed">
                BIDGARI is a Kenyan car marketplace that connects buyers with real verified dealers.
                No middlemen, no hidden fees. Just transparent pricing and cars that actually exist.
              </p>
            </div>
            <div className="relative flex justify-center lg:justify-end">
              <div className="relative w-72 h-72 sm:w-96 sm:h-96 group">
                <div className="absolute inset-0 bg-[#38A169]/10 rounded-3xl rotate-6 scale-105" />
                <div className="absolute inset-0 border-2 border-[#38A169]/30 rounded-3xl -rotate-3 scale-[1.02]" />
                <Image
                  src="/images/welsh.jpg"
                  alt="Welsh — Founder & CEO"
                  fill
                  className="object-cover rounded-3xl shadow-2xl grayscale hover:grayscale-0 transition-all duration-700"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Company Snapshot */}
      <section className="py-20 sm:py-24 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <div>
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#718096] dark:text-slate-600 mb-8">The Story</h2>
            <div className="space-y-6 text-base font-medium text-[#718096] dark:text-slate-400 leading-relaxed">
              <p>
                I started BIDGARI because I got tired of how hard it is to buy a car in Kenya.
                You see a listing online, you call the number, and the car is either sold or the price
                is different from what was advertised. Sometimes the dealer is just a broker working
                from a phone, and the car is parked at someone else&apos;s yard two towns away.
              </p>
              <p>
                The platform works like this. Every dealer on here is vetted before they can list.
                We check that they actually have a physical yard, that their business is registered,
                and that the cars they post are really in their inventory. When you see a price on
                BIDGARI, that is the price the dealer gave us. No last minute markups.
              </p>
              <p>
                For buyers, the whole point is that you can browse, compare, and contact the dealer
                directly through WhatsApp or phone. We do not insert ourselves into the transaction
                or take a cut. You talk to the person who actually has the car.
              </p>
              <p>
                For dealers, listing is free. We give you a dashboard to manage your inventory,
                see how many people are viewing each car, and get notified when someone reaches out.
                No subscription fees, no commission on sales.
              </p>
              <p>
                Today the platform has over 1,000 live listings from dealers across more than
                eight counties in Kenya. Every week more dealers sign up and more buyers find
                their cars here. But the goal has not changed. Make the market transparent enough
                that a buyer in Nairobi can shop for a car in Mombasa with the same confidence
                they would have walking into a showroom down the road.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            {[
              { icon: <Building2 className="w-5 h-5" />, label: "Dealers", value: "50+" },
              { icon: <Shield className="w-5 h-5" />, label: "Live Listings", value: "1,000+" },
              { icon: <MapPin className="w-5 h-5" />, label: "Counties", value: "8+" },
              { icon: <TrendingUp className="w-5 h-5" />, label: "Buyers Reached", value: "10,000+" },
            ].map((stat, i) => (
              <div key={i} className="bg-slate-50 dark:bg-[#111111] border border-slate-100 dark:border-slate-800 p-6 text-center" style={{ borderRadius: "var(--radius)" }}>
                <div className="w-10 h-10 bg-white dark:bg-[#0a0a0a] border border-slate-100 dark:border-slate-800 flex items-center justify-center text-[#38A169] mx-auto mb-4" style={{ borderRadius: "var(--radius)" }}>
                  {stat.icon}
                </div>
                <p className="text-3xl font-bold text-[#111827] dark:text-white mb-1">{stat.value}</p>
                <p className="text-xs font-bold uppercase tracking-widest text-[#718096] dark:text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Founder Quote */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-[#111827] text-white">
        <div className="max-w-4xl mx-auto text-center">
          <Quote className="w-10 h-10 text-[#38A169]/60 mx-auto mb-6" />
          <blockquote className="text-2xl sm:text-3xl font-bold leading-relaxed tracking-tight">
            &ldquo;Every decision we make starts with one question: does this make the market more transparent? If the answer is no, we don&apos;t build it.&rdquo;
          </blockquote>
          <p className="mt-6 text-sm font-bold uppercase tracking-widest text-[#38A169]">Welsh M., Founder</p>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 sm:py-24 px-4 sm:px-6 bg-slate-50 dark:bg-[#111111] border-t border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#718096] dark:text-slate-600 mb-4">How It Works</h2>
          <p className="text-3xl sm:text-4xl font-bold text-[#111827] dark:text-white tracking-tight mb-12">The platform in plain language.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { step: "01", title: "Dealers Get Verified", detail: "Before a dealer can list cars, we confirm their business exists. We check their physical location, their registration, and that the cars they want to list are actually in their inventory. No virtual dealers. No middlemen." },
              { step: "02", title: "Listings Go Live", detail: "Once verified, dealers post their cars with photos, specs, and a price. Every listing shows the dealer name and contact. If a car sells, it comes down within 48 hours so you are never looking at something that is already gone." },
              { step: "03", title: "You Contact Them Directly", detail: "Find a car you like? You call or WhatsApp the dealer straight from the listing. We do not process payments, we do not take commissions, we do not get in the way. You deal with the person who has the car." },
            ].map((item, i) => (
              <div key={i} className="space-y-5">
                <span className="text-5xl font-black text-slate-200 dark:text-slate-800">{item.step}</span>
                <h3 className="text-xl font-bold text-[#111827] dark:text-white">{item.title}</h3>
                <p className="text-sm font-medium text-[#718096] dark:text-slate-500 leading-relaxed">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What We Stand For */}
      <section className="py-20 sm:py-24 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#718096] dark:text-slate-600 mb-4">What Matters to Us</h2>
          <p className="text-3xl sm:text-4xl font-bold text-[#111827] dark:text-white tracking-tight mb-12">Three things we refuse to compromise on.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { icon: <Shield className="w-6 h-6" />, title: "Real Dealers Only", detail: "We verify every dealer before they can list. If we cannot confirm they are a legitimate business with a physical yard, they do not get on the platform." },
              { icon: <Award className="w-6 h-6" />, title: "Honest Pricing", detail: "The price you see is the price the dealer gave us. No hidden fees, no bait and switch, no middleman adding a markup before you get the contact." },
              { icon: <Users className="w-6 h-6" />, title: "Direct Connection", detail: "You contact the dealer directly. We do not take a cut, we do not handle payments, we do not insert ourselves into the deal. It is between you and them." },
            ].map((value, i) => (
              <div key={i} className="space-y-5">
                <div className="w-12 h-12 bg-slate-50 dark:bg-[#111111] border border-slate-100 dark:border-slate-800 flex items-center justify-center text-[#38A169]" style={{ borderRadius: "var(--radius)" }}>
                  {value.icon}
                </div>
                <h3 className="text-xl font-bold text-[#111827] dark:text-white">{value.title}</h3>
                <p className="text-sm font-medium text-[#718096] dark:text-slate-500 leading-relaxed">{value.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-24 px-4 sm:px-6 border-t border-slate-100 dark:border-slate-800">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#111827] dark:text-white">Are you a dealer?</h2>
          <p className="text-lg text-[#718096] dark:text-slate-400 font-medium">Listing is free. No subscription, no commission. Just a dashboard and direct buyer enquiries.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact" className="inline-flex items-center justify-center h-12 px-8 bg-[#111827] dark:bg-white text-white dark:!text-black text-xs font-bold uppercase tracking-widest transition-transform hover:scale-[0.98]" style={{ borderRadius: "var(--radius)" }}>
              Get in Touch
            </Link>
            <Link href="/mission" className="inline-flex items-center justify-center h-12 px-8 bg-white dark:bg-[#111111] border border-slate-200 dark:border-slate-800 text-[#111827] dark:text-white text-xs font-bold uppercase tracking-widest transition-transform hover:scale-[0.98]" style={{ borderRadius: "var(--radius)" }}>
              Read Our Mission
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
