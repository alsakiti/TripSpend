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

  function updateCanonical(button) {
    if (!button) return;
    const current = language();
    button.innerHTML = flagSvg(current);
    button.setAttribute("aria-label", current === "ar" ? "Switch to English" : "التبديل إلى العربية");
    button.setAttribute("title", current === "ar" ? "English" : "العربية");
  }

  function ensureExactlyOne() {
    // Retire the old setup-specific duplicate if an older cached runtime creates it.
    document.getElementById("setupLanguageToggleV7")?.remove();

    let canonical = document.getElementById("languageToggleV7");
    if (!canonical) {
      const topbar = document.querySelector(".topbar");
      if (!topbar) return;

      canonical = document.createElement("button");
      canonical.id = "languageToggleV7";
      canonical.type = "button";
      canonical.addEventListener("click", () => {
        window.TripSpendLocale?.setLanguage?.(language() === "ar" ? "en" : "ar");
      });
      topbar.appendChild(canonical);
    }

    updateCanonical(canonical);
  }

  function start() {
    ensureExactlyOne();

    const root = document.body;
    const observer = new MutationObserver(() => {
      if (document.getElementById("setupLanguageToggleV7") || !document.getElementById("languageToggleV7")) {
        ensureExactlyOne();
      }
    });
    observer.observe(root, { childList:true, subtree:true });

    window.addEventListener("tripspend:language", ensureExactlyOne);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once:true });
  } else {
    start();
  }
})();
