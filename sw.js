const CACHE = "tripspend-v6.8.0-ai1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css?v=6.8.0",
  "./dashboard.css?v=6.8.0",
  "./app.js?v=6.8.0",
  "./fx.js?v=6.8.0",
  "./v5.js?v=6.8.0",
  "./ai.js?v=6.8.0",
  "./manifest.webmanifest?v=6.8.0",
  "./version.json",
  "./icons/icon-96.png",
  "./icons/icon-180.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

async function withTripSpendAI(response) {
  if (!response || !response.ok) return response;
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) return response;

  const html = await response.text();
  if (html.includes("ai.js?v=6.8.0")) {
    return new Response(html, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });
  }

  const injected = html.replace(
    "</body>",
    "<script src=\"./ai.js?v=6.8.0\"></script>\n</body>"
  );
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  headers.set("content-type", "text/html; charset=utf-8");
  headers.set("cache-control", "no-store");

  return new Response(injected, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

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
          return withTripSpendAI(response);
        }

        return response;
      } catch {
        if (request.mode === "navigate") {
          const cached = await caches.match("./index.html");
          return cached ? withTripSpendAI(cached) : new Response("TripSpend is unavailable offline.", { status: 503 });
        }
        return caches.match("./version.json");
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