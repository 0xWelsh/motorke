import { meaningfulFeatureList } from "@/lib/car-display";

export default function FeatureList({ features, className = "" }) {
  const list = meaningfulFeatureList(features);
  if (!list.length) return null;

  return (
    <ul
      className={`grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 ${className}`}
      aria-label="Vehicle features"
    >
      {list.map((feature, index) => (
        <li
          key={`${index}-${feature}`}
          className="flex items-center gap-2.5 rounded-md border border-slate-200/85 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/45 px-2.5 py-2 text-[12px] sm:text-[13px] font-semibold leading-snug text-slate-800 dark:text-slate-200"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 shrink-0" aria-hidden />
          <span>{feature}</span>
        </li>
      ))}
    </ul>
  );
}
