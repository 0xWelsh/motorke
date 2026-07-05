import { Check } from "lucide-react";
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
          className="flex items-center gap-2 rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/30 px-2.5 py-2 text-[12px] sm:text-[13px] font-semibold leading-snug text-zinc-900 dark:text-white"
        >
          <Check className="w-3.5 h-3.5 shrink-0 text-amber-500 dark:text-amber-400" aria-hidden />
          <span>{feature}</span>
        </li>
      ))}
    </ul>
  );
}
