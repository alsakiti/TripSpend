(() => {
  "use strict";

  const RELEASE = "7.0.4";
  const $ = id => document.getElementById(id);
  let currentStep = 1;
  let pendingDefaultPayment = "Credit Card";
  let built = false;
  let routeObserver = null;
  let travelerObserver = null;
  let analyticsInsightsOpen = true;

  function localeLanguage() {
    return window.TripSpendLocale?.language?.() === "ar" ? "ar" : "en";
  }

  function tr(en, ar) {
    return localeLanguage() === "ar" ? ar : en;
  }

  function core() {
    return window.TripSpendCore;
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, ch => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    }[ch]));
  }

  function localizedCountry(country) {
    return window.TripSpendLocale?.country?.(country) || country || "";
  }

  function injectStyles() {
    if ($("tripSpendSetupOnboardingV704Styles")) return;
    const style = document.createElement("style");
    style.id = "tripSpendSetupOnboardingV704Styles";
    style.textContent = `
      body.ts-setup-onboarding-active .topbar{display:none!important}
      body.ts-setup-onboarding-active main{padding-top:max(10px,env(safe-area-inset-top))!important}
      body.ts-setup-onboarding-active .app{max-width:none!important}

      #setupView.ts-setup-onboarding{
        width:min(100%,640px);
        margin:0 auto;
        padding:0 14px calc(34px + env(safe-area-inset-bottom));
      }
      #setupView.ts-setup-onboarding>.hero.card{
        position:relative!important;
        display:flex!important;
        align-items:center;
        min-height:58px!important;
        margin:0 0 8px!important;
        padding:12px 2px!important;
        border:0!important;
        background:transparent!important;
        box-shadow:none!important;
      }
      #setupView.ts-setup-onboarding>.hero.card::before{
        content:"TripSpend";
        color:var(--text);
        font-size:15px;
        font-weight:850;
        letter-spacing:-.025em;
      }
      #setupView.ts-setup-onboarding>.hero.card>.hero-logo,
      #setupView.ts-setup-onboarding>.hero.card>.setup-brand,
      #setupView.ts-setup-onboarding>.hero.card>.eyebrow,
      #setupView.ts-setup-onboarding>.hero.card>h2,
      #setupView.ts-setup-onboarding>.hero.card>p{
        display:none!important;
      }
      #setupView.ts-setup-onboarding #setupLanguageToggleV7{
        top:8px!important;
        right:0!important;
        width:46px!important;
        height:40px!important;
        border-radius:14px!important;
      }
      html[dir="rtl"] #setupView.ts-setup-onboarding #setupLanguageToggleV7{
        right:auto!important;
        left:0!important;
      }

      #setupView.ts-setup-onboarding .setup-history-section{
        margin:0 0 14px!important;
        padding:14px!important;
        border:1px solid var(--line);
        border-radius:18px;
        background:var(--surface);
      }

      #setupForm.ts-setup-onboarding-form{
        margin:0!important;
        padding:0!important;
        border:0!important;
        background:transparent!important;
        box-shadow:none!important;
        gap:0!important;
      }

      .ts-setup-stage{
        position:relative;
        overflow:hidden;
        border:1px solid color-mix(in srgb,var(--brand) 15%,var(--line));
        border-radius:26px;
        background:
          radial-gradient(circle at 50% -15%,color-mix(in srgb,var(--brand) 14%,transparent),transparent 42%),
          linear-gradient(160deg,color-mix(in srgb,var(--surface) 98%,#071426),color-mix(in srgb,var(--surface2) 94%,#07111e));
        box-shadow:0 22px 58px rgba(0,23,60,.12);
      }
      .ts-setup-stage::after{
        content:"";
        position:absolute;
        inset:0;
        pointer-events:none;
        border-radius:inherit;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.035);
      }

      .ts-setup-progress{
        display:flex;
        align-items:center;
        justify-content:center;
        gap:0;
        padding:22px 24px 8px;
        direction:ltr!important;
      }
      .ts-setup-progress-step{
        display:flex;
        align-items:center;
        flex:1 1 0;
        max-width:92px;
      }
      .ts-setup-progress-step:last-child{flex:0 0 auto}
      .ts-setup-progress-dot{
        display:grid;
        width:27px;
        height:27px;
        place-items:center;
        flex:0 0 27px;
        border:1px solid color-mix(in srgb,var(--muted) 45%,transparent);
        border-radius:50%;
        background:color-mix(in srgb,var(--surface2) 86%,transparent);
        color:var(--muted);
        font-size:11px;
        font-weight:800;
        transition:.2s ease;
      }
      .ts-setup-progress-line{
        height:1.5px;
        flex:1;
        margin:0 7px;
        background:color-mix(in srgb,var(--muted) 26%,transparent);
        transition:.2s ease;
      }
      .ts-setup-progress-step.done .ts-setup-progress-dot,
      .ts-setup-progress-step.active .ts-setup-progress-dot{
        border-color:#2b84ff;
        color:#fff;
        background:#237dff;
        box-shadow:0 0 0 4px rgba(35,125,255,.10),0 8px 20px rgba(35,125,255,.25);
      }
      .ts-setup-progress-step.done .ts-setup-progress-line{background:#237dff}

      .ts-setup-panel{
        display:none;
        padding:18px 18px 10px;
      }
      .ts-setup-panel.active{
        display:block;
        animation:tsSetupIn .22s cubic-bezier(.2,.8,.2,1);
      }
      @keyframes tsSetupIn{
        from{opacity:0;transform:translateX(10px)}
        to{opacity:1;transform:translateX(0)}
      }
      html[dir="rtl"] .ts-setup-panel.active{animation-name:tsSetupInRtl}
      @keyframes tsSetupInRtl{
        from{opacity:0;transform:translateX(-10px)}
        to{opacity:1;transform:translateX(0)}
      }

      .ts-setup-panel-head{
        text-align:center;
        margin:2px auto 22px;
        max-width:430px;
      }
      .ts-setup-panel-head .ts-setup-kicker{
        display:block;
        margin-bottom:7px;
        color:#3c8fff;
        font-size:10px;
        font-weight:850;
        letter-spacing:.15em;
      }
      .ts-setup-panel-head h2{
        margin:0!important;
        color:var(--text);
        font-size:28px!important;
        line-height:1.08;
        letter-spacing:-.045em;
      }
      .ts-setup-panel-head p{
        margin:8px 0 0!important;
        color:var(--muted);
        font-size:13px!important;
        line-height:1.45;
      }

      #setupForm.ts-setup-onboarding-form label{
        gap:7px!important;
        color:var(--muted)!important;
        font-size:11.5px!important;
        font-weight:720!important;
      }
      #setupForm.ts-setup-onboarding-form input,
      #setupForm.ts-setup-onboarding-form select{
        min-height:52px!important;
        border:1px solid color-mix(in srgb,var(--brand) 12%,var(--line))!important;
        border-radius:15px!important;
        background:color-mix(in srgb,var(--surface2) 93%,#071525)!important;
        color:var(--text)!important;
        font-size:15px!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.025)!important;
      }
      #setupForm.ts-setup-onboarding-form input:focus,
      #setupForm.ts-setup-onboarding-form select:focus{
        border-color:color-mix(in srgb,var(--brand) 68%,#fff)!important;
        box-shadow:0 0 0 3px color-mix(in srgb,var(--brand) 13%,transparent)!important;
      }

      .ts-setup-panel .setup-primary-country{
        margin:14px 0 0!important;
        padding:0!important;
        border:0!important;
        background:transparent!important;
        box-shadow:none!important;
      }
      .ts-setup-panel .setup-primary-country>.setup-country-number{display:none!important}
      .ts-setup-panel .setup-country-content{display:grid!important;gap:14px!important}
      .ts-setup-panel .primary-country-dates{gap:10px!important}
      .ts-setup-panel .date-picker-card{
        min-height:52px!important;
        border-radius:15px!important;
        background:color-mix(in srgb,var(--surface2) 93%,#071525)!important;
      }

      .ts-setup-route-primary,
      #setupRouteList .setup-route-item{
        display:grid!important;
        grid-template-columns:34px minmax(0,1fr) auto!important;
        align-items:center;
        gap:12px!important;
        margin:0 0 10px!important;
        padding:14px!important;
        border:1px solid color-mix(in srgb,var(--brand) 13%,var(--line))!important;
        border-radius:17px!important;
        background:color-mix(in srgb,var(--surface2) 91%,#0a1728)!important;
      }
      .ts-setup-route-primary .ts-route-number,
      #setupRouteList .setup-route-number{
        display:grid!important;
        width:30px!important;
        height:30px!important;
        place-items:center;
        border-radius:50%!important;
        background:rgba(34,126,255,.13)!important;
        color:#4294ff!important;
        font-size:11px!important;
        font-weight:850!important;
      }
      .ts-setup-route-copy{min-width:0}
      .ts-setup-route-copy strong,
      #setupRouteList .setup-route-item>div>strong{
        display:block;
        color:var(--text)!important;
        font-size:14px!important;
        font-weight:800!important;
      }
      .ts-setup-route-copy small,
      #setupRouteList .setup-route-item>div>small{
        display:block!important;
        margin-top:4px!important;
        color:var(--muted)!important;
        font-size:11px!important;
        line-height:1.35;
      }
      #setupRouteList .setup-item-actions{
        display:flex!important;
        gap:5px!important;
      }
      #setupRouteList .mini-btn{
        min-height:32px!important;
        padding:0 9px!important;
        border-radius:10px!important;
        font-size:10px!important;
      }
      #setupToggleCountries,
      #setupToggleTravelers{
        width:100%!important;
        min-height:48px!important;
        margin-top:8px!important;
        border:1px dashed color-mix(in srgb,var(--brand) 42%,var(--line))!important;
        border-radius:15px!important;
        background:rgba(34,126,255,.055)!important;
        color:#4998ff!important;
        font-size:13px!important;
        font-weight:800!important;
      }
      .ts-setup-panel .setup-add-panel{
        margin-top:12px!important;
        padding:14px!important;
        border:1px solid color-mix(in srgb,var(--brand) 16%,var(--line))!important;
        border-radius:17px!important;
        background:color-mix(in srgb,var(--surface2) 88%,#081525)!important;
      }
      .ts-setup-panel .setup-summary-hint{
        margin:12px 2px 0!important;
        color:var(--muted)!important;
        font-size:10.5px!important;
        text-align:center;
      }

      .ts-setup-settings-grid{
        display:grid;
        gap:14px;
      }
      .ts-setup-panel .country-money-grid{
        display:grid!important;
        grid-template-columns:1fr 1fr!important;
        gap:10px!important;
        margin:0!important;
      }
      .ts-setup-panel .setup-simple-section{
        margin:2px 0 0!important;
        padding:15px!important;
        border:1px solid color-mix(in srgb,var(--brand) 13%,var(--line))!important;
        border-radius:18px!important;
        background:color-mix(in srgb,var(--surface2) 82%,transparent)!important;
      }
      .ts-setup-panel .setup-simple-heading strong{
        color:var(--text)!important;
        font-size:14px!important;
      }
      .ts-setup-panel .setup-simple-heading span{
        color:var(--muted)!important;
        font-size:10.5px!important;
      }
      #setupTravelerList .setup-traveler-item{
        padding:10px 0!important;
        border-bottom:1px solid color-mix(in srgb,var(--line) 70%,transparent)!important;
      }

      .ts-setup-dock{
        display:flex;
        gap:10px;
        padding:15px 18px calc(18px + env(safe-area-inset-bottom));
      }
      .ts-setup-back,
      .ts-setup-next,
      .ts-setup-create{
        min-height:52px!important;
        border-radius:15px!important;
        font-size:14px!important;
        font-weight:850!important;
      }
      .ts-setup-back{
        flex:0 0 92px;
        border:1px solid var(--line)!important;
        background:color-mix(in srgb,var(--surface2) 90%,transparent)!important;
        color:var(--text)!important;
      }
      .ts-setup-next,
      .ts-setup-create{
        flex:1;
        border:0!important;
        color:#fff!important;
        background:linear-gradient(100deg,#1767f3,#2388ff 62%,#2dc5d4)!important;
        box-shadow:0 12px 28px rgba(24,116,255,.24)!important;
      }

      .ts-setup-preview-hero{
        display:grid;
        place-items:center;
        width:82px;
        height:82px;
        margin:2px auto 16px;
        border-radius:24px;
        background:
          radial-gradient(circle at 70% 22%,rgba(75,219,227,.32),transparent 25%),
          linear-gradient(145deg,rgba(28,104,255,.22),rgba(32,201,195,.08));
        color:#5fa4ff;
      }
      .ts-setup-preview-hero svg{width:47px;height:47px;fill:none;stroke:currentColor;stroke-width:1.5}
      .ts-setup-preview-card{
        padding:16px;
        border:1px solid color-mix(in srgb,var(--brand) 17%,var(--line));
        border-radius:19px;
        background:color-mix(in srgb,var(--surface2) 91%,#081525);
      }
      .ts-setup-preview-title{
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:10px;
        margin-bottom:15px;
      }
      .ts-setup-preview-title strong{
        color:var(--text);
        font-size:17px;
        font-weight:850;
      }
      .ts-setup-edit{
        border:0;
        background:transparent;
        color:#4598ff;
        font-size:11px;
        font-weight:800;
      }
      .ts-setup-preview-route{
        display:flex;
        align-items:center;
        gap:7px;
        overflow-x:auto;
        padding:1px 0 14px;
        scrollbar-width:none;
        direction:ltr!important;
      }
      .ts-setup-preview-route::-webkit-scrollbar{display:none}
      .ts-preview-stop{
        display:grid;
        gap:4px;
        min-width:max-content;
        text-align:center;
      }
      .ts-preview-stop span{font-size:21px;line-height:1}
      .ts-preview-stop small{color:var(--text);font-size:10px;font-weight:720}
      .ts-preview-arrow{color:var(--muted);font-size:12px}
      .ts-setup-preview-meta{
        display:grid;
        gap:0;
        border-top:1px solid var(--line);
      }
      .ts-preview-meta-row{
        display:grid;
        grid-template-columns:24px minmax(0,1fr) auto;
        align-items:center;
        gap:9px;
        min-height:46px;
        border-bottom:1px solid color-mix(in srgb,var(--line) 72%,transparent);
        color:var(--text);
        font-size:12px;
      }
      .ts-preview-meta-row:last-child{border-bottom:0}
      .ts-preview-meta-row svg{width:17px;height:17px;fill:none;stroke:var(--muted);stroke-width:1.7}
      .ts-preview-meta-row small{color:var(--muted);font-size:10px}

      .ts-setup-final-actions{
        display:flex;
        gap:10px;
        margin-top:15px;
      }
      .ts-setup-final-actions .ts-setup-create{
        width:100%!important;
      }

      #setupForm.ts-setup-onboarding-form .ts-source-heading{display:none!important}

      /* Analytics toggle repair: hidden must win over the visual-polish grid rule. */
      #analytics #analyticsMoreDetails.hidden{display:none!important}
      #analytics #analyticsMoreArrow{transform:none!important}

      @media(max-width:480px){
        #setupView.ts-setup-onboarding{padding-left:10px;padding-right:10px}
        .ts-setup-stage{border-radius:22px}
        .ts-setup-panel{padding:15px 14px 8px}
        .ts-setup-progress{padding:18px 18px 6px}
        .ts-setup-panel-head h2{font-size:25px!important}
        .ts-setup-dock{padding:13px 14px calc(15px + env(safe-area-inset-bottom))}
        .ts-setup-back{flex-basis:82px}
        .ts-setup-panel .country-money-grid{grid-template-columns:1fr!important}
      }
      @media(max-width:360px){
        .ts-setup-panel{padding-left:11px;padding-right:11px}
        .ts-setup-dock{padding-left:11px;padding-right:11px}
        .ts-setup-route-primary,
        #setupRouteList .setup-route-item{grid-template-columns:31px minmax(0,1fr)!important;gap:9px!important}
        #setupRouteList .setup-item-actions{grid-column:2;justify-content:flex-start}
      }
    `;
    document.head.append(style);
  }

  function makeHead(kickerEn, kickerAr, titleEn, titleAr, subEn, subAr) {
    const head = document.createElement("div");
    head.className = "ts-setup-panel-head";
    head.innerHTML = `
      <span class="ts-setup-kicker"></span>
      <h2></h2>
      <p></p>
    `;
    head.dataset.kickerEn = kickerEn;
    head.dataset.kickerAr = kickerAr;
    head.dataset.titleEn = titleEn;
    head.dataset.titleAr = titleAr;
    head.dataset.subEn = subEn;
    head.dataset.subAr = subAr;
    return head;
  }

  function createProgress() {
    const progress = document.createElement("div");
    progress.className = "ts-setup-progress";
    progress.setAttribute("aria-label", "Trip setup progress");
    for (let step = 1; step <= 3; step++) {
      const wrap = document.createElement("div");
      wrap.className = "ts-setup-progress-step";
      wrap.dataset.step = String(step);
      const dot = document.createElement("span");
      dot.className = "ts-setup-progress-dot";
      dot.textContent = String(step);
      wrap.append(dot);
      if (step < 3) {
        const line = document.createElement("span");
        line.className = "ts-setup-progress-line";
        wrap.append(line);
      }
      progress.append(wrap);
    }
    return progress;
  }

  function createDefaultPayment() {
    const label = document.createElement("label");
    label.id = "setupDefaultPaymentLabel";
    const caption = document.createElement("span");
    caption.className = "ts-default-payment-caption";
    const select = document.createElement("select");
    select.id = "setupDefaultPayment";
    const pays = core()?.PAYS || ["Cash","Credit Card","Debit Card","Apple Pay","Other"];
    pays.forEach(pay => {
      const option = document.createElement("option");
      option.value = pay;
      option.textContent = pay;
      select.append(option);
    });
    select.value = "Credit Card";
    label.append(caption, select);
    return label;
  }

  function takePrimaryMoneyGrid() {
    return $("primaryCountryBudget")?.closest(".country-money-grid") || null;
  }

  function primaryCountrySection() {
    return $("destination")?.closest(".setup-primary-country") || null;
  }

  function travelerSection() {
    return $("setupTravelerList")?.closest(".setup-simple-section") || null;
  }

  function directLabelFor(id) {
    return $(id)?.closest("label") || null;
  }

  function createPrimaryRouteCard() {
    const card = document.createElement("div");
    card.id = "tsSetupPrimaryRoute";
    card.className = "ts-setup-route-primary";
    card.innerHTML = `
      <span class="ts-route-number">1</span>
      <div class="ts-setup-route-copy"><strong>—</strong><small>—</small></div>
      <button type="button" class="ts-setup-edit" data-edit-step="1">Edit</button>
    `;
    return card;
  }

  function createPreview() {
    const wrap = document.createElement("div");
    wrap.className = "ts-setup-preview-card";
    wrap.id = "tsSetupPreview";
    return wrap;
  }

  function createPanel(step) {
    const panel = document.createElement("section");
    panel.className = "ts-setup-panel";
    panel.dataset.setupStep = String(step);
    panel.setAttribute("aria-hidden", "true");
    return panel;
  }

  function build() {
    if (built || !$("setupForm") || !$("setupView")) return;
    const form = $("setupForm");
    const setup = $("setupView");
    const tripName = directLabelFor("tripName");
    const primary = primaryCountrySection();
    const moneyGrid = takePrimaryMoneyGrid();
    const budget = directLabelFor("budget");
    const travelers = travelerSection();
    const homeCurrency = directLabelFor("homeCurrency");
    const routeList = $("setupRouteList");
    const routeToggle = $("setupToggleCountries");
    const countryPanel = $("setupMultiCountryPanel");
    const routeHint = $("setupTripDatesHint");
    const submit = form.querySelector(':scope > button[type="submit"]');

    if (!tripName || !primary || !budget || !travelers || !homeCurrency || !routeList || !routeToggle || !countryPanel || !submit) return;

    built = true;
    setup.classList.add("ts-setup-onboarding");
    form.classList.add("ts-setup-onboarding-form");
    document.body.classList.toggle("ts-setup-onboarding-active", !$("mainView") || $("mainView").classList.contains("hidden"));

    const countrySource = primary.closest(".setup-simple-section");
    countrySource?.querySelector(".setup-simple-heading")?.classList.add("ts-source-heading");

    if (moneyGrid) moneyGrid.remove();

    const stage = document.createElement("div");
    stage.className = "ts-setup-stage";
    const progress = createProgress();

    const panel1 = createPanel(1);
    panel1.append(
      makeHead("NEW TRIP","رحلة جديدة","Where are you going?","إلى أين ستذهب؟","Let's start with the basics","لنبدأ بالأساسيات"),
      tripName,
      primary
    );

    const panel2 = createPanel(2);
    const primaryRoute = createPrimaryRouteCard();
    panel2.append(
      makeHead("YOUR ROUTE","مسارك","Build your route","أنشئ مسارك","Add countries in the order you'll visit","أضف الدول حسب ترتيب زيارتك"),
      primaryRoute,
      routeList,
      routeToggle,
      countryPanel
    );
    if (routeHint) panel2.append(routeHint);

    const panel3 = createPanel(3);
    const settingsGrid = document.createElement("div");
    settingsGrid.className = "ts-setup-settings-grid";
    settingsGrid.append(budget);
    if (moneyGrid) settingsGrid.append(moneyGrid);
    settingsGrid.append(homeCurrency, createDefaultPayment(), travelers);
    panel3.append(
      makeHead("PREFERENCES","التفضيلات","Trip settings","إعدادات الرحلة","Set your budget and preferences","حدّد الميزانية والتفضيلات"),
      settingsGrid
    );

    const panel4 = createPanel(4);
    const hero = document.createElement("div");
    hero.className = "ts-setup-preview-hero";
    hero.innerHTML = `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M20 20h24a6 6 0 0 1 6 6v24H14V26a6 6 0 0 1 6-6Z"/><path d="M25 20v-5a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v5M22 28v22M42 28v22M10 50h44"/></svg>`;
    const preview = createPreview();
    submit.classList.add("ts-setup-create");
    const finalActions = document.createElement("div");
    finalActions.className = "ts-setup-final-actions";
    finalActions.append(submit);
    panel4.append(
      hero,
      makeHead("READY","جاهز","Almost ready!","أصبحت جاهزًا تقريبًا!","Here's your trip preview","هذه معاينة رحلتك"),
      preview,
      finalActions
    );

    const dock = document.createElement("div");
    dock.className = "ts-setup-dock";
    const back = document.createElement("button");
    back.type = "button";
    back.id = "tsSetupBack";
    back.className = "ts-setup-back";
    const next = document.createElement("button");
    next.type = "button";
    next.id = "tsSetupNext";
    next.className = "ts-setup-next";
    dock.append(back, next);

    stage.append(progress, panel1, panel2, panel3, panel4, dock);
    form.append(stage);

    countrySource?.remove();

    routeObserver = new MutationObserver(() => {
      polishRouteRows();
      refreshPrimaryRoute();
      refreshPreview();
    });
    routeObserver.observe(routeList, { childList:true, subtree:true });

    travelerObserver = new MutationObserver(refreshPreview);
    travelerObserver.observe($("setupTravelerList"), { childList:true, subtree:true });

    form.addEventListener("input", onFormInput, true);
    form.addEventListener("change", onFormInput, true);
    form.addEventListener("submit", captureSubmit, true);
    back.addEventListener("click", () => showStep(Math.max(1, currentStep - 1)));
    next.addEventListener("click", nextStep);
    stage.addEventListener("click", event => {
      const edit = event.target.closest("[data-edit-step]");
      if (edit) showStep(Number(edit.dataset.editStep) || 1);
    });

    window.addEventListener("tripspend:language", () => {
      localize();
      refreshPrimaryRoute();
      refreshPreview();
    });
    window.addEventListener("tripspend:render", syncSetupVisibility);

    repairAnalyticsToggle();
    polishRouteRows();
    refreshPrimaryRoute();
    localize();
    showStep(1, { scroll:false });
    refreshPreview();
  }

  function syncSetupVisibility() {
    const setupVisible = !$("setupView")?.classList.contains("hidden") && $("mainView")?.classList.contains("hidden");
    document.body.classList.toggle("ts-setup-onboarding-active", !!setupVisible);
  }

  function onFormInput(event) {
    if (event.target?.id === "setupDefaultPayment") {
      pendingDefaultPayment = event.target.value || "Credit Card";
    }
    refreshPrimaryRoute();
    refreshPreview();
  }

  function validateControl(control) {
    if (!control) return true;
    if (!control.checkValidity()) {
      control.reportValidity();
      control.focus({ preventScroll:true });
      control.scrollIntoView({ behavior:"smooth", block:"center" });
      return false;
    }
    return true;
  }

  function validateStep1() {
    for (const id of ["tripName","destination","startDate","endDate"]) {
      if (!validateControl($(id))) return false;
    }
    const destination = core()?.canonicalDestination?.("destination");
    if (!destination) return false;
    if (!core()?.validDates?.($("startDate").value, $("endDate").value)) {
      core()?.toast?.(tr("The end date must be after the start date","يجب أن يكون تاريخ النهاية بعد تاريخ البداية"));
      return false;
    }
    return true;
  }

  function validateStep2() {
    const panel = $("setupMultiCountryPanel");
    if (panel && !panel.classList.contains("hidden")) {
      core()?.toast?.(tr("Finish adding the country or tap Cancel","أكمل إضافة الدولة أو اضغط إلغاء"));
      panel.scrollIntoView({ behavior:"smooth", block:"center" });
      return false;
    }
    return true;
  }

  function validateStep3() {
    for (const id of ["budget","ownerName","homeCurrency","tripCurrency"]) {
      if (!validateControl($(id))) return false;
    }
    const travelersPanel = $("setupTravelersPanel");
    if (travelersPanel && !travelersPanel.classList.contains("hidden")) {
      core()?.toast?.(tr("Finish adding the traveler or tap Cancel","أكمل إضافة المسافر أو اضغط إلغاء"));
      travelersPanel.scrollIntoView({ behavior:"smooth", block:"center" });
      return false;
    }
    return true;
  }

  function nextStep() {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    if (currentStep === 3 && !validateStep3()) return;
    showStep(Math.min(4, currentStep + 1));
  }

  function showStep(step, options = {}) {
    if (!built) return;
    currentStep = Math.max(1, Math.min(4, Number(step) || 1));
    document.querySelectorAll(".ts-setup-panel").forEach(panel => {
      const active = Number(panel.dataset.setupStep) === currentStep;
      panel.classList.toggle("active", active);
      panel.setAttribute("aria-hidden", active ? "false" : "true");
    });

    document.querySelectorAll(".ts-setup-progress-step").forEach(item => {
      const n = Number(item.dataset.step);
      item.classList.toggle("active", currentStep <= 3 && n === currentStep);
      item.classList.toggle("done", currentStep > n);
    });

    const progress = document.querySelector(".ts-setup-progress");
    if (progress) progress.style.display = currentStep === 4 ? "none" : "flex";

    const dock = document.querySelector(".ts-setup-dock");
    const back = $("tsSetupBack");
    const next = $("tsSetupNext");
    if (dock) dock.style.display = currentStep === 4 ? "none" : "flex";
    if (back) {
      back.style.visibility = currentStep === 1 ? "hidden" : "visible";
      back.textContent = tr("Back","رجوع");
    }
    if (next) {
      next.textContent = currentStep === 3 ? tr("Preview trip →","معاينة الرحلة ←") : tr("Continue →","متابعة ←");
    }

    if (currentStep === 4) refreshPreview();
    if (options.scroll !== false) {
      $("setupForm")?.scrollIntoView({ behavior:"smooth", block:"start" });
    }
    localize();
  }

  function primaryStopData() {
    const destination = $("destination")?.value?.trim() || "";
    return {
      country: destination,
      startDate: $("startDate")?.value || "",
      endDate: $("endDate")?.value || "",
      currency: $("tripCurrency")?.value || "",
      budget: Number($("primaryCountryBudget")?.value || 0)
    };
  }

  function extraStops() {
    return window.TripSpendV5?.setupStops?.() || [];
  }

  function setupPeople() {
    return window.TripSpendV5?.setupPeople?.() || [];
  }

  function dateLabel(a, b) {
    const fmt = core()?.fmtDateWithYear;
    if (!a || !b) return tr("Choose dates","اختر التواريخ");
    return `${fmt ? fmt(a) : a} – ${fmt ? fmt(b) : b}`;
  }

  function refreshPrimaryRoute() {
    const card = $("tsSetupPrimaryRoute");
    if (!card) return;
    const stop = primaryStopData();
    const strong = card.querySelector("strong");
    const small = card.querySelector("small");
    const country = stop.country ? localizedCountry(stop.country) : tr("First destination","الوجهة الأولى");
    const flag = stop.country ? core()?.countryFlag?.(stop.country) || "🌍" : "🌍";
    if (strong) strong.textContent = `${flag} ${country}`;
    if (small) small.textContent = `${dateLabel(stop.startDate, stop.endDate)}${stop.currency ? ` • ${stop.currency}` : ""}`;
  }

  function polishRouteRows() {
    document.querySelectorAll("#setupRouteList .setup-route-item").forEach((row, index) => {
      const strong = row.querySelector(":scope > div > strong");
      if (strong) {
        const raw = strong.textContent || "";
        strong.textContent = raw.replace(/^Country\s+\d+\s*:\s*/i, "");
      }
      const number = row.querySelector(".setup-route-number");
      if (number) number.textContent = String(index + 2);
    });
  }

  function previewRouteHtml(stops) {
    if (!stops.length) return "";
    return stops.map((stop, index) => {
      const country = stop.country || "";
      const flag = core()?.countryFlag?.(country) || "🌍";
      const name = localizedCountry(country);
      const arrow = index < stops.length - 1 ? `<span class="ts-preview-arrow">→</span>` : "";
      return `<span class="ts-preview-stop"><span>${escapeHtml(flag)}</span><small>${escapeHtml(name)}</small></span>${arrow}`;
    }).join("");
  }

  function previewMetaIcon(kind) {
    const icons = {
      date:`<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5.5" width="16" height="14" rx="2"/><path d="M8 3.5v4M16 3.5v4M4 10h16"/></svg>`,
      budget:`<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="6" width="17" height="12" rx="2.4"/><path d="M3.8 10h16.4M7 14.5h4.8"/></svg>`,
      people:`<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3"/><path d="M3.8 19c.6-3.5 2.3-5.2 5.2-5.2s4.6 1.7 5.2 5.2M16 6.5a2.5 2.5 0 0 1 0 5M16.5 14c2.1.5 3.3 2.1 3.7 5"/></svg>`,
      currency:`<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M14.8 8.6c-.7-.6-1.6-.9-2.8-.9-1.7 0-2.8.8-2.8 2 0 3.2 6.2 1.4 6.2 4.7 0 1.2-1.1 2.1-3 2.1-1.3 0-2.5-.4-3.3-1.1M12 5.8v12.4"/></svg>`
    };
    return icons[kind] || "";
  }

  function refreshPreview() {
    const preview = $("tsSetupPreview");
    if (!preview) return;

    const primary = primaryStopData();
    const stops = [
      ...(primary.country ? [primary] : []),
      ...extraStops()
    ];
    const dates = stops.filter(s => s.startDate && s.endDate);
    const starts = dates.map(s => s.startDate).sort();
    const ends = dates.map(s => s.endDate).sort();
    const start = starts[0] || $("startDate")?.value || "";
    const end = ends.at(-1) || $("endDate")?.value || "";
    const budget = Number($("budget")?.value || 0);
    const home = $("homeCurrency")?.value || "OMR";
    const tripCurrency = $("tripCurrency")?.value || "";
    const owner = $("ownerName")?.value?.trim();
    const travelers = (owner ? 1 : 0) + setupPeople().length;
    const name = $("tripName")?.value?.trim() || tr("Your trip","رحلتك");

    preview.innerHTML = `
      <div class="ts-setup-preview-title">
        <strong dir="auto">${escapeHtml(name)}</strong>
        <button type="button" class="ts-setup-edit" data-edit-step="1">${escapeHtml(tr("Edit","تعديل"))}</button>
      </div>
      <div class="ts-setup-preview-route">${previewRouteHtml(stops)}</div>
      <div class="ts-setup-preview-meta">
        <div class="ts-preview-meta-row">${previewMetaIcon("date")}<span>${escapeHtml(dateLabel(start,end))}</span><button type="button" class="ts-setup-edit" data-edit-step="2">${escapeHtml(tr("Edit","تعديل"))}</button></div>
        <div class="ts-preview-meta-row">${previewMetaIcon("budget")}<span dir="ltr">${escapeHtml(`${budget.toLocaleString("en-US",{maximumFractionDigits:3})} ${home}`)}</span><small>${escapeHtml(tr("Budget","الميزانية"))}</small></div>
        <div class="ts-preview-meta-row">${previewMetaIcon("people")}<span>${escapeHtml(`${travelers} ${tr(travelers === 1 ? "traveler" : "travelers", travelers === 1 ? "مسافر" : "مسافرين")}`)}</span><button type="button" class="ts-setup-edit" data-edit-step="3">${escapeHtml(tr("Edit","تعديل"))}</button></div>
        <div class="ts-preview-meta-row">${previewMetaIcon("currency")}<span dir="ltr">${escapeHtml(tripCurrency || "—")}</span><small>${escapeHtml(tr("Trip currency","عملة الرحلة"))}</small></div>
      </div>
    `;
  }

  function localize() {
    document.querySelectorAll(".ts-setup-panel-head").forEach(head => {
      const arabic = localeLanguage() === "ar";
      const kicker = head.querySelector(".ts-setup-kicker");
      const title = head.querySelector("h2");
      const sub = head.querySelector("p");
      if (kicker) kicker.textContent = arabic ? head.dataset.kickerAr : head.dataset.kickerEn;
      if (title) title.textContent = arabic ? head.dataset.titleAr : head.dataset.titleEn;
      if (sub) sub.textContent = arabic ? head.dataset.subAr : head.dataset.subEn;
    });

    const caption = document.querySelector(".ts-default-payment-caption");
    if (caption) caption.textContent = tr("Default payment method","طريقة الدفع الافتراضية");

    const payment = $("setupDefaultPayment");
    if (payment) {
      [...payment.options].forEach(option => {
        option.textContent = window.TripSpendLocale?.payment?.(option.value) || option.value;
      });
    }

    const submit = $("setupForm")?.querySelector('button[type="submit"]');
    if (submit) submit.textContent = tr("✓ Create Trip","✓ إنشاء الرحلة");
    const back = $("tsSetupBack");
    const next = $("tsSetupNext");
    if (back) back.textContent = tr("Back","رجوع");
    if (next) next.textContent = currentStep === 3 ? tr("Preview trip →","معاينة الرحلة ←") : tr("Continue →","متابعة ←");

    const progress = document.querySelector(".ts-setup-progress");
    if (progress) progress.setAttribute("aria-label", tr("Trip setup progress","تقدم إعداد الرحلة"));
  }

  function captureSubmit() {
    pendingDefaultPayment = $("setupDefaultPayment")?.value || "Credit Card";
    window.setTimeout(() => {
      const state = core()?.getState?.();
      if (!state?.trip || !pendingDefaultPayment) return;
      if (state.trip.defaultPayment === pendingDefaultPayment && state.preferences?.lastPaymentMethod === pendingDefaultPayment) return;
      state.trip.defaultPayment = pendingDefaultPayment;
      state.preferences = state.preferences || {};
      state.preferences.lastPaymentMethod = pendingDefaultPayment;
      core()?.save?.();
    }, 0);
  }

  function applyAnalyticsToggleState() {
    const toggle = $("analyticsMoreToggle");
    const details = $("analyticsMoreDetails");
    if (!toggle || !details) return;
    details.classList.toggle("hidden", !analyticsInsightsOpen);
    toggle.classList.toggle("open", analyticsInsightsOpen);
    toggle.setAttribute("aria-expanded", String(analyticsInsightsOpen));
    const arrow = $("analyticsMoreArrow");
    if (arrow) arrow.textContent = analyticsInsightsOpen ? "⌃" : "⌄";
  }

  function repairAnalyticsToggle() {
    const toggle = $("analyticsMoreToggle");
    const details = $("analyticsMoreDetails");
    if (!toggle || !details) return;
    if (toggle.dataset.tsToggleFixed !== "1") {
      toggle.dataset.tsToggleFixed = "1";
      analyticsInsightsOpen = !details.classList.contains("hidden");

      toggle.addEventListener("click", event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        analyticsInsightsOpen = !analyticsInsightsOpen;
        applyAnalyticsToggleState();
      }, true);
    }
    applyAnalyticsToggleState();
  }

  function start() {
    injectStyles();
    build();
    repairAnalyticsToggle();
    const restoreAnalyticsToggle = () => window.setTimeout(applyAnalyticsToggleState, 80);
    window.addEventListener("tripspend:render", restoreAnalyticsToggle);
    window.addEventListener("tripspend:page", restoreAnalyticsToggle);
    window.addEventListener("tripspend:language", restoreAnalyticsToggle);
    window.setTimeout(() => {
      build();
      repairAnalyticsToggle();
    }, 350);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once:true });
  else start();

  window.TripSpendSetupOnboarding = {
    version:RELEASE,
    step:() => currentStep,
    showStep,
    refresh:() => {
      localize();
      refreshPrimaryRoute();
      refreshPreview();
    }
  };
})();