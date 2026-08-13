const CACHE = "tripspend-v6.7.5";
const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css?v=6.7.5",
  "./app.js?v=6.7.5",
  "./fx.js?v=6.7.5",
  "./v5.js?v=6.7.5",
  "./manifest.webmanifest?v=6.7.5",
  "./version.json",
  "./icons/icon-96.png",
  "./icons/icon-180.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter(key => key.startsWith("tripspend-") && key !== CACHE)
        .map(key => caches.delete(key))
    );

    if (self.registration.navigationPreload) {
      await self.registration.navigationPreload.enable().catch(() => {});
    }

    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate" || url.pathname.endsWith("/version.json")) {
    event.respondWith((async () => {
      try {
        const response = request.mode === "navigate"
          ? ((await event.preloadResponse) || await fetch(request, { cache: "no-store" }))
          : await fetch(request, { cache: "no-store" });

        if (request.mode === "navigate" && response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put("./index.html", copy));
        }

        return response;
      } catch {
        return request.mode === "navigate"
          ? caches.match("./index.html")
          : caches.match("./version.json");
      }
    })());
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request).then(response => {
      if (response && response.ok) {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(request, copy));
      }
      return response;
    }))
  );
});
