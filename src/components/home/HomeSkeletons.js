// Server-safe light skeletons for streamed homepage sections. Pure CSS
// shimmer (see .skeleton-shimmer in globals.css), no client JS.

function Block({ className = "" }) {
  return <div className={`skeleton-shimmer rounded-lg ${className}`} />;
}

export function HomeHeroSkeleton() {
  return (
    <div className="mt-6 sm:mt-8">
      <div className="mb-3 sm:mb-4">
        <Block className="mb-2 h-2.5 w-16" />
        <Block className="h-7 w-32 sm:h-9 sm:w-40" />
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
        <div className="aspect-[16/9] sm:aspect-[16/8] lg:aspect-[16/7]">
          <Block className="h-full w-full rounded-none" />
        </div>
        <div className="grid grid-cols-3 gap-px bg-surface-overlay">
          {[0, 1, 2].map((i) => (
            <div key={i} className="aspect-[16/10] bg-surface">
              <Block className="h-full w-full rounded-none" />
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="space-y-2">
            <Block className="h-6 w-64 sm:h-7 sm:w-80" />
            <Block className="h-4 w-48" />
          </div>
          <div className="flex items-center gap-4">
            <Block className="h-7 w-40 sm:h-8 sm:w-48" />
            <Block className="hidden h-10 w-32 rounded-lg sm:block" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function HomeGridsSkeleton({ count = 8, columns = "grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6" }) {
  return (
    <div className="space-y-6 sm:space-y-8">
      {[0, 1].map((section) => (
        <div key={section}>
          <div className="mb-2 flex items-baseline justify-between gap-3 border-b-2 border-subtle pb-1.5">
            <Block className="h-3.5 w-40" />
            <Block className="h-6 w-12" />
          </div>
          <div className={`grid gap-2.5 ${columns}`}>
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Block className="aspect-[16/10] w-full rounded-xl" />
                <Block className="h-3 w-3/4" />
                <Block className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function HomeTrendingSkeleton({ count = 6 }) {
  return (
    <div className="flex gap-3 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="min-w-0 shrink-0 flex-1 space-y-2">
          <Block className="aspect-[16/10] w-full rounded-xl" />
          <Block className="h-3 w-3/4" />
          <Block className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function HomeSidebarSkeleton() {
  return (
    <div className="space-y-3">
      <Block className="h-32 w-full rounded-xl" />
      <Block className="h-24 w-full rounded-xl" />
      <Block className="h-20 w-full rounded-xl" />
    </div>
  );
}
