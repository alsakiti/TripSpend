(() => {
  "use strict";

  const COUNTRY_CODES = {
    Austria:"AT",Bahrain:"BH",Belgium:"BE",Canada:"CA",China:"CN",Egypt:"EG",France:"FR",Germany:"DE",Greece:"GR",India:"IN",Indonesia:"ID",Ireland:"IE",Italy:"IT",Japan:"JP",Kuwait:"KW",Malaysia:"MY",Netherlands:"NL","New Zealand":"NZ",Oman:"OM",Philippines:"PH",Portugal:"PT",Qatar:"QA","Saudi Arabia":"SA",Singapore:"SG","South Korea":"KR",Spain:"ES",Switzerland:"CH",Thailand:"TH",Turkey:"TR","United Arab Emirates":"AE","United Kingdom":"GB","United States":"US",Vietnam:"VN"
  };
  let displayNames = null;
  let observer = null;
  let busy = false;
  let queued = false;
  try { displayNames = new Intl.DisplayNames(["ar"],{type:"region"}); } catch {}

  function arabic() { return window.TripSpendLocale?.language?.() === "ar"; }
  function country(value) {
    const code = COUNTRY_CODES[value];
    if (!code || !displayNames) return value;
    try { return displayNames.of(code) || value; } catch { return value; }
  }

  function translateEmbeddedCountries(value) {
    let out = String(value || "");
    for (const [name] of Object.entries(COUNTRY_CODES)) {
      if (out.includes(name)) out = out.split(name).join(country(name));
    }
    return out;
  }

  function setText(el,en,ar) {
    if (!el) return;
    const wanted = arabic() ? ar : en;
    if (el.textContent !== wanted) el.textContent = wanted;
  }

  function apply() {
    if (busy) return;
    busy = true;
    observer?.disconnect();
    try {
      const isAr = arabic();
      const pageAdd = document.getElementById("pageAdd");
      if (pageAdd) setText(pageAdd,"＋ Add","＋ إضافة");

      document.querySelectorAll("button").forEach(button => {
        const value = button.textContent.trim();
        if (isAr && /^(?:↻\s*)?Repeat(?:\s*↻)?$/i.test(value)) button.textContent = "↻ تكرار";
        else if (!isAr && /^(?:↻\s*)?تكرار(?:\s*↻)?$/.test(value)) button.textContent = "↻ Repeat";
      });

      const summary = document.getElementById("expenseSummary");
      if (summary) {
        if (isAr) {
          summary.textContent = translateEmbeddedCountries(summary.textContent)
            .replace(/\b(\d+)\s+expenses\b/gi,"$1 مصروفات")
            .replace(/\b(\d+)\s+expense\b/gi,"$1 مصروف");
        }
      }

      const headerSub = document.getElementById("headerSub");
      if (headerSub && isAr) {
        headerSub.childNodes.forEach(node => {
          if (node.nodeType !== Node.TEXT_NODE || !node.nodeValue?.trim()) return;
          const current = node.nodeValue;
          let next = translateEmbeddedCountries(current);
          next = next.replace(/\b(\d+)\s+countries\b/gi,"$1 دول").replace(/\b(\d+)\s+country\b/gi,"$1 دولة");
          if (next !== current) node.nodeValue = next;
        });
      }
    } finally {
      busy = false;
      if (observer && document.body) observer.observe(document.body,{childList:true,subtree:true,characterData:true});
    }
  }

  function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued=false; apply(); });
  }

  function start() {
    observer = new MutationObserver(() => { if (!busy && arabic()) queue(); });
    window.addEventListener("tripspend:language",queue);
    apply();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded",start,{once:true}); else start();
})();
