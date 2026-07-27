export default function RootLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading Motorke"
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#1c1c1c]"
    >
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-brand-accent animate-bounce [animation-delay:0ms]" />
        <span className="w-2.5 h-2.5 rounded-full bg-brand-accent animate-bounce [animation-delay:150ms]" />
        <span className="w-2.5 h-2.5 rounded-full bg-brand-accent animate-bounce [animation-delay:300ms]" />
      </div>

      <p className="mt-8 text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-600">
        Loading
      </p>

      <span className="sr-only">Loading Motorke</span>
    </div>
  );
}
