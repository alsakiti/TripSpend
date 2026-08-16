const CACHE = "tripspend-v6.8.4-ai2";
const APP_VERSION = "6.8.4";
const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css?v=6.8.4",
  "./dashboard.css?v=6.8.4",
  "./fx.js?v=6.8.4",
  "./v5.js?v=6.8.4",
  "./ai-v684.js?v=6.8.4-ai2",
  "./manifest.webmanifest?v=6.8.4",
  "./version.json",
  "./icons/icon-96.png",
  "./icons/icon-180.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

function htmlResponse(response, html) {
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  headers.set("content-type", "text/html; charset=utf-8");
  headers.set("cache-control", "no-store");
  return new Response(html, { status: response.status, statusText: response.statusText, headers });
}

async function upgradeHtml(response) {
  if (!response || !response.ok) return response;
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) return response;
  let html = await response.text();
  html = html.replaceAll("v6.8.1", "v6.8.4").replaceAll("?v=6.8.1", "?v=6.8.4");
  html = html.replace(/<script[^>]+ai\.js[^>]*><\/script>\s*/gi, "");
  if (!html.includes("ai-v684.js")) {
    const aiBoot = `<script>window.__tsNativeMO=window.MutationObserver;window.MutationObserver=class{observe(){}disconnect(){}takeRecords(){return[]}}</script>\n<script src="./ai-v684.js?v=6.8.4-ai2"></script>\n<script>window.MutationObserver=window.__tsNativeMO;delete window.__tsNativeMO</script>\n`;
    html = html.replace("</body>", aiBoot + "</body>");
  }
  return htmlResponse(response, html);
}

async function upgradeAppJs(response) {
  if (!response || !response.ok) return response;
  let js = await response.text();
  js = js.replace('const APP_VERSION = "6.8.3";', 'const APP_VERSION = "6.8.4";');
  js = js.replace(/\.\/sw\.js\?v=[^"']+/g, "./sw.js?v=6.8.4-ai2");
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  headers.set("content-type", "text/javascript; charset=utf-8");
  headers.set("cache-control", "no-store");
  return new Response(js, { status: response.status, statusText: response.statusText, headers });
}

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith("tripspend-") && k !== CACHE).map(k => caches.delete(k)));
    if (self.registration.navigationPreload) await self.registration.navigationPreload.enable().catch(() => {});
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const isVersion = url.pathname.endsWith("/version.json");
  const isAiConfig = url.pathname.endsWith("/ai-config.json");
  const isAppJs = url.pathname.endsWith("/app.js");
  const isEnhancedAi = url.pathname.endsWith("/ai-v684.js");

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = (await event.preloadResponse) || await fetch(request, { cache: "no-store" });
        if (response.ok) caches.open(CACHE).then(cache => cache.put("./index.html", response.clone()));
        return upgradeHtml(response);
      } catch {
        const cached = await caches.match("./index.html");
        return cached ? upgradeHtml(cached) : new Response("TripSpend is unavailable offline.", { status: 503 });
      }
    })());
    return;
  }

  if (isAppJs) {
    event.respondWith((async () => {
      try {
        const response = await fetch(request, { cache: "no-store" });
        const upgraded = await upgradeAppJs(response);
        if (upgraded.ok) caches.open(CACHE).then(cache => cache.put(request, upgraded.clone()));
        return upgraded;
      } catch {
        const cached = await caches.match(request);
        return cached || new Response("", { status: 503 });
      }
    })());
    return;
  }

  if (isVersion || isAiConfig || isEnhancedAi) {
    event.respondWith((async () => {
      try {
        const response = await fetch(request, { cache: "no-store" });
        if (response.ok && isEnhancedAi) caches.open(CACHE).then(cache => cache.put(request, response.clone()));
        return response;
      } catch {
        const cached = await caches.match(request);
        if (cached) return cached;
        return new Response(isAiConfig ? "{}" : "", { status: 503, headers: isAiConfig ? { "Content-Type": "application/json" } : {} });
      }
    })());
    return;
  }

  event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
    if (response && response.ok) caches.open(CACHE).then(cache => cache.put(request, response.clone()));
    return response;
  })));
});
