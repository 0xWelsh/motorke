import Link from "next/link";
import { ShieldCheck, Building2, RefreshCw, Calculator } from "lucide-react";

function formatCount(value) {
  const n = Math.max(0, Number(value) || 0);
  if (n >= 1000) return `${n.toLocaleString("en-KE")}+`;
  return `${n}+`;
}

export default function HomepageHeroTrustMetrics({
  listingCount = 0,
  dealerCount = 0,
  className = "",
}) {
  const metrics = [
    {
      icon: ShieldCheck,
      value: formatCount(listingCount),
      label: "Verified listings",
    },
    {
      icon: Building2,
      value: formatCount(dealerCount),
      label: "Trusted dealers",
    },
    {
      icon: RefreshCw,
      value: "Daily",
      label: "Updated daily",
    },
    {
      icon: Calculator,
      value: "Transparent",
      label: "Duty costs",
      href: "/duty",
    },
  ];

  return (
    <div
      className={`grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 ${className}`}
      aria-label="Marketplace trust metrics"
    >
      {metrics.map(({ icon: Icon, value, label, href }) => {
        const inner = (
          <>
            <div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15">
              <Icon className="h-4 w-4 text-[#6ee7a8]" aria-hidden />
            </div>
            <p className="text-lg sm:text-xl font-bold text-white tracking-tight leading-none">
              {value}
            </p>
            <p className="mt-1.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
              {label}
            </p>
          </>
        );

        const cardClass =
          "group flex flex-col items-center text-center rounded-xl border border-white/10 bg-white/[0.06] px-3 py-3.5 sm:py-4 backdrop-blur-md shadow-[0_8px_32px_-12px_rgba(0,0,0,0.45)] transition-all hover:border-[#38A169]/35 hover:bg-white/[0.09]";

        if (href) {
          return (
            <Link key={label} href={href} className={`${cardClass} hover:shadow-[0_12px_40px_-12px_rgba(56,161,105,0.25)]`}>
              {inner}
            </Link>
          );
        }

        return (
          <div key={label} className={cardClass}>
            {inner}
          </div>
        );
      })}
    </div>
  );
}
