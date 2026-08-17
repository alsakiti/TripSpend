const APP_VERSION = "7.0.5";
const CACHE = `tripspend-v${APP_VERSION}`;

const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./dashboard.css",
  "./app.js",
  "./fx.js",
  "./v5.js",
  "./ai-v684.js",
  "./locale-v700.js",
  "./locale-dynamic-v700.js",
  "./expense-locale-v703.js",
  "./page-locale-v704.js",
  "./settings-polish-v704.js",
  "./visual-polish-v704.js",
  "./setup-language-host-v700.js",
  "./setup-onboarding-v704.js",
  "./flags-v705.js",
  "./receipt-capability-v700.js",
  "./receipt-ai-v700.js",
  "./manifest.webmanifest",
  "./version.json",
  "./ai-config.json",
  "./icons/icon-96.png",
  "./icons/icon-180.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

function responseWithText(response, text, type) {
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  headers.set("content-type", type);
  headers.set("cache-control", "no-store");
  return new Response(text, { status:response.status, statusText:response.statusText, headers });
}

async function upgradeHtml(response) {
  if (!response?.ok) return response;
  const type = response.headers.get("content-type") || "";
  if (!type.includes("text/html")) return response;

  let html = await response.text();
  html = html
    .replaceAll("v6.8.1", `v${APP_VERSION}`)
    .replaceAll("?v=6.8.1", `?v=${APP_VERSION}`)
    .replace(/(<[^>]*class=["'][^"']*version-badge[^"']*["'][^>]*>)v\d+\.\d+\.\d+(<\/[^>]+>)/gi, `$1v${APP_VERSION}$2`);

  const retired = [
    "ai.js", "ai-v684.js", "i18n.js", "i18n-layout-fix.js", "i18n-audit-v690.js",
    "rtl-polish-v687.js", "lang-flag.js", "setup-lang-v688.js", "budget-labels-v689.js",
    "expense-ar-v691.js", "locale-v700.js", "locale-dynamic-v700.js", "expense-locale-v703.js",
    "page-locale-v704.js", "settings-polish-v704.js", "visual-polish-v704.js", "setup-language-host-v700.js", "setup-onboarding-v704.js", "flags-v705.js", "receipt-capability-v700.js", "receipt-ai-v700.js"
  ];
  for (const file of retired) {
    const escaped = file.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    html = html.replace(new RegExp(`<script[^>]+${escaped}[^>]*><\\/script>\\s*`, "gi"), "");
  }

  const boot = `
<script>
window.__tsNativeMO=window.MutationObserver;
window.MutationObserver=class{observe(){}disconnect(){}takeRecords(){return[]}};
</script>
<script src="./ai-v684.js?v=${APP_VERSION}"></script>
<script>
(()=>{
  const load=(src)=>{const s=document.createElement('script');s.src=src;s.async=false;document.body.appendChild(s)};
  const finish=()=>{
    if(window.__tsNativeMO){window.MutationObserver=window.__tsNativeMO;delete window.__tsNativeMO;}
    load('./locale-v700.js?v=${APP_VERSION}');
    load('./locale-dynamic-v700.js?v=${APP_VERSION}');
    load('./expense-locale-v703.js?v=${APP_VERSION}');
    load('./page-locale-v704.js?v=${APP_VERSION}');
    load('./settings-polish-v704.js?v=${APP_VERSION}');
    load('./visual-polish-v704.js?v=${APP_VERSION}');
    load('./setup-language-host-v700.js?v=${APP_VERSION}');
    load('./setup-onboarding-v704.js?v=${APP_VERSION}');
    load('./flags-v705.js?v=${APP_VERSION}');
    load('./receipt-capability-v700.js?v=${APP_VERSION}');
    load('./receipt-ai-v700.js?v=${APP_VERSION}');
  };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',finish,{once:true}); else finish();
})();
</script>
`;
  html = html.replace("</body>", boot + "</body>");
  return responseWithText(response, html, "text/html; charset=utf-8");
}

async function upgradeAppJs(response) {
  if (!response?.ok) return response;
  let js = await response.text();
  js = js.replace(/const APP_VERSION = "[^"]+";/, `const APP_VERSION = "${APP_VERSION}";`);
  js = js.replace(/\.\/sw\.js\?v=[^"']+/g, `./sw.js?v=${APP_VERSION}`);
  return responseWithText(response, js, "text/javascript; charset=utf-8");
}

async function upgradeAiJs(response) {
  if (!response?.ok) return response;
  let js = await response.text();
  js = js.replace(/const RELEASE = "[^"]+";/, `const RELEASE = "${APP_VERSION}";`);
  js = js.replace(
    'const PROVIDER = { key: "cloudflare", label: "Cloudflare AI", short: "TripSpend AI" };',
    'const PROVIDER = { key: "cloudflare", label: "Google Gemini", short: "Gemini 3.5 Flash-Lite" };'
  );
  js = js.replace('workerActionsReady?"AI READY":"ANALYSIS READY"', 'workerActionsReady?"READY":"LOCAL READY"');
  js = js.replace("Cloud AI is connecting for natural-language requests.", "Gemini is connecting for natural-language requests.");
  js = js.replace(/Enhanced client v6\.8\.4/g, `Enhanced client v${APP_VERSION}`);
  js = js.replace(
    "Receipt images, backups and past trips are not sent.",
    "AI chat does not send receipt images, backups or past trips. Receipt Scan sends only the receipt you explicitly choose to scan."
  );
  return responseWithText(response, js, "text/javascript; charset=utf-8");
}

async function upgradeLocaleJs(response) {
  if (!response?.ok) return response;
  let js = await response.text();
  js = js.replace(/const RELEASE = "[^"]+";/, `const RELEASE = "${APP_VERSION}";`);
  return responseWithText(response, js, "text/javascript; charset=utf-8");
}

async function networkFirst(request, transform = null, cacheKey = request) {
  try {
    const response = await fetch(request, {cache:"no-store"});
    if (!response.ok) return response;
    const usable = transform ? await transform(response) : response;
    const copy = usable.clone();
    caches.open(CACHE).then(cache => cache.put(cacheKey, copy)).catch(()=>{});
    return usable;
  } catch {
    const cached = await caches.match(cacheKey);
    if (!cached) return new Response("TripSpend is unavailable offline.", {status:503});
    return transform ? transform(cached) : cached;
  }
}

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.all(APP_SHELL.map(async path => {
      try { await cache.add(new Request(path, {cache:"reload"})); } catch {}
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith("tripspend-") && k !== CACHE).map(k => caches.delete(k)));
    if (self.registration.navigationPreload) await self.registration.navigationPreload.enable().catch(()=>{});
    await self.clients.claim();
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
        const network = (await event.preloadResponse) || await fetch(request, {cache:"no-store"});
        if (network.ok) caches.open(CACHE).then(c => c.put("./index.html", network.clone())).catch(()=>{});
        return upgradeHtml(network);
      } catch {
        const cached = await caches.match("./index.html");
        return cached ? upgradeHtml(cached) : new Response("TripSpend is unavailable offline.", {status:503});
      }
    })());
    return;
  }

  const path = url.pathname;
  if (path.endsWith("/app.js")) {
    event.respondWith(networkFirst(request, upgradeAppJs));
    return;
  }
  if (path.endsWith("/ai-v684.js")) {
    event.respondWith(networkFirst(request, upgradeAiJs));
    return;
  }
  if (path.endsWith("/locale-v700.js")) {
    event.respondWith(networkFirst(request, upgradeLocaleJs));
    return;
  }

  const alwaysFresh = path.endsWith("/version.json") || path.endsWith("/ai-config.json") ||
    path.endsWith("/locale-dynamic-v700.js") || path.endsWith("/expense-locale-v703.js") ||
    path.endsWith("/page-locale-v704.js") || path.endsWith("/settings-polish-v704.js") ||
    path.endsWith("/visual-polish-v704.js") || path.endsWith("/setup-language-host-v700.js") || path.endsWith("/setup-onboarding-v704.js") || path.endsWith("/flags-v705.js") || path.endsWith("/receipt-capability-v700.js") ||
    path.endsWith("/receipt-ai-v700.js") || path.endsWith("/sw.js");
  if (alwaysFresh) {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(request);
    const refresh = fetch(request).then(response => {
      if (response?.ok) caches.open(CACHE).then(c => c.put(request,response.clone())).catch(()=>{});
      return response;
    }).catch(()=>null);
    if (cached) { event.waitUntil(refresh); return cached; }
    return (await refresh) || new Response("", {status:503});
  })());
});