/* 
  Welsh Motors Service Worker
  Provides offline capability and caching for faster loads
  
  Strategy: Cache-first for static assets, network-first for API calls
*/

const CACHE_NAME = "welsh-motors-v3";
const RUNTIME_CACHE = "welsh-motors-runtime-v3";
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
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log("[SW] Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: implement caching strategy
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Never let SW return a rejected/non-Response promise.
  event.respondWith(
    (async () => {
      try {
        // Let browser handle cross-origin requests (avoids CSP/SW fetch errors).
        if (url.origin !== self.location.origin) {
          return await fetch(request);
        }

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

// Push notifications (if implemented later)
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const options = {
    body: data.body || "You have a new notification from Welsh Motors",
    icon: "/headerlogo.png",
    badge: "/favicon.png",
    tag: "welsh-motors-notification",
  };

  event.waitUntil(self.registration.showNotification(data.title || "Welsh Motors", options));
});

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      for (let i = 0; i < clientList.length; i++) {
        if (clientList[i].url === "/" && "focus" in clientList[i]) {
          return clientList[i].focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow("/");
      }
    })
  );
});

console.log("[SW] Service Worker loaded");
