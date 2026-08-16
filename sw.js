const CACHE = "tripspend-v6.8.9-labels1";
const APP_VERSION = "6.8.9";
const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css?v=6.8.9",
  "./dashboard.css?v=6.8.9",
  "./fx.js?v=6.8.9",
  "./v5.js?v=6.8.9",
  "./ai-v684.js?v=6.8.4-ai3",
  "./i18n.js?v=6.8.9-labels1",
  "./i18n-layout-fix.js?v=6.8.9-labels1",
  "./rtl-polish-v687.js?v=6.8.9-labels1",
  "./lang-flag.js?v=6.8.9-labels1",
  "./setup-lang-v688.js?v=6.8.9-labels1",
  "./budget-labels-v689.js?v=6.8.9-labels1",
  "./manifest.webmanifest?v=6.8.9",
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
  html = html
    .replaceAll("v6.8.1", "v6.8.9")
    .replaceAll("?v=6.8.1", "?v=6.8.9");

  html = html.replace(/<script[^>]+ai\.js[^>]*><\/script>\s*/gi, "");

  if (!html.includes("ai-v684.js")) {
    const aiBoot = `<script>window.__tsNativeMO=window.MutationObserver;window.MutationObserver=class{observe(){}disconnect(){}takeRecords(){return[]}}</script>\n<script src="./ai-v684.js?v=6.8.4-ai3"></script>\n<script>(()=>{const restore=()=>{if(window.__tsNativeMO){window.MutationObserver=window.__tsNativeMO;delete window.__tsNativeMO}};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',restore,{once:true});else restore()})()</script>\n`;
    html = html.replace("</body>", aiBoot + "</body>");
  }

  if (!html.includes("i18n.js")) {
    html = html.replace("</body>", `<script src="./i18n.js?v=6.8.9-labels1"></script>\n</body>`);
  }
  if (!html.includes("i18n-layout-fix.js")) {
    html = html.replace("</body>", `<script src="./i18n-layout-fix.js?v=6.8.9-labels1"></script>\n</body>`);
  }
  if (!html.includes("rtl-polish-v687.js")) {
    html = html.replace("</body>", `<script src="./rtl-polish-v687.js?v=6.8.9-labels1"></script>\n</body>`);
  }
  if (!html.includes("lang-flag.js")) {
    html = html.replace("</body>", `<script src="./lang-flag.js?v=6.8.9-labels1"></script>\n</body>`);
  }
  if (!html.includes("setup-lang-v688.js")) {
    html = html.replace("</body>", `<script src="./setup-lang-v688.js?v=6.8.9-labels1"></script>\n</body>`);
  }
  if (!html.includes("budget-labels-v689.js")) {
    html = html.replace("</body>", `<script src="./budget-labels-v689.js?v=6.8.9-labels1"></script>\n</body>`);
  }

  return htmlResponse(response, html);
}

async function upgradeAppJs(response) {
  if (!response || !response.ok) return response;
  let js = await response.text();
  js = js.replace('const APP_VERSION = "6.8.3";', 'const APP_VERSION = "6.8.9";');
  js = js.replace(/\.\/sw\.js\?v=[^"']+/g, "./sw.js?v=6.8.9-labels1");

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
  const isLanguageRuntime = url.pathname.endsWith("/i18n.js") ||
    url.pathname.endsWith("/i18n-layout-fix.js") ||
    url.pathname.endsWith("/rtl-polish-v687.js") ||
    url.pathname.endsWith("/lang-flag.js") ||
    url.pathname.endsWith("/setup-lang-v688.js") ||
    url.pathname.endsWith("/budget-labels-v689.js");

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

  if (isVersion || isAiConfig || isEnhancedAi || isLanguageRuntime) {
    event.respondWith((async () => {
      try {
        const response = await fetch(request, { cache: "no-store" });
        if (response.ok && (isEnhancedAi || isLanguageRuntime)) {
          caches.open(CACHE).then(cache => cache.put(request, response.clone()));
        }
        return response;
      } catch {
        const cached = await caches.match(request);
        if (cached) return cached;
        return new Response(isAiConfig ? "{}" : "", {
          status: 503,
          headers: isAiConfig ? { "Content-Type": "application/json" } : {}
        });
      }
    })());
    return;
  }

  event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
    if (response && response.ok) caches.open(CACHE).then(cache => cache.put(request, response.clone()));
    return response;
  })));
});
