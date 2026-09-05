const APP_VERSION = "7.2.1";
const CACHE = `tripspend-v${APP_VERSION}-r1`;

const APP_SHELL = [
  "./", "./index.html", "./style.css", "./dashboard.css", "./app.js", "./fx.js", "./v5.js",
  "./ai-v684.js", "./locale-v700.js", "./locale-dynamic-v700.js", "./expense-locale-v703.js",
  "./page-locale-v704.js", "./settings-polish-v704.js", "./visual-polish-v704.js",
  "./setup-language-host-v700.js", "./setup-onboarding-v704.js", "./flags-v705.js",
  "./ui-fixes-v705.js", "./receipt-capability-v700.js", "./receipt-ai-v700.js",
  "./ui-foundation-v710.js", "./ai-intelligence-v720.js", "./enhancements-v710.js", "./manifest.webmanifest", "./version.json", "./ai-config.json",
  "./icons/icon-96.png", "./icons/icon-180.png", "./icons/icon-192.png", "./icons/icon-512.png"
];

async function put(cacheKey, response) {
  if (!response?.ok) return response;
  const cache = await caches.open(CACHE);
  await cache.put(cacheKey, response.clone());
  return response;
}

async function networkFirst(request, fallbackKey = request) {
  try {
    return await put(fallbackKey, await fetch(request, { cache:"no-store" }));
  } catch {
    return (await caches.match(fallbackKey)) || new Response("TripSpend is unavailable offline.", { status:503 });
  }
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  const refresh = fetch(request).then(response => put(request, response)).catch(() => null);
  return cached || (await refresh) || new Response("", { status:503 });
}

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.all(APP_SHELL.map(async path => {
      try { await cache.add(new Request(path, { cache:"reload" })); } catch {}
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith("tripspend-") && key !== CACHE).map(key => caches.delete(key)));
    if (self.registration.navigationPreload) await self.registration.navigationPreload.enable().catch(() => {});
    await self.clients.claim();
    const windows = await self.clients.matchAll({ type:"window" });
    windows.forEach(client => client.postMessage({ type:"TRIPSPEND_UPDATE_READY", version:APP_VERSION }));
  })());
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = (await event.preloadResponse) || await fetch(request, { cache:"no-store" });
        return await put("./index.html", response);
      } catch {
        return (await caches.match("./index.html")) || new Response("TripSpend is unavailable offline.", { status:503 });
      }
    })());
    return;
  }

  const path = url.pathname;
  if (path.endsWith("/version.json") || path.endsWith("/ai-config.json") || path.endsWith("/sw.js")) {
    event.respondWith(networkFirst(request));
    return;
  }
  event.respondWith(staleWhileRevalidate(request));
});
