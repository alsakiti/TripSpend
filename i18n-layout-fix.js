(() => {
  "use strict";

  const ARABIC_RE = /[\u0600-\u06FF]/;
  const originals = new WeakMap();
  const lastApplied = new WeakMap();
  const marked = new Set();
  let observer = null;
  let queued = false;
  let busy = false;

  const EXTRA = new Map(Object.entries({
    "Log a purchase in seconds":"سجّل عملية شراء خلال ثوانٍ",
    "Spent today":"مصروف اليوم",
    "Safe today":"المتاح اليوم",
    "No upcoming costs reserved":"لا توجد تكاليف قادمة محجوزة",
    "CURRENT COUNTRY • AUTO BY DATE":"الدولة الحالية • تلقائي حسب التاريخ",
    "Current country • auto by date":"الدولة الحالية • تلقائي حسب التاريخ",
    "NEXT UP":"التالي",
    "No country budget":"لا توجد ميزانية للدولة",
    "Set budget":"تحديد الميزانية",
    "Manage":"إدارة",
    "Tap a country to set its budget.":"اضغط على دولة لتحديد ميزانيتها.",
    "On track":"ضمن الميزانية",
    "Over budget":"تجاوزت الميزانية",
    "Trip history":"سجل الرحلات",
    "No past trips yet • tap to manage trips":"لا توجد رحلات سابقة • اضغط لإدارة الرحلات",
    "Budget details":"تفاصيل الميزانية",
    "BUDGET DETAILS":"تفاصيل الميزانية",
    "Budget":"الميزانية",
    "Spent":"المصروف",
    "Remaining":"المتبقي",
    "Current country":"الدولة الحالية",
    "Country budget":"ميزانية الدولة",
    "Country budget left":"المتبقي من ميزانية الدولة",
    "Trip countries":"دول الرحلة",
    "Next up":"التالي",
    "Upcoming costs":"التكاليف القادمة",
    "Food":"الطعام",
    "Transport":"النقل",
    "Hotel":"الفندق",
    "Shopping":"التسوق",
    "Activities":"الأنشطة",
    "Flights":"الرحلات الجوية",
    "Coffee":"القهوة",
    "Groceries":"البقالة",
    "Other":"أخرى",
    "Cash":"نقدًا",
    "Credit Card":"بطاقة ائتمان",
    "Debit Card":"بطاقة خصم",
    "Personal":"شخصي",
    "Shared":"مشترك",
    "Personal expense":"مصروف شخصي",
    "Shared expense":"مصروف مشترك",
    "Planned":"مخطط",
    "Booked":"محجوز",
    "Paid":"مدفوع",
    "Add expense":"إضافة مصروف",
    "Add Expense":"إضافة مصروف",
    "Set country budget":"تحديد ميزانية الدولة",
    "Expenses":"المصروفات",
    "Plan":"الخطة",
    "Analytics":"التحليلات",
    "Settings":"الإعدادات",
    "Home":"الرئيسية"
  }));

  const ISO_CODES = `AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW`.split(/\s+/);

  const countryMap = new Map();
  let countryRegex = null;
  try {
    const en = new Intl.DisplayNames(["en"], { type: "region" });
    const ar = new Intl.DisplayNames(["ar"], { type: "region" });
    for (const code of ISO_CODES) {
      const enName = en.of(code);
      const arName = ar.of(code);
      if (enName && arName && enName !== code && arName !== code) countryMap.set(enName.toLowerCase(), arName);
    }
    [
      ["UAE", "الإمارات العربية المتحدة"],
      ["United States", "الولايات المتحدة"],
      ["USA", "الولايات المتحدة"],
      ["United Kingdom", "المملكة المتحدة"],
      ["UK", "المملكة المتحدة"],
      ["South Korea", "كوريا الجنوبية"],
      ["North Korea", "كوريا الشمالية"],
      ["Russia", "روسيا"],
      ["Vietnam", "فيتنام"],
      ["Bolivia", "بوليفيا"],
      ["Tanzania", "تنزانيا"],
      ["Venezuela", "فنزويلا"],
      ["Syria", "سوريا"],
      ["Iran", "إيران"],
      ["Laos", "لاوس"],
      ["Moldova", "مولدوفا"],
      ["Brunei", "بروناي"]
    ].forEach(([a,b]) => countryMap.set(a.toLowerCase(), b));
    const names = [...countryMap.keys()].sort((a,b) => b.length - a.length).map(s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    countryRegex = new RegExp(`(^|[^A-Za-z])(${names.join("|")})(?=$|[^A-Za-z])`, "gi");
  } catch {}

  function language() {
    return window.TripSpendI18n?.language?.() === "ar" ? "ar" : "en";
  }

  function translateDynamic(text) {
    let out = text;
    const trimmed = out.trim();
    if (EXTRA.has(trimmed)) out = out.replace(trimmed, EXTRA.get(trimmed));

    out = out.replace(/\b(\d+)\s+countries\b/gi, (_, n) => `${n} دول`);
    out = out.replace(/^\s*Good morning,\s*(.+?)\s*$/i, (_, name) => `صباح الخير، ${name}`);
    out = out.replace(/^\s*Good afternoon,\s*(.+?)\s*$/i, (_, name) => `مساء الخير، ${name}`);
    out = out.replace(/^\s*Good evening,\s*(.+?)\s*$/i, (_, name) => `مساء الخير، ${name}`);
    out = out.replace(/\b(\d+(?:\.\d+)?)%\s*used\b/gi, (_, n) => `تم استخدام ${n}٪`);
    out = out.replace(/At your current pace you may finish around\s+(.+?)\s+under budget\.?/gi, (_, amount) => `بحسب وتيرتك الحالية قد تنهي الرحلة بأقل من الميزانية بحوالي ${amount}.`);
    out = out.replace(/At your current pace you may finish around\s+(.+?)\s+over budget\.?/gi, (_, amount) => `بحسب وتيرتك الحالية قد تنهي الرحلة بأعلى من الميزانية بحوالي ${amount}.`);

    if (countryRegex) {
      out = out.replace(countryRegex, (match, prefix, name) => `${prefix}${countryMap.get(name.toLowerCase()) || name}`);
    }
    return out;
  }

  function parentShouldCenter(el) {
    return !!el?.closest?.("#languageToggle, .bottom-nav, nav, .nav-item, .icon-btn, .floating-add, .dashboard-add-button, .trip-ai-send, .trip-ai-suggestion");
  }

  function markArabic(node, translated) {
    const el = node.parentElement;
    if (!el || !ARABIC_RE.test(translated)) return;
    el.classList.add("ts-ar-text");
    if (parentShouldCenter(el)) el.classList.add("ts-ar-center");
    marked.add(el);
  }

  function unmarkAll() {
    for (const el of marked) {
      if (!el?.classList) continue;
      el.classList.remove("ts-ar-text", "ts-ar-center");
    }
    marked.clear();
  }

  function translateNode(node, lang) {
    if (node.nodeType !== Node.TEXT_NODE || !node.nodeValue?.trim()) return;
    const parent = node.parentElement;
    if (!parent || parent.closest("script, style, noscript")) return;

    const current = node.nodeValue;
    const previousOriginal = originals.get(node);
    const previousApplied = lastApplied.get(node);
    let original = previousOriginal;

    if (original === undefined || (current !== original && current !== previousApplied)) {
      original = current;
      originals.set(node, original);
    }

    if (lang === "en") {
      if (previousApplied !== undefined && current === previousApplied && current !== original) node.nodeValue = original;
      lastApplied.delete(node);
      return;
    }

    const translated = translateDynamic(original);
    if (translated !== original) {
      node.nodeValue = translated;
      lastApplied.set(node, translated);
      markArabic(node, translated);
    } else if (ARABIC_RE.test(current)) {
      markArabic(node, current);
    }
  }

  function installStyles() {
    if (document.getElementById("tripSpendArabicLayoutFix")) return;
    const style = document.createElement("style");
    style.id = "tripSpendArabicLayoutFix";
    style.textContent = `
      html.ts-ar-layout, html.ts-ar-layout body{direction:ltr!important}
      body.lang-ar{direction:ltr!important}
      body.lang-ar .app, body.lang-ar main, body.lang-ar .topbar, body.lang-ar .bottom-nav,
      body.lang-ar .card, body.lang-ar .section, body.lang-ar .dashboard-budget-card,
      body.lang-ar .dashboard-country-card, body.lang-ar .dashboard-next-card,
      body.lang-ar .country-budget-grid, body.lang-ar .expense-quick-context{direction:ltr!important}
      body.lang-ar .ts-ar-text{direction:rtl!important;unicode-bidi:plaintext;text-align:right}
      body.lang-ar .ts-ar-center{direction:rtl!important;text-align:center!important}
      body.lang-ar #languageToggle{direction:ltr!important}
      body.lang-ar input, body.lang-ar select, body.lang-ar textarea{unicode-bidi:plaintext}
      body.lang-ar input[type="number"], body.lang-ar input[type="date"], body.lang-ar input[type="time"],
      body.lang-ar .money, body.lang-ar .amount, body.lang-ar [class*="amount"], body.lang-ar [class*="date"]{direction:ltr}
    `;
    document.head.appendChild(style);
  }

  function applyLayout(lang) {
    installStyles();
    document.documentElement.classList.toggle("ts-ar-layout", lang === "ar");
    document.documentElement.dir = "ltr";
    document.documentElement.lang = lang;
    document.body?.classList.toggle("lang-ar", lang === "ar");
  }

  function apply() {
    if (busy || !document.body) return;
    busy = true;
    observer?.disconnect();
    try {
      const lang = language();
      applyLayout(lang);
      unmarkAll();
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) translateNode(node, lang);
    } finally {
      busy = false;
      if (observer && document.body) observer.observe(document.body, { childList:true, subtree:true, characterData:true });
    }
  }

  function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      apply();
    });
  }

  function start() {
    installStyles();
    observer = new MutationObserver(() => queue());
    window.addEventListener("tripspend:language", queue);
    apply();
    observer.observe(document.body, { childList:true, subtree:true, characterData:true });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once:true });
  else start();
})();
