(() => {
  "use strict";

  function language() {
    return window.TripSpendLocale?.language?.() === "ar" ? "ar" : "en";
  }

  function flagSvg(current) {
    if (current === "ar") {
      return `<svg viewBox="0 0 36 24" aria-hidden="true"><rect width="36" height="24" rx="3" fill="#fff"/><rect y="8" width="36" height="8" fill="#d72828"/><rect y="16" width="36" height="8" fill="#128a43"/><rect width="10" height="24" fill="#d72828"/><circle cx="5" cy="5" r="2" fill="none" stroke="#fff" stroke-width=".8"/></svg>`;
    }
    return `<svg viewBox="0 0 36 24" aria-hidden="true"><rect width="36" height="24" rx="3" fill="#012169"/><path d="M0 0 36 24M36 0 0 24" stroke="#fff" stroke-width="5"/><path d="M0 0 36 24M36 0 0 24" stroke="#c8102e" stroke-width="2"/><path d="M18 0v24M0 12h36" stroke="#fff" stroke-width="8"/><path d="M18 0v24M0 12h36" stroke="#c8102e" stroke-width="4"/></svg>`;
  }

  function ensureStyles() {
    if (document.getElementById("setupLanguageHostV700Styles")) return;
    const style = document.createElement("style");
    style.id = "setupLanguageHostV700Styles";
    style.textContent = `
      #setupView .hero.card{position:relative}
      #setupLanguageToggleV7{position:absolute;top:18px;right:18px;z-index:35;width:48px;height:42px;padding:7px;border:1px solid rgba(120,130,150,.2);border-radius:15px;background:rgba(255,255,255,.84);box-shadow:0 6px 18px rgba(25,40,70,.08);display:grid;place-items:center;cursor:pointer;-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);direction:ltr!important}
      #setupLanguageToggleV7 svg{width:32px;height:22px;display:block;border-radius:3px;box-shadow:0 1px 4px rgba(0,0,0,.12)}
      #setupLanguageToggleV7:active{transform:scale(.95)}
      html[data-theme="dark"] #setupLanguageToggleV7{background:rgba(19,31,42,.88);border-color:rgba(255,255,255,.10)}
      @media(max-width:420px){#setupLanguageToggleV7{top:16px;right:16px}}
    `;
    document.head.appendChild(style);
  }

  function update() {
    const button = document.getElementById("setupLanguageToggleV7");
    if (!button) return;
    const current = language();
    button.innerHTML = flagSvg(current);
    button.setAttribute("aria-label", current === "ar" ? "Switch to English" : "التبديل إلى العربية");
    button.setAttribute("title", current === "ar" ? "English" : "العربية");
  }

  function mount() {
    ensureStyles();
    const hero = document.querySelector("#setupView .hero.card");
    if (!hero) return false;
    let button = document.getElementById("setupLanguageToggleV7");
    if (!button) {
      button = document.createElement("button");
      button.id = "setupLanguageToggleV7";
      button.type = "button";
      button.addEventListener("click", () => {
        window.TripSpendLocale?.setLanguage?.(language() === "ar" ? "en" : "ar");
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
      if (mount() || ++attempts > 100) clearInterval(timer);
    }, 100);
  }

  window.addEventListener("tripspend:language", update);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once:true });
  else start();
})();
