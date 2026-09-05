(() => {
  "use strict";

  const RELEASE = "7.2.1";
  const $ = id => document.getElementById(id);
  let scheduled = false;
  let settingsLocalizationQueued = false;
  let settingsLocalizing = false;
  const settingsOriginals = new WeakMap();

  const SETTINGS_AR = new Map(Object.entries({
    "TRIP":"الرحلة",
    "SETTINGS":"الإعدادات",
    "Settings":"الإعدادات",
    "Trip settings":"إعدادات الرحلة",
    "Manage the essentials for this trip.":"إدارة الإعدادات الأساسية لهذه الرحلة.",
    "Trip details":"تفاصيل الرحلة",
    "Name and travel dates.":"الاسم وتواريخ السفر.",
    "Trip name":"اسم الرحلة",
    "Primary destination":"الوجهة الرئيسية",
    "This is the first country in the trip. Add more countries below.":"هذه أول دولة في الرحلة. يمكنك إضافة دول أخرى أدناه.",
    "Countries in this trip":"الدول في هذه الرحلة",
    "Start date":"تاريخ البدء",
    "End date":"تاريخ الانتهاء",
    "Select date":"اختر التاريخ",
    "Total budget":"إجمالي الميزانية",
    "Home currency":"العملة الأساسية",
    "Trip currency":"عملة الرحلة",
    "Default payment method":"طريقة الدفع الافتراضية",
    "Save Changes":"حفظ التغييرات",
    "Save changes":"حفظ التغييرات",
    "Countries":"الدول",
    "Your route in travel order.":"مسار رحلتك حسب ترتيب السفر.",
    "＋ Add another country":"＋ إضافة دولة أخرى",
    "＋ Add country":"＋ إضافة دولة",
    "Budget & payment":"الميزانية والدفع",
    "Money defaults used across TripSpend.":"الإعدادات المالية الافتراضية في TripSpend.",
    "Manage trip":"إدارة الرحلة",
    "Trips & history":"الرحلات والسجل",
    "Finish this trip, start another one, or reopen a past trip.":"أنه هذه الرحلة، وابدأ رحلة أخرى، أو افتح رحلة سابقة.",
    "Manage Trips":"إدارة الرحلات",
    "Countries & trip planner":"الدول ومخطط الرحلة",
    "Manage every country, its dates, local currency, budget, and upcoming costs.":"إدارة كل دولة وتواريخها وعملتها المحلية وميزانيتها وتكاليفها القادمة.",
    "Manage Countries & Plans":"إدارة الدول والخطط",
    "Travelers":"المسافرون",
    "Add people, rename them, and review individual spending totals.":"أضف المسافرين، وغيّر أسماءهم، وراجع إجمالي إنفاق كل شخص.",
    "Manage Travelers":"إدارة المسافرين",
    "Preferences & safety":"التفضيلات والأمان",
    "Appearance":"المظهر",
    "Follow your iPhone automatically, or choose Light or Dark.":"اتبع إعداد iPhone تلقائيًا، أو اختر الوضع الفاتح أو الداكن.",
    "Auto":"تلقائي",
    "Light":"فاتح",
    "Dark":"داكن",
    "Advanced & data":"الخيارات المتقدمة والبيانات",
    "Backups, updates, diagnostics, exports and saved rates.":"النسخ الاحتياطية والتحديثات والفحوصات والتصدير وأسعار الصرف المحفوظة.",
    "Data safety":"أمان البيانات",
    "TripSpend saves your trip locally and keeps automatic restore points.":"يحفظ TripSpend رحلتك محليًا ويحتفظ بنقاط استعادة تلقائية.",
    "STARTING":"جارٍ البدء",
    "CHECKING":"جارٍ الفحص",
    "ONLINE":"متصل",
    "OFFLINE":"غير متصل",
    "Preparing secure local storage…":"جارٍ تجهيز التخزين المحلي الآمن…",
    "Checking your data…":"جارٍ فحص بياناتك…",
    "Fast local database is active.":"قاعدة البيانات المحلية السريعة مفعّلة.",
    "Waiting for first save":"انتظار أول حفظ",
    "Restore points":"نقاط الاستعادة",
    "Latest, recent days, and upgrade protection.":"أحدث نسخة، والأيام الأخيرة، وحماية قبل التحديثات.",
    "Save Snapshot":"حفظ نقطة استعادة",
    "Restore":"استعادة",
    "Before v6.4 upgrade":"قبل ترقية v6.4",
    "Restore points will appear here automatically.":"ستظهر نقاط الاستعادة هنا تلقائيًا.",
    "Local storage used":"التخزين المحلي المستخدم",
    "Receipt photos":"صور الإيصالات",
    "Clean unused receipt files":"تنظيف ملفات الإيصالات غير المستخدمة",
    "App update":"تحديث التطبيق",
    "Check the GitHub Pages version and refresh the installed app when needed.":"تحقق من إصدار GitHub Pages وحدّث التطبيق المثبت عند الحاجة.",
    "Current":"الحالي",
    "Latest":"الأحدث",
    "Checking…":"جارٍ الفحص…",
    "UP TO DATE":"محدّث",
    "Check for Update":"التحقق من وجود تحديث",
    "Refresh App":"تحديث التطبيق",
    "App health":"صحة التطبيق",
    "App status":"حالة التطبيق",
    "Quick checks for storage, database, receipts, performance and the offline app shell.":"فحوصات سريعة للتخزين وقاعدة البيانات والإيصالات والأداء وتشغيل التطبيق دون اتصال.",
    "Run checks":"تشغيل الفحوصات",
    "Storage":"التخزين",
    "Database":"قاعدة البيانات",
    "Receipts":"الإيصالات",
    "Offline app":"التطبيق دون اتصال",
    "Data integrity":"سلامة البيانات",
    "Performance":"الأداء",
    "Readable":"قابلة للقراءة",
    "Active":"مفعّل",
    "TripSpend will run a quick check when Settings opens.":"سيجري TripSpend فحصًا سريعًا عند فتح الإعدادات.",
    "Tools & data":"الأدوات والبيانات",
    "Currency converter":"محول العملات",
    "Amount":"المبلغ",
    "From":"من",
    "To":"إلى",
    "⇄ Swap":"⇄ تبديل",
    "Refresh Rate":"تحديث السعر",
    "Latest rate":"أحدث سعر",
    "Converted amount":"المبلغ المحول",
    "Connect to the internet once to save a rate for offline use.":"اتصل بالإنترنت مرة واحدة لحفظ سعر لاستخدامه دون اتصال.",
    "Install TripSpend":"تثبيت TripSpend",
    "Use it like an app from your home screen.":"استخدمه كتطبيق من الشاشة الرئيسية.",
    "Install availability depends on your browser.":"تعتمد إمكانية التثبيت على متصفحك.",
    "Install App":"تثبيت التطبيق",
    "Show Install Steps":"عرض خطوات التثبيت",
    "Portable backup":"نسخة احتياطية قابلة للنقل",
    "JSON includes trip data and receipt photos. CSV opens in Excel.":"يتضمن JSON بيانات الرحلة وصور الإيصالات، ويمكن فتح CSV في Excel.",
    "Export Backup":"تصدير نسخة احتياطية",
    "Export CSV":"تصدير CSV",
    "Import Backup":"استيراد نسخة احتياطية",
    "Saved exchange rates":"أسعار الصرف المحفوظة",
    "TripSpend remembers rates you use and reuses them automatically.":"يتذكر TripSpend أسعار الصرف التي تستخدمها ويعيد استخدامها تلقائيًا.",
    "No saved rates yet.":"لا توجد أسعار صرف محفوظة بعد.",
    "Clear Saved Rates":"مسح أسعار الصرف المحفوظة",
    "Gemini-powered trip analysis and confirmed changes.":"تحليل الرحلة بواسطة Gemini مع تأكيد التغييرات.",
    "via Cloudflare Worker • confirm writes":"عبر Cloudflare Worker • تأكيد التغييرات",
    "Delete trip":"حذف الرحلة",
    "Clears this trip from this browser.":"يحذف هذه الرحلة من هذا المتصفح.",
    "Delete Trip":"حذف الرحلة",
    "Cash":"نقدًا",
    "Credit Card":"بطاقة ائتمان",
    "Debit Card":"بطاقة خصم",
    "Apple Pay":"Apple Pay",
    "Other":"أخرى",
    "Ready":"جاهز",
    "READY":"جاهز",
    "Healthy":"سليم",
    "Available":"متاح",
    "Unavailable":"غير متاح",
    "Passed":"ناجح",
    "PASS":"ناجح",
    "Failed":"فشل",
    "FAIL":"فشل"
  }));

  const SETTINGS_ATTR_AR = new Map(Object.entries({
    "Start typing a country…":"ابدأ بكتابة اسم الدولة…",
    "Trip start date":"تاريخ بدء الرحلة",
    "Trip end date":"تاريخ انتهاء الرحلة",
    "Appearance":"المظهر"
  }));

  function isArabic() {
    const lang = window.TripSpendLocale?.language?.() || document.documentElement.lang || "en";
    return String(lang).toLowerCase().startsWith("ar");
  }

  function arabicCountryTrail(value) {
    return String(value || "")
      .split(/\s*→\s*/)
      .map(country => window.TripSpendLocale?.country?.(country.trim()) || country.trim())
      .join(" ← ");
  }

  function translateSettingsText(value) {
    const raw = String(value ?? "");
    const trimmed = raw.trim();
    if (!trimmed) return null;
    if (SETTINGS_AR.has(trimmed)) return raw.replace(trimmed, SETTINGS_AR.get(trimmed));

    let match = trimmed.match(/^(\d+)\s+country$/i);
    if (match) return raw.replace(trimmed, `${match[1]} دولة`);
    match = trimmed.match(/^(\d+)\s+countries$/i);
    if (match) return raw.replace(trimmed, `${match[1]} دول`);
    match = trimmed.match(/^(\d+)\s+countries\s*•\s*(.+)$/i);
    if (match) return raw.replace(trimmed, `${match[1]} دول • ${arabicCountryTrail(match[2])}`);
    match = trimmed.match(/^startup\s+([\d.]+)\s*ms\s*•\s*render\s+([\d.]+)\s*ms\s*•\s*Waiting for first save$/i);
    if (match) return raw.replace(trimmed, `بدء التشغيل ${match[1]} مللي ثانية • العرض ${match[2]} مللي ثانية • انتظار أول حفظ`);
    match = trimmed.match(/^(.+?)\s*•\s*(\d+)\s+photos?$/i);
    if (match) return raw.replace(trimmed, `${match[1]} • ${match[2]} ${Number(match[2]) === 1 ? "صورة" : "صور"}`);
    match = trimmed.match(/^IndexedDB\s*•\s*OK$/i);
    if (match) return raw.replace(trimmed, "IndexedDB • سليم");
    match = trimmed.match(/^Readable\s*•\s*OK$/i);
    if (match) return raw.replace(trimmed, "قابلة للقراءة • سليم");
    match = trimmed.match(/^(\d+)\s+stored\s*•\s*OK$/i);
    if (match) return raw.replace(trimmed, `${match[1]} محفوظ • سليم`);
    match = trimmed.match(/^Active\s*•\s*OK$/i);
    if (match) return raw.replace(trimmed, "مفعّل • سليم");
    match = trimmed.match(/^Healthy\s*•\s*OK$/i);
    if (match) return raw.replace(trimmed, "سليم");
    match = trimmed.match(/^(\d+)\s+expenses?\s*•\s*([\d.]+)\s*ms\s+render$/i);
    if (match) return raw.replace(trimmed, `${match[1]} مصروف • عرض ${match[2]} مللي ثانية`);
    match = trimmed.match(/^Everything looks healthy\s*•\s*checked in\s+([\d.]+)\s*ms$/i);
    if (match) return raw.replace(trimmed, `كل شيء يعمل بشكل سليم • تم الفحص خلال ${match[1]} مللي ثانية`);
    match = trimmed.match(/^Latest available reference rate\s*•\s*rate date\s+(.+)\. Saved for offline use\.$/i);
    if (match) return raw.replace(trimmed, `أحدث سعر مرجعي متاح • تاريخ السعر ${match[1]}. تم حفظه للاستخدام دون اتصال.`);
    match = trimmed.match(/^Saved rate\s*•\s*last refreshed\s+(.+)$/i);
    if (match) return raw.replace(trimmed, `سعر محفوظ • آخر تحديث ${match[1]}`);
    match = trimmed.match(/^Offline\/cached rate\s*•\s*saved\s+(.+)$/i);
    if (match) return raw.replace(trimmed, `سعر محفوظ دون اتصال • تم الحفظ ${match[1]}`);
    return null;
  }

  function localizeSettingsNode(node) {
    if (!node || node.nodeType !== Node.TEXT_NODE) return;
    const current = node.nodeValue || "";
    if (!current.trim()) return;

    if (isArabic()) {
      const translated = translateSettingsText(current);
      if (translated != null && translated !== current) {
        if (!settingsOriginals.has(node)) settingsOriginals.set(node, current);
        node.nodeValue = translated;
      }
      return;
    }

    const original = settingsOriginals.get(node);
    if (original != null && node.nodeValue !== original) node.nodeValue = original;
  }

  function localizeSettingsAttributes(root) {
    root.querySelectorAll?.("input[placeholder], textarea[placeholder], [aria-label]").forEach(el => {
      ["placeholder", "aria-label"].forEach(attr => {
        const current = el.getAttribute(attr);
        if (!current) return;
        const key = `tsOriginal${attr === "placeholder" ? "Placeholder" : "AriaLabel"}`;
        if (isArabic()) {
          const translated = SETTINGS_ATTR_AR.get(current) || SETTINGS_ATTR_AR.get(el.dataset[key]);
          if (!translated) return;
          if (!el.dataset[key]) el.dataset[key] = current;
          el.setAttribute(attr, translated);
        } else if (el.dataset[key]) {
          el.setAttribute(attr, el.dataset[key]);
        }
      });
    });
  }

  function localizeSettings() {
    const root = $("settings");
    if (!root || settingsLocalizing) return;
    settingsLocalizing = true;
    try {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) localizeSettingsNode(node);
      localizeSettingsAttributes(root);
    } finally {
      settingsLocalizing = false;
    }
  }

  function queueSettingsLocalization() {
    if (settingsLocalizationQueued) return;
    settingsLocalizationQueued = true;
    requestAnimationFrame(() => {
      settingsLocalizationQueued = false;
      localizeSettings();
    });
  }

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
      strip.setAttribute("aria-label", `${isArabic() ? "دول الرحلة" : "Trip countries"}${codes ? `: ${codes}` : ""}`);
      strip.querySelectorAll(".ts-country-flag-v705").forEach(flag => flag.removeAttribute("role"));
    });
  }

  function injectStyles() {
    if ($("tripSpendUiFixesV705Styles")) return;
    const style = document.createElement("style");
    style.id = "tripSpendUiFixesV705Styles";
    style.textContent = `
      .fx-result>div{background:var(--surface2)!important}
      .fx-status.good{color:var(--ok)!important}
      .fx-status.bad{color:var(--bad)!important}

      html[dir="rtl"] #settings .eyebrow,
      html[dir="rtl"] #settings .settings-group-label,
      html[dir="rtl"] #settings .smart-badge{
        letter-spacing:0!important;
        text-transform:none!important;
      }

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

      #tripSwitcherModal .trip-switcher-current-identity,
      #tripSwitcherSheet .trip-switcher-current-identity,
      .trip-switcher-modal .trip-switcher-current-identity,
      .trip-switcher-sheet .trip-switcher-current-identity{min-width:0!important}

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
      .ts-swipe-flags-v705 .ts-country-flag-v705{flex:0 0 auto!important;scroll-snap-align:start}

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

      /* Arabic onboarding dates: From (من) is the right-hand field and To (إلى) is the left-hand field. */
      html[dir="rtl"] #setupView.ts-setup-onboarding .ts-setup-panel[data-setup-step="1"] .primary-country-dates{
        direction:ltr!important;
      }
      html[dir="rtl"] #setupView.ts-setup-onboarding .ts-setup-panel[data-setup-step="1"] .primary-country-dates>.date-field-label:first-child{
        grid-column:2!important;
      }
      html[dir="rtl"] #setupView.ts-setup-onboarding .ts-setup-panel[data-setup-step="1"] .primary-country-dates>.date-field-label:nth-child(2){
        grid-column:1!important;
      }
      html[dir="rtl"] #setupView.ts-setup-onboarding .ts-setup-panel[data-setup-step="1"] .date-field-label{
        direction:rtl!important;
        text-align:right!important;
      }
      html[dir="rtl"] #setupView.ts-setup-onboarding .ts-setup-panel[data-setup-step="1"] .date-field-label>span{
        display:block!important;
        width:100%!important;
        text-align:right!important;
        letter-spacing:0!important;
      }
      html[dir="rtl"] #setupView.ts-setup-onboarding .ts-setup-panel[data-setup-step="1"] .date-picker-card{
        direction:rtl!important;
        justify-content:flex-start!important;
        text-align:right!important;
      }
      html[dir="rtl"] #setupView.ts-setup-onboarding .ts-setup-panel[data-setup-step="1"] .date-display{
        flex:1 1 auto!important;
        min-width:0!important;
        direction:rtl!important;
        unicode-bidi:plaintext;
        text-align:right!important;
      }
      html[dir="rtl"] #setupView.ts-setup-onboarding .ts-setup-panel[data-setup-step="1"] .date-calendar{
        flex:0 0 auto!important;
        margin-inline-start:auto!important;
        margin-inline-end:0!important;
      }

      @media(max-width:420px){
        .ts-swipe-flags-v705{max-width:128px!important;gap:7px!important}
        #setupView.ts-setup-onboarding .ts-setup-panel[data-setup-step="1"] .primary-country-dates{gap:10px!important}
        .dashboard-refresh #v6PlanRow.v6-plan-row{
          grid-template-columns:30px minmax(0,1fr) 16px!important;
          gap:9px!important;
          min-height:58px!important;
          padding:8px 10px!important;
        }
        .dashboard-refresh #v6PlanRow .v6-plan-icon{width:30px!important;height:30px!important;font-size:15px!important}
      }
      @media(max-width:350px){
        .ts-swipe-flags-v705{max-width:105px!important}
        #setupView.ts-setup-onboarding .ts-setup-panel[data-setup-step="1"] .primary-country-dates{grid-template-columns:1fr!important}
        html[dir="rtl"] #setupView.ts-setup-onboarding .ts-setup-panel[data-setup-step="1"] .primary-country-dates>.date-field-label:first-child,
        html[dir="rtl"] #setupView.ts-setup-onboarding .ts-setup-panel[data-setup-step="1"] .primary-country-dates>.date-field-label:nth-child(2){grid-column:1!important}
      }
    `;
    document.head.appendChild(style);
  }

  function apply() {
    scheduled = false;
    forcePremiumSetup();
    enhanceSwipeFlags(document);
    if (document.querySelector(".page.active")?.id === "settings") queueSettingsLocalization();
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(apply);
  }

  function start() {
    injectStyles();
    apply();

    const observeClass = target => {
      if (!target) return;
      const observer = new MutationObserver(schedule);
      observer.observe(target, { attributes:true, attributeFilter:["class"] });
    };
    const observeChildren = target => {
      if (!target) return;
      const observer = new MutationObserver(schedule);
      observer.observe(target, { childList:true, subtree:true });
    };
    observeClass($("setupView"));
    observeClass($("mainView"));
    observeChildren($("tripSwitcherModal"));
    observeChildren($("tripSwitcherSheet"));

    const settings = $("settings");
    if (settings) {
      const settingsObserver = new MutationObserver(() => {
        if (!settingsLocalizing && document.querySelector(".page.active")?.id === "settings") queueSettingsLocalization();
      });
      settingsObserver.observe(settings, {childList:true,subtree:true,characterData:true});
    }

    window.addEventListener("tripspend:render", () => { schedule(); queueSettingsLocalization(); });
    window.addEventListener("tripspend:page", () => { schedule(); queueSettingsLocalization(); });
    window.addEventListener("tripspend:language", () => {
      schedule();
      requestAnimationFrame(() => {
        window.TripSpendSettingsPolish?.apply?.();
        localizeSettings();
        window.setTimeout(localizeSettings, 80);
      });
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, {once:true});
  else start();

  window.TripSpendUiFixes = {
    version:RELEASE,
    apply,
    forcePremiumSetup,
    enhanceSwipeFlags,
    localizeSettings
  };
})();
