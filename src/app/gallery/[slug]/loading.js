export default function GalleryPostLoading() {
  return (
    <div className="home-shell min-h-screen py-8 sm:py-12 animate-pulse">
      {/* Back link skeleton */}
      <div className="h-4 w-36 bg-slate-200 rounded mb-8" />

      {/* Hero image */}
      <div className="relative w-full aspect-[21/9] rounded-xl overflow-hidden mb-8 bg-slate-200" />

      {/* Title */}
      <div className="h-8 w-2/3 bg-slate-200 rounded mb-2" />
      <div className="h-4 w-48 bg-slate-100 rounded mb-6" />

      {/* Description */}
      <div className="space-y-2 mb-8">
        <div className="h-4 w-full bg-slate-100 rounded" />
        <div className="h-4 w-5/6 bg-slate-100 rounded" />
        <div className="h-4 w-3/4 bg-slate-100 rounded" />
      </div>

      {/* Gallery grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="aspect-[4/3] bg-slate-200 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
