import { formatCarPrice } from "@/lib/utils";

export default function ListingPriceBlock({ car, className = "", explainerId = "car-price-explainer" }) {
  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`.trim()}>
      <span className="font-semibold tabular-nums text-white leading-none text-lg sm:text-xl lg:text-2xl">
        {formatCarPrice(car)}
      </span>
      <div className="relative inline-flex shrink-0 group/tooltip">
        <button
          type="button"
          aria-label="Pricing information"
          aria-describedby={explainerId}
          className="relative z-10 inline-flex h-[0.76em] w-[0.76em] min-h-[12px] min-w-[12px] items-center justify-center rounded-full border border-[var(--accent)]/26 bg-[var(--accent)]/[0.06] outline-none ring-offset-2 ring-offset-[#0a0a0a] transition-[background-color,border-color] hover:border-[var(--accent)]/38 hover:bg-[var(--accent)]/12 focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 focus-visible:ring-offset-2"
          style={{ fontSize: "inherit" }}
        >
          <span
            className="font-serif italic font-semibold leading-none text-[0.52em] text-[var(--accent)] select-none"
            aria-hidden
          >
            i
          </span>
        </button>
        <span
          id={explainerId}
          role="tooltip"
          className="pointer-events-none absolute bottom-[calc(100%+10px)] left-1/2 z-20 mb-0 w-max max-w-[min(280px,calc(100vw-3rem))] -translate-x-1/2 rounded-[3px] border border-[var(--accent)]/35 bg-gradient-to-br from-emerald-950/95 to-[#0f172a] px-3.5 py-2 pb-3 text-left text-[11px] font-semibold leading-snug text-emerald-100 shadow-[0_12px_40px_-10px_rgba(0,0,0,0.55)] opacity-0 transition-opacity duration-200 group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100"
        >
          <span className="block text-[9px] font-black uppercase tracking-[0.18em] text-[var(--accent)]">
            Listing price
          </span>
          <span className="mt-1 block font-medium text-emerald-50">
            Price inclusive of all costs
          </span>
          <span
            aria-hidden
            className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-x-[7px] border-x-transparent border-t-[7px] border-t-emerald-900/90"
          />
        </span>
      </div>
    </div>
  );
}
