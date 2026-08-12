const CACHE = "tripspend-v4.4.0";
const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css?v=4.4.0",
  "./app.js?v=4.4.0",
  "./fx.js?v=4.4.0",
  "./manifest.webmanifest?v=4.4.0",
  "./version.json",
  "./icons/icon-96.png",
  "./icons/icon-180.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // External live exchange requests are handled by fx.js.
  if (url.origin !== self.location.origin) return;

  // Always check the network for the app document/version when online.
  if (request.mode === "navigate" || url.pathname.endsWith("/version.json")) {
    event.respondWith(
      fetch(request, { cache: "no-store" })
        .then(response => {
          if (request.mode === "navigate" && response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then(cache => cache.put("./index.html", copy));
          }
          return response;
        })
        .catch(() => request.mode === "navigate"
          ? caches.match("./index.html")
          : caches.match("./version.json"))
    );
    return;
  }

  // Versioned app assets are cache-first. A new release uses new query URLs.
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});
