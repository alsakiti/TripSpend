(() => {
  "use strict";

  const RELEASE = "7.0.5";
  const $ = id => document.getElementById(id);
  let scheduled = false;

  function setupVisible() {
    const setup = $("setupView");
    if (!setup || setup.classList.contains("hidden")) return false;
    const style = getComputedStyle(setup);
    return style.display !== "none" && style.visibility !== "hidden";
  }

  function forcePremiumSetup() {
    if (!setupVisible()) return;
    const form = $("setupForm");
    if (!form || form.classList.contains("ts-setup-onboarding-form")) return;

    // Starting a new trip from Trips/Switch Trip can leave mainView visible for
    // one render. The onboarding runtime intentionally refused to build in that
    // state. Hide the inactive app shell first, then ask the existing premium
    // onboarding runtime to build the same flow used on a fresh install.
    const main = $("mainView");
    if (main && !main.classList.contains("hidden")) main.classList.add("hidden");

    const refresh = () => window.TripSpendSetupOnboarding?.refresh?.();
    refresh();
    requestAnimationFrame(refresh);
    window.setTimeout(refresh, 80);
  }

  function enhanceSwipeFlags(root = document) {
    const selectors = [
      "#tripSwitcherModal .trip-switcher-flags",
      "#tripSwitcherSheet .trip-switcher-flags",
      ".trip-switcher-modal .trip-switcher-flags",
      ".trip-switcher-sheet .trip-switcher-flags"
    ];

    root.querySelectorAll?.(selectors.join(",")).forEach(strip => {
      strip.classList.add("ts-swipe-flags-v705");
      strip.setAttribute("role", "list");
      strip.setAttribute("aria-label", "Trip countries");
      strip.querySelectorAll(".ts-country-flag-v705").forEach(flag => {
        flag.setAttribute("role", "listitem");
      });
    });
  }

  function injectStyles() {
    if ($("tripSpendUiFixesV705Styles")) return;
    const style = document.createElement("style");
    style.id = "tripSpendUiFixesV705Styles";
    style.textContent = `
      /* Keep long Switch Trip routes usable instead of squeezing/cropping flags. */
      #tripSwitcherModal .trip-switcher-current-identity,
      #tripSwitcherSheet .trip-switcher-current-identity,
      .trip-switcher-modal .trip-switcher-current-identity,
      .trip-switcher-sheet .trip-switcher-current-identity{
        min-width:0!important;
      }

      .ts-swipe-flags-v705{
        display:flex!important;
        align-items:center!important;
        gap:8px!important;
        min-width:0!important;
        max-width:clamp(92px,38vw,210px)!important;
        overflow-x:auto!important;
        overflow-y:visible!important;
        flex:0 1 auto!important;
        padding:4px 6px 7px 1px!important;
        margin:-4px 0 -7px!important;
        -webkit-overflow-scrolling:touch;
        overscroll-behavior-inline:contain;
        touch-action:pan-x;
        scrollbar-width:none;
        scroll-snap-type:x proximity;
        scroll-padding-inline:2px;
        direction:ltr!important;
      }
      .ts-swipe-flags-v705::-webkit-scrollbar{display:none!important}
      .ts-swipe-flags-v705 .ts-country-flag-v705{
        flex:0 0 auto!important;
        scroll-snap-align:start;
      }

      /* Premium setup Step 1: hiding the legacy country number must also remove
         its grid column. Otherwise iPhone auto-places the real form into the
         old 27px column and collapses Country + From/To controls. */
      #setupView.ts-setup-onboarding .ts-setup-panel[data-setup-step="1"] .setup-primary-country{
        display:block!important;
        grid-template-columns:1fr!important;
        width:100%!important;
        min-width:0!important;
      }
      #setupView.ts-setup-onboarding .ts-setup-panel[data-setup-step="1"] .setup-country-content{
        display:grid!important;
        grid-template-columns:minmax(0,1fr)!important;
        width:100%!important;
        min-width:0!important;
      }
      #setupView.ts-setup-onboarding .ts-setup-panel[data-setup-step="1"] .country-combobox,
      #setupView.ts-setup-onboarding .ts-setup-panel[data-setup-step="1"] .country-combobox input,
      #setupView.ts-setup-onboarding .ts-setup-panel[data-setup-step="1"] .primary-country-dates{
        width:100%!important;
        min-width:0!important;
      }
      #setupView.ts-setup-onboarding .ts-setup-panel[data-setup-step="1"] .primary-country-dates{
        display:grid!important;
        grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;
        gap:12px!important;
      }
      #setupView.ts-setup-onboarding .ts-setup-panel[data-setup-step="1"] .date-field-label,
      #setupView.ts-setup-onboarding .ts-setup-panel[data-setup-step="1"] .date-picker-card{
        width:100%!important;
        min-width:0!important;
      }

      @media(max-width:420px){
        .ts-swipe-flags-v705{max-width:128px!important;gap:7px!important}
        #setupView.ts-setup-onboarding .ts-setup-panel[data-setup-step="1"] .primary-country-dates{
          gap:10px!important;
        }
      }
      @media(max-width:350px){
        .ts-swipe-flags-v705{max-width:105px!important}
        #setupView.ts-setup-onboarding .ts-setup-panel[data-setup-step="1"] .primary-country-dates{
          grid-template-columns:1fr!important;
        }
      }
    `;
    document.head.append(style);
  }

  function apply() {
    scheduled = false;
    forcePremiumSetup();
    enhanceSwipeFlags(document);
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(apply);
  }

  function start() {
    injectStyles();
    apply();

    const observer = new MutationObserver(records => {
      let relevant = false;
      for (const record of records) {
        if (record.type === "attributes") {
          const target = record.target;
          if (target?.id === "setupView" || target?.id === "mainView" || target?.id === "tripSwitcherModal" || target?.id === "tripSwitcherSheet") {
            relevant = true;
            break;
          }
        }
        if (record.addedNodes?.length) {
          relevant = true;
          break;
        }
      }
      if (relevant) schedule();
    });
    observer.observe(document.body, {childList:true, subtree:true, attributes:true, attributeFilter:["class"]});

    window.addEventListener("tripspend:render", schedule);
    window.addEventListener("tripspend:page", schedule);
    window.addEventListener("tripspend:language", schedule);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, {once:true});
  else start();

  window.TripSpendUiFixes = {
    version:RELEASE,
    apply,
    forcePremiumSetup,
    enhanceSwipeFlags
  };
})();
