// Route skeleton shown while /cars fetches on the server.
const bar = "animate-pulse rounded bg-slate-200/80";

export default function CarsLoading() {
  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-10 sm:px-6 lg:px-8">
      <div className={`mb-2 h-9 w-40 ${bar}`} />
      <div className={`mb-8 h-4 w-56 ${bar}`} />

      <div className="mb-8 rounded-xl border border-[var(--border)] bg-surface p-4">
        <div className="flex gap-3">
          {[180, 140, 130, 120, 110, 110].map((w, i) => (
            <div key={i} style={{ width: w }} className={`h-10 flex-shrink-0 rounded-lg ${bar}`} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 14 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-[var(--border)] bg-surface">
            <div className={`aspect-[16/10] ${bar}`} />
            <div className="space-y-2 p-4">
              <div className={`h-4 w-3/4 rounded ${bar}`} />
              <div className={`h-3 w-1/2 rounded ${bar}`} />
              <div className="mt-3 flex gap-2">
                <div className={`h-5 w-16 rounded ${bar}`} />
                <div className={`h-5 w-14 rounded ${bar}`} />
              </div>
              <div className="mt-2 flex items-center justify-between">
                <div className={`h-5 w-28 rounded ${bar}`} />
                <div className={`h-3 w-20 rounded ${bar}`} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
