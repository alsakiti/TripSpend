(() => {
  "use strict";

  const RELEASE = "7.0.4";
  const $ = id => document.getElementById(id);
  let built = false;
  let currentStep = 1;
  let pendingDefaultPayment = "Credit Card";
  let analyticsInsightsOpen = true;

  const lang = () => window.TripSpendLocale?.language?.() === "ar" ? "ar" : "en";
  const tr = (en, ar) => lang() === "ar" ? ar : en;
  const core = () => window.TripSpendCore;

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, ch => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    }[ch]));
  }

  function setupIsVisible() {
    const setup = $("setupView");
    const main = $("mainView");
    return !!setup && !setup.classList.contains("hidden") && (!main || main.classList.contains("hidden"));
  }

  function syncSetupVisibility() {
    document.body.classList.toggle("ts-setup-onboarding-active", setupIsVisible() && built);
  }

  function injectStyles() {
    if ($("tripSpendSetupOnboardingV704Styles")) return;
    const style = document.createElement("style");
    style.id = "tripSpendSetupOnboardingV704Styles";
    style.textContent = `
      /* The onboarding skin only activates while the new-trip view is actually open. */
      body.ts-setup-onboarding-active .topbar{display:none!important}
      body.ts-setup-onboarding-active main{padding-top:max(8px,env(safe-area-inset-top))!important}
      body.ts-setup-onboarding-active .app{max-width:none!important}

      #setupView.ts-setup-onboarding{width:min(100%,640px);margin:0 auto;padding:0 12px calc(30px + env(safe-area-inset-bottom))}
      #setupView.ts-setup-onboarding>.hero.card{position:relative!important;display:flex!important;align-items:center!important;min-height:56px!important;margin:0 0 8px!important;padding:10px 2px!important;border:0!important;background:transparent!important;box-shadow:none!important}
      #setupView.ts-setup-onboarding>.hero.card::before{content:"TripSpend";color:var(--text);font-size:15px;font-weight:850;letter-spacing:-.03em}
      #setupView.ts-setup-onboarding>.hero.card>.hero-logo,#setupView.ts-setup-onboarding>.hero.card>.setup-brand,#setupView.ts-setup-onboarding>.hero.card>.eyebrow,#setupView.ts-setup-onboarding>.hero.card>h2,#setupView.ts-setup-onboarding>.hero.card>p{display:none!important}
      #setupView.ts-setup-onboarding #setupLanguageToggleV7{top:7px!important;right:0!important;width:46px!important;height:40px!important;border-radius:14px!important}
      html[dir="rtl"] #setupView.ts-setup-onboarding #setupLanguageToggleV7{right:auto!important;left:0!important}
      #setupView.ts-setup-onboarding .setup-history-section{margin:0 0 12px!important;padding:13px!important;border:1px solid var(--line);border-radius:18px;background:var(--surface)}

      #setupForm.ts-setup-onboarding-form{margin:0!important;padding:0!important;gap:0!important;border:0!important;background:transparent!important;box-shadow:none!important}
      .ts-setup-stage{overflow:hidden;border:1px solid color-mix(in srgb,var(--brand) 15%,var(--line));border-radius:26px;background:radial-gradient(circle at 50% -12%,color-mix(in srgb,var(--brand) 14%,transparent),transparent 38%),linear-gradient(160deg,color-mix(in srgb,var(--surface) 98%,#071426),color-mix(in srgb,var(--surface2) 94%,#07111e));box-shadow:0 22px 58px rgba(0,23,60,.13)}

      .ts-setup-progress{display:flex;align-items:center;justify-content:center;padding:21px 24px 5px;direction:ltr!important}
      .ts-setup-progress-step{display:flex;align-items:center;flex:1 1 0;max-width:92px}
      .ts-setup-progress-step:last-child{flex:0 0 auto}
      .ts-setup-progress-dot{display:grid;place-items:center;flex:0 0 27px;width:27px;height:27px;border:1px solid color-mix(in srgb,var(--muted) 44%,transparent);border-radius:50%;background:color-mix(in srgb,var(--surface2) 88%,transparent);color:var(--muted);font-size:11px;font-weight:850;transition:.2s ease}
      .ts-setup-progress-line{height:1.5px;flex:1;margin:0 7px;background:color-mix(in srgb,var(--muted) 25%,transparent)}
      .ts-setup-progress-step.active .ts-setup-progress-dot,.ts-setup-progress-step.done .ts-setup-progress-dot{border-color:#2d85ff;background:#237dff;color:#fff;box-shadow:0 0 0 4px rgba(35,125,255,.1),0 8px 20px rgba(35,125,255,.24)}
      .ts-setup-progress-step.done .ts-setup-progress-line{background:#237dff}

      .ts-setup-panel{display:none;padding:17px 18px 8px}
      .ts-setup-panel.active{display:block;animation:tsSetupIn .2s cubic-bezier(.2,.8,.2,1)}
      @keyframes tsSetupIn{from{opacity:0;transform:translateX(9px)}to{opacity:1;transform:none}}
      html[dir="rtl"] .ts-setup-panel.active{animation-name:tsSetupInRtl}
      @keyframes tsSetupInRtl{from{opacity:0;transform:translateX(-9px)}to{opacity:1;transform:none}}
      .ts-setup-panel-head{max-width:430px;margin:2px auto 21px;text-align:center}
      .ts-setup-kicker{display:block;margin-bottom:7px;color:#438fff;font-size:10px;font-weight:850;letter-spacing:.15em}
      .ts-setup-panel-head h2{margin:0!important;color:var(--text);font-size:28px!important;line-height:1.08;letter-spacing:-.045em}
      .ts-setup-panel-head p{margin:8px 0 0!important;color:var(--muted);font-size:13px!important;line-height:1.45}

      #setupForm.ts-setup-onboarding-form label{gap:7px!important;color:var(--muted)!important;font-size:11.5px!important;font-weight:720!important}
      #setupForm.ts-setup-onboarding-form input,#setupForm.ts-setup-onboarding-form select{min-height:52px!important;border:1px solid color-mix(in srgb,var(--brand) 12%,var(--line))!important;border-radius:15px!important;background:color-mix(in srgb,var(--surface2) 93%,#071525)!important;color:var(--text)!important;font-size:15px!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.025)!important}
      #setupForm.ts-setup-onboarding-form input:focus,#setupForm.ts-setup-onboarding-form select:focus{border-color:color-mix(in srgb,var(--brand) 68%,#fff)!important;box-shadow:0 0 0 3px color-mix(in srgb,var(--brand) 13%,transparent)!important}
      .ts-setup-panel .setup-primary-country{margin:13px 0 0!important;padding:0!important;border:0!important;background:transparent!important;box-shadow:none!important}
      .ts-setup-panel .setup-primary-country>.setup-country-number{display:none!important}
      .ts-setup-panel .setup-country-content{display:grid!important;gap:13px!important}
      .ts-setup-panel .primary-country-dates{gap:10px!important}
      .ts-setup-panel .date-picker-card{min-height:52px!important;border-radius:15px!important;background:color-mix(in srgb,var(--surface2) 93%,#071525)!important}

      .ts-setup-route-primary,#setupRouteList .setup-route-item{display:grid!important;grid-template-columns:34px minmax(0,1fr) auto!important;align-items:center;gap:12px!important;margin:0 0 10px!important;padding:14px!important;border:1px solid color-mix(in srgb,var(--brand) 13%,var(--line))!important;border-radius:17px!important;background:color-mix(in srgb,var(--surface2) 91%,#0a1728)!important}
      .ts-route-number,#setupRouteList .setup-route-number{display:grid!important;place-items:center!important;width:30px!important;height:30px!important;border-radius:50%!important;background:rgba(34,126,255,.13)!important;color:#4294ff!important;font-size:11px!important;font-weight:850!important}
      .ts-setup-route-copy{min-width:0}
      .ts-setup-route-copy strong,#setupRouteList .setup-route-item>div>strong{display:block;color:var(--text)!important;font-size:14px!important;font-weight:820!important}
      .ts-setup-route-copy small,#setupRouteList .setup-route-item>div>small{display:block!important;margin-top:4px!important;color:var(--muted)!important;font-size:11px!important;line-height:1.35}
      #setupRouteList .setup-item-actions{display:flex!important;gap:5px!important}
      #setupRouteList .mini-btn{min-height:32px!important;padding:0 9px!important;border-radius:10px!important;font-size:10px!important}
      #setupToggleCountries,#setupToggleTravelers{width:100%!important;min-height:48px!important;margin-top:7px!important;border:1px dashed color-mix(in srgb,var(--brand) 42%,var(--line))!important;border-radius:15px!important;background:rgba(34,126,255,.055)!important;color:#4998ff!important;font-size:13px!important;font-weight:820!important}
      .ts-setup-panel .setup-add-panel{margin-top:11px!important;padding:14px!important;border:1px solid color-mix(in srgb,var(--brand) 16%,var(--line))!important;border-radius:17px!important;background:color-mix(in srgb,var(--surface2) 88%,#081525)!important}
      .ts-setup-panel .setup-panel-actions button{min-height:48px!important}
      .ts-setup-panel .setup-summary-hint{margin:11px 2px 0!important;color:var(--muted)!important;font-size:10.5px!important;text-align:center}

      .ts-setup-settings-grid{display:grid;gap:13px}
      .ts-setup-panel .country-money-grid{display:grid!important;grid-template-columns:1fr 1fr!important;gap:10px!important;margin:0!important}
      .ts-setup-panel .setup-simple-section{margin:1px 0 0!important;padding:15px!important;border:1px solid color-mix(in srgb,var(--brand) 13%,var(--line))!important;border-radius:18px!important;background:color-mix(in srgb,var(--surface2) 82%,transparent)!important}
      .ts-setup-panel .setup-simple-heading strong{color:var(--text)!important;font-size:14px!important}
      .ts-setup-panel .setup-simple-heading span{color:var(--muted)!important;font-size:10.5px!important}
      #setupTravelerList .setup-traveler-item{padding:10px 0!important;border-bottom:1px solid color-mix(in srgb,var(--line) 70%,transparent)!important}

      .ts-setup-dock{display:flex;gap:10px;padding:15px 18px calc(18px + env(safe-area-inset-bottom))}
      .ts-setup-back,.ts-setup-next,.ts-setup-create{min-height:52px!important;border-radius:15px!important;font-size:14px!important;font-weight:850!important}
      .ts-setup-back{flex:0 0 92px;border:1px solid var(--line)!important;background:color-mix(in srgb,var(--surface2) 90%,transparent)!important;color:var(--text)!important}
      .ts-setup-next,.ts-setup-create{flex:1;border:0!important;color:#fff!important;background:linear-gradient(100deg,#1767f3,#2388ff 62%,#2dc5d4)!important;box-shadow:0 12px 28px rgba(24,116,255,.24)!important}

      .ts-setup-preview-hero{display:grid;place-items:center;width:82px;height:82px;margin:2px auto 14px;border-radius:24px;background:radial-gradient(circle at 70% 22%,rgba(75,219,227,.32),transparent 25%),linear-gradient(145deg,rgba(28,104,255,.22),rgba(32,201,195,.08));color:#5fa4ff}
      .ts-setup-preview-hero svg{width:47px;height:47px;fill:none;stroke:currentColor;stroke-width:1.5}
      .ts-setup-preview-card{padding:16px;border:1px solid color-mix(in srgb,var(--brand) 17%,var(--line));border-radius:19px;background:color-mix(in srgb,var(--surface2) 91%,#081525)}
      .ts-setup-preview-title{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:15px}
      .ts-setup-preview-title strong{color:var(--text);font-size:17px;font-weight:850}
      .ts-setup-edit{border:0!important;background:transparent!important;color:#4598ff!important;font-size:11px!important;font-weight:800!important;padding:4px!important}
      .ts-setup-preview-route{display:flex;align-items:center;gap:7px;overflow-x:auto;padding:1px 0 14px;scrollbar-width:none;direction:ltr!important}
      .ts-setup-preview-route::-webkit-scrollbar{display:none}
      .ts-preview-stop{display:grid;gap:4px;min-width:max-content;text-align:center}
      .ts-preview-stop span{font-size:21px;line-height:1}.ts-preview-stop small{color:var(--text);font-size:10px;font-weight:720}.ts-preview-arrow{color:var(--muted);font-size:12px}
      .ts-setup-preview-meta{display:grid;border-top:1px solid var(--line)}
      .ts-preview-meta-row{display:grid;grid-template-columns:24px minmax(0,1fr) auto;align-items:center;gap:9px;min-height:46px;border-bottom:1px solid color-mix(in srgb,var(--line) 72%,transparent);color:var(--text);font-size:12px}
      .ts-preview-meta-row:last-child{border-bottom:0}.ts-preview-meta-row svg{width:17px;height:17px;fill:none;stroke:var(--muted);stroke-width:1.7}.ts-preview-meta-row small{color:var(--muted);font-size:10px}
      .ts-setup-final-actions{display:flex;gap:10px;margin-top:15px}.ts-setup-final-actions .ts-setup-create{width:100%!important}

      /* The broken More Insights button was caused by an !important grid rule. Hidden now wins. */
      #analytics #analyticsMoreDetails.hidden{display:none!important}
      #analytics #analyticsMoreArrow{transform:none!important}

      @media(max-width:480px){#setupView.ts-setup-onboarding{padding-left:9px;padding-right:9px}.ts-setup-stage{border-radius:22px}.ts-setup-panel{padding:15px 14px 7px}.ts-setup-progress{padding:18px 18px 5px}.ts-setup-panel-head h2{font-size:25px!important}.ts-setup-dock{padding:13px 14px calc(15px + env(safe-area-inset-bottom))}.ts-setup-back{flex-basis:82px}.ts-setup-panel .country-money-grid{grid-template-columns:1fr!important}}
      @media(max-width:360px){.ts-setup-panel{padding-left:11px;padding-right:11px}.ts-setup-dock{padding-left:11px;padding-right:11px}.ts-setup-route-primary,#setupRouteList .setup-route-item{grid-template-columns:31px minmax(0,1fr)!important;gap:9px!important}#setupRouteList .setup-item-actions{grid-column:2;justify-content:flex-start}}
    `;
    document.head.append(style);
  }

  function makeHead(kickerEn, kickerAr, titleEn, titleAr, subEn, subAr) {
    const head = document.createElement("div");
    head.className = "ts-setup-panel-head";
    head.dataset.kickerEn = kickerEn;
    head.dataset.kickerAr = kickerAr;
    head.dataset.titleEn = titleEn;
    head.dataset.titleAr = titleAr;
    head.dataset.subEn = subEn;
    head.dataset.subAr = subAr;
    head.innerHTML = '<span class="ts-setup-kicker"></span><h2></h2><p></p>';
    return head;
  }

  function createProgress() {
    const progress = document.createElement("div");
    progress.className = "ts-setup-progress";
    progress.setAttribute("aria-label", "Trip setup progress");
    for (let n = 1; n <= 3; n++) {
      const item = document.createElement("div");
      item.className = "ts-setup-progress-step";
      item.dataset.step = String(n);
      item.innerHTML = `<span class="ts-setup-progress-dot">${n}</span>${n < 3 ? '<span class="ts-setup-progress-line"></span>' : ''}`;
      progress.append(item);
    }
    return progress;
  }

  function panel(step, head) {
    const section = document.createElement("section");
    section.className = "ts-setup-panel";
    section.dataset.setupStep = String(step);
    section.setAttribute("aria-hidden", "true");
    if (head) section.append(head);
    return section;
  }

  function directLabel(id) {
    return $(id)?.closest("label") || null;
  }

  function primarySection() {
    return $("destination")?.closest(".setup-primary-country") || null;
  }

  function travelerSection() {
    return $("setupTravelerList")?.closest(".setup-simple-section") || null;
  }

  function paymentField() {
    const label = document.createElement("label");
    label.id = "setupDefaultPaymentLabel";
    const caption = document.createElement("span");
    caption.className = "ts-default-payment-caption";
    const select = document.createElement("select");
    select.id = "setupDefaultPayment";
    (core()?.PAYS || ["Cash","Credit Card","Debit Card","Apple Pay","Other"]).forEach(value => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      select.append(option);
    });
    select.value = "Credit Card";
    label.append(caption, select);
    return label;
  }

  function primaryRouteCard() {
    const card = document.createElement("div");
    card.id = "tsSetupPrimaryRoute";
    card.className = "ts-setup-route-primary";
    card.innerHTML = '<span class="ts-route-number">1</span><div class="ts-setup-route-copy"><strong>—</strong><small>—</small></div><button type="button" class="ts-setup-edit" data-edit-step="1">Edit</button>';
    return card;
  }

  function build() {
    if (built || !setupIsVisible()) return;
    const form = $("setupForm");
    const setup = $("setupView");
    if (!form || !setup) return;

    const tripName = directLabel("tripName");
    const primary = primarySection();
    const countrySource = primary?.closest(".setup-simple-section");
    const moneyGrid = $("primaryCountryBudget")?.closest(".country-money-grid") || null;
    const routeList = $("setupRouteList");
    const routeToggle = $("setupToggleCountries");
    const countryPanel = $("setupMultiCountryPanel");
    const routeHint = $("setupTripDatesHint");
    const budget = directLabel("budget");
    const travelers = travelerSection();
    const homeCurrency = directLabel("homeCurrency");
    const submit = form.querySelector(':scope > button[type="submit"]');

    if (!tripName || !primary || !countrySource || !routeList || !routeToggle || !countryPanel || !budget || !travelers || !homeCurrency || !submit) return;

    built = true;
    setup.classList.add("ts-setup-onboarding");
    form.classList.add("ts-setup-onboarding-form");

    if (moneyGrid) moneyGrid.remove();

    const stage = document.createElement("div");
    stage.className = "ts-setup-stage";
    const progress = createProgress();

    const p1 = panel(1, makeHead("NEW TRIP","رحلة جديدة","Where are you going?","إلى أين ستذهب؟","Let's start with the basics","لنبدأ بالأساسيات"));
    p1.append(tripName, primary);

    const p2 = panel(2, makeHead("YOUR ROUTE","مسارك","Build your route","أنشئ مسارك","Add countries in the order you'll visit","أضف الدول حسب ترتيب زيارتك"));
    p2.append(primaryRouteCard(), routeList, routeToggle, countryPanel);
    if (routeHint) p2.append(routeHint);

    const p3 = panel(3, makeHead("PREFERENCES","التفضيلات","Trip settings","إعدادات الرحلة","Set your budget and preferences","حدّد الميزانية والتفضيلات"));
    const settings = document.createElement("div");
    settings.className = "ts-setup-settings-grid";
    settings.append(budget);
    if (moneyGrid) settings.append(moneyGrid);
    settings.append(homeCurrency, paymentField(), travelers);
    p3.append(settings);

    const p4 = panel(4, null);
    const hero = document.createElement("div");
    hero.className = "ts-setup-preview-hero";
    hero.innerHTML = '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M20 20h24a6 6 0 0 1 6 6v24H14V26a6 6 0 0 1 6-6Z"/><path d="M25 20v-5a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v5M22 28v22M42 28v22M10 50h44"/></svg>';
    const previewHead = makeHead("READY","جاهز","Almost ready!","أصبحت جاهزًا تقريبًا!","Here's your trip preview","هذه معاينة رحلتك");
    const preview = document.createElement("div");
    preview.id = "tsSetupPreview";
    preview.className = "ts-setup-preview-card";
    submit.classList.add("ts-setup-create");
    const finalActions = document.createElement("div");
    finalActions.className = "ts-setup-final-actions";
    finalActions.append(submit);
    p4.append(hero, previewHead, preview, finalActions);

    const dock = document.createElement("div");
    dock.className = "ts-setup-dock";
    dock.innerHTML = '<button id="tsSetupBack" class="ts-setup-back" type="button"></button><button id="tsSetupNext" class="ts-setup-next" type="button"></button>';

    stage.append(progress, p1, p2, p3, p4, dock);
    form.append(stage);
    countrySource.remove();

    new MutationObserver(() => {
      polishRouteRows();
      refreshPrimaryRoute();
      refreshPreview();
    }).observe(routeList, { childList:true, subtree:true });
    new MutationObserver(refreshPreview).observe($("setupTravelerList"), { childList:true, subtree:true });

    form.addEventListener("input", onFormInput, true);
    form.addEventListener("change", onFormInput, true);
    form.addEventListener("submit", captureSubmit, true);
    $("tsSetupBack").addEventListener("click", () => showStep(Math.max(1, currentStep - 1)));
    $("tsSetupNext").addEventListener("click", nextStep);
    stage.addEventListener("click", event => {
      const edit = event.target.closest("[data-edit-step]");
      if (edit) showStep(Number(edit.dataset.editStep) || 1);
    });

    syncSetupVisibility();
    polishRouteRows();
    refreshPrimaryRoute();
    showStep(1, { scroll:false });
    refreshPreview();
  }

  function ensureSetupBuilt() {
    if (setupIsVisible() && !built) build();
    syncSetupVisibility();
  }

  function onFormInput(event) {
    if (event.target?.id === "setupDefaultPayment") pendingDefaultPayment = event.target.value || "Credit Card";
    refreshPrimaryRoute();
    refreshPreview();
  }

  function validateControl(control) {
    if (!control || control.checkValidity()) return true;
    control.reportValidity();
    control.focus({ preventScroll:true });
    control.scrollIntoView({ behavior:"smooth", block:"center" });
    return false;
  }

  function validateStep1() {
    for (const id of ["tripName","destination","startDate","endDate"]) if (!validateControl($(id))) return false;
    let destination = $("destination")?.value?.trim();
    try { destination = core()?.canonicalDestination?.("destination") || destination; } catch {}
    if (!destination) return false;
    if (core()?.validDates && !core().validDates($("startDate").value, $("endDate").value)) {
      core()?.toast?.(tr("The end date must be after the start date","يجب أن يكون تاريخ النهاية بعد تاريخ البداية"));
      return false;
    }
    return true;
  }

  function validateStep2() {
    const addPanel = $("setupMultiCountryPanel");
    if (addPanel && !addPanel.classList.contains("hidden")) {
      $("setupCancelCountry")?.click();
    }
    return true;
  }

  function validateStep3() {
    for (const id of ["budget","ownerName","homeCurrency","tripCurrency"]) if (!validateControl($(id))) return false;
    const travelerPanel = $("setupTravelersPanel");
    if (travelerPanel && !travelerPanel.classList.contains("hidden")) {
      core()?.toast?.(tr("Finish adding the traveler or tap Cancel","أكمل إضافة المسافر أو اضغط إلغاء"));
      travelerPanel.scrollIntoView({ behavior:"smooth", block:"center" });
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
    document.querySelectorAll(".ts-setup-panel").forEach(section => {
      const active = Number(section.dataset.setupStep) === currentStep;
      section.classList.toggle("active", active);
      section.setAttribute("aria-hidden", active ? "false" : "true");
    });
    document.querySelectorAll(".ts-setup-progress-step").forEach(item => {
      const n = Number(item.dataset.step);
      item.classList.toggle("active", currentStep <= 3 && n === currentStep);
      item.classList.toggle("done", currentStep > n);
    });
    const progress = document.querySelector(".ts-setup-progress");
    const dock = document.querySelector(".ts-setup-dock");
    if (progress) progress.style.display = currentStep === 4 ? "none" : "flex";
    if (dock) dock.style.display = currentStep === 4 ? "none" : "flex";
    const back = $("tsSetupBack");
    if (back) back.style.visibility = currentStep === 1 ? "hidden" : "visible";
    if (currentStep === 4) refreshPreview();
    localizeSetup();
    if (options.scroll !== false) $("setupForm")?.scrollIntoView({ behavior:"smooth", block:"start" });
  }

  function primaryStop() {
    return {
      country:$("destination")?.value?.trim() || "",
      startDate:$("startDate")?.value || "",
      endDate:$("endDate")?.value || "",
      currency:$("tripCurrency")?.value || ""
    };
  }

  const extraStops = () => window.TripSpendV5?.setupStops?.() || [];
  const extraPeople = () => window.TripSpendV5?.setupPeople?.() || [];
  const countryName = country => window.TripSpendLocale?.country?.(country) || country || "";

  function dateLabel(start, end) {
    if (!start || !end) return tr("Choose dates","اختر التواريخ");
    const fmt = core()?.fmtDateWithYear;
    return `${fmt ? fmt(start) : start} – ${fmt ? fmt(end) : end}`;
  }

  function refreshPrimaryRoute() {
    const card = $("tsSetupPrimaryRoute");
    if (!card) return;
    const stop = primaryStop();
    const name = stop.country ? countryName(stop.country) : tr("First destination","الوجهة الأولى");
    const flag = stop.country ? core()?.countryFlag?.(stop.country) || "🌍" : "🌍";
    card.querySelector("strong").textContent = `${flag} ${name}`;
    card.querySelector("small").textContent = `${dateLabel(stop.startDate, stop.endDate)}${stop.currency ? ` • ${stop.currency}` : ""}`;
  }

  function polishRouteRows() {
    document.querySelectorAll("#setupRouteList .setup-route-item").forEach((row, index) => {
      const strong = row.querySelector(":scope > div > strong");
      const polished = (strong?.textContent || "").replace(/^Country\s+\d+\s*:\s*/i, "");
      if (strong && strong.textContent !== polished) strong.textContent = polished;
      const number = row.querySelector(".setup-route-number");
      const expectedNumber = String(index + 2);
      if (number && number.textContent !== expectedNumber) number.textContent = expectedNumber;
    });
  }

  function routeHtml(stops) {
    return stops.map((stop, index) => {
      const flag = core()?.countryFlag?.(stop.country) || "🌍";
      const arrow = index < stops.length - 1 ? '<span class="ts-preview-arrow">→</span>' : "";
      return `<span class="ts-preview-stop"><span>${escapeHtml(flag)}</span><small>${escapeHtml(countryName(stop.country))}</small></span>${arrow}`;
    }).join("");
  }

  function icon(kind) {
    const map = {
      date:'<svg viewBox="0 0 24 24"><rect x="4" y="5.5" width="16" height="14" rx="2"/><path d="M8 3.5v4M16 3.5v4M4 10h16"/></svg>',
      budget:'<svg viewBox="0 0 24 24"><rect x="3.5" y="6" width="17" height="12" rx="2.4"/><path d="M3.8 10h16.4M7 14.5h4.8"/></svg>',
      people:'<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><path d="M3.8 19c.6-3.5 2.3-5.2 5.2-5.2s4.6 1.7 5.2 5.2M16 6.5a2.5 2.5 0 0 1 0 5M16.5 14c2.1.5 3.3 2.1 3.7 5"/></svg>',
      currency:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M14.8 8.6c-.7-.6-1.6-.9-2.8-.9-1.7 0-2.8.8-2.8 2 0 3.2 6.2 1.4 6.2 4.7 0 1.2-1.1 2.1-3 2.1-1.3 0-2.5-.4-3.3-1.1M12 5.8v12.4"/></svg>'
    };
    return map[kind] || "";
  }

  function refreshPreview() {
    const preview = $("tsSetupPreview");
    if (!preview) return;
    const first = primaryStop();
    const stops = [...(first.country ? [first] : []), ...extraStops()];
    const dates = stops.filter(stop => stop.startDate && stop.endDate);
    const starts = dates.map(stop => stop.startDate).sort();
    const ends = dates.map(stop => stop.endDate).sort();
    const start = starts[0] || $("startDate")?.value || "";
    const end = ends.at(-1) || $("endDate")?.value || "";
    const budget = Number($("budget")?.value || 0);
    const home = $("homeCurrency")?.value || "OMR";
    const tripCurrency = $("tripCurrency")?.value || "—";
    const travelers = ($("ownerName")?.value?.trim() ? 1 : 0) + extraPeople().length;
    const name = $("tripName")?.value?.trim() || tr("Your trip","رحلتك");
    preview.innerHTML = `
      <div class="ts-setup-preview-title"><strong dir="auto">${escapeHtml(name)}</strong><button type="button" class="ts-setup-edit" data-edit-step="1">${escapeHtml(tr("Edit","تعديل"))}</button></div>
      <div class="ts-setup-preview-route">${routeHtml(stops)}</div>
      <div class="ts-setup-preview-meta">
        <div class="ts-preview-meta-row">${icon("date")}<span>${escapeHtml(dateLabel(start,end))}</span><button type="button" class="ts-setup-edit" data-edit-step="2">${escapeHtml(tr("Edit","تعديل"))}</button></div>
        <div class="ts-preview-meta-row">${icon("budget")}<span dir="ltr">${escapeHtml(`${budget.toLocaleString("en-US",{maximumFractionDigits:3})} ${home}`)}</span><button type="button" class="ts-setup-edit" data-edit-step="3" aria-label="${escapeHtml(tr("Edit budget","تعديل الميزانية"))}">${escapeHtml(tr("Edit","تعديل"))}</button></div>
        <div class="ts-preview-meta-row">${icon("people")}<span>${escapeHtml(`${travelers} ${tr(travelers === 1 ? "traveler" : "travelers", travelers === 1 ? "مسافر" : "مسافرين")}`)}</span><button type="button" class="ts-setup-edit" data-edit-step="3">${escapeHtml(tr("Edit","تعديل"))}</button></div>
        <div class="ts-preview-meta-row">${icon("currency")}<span dir="ltr">${escapeHtml(tripCurrency)}</span><button type="button" class="ts-setup-edit" data-edit-step="3" aria-label="${escapeHtml(tr("Edit trip currency","تعديل عملة الرحلة"))}">${escapeHtml(tr("Edit","تعديل"))}</button></div>
      </div>`;
  }

  function localizeSetup() {
    if (!built) return;
    const arabic = lang() === "ar";
    document.querySelectorAll(".ts-setup-panel-head").forEach(head => {
      head.querySelector(".ts-setup-kicker").textContent = arabic ? head.dataset.kickerAr : head.dataset.kickerEn;
      head.querySelector("h2").textContent = arabic ? head.dataset.titleAr : head.dataset.titleEn;
      head.querySelector("p").textContent = arabic ? head.dataset.subAr : head.dataset.subEn;
    });
    const caption = document.querySelector(".ts-default-payment-caption");
    if (caption) caption.textContent = tr("Default payment method","طريقة الدفع الافتراضية");
    const payment = $("setupDefaultPayment");
    if (payment) [...payment.options].forEach(option => option.textContent = window.TripSpendLocale?.payment?.(option.value) || option.value);
    const submit = $("setupForm")?.querySelector('button[type="submit"]');
    if (submit) submit.textContent = tr("✓ Create Trip","✓ إنشاء الرحلة");
    const back = $("tsSetupBack");
    if (back) back.textContent = tr("Back","رجوع");
    const next = $("tsSetupNext");
    if (next) next.textContent = currentStep === 3 ? tr("Preview trip →","معاينة الرحلة ←") : tr("Continue →","متابعة ←");
    document.querySelector(".ts-setup-progress")?.setAttribute("aria-label", tr("Trip setup progress","تقدم إعداد الرحلة"));
    refreshPrimaryRoute();
    refreshPreview();
  }

  function captureSubmit() {
    pendingDefaultPayment = $("setupDefaultPayment")?.value || "Credit Card";
    window.setTimeout(() => {
      const state = core()?.getState?.();
      if (!state?.trip || !pendingDefaultPayment) return;
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

  function afterAppChange() {
    window.setTimeout(() => {
      ensureSetupBuilt();
      repairAnalyticsToggle();
      applyAnalyticsToggleState();
    }, 90);
  }

  function start() {
    injectStyles();
    ensureSetupBuilt();
    repairAnalyticsToggle();
    window.addEventListener("tripspend:render", afterAppChange);
    window.addEventListener("tripspend:page", afterAppChange);
    window.addEventListener("tripspend:language", () => {
      localizeSetup();
      afterAppChange();
    });
    window.setTimeout(() => {
      ensureSetupBuilt();
      repairAnalyticsToggle();
    }, 350);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once:true });
  else start();

  window.TripSpendSetupOnboarding = {
    version:RELEASE,
    step:() => currentStep,
    showStep,
    refresh:() => { ensureSetupBuilt(); localizeSetup(); refreshPreview(); }
  };
})();
