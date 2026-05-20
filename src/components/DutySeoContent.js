import Link from "next/link";

const SECTIONS = [
  {
    title: "How Kenya vehicle import duty is calculated",
    body: `Used imports are assessed on a depreciated CRSP, then multiplied by the KRA schedule ratio to get customs value. Import duty (35%), excise on (customs value + import duty), VAT on that full stack, plus IDF (3.5% of customs value) and RDL (2% of customs value). CRSP is a KRA benchmark for tax. You do not pay it to the seller. Add your real overseas purchase price in the calculator for an all-in landed estimate.`,
  },
  {
    title: "The 8-year import rule",
    body: `Kenya restricts registration of vehicles older than eight years from the year of first registration. That affects which model years buyers target from Japan, UK, and UAE, and which excise band applies. Always confirm the registration year on the logbook before you commit to a landed cost.`,
  },
  {
    title: "Excise duty on petrol, diesel, and hybrids",
    body: `Excise scales with engine capacity and fuel type: up to 15% for small petrol engines, 25% for mid-size, and 35% for large petrol (>3000cc) or diesel (>2500cc). Hybrids and electric vehicles can qualify for reduced excise. Our estimator picks the band from the vehicle you select.`,
  },
  {
    title: "After your estimate, find the car",
    body: `Every calculation links to matching inventory from verified dealers on Welsh Motorhub. Filter by make, model, and location, then contact the dealer directly. No middleman markup on the listing price.`,
  },
];

export default function DutySeoContent() {
  return (
    <section className="mt-16 sm:mt-20 pt-12 border-t border-slate-200 dark:border-zinc-800" aria-labelledby="duty-seo-heading">
      <h2 id="duty-seo-heading" className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2 editorial-heading">
        Import duty guides
      </h2>
      <p className="text-sm text-slate-600 dark:text-slate-300 mb-8 max-w-2xl">
        Reference material for buyers researching landed costs in Kenya. For official figures, confirm with KRA or your clearing agent.
      </p>
      <div className="grid gap-8 sm:grid-cols-2">
        {SECTIONS.map((section) => (
          <article key={section.title}>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">{section.title}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{section.body}</p>
          </article>
        ))}
      </div>
      <p className="mt-8 text-sm">
        <Link
          href="/cars"
          className="font-bold uppercase tracking-widest text-[10px] text-[#b91c1c] dark:text-red-400 hover:opacity-80"
        >
          Browse verified cars for sale →
        </Link>
      </p>
    </section>
  );
}
