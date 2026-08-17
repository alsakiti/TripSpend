const APP_VERSION = "7.0.6";
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
  "./ui-fixes-v705.js",
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
    "page-locale-v704.js", "settings-polish-v704.js", "visual-polish-v704.js", "setup-language-host-v700.js", "setup-onboarding-v704.js", "flags-v705.js", "ui-fixes-v705.js", "receipt-capability-v700.js", "receipt-ai-v700.js"
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
    load('./ui-fixes-v705.js?v=${APP_VERSION}');
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
  js = js.replace("const STORAGE_SAVE_DELAY = 140;", "const STORAGE_SAVE_DELAY = 220;");

  const settingsPattern = /([ \t]+)fillSettings\(\);\n\1renderAppearanceControls\(\);\n\1renderRates\(\);\n\1renderStoragePanel\(\);\n\1renderUpdateSettings\(latestVersionKnown \? "online" : "checking"\);\n\1runDiagnostics\(\);/g;
  js = js.replace(settingsPattern, (_match, indent) => [
    `${indent}fillSettings();`,
    `${indent}renderAppearanceControls();`,
    `${indent}renderRates();`,
    `${indent}renderUpdateSettings(latestVersionKnown ? "online" : "checking");`,
    `${indent}const runDeferredSettingsWork = () => { renderStoragePanel(); runDiagnostics(); };`,
    `${indent}if ("requestIdleCallback" in window) requestIdleCallback(runDeferredSettingsWork, { timeout: 650 });`,
    `${indent}else setTimeout(runDeferredSettingsWork, 60);`
  ].join("\n"));

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

async function upgradeVisualJs(response) {
  if (!response?.ok) return response;
  let js = await response.text();
  js = js.replace(/const RELEASE = "[^"]+";/, `const RELEASE = "${APP_VERSION}";`);

  js = js.replace(
    /function polishMoreInsights\(\) \{[\s\S]*?\n  \}\n\n  function polishAiCard/,
    `function polishMoreInsights() {
    const toggle = $("analyticsMoreToggle");
    const details = $("analyticsMoreDetails");
    if (!toggle || !details) return;
    const open = !details.classList.contains("hidden");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    const arrow = $("analyticsMoreArrow");
    if (arrow) arrow.textContent = open ? "⌃" : "⌄";
  }

  function polishAiCard`
  );

  js = js.replace(
    `    const state = core()?.getState?.();\n    const currency = state?.trip?.homeCurrency || "OMR";\n    const total = rows.reduce((sum, row) => sum + row.amount, 0);`,
    `    const state = core()?.getState?.();\n    const currency = state?.trip?.homeCurrency || "OMR";\n    const signature = language() + "|" + currency + "|" + rows.map(row => row.date + ":" + Number(row.amount || 0).toFixed(3)).join("|");\n    if (host.classList.contains("ts-daily-reference") && host.dataset.tsV706Signature === signature && host.querySelector(".ts-daily-chart-shell")) return;\n    host.dataset.tsV706Signature = signature;\n    const total = rows.reduce((sum, row) => sum + row.amount, 0);`
  );

  js = js.replace(
    `  function polish() {\n    injectStyles();\n    polishMoreInsights();\n    polishPaymentChart();\n    polishTravelerChart();\n    polishDailyChart();\n    polishAiCard();\n  }`,
    `  function polish() {\n    injectStyles();\n    const active = document.querySelector(".page.active")?.id || "";\n    if (active === "analytics") {\n      polishMoreInsights();\n      polishPaymentChart();\n      polishTravelerChart();\n      polishDailyChart();\n    }\n    if (active === "settings") polishAiCard();\n  }`
  );

  js = js.replace("scheduled = window.setTimeout(() => requestAnimationFrame(polish), 45);", "scheduled = window.setTimeout(() => requestAnimationFrame(polish), 24);");
  js = js.replace(
    `    polish();\n    window.addEventListener("tripspend:render", schedule);\n    window.addEventListener("tripspend:page", schedule);\n    window.addEventListener("tripspend:language", schedule);\n    window.setTimeout(polish, 350);\n    window.setTimeout(polish, 1100);`,
    `    injectStyles();\n    polish();\n    window.addEventListener("tripspend:render", schedule);\n    window.addEventListener("tripspend:page", schedule);\n    window.addEventListener("tripspend:language", schedule);\n    const idlePolish = () => polish();\n    if ("requestIdleCallback" in window) requestIdleCallback(idlePolish, { timeout: 700 });\n    else window.setTimeout(idlePolish, 180);`
  );

  return responseWithText(response, js, "text/javascript; charset=utf-8");
}

async function upgradeSettingsJs(response) {
  if (!response?.ok) return response;
  let js = await response.text();
  js = js.replace(/const RELEASE = "[^"]+";/, `const RELEASE = "${APP_VERSION}";`);
  js = js.replace("    installStyles();\n    buildSettings();\n    syncPageMode();", "    installStyles();\n    syncPageMode();");
  js = js.replace(
    `    window.addEventListener("tripspend:language", () => {\n      requestAnimationFrame(() => {\n        translateGenerated();\n        renderCountries();\n      });\n    });`,
    `    window.addEventListener("tripspend:language", () => {\n      if (document.querySelector(".page.active")?.id !== "settings") return;\n      requestAnimationFrame(() => {\n        translateGenerated();\n        renderCountries();\n      });\n    });`
  );
  return responseWithText(response, js, "text/javascript; charset=utf-8");
}

