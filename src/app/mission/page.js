"use client";

import { Heart, Target, Zap, Shield, Users, Lightbulb } from "lucide-react";

export default function MissionPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">Our Mission</h1>
          <p className="text-xl text-blue-100">
            Motorke was created for buyers who want dealer clarity.
          </p>
        </div>
      </section>

      {/* Core Mission */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-blue-50 border-l-4 border-blue-600 p-8 rounded-lg mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">The Problem We Solve</h2>
            <p className="text-lg text-slate-700 leading-relaxed">
              Buying a car in Kenya was broken. You'd visit 50 dealer websites (if they existed), 
              see outdated listings, get scammed by inflated prices, or meet dealers with 
              zero transparency. <strong>Motorke fixes this.</strong>
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 mb-16">
            {/* Left: What We Do */}
            <div>
              <h3 className="text-2xl font-bold text-slate-900 mb-6">What We Do</h3>
              <p className="text-slate-700 leading-relaxed mb-6">
                We curate a high-quality selection of vehicles from Kenya's dealer network 
                and certified auction platforms. Every car listing includes:
              </p>
              <ul className="space-y-3">
                <li className="flex gap-3">
                  <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700"><strong>Verified ownership</strong> & registration history</span>
                </li>
                <li className="flex gap-3">
                  <Zap className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700"><strong>Real mileage</strong> (no odometer fraud)</span>
                </li>
                <li className="flex gap-3">
                  <Heart className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700"><strong>Dealer reviews</strong> from actual buyers</span>
                </li>
                <li className="flex gap-3">
                  <Target className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700"><strong>Transparent pricing</strong> (no hidden fees)</span>
                </li>
                <li className="flex gap-3">
                  <Lightbulb className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700"><strong>Smart comparison tools</strong> (duty, loan calc)</span>
                </li>
              </ul>
            </div>

            {/* Right: Our Values */}
            <div>
              <h3 className="text-2xl font-bold text-slate-900 mb-6">Our Values</h3>

              <div className="space-y-6">
                <div>
                  <h4 className="font-bold text-slate-900 mb-2">🔍 Clarity First</h4>
                  <p className="text-slate-700 text-sm">
                    No BS. Every listing is honest. Every dealer is vetted. Buyers deserve to know what they're getting.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 mb-2">🤝 Trust Matters</h4>
                  <p className="text-slate-700 text-sm">
                    We're not a broker. We don't take commissions on sales. We make money only when dealers subscribe and buyers trust us. Our incentives are aligned.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 mb-2">⚡ Efficiency</h4>
                  <p className="text-slate-700 text-sm">
                    Shopping for a car should be fast, not painful. One search. 1000+ options. Save cars. Compare. Done.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 mb-2">🌍 For Kenya</h4>
                  <p className="text-slate-700 text-sm">
                    We're built for Kenya's market—currency in KSh, duty calculators for imports, mobile-first design for 3G networks.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Numbers */}
      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">Our Impact</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg border border-slate-200 text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">1000+</div>
              <p className="text-slate-700">Vehicles listed (growing daily)</p>
            </div>
            <div className="bg-white p-8 rounded-lg border border-slate-200 text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">50+</div>
              <p className="text-slate-700">Verified dealers on platform</p>
            </div>
            <div className="bg-white p-8 rounded-lg border border-slate-200 text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">0</div>
              <p className="text-slate-700">Listing fees (for buyers)</p>
            </div>
          </div>
        </div>
      </section>

      {/* Vision */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 mb-8">Our Vision (5 Years)</h2>

          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-blue-600 text-white font-bold">
                  1
                </div>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-2">The Largest Vehicle Marketplace in East Africa</h3>
                <p className="text-slate-700">
                  Not just Kenya—we'll expand to Uganda, Tanzania, and Rwanda. One platform for the entire region.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-blue-600 text-white font-bold">
                  2
                </div>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-2">End Odometer Fraud Completely</h3>
                <p className="text-slate-700">
                  Partner with NTSA and auction houses to verify every car's history digitally. Make fraud impossible.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-blue-600 text-white font-bold">
                  3
                </div>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-2">Financing Available for Everyone</h3>
                <p className="text-slate-700">
                  Build lending partnerships so buyers can finance through Motorke (not just dealers).
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-blue-600 text-white font-bold">
                  4
                </div>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-2">Insurance Integration</h3>
                <p className="text-slate-700">
                  One-click insurance at checkout. Buyers get their car fully covered before driving home.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Join Us in Fixing Car Buying</h2>
          <p className="text-lg text-blue-100 mb-8">
            Whether you're a buyer looking for your next car or a dealer ready to reach serious customers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/search"
              className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition"
            >
              Browse Cars
            </a>
            <a
              href="/portal"
              className="px-8 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-blue-700 transition"
            >
              List with Motorke
            </a>
          </div>
        </div>
      </section>

      {/* Team/Contact */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Questions About Our Mission?</h2>
          <p className="text-slate-700 mb-6">
            Reach out anytime. We love hearing from people who care about fixing this industry.
          </p>
          <a
            href="/contact"
            className="inline-block px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            Get in Touch
          </a>
        </div>
      </section>
    </div>
  );
}
