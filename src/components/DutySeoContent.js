import Link from "next/link";
import { Calculator, Clock, Gauge, Search } from "lucide-react";

const SECTIONS = [
  {
    title: "How Kenya vehicle import duty is calculated",
    body: "Used imports are assessed on a depreciated CRSP, then multiplied by the KRA schedule ratio to get customs value. Import duty (25%, or 35% for large-engined vehicles), excise on (customs value + import duty), VAT on that full stack, plus IDF (3.5% of customs value) and RDL (2% of customs value). CRSP is a KRA benchmark for tax. You do not pay it to the seller. Add your real overseas purchase price in the calculator for an all-in landed estimate.",
    icon: Calculator,
  },
  {
    title: "The 8-year import rule",
    body: "Kenya restricts registration of vehicles older than eight years from the year of first registration. That affects which model years buyers target from Japan, UK, and UAE, and which excise band applies. Always confirm the registration year on the logbook before you commit to a landed cost.",
    icon: Clock,
  },
  {
    title: "Excise duty on petrol, diesel, and hybrids",
    body: "Excise scales with engine capacity and fuel type: up to 15% for small petrol engines, 25% for mid-size, and 35% for large petrol (>3000cc) or diesel (>2500cc). Hybrids and electric vehicles can qualify for reduced excise. Our estimator picks the band from the vehicle you select.",
    icon: Gauge,
  },
  {
    title: "After your estimate, find the car",
    body: "Every calculation links to matching BIDGARI inventory. Filter by make, model, and location, then contact our team. No middleman markup on the listing price.",
    icon: Search,
  },
];

export default function DutySeoContent() {
  return (
    <section className="mt-16 sm:mt-20 pt-12 border-t border-slate-200" aria-labelledby="duty-seo-heading">
      <h2 id="duty-seo-heading" className="text-xl sm:text-2xl font-black text-slate-900 mb-2 tracking-tight">
        Import duty guides
      </h2>
      <p className="text-sm text-slate-500 mb-8 max-w-2xl">
        Reference material for buyers researching landed costs in Kenya. For official figures, confirm with KRA or your clearing agent.
      </p>
      <div className="grid gap-6 sm:grid-cols-2">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <article
              key={section.title}
              className="p-5 bg-slate-50 border border-slate-200 rounded-xl"
            >
              <div className="flex items-start gap-3 mb-2">
                <Icon className="w-5 h-5 shrink-0 mt-0.5 text-red-500" aria-hidden />
                <h3 className="text-sm font-bold text-slate-900">{section.title}</h3>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed ml-8">{section.body}</p>
            </article>
          );
        })}
      </div>
      <p className="mt-8 text-sm">
        <Link
          href="/cars"
          className="font-bold uppercase tracking-widest text-[10px] text-[var(--accent)] hover:opacity-80"
        >
          Browse verified cars for sale →
        </Link>
      </p>
    </section>
  );
}