async function upgradeFlagsJs(response) {
  if (!response?.ok) return response;
  let js = await response.text();
  js = js.replace(/const RELEASE = "[^"]+";/, `const RELEASE = "${APP_VERSION}";`);
  // MutationObserver already sees inserted/replaced flag text. Avoid rescanning the
  // entire document again after every render, page switch and language event.
  js = js.replace('    window.addEventListener("tripspend:render", scheduleUpgrade);\n', "");
  js = js.replace('    window.addEventListener("tripspend:page", scheduleUpgrade);\n', "");
  js = js.replace('    window.addEventListener("tripspend:language", scheduleUpgrade);\n', "");
  return responseWithText(response, js, "text/javascript; charset=utf-8");
}

async function upgradeUiFixesJs(response) {
  if (!response?.ok) return response;
  let js = await response.text();
  js = js.replace(/const RELEASE = "[^"]+";/, `const RELEASE = "${APP_VERSION}";`);
  js = js.replace(
    /    const observer = new MutationObserver\(records => \{[\s\S]*?    observer\.observe\(document\.body, \{childList:true, subtree:true, attributes:true, attributeFilter:\["class"\]\}\);/,
    `    const observeClass = target => {
      if (!target) return;
      const observer = new MutationObserver(schedule);
      observer.observe(target, { attributes:true, attributeFilter:["class"] });
    };
    const observeChildren = target => {
      if (!target) return;
      const observer = new MutationObserver(schedule);
      observer.observe(target, { childList:true, subtree:true });
    };
    observeClass($("setupView"));
    observeClass($("mainView"));
    observeChildren($("tripSwitcherModal"));
    observeChildren($("tripSwitcherSheet"));`
  );
  js = js.replace('    window.addEventListener("tripspend:language", schedule);\n', "");
  return responseWithText(response, js, "text/javascript; charset=utf-8");
}

async function upgradeSetupJs(response) {
  if (!response?.ok) return response;
  let js = await response.text();
  js = js.replace(/const RELEASE = "[^"]+";/, `const RELEASE = "${APP_VERSION}";`);
  js = js.replace("let analyticsInsightsOpen = true;", "let analyticsInsightsOpen = true;\n  let afterChangeTimer = 0;");
  js = js.replace('analyticsInsightsOpen = !details.classList.contains("hidden");', 'analyticsInsightsOpen = false;');
  js = js.replace(
    `  function afterAppChange() {\n    window.setTimeout(() => {\n      ensureSetupBuilt();\n      repairAnalyticsToggle();\n      applyAnalyticsToggleState();\n    }, 90);\n  }`,
    `  function afterAppChange() {\n    clearTimeout(afterChangeTimer);\n    afterChangeTimer = window.setTimeout(() => {\n      ensureSetupBuilt();\n      repairAnalyticsToggle();\n      applyAnalyticsToggleState();\n    }, 45);\n  }`
  );
  return responseWithText(response, js, "text/javascript; charset=utf-8");
}

async function upgradeReceiptJs(response) {
  if (!response?.ok) return response;
  let js = await response.text();
  js = js.replace("const maxSide = 1600;", "const maxSide = file.size > 5_000_000 ? 1280 : 1440;");
  js = js.replace(
    `    const dataUrl = canvas.toDataURL("image/jpeg",0.82);\n    if (dataUrl.length > 5_500_000) throw new Error(text("This receipt photo is too large to scan.", "صورة الإيصال كبيرة جدًا للمسح."));\n    return { image:dataUrl, mimeType:"image/jpeg" };`,
    `    const encodedBlob = await new Promise((resolve, reject) => {\n      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error(text("Could not prepare this receipt photo.", "تعذر تجهيز صورة الإيصال."))), "image/jpeg", 0.78);\n    });\n    const dataUrl = await new Promise((resolve, reject) => {\n      const reader = new FileReader();\n      reader.onload = () => resolve(String(reader.result || ""));\n      reader.onerror = () => reject(reader.error || new Error(text("Could not prepare this receipt photo.", "تعذر تجهيز صورة الإيصال.")));\n      reader.readAsDataURL(encodedBlob);\n    });\n    if (dataUrl.length > 4_800_000) throw new Error(text("This receipt photo is too large to scan.", "صورة الإيصال كبيرة جدًا للمسح."));\n    return { image:dataUrl, mimeType:"image/jpeg" };`
  );
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
  if (path.endsWith("/visual-polish-v704.js")) {
    event.respondWith(networkFirst(request, upgradeVisualJs));
    return;
  }
  if (path.endsWith("/settings-polish-v704.js")) {
    event.respondWith(networkFirst(request, upgradeSettingsJs));
    return;
  }
  if (path.endsWith("/flags-v705.js")) {
    event.respondWith(networkFirst(request, upgradeFlagsJs));
    return;
  }
  if (path.endsWith("/ui-fixes-v705.js")) {
    event.respondWith(networkFirst(request, upgradeUiFixesJs));
    return;
  }
  if (path.endsWith("/setup-onboarding-v704.js")) {
    event.respondWith(networkFirst(request, upgradeSetupJs));
    return;
  }
  if (path.endsWith("/receipt-ai-v700.js")) {
    event.respondWith(networkFirst(request, upgradeReceiptJs));
    return;
  }

  const alwaysFresh = path.endsWith("/version.json") || path.endsWith("/ai-config.json") ||
    path.endsWith("/locale-dynamic-v700.js") || path.endsWith("/expense-locale-v703.js") ||
    path.endsWith("/page-locale-v704.js") || path.endsWith("/setup-language-host-v700.js") ||
    path.endsWith("/receipt-capability-v700.js") || path.endsWith("/sw.js");
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