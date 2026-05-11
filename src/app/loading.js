/**
 * Root-level loading splash.
 * Shown by Next.js during initial page streaming and route transitions.
 * Kept lightweight on purpose so it never delays real content.
 */
export default function RootLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading Welsh Motorhub"
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-white dark:bg-[#0a0a0a]"
    >
      <div className="flex flex-col items-center gap-5 px-6 text-center">
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/headerlogo.png"
            alt="Welsh Motorhub"
            width={140}
            height={140}
            className="h-20 w-20 sm:h-24 sm:w-24 object-contain"
          />
        </div>
        <div className="flex flex-col items-center gap-3">
          <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.32em] text-slate-900 dark:text-white">
            Welsh Motorhub
          </span>
          <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
            Kenya · verified dealer inventory
          </span>
        </div>
        <div
          aria-hidden
          className="mt-1 h-[3px] w-40 sm:w-52 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
        >
          <div className="h-full w-1/3 animate-[wmh_loading_bar_1.1s_ease-in-out_infinite] bg-[#2F855A]" />
        </div>
      </div>

      {/* Keyframes inline so we don't depend on a global stylesheet rule */}
      <style>{`
        @keyframes wmh_loading_bar {
          0%   { transform: translateX(-120%); }
          50%  { transform: translateX(60%); }
          100% { transform: translateX(220%); }
        }
        @media (prefers-reduced-motion: reduce) {
          [aria-label="Loading Welsh Motorhub"] .h-full { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
