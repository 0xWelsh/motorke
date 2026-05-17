import { meaningfulFeatureList } from "@/lib/car-display";

/**
 * Static feature list for listing detail pages (no marquee).
 */
export default function FeatureList({ features, className = "" }) {
  const list = meaningfulFeatureList(features);
  if (!list.length) return null;

  return (
    <ul
      className={`overflow-hidden rounded-lg border border-slate-200/90 dark:border-zinc-800 ring-1 ring-black/[0.03] dark:ring-white/[0.04] ${className}`}
      aria-label="Vehicle features"
    >
      {list.map((feature, index) => (
        <li
          key={`${index}-${feature}`}
          className={`px-4 py-3 text-[13px] sm:text-sm font-semibold leading-snug text-slate-800 dark:text-slate-200 border-b border-slate-100/90 dark:border-zinc-800/80 last:border-b-0 ${
            index % 2 === 0
              ? "bg-white dark:bg-[#0a0a0a]"
              : "bg-slate-50/90 dark:bg-zinc-900/55"
          }`}
        >
          {feature}
        </li>
      ))}
    </ul>
  );
}
