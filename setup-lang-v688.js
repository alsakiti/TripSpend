(() => {
  "use strict";

  const FLAG = { en: "🇬🇧", ar: "🇴🇲" };

  function language() {
    return window.TripSpendI18n?.language?.() === "ar" ? "ar" : "en";
  }

  function ensureStyles() {
    if (document.getElementById("setupLanguageStyles")) return;
    const style = document.createElement("style");
    style.id = "setupLanguageStyles";
    style.textContent = `
      #setupView .hero.card{position:relative}
      #setupLanguageToggle{
        position:absolute;top:18px;right:18px;z-index:12;
        width:44px;height:38px;min-width:44px;padding:0;
        display:grid;place-items:center;
        border:1px solid rgba(120,130,150,.22);
        border-radius:14px;
        background:rgba(255,255,255,.82);
        -webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);
        box-shadow:0 6px 18px rgba(25,40,70,.10);
        font-size:23px;line-height:1;cursor:pointer;
        direction:ltr!important;letter-spacing:0!important;
        -webkit-tap-highlight-color:transparent;
      }
      #setupLanguageToggle:active{transform:scale(.95)}
      html[data-theme="dark"] #setupLanguageToggle,
      body.dark #setupLanguageToggle{
        background:rgba(19,31,42,.88);
        border-color:rgba(255,255,255,.10);
      }
      @media (max-width:420px){#setupLanguageToggle{top:16px;right:16px}}
    `;
    document.head.appendChild(style);
  }

  function update() {
    const button = document.getElementById("setupLanguageToggle");
    if (!button) return;
    const lang = language();
    button.textContent = FLAG[lang];
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
        if (window.TripSpendI18n?.setLanguage) {
          window.TripSpendI18n.setLanguage(next);
        }
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
