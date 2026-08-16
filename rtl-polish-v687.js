(() => {
  "use strict";

  const STYLE_ID = "tripSpendArabicPolishV687";
  let observer = null;
  let queued = false;

  function isArabic() {
    return window.TripSpendI18n?.language?.() === "ar" || document.body?.classList.contains("lang-ar");
  }

  function installStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      html.ts-ar-layout[dir="rtl"],
      html.ts-ar-layout[dir="rtl"] body.lang-ar,
      html[dir="rtl"] body.lang-ar {
        direction: rtl !important;
      }

      body.lang-ar {
        direction: rtl !important;
        text-align: right;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "SF Arabic", "Geeza Pro", "Segoe UI", Tahoma, Arial, sans-serif;
      }

      body.lang-ar .app,
      body.lang-ar main,
      body.lang-ar main > section,
      body.lang-ar .section,
      body.lang-ar .card,
      body.lang-ar .topbar,
      body.lang-ar .dashboard-welcome,
      body.lang-ar .dashboard-budget-card,
      body.lang-ar .dashboard-current-trip,
      body.lang-ar .dashboard-current-card,
      body.lang-ar .dashboard-country-card,
      body.lang-ar .dashboard-next-card,
      body.lang-ar .dashboard-route-card,
      body.lang-ar .country-budget-grid,
      body.lang-ar .trip-history-list,
      body.lang-ar .expense-list,
      body.lang-ar .planned-list,
      body.lang-ar .itinerary-list,
      body.lang-ar .bottom-nav,
      body.lang-ar nav {
        direction: rtl !important;
      }

      body.lang-ar .grid2,
      body.lang-ar .dashboard-budget-grid,
      body.lang-ar .country-budget-grid,
      body.lang-ar .dashboard-current-trip,
      body.lang-ar .dashboard-next-card,
      body.lang-ar .section-title,
      body.lang-ar .modal-head,
      body.lang-ar .trip-switcher-actions,
      body.lang-ar .expense-detail-actions {
        direction: rtl !important;
      }

      body.lang-ar .ts-ar-text,
      body.lang-ar .eyebrow,
      body.lang-ar [class*="eyebrow"],
      body.lang-ar [class*="kicker"],
      body.lang-ar [class*="label"],
      body.lang-ar [class*="title"],
      body.lang-ar [class*="heading"] {
        direction: rtl !important;
        unicode-bidi: isolate !important;
        letter-spacing: 0 !important;
        word-spacing: normal !important;
        text-transform: none !important;
        font-kerning: normal !important;
        font-variant-ligatures: common-ligatures contextual !important;
        font-feature-settings: "liga" 1, "calt" 1 !important;
        text-rendering: optimizeLegibility;
      }

      body.lang-ar .ts-ar-text:not(.ts-ar-center) {
        text-align: right !important;
      }

      body.lang-ar .ts-ar-center,
      body.lang-ar .bottom-nav .ts-ar-text,
      body.lang-ar nav .ts-ar-text,
      body.lang-ar button.ts-ar-text {
        text-align: center !important;
      }

      body.lang-ar .brand-kicker,
      body.lang-ar .eyebrow,
      body.lang-ar .dashboard-budget-card .eyebrow,
      body.lang-ar .dashboard-current-trip .eyebrow,
      body.lang-ar .dashboard-country-card .eyebrow,
      body.lang-ar .dashboard-next-card .eyebrow {
        letter-spacing: 0 !important;
      }

      body.lang-ar input,
      body.lang-ar textarea,
      body.lang-ar select {
        direction: rtl;
        text-align: right;
      }

      body.lang-ar input[type="number"],
      body.lang-ar input[type="date"],
      body.lang-ar input[type="time"],
      body.lang-ar .money,
      body.lang-ar [class*="money"],
      body.lang-ar [class*="amount"],
      body.lang-ar [class*="date"],
      body.lang-ar [class*="time"],
      body.lang-ar [class*="currency"],
      body.lang-ar .version-badge,
      body.lang-ar #languageToggle {
        direction: ltr !important;
        unicode-bidi: isolate !important;
      }

      body.lang-ar .bottom-nav {
        flex-direction: row !important;
      }

      body.lang-ar .smart-summary-arrow,
      body.lang-ar .trip-switcher-trigger,
      body.lang-ar .dashboard-next-card .app-icon,
      body.lang-ar .dashboard-next-card svg,
      body.lang-ar .trip-history-list .app-icon,
      body.lang-ar .trip-history-list svg {
        transform: scaleX(-1);
      }

      body.lang-ar #languageToggle {
        right: auto !important;
        left: 16px !important;
      }
    `;
    document.head.appendChild(style);
  }

  function applyDirection() {
    installStyles();
    const ar = isArabic();
    document.documentElement.lang = ar ? "ar" : "en";
    document.documentElement.dir = ar ? "rtl" : "ltr";
    if (document.body) {
      document.body.dir = ar ? "rtl" : "ltr";
      document.body.classList.toggle("ts-ar-polished", ar);
    }
  }

  function queueApply() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      applyDirection();
    });
  }

  function start() {
    installStyles();
    applyDirection();
    window.addEventListener("tripspend:language", queueApply);
    observer = new MutationObserver(() => {
      if (document.body?.classList.contains("lang-ar") || document.documentElement.dir === "rtl") queueApply();
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["dir", "lang", "class"],
      subtree: false
    });
    if (document.body) {
      observer.observe(document.body, {
        attributes: true,
        attributeFilter: ["class", "dir"],
        subtree: false
      });
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
