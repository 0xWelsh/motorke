export default function GalleryLoading() {
  return (
    <div className="home-shell min-h-screen py-8 sm:py-12 animate-pulse">
      <div className="h-3 w-20 bg-slate-200 rounded mb-2" />
      <div className="h-10 w-72 bg-slate-200 rounded mb-3" />
      <div className="h-5 w-96 bg-slate-100 rounded mb-10" />

      {/* Magazine cover skeleton */}
      <div className="mb-12 sm:mb-16 max-w-xs">
        <div className="h-4 w-40 bg-slate-200 rounded mb-3" />
        <div className="aspect-[3/4] bg-slate-200 rounded-xl" />
      </div>

      {/* Section title */}
      <div className="h-4 w-36 bg-slate-200 rounded mb-6" />

      {/* Event cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-slate-100 rounded-xl overflow-hidden">
            <div className="aspect-[16/10] bg-slate-200" />
            <div className="p-4 space-y-2">
              <div className="h-4 w-3/4 bg-slate-200 rounded" />
              <div className="h-3 w-1/2 bg-slate-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
