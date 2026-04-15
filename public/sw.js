/* 
  Motorke Service Worker
  Provides offline capability and caching for faster loads
  
  Strategy: Cache-first for static assets, network-first for API calls
*/

const CACHE_NAME = "motorke-v1";
const RUNTIME_CACHE = "motorke-runtime-v1";

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

  // Don't cache auth requests or external APIs
  if (
    url.pathname.includes("/api/auth") ||
    url.pathname.includes("/api/session") ||
    url.origin !== self.location.origin
  ) {
    event.respondWith(fetch(request));
    return;
  }

  // API calls: network-first, fallback to cache
  if (url.pathname.includes("/api/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response.status === 200) {
            const cache = caches.open(RUNTIME_CACHE);
            cache.then((c) => c.put(request, response.clone()));
          }
          return response;
        })
        .catch(() => {
          // Return cached version if offline
          return caches.match(request);
        })
    );
    return;
  }

  // Static assets: cache-first, fallback to network
  event.respondWith(
    caches.match(request).then((response) => {
      if (response) {
        return response;
      }

      return fetch(request).then((response) => {
        // Cache successful responses
        if (response.status === 200 && request.method === "GET") {
          const cache = caches.open(RUNTIME_CACHE);
          cache.then((c) => c.put(request, response.clone()));
        }
        return response;
      });
    })
  );
});

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
    body: data.body || "You have a new notification from Motorke",
    icon: "/headerlogo.png",
    badge: "/favicon.svg",
    tag: "motorke-notification",
  };

  event.waitUntil(self.registration.showNotification(data.title || "Motorke", options));
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
