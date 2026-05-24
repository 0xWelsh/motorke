import { ShieldCheck, GitCompare, Building2, MessageCircle } from "lucide-react";

const PILLS = [
  { icon: ShieldCheck, label: "Verified listings" },
  { icon: Building2, label: "Trusted dealers" },
  { icon: GitCompare, label: "Compare & TCO" },
  { icon: MessageCircle, label: "Direct contact" },
];

export default function HomepageHeroTrustPills() {
  return (
    <ul className="flex gap-2 sm:gap-2.5 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar scroll-smooth">
      {PILLS.map(({ icon: Icon, label }) => (
        <li
          key={label}
          className="flex shrink-0 items-center gap-1.5 sm:gap-2 border border-slate-200/90 dark:border-zinc-700 bg-white/90 dark:bg-zinc-900/90 px-2.5 sm:px-3 py-1.5 sm:py-2 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.1em] sm:tracking-[0.12em] text-slate-800 dark:text-slate-100"
          style={{ borderRadius: "var(--radius)" }}
        >
          <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#38A169] shrink-0" aria-hidden />
          {label}
        </li>
      ))}
    </ul>
  );
}
