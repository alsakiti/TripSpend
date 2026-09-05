(() => {
  "use strict";

  const VERSION = "7.2.1";
  const modules = [
    "app.js", "fx.js", "v5.js", "ai-v684.js", "locale-v700.js", "locale-dynamic-v700.js",
    "expense-locale-v703.js", "page-locale-v704.js", "settings-polish-v704.js",
    "visual-polish-v704.js", "setup-language-host-v700.js", "setup-onboarding-v704.js",
    "flags-v705.js", "ui-fixes-v705.js", "receipt-capability-v700.js",
    "receipt-ai-v700.js", "ui-foundation-v710.js", "ai-intelligence-v720.js"
  ];

  function loadScript(source) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `${source}?v=${VERSION}`;
      script.async = false;
      script.addEventListener("load", resolve, { once:true });
      script.addEventListener("error", () => reject(new Error(`Could not load ${source}`)), { once:true });
      document.body.append(script);
    });
  }

  async function start() {
    for (const source of modules) await loadScript(source);
    window.dispatchEvent(new CustomEvent("tripspend:enhancements-ready", { detail:{ version:VERSION } }));
  }

  let resolveReady;
  window.TripSpendEnhancementsReady = new Promise(resolve => { resolveReady = resolve; });
  const run = () => start().catch(error => console.error(error)).finally(resolveReady);
  if (document.readyState === "complete") setTimeout(run, 0);
  else window.addEventListener("load", run, { once:true });
})();
