import { ArrowRight, GitCompare } from "lucide-react";
import Link from "next/link";

const FALLBACK_COMPARISONS = [
  { label: "Toyota Voxy vs Nissan Serena", slug: "nissan-serena-vs-toyota-voxy" },
  { label: "Mazda CX-5 vs Toyota RAV4", slug: "mazda-cx-5-vs-toyota-rav4" },
  { label: "Toyota Harrier vs Nissan X-Trail", slug: "nissan-x-trail-vs-toyota-harrier" },
  { label: "Toyota Prado vs Mitsubishi Pajero", slug: "mitsubishi-pajero-vs-toyota-prado" },
];

export default function HomepageCompareDiscovery({ comparisons = [] }) {
  const displayItems = comparisons.length > 0 ? comparisons.slice(0, 4) : FALLBACK_COMPARISONS;

  return (
    <section className="py-12 sm:py-16 bg-[#080808] border-t border-white/[0.06]">
      <div className="home-shell">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 sm:mb-10">
          <div className="max-w-2xl">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Popular <span className="text-[var(--accent)]">Comparisons</span>
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base font-medium">
              Don't buy blind. See how Kenya's most popular models stack up in running costs, ground clearance, and reliability.
            </p>
          </div>
          <Link
            href="/compare"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white hover:text-[var(--accent)] transition-colors"
          >
            Start your own compare <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {displayItems.map((cmp) => (
            <Link
              key={cmp.slug}
              href={`/compare/${cmp.slug}`}
              className="group p-5 bg-[#0f0f0f] border border-white/[0.06] hover:border-[var(--accent)]/40 hover:bg-[#111111] transition-all rounded-xl"
            >
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 group-hover:text-[var(--accent)] mb-2 transition-colors">Head to Head</p>
              <h3 className="text-sm sm:text-base font-bold text-white leading-tight">
                {cmp.label || cmp.title}
              </h3>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity">View Verdict</span>
                <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
