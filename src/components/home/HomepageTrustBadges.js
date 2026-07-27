import { ShieldCheck, Scale, PhoneCall } from "lucide-react";

const BADGES = [
  {
    icon: ShieldCheck,
    title: "Verified dealer inventory",
    desc: "Every dealership is verified before listing. You deal with real businesses, not anonymous sellers.",
  },
  {
    icon: Scale,
    title: "Transparent pricing",
    desc: "See the car's market range, duty estimate, and total ownership cost before you reach out.",
  },
  {
    icon: PhoneCall,
    title: "Direct dealer contact",
    desc: "Call or WhatsApp the dealer straight from the listing. No forms, no commissions, no delays.",
  },
];

export default function HomepageTrustBadges() {
  return (
    <section className="py-10 sm:py-14 bg-[#141414] border-y border-white/[0.04]">
      <div className="home-shell">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
          {BADGES.map((badge, i) => (
            <div key={i} className="flex items-start gap-4 sm:flex-col sm:items-center sm:text-center group">
              <div className="shrink-0 w-12 h-12 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center group-hover:bg-[var(--accent)]/15 transition-colors">
                <badge.icon className="w-5 h-5 text-[var(--accent)]" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white mb-1">{badge.title}</h3>
                <p className="text-xs text-zinc-500 leading-relaxed font-medium">{badge.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
