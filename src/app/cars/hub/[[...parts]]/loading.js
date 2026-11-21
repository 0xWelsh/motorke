export default function CarHubLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse">
      {/* Breadcrumb skeleton */}
      <div className="h-4 w-64 bg-surface-overlay bg-zinc-800 rounded mb-8" />

      {/* Title & description skeleton */}
      <div className="h-8 w-1/2 bg-surface-overlay bg-zinc-800 rounded mb-3" />
      <div className="h-4 w-3/4 bg-surface-overlay bg-zinc-800/50 rounded mb-2" />
      <div className="h-4 w-2/3 bg-surface-overlay bg-zinc-800/50 rounded mb-10" />

      {/* Filter bar skeleton */}
      <div className="flex gap-3 mb-8 p-4 bg-surface-hover border border-border rounded-sm">
        {[160, 140, 120, 110, 100].map((w, i) => (
          <div key={i} style={{ width: w }} className="h-9 bg-surface-overlay bg-zinc-800 rounded" />
        ))}
      </div>

      {/* Card grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="bg-surface border border-border rounded-sm overflow-hidden">
            <div className="aspect-[16/11] bg-surface-overlay bg-zinc-800" />
            <div className="p-3 space-y-2">
              <div className="h-4 bg-surface-overlay bg-zinc-800 rounded w-3/4" />
              <div className="h-3 bg-surface-overlay bg-zinc-800/50 rounded w-1/2" />
              <div className="flex gap-2 mt-2">
                <div className="h-5 w-16 bg-surface-overlay bg-zinc-800/50 rounded" />
                <div className="h-5 w-14 bg-surface-overlay bg-zinc-800/50 rounded" />
              </div>
              <div className="h-4 w-24 bg-surface-overlay bg-zinc-800 rounded mt-2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
