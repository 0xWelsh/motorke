import { Check } from "lucide-react";
import { meaningfulFeatureList } from "@/lib/car-display";

export default function FeatureList({ features, className = "" }) {
  const list = meaningfulFeatureList(features);
  if (!list.length) return null;

  return (
    <div className="relative">
      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-zinc-800 hidden sm:block" aria-hidden />
      <ul
        className={`grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 ${className}`}
        aria-label="Vehicle features"
      >
        {list.map((feature, index) => (
          <li
            key={`${index}-${feature}`}
            className="flex items-center gap-2 text-[13px] sm:text-[14px] leading-snug text-zinc-200"
          >
            <Check className="w-4 h-4 shrink-0 text-[var(--accent)]" aria-hidden />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
