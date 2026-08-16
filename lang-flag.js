(() => {
  "use strict";

  const LABEL = { en: "EN", ar: "AR" };
  let mounted = false;

  function currentLanguage() {
    return window.TripSpendI18n?.language?.() === "ar" ? "ar" : "en";
  }

  function updateLabel() {
    const button = document.getElementById("languageToggle");
    if (!button) return false;
    const lang = currentLanguage();
    button.textContent = LABEL[lang];
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
          width:44px;height:38px;min-width:44px;padding:0;
          display:grid;place-items:center;border:1px solid rgba(120,130,150,.2);
          border-radius:14px;background:rgba(255,255,255,.78);
          -webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);
          box-shadow:0 6px 18px rgba(25,40,70,.08);
          font-size:14px;font-weight:800;letter-spacing:.02em;line-height:1;cursor:pointer;
          direction:ltr!important;unicode-bidi:isolate!important;
          -webkit-tap-highlight-color:transparent;
        }
        #languageToggle.language-toggle:active{transform:scale(.95)}
        html[data-theme="dark"] #languageToggle.language-toggle,
        body.dark #languageToggle.language-toggle{background:rgba(26,31,42,.8);border-color:rgba(255,255,255,.1)}
        @media (max-width:420px){#languageToggle.language-toggle{right:16px;top:17px}}
      `;
      document.head.appendChild(style);
    }

    if (button.parentElement !== topbar) topbar.appendChild(button);
    updateLabel();
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
    updateLabel();
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ensureMounted, { once: true });
  } else {
    ensureMounted();
  }
})();
