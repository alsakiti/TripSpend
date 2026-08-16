(() => {
  "use strict";

  let mounted = false;

  function currentLanguage() {
    return window.TripSpendI18n?.language?.() === "ar" ? "ar" : "en";
  }

  function flagSvg(lang) {
    if (lang === "ar") {
      return `<svg class="ts-language-flag" viewBox="0 0 60 36" aria-hidden="true" focusable="false">
        <rect width="60" height="36" rx="2" fill="#fff"/>
        <rect y="12" width="60" height="12" fill="#d71920"/>
        <rect y="24" width="60" height="12" fill="#00843d"/>
        <rect width="15" height="36" fill="#d71920"/>
        <g transform="translate(7.5 7)" fill="none" stroke="#fff" stroke-width="1.25" stroke-linecap="round">
          <path d="M-2 0 L2 6 M2 0 L-2 6"/>
          <path d="M0 -1 V7"/>
          <circle cx="0" cy="3" r="2.2"/>
        </g>
      </svg>`;
    }

    return `<svg class="ts-language-flag" viewBox="0 0 60 36" aria-hidden="true" focusable="false">
      <rect width="60" height="36" rx="2" fill="#012169"/>
      <path d="M0 0 L60 36 M60 0 L0 36" stroke="#fff" stroke-width="8"/>
      <path d="M0 0 L60 36 M60 0 L0 36" stroke="#c8102e" stroke-width="4"/>
      <path d="M30 0 V36 M0 18 H60" stroke="#fff" stroke-width="12"/>
      <path d="M30 0 V36 M0 18 H60" stroke="#c8102e" stroke-width="7"/>
    </svg>`;
  }

  function updateFlag() {
    const button = document.getElementById("languageToggle");
    if (!button) return false;
    const lang = currentLanguage();
    button.innerHTML = flagSvg(lang);
    button.setAttribute("aria-label", lang === "ar" ? "Switch to English" : "التبديل إلى العربية");
    button.setAttribute("title", lang === "ar" ? "English" : "العربية");
    return true;
  }

  function mount() {
    const button = document.getElementById("languageToggle");
    const topbar = document.querySelector(".topbar");
    if (!button || !topbar) return false;

    if (!document.getElementById("languageFlagStyles")) {
      const style = document.createElement("style");
      style.id = "languageFlagStyles";
      style.textContent = `
        .topbar{position:relative}
        #languageToggle.language-toggle{
          position:absolute;right:18px;top:18px;z-index:8;
          width:48px;height:40px;min-width:48px;padding:7px;
          display:grid;place-items:center;border:1px solid rgba(120,130,150,.2);
          border-radius:14px;background:rgba(255,255,255,.78);
          -webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);
          box-shadow:0 6px 18px rgba(25,40,70,.08);
          cursor:pointer;direction:ltr!important;unicode-bidi:isolate!important;
          -webkit-tap-highlight-color:transparent;
        }
        #languageToggle .ts-language-flag{display:block;width:30px;height:18px;border-radius:2px;box-shadow:0 0 0 1px rgba(0,0,0,.08)}
        #languageToggle.language-toggle:active{transform:scale(.95)}
        html[data-theme="dark"] #languageToggle.language-toggle,
        body.dark #languageToggle.language-toggle{background:rgba(26,31,42,.8);border-color:rgba(255,255,255,.1)}
        @media (max-width:420px){#languageToggle.language-toggle{right:16px;top:17px}}
      `;
      document.head.appendChild(style);
    }

    if (button.parentElement !== topbar) topbar.appendChild(button);
    updateFlag();
    mounted = true;
    return true;
  }

  function ensureMounted() {
    if (mount()) return;
    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      if (mount() || attempts > 80) window.clearInterval(timer);
    }, 125);
  }

  window.addEventListener("tripspend:language", () => {
    if (!mounted) mount();
    updateFlag();
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ensureMounted, { once: true });
  } else {
    ensureMounted();
  }
})();
