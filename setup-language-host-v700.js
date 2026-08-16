(() => {
  "use strict";

  // v7.0.4 hotfix: the global locale runtime already owns the canonical
  // #languageToggleV7 button. The setup-specific host previously created a
  // second flag, so this compatibility shim only removes that legacy duplicate.
  function removeDuplicate() {
    document.getElementById("setupLanguageToggleV7")?.remove();
  }

  function start() {
    removeDuplicate();

    // Guard against an older cached setup host briefly recreating the legacy
    // button during startup. Keep exactly one language control in the UI.
    const root = document.getElementById("setupView") || document.body;
    const observer = new MutationObserver(() => removeDuplicate());
    observer.observe(root, { childList:true, subtree:true });

    window.addEventListener("tripspend:language", removeDuplicate);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once:true });
  } else {
    start();
  }
})();
