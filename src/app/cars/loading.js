// src/app/cars/loading.js
// Shows while the server fetches car data
export default function CarsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="h-9 w-40 bg-white/5 rounded-lg mb-2 animate-pulse" />
      <div className="h-4 w-56 bg-white/5 rounded mb-10 animate-pulse" />

      {/* Filter bar skeleton */}
      <div className="flex gap-3 mb-10 p-5 bg-white/5 border border-white/10 rounded-2xl">
        {[180, 140, 130, 120, 110, 110].map((w, i) => (
          <div key={i} style={{ width: w }}
            className="h-10 bg-white/5 rounded-xl animate-pulse flex-shrink-0" />
        ))}
      </div>

      {/* Card grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden">
            <div className="aspect-[16/10] bg-white/5 animate-pulse" />
            <div className="p-4 space-y-2">
              <div className="h-4 bg-white/5 rounded animate-pulse w-3/4" />
              <div className="h-3 bg-white/5 rounded animate-pulse w-1/2" />
              <div className="flex gap-2 mt-3">
                <div className="h-5 w-16 bg-white/5 rounded animate-pulse" />
                <div className="h-5 w-14 bg-white/5 rounded animate-pulse" />
              </div>
              <div className="flex justify-between items-center mt-2">
                <div className="h-5 w-28 bg-white/5 rounded animate-pulse" />
                <div className="h-3 w-20 bg-white/5 rounded animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
