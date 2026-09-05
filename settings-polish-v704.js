(() => {
  "use strict";

  const RELEASE = "7.2.1";
  let built = false;
  let queued = false;

  const $ = id => document.getElementById(id);
  const core = () => window.TripSpendCore;
  const locale = () => window.TripSpendLocale;
  const language = () => locale()?.language?.() || document.documentElement.lang || "en";
  const ar = () => language() === "ar";
  const text = (en, arabic) => ar() ? arabic : en;

  function installStyles() {
    if ($("tripSpendSettingsPolishV704Styles")) return;
    const style = document.createElement("style");
    style.id = "tripSpendSettingsPolishV704Styles";
    style.textContent = `
      body.ts-page-settings .topbar{
        min-height:58px!important;
        padding:2px 2px 8px!important;
      }
      body.ts-page-settings .topbar .header-brand,
      body.ts-page-settings #settingsShortcut,
      body.ts-page-settings #tripSwitcherTrigger{
        display:none!important;
      }
      body.ts-no-floating-add #navAdd{
        display:none!important;
      }

      #settings.settings-simplified{
        max-width:620px;
        margin:0 auto;
        padding-bottom:116px;
      }
      #settings.settings-simplified>.page-title{
        margin:0 0 16px!important;
      }
      #settings.settings-simplified>.page-title .eyebrow{
        margin-bottom:5px;
        color:var(--brand);
        font-size:11px!important;
        letter-spacing:.12em;
      }
      #settings.settings-simplified>.page-title h2{
        font-size:30px!important;
        line-height:1.05;
      }
      .settings-page-subtitle{
        display:block;
        margin-top:6px;
        color:var(--muted);
        font-size:13px;
        line-height:1.4;
      }

      #settingsForm.settings-simple-form{
        padding:0!important;
        border:0!important;
        border-radius:0!important;
        background:transparent!important;
        box-shadow:none!important;
      }
      .settings-panel{
        margin:0 0 12px;
        padding:16px;
        border:1px solid color-mix(in srgb,var(--line) 88%,transparent);
        border-radius:18px;
        background:var(--surface);
        box-shadow:none;
      }
      .settings-panel-head{
        display:flex;
        align-items:flex-start;
        justify-content:space-between;
        gap:12px;
        margin-bottom:14px;
      }
      .settings-panel-head h3{
        margin:0;
        color:var(--text);
        font-size:17px;
        line-height:1.2;
        letter-spacing:-.02em;
      }
      .settings-panel-head small{
        display:block;
        margin-top:3px;
        color:var(--muted);
        font-size:11.5px;
        line-height:1.4;
      }
      .settings-panel-count{
        flex:0 0 auto;
        padding:6px 9px;
        border-radius:999px;
        background:var(--brand-soft);
        color:var(--brand);
        font-size:11px;
        font-weight:850;
      }
      .settings-panel label{
        margin-bottom:13px!important;
        font-size:13px!important;
      }
      .settings-panel label:last-child{
        margin-bottom:0!important;
      }
      .settings-panel input,
      .settings-panel select,
      .settings-panel .date-picker-card{
        min-height:48px!important;
      }
      .settings-legacy-destination{
        display:none!important;
      }
      .settings-panel .settings-date-grid{
        margin-top:2px;
      }

      .settings-country-list-compact{
        display:grid;
        gap:7px;
        margin:2px 0 11px;
      }
      .settings-country-row{
        display:grid;
        grid-template-columns:38px minmax(0,1fr) auto;
        align-items:center;
        gap:10px;
        min-height:56px;
        padding:9px 10px;
        border:1px solid color-mix(in srgb,var(--line) 82%,transparent);
        border-radius:13px;
        background:var(--surface2);
      }
      .settings-country-flag{
        display:grid;
        width:38px;
        height:38px;
        place-items:center;
        border-radius:11px;
        background:color-mix(in srgb,var(--surface) 70%,transparent);
        font-size:21px;
      }
      .settings-country-copy{
        min-width:0;
      }
      .settings-country-copy strong,
      .settings-country-copy small{
        display:block;
      }
      .settings-country-copy strong{
        overflow:hidden;
        color:var(--text);
        font-size:13.5px;
        text-overflow:ellipsis;
        white-space:nowrap;
      }
      .settings-country-copy small{
        margin-top:3px;
        color:var(--muted);
        font-size:11px;
        line-height:1.3;
      }
      .settings-country-currency{
        color:var(--brand);
        font-size:11px;
        font-weight:850;
      }
      #settings .multi-country-settings{
        display:block!important;
        margin:0!important;
        padding:0!important;
        border:0!important;
        background:transparent!important;
      }
      #settings .multi-country-settings>div:first-child{
        display:none!important;
      }
      #settings .multi-country-settings #settingsAddCountry{
        width:100%;
        min-height:44px!important;
        border-radius:12px!important;
        font-size:12.5px!important;
      }

      .settings-save-dock{
        position:sticky;
        z-index:24;
        bottom:calc(86px + env(safe-area-inset-bottom));
        margin:4px 0 14px;
        padding:8px;
        border:1px solid color-mix(in srgb,var(--line) 72%,transparent);
        border-radius:16px;
        background:color-mix(in srgb,var(--surface) 90%,transparent);
        box-shadow:0 10px 28px rgba(15,23,42,.13);
        -webkit-backdrop-filter:blur(16px) saturate(115%);
        backdrop-filter:blur(16px) saturate(115%);
      }
      .settings-save-dock .primary{
        min-height:50px!important;
        border-radius:12px!important;
        font-size:14px!important;
      }

      #settings .settings-group-label{
        margin:20px 3px 8px!important;
        font-size:11px!important;
      }
      #settings .settings-manage-card{
        min-height:66px!important;
        padding:13px 14px!important;
        border-radius:15px!important;
      }
      #settings .settings-manage-card>div strong{
        font-size:13.5px!important;
      }
      #settings .settings-manage-card>div p{
        font-size:11.5px!important;
      }
      #settings .settings-manage-card>button{
        min-height:38px!important;
        font-size:11px!important;
      }
      #settings .settings-plan-shortcut-card{
        display:none!important;
      }

      .settings-advanced{
        margin-top:12px;
        border:1px solid var(--line);
        border-radius:17px;
        background:var(--surface);
        overflow:hidden;
      }
      .settings-advanced>summary{
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:12px;
        min-height:66px;
        padding:13px 15px;
        cursor:pointer;
        list-style:none;
        -webkit-tap-highlight-color:transparent;
      }
      .settings-advanced>summary::-webkit-details-marker{display:none}
      .settings-advanced-summary-copy strong,
      .settings-advanced-summary-copy small{
        display:block;
      }
      .settings-advanced-summary-copy strong{
        color:var(--text);
        font-size:14px;
      }
      .settings-advanced-summary-copy small{
        margin-top:3px;
        color:var(--muted);
        font-size:11px;
        line-height:1.35;
      }
      .settings-advanced-arrow{
        color:var(--muted);
        font-size:18px;
        transition:transform .16s ease;
      }
      .settings-advanced[open] .settings-advanced-arrow{transform:rotate(180deg)}
      .settings-advanced-content{
        padding:0 10px 12px;
        border-top:1px solid var(--line);
      }
      .settings-advanced-content>.card,
      .settings-advanced-content>.section,
      .settings-advanced-content>.settings-group-label{
        margin-top:10px!important;
      }

      html[dir="rtl"] .settings-panel-head,
      html[dir="rtl"] .settings-country-row,
      html[dir="rtl"] .settings-advanced>summary{
        direction:rtl;
      }
      html[dir="rtl"] .settings-country-currency{
        direction:ltr;
        unicode-bidi:isolate;
      }
      html[dir="rtl"] #settings.settings-simplified .eyebrow,
      html[dir="rtl"] #settings.settings-simplified .settings-group-label{
        letter-spacing:0!important;
        text-transform:none!important;
      }

      @media(max-width:600px){
        #settings.settings-simplified>.page-title h2{font-size:27px!important}
        .settings-panel{padding:14px}
        .settings-panel .grid2{grid-template-columns:1fr 1fr!important;gap:9px!important}
        .settings-panel label{font-size:12.5px!important}
        .settings-country-row{min-height:54px}
        .settings-save-dock{bottom:calc(82px + env(safe-area-inset-bottom))}
        #settings .settings-manage-card{
          grid-template-columns:minmax(0,1fr) auto!important;
        }
      }
      @media(max-width:390px){
        .settings-panel .settings-date-grid,
        .settings-panel .settings-money-grid{grid-template-columns:1fr!important}
        #settings .settings-manage-card{grid-template-columns:1fr!important}
        #settings .settings-manage-card>button{width:100%!important}
      }
    `;
    document.head.appendChild(style);
  }

  function panel(id, titleEn, titleAr, hintEn, hintAr) {
    let section = $(id);
    if (section) return section;
    section = document.createElement("section");
    section.id = id;
    section.className = "settings-panel";
    const head = document.createElement("div");
    head.className = "settings-panel-head";
    const copy = document.createElement("div");
    const title = document.createElement("h3");
    title.dataset.en = titleEn;
    title.dataset.ar = titleAr;
    const hint = document.createElement("small");
    hint.dataset.en = hintEn;
    hint.dataset.ar = hintAr;
    copy.append(title, hint);
    head.append(copy);
    section.append(head);
    return section;
  }

  function setBilingual(el) {
    if (!el) return;
    if (el.dataset.en || el.dataset.ar) el.textContent = ar() ? (el.dataset.ar || el.dataset.en) : (el.dataset.en || el.dataset.ar);
  }

  function translateGenerated() {
    document.querySelectorAll("#settings [data-en], #settings [data-ar]").forEach(setBilingual);
    const add = $("settingsAddCountry");
    if (add) add.textContent = text("＋ Add country", "＋ إضافة دولة");
    const save = $("settingsForm")?.querySelector('.settings-save-dock button[type="submit"]');
    if (save) save.textContent = text("Save changes", "حفظ التغييرات");
  }

  function buildSettings() {
    if (built) return;
    const settings = $("settings");
    const form = $("settingsForm");
    if (!settings || !form) return;

    installStyles();
    settings.classList.add("settings-simplified");
    form.classList.add("settings-simple-form");

    const pageTitle = settings.querySelector(":scope > .page-title");
    if (pageTitle) {
      const eyebrow = pageTitle.querySelector(".eyebrow");
      const h2 = pageTitle.querySelector("h2");
      if (eyebrow) { eyebrow.dataset.en = "SETTINGS"; eyebrow.dataset.ar = "الإعدادات"; }
      if (h2) { h2.dataset.en = "Trip settings"; h2.dataset.ar = "إعدادات الرحلة"; }
      if (!pageTitle.querySelector(".settings-page-subtitle")) {
        const subtitle = document.createElement("small");
        subtitle.className = "settings-page-subtitle";
        subtitle.dataset.en = "Manage the essentials for this trip.";
        subtitle.dataset.ar = "إدارة الإعدادات الأساسية لهذه الرحلة.";
        pageTitle.querySelector("div")?.append(subtitle);
      }
    }

    const nameLabel = $("sTripName")?.closest("label");
    const destinationLabel = $("sDestination")?.closest("label");
    const dateGrid = settings.querySelector(".settings-date-grid");
    const multi = settings.querySelector(".multi-country-settings");
    const budgetLabel = $("sBudget")?.closest("label");
    const homeGrid = $("sHomeCurrency")?.closest(".grid2");
    const paymentLabel = $("sDefaultPayment")?.closest("label");
    const submit = form.querySelector('button[type="submit"]');

    const basic = panel("settingsBasicPanel", "Trip details", "تفاصيل الرحلة", "Name and travel dates.", "الاسم وتواريخ السفر.");
    const countries = panel("settingsCountriesPanel", "Countries", "الدول", "Your route in travel order.", "مسار رحلتك حسب ترتيب السفر.");
    const budget = panel("settingsBudgetPanel", "Budget & payment", "الميزانية والدفع", "Money defaults used across TripSpend.", "الإعدادات المالية الافتراضية في TripSpend.");

    if (nameLabel) basic.append(nameLabel);
    if (destinationLabel) {
      destinationLabel.classList.add("settings-legacy-destination");
      basic.append(destinationLabel);
    }
    if (dateGrid) basic.append(dateGrid);

    if (multi) {
      const list = document.createElement("div");
      list.id = "settingsCountryListCompact";
      list.className = "settings-country-list-compact";
      multi.insertBefore(list, $("settingsAddCountry") || null);
      countries.append(multi);
    }

    if (budgetLabel) budget.append(budgetLabel);
    if (homeGrid) {
      homeGrid.classList.add("settings-money-grid");
      budget.append(homeGrid);
    }
    if (paymentLabel) budget.append(paymentLabel);

    form.prepend(basic, countries, budget);

    if (submit) {
      const dock = document.createElement("div");
      dock.className = "settings-save-dock";
      dock.append(submit);
      form.append(dock);
    }

    const settingsPlanButton = $("settingsPlan");
    settingsPlanButton?.closest(".settings-manage-card")?.classList.add("settings-plan-shortcut-card");

    const appearance = settings.querySelector(".appearance-card");
    if (appearance && !$("settingsAdvanced")) {
      const details = document.createElement("details");
      details.id = "settingsAdvanced";
      details.className = "settings-advanced";
      const summary = document.createElement("summary");
      const copy = document.createElement("span");
      copy.className = "settings-advanced-summary-copy";
      const strong = document.createElement("strong");
      strong.dataset.en = "Advanced & data";
      strong.dataset.ar = "الخيارات المتقدمة والبيانات";
      const small = document.createElement("small");
      small.dataset.en = "Backups, updates, diagnostics, exports and saved rates.";
      small.dataset.ar = "النسخ الاحتياطية والتحديثات والفحوصات والتصدير وأسعار الصرف المحفوظة.";
      copy.append(strong, small);
      const arrow = document.createElement("span");
      arrow.className = "settings-advanced-arrow";
      arrow.textContent = "⌄";
      summary.append(copy, arrow);
      const content = document.createElement("div");
      content.className = "settings-advanced-content";
      details.append(summary, content);
      details.addEventListener("toggle", () => {
        if (!details.open) return;
        requestAnimationFrame(() => window.TripSpendFX?.refresh?.());
      });
      appearance.after(details);

      const move = [
        settings.querySelector(".data-safety-card"),
        settings.querySelector(".app-update-card"),
        settings.querySelector(".diagnostics-card"),
        settings.querySelector(".settings-tools-label"),
        settings.querySelector(".settings-tools-section"),
        $("installCard"),
        ...settings.querySelectorAll(".settings-tool-card")
      ];
      [...new Set(move.filter(Boolean))].forEach(node => content.append(node));
    }

    built = true;
    renderCountries();
    translateGenerated();
  }

  function renderCountries() {
    const list = $("settingsCountryListCompact");
    const count = $("settingsCountriesPanel")?.querySelector(".settings-panel-count");
    if (!list) return;

    const state = core()?.getState?.();
    const stops = Array.isArray(state?.stops) && state.stops.length
      ? state.stops
      : (state?.trip?.destination ? [{
          country:state.trip.destination,
          startDate:state.trip.startDate,
          endDate:state.trip.endDate,
          currency:state.trip.tripCurrency
        }] : []);

    list.replaceChildren();
    const panelHead = $("settingsCountriesPanel")?.querySelector(".settings-panel-head");
    let badge = panelHead?.querySelector(".settings-panel-count");
    if (!badge && panelHead) {
      badge = document.createElement("span");
      badge.className = "settings-panel-count";
      panelHead.append(badge);
    }
    if (badge) badge.textContent = ar() ? `${stops.length} دول` : `${stops.length} ${stops.length === 1 ? "country" : "countries"}`;

    stops.forEach(stop => {
      const row = document.createElement("div");
      row.className = "settings-country-row";
      const flag = document.createElement("span");
      flag.className = "settings-country-flag";
      flag.textContent = core()?.countryFlag?.(stop.country) || "🌍";
      const copy = document.createElement("span");
      copy.className = "settings-country-copy";
      const strong = document.createElement("strong");
      strong.textContent = locale()?.country?.(stop.country) || stop.country;
      const small = document.createElement("small");
      const from = stop.startDate ? (locale()?.formatDate?.(core()?.fmtDateWithYear?.(stop.startDate) || stop.startDate) || stop.startDate) : "";
      const to = stop.endDate ? (locale()?.formatDate?.(core()?.fmtDateWithYear?.(stop.endDate) || stop.endDate) || stop.endDate) : "";
      small.textContent = from && to ? `${from} – ${to}` : text("Trip country", "دولة في الرحلة");
      copy.append(strong, small);
      const currency = document.createElement("span");
      currency.className = "settings-country-currency";
      currency.textContent = stop.currency || state?.trip?.tripCurrency || "";
      row.append(flag, copy, currency);
      list.append(row);
    });
  }

  function syncPageMode() {
    const active = document.querySelector(".page.active")?.id || "";
    document.body.classList.toggle("ts-page-settings", active === "settings");
    document.body.classList.toggle("ts-no-floating-add", ["settings", "analytics", "trips", "people"].includes(active));
    if (active === "settings") {
      buildSettings();
      renderCountries();
      translateGenerated();
    }
  }

  function queueSync() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      syncPageMode();
    });
  }

  function start() {
    installStyles();
    syncPageMode();
    window.addEventListener("tripspend:page", queueSync);
    window.addEventListener("tripspend:render", queueSync);
    window.addEventListener("tripspend:language", () => {
      if (document.querySelector(".page.active")?.id !== "settings") return;
      requestAnimationFrame(() => {
        translateGenerated();
        renderCountries();
      });
    });
    document.addEventListener("click", event => {
      if (event.target?.closest?.(".nav-btn, #settingsShortcut, #settingsTrips, #settingsPeople, #settingsPlan, #settingsAddCountry")) queueSync();
    }, true);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once:true });
  else start();

  window.TripSpendSettingsPolish = { release:RELEASE, apply:syncPageMode, renderCountries };
})();
