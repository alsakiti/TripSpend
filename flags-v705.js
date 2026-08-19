(() => {
  "use strict";

  const RELEASE = "7.1.0";
  const FLAG_RE = /[\u{1F1E6}-\u{1F1FF}]{2}/gu;
  const CDN_BASE = "https://cdn.jsdelivr.net/gh/lipis/flag-icons@7.3.2/flags/4x3";
  const WINDOWS_RE = /Windows NT/i;
  let scheduled = false;

  function flagCode(flag) {
    const chars = [...String(flag || "")];
    if (chars.length !== 2) return "";
    const letters = chars.map(char => {
      const point = char.codePointAt(0);
      if (point < 0x1F1E6 || point > 0x1F1FF) return "";
      return String.fromCharCode(97 + point - 0x1F1E6);
    });
    return letters.every(Boolean) ? letters.join("") : "";
  }

  function needsSvgFallback() {
    return WINDOWS_RE.test(navigator.userAgent || "");
  }

  function renderNativeFlag(wrap, flag) {
    wrap.replaceChildren(document.createTextNode(flag));
    wrap.classList.add("ts-country-flag-native");
    wrap.classList.remove("ts-country-flag-svg", "ts-country-flag-failed");
  }

  function renderCodeFallback(wrap, code) {
    wrap.replaceChildren(document.createTextNode(code.toUpperCase()));
    wrap.classList.add("ts-country-flag-failed");
    wrap.classList.remove("ts-country-flag-svg", "ts-country-flag-native");
  }

  function makeFlag(flag) {
    const code = flagCode(flag);
    if (!code) return document.createTextNode(flag);

    const wrap = document.createElement("span");
    wrap.className = "ts-country-flag-v705";
    wrap.dataset.countryCode = code.toUpperCase();
    wrap.setAttribute("aria-hidden", "true");

    if (!needsSvgFallback()) {
      renderNativeFlag(wrap, flag);
      return wrap;
    }

    const img = document.createElement("img");
    img.src = `${CDN_BASE}/${code}.svg`;
    img.alt = "";
    img.loading = "eager";
    img.decoding = "async";
    img.referrerPolicy = "no-referrer";
    img.addEventListener("load", () => wrap.classList.add("ts-country-flag-loaded"), { once:true });
    img.addEventListener("error", () => renderCodeFallback(wrap, code), { once:true });
    wrap.classList.add("ts-country-flag-svg");
    wrap.append(img);
    return wrap;
  }

  function eligibleTextNode(node) {
    if (!node?.parentElement || !node.nodeValue || !FLAG_RE.test(node.nodeValue)) return false;
    FLAG_RE.lastIndex = 0;
    const parent = node.parentElement;
    if (parent.closest("script,style,textarea,select,option,.ts-country-flag-v705")) return false;
    return true;
  }

  function upgradeTextNode(node) {
    if (!eligibleTextNode(node)) return;
    const text = node.nodeValue;
    FLAG_RE.lastIndex = 0;
    let match;
    let cursor = 0;
    const fragment = document.createDocumentFragment();

    while ((match = FLAG_RE.exec(text))) {
      if (match.index > cursor) fragment.append(document.createTextNode(text.slice(cursor, match.index)));
      fragment.append(makeFlag(match[0]));
      cursor = match.index + match[0].length;
    }
    if (cursor < text.length) fragment.append(document.createTextNode(text.slice(cursor)));
    node.replaceWith(fragment);
    FLAG_RE.lastIndex = 0;
  }

  function upgrade(root = document.body) {
    if (!root) return;
    if (root.nodeType === Node.TEXT_NODE) {
      upgradeTextNode(root);
      return;
    }
    if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE && root !== document.body) return;

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(upgradeTextNode);
  }

  function isArabicUi() {
    const language = window.TripSpendLocale?.language?.() || document.documentElement.lang || "en";
    return String(language).toLowerCase().startsWith("ar");
  }

  function formatSetupDate(value) {
    const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return isArabicUi() ? "اختر التاريخ" : "Select date";
    const year = Number(match[1]);
    const monthIndex = Number(match[2]) - 1;
    const day = Number(match[3]);
    const date = new Date(year, monthIndex, day);
    if (Number.isNaN(date.getTime())) return isArabicUi() ? "اختر التاريخ" : "Select date";
    const locale = isArabicUi() ? "ar-OM-u-nu-latn" : "en-GB";
    const month = new Intl.DateTimeFormat(locale, { month:isArabicUi() ? "long" : "short" }).format(date);
    return `${day} ${month} ${year}`;
  }

  function refreshSetupDateDisplays(root = document) {
    const pairs = [
      ["startDate", "startDateDisplay"],
      ["endDate", "endDateDisplay"],
      ["setupExtraStart", "setupExtraStartDisplay"],
      ["setupExtraEnd", "setupExtraEndDisplay"]
    ];
    for (const [inputId, displayId] of pairs) {
      const input = root.getElementById?.(inputId) || document.getElementById(inputId);
      const display = root.getElementById?.(displayId) || document.getElementById(displayId);
      if (!input || !display) continue;
      display.textContent = formatSetupDate(input.value);
      display.classList.add("ts-date-display-v706");
      display.setAttribute("dir", "ltr");
      display.dataset.tsDateLocale = isArabicUi() ? "ar" : "en";
    }
  }

  function bindSetupDatePickers(root = document) {
    const cards = [];
    if (root?.matches?.("#setupView .date-picker-card")) cards.push(root);
    root?.querySelectorAll?.("#setupView .date-picker-card").forEach(card => cards.push(card));

    cards.forEach(card => {
      if (card.dataset.tsDatePickerBound === "1") return;
      const input = card.querySelector('input[type="date"]');
      if (!input) return;
      card.dataset.tsDatePickerBound = "1";
      let opening = false;

      const refreshDisplay = () => refreshSetupDateDisplays(document);
      input.addEventListener("input", refreshDisplay);
      input.addEventListener("change", refreshDisplay);

      card.addEventListener("click", event => {
        if (opening) return;
        opening = true;
        event.preventDefault();
        try {
          input.focus({ preventScroll:true });
          if (typeof input.showPicker === "function") input.showPicker();
          else input.click();
        } catch {
          try { input.click(); } catch {}
        } finally {
          queueMicrotask(() => { opening = false; });
        }
      }, { capture:true });
    });

    refreshSetupDateDisplays(document);
  }

  function injectStyles() {
    if (document.getElementById("tripSpendFlagsV705Styles")) return;
    const style = document.createElement("style");
    style.id = "tripSpendFlagsV705Styles";
    style.textContent = `
      .ts-country-flag-v705{
        display:inline-flex;
        width:24px;
        height:16px;
        flex:0 0 24px;
        align-items:center;
        justify-content:center;
        overflow:hidden;
        border-radius:3px;
        vertical-align:-2px;
        line-height:1;
        box-shadow:0 0 0 1px color-mix(in srgb,var(--line) 58%,transparent);
        background:color-mix(in srgb,var(--surface2) 88%,transparent);
      }
      .ts-country-flag-v705.ts-country-flag-native{
        display:inline-block!important;
        width:auto!important;
        min-width:0!important;
        height:auto!important;
        flex:0 0 auto!important;
        overflow:visible!important;
        border-radius:0!important;
        background:transparent!important;
        box-shadow:none!important;
        font-family:"Apple Color Emoji","Noto Color Emoji","Segoe UI Emoji",sans-serif;
        font-size:20px;
        line-height:1!important;
        letter-spacing:normal!important;
        white-space:nowrap!important;
        text-align:center;
        vertical-align:-3px;
      }
      .ts-country-flag-v705 img{
        display:block;
        width:100%;
        height:100%;
        object-fit:contain;
      }
      .ts-country-flag-v705.ts-country-flag-failed{
        border:1px solid color-mix(in srgb,var(--muted) 34%,var(--line));
        color:var(--muted);
        background:color-mix(in srgb,var(--surface2) 94%,transparent);
        box-shadow:none;
        font-size:7px;
        font-weight:850;
        letter-spacing:.02em;
      }

      #destinationOptions .ts-country-flag-v705,
      #setupExtraCountryOptions .ts-country-flag-v705{
        width:26px;
        height:18px;
        flex-basis:26px;
        margin-inline-end:8px;
        vertical-align:middle;
      }
      #destinationOptions .ts-country-flag-native,
      #setupExtraCountryOptions .ts-country-flag-native{
        font-size:22px;
        margin-inline-end:8px;
        vertical-align:-4px;
      }

      .trip-switcher-modal .ts-country-flag-v705,
      .trip-switcher-sheet .ts-country-flag-v705,
      #tripSwitcherModal .ts-country-flag-v705,
      #tripSwitcherSheet .ts-country-flag-v705,
      .trip-card .ts-country-flag-v705,
      .trip-switcher-card .ts-country-flag-v705{
        width:25px;
        height:17px;
        flex-basis:25px;
        margin-inline-end:3px;
      }
      .trip-switcher-modal .ts-country-flag-native,
      .trip-switcher-sheet .ts-country-flag-native,
      #tripSwitcherModal .ts-country-flag-native,
      #tripSwitcherSheet .ts-country-flag-native,
      .trip-card .ts-country-flag-native,
      .trip-switcher-card .ts-country-flag-native{
        font-size:22px;
        margin-inline-end:5px;
        vertical-align:-4px;
      }

      #settings .settings-country-flag .ts-country-flag-v705,
      #settings .ts-country-flag-v705{
        width:26px;
        height:18px;
        flex-basis:26px;
      }
      #settings .settings-country-flag .ts-country-flag-native,
      #settings .ts-country-flag-native{
        font-size:21px;
      }
      .ts-setup-preview-route .ts-country-flag-v705,
      #tsSetupPrimaryRoute .ts-country-flag-v705,
      #setupRouteList .ts-country-flag-v705{
        width:24px;
        height:16px;
        flex-basis:24px;
      }
      .ts-setup-preview-route .ts-country-flag-native,
      #tsSetupPrimaryRoute .ts-country-flag-native,
      #setupRouteList .ts-country-flag-native{
        font-size:20px;
      }

      /* v7.0.6 onboarding date cards: comfortable text metrics, upright calendar,
         balanced edge spacing, and the native input still owns the full tap area. */
      #setupView .date-picker-card{
        cursor:pointer!important;
        min-height:54px!important;
        height:54px!important;
        padding:0 15px!important;
        align-items:center!important;
        justify-content:space-between!important;
        gap:12px!important;
        overflow:hidden!important;
      }
      #setupView .date-picker-card .native-date-input{
        position:absolute!important;
        inset:0!important;
        width:100%!important;
        height:100%!important;
        min-width:0!important;
        max-width:none!important;
        z-index:3!important;
        opacity:0!important;
        cursor:pointer!important;
      }
      #setupView .date-display.ts-date-display-v706{
        display:flex!important;
        align-items:center!important;
        flex:1 1 auto!important;
        min-width:0!important;
        min-height:24px!important;
        padding:2px 0 3px!important;
        direction:ltr!important;
        unicode-bidi:isolate!important;
        color:var(--text)!important;
        font-size:13.5px!important;
        font-weight:780!important;
        font-variant-numeric:tabular-nums;
        line-height:1.4!important;
        letter-spacing:0!important;
        white-space:nowrap!important;
        overflow:hidden!important;
        text-overflow:ellipsis!important;
      }
      #setupView .date-calendar{
        display:grid!important;
        place-items:center!important;
        flex:0 0 22px!important;
        width:22px!important;
        height:22px!important;
        margin-inline-start:auto!important;
        margin-inline-end:0!important;
        padding:0!important;
        color:var(--muted)!important;
        font-size:14px!important;
        line-height:1!important;
        transform:none!important;
        opacity:.82;
      }
      #setupView .date-calendar svg{
        display:block!important;
        width:20px!important;
        height:20px!important;
        transform:none!important;
      }
      html[dir="ltr"] #setupView .date-display.ts-date-display-v706{text-align:left!important}
      html[dir="rtl"] #setupView .date-display.ts-date-display-v706{text-align:right!important}
      html[dir="rtl"] #setupView.ts-setup-onboarding .ts-setup-panel[data-setup-step="1"] .primary-country-dates>.date-field-label:first-child,
      html[dir="rtl"] #setupView.ts-setup-onboarding .ts-setup-panel[data-setup-step="1"] .primary-country-dates>.date-field-label:nth-child(2){
        grid-row:1!important;
      }

      @media(max-width:420px){
        .ts-country-flag-v705:not(.ts-country-flag-native){width:23px;height:15px;flex-basis:23px}
        .ts-country-flag-v705.ts-country-flag-native{font-size:20px}
        #destinationOptions .ts-country-flag-v705:not(.ts-country-flag-native),
        #setupExtraCountryOptions .ts-country-flag-v705:not(.ts-country-flag-native){width:25px;height:17px;flex-basis:25px}
        #destinationOptions .ts-country-flag-native,
        #setupExtraCountryOptions .ts-country-flag-native{font-size:21px}
        #tripSwitcherModal .ts-country-flag-native,
        #tripSwitcherSheet .ts-country-flag-native{font-size:21px}
        #setupView .date-picker-card{height:52px!important;min-height:52px!important;padding:0 13px!important;gap:9px!important}
        #setupView .date-display.ts-date-display-v706{font-size:12.5px!important;line-height:1.42!important}
        #setupView .date-calendar{flex-basis:21px!important;width:21px!important;height:21px!important}
        #setupView .date-calendar svg{width:19px!important;height:19px!important}
      }
      @media(max-width:350px){
        html[dir="rtl"] #setupView.ts-setup-onboarding .ts-setup-panel[data-setup-step="1"] .primary-country-dates>.date-field-label:first-child{grid-row:1!important}
        html[dir="rtl"] #setupView.ts-setup-onboarding .ts-setup-panel[data-setup-step="1"] .primary-country-dates>.date-field-label:nth-child(2){grid-row:2!important}
      }
    `;
    document.head.append(style);
  }

  function scheduleUpgrade() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      upgrade(document.body);
      bindSetupDatePickers(document);
    });
  }

  function start() {
    injectStyles();
    upgrade(document.body);
    bindSetupDatePickers(document);
    refreshSetupDateDisplays(document);

    const observer = new MutationObserver(records => {
      for (const record of records) {
        if (record.type === "characterData") upgradeTextNode(record.target);
        for (const node of record.addedNodes || []) {
          upgrade(node);
          if (node.nodeType === Node.ELEMENT_NODE) bindSetupDatePickers(node);
        }
      }
    });
    observer.observe(document.body, { childList:true, subtree:true, characterData:true });

    window.addEventListener("tripspend:language", () => requestAnimationFrame(() => refreshSetupDateDisplays(document)));
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once:true });
  else start();

  window.TripSpendFlags = {
    version:RELEASE,
    upgrade,
    flagCode,
    needsSvgFallback,
    source:needsSvgFallback() ? CDN_BASE : "native-emoji"
  };
})();
