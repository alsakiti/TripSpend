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
        font-family: "SF Arabic", "Geeza Pro", "Noto Sans Arabic", Tahoma, Arial, sans-serif !important;
        letter-spacing: normal !important;
        word-spacing: normal !important;
        font-kerning: normal !important;
        font-variant-ligatures: common-ligatures contextual !important;
        font-feature-settings: "liga" 1, "calt" 1, "kern" 1 !important;
        text-rendering: optimizeLegibility !important;
      }

      body.lang-ar #dashboardDate {
        text-transform: none !important;
      }

      body.lang-ar #dashboardGreeting {
        line-height: 1.18 !important;
      }

      #dashboardGreeting .ts-trip-name {
        direction: ltr !important;
        unicode-bidi: isolate !important;
        display: inline-block;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif !important;
        letter-spacing: normal !important;
        word-spacing: normal !important;
      }

      /* v7.0.6 Home polish — make Next Up feel like part of the premium trip context. */
      html body .dashboard-refresh #v6PlanRow.v6-plan-row {
        display:grid!important;
        grid-template-columns:46px minmax(0,1fr) 20px!important;
        align-items:center!important;
        gap:12px!important;
        min-height:78px!important;
        margin:10px 0 0!important;
        padding:12px 13px!important;
        border:1px solid color-mix(in srgb,var(--brand) 18%,var(--line))!important;
        border-radius:17px!important;
        background:linear-gradient(145deg,color-mix(in srgb,var(--brand-soft) 62%,var(--surface)),var(--surface))!important;
        box-shadow:0 5px 16px rgba(18,104,232,.055)!important;
      }
      html body .dashboard-refresh #v6PlanRow .v6-plan-icon {
        display:grid!important;
        place-items:center!important;
        width:46px!important;
        height:46px!important;
        border-radius:14px!important;
        background:color-mix(in srgb,var(--brand-soft) 86%,var(--surface))!important;
        color:var(--brand)!important;
        font-size:22px!important;
        font-weight:700!important;
        line-height:1!important;
        box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--brand) 10%,transparent)!important;
      }
      html body .dashboard-refresh #v6PlanRow .v6-plan-copy {
        display:grid!important;
        align-content:center!important;
        gap:2px!important;
        min-width:0!important;
        text-align:start!important;
      }
      html body .dashboard-refresh #v6PlanRow #v6PlanLabel {
        margin:0!important;
        color:var(--brand)!important;
        font-size:9px!important;
        font-weight:900!important;
        line-height:1.15!important;
        letter-spacing:.11em!important;
      }
      html body .dashboard-refresh #v6PlanRow #v6NextCountry {
        display:flex!important;
        align-items:center!important;
        gap:8px!important;
        min-width:0!important;
        margin:2px 0 0!important;
        overflow:hidden!important;
        color:var(--text)!important;
        font-size:15px!important;
        font-weight:850!important;
        line-height:1.25!important;
        text-overflow:ellipsis!important;
        white-space:nowrap!important;
      }
      html body .dashboard-refresh #v6PlanRow #v6NextCountry .ts-country-flag-v705 {
        flex:0 0 auto!important;
        margin:0!important;
        vertical-align:middle!important;
      }
      html body .dashboard-refresh #v6PlanRow #v6NextCountryDates {
        margin:2px 0 0!important;
        overflow:hidden!important;
        color:var(--muted)!important;
        font-size:11.5px!important;
        font-weight:600!important;
        line-height:1.3!important;
        text-overflow:ellipsis!important;
        white-space:nowrap!important;
      }
      html body .dashboard-refresh #v6PlanRow .v6-plan-arrow {
        display:grid!important;
        place-items:center!important;
        width:20px!important;
        height:32px!important;
        color:color-mix(in srgb,var(--muted) 82%,var(--brand))!important;
        font-size:22px!important;
        font-weight:400!important;
        line-height:1!important;
        transform:none!important;
      }
      html[data-theme="dark"] body .dashboard-refresh #v6PlanRow.v6-plan-row {
        border-color:#2a405d!important;
        background:linear-gradient(145deg,rgba(25,65,119,.22),var(--surface))!important;
        box-shadow:none!important;
      }
      body.lang-ar .dashboard-refresh #v6PlanRow #v6PlanLabel {
        letter-spacing:0!important;
      }
      @media(max-width:420px) {
        html body .dashboard-refresh #v6PlanRow.v6-plan-row {
          grid-template-columns:42px minmax(0,1fr) 18px!important;
          gap:10px!important;
          min-height:74px!important;
          padding:11px 12px!important;
        }
        html body .dashboard-refresh #v6PlanRow .v6-plan-icon {
          width:42px!important;
          height:42px!important;
          border-radius:13px!important;
          font-size:20px!important;
        }
        html body .dashboard-refresh #v6PlanRow #v6NextCountry {font-size:14.5px!important}
        html body .dashboard-refresh #v6PlanRow #v6NextCountryDates {font-size:11px!important}
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

  function syncHeaderRoute(isAr) {
    const sub = document.getElementById("headerSub");
    const appState = window.TripSpendCore?.getState?.();
    const stops = Array.isArray(appState?.stops) ? appState.stops : [];
    if (!sub || !appState?.trip || stops.length <= 1) return;

    const names = stops.map(stop => {
      const english = String(stop?.country || "").trim();
      const localized = isAr ? country(english) : english;
      const flag = String(window.TripSpendCore?.countryFlag?.(english) || "").trim();
      return `${flag}${flag ? " " : ""}${localized}`.trim();
    });

    const preview = names.length <= 3
      ? names.join(" → ")
      : isAr
        ? `${names[0]} → ${names[1]} → +${names.length - 2} أخرى`
        : `${names[0]} → ${names[1]} → +${names.length - 2} more`;

    const count = isAr
      ? `${names.length} ${names.length === 1 ? "دولة" : "دول"}`
      : `${names.length} ${names.length === 1 ? "country" : "countries"}`;

    sub.textContent = `${count} • ${preview}`;
    sub.setAttribute("lang", isAr ? "ar" : "en");
  }

  function orderedStops() {
    const appState = window.TripSpendCore?.getState?.();
    const stops = Array.isArray(appState?.stops) ? appState.stops : [];
    return stops
      .filter(stop => stop && stop.country)
      .slice()
      .sort((a,b) => String(a.startDate || "").localeCompare(String(b.startDate || "")) || Number(a.createdAt || 0) - Number(b.createdAt || 0));
  }

  function currentAndNextStop() {
    const stops = orderedStops();
    if (!stops.length) return { current:null, next:null };
    const today = String(window.TripSpendCore?.today?.() || new Date().toISOString().slice(0,10));

    let currentIndex = -1;
    stops.forEach((stop,index) => {
      const start = String(stop.startDate || "");
      const end = String(stop.endDate || "");
      if (start && start <= today && (!end || today <= end)) currentIndex = index;
    });

    if (currentIndex < 0) {
      const started = stops.map((stop,index) => ({stop,index})).filter(row => String(row.stop.startDate || "") <= today);
      currentIndex = started.length ? started.at(-1).index : 0;
    }

    return {
      current:stops[currentIndex] || null,
      next:stops[currentIndex + 1] || null
    };
  }

  function syncHomeCountryElement(id, stop, isAr) {
    const el = document.getElementById(id);
    if (!el || !stop?.country) return;
    const english = String(stop.country).trim();
    const localized = isAr ? country(english) : english;
    const flag = String(window.TripSpendCore?.countryFlag?.(english) || "").trim();
    const key = `${isAr ? "ar" : "en"}|${english}`;
    if (el.dataset.tsHomeCountryKey === key) return;
    el.textContent = `${flag}${flag ? " " : ""}${localized}`.trim();
    el.dataset.tsHomeCountryKey = key;
    el.dataset.tsCountryCanonical = english;
    el.setAttribute("lang",isAr ? "ar" : "en");
  }

  function syncHomeCountries(isAr) {
    const { current, next } = currentAndNextStop();
    if (current) syncHomeCountryElement("currentCountryName",current,isAr);
    if (next) syncHomeCountryElement("v6NextCountry",next,isAr);
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
      if (summary) {
        if (isAr) {
          const english = summary.textContent;
          if (/\bexpenses?\b/i.test(english)) summary.dataset.tsExpenseSummaryEn = english;
          summary.textContent = translateEmbeddedCountries(english)
            .replace(/\b(\d+)\s+expenses\b/gi,"$1 مصروفات")
            .replace(/\b(\d+)\s+expense\b/gi,"$1 مصروف");
        } else if (summary.dataset.tsExpenseSummaryEn) {
          summary.textContent = summary.dataset.tsExpenseSummaryEn;
          delete summary.dataset.tsExpenseSummaryEn;
        }
      }

      syncHeaderRoute(isAr);
      syncDashboardWelcome(isAr);
      syncHomeQuickAdd(isAr);
      syncHomeCountries(isAr);
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
    window.addEventListener("tripspend:render",queue);
    window.addEventListener("tripspend:page",queue);
    apply();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded",start,{once:true}); else start();
})();
