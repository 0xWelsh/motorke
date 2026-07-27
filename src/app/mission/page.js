import { Heart, Target, Zap, Shield, Users, Lightbulb, ArrowRight } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Our mission",
  description:
    "BIDGARI exists to make Kenya's car market more transparent: trustworthy dealers, clearer total costs, and smarter comparison tools.",
  alternates: { canonical: "/mission" },
};

export default function MissionPage() {
  return (
    <div className="bg-[#080808] min-h-screen">
      {/* Header */}
      <section className="bg-[#080808] pt-32 sm:pt-40 pb-24 px-6 border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-8">
            <span>Corporate</span>
            <span>/</span>
            <span className="text-white">Our Mission</span>
          </div>
          <h1 className="text-5xl sm:text-7xl font-bold text-white tracking-tight leading-[1.05] mb-8">
            Architecting <br />
            <span className="editorial-heading text-zinc-400">Transparency.</span>
          </h1>
          <p className="text-xl text-zinc-400 font-medium max-w-2xl leading-relaxed mx-auto sm:mx-0">
            BIDGARI was established to bridge the information gap in the East African automotive market. 
            We build tools for buyers who demand operational clarity and verified data.
          </p>
        </div>
      </section>

      {/* Core Narrative */}
      <section className="py-20 sm:py-24 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-32">
          
          {/* Section 1: The Problem */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
             <div className="lg:col-span-5">
                <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-8">The Market Gap</h2>
                <h3 className="text-4xl font-bold text-white leading-tight">Solving for trust in a fragmented industry.</h3>
             </div>
             <div className="lg:col-span-7">
                <div className="bg-[#0f0f0f] p-10 sm:p-12 border border-white/[0.06] shadow-2xl rounded-xl">
                   <p className="text-lg text-white leading-relaxed font-medium">
                      The traditional car buying process was marked by opacity. Outdated listings, verification hurdles, and a lack of direct dealer performance metrics created friction. 
                      <span className="block mt-6 text-[var(--accent)]">BIDGARI was built to decentralize access to verified vehicle data.</span>
                   </p>
                </div>
             </div>
          </div>

          {/* Section 2: Core Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
             {[
               { icon: <Shield className="w-5 h-5" />, title: "Verified Assets", detail: "Every listing is cross-referenced with regional registration databases to ensure legal compliance." },
               { icon: <Zap className="w-5 h-5" />, title: "Operational Data", detail: "We enforce strict mileage verification protocols to eliminate odometer discrepancies." },
               { icon: <Target className="w-5 h-5" />, title: "Direct Logistics", detail: "Connect directly with verified yards. No middleman, no hidden commission structures." }
             ].map((pillar, i) => (
               <div key={i} className="space-y-6 group">
                  <div className="w-12 h-12 bg-[#0f0f0f] border border-white/[0.06] flex items-center justify-center text-[var(--accent)] transition-transform group-hover:scale-110 rounded-xl">
                     {pillar.icon}
                  </div>
                  <h4 className="text-xl font-bold text-white uppercase tracking-tight">{pillar.title}</h4>
                  <p className="text-sm font-medium text-zinc-400 leading-relaxed">{pillar.detail}</p>
               </div>
             ))}
          </div>
        </div>
      </section>

      {/* Impact Metrics */}
      <section className="py-20 sm:py-24 px-4 sm:px-6 bg-[#1A202C] text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
             <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-50 mb-4 block">Fleet Inventory</span>
                <p className="text-6xl font-bold mb-4">1,000+</p>
                <p className="text-sm font-medium opacity-70">Verified units currently active across our networked stations.</p>
             </div>
             <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-50 mb-4 block">Verified Partners</span>
                <p className="text-6xl font-bold mb-4">50+</p>
                <p className="text-sm font-medium opacity-70">Exclusive dealerships adhering to our transparency protocols.</p>
             </div>
             <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-50 mb-4 block">Buyer Cost</span>
                <p className="text-6xl font-bold mb-4">KSh 0.</p>
                <p className="text-sm font-medium opacity-70">Buyer use stays free; dealer tooling is complimentary while we build traffic.</p>
             </div>
          </div>
        </div>
      </section>

      {/* Strategic Vision */}
      <section className="py-24 sm:py-32 px-4 sm:px-6 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-20">
           <div className="lg:col-span-4">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-8">Strategic Roadmap</h2>
              <h3 className="text-3xl font-bold text-white">Expanding the <br /><span className="editorial-heading text-zinc-400">Horizon.</span></h3>
           </div>
           <div className="lg:col-span-8 space-y-16">
              {[
                { title: "Pan-African Expansion", detail: "Scaling our verification infrastructure to Uganda, Tanzania, and Rwanda to unify the regional market." },
                { title: "Digital History Protocol", detail: "Partnering with regional authorities to finalize a blockchain-based ownership and service history registry." },
                { title: "Financial Integration", detail: "Developing embedded finance tools to provide direct, low-friction loan processing at the point of sale." }
              ].map((step, i) => (
                <div key={i} className="flex gap-8 group">
                   <span className="text-2xl font-bold text-zinc-300 group-hover:text-[var(--accent)] transition-colors">{i+1}.</span>
                   <div>
                      <h4 className="text-xl font-bold text-white mb-2">{step.title}</h4>
                      <p className="text-lg font-medium text-zinc-400 leading-relaxed">{step.detail}</p>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* CTA Terminal */}
      <section className="py-20 sm:py-24 px-4 sm:px-6 border-t border-white/[0.06]">
        <div className="max-w-4xl mx-auto text-center space-y-12">
           <h2 className="text-4xl sm:text-5xl font-bold text-white">Join the Network.</h2>
           <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link href="/cars" className="inline-flex items-center justify-center h-12 px-8 sm:px-10 bg-white text-black border border-white text-xs font-bold uppercase tracking-widest transition-transform hover:scale-[0.98] shadow-sm rounded-xl">
                 Browse Verified Assets
              </Link>
               <Link href="/contact" className="inline-flex items-center justify-center h-12 px-8 sm:px-10 bg-[#0f0f0f] border border-white/[0.06] text-white text-xs font-bold uppercase tracking-widest transition-transform hover:scale-[0.98] shadow-sm rounded-xl">
                  Partner Enquiry
               </Link>
           </div>
        </div>
      </section>
    </div>
  );
}
