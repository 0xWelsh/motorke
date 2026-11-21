import { ShieldCheck, Scale, PhoneCall } from "lucide-react";

const BADGES = [
  {
    icon: ShieldCheck,
    title: "Every car verified by BIDGARI",
    desc: "We inspect, verify, and price every car ourselves. You deal with one team — BIDGARI — never anonymous sellers.",
  },
  {
    icon: Scale,
    title: "Transparent pricing",
    desc: "See the car's market range, duty estimate, and total ownership cost before you reach out.",
  },
  {
    icon: PhoneCall,
    title: "One team, one contact",
    desc: "Call or WhatsApp the BIDGARI team from any listing. No forms, no commissions, no delays.",
  },
];

export default function HomepageTrustBadges() {
  return (
    <section className="py-8 sm:py-10">
      <div className="home-shell">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6">
          {BADGES.map((badge, i) => (
            <div key={i} className="flex items-start gap-4">
              <badge.icon className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent)]" strokeWidth={1.8} />
              <div>
                <h3 className="text-sm font-bold text-text mb-1">{badge.title}</h3>
                <p className="text-xs text-muted leading-relaxed font-medium">{badge.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
