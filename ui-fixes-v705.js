(() => {
  "use strict";

  const RELEASE = "7.0.6";
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
    // one render. Hide the inactive app shell first, then let the premium setup
    // runtime build the same flow used on a fresh install.
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
      strip.setAttribute("role", "img");
      strip.tabIndex = 0;
      const codes = [...strip.querySelectorAll(".ts-country-flag-v705")]
        .map(flag => flag.dataset.countryCode)
        .filter(Boolean)
        .join(", ");
      const isArabic = (document.documentElement.lang || "").toLowerCase().startsWith("ar");
      strip.setAttribute("aria-label", `${isArabic ? "دول الرحلة" : "Trip countries"}${codes ? `: ${codes}` : ""}`);
      strip.querySelectorAll(".ts-country-flag-v705").forEach(flag => flag.removeAttribute("role"));
    });
  }

  function injectStyles() {
    if ($("tripSpendUiFixesV705Styles")) return;
    const style = document.createElement("style");
    style.id = "tripSpendUiFixesV705Styles";
    style.textContent = `
      /* Repair legacy FX variables that no longer exist in the active theme. */
      .fx-result>div{background:var(--surface2)!important}
      .fx-status.good{color:var(--ok)!important}
      .fx-status.bad{color:var(--bad)!important}

      /* Keep the dashboard Next Up card compact and vertically balanced.
         Legacy style.css contains several v6 overrides, including a later 72px
         minimum height. This v7 layer is the single final source of truth. */
      .dashboard-refresh #v6PlanRow.v6-plan-row{
        display:grid!important;
        grid-template-columns:32px minmax(0,1fr) 18px!important;
        align-items:center!important;
        gap:10px!important;
        min-height:60px!important;
        margin-top:8px!important;
        margin-bottom:0!important;
        padding:9px 11px!important;
        border-radius:15px!important;
      }
      .dashboard-refresh #v6PlanRow .v6-plan-icon{
        display:grid!important;
        place-items:center!important;
        width:32px!important;
        height:32px!important;
        border-radius:10px!important;
        font-size:16px!important;
        line-height:1!important;
      }
      .dashboard-refresh #v6PlanRow .v6-plan-copy{
        display:grid!important;
        align-content:center!important;
        gap:1px!important;
        min-width:0!important;
        text-align:start!important;
      }
      .dashboard-refresh #v6PlanRow .v6-plan-copy small{
        margin:0!important;
        color:var(--brand)!important;
        font-size:8.5px!important;
        font-weight:900!important;
        line-height:1.15!important;
        letter-spacing:.12em!important;
      }
      .dashboard-refresh #v6PlanRow .v6-plan-copy strong{
        margin:1px 0 0!important;
        overflow:hidden!important;
        font-size:13.5px!important;
        line-height:1.2!important;
        text-overflow:ellipsis!important;
        white-space:nowrap!important;
      }
      .dashboard-refresh #v6PlanRow .v6-plan-copy>span{
        margin:2px 0 0!important;
        overflow:hidden!important;
        color:var(--muted)!important;
        font-size:11px!important;
        line-height:1.25!important;
        text-overflow:ellipsis!important;
        white-space:nowrap!important;
      }
      .dashboard-refresh #v6PlanRow .v6-plan-arrow{
        display:grid!important;
        place-items:center!important;
        width:18px!important;
        height:28px!important;
        color:var(--muted)!important;
        font-size:22px!important;
        line-height:1!important;
        transform:translateY(-1px);
      }

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
        outline:none;
      }
      .ts-swipe-flags-v705::-webkit-scrollbar{display:none!important}
      .ts-swipe-flags-v705:focus-visible{
        border-radius:8px;
        box-shadow:0 0 0 2px color-mix(in srgb,var(--brand) 56%,transparent);
      }
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
        .dashboard-refresh #v6PlanRow.v6-plan-row{
          grid-template-columns:30px minmax(0,1fr) 16px!important;
          gap:9px!important;
          min-height:58px!important;
          padding:8px 10px!important;
        }
        .dashboard-refresh #v6PlanRow .v6-plan-icon{
          width:30px!important;
          height:30px!important;
          font-size:15px!important;
        }
      }
      @media(max-width:350px){
        .ts-swipe-flags-v705{max-width:105px!important}
        #setupView.ts-setup-onboarding .ts-setup-panel[data-setup-step="1"] .primary-country-dates{
          grid-template-columns:1fr!important;
        }
      }
    `;
    document.head.appendChild(style);
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
