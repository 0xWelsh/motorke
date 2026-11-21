// Root-level Suspense fallback for route navigations.
//
// This used to be an opaque `fixed inset-0 z-[200]` dark overlay, which
// replaced the whole viewport — navbar included — with a black screen on any
// navigation that wasn't prefetched. That reads as "the click didn't work".
//
// Now it paints a thin progress bar pinned under the navbar and a soft content
// skeleton underneath it, so the chrome stays usable and the user can see that
// something is happening.
export default function RootLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading"
      className="w-full"
    >
      {/* Indeterminate progress bar — anchored to the top of the content area so
          it never covers the sticky navbar or intercepts clicks. */}
      <div className="sticky top-[var(--nav-h,56px)] z-[90] h-0.5 w-full overflow-hidden bg-transparent">
        <div className="h-full w-1/3 rounded-full bg-[var(--accent)] animate-navbar-progress" />
      </div>

      {/* Content skeleton — mirrors the page shape without hiding anything. */}
      <div className="home-shell py-6">
        <div className="skeleton-shimmer h-8 w-56 rounded-lg" />
        <div className="mt-4 skeleton-shimmer h-4 w-80 max-w-full rounded-lg" />
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i}>
              <div className="skeleton-shimmer aspect-[16/10] w-full rounded-xl" />
              <div className="mt-3 skeleton-shimmer h-4 w-3/4 rounded-lg" />
              <div className="mt-2 skeleton-shimmer h-3 w-1/2 rounded-lg" />
            </div>
          ))}
        </div>
      </div>

      <span className="sr-only">Loading…</span>
    </div>
  );
}