import {
  Activity,
  CalendarDays,
  CarFront,
  Clock3,
  MapPin,
  ShieldCheck,
  Star,
} from "lucide-react";

/**
 * Dealer identity block for the showroom banner.
 * @param {"mobile" | "desktop"} variant — mobile sits inside the banner; desktop in the glass card.
 */
export default function DealerProfileHeroPanel({
  dealer,
  dealerSummary,
  startedYear,
  lastActiveLabel,
  isActiveToday,
  averageRating,
  totalReviews,
  responseTimeLabel,
  yearsActive,
  stockCount,
  variant = "desktop",
}) {
  const mobile = variant === "mobile";

  const nameCls = mobile
    ? "text-lg font-black tracking-tight leading-tight text-white"
    : "text-xl sm:text-2xl lg:text-[1.75rem] font-black text-white tracking-tight leading-tight";

  const metaCls = mobile
    ? "flex flex-wrap items-center gap-x-2 gap-y-1 text-[9px] font-bold uppercase tracking-[0.1em] text-white/90"
    : "flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white/80";

  const summaryCls = mobile
    ? "mt-1.5 text-[11px] font-medium leading-snug text-white/90 line-clamp-2"
    : "mt-2 text-[13px] sm:text-sm text-white/85 leading-relaxed line-clamp-2";

  const pillCls = mobile
    ? "inline-flex items-center gap-1 bg-glass/15 border border-white/20 px-2 py-0.5 text-[9px] font-black text-white"
    : "inline-flex items-center gap-1.5 bg-glass/10 border border-white/15 px-2.5 py-1 text-[10px] font-black text-white";

  const dotCls = mobile ? "text-white/40" : "text-white/30";
  const accentIcon = mobile ? "text-[#4ade80]" : "text-accent";

  return (
    <div className={`flex gap-2.5 sm:gap-3 items-start ${mobile ? "" : "flex-col sm:flex-row sm:gap-4"}`}>
      <div
        className={`relative shrink-0 ${
          mobile ? "w-12 h-12" : "w-16 h-16 sm:w-[72px] sm:h-[72px]"
        } ${
          dealer.verified
            ? "p-[2px] bg-gradient-to-br from-[#22c55e] via-[#16a34a] to-emerald-700 shadow-[0_0_20px_-6px_rgba(34,197,94,0.5)]"
            : "p-[2px] bg-glass/10"
        }`}
        style={{ borderRadius: mobile ? "10px" : "12px" }}
      >
        <div
          className="w-full h-full bg-[#1c1c1c] p-1.5 flex items-center justify-center overflow-hidden"
          style={{ borderRadius: mobile ? "8px" : "10px" }}
        >
          {dealer.logoUrl ? (
            <img src={dealer.logoUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className={`font-black text-zinc-400 ${mobile ? "text-lg" : "text-2xl"}`}>
              {dealer.name[0]}
            </span>
          )}
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5 mb-1">
          <h1 className={nameCls}>{dealer.name}</h1>
          {dealer.verified && (
            <span
              className={`inline-flex items-center gap-0.5 text-[9px] font-black uppercase tracking-[0.12em] border ${
                mobile
                  ? "bg-accent/20 text-[#bbf7d0] border-[#22c55e]/40"
                  : "bg-accent/15 text-accent border-[#22c55e]/40"
              } px-1.5 py-0.5`}
              style={{ borderRadius: "999px" }}
            >
              <ShieldCheck className="w-2.5 h-2.5" /> Verified
            </span>
          )}
        </div>

        <div className={metaCls}>
          <span className="inline-flex items-center gap-0.5">
            <MapPin className={`w-2.5 h-2.5 ${accentIcon}`} /> {dealer.location || dealer.county}
          </span>
          <span className={dotCls} aria-hidden>
            ·
          </span>
          <span className="inline-flex items-center gap-0.5">
            <CalendarDays className={`w-2.5 h-2.5 ${accentIcon}`} /> Since {startedYear}
          </span>
          <span className={dotCls} aria-hidden>
            ·
          </span>
          <span className="inline-flex items-center gap-1">
            {isActiveToday ? (
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
              </span>
            ) : (
              <Activity className={`w-2.5 h-2.5 ${mobile ? "text-white/60" : "text-white/50"}`} />
            )}
            {lastActiveLabel}
          </span>
        </div>

        <p className={summaryCls}>{dealerSummary}</p>

        <div className={`flex flex-wrap items-center gap-1 ${mobile ? "mt-2" : "mt-3 sm:gap-2"}`}>
          <span className={pillCls} style={{ borderRadius: "999px" }}>
            <Star className="w-2.5 h-2.5 text-amber-400" fill="currentColor" />
            <span className="tabular-nums">{averageRating > 0 ? averageRating.toFixed(1) : "—"}</span>
            <span className="opacity-70 font-bold">({totalReviews})</span>
          </span>
          <span className={`${pillCls} uppercase tracking-[0.08em]`} style={{ borderRadius: "999px" }}>
            <Clock3 className={`w-2.5 h-2.5 ${accentIcon}`} />
            {responseTimeLabel}
          </span>
          <span className={`${pillCls} uppercase tracking-[0.08em]`} style={{ borderRadius: "999px" }}>
            <CarFront className={`w-2.5 h-2.5 ${accentIcon}`} />
            <span className="tabular-nums normal-case">{stockCount}</span> stock
          </span>
          <span className={`${pillCls} uppercase tracking-[0.08em]`} style={{ borderRadius: "999px" }}>
            <span className="tabular-nums normal-case">{yearsActive}+</span> yrs
          </span>
        </div>
      </div>
    </div>
  );
}
