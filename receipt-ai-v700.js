(() => {
  "use strict";

  const ENDPOINT_FALLBACK = "https://tripspend-ai.alsukaiti1998.workers.dev";
  const CLIENT_KEY = "tripspend.ai.clientId";
  let endpoint = ENDPOINT_FALLBACK;
  let pending = null;
  let autoScan = false;

  const $ = id => document.getElementById(id);
  const isArabic = () => window.TripSpendLocale?.language?.() === "ar";
  const text = (en, ar) => isArabic() ? ar : en;

  function clientId() {
    try {
      let id = localStorage.getItem(CLIENT_KEY);
      if (!id) {
        id = (crypto.randomUUID?.() || `ts-${Date.now()}-${Math.random().toString(16).slice(2)}`).slice(0,80);
        localStorage.setItem(CLIENT_KEY,id);
      }
      return id;
    } catch { return "anonymous-client"; }
  }

  async function loadEndpoint() {
    try {
      const r = await fetch(`./ai-config.json?t=${Date.now()}`, {cache:"no-store"});
      if (r.ok) {
        const c = await r.json();
        const value = String(c?.endpoint || "").trim();
        if (value.startsWith("https://")) endpoint = value.replace(/\/$/,"");
      }
    } catch {}
  }

  function ensureStyles() {
    if ($("receiptAiV700Styles")) return;
    const s = document.createElement("style");
    s.id = "receiptAiV700Styles";
    s.textContent = `
      .receipt-ai-scan-btn{margin-left:8px;min-height:38px;padding:0 12px;border:1px solid var(--line);border-radius:12px;background:var(--surface);color:var(--brand);font-weight:850;cursor:pointer}
      body.lang-ar .receipt-ai-scan-btn{margin-left:0;margin-right:8px}
      .receipt-ai-result{margin-top:10px;padding:12px;border:1px solid var(--line);border-radius:14px;background:var(--surface2)}
      .receipt-ai-result.hidden{display:none}
      .receipt-ai-head{display:flex;justify-content:space-between;align-items:center;gap:10px}.receipt-ai-head strong{font-size:12px}.receipt-ai-confidence{font-size:10px;color:var(--muted)}
      .receipt-ai-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin:9px 0}.receipt-ai-grid span{display:block;padding:7px 8px;border-radius:10px;background:var(--surface);font-size:10px;color:var(--muted)}.receipt-ai-grid b{display:block;margin-top:2px;color:var(--text);font-size:11px;overflow-wrap:anywhere}
      .receipt-ai-actions{display:flex;gap:7px}.receipt-ai-actions button{min-height:36px;border-radius:11px;font-weight:800}.receipt-ai-apply{flex:1;border:0;background:var(--brand);color:#fff}.receipt-ai-dismiss{border:1px solid var(--line);background:var(--surface);color:var(--text)}
      .receipt-ai-note{margin-top:7px;color:var(--muted);font-size:9px;line-height:1.4}
      @media(max-width:420px){.receipt-ai-grid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(s);
  }

  function mount() {
    ensureStyles();
    const field = document.querySelector(".receipt-field");
    const head = field?.querySelector(".receipt-field-head");
    const input = $("receiptInput");
    if (!field || !head || !input) return false;

    let button = $("receiptAiScanBtn");
    if (!button) {
      button = document.createElement("button");
      button.id = "receiptAiScanBtn";
      button.type = "button";
      button.className = "receipt-ai-scan-btn";
      button.onclick = () => {
        const file = input.files?.[0];
        if (file) scanReceipt(file);
        else { autoScan = true; input.click(); }
      };
      head.appendChild(button);
      input.addEventListener("change", () => {
        if (autoScan && input.files?.[0]) { autoScan = false; scanReceipt(input.files[0]); }
      });
    }

    let result = $("receiptAiResult");
    if (!result) {
      result = document.createElement("div");
      result.id = "receiptAiResult";
      result.className = "receipt-ai-result hidden";
      field.appendChild(result);
    }
    updateLanguage();
    return true;
  }

  function updateLanguage() {
    const b = $("receiptAiScanBtn");
    if (b && !b.disabled) b.textContent = text("✨ Scan receipt", "✨ مسح الإيصال");
    if (pending) renderResult(pending);
  }

  async function imageData(file) {
    if (!file?.type?.startsWith("image/")) throw new Error(text("Choose an image receipt.", "اختر صورة للإيصال."));
    const bitmap = await createImageBitmap(file);
    const maxSide = file.size > 5_000_000 ? 1280 : 1440;
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext("2d", {alpha:false});
    ctx.drawImage(bitmap,0,0,width,height);
    bitmap.close?.();
    const encodedBlob = await new Promise((resolve, reject) => {
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error(text("Could not prepare this receipt photo.", "تعذر تجهيز صورة الإيصال."))), "image/jpeg", 0.78);
    });
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(reader.error || new Error(text("Could not prepare this receipt photo.", "تعذر تجهيز صورة الإيصال.")));
      reader.readAsDataURL(encodedBlob);
    });
    if (dataUrl.length > 4_800_000) throw new Error(text("This receipt photo is too large to scan.", "صورة الإيصال كبيرة جدًا للمسح."));
    return { image:dataUrl, mimeType:"image/jpeg" };
  }

  function tripContext() {
    const state = window.TripSpendCore?.getState?.();
    return {
      today: new Date().toISOString().slice(0,10),
      trip: state?.trip ? { id:state.trip.id || "", homeCurrency:state.trip.homeCurrency || "", tripCurrency:state.trip.tripCurrency || "", destination:state.trip.destination || "" } : null
    };
  }

  async function scanReceipt(file) {
    const button = $("receiptAiScanBtn");
    const result = $("receiptAiResult");
    if (!button || !result) return;
    button.disabled = true;
    button.textContent = text("Scanning…", "جارٍ المسح…");
    result.classList.remove("hidden");
    result.innerHTML = `<div class="receipt-ai-note">${text("The receipt image is sent to TripSpend AI only for this scan. Nothing is saved automatically.", "تُرسل صورة الإيصال إلى TripSpend AI لهذا المسح فقط. لن يتم حفظ أي شيء تلقائيًا.")}</div>`;

    try {
      const encoded = await imageData(file);
      const response = await fetch(endpoint, {
        method:"POST",
        headers:{"Content-Type":"application/json","X-TripSpend-Client":clientId()},
        body:JSON.stringify({ mode:"receipt", ...encoded, context:tripContext() })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || `Receipt scan failed (${response.status})`);
      if (!data?.receipt) throw new Error(text("The receipt could not be read clearly.", "تعذر قراءة الإيصال بوضوح."));
      pending = data.receipt;
      renderResult(pending);
    } catch (error) {
      pending = null;
      result.innerHTML = `<div class="receipt-ai-note">${escapeHtml(error?.message || text("Receipt scan failed.", "فشل مسح الإيصال."))}</div>`;
    } finally {
      button.disabled = false;
      updateLanguage();
    }
  }

  function escapeHtml(value) { return String(value || "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c])); }

  function renderResult(r) {
    const box = $("receiptAiResult");
    if (!box || !r) return;
    const amount = Number(r.total || 0);
    const confidence = Math.max(0,Math.min(100,Math.round(Number(r.confidence || 0) * (Number(r.confidence || 0) <= 1 ? 100 : 1))));
    const rows = [
      [text("Merchant","المتجر"),r.merchant || "—"],
      [text("Total","الإجمالي"),amount > 0 ? `${r.currency || ""} ${amount}`.trim() : "—"],
      [text("Date","التاريخ"),r.date || "—"],
      [text("Category","الفئة"),window.TripSpendLocale?.category?.(r.category) || r.category || "—"]
    ];
    box.classList.remove("hidden");
    box.innerHTML = `<div class="receipt-ai-head"><strong>${text("AI receipt suggestion","اقتراح الإيصال بالذكاء الاصطناعي")}</strong><span class="receipt-ai-confidence">${confidence ? `${confidence}%` : ""}</span></div><div class="receipt-ai-grid">${rows.map(([k,v]) => `<span>${escapeHtml(k)}<b>${escapeHtml(v)}</b></span>`).join("")}</div><div class="receipt-ai-actions"><button type="button" class="receipt-ai-dismiss">${text("Dismiss","تجاهل")}</button><button type="button" class="receipt-ai-apply">${text("Apply suggestions","تطبيق الاقتراحات")}</button></div><div class="receipt-ai-note">${text("Review everything before saving the expense.","راجع جميع البيانات قبل حفظ المصروف.")}</div>`;
    box.querySelector(".receipt-ai-dismiss").onclick = () => { pending = null; box.classList.add("hidden"); };
    box.querySelector(".receipt-ai-apply").onclick = () => applySuggestion(r);
  }

  function setSelect(id,value) {
    const el = $(id); if (!el || !value) return;
    const option = [...el.options].find(o => o.value === value || o.textContent.trim() === value);
    if (!option) return;
    el.value = option.value;
    el.dispatchEvent(new Event("change",{bubbles:true}));
  }

  function setValue(id,value) {
    const el = $(id); if (!el || value === undefined || value === null || value === "") return;
    el.value = value;
    el.dispatchEvent(new Event("input",{bubbles:true}));
    el.dispatchEvent(new Event("change",{bubbles:true}));
  }

  function applySuggestion(r) {
    const amount = Number(r.total || 0);
    if (amount > 0) setValue("expenseAmount",String(amount));
    if (/^[A-Z]{3}$/.test(String(r.currency || ""))) setSelect("expenseCurrency",String(r.currency));
    if (/^\d{4}-\d{2}-\d{2}$/.test(String(r.date || ""))) setValue("expenseDate",String(r.date));
    if (r.category) setSelect("expenseCategory",r.category);
    if (r.merchant) {
      const existing = String($("expenseNote")?.value || "").trim();
      if (!existing) setValue("expenseNote",String(r.merchant).slice(0,120));
    }
    const box = $("receiptAiResult");
    if (box) box.innerHTML = `<div class="receipt-ai-note">✓ ${text("Suggestions applied. Review them, then tap Save Expense when ready.","تم تطبيق الاقتراحات. راجعها ثم اضغط حفظ المصروف عندما تكون جاهزًا.")}</div>`;
    pending = null;
  }

  function start() {
    loadEndpoint();
    if (mount()) return;
    let attempts = 0;
    const timer = setInterval(() => { if (mount() || ++attempts > 120) clearInterval(timer); },125);
  }

  window.addEventListener("tripspend:language",updateLanguage);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded",start,{once:true}); else start();
})();
