(() => {
  "use strict";

  function language() {
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

  function ensureStyles() {
    if (document.getElementById("setupLanguageStyles")) return;
    const style = document.createElement("style");
    style.id = "setupLanguageStyles";
    style.textContent = `
      #setupView .hero.card{position:relative}
      #setupLanguageToggle{
        position:absolute;top:18px;right:18px;z-index:12;
        width:48px;height:40px;min-width:48px;padding:7px;
        display:grid;place-items:center;
        border:1px solid rgba(120,130,150,.22);
        border-radius:14px;
        background:rgba(255,255,255,.82);
        -webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);
        box-shadow:0 6px 18px rgba(25,40,70,.10);
        cursor:pointer;direction:ltr!important;letter-spacing:0!important;
        -webkit-tap-highlight-color:transparent;
      }
      #setupLanguageToggle .ts-language-flag{display:block;width:30px;height:18px;border-radius:2px;box-shadow:0 0 0 1px rgba(0,0,0,.08)}
      #setupLanguageToggle:active{transform:scale(.95)}
      html[data-theme="dark"] #setupLanguageToggle,
      body.dark #setupLanguageToggle{
        background:rgba(19,31,42,.88);
        border-color:rgba(255,255,255,.10);
      }
      @media (min-width:700px){
        body:has(#languageToggle) #setupLanguageToggle{display:none!important}
      }
      @media (max-width:420px){#setupLanguageToggle{top:16px;right:16px}}
    `;
    document.head.appendChild(style);
  }

  function update() {
    const button = document.getElementById("setupLanguageToggle");
    if (!button) return;
    const lang = language();
    button.innerHTML = flagSvg(lang);
    button.setAttribute("aria-label", lang === "ar" ? "Switch to English" : "التبديل إلى العربية");
    button.setAttribute("title", lang === "ar" ? "English" : "العربية");
  }

  function mount() {
    ensureStyles();
    const hero = document.querySelector("#setupView .hero.card");
    if (!hero) return false;

    let button = document.getElementById("setupLanguageToggle");
    if (!button) {
      button = document.createElement("button");
      button.id = "setupLanguageToggle";
      button.type = "button";
      button.addEventListener("click", () => {
        const next = language() === "ar" ? "en" : "ar";
        window.TripSpendI18n?.setLanguage?.(next);
      });
      hero.appendChild(button);
    }

    update();
    return true;
  }

  function start() {
    if (mount()) return;
    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      if (mount() || attempts > 80) clearInterval(timer);
    }, 125);
  }

  window.addEventListener("tripspend:language", () => {
    mount();
    update();
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
