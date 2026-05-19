import Link from "next/link";

const SECTIONS = [
  {
    title: "How Kenya vehicle import duty is calculated",
    body: `Used imports are assessed on a depreciated customs value from the Customs Reference Survey Price (CRSP). Import duty (35%), excise (by engine size, on customs value + import duty), VAT at 16% on that stack, plus IDF (2.5%) and railway levy (2%). Our calculator totals CRSP + shipping estimate + all taxes so you see an indicative “total to import” figure — then browse matching dealer stock.`,
  },
  {
    title: "The 8-year import rule",
    body: `Kenya restricts registration of vehicles older than eight years from the year of first registration. That affects which model years buyers target from Japan, UK, and UAE — and which excise band applies. Always confirm the registration year on the logbook before you commit to a landed cost.`,
  },
  {
    title: "Excise duty on petrol, diesel, and hybrids",
    body: `Excise scales with engine capacity: smaller CC bands pay lower rates; hybrids and electric vehicles can qualify for reduced excise. Our estimator picks the band automatically from the vehicle you select — useful when comparing a 1.5L hatchback against a 2.8L diesel SUV.`,
  },
  {
    title: "After your estimate — find the car",
    body: `Every calculation links to matching inventory from verified dealers on Welsh Motorhub. Filter by make, model, and location, then contact the dealer directly — no middleman markup on the listing price.`,
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
