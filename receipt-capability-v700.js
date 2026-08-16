(() => {
  "use strict";

  const FALLBACK = "https://tripspend-ai.alsukaiti1998.workers.dev";

  function installStyle() {
    if (document.getElementById("receiptCapabilityV700Styles")) return;
    const style = document.createElement("style");
    style.id = "receiptCapabilityV700Styles";
    style.textContent = `body:not([data-receipt-ai-ready="1"]) #receiptAiScanBtn{display:none!important}`;
    document.head.appendChild(style);
  }

  async function endpoint() {
    try {
      const r = await fetch(`./ai-config.json?t=${Date.now()}`, { cache:"no-store" });
      if (r.ok) {
        const data = await r.json();
        const value = String(data?.endpoint || "").trim();
        if (value.startsWith("https://")) return value.replace(/\/$/,"");
      }
    } catch {}
    return FALLBACK;
  }

  async function check() {
    installStyle();
    document.body?.removeAttribute("data-receipt-ai-ready");
    try {
      const url = await endpoint();
      const r = await fetch(url, { method:"GET", cache:"no-store" });
      if (!r.ok) return;
      const data = await r.json();
      const capabilities = Array.isArray(data?.capabilities) ? data.capabilities : [];
      if (String(data?.version || "").startsWith("7.") && capabilities.includes("receipt-scan")) {
        document.body?.setAttribute("data-receipt-ai-ready","1");
      }
    } catch {}
  }

  window.addEventListener("online", check);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", check, { once:true });
  else check();
})();
