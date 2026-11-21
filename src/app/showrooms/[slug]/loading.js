export default function ShowroomLoading() {
  return (
    <div className="bg-surface min-h-screen animate-pulse">
      {/* Banner */}
      <div className="relative w-full h-[35vh] min-h-[240px] bg-surface-overlay" />

      {/* Dealer info bar */}
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl -mt-12 relative z-10 mb-8">
        <div className="flex items-end gap-4">
          <div className="w-24 h-24 rounded-xl bg-surface-overlay border-4 border-white shadow-sm" />
          <div className="pb-2 space-y-2">
            <div className="h-6 w-48 bg-surface-overlay rounded" />
            <div className="h-4 w-32 bg-surface-overlay rounded" />
          </div>
        </div>
      </div>

      {/* Car grid */}
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        <div className="h-5 w-24 bg-surface-overlay rounded mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-surface-overlay rounded-xl overflow-hidden">
              <div className="aspect-[16/10] bg-surface-overlay" />
              <div className="p-4 space-y-2">
                <div className="h-4 w-3/4 bg-surface-overlay rounded" />
                <div className="h-3 w-1/2 bg-surface-overlay rounded" />
                <div className="flex gap-2 mt-2">
                  <div className="h-5 w-16 bg-surface-overlay rounded" />
                  <div className="h-5 w-14 bg-surface-overlay rounded" />
                </div>
                <div className="h-5 w-28 bg-surface-overlay rounded mt-2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
