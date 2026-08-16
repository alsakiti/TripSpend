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

  function installStyles() {
    if (document.getElementById("tripSpendDynamicV701Styles")) return;
    const style = document.createElement("style");
    style.id = "tripSpendDynamicV701Styles";
    style.textContent = `
      body.lang-ar #languageToggleV7,
      body.lang-ar #setupLanguageToggleV7 {
        left: 16px !important;
        right: auto !important;
      }
      body.lang-ar #dashboardDate,
      body.lang-ar #dashboardGreeting {
        direction: rtl !important;
        unicode-bidi: isolate !important;
        text-align: right !important;
      }
      #dashboardGreeting .ts-trip-name {
        direction: ltr !important;
        unicode-bidi: isolate !important;
        display: inline-block;
      }
    `;
    document.head.appendChild(style);
  }

  function dashboardDayPart(isAr) {
    const hour = new Date().getHours();
    if (isAr) return hour < 12 ? "صباح الخير" : "مساء الخير";
    return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  }

  function syncDashboardWelcome(isAr) {
    const date = document.getElementById("dashboardDate");
    if (date) {
      const now = new Date();
      const value = isAr
        ? new Intl.DateTimeFormat("ar-OM-u-nu-latn", {weekday:"long",day:"numeric",month:"long"}).format(now)
        : new Intl.DateTimeFormat("en-GB", {weekday:"long",day:"numeric",month:"short"}).format(now).replace(/,/g,"").toUpperCase();
      if (date.textContent !== value) date.textContent = value;
      date.setAttribute("lang",isAr ? "ar" : "en");
    }

    const greeting = document.getElementById("dashboardGreeting");
    if (!greeting) return;
    const tripName = String(window.TripSpendCore?.getState?.()?.trip?.name || "").trim();
    const prefix = dashboardDayPart(isAr);
    const plain = tripName ? `${prefix}, ${tripName}` : prefix;
    if (greeting.dataset.tsWelcomeKey === `${isAr ? "ar" : "en"}|${plain}`) return;

    greeting.replaceChildren();
    if (isAr) {
      greeting.append(document.createTextNode(`${prefix}، `));
      if (tripName) {
        const name = document.createElement("bdi");
        name.className = "ts-trip-name";
        name.dir = "ltr";
        name.lang = "en";
        name.textContent = tripName;
        greeting.append(name);
      }
    } else {
      greeting.append(document.createTextNode(prefix));
      if (tripName) {
        greeting.append(document.createTextNode(", "));
        const name = document.createElement("bdi");
        name.className = "ts-trip-name";
        name.dir = "ltr";
        name.textContent = tripName;
        greeting.append(name);
      }
    }
    greeting.dataset.tsWelcomeKey = `${isAr ? "ar" : "en"}|${plain}`;
  }

  function syncHomeQuickAdd(isAr) {
    const subtitle = document.querySelector("#quickAdd small");
    if (subtitle) subtitle.textContent = isAr ? "سجّل مصروفك خلال ثوانٍ" : "Log a purchase in seconds";
  }

  function syncFloatingAdd() {
    const navAdd = document.getElementById("navAdd");
    if (!navAdd) return;
    const mainVisible = !document.getElementById("mainView")?.classList.contains("hidden");
    const activePage = document.querySelector(".page.active")?.id || "";
    const hide = !mainVisible || activePage === "dashboard";
    navAdd.classList.toggle("hidden",hide);
    navAdd.setAttribute("aria-hidden",hide ? "true" : "false");
  }

  function apply() {
    if (busy) return;
    busy = true;
    observer?.disconnect();
    try {
      installStyles();
      const isAr = arabic();
      const pageAdd = document.getElementById("pageAdd");
      if (pageAdd) setText(pageAdd,"＋ Add","＋ إضافة");

      document.querySelectorAll("button").forEach(button => {
        const value = button.textContent.trim();
        if (isAr && /^(?:↻\s*)?Repeat(?:\s*↻)?$/i.test(value)) button.textContent = "↻ تكرار";
        else if (!isAr && /^(?:↻\s*)?تكرار(?:\s*↻)?$/.test(value)) button.textContent = "↻ Repeat";
      });

      const summary = document.getElementById("expenseSummary");
      if (summary && isAr) {
        summary.textContent = translateEmbeddedCountries(summary.textContent)
          .replace(/\b(\d+)\s+expenses\b/gi,"$1 مصروفات")
          .replace(/\b(\d+)\s+expense\b/gi,"$1 مصروف");
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

      syncDashboardWelcome(isAr);
      syncHomeQuickAdd(isAr);
      syncFloatingAdd();
    } finally {
      busy = false;
      if (observer && document.body) observer.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:["class"]});
    }
  }

  function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued=false; apply(); });
  }

  function start() {
    observer = new MutationObserver(() => { if (!busy) queue(); });
    window.addEventListener("tripspend:language",queue);
    apply();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded",start,{once:true}); else start();
})();
