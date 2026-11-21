/* 
  Welsh Motorhub Service Worker
  Provides offline capability and caching for faster loads
  
  Strategy: Cache-first for static assets, network-first for API calls
*/

const CACHE_NAME = "welsh-motorhub-v9";
const RUNTIME_CACHE = "welsh-motorhub-runtime-v9";
const R2_IMAGE_CACHE = "welsh-motorhub-r2images-v9";
const MAX_R2_CACHE = 100;
const OFFLINE_FALLBACK = new Response("Offline", {
  status: 503,
  statusText: "Service Unavailable",
  headers: { "Content-Type": "text/plain; charset=utf-8" },
});

// Files to cache on install (essential assets)
const PRECACHE_URLS = [
  "/",
  "/search",
  "/saved",
  "/faq",
  "/contact",
  "/mission",
  "/privacy",
  "/terms",
];

// Install: cache essential files
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Caching essential files");
      return cache.addAll(PRECACHE_URLS).catch(() => {
        console.warn("[SW] Some files couldn't be precached (may be offline)");
      });
    })
  );
  // Skip waiting - activate immediately
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE && cacheName !== R2_IMAGE_CACHE) {
            console.log("[SW] Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Limit cache entries (oldest deleted first).
async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxEntries) {
    const toDelete = keys.slice(0, keys.length - maxEntries);
    await Promise.all(toDelete.map((r) => cache.delete(r)));
  }
}

// Next.js App Router RSC payloads are URL- and navigation-specific. Let the
// browser/router handle them directly: serving one from a generic runtime
// cache makes client-side filter/search navigations silently no-op.
function isNextDataRequest(request, url) {
  return (
    url.searchParams.has("_rsc") ||
    request.headers.get("RSC") != null ||
    request.headers.get("Next-Router-State-Tree") != null ||
    request.headers.get("Next-Router-Prefetch") != null ||
    request.headers.get("Next-Router-Segment-Prefetch") != null ||
    request.headers.get("Next-Url") != null
  );
}

// Fetch: implement caching strategy
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (isNextDataRequest(request, url)) return;

  // Cache R2 images with stale-while-revalidate.
  if (url.hostname.includes("r2.dev")) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        const fetchPromise = fetch(request)
          .then((response) => {
            if (response && response.ok) {
              caches.open(R2_IMAGE_CACHE).then((cache) => {
                trimCache(R2_IMAGE_CACHE, MAX_R2_CACHE);
                cache.put(request, response.clone());
              });
            }
            return response;
          })
          .catch(() => cached || OFFLINE_FALLBACK.clone());
        return cached || (await fetchPromise);
      })()
    );
    return;
  }

  // Don't intercept cross-origin requests — let the browser handle them
  // directly. Intercepting them with fetch() inside the SW triggers CSP
  // connect-src checks and blocks resources (e.g. R2 images, Google Fonts)
  // that are allowed by img-src/style-src but not by connect-src.
  if (url.origin !== self.location.origin) return;

  // Never let SW return a rejected/non-Response promise.
  event.respondWith(
    (async () => {
      try {

        // Navigation/doc requests should be network-first (avoid stale portal/admin shells).
        if (request.mode === "navigate" || request.destination === "document") {
          try {
            return await fetch(request);
          } catch {
            const home = await caches.match("/");
            return home || OFFLINE_FALLBACK.clone();
          }
        }

        // Don't cache non-GET/auth/session requests.
        if (
          request.method !== "GET" ||
          url.pathname.includes("/api/auth") ||
          url.pathname.includes("/api/session")
        ) {
          try {
            return await fetch(request);
          } catch {
            const cached = await caches.match(request);
            return cached || OFFLINE_FALLBACK.clone();
          }
        }

        // API calls: network-first, fallback to cache.
        if (url.pathname.includes("/api/")) {
          try {
            const response = await fetch(request);
            if (response && response.ok && response.type === "basic") {
              const cache = await caches.open(RUNTIME_CACHE);
              try {
                await cache.put(request, response.clone());
              } catch (error) {
                console.warn("[SW] API cache put skipped:", error?.message || error);
              }
            }
            return response;
          } catch {
            const cached = await caches.match(request);
            return cached || OFFLINE_FALLBACK.clone();
          }
        }

        // Static assets/pages: cache-first, fallback to network.
        const cached = await caches.match(request);
        if (cached) return cached;

        try {
          const response = await fetch(request);
          if (response && response.ok && response.type === "basic") {
            const cache = await caches.open(RUNTIME_CACHE);
            try {
              await cache.put(request, response.clone());
            } catch (error) {
              console.warn("[SW] Runtime cache put skipped:", error?.message || error);
            }
          }
          return response;
        } catch {
          const home = await caches.match("/");
          return home || OFFLINE_FALLBACK.clone();
        }
      } catch (error) {
        console.warn("[SW] Global fetch handler fallback:", error?.message || error);
        return OFFLINE_FALLBACK.clone();
      }
    })().catch(() => OFFLINE_FALLBACK.clone())
  );
});

self.addEventListener("fetch-legacy-disabled", () => {});

// Handle background sync (for submissions while offline)
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-enquiry") {
    event.waitUntil(
      // Sync logic would go here
      new Promise((resolve) => {
        console.log("[SW] Syncing enquiry...");
        resolve();
      })
    );
  }
});

// Push notifications
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const options = {
    body: data.body || "You have a new notification from BIDGARI",
    icon: "/icon-512.png",
    badge: "/favicon.png",
    tag: data.tag || "bidgari-notification",
    data: { url: data.url || "/" },
    actions: data.actions || [],
    vibrate: [100, 50, 100],
    requireInteraction: false,
    silent: false,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "BIDGARI", options)
  );
});

// Notification click handler — route to the right page
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // If already open on the target URL, focus it
      for (const client of clientList) {
        if (client.url.includes(new URL(targetUrl, self.location.origin).pathname) && "focus" in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

console.log("[SW] Service Worker loaded");
