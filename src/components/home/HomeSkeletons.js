// Server-safe light skeletons for streamed homepage sections. Pure CSS
// shimmer (see .skeleton-shimmer in globals.css), no client JS.

function Block({ className = "" }) {
  return <div className={`skeleton-shimmer rounded-lg ${className}`} />;
}

export function HomeHeroSkeleton() {
  return (
    <div className="mt-7">
      <Block className="mb-2 h-3 w-40 max-w-[40%]" />
      <div className="aspect-[4/3] w-full sm:mx-auto sm:max-w-[267px] lg:mx-0 lg:w-[390px] lg:max-w-none overflow-hidden rounded-none sm:rounded-xl lg:h-[292px]">
        <Block className="h-full w-full rounded-none sm:rounded-xl" />
      </div>
      <div className="mt-2.5 flex justify-center gap-1.5">
        <Block className="h-2 w-6 rounded-full" />
        <Block className="h-2 w-2 rounded-full" />
        <Block className="h-2 w-2 rounded-full" />
      </div>
    </div>
  );
}

export function HomeGridsSkeleton({ count = 8, columns = "grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6" }) {
  return (
    <div className="space-y-6 sm:space-y-8">
      {[0, 1].map((section) => (
        <div key={section}>
          <div className="mb-2 flex items-baseline justify-between gap-3 border-b-2 border-slate-100 pb-1.5">
            <Block className="h-3.5 w-40" />
            <Block className="h-6 w-12" />
          </div>
          <div className={`grid gap-2.5 ${columns}`}>
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Block className="aspect-[4/3] w-full rounded-xl" />
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
          <Block className="aspect-[4/3] w-full rounded-xl" />
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