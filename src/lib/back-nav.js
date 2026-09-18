// src/lib/back-nav.js
// Tiny shared tracker so client components can tell whether the current
// navigation came from the browser Back/Forward buttons (popstate) rather
// than a fresh link click.
//
// The `popstate` event fires BEFORE the target route's components mount,
// so a per-component ref can't see it — that's why this state is module
// level. Consumers:
//   - ScrollToTop: skip the forced scroll-to-top on back/forward so the
//     router can restore the previous scroll position.
//   - CarsInfiniteGrid: restore the cached result list + scroll position
//     when the listing re-mounts after a back navigation.

let pendingPopTarget = null;
let lightboxOpen = false;

// Called by ImageGallery when the image lightbox opens. The lightbox pushes
// a same-URL history entry, so the pop that closes it must not be treated
// as a route back/forward navigation.
export function markLightboxOpen() {
  lightboxOpen = true;
}

export function markLightboxClose() {
  lightboxOpen = false;
}

// Installed once as a global `popstate` listener (in ScrollToTop).
export function onGlobalPop() {
  if (lightboxOpen) {
    // This pop just closed the image lightbox — same URL, not a route nav.
    lightboxOpen = false;
    return;
  }
  pendingPopTarget = window.location.pathname + window.location.search;
}

// Read (and clear) the URL the browser just popped to. Returns null when
// the current mount was NOT preceded by a route back/forward navigation.
export function takePopTarget() {
  const target = pendingPopTarget;
  pendingPopTarget = null;
  return target;
}

// Discard any pending marker. The grid calls this when it is alive at pop
// time (the route was restored from the router cache, so Next.js handles
// the scroll restoration itself and no marker should survive for later).
export function clearPopTarget() {
  pendingPopTarget = null;
}
