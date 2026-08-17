(() => {
  "use strict";

  const FALLBACK = "https://tripspend-ai.alsukaiti1998.workers.dev";

  function installStyle() {
    if (document.getElementById("receiptCapabilityV700Styles")) return;
    const style = document.createElement("style");
    style.id = "receiptCapabilityV700Styles";
    style.textContent = `
      body:not([data-receipt-ai-ready="1"]) #receiptAiScanBtn{display:none!important}

      /* v7.0.4 receipt typography hotfix: keep receipt controls at the same
         compact scale as the rest of TripSpend, especially on iOS. */
      .receipt-field-head .receipt-add-btn,
      .receipt-field-head .receipt-ai-scan-btn,
      #receiptAiScanBtn{
        width:auto!important;
        min-height:36px!important;
        padding:0 11px!important;
        border-radius:11px!important;
        font-size:11px!important;
        line-height:1.1!important;
        font-weight:800!important;
        letter-spacing:0!important;
        white-space:nowrap!important;
        text-size-adjust:100%!important;
        -webkit-text-size-adjust:100%!important;
      }

      .expense-detail-receipt #viewDetailReceiptBtn,
      .expense-detail-receipt .expense-detail-replace,
      .expense-detail-receipt #removeDetailReceiptBtn{
        width:auto!important;
        min-height:34px!important;
        padding:0 10px!important;
        border-radius:10px!important;
        font-size:10.5px!important;
        line-height:1.1!important;
        font-weight:800!important;
        letter-spacing:0!important;
        white-space:nowrap!important;
        text-size-adjust:100%!important;
        -webkit-text-size-adjust:100%!important;
      }

      .expense-detail-receipt .expense-detail-replace{
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
        margin:0!important;
      }

      @media(max-width:600px){
        .receipt-field-head .receipt-add-btn,
        .receipt-field-head .receipt-ai-scan-btn,
        #receiptAiScanBtn{
          min-height:34px!important;
          padding:0 10px!important;
          font-size:10.5px!important;
        }
        .expense-detail-receipt #viewDetailReceiptBtn,
        .expense-detail-receipt .expense-detail-replace,
        .expense-detail-receipt #removeDetailReceiptBtn{
          min-height:32px!important;
          padding:0 9px!important;
          font-size:10px!important;
        }
      }
    `;
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
