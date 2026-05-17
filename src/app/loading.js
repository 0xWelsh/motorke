/**
 * Root-level loading splash.
 * Minimal: favicon in a circle, centered on the viewport.
 */
export default function RootLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading Welsh Motorhub"
      className="fixed inset-0 z-[200] flex items-center justify-center bg-white dark:bg-[#0a0a0a]"
    >
      <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white ring-1 ring-slate-200 shadow-sm dark:bg-[#111] dark:ring-slate-800">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/favicon.png"
          alt="Welsh Motorhub"
          width={48}
          height={48}
          className="h-12 w-12 object-contain"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-[-6px] rounded-full border-2 border-transparent border-t-[#2F855A] animate-spin"
        />
      </div>
      <span className="sr-only">Loading Welsh Motorhub</span>
    </div>
  );
}
