export default function CarDetailLoading() {
  return (
    <div className="bg-white bg-zinc-950 min-h-screen pb-24 lg:pb-16 animate-pulse">
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl pt-3 sm:pt-4">
        {/* Breadcrumb skeleton */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-full bg-zinc-200 bg-zinc-800" />
          <div className="flex items-center gap-2">
            <div className="h-3 w-12 bg-zinc-200 bg-zinc-800 rounded" />
            <div className="h-3 w-3 bg-zinc-200 bg-zinc-800 rounded" />
            <div className="h-3 w-20 bg-zinc-200 bg-zinc-800 rounded" />
            <div className="h-3 w-3 bg-zinc-200 bg-zinc-800 rounded" />
            <div className="h-3 w-24 bg-zinc-200 bg-zinc-800 rounded" />
          </div>
        </div>

        <div className="lg:grid lg:grid-cols-3 lg:gap-8 xl:gap-10">
          {/* Left column */}
          <div className="lg:col-span-2">
            {/* Gallery skeleton (16:9) */}
            <div className="w-full aspect-video bg-zinc-200 bg-zinc-800 rounded-lg overflow-hidden">
              <div className="w-full h-full bg-zinc-300 bg-zinc-700" />
            </div>

            {/* Thumbnail strip skeleton */}
            <div className="flex gap-1.5 mt-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="w-16 h-12 bg-zinc-200 bg-zinc-800 rounded overflow-hidden" />
              ))}
            </div>

            {/* Title skeleton */}
            <div className="mt-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-3 w-3 bg-zinc-200 bg-zinc-800 rounded" />
                <div className="h-3 w-32 bg-zinc-200 bg-zinc-800 rounded" />
              </div>
              <div className="h-7 w-3/4 bg-zinc-200 bg-zinc-800 rounded" />
            </div>

            {/* Spec chips skeleton */}
            <div className="flex flex-wrap gap-2 mt-4">
              {[80, 100, 70, 90, 110].map((w, i) => (
                <div key={i} style={{ width: w }} className="h-7 bg-zinc-200 bg-zinc-800 rounded-lg" />
              ))}
            </div>

            {/* Description skeleton */}
            <div className="mt-8">
              <div className="h-4 w-24 bg-zinc-200 bg-zinc-800 rounded mb-3" />
              <div className="space-y-2">
                <div className="h-3.5 w-full bg-zinc-100 bg-zinc-800/60 rounded" />
                <div className="h-3.5 w-5/6 bg-zinc-100 bg-zinc-800/60 rounded" />
                <div className="h-3.5 w-4/6 bg-zinc-100 bg-zinc-800/60 rounded" />
              </div>
            </div>

            {/* Specs table skeleton */}
            <div className="mt-8">
              <div className="h-4 w-32 bg-zinc-200 bg-zinc-800 rounded mb-4" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-zinc-100 border-zinc-800/60">
                    <div className="h-3 w-20 bg-zinc-200 bg-zinc-800 rounded" />
                    <div className="h-3 w-28 bg-zinc-200 bg-zinc-800 rounded" />
                  </div>
                ))}
              </div>
            </div>

            {/* Compare + Share skeleton */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="h-[120px] bg-zinc-100 bg-zinc-800/60 rounded-xl" />
              <div className="h-[120px] bg-zinc-100 bg-zinc-800/60 rounded-xl" />
            </div>
          </div>

          {/* Right column - sidebar skeleton */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              {/* Price card skeleton */}
              <div className="bg-white bg-zinc-900 border border-zinc-200 border-zinc-800 rounded-xl p-5 space-y-4">
                <div className="h-8 w-40 bg-zinc-200 bg-zinc-800 rounded" />
                <div className="flex gap-2">
                  <div className="h-3 w-20 bg-zinc-200 bg-zinc-800 rounded" />
                  <div className="h-3 w-24 bg-zinc-200 bg-zinc-800 rounded" />
                </div>
                <div className="h-12 bg-zinc-200 bg-zinc-800 rounded-lg" />
                <div className="h-12 bg-zinc-200 bg-zinc-800 rounded-lg" />
                <div className="space-y-2">
                  <div className="h-10 bg-zinc-100 bg-zinc-800/60 rounded-lg" />
                  <div className="h-10 bg-zinc-100 bg-zinc-800/60 rounded-lg" />
                  <div className="h-10 bg-zinc-100 bg-zinc-800/60 rounded-lg" />
                </div>
                <div className="h-10 bg-zinc-200 bg-zinc-800 rounded-lg" />
              </div>

              {/* Dealer card skeleton */}
              <div className="bg-white bg-zinc-900 border border-zinc-200 border-zinc-800 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-zinc-200 bg-zinc-800" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4 w-24 bg-zinc-200 bg-zinc-800 rounded" />
                    <div className="h-3 w-20 bg-zinc-200 bg-zinc-800 rounded" />
                  </div>
                </div>
                <div className="h-3 w-32 bg-zinc-200 bg-zinc-800 rounded" />
                <div className="h-10 bg-zinc-200 bg-zinc-800 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
