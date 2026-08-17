(() => {
  "use strict";

  const RELEASE = "7.0.5";
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

    // Apple, Android and most modern non-Windows platforms already render
    // regional-indicator flags correctly. Keep those native glyphs at their
    // natural width so iOS never crops a flag inside a fixed rectangle.
    if (!needsSvgFallback()) {
      renderNativeFlag(wrap, flag);
      return wrap;
    }

    // Windows intentionally displays many regional-indicator pairs as letters,
    // so use a real SVG there. If the network asset is unavailable, show a
    // compact ISO badge rather than an empty flag placeholder.
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
        object-fit:cover;
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

      /* Setup country search */
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

      /* Switch Trip route flags */
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

      /* Country lists and route previews remain compact. */
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

      @media(max-width:420px){
        .ts-country-flag-v705:not(.ts-country-flag-native){width:23px;height:15px;flex-basis:23px}
        .ts-country-flag-v705.ts-country-flag-native{font-size:20px}
        #destinationOptions .ts-country-flag-v705:not(.ts-country-flag-native),
        #setupExtraCountryOptions .ts-country-flag-v705:not(.ts-country-flag-native){width:25px;height:17px;flex-basis:25px}
        #destinationOptions .ts-country-flag-native,
        #setupExtraCountryOptions .ts-country-flag-native{font-size:21px}
        #tripSwitcherModal .ts-country-flag-native,
        #tripSwitcherSheet .ts-country-flag-native{font-size:21px}
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
    });
  }

  function start() {
    injectStyles();
    upgrade(document.body);

    const observer = new MutationObserver(records => {
      for (const record of records) {
        if (record.type === "characterData") upgradeTextNode(record.target);
        for (const node of record.addedNodes || []) upgrade(node);
      }
    });
    observer.observe(document.body, { childList:true, subtree:true, characterData:true });

    window.addEventListener("tripspend:render", scheduleUpgrade);
    window.addEventListener("tripspend:page", scheduleUpgrade);
    window.addEventListener("tripspend:language", scheduleUpgrade);
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