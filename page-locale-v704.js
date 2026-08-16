(() => {
  "use strict";

  const RELEASE = "7.0.4";
  const originals = new WeakMap();
  let observer = null;
  let queued = false;
  let busy = false;

  const TEXT = new Map(Object.entries({
    // Plan
    "TRIP PLANNER":"مخطط الرحلة",
    "Your trip":"رحلتك",
    "Plan what you are doing, then keep the cost connected to your spending.":"خطط لما ستفعله، واربط التكلفة بمصروفاتك.",
    "TRIP PROGRESS":"تقدم الرحلة",
    "Spent":"المصروف",
    "Upcoming":"القادم",
    "Committed":"الملتزم به",
    "Itinerary":"برنامج الرحلة",
    "Costs":"التكاليف",
    "Trip planner view":"عرض مخطط الرحلة",
    "Flights, hotels, activities, restaurants and notes by day.":"الرحلات والفنادق والأنشطة والمطاعم والملاحظات مرتبة حسب اليوم.",
    "＋ Add item":"＋ إضافة عنصر",
    "+ Add item":"+ إضافة عنصر",
    "Your itinerary starts here":"يبدأ برنامج رحلتك من هنا",
    "Add a flight, hotel, activity, restaurant, transport or simple note.":"أضف رحلة جوية أو فندقًا أو نشاطًا أو مطعمًا أو وسيلة نقل أو ملاحظة بسيطة.",
    "＋ Add first item":"＋ إضافة أول عنصر",
    "+ Add first item":"+ إضافة أول عنصر",
    "No upcoming plans":"لا توجد خطط قادمة",
    "Open itinerary & costs":"افتح برنامج الرحلة والتكاليف",
    "TRIP COMPLETE":"اكتملت الرحلة",
    "Trip complete":"اكتملت الرحلة",
    "UPCOMING COSTS":"التكاليف القادمة",
    "Upcoming costs":"التكاليف القادمة",
    "Expected costs":"التكاليف المتوقعة",
    "No upcoming costs":"لا توجد تكاليف قادمة",
    "No planned costs yet":"لا توجد تكاليف مخططة بعد",
    "Add cost":"إضافة تكلفة",
    "＋ Add cost":"＋ إضافة تكلفة",
    "Mark paid":"تحديد كمدفوع",
    "Paid":"مدفوع",
    "Planned":"مخطط",
    "Booked":"محجوز",

    // Analytics
    "ANALYTICS":"التحليلات",
    "Trip spending":"إنفاق الرحلة",
    "Simple answers first. Details only when you want them.":"إجابات بسيطة أولًا، والتفاصيل عند الحاجة.",
    "TOTAL SPENT":"إجمالي المصروف",
    "No budget":"لا توجد ميزانية",
    "Add a trip budget to compare your spending pace":"أضف ميزانية للرحلة لمقارنة وتيرة إنفاقك",
    "Top category":"أعلى فئة",
    "Remaining":"المتبقي",
    "Personal":"شخصي",
    "Shared":"مشترك",
    "Expenses":"المصروفات",
    "Avg / day":"المتوسط / يوم",
    "Avg expense":"متوسط المصروف",
    "Largest":"الأكبر",
    "Where your money went":"أين ذهبت أموالك",
    "Spending by category":"الإنفاق حسب الفئة",
    "No spending yet":"لا يوجد إنفاق بعد",
    "Who owes whom":"من يدين لمن",
    "Only outstanding group debts":"الديون الجماعية المستحقة فقط",
    "SETTLE UP":"التسوية",
    "Settlement history":"سجل التسويات",
    "No group debts yet":"لا توجد ديون جماعية بعد",
    "Personal expenses paid by the same person do not create debt. Shared expenses, or personal expenses paid for someone else, will appear here.":"المصروفات الشخصية التي يدفعها الشخص نفسه لا تنشئ دينًا. ستظهر هنا المصروفات المشتركة أو المصروفات الشخصية التي يدفعها شخص عن شخص آخر.",
    "Show calculation details":"عرض تفاصيل الحساب",
    "Hide calculation details":"إخفاء تفاصيل الحساب",
    "✓ Everyone is settled up.":"✓ تمت تسوية الجميع.",
    "Everyone is settled up ✓":"تمت تسوية الجميع ✓",
    "MORE INSIGHTS":"مزيد من التحليلات",
    "Payment, travelers & daily spending":"الدفع والمسافرون والإنفاق اليومي",
    "Payment methods":"طرق الدفع",
    "How you paid":"كيف دفعت",
    "Daily spending":"الإنفاق اليومي",
    "Spending by day":"الإنفاق حسب اليوم",
    "Biggest day":"أعلى يوم إنفاقًا",
    "Traveler spending":"إنفاق المسافرين",
    "By traveler":"حسب المسافر",
    "By country":"حسب الدولة",
    "By category":"حسب الفئة",
    "Food":"الطعام",
    "Transport":"النقل",
    "Hotel":"الفندق",
    "Shopping":"التسوق",
    "Activities":"الأنشطة",
    "Flights":"الرحلات الجوية",
    "Coffee":"القهوة",
    "Groceries":"البقالة",
    "Other":"أخرى"
  }));

  const CATEGORY = {
    Food:"الطعام", Transport:"النقل", Hotel:"الفندق", Shopping:"التسوق",
    Activities:"الأنشطة", Flights:"الرحلات الجوية", Coffee:"القهوة",
    Groceries:"البقالة", Other:"أخرى"
  };

  function language() {
    return window.TripSpendLocale?.language?.() ||
      window.TripSpendI18n?.language?.() ||
      document.documentElement.lang || "en";
  }

  function isArabic() { return language() === "ar"; }

  function translateDynamic(value) {
    const raw = String(value ?? "");
    const text = raw.trim();
    if (!text) return raw;

    if (TEXT.has(text)) return raw.replace(text, TEXT.get(text));

    let m = text.match(/^(\d+(?:\.\d+)?)%\s+of budget$/i);
    if (m) return raw.replace(text, `${m[1]}% من الميزانية`);

    m = text.match(/^On pace\s*•\s*(\d+)% budget used vs (\d+)% of trip$/i);
    if (m) return raw.replace(text, `ضمن المسار • تم استخدام ${m[1]}% من الميزانية مقابل ${m[2]}% من الرحلة`);

    m = text.match(/^Spending faster\s*•\s*(\d+)% budget used vs (\d+)% of trip$/i);
    if (m) return raw.replace(text, `الإنفاق أسرع • تم استخدام ${m[1]}% من الميزانية مقابل ${m[2]}% من الرحلة`);

    m = text.match(/^(.+?)\s+is highest at\s+(.+)$/i);
    if (m) {
      let label = m[1].trim();
      for (const [english, arabic] of Object.entries(CATEGORY)) {
        label = label.replace(new RegExp(`\\b${english}\\b`, "g"), arabic);
      }
      return raw.replace(text, `${label} هي الأعلى عند ${m[2]}`);
    }

    m = text.match(/^(\d+)\s+expenses?$/i);
    if (m) return raw.replace(text, `${m[1]} مصروف`);

    // Category values are often rendered with the emoji before or after the English label.
    for (const [english, arabic] of Object.entries(CATEGORY)) {
      const categoryOnly = new RegExp(`^[^A-Za-z]*${english}[^A-Za-z]*$`);
      if (categoryOnly.test(text)) {
        return raw.replace(text, text.replace(new RegExp(`\\b${english}\\b`, "g"), arabic));
      }
    }

    return raw;
  }

  function applyTextNode(node) {
    if (!node || node.nodeType !== Node.TEXT_NODE) return;
    const current = node.nodeValue || "";
    if (!current.trim()) return;

    if (isArabic()) {
      const next = translateDynamic(current);
      if (next !== current) {
        // Capture the latest English value; dynamic analytics text reuses nodes.
        originals.set(node, current);
        node.nodeValue = next;
      }
      return;
    }

    const original = originals.get(node);
    if (original != null && node.nodeValue !== original) node.nodeValue = original;
  }

  function walk(root) {
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) applyTextNode(node);
  }

  function installStyles() {
    if (document.getElementById("tripSpendPageLocaleV704Styles")) return;
    const style = document.createElement("style");
    style.id = "tripSpendPageLocaleV704Styles";
    style.textContent = `
      html[dir="rtl"] #plan .eyebrow,
      html[dir="rtl"] #plan .plan-hero small,
      html[dir="rtl"] #plan .section-title small,
      html[dir="rtl"] #analytics .eyebrow,
      html[dir="rtl"] #analytics small,
      html[dir="rtl"] #analytics .smart-badge {
        letter-spacing: 0 !important;
        word-spacing: normal !important;
        text-transform: none !important;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "SF Arabic", "Geeza Pro", "Segoe UI", Tahoma, Arial, sans-serif !important;
        font-variant-ligatures: common-ligatures contextual !important;
        font-feature-settings: "liga" 1, "calt" 1 !important;
      }
    `;
    document.head.appendChild(style);
  }

  function apply() {
    if (busy) return;
    busy = true;
    try {
      installStyles();
      walk(document.getElementById("plan"));
      walk(document.getElementById("analytics"));
    } finally {
      busy = false;
    }
  }

  function queueApply() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      apply();
    });
  }

  function start() {
    installStyles();
    apply();
    const main = document.getElementById("mainView") || document.body;
    observer = new MutationObserver(() => { if (!busy) queueApply(); });
    observer.observe(main, { childList:true, subtree:true, characterData:true });
    window.addEventListener("tripspend:language", queueApply);
    document.addEventListener("click", event => {
      if (event.target?.closest?.("#plan, #analytics, nav, .bottom-nav")) queueApply();
    }, true);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once:true });
  else start();

  window.TripSpendPageLocale = { release:RELEASE, apply };
})();
