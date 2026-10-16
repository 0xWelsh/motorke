// Skeleton for the car detail route.
//
// Shared by two call sites:
//   - app/cars/[id]/loading.js  — once App Router starts streaming the route
//   - CarNavOverlay             — painted the instant a card is clicked, so
//                                 there is no dead time before the skeleton
//
// Pure presentational markup: no hooks, no data, safe to render anywhere.

export default function CarDetailSkeleton() {
  return (
    <div className="bg-[var(--bg)] min-h-screen pb-24 lg:pb-16 animate-pulse">
      <div className="container mx-auto px-4 sm:px-6 max-w-[1475px] pt-3 sm:pt-4 pb-16 lg:pb-24">
        {/* Breadcrumb skeleton */}
        <div className="flex items-center gap-2 mb-4 sm:mb-5">
          <div className="h-8 w-8 rounded-xl bg-slate-200" />
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-12 bg-slate-200 rounded" />
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <div className="h-3 w-14 bg-slate-200 rounded" />
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <div className="h-3 w-24 bg-slate-200 rounded" />
          </div>
        </div>

        {/* Title + meta skeleton */}
        <div className="h-8 w-3/4 max-w-xl bg-slate-200 rounded-lg" />
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
          {[70, 80, 100, 90, 110, 120].map((w, i) => (
            <div key={i} style={{ width: w }} className="h-3 bg-slate-200 rounded" />
          ))}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* Gallery column */}
          <div className="lg:col-span-6 xl:col-span-5 min-w-0 space-y-4">
            <div className="aspect-[4/3] bg-slate-200 rounded-xl" />
            <div className="flex gap-1.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="h-14 w-20 bg-slate-200 rounded-lg" />
              ))}
            </div>
            <div className="h-8 w-full bg-slate-200 rounded-xl" />
            <div className="h-10 w-1/2 bg-slate-200 rounded-xl" />
          </div>

          {/* Specs column */}
          <div className="lg:col-span-6 xl:col-span-4 min-w-0 space-y-5">
            <div className="bg-white border border-slate-100 rounded-xl p-5 space-y-3">
              <div className="h-3 w-24 bg-slate-200 rounded" />
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between py-1.5">
                  <div className="h-3 w-20 bg-slate-200 rounded" />
                  <div className="h-3 w-28 bg-slate-200 rounded" />
                </div>
              ))}
            </div>
            <div className="bg-white border border-slate-100 rounded-xl p-5 space-y-2">
              <div className="h-3 w-24 bg-slate-200 rounded mb-4" />
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-3 w-full bg-slate-100 rounded" />
              ))}
            </div>
          </div>

          {/* Price/contact column */}
          <div className="lg:col-span-12 xl:col-span-3 min-w-0 space-y-5">
            <div className="bg-white border border-slate-100 rounded-xl p-5 space-y-4">
              <div className="h-3 w-10 bg-slate-200 rounded" />
              <div className="h-8 w-40 bg-slate-200 rounded-lg" />
              <div className="h-12 bg-slate-100 rounded-xl" />
              <div className="h-12 bg-slate-100 rounded-xl" />
            </div>
            <div className="bg-white border border-slate-100 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-slate-200" />
                <div className="h-4 w-36 bg-slate-200 rounded" />
              </div>
              <div className="h-3 w-full bg-slate-100 rounded" />
              <div className="h-3 w-2/3 bg-slate-100 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}