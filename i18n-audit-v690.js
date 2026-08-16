(() => {
  "use strict";

  const APP_VERSION = "6.9.0";
  const ARABIC_RE = /[\u0600-\u06FF]/;
  const originals = new WeakMap();
  const attrOriginals = new WeakMap();
  let observer = null;
  let queued = false;
  let busy = false;

  const AR = new Map(Object.entries({
    "Loading your trip…":"جارٍ تحميل رحلتك…",
    "TripSpend update available":"يتوفر تحديث لـ TripSpend",
    "Update now":"حدّث الآن",
    "Travel spending, made simple.":"إدارة مصاريف السفر ببساطة.",
    "NEW TRIP":"رحلة جديدة",
    "Set up your trip":"إعداد رحلتك",
    "Your data stays in this browser.":"تبقى بياناتك محفوظة على هذا الجهاز.",
    "Past trips":"الرحلات السابقة",
    "Open a previous trip or start a new one below.":"افتح رحلة سابقة أو ابدأ رحلة جديدة أدناه.",
    "Trip name":"اسم الرحلة",
    "Enter trip name":"أدخل اسم الرحلة",
    "Countries":"الدول",
    "Add the countries you will visit and the dates for each one.":"أضف الدول التي ستزورها وتواريخ كل دولة.",
    "Country":"الدولة",
    "Search for a country…":"ابحث عن دولة…",
    "Search for a country...":"ابحث عن دولة…",
    "From":"من",
    "To":"إلى",
    "Select date":"اختر التاريخ",
    "Local currency":"العملة المحلية",
    "Country budget":"ميزانية الدولة",
    "(optional)":"(اختياري)",
    "Home currency":"العملة الأساسية",
    "＋ Add another country":"＋ إضافة دولة أخرى",
    "+ Add another country":"+ إضافة دولة أخرى",
    "Add another country":"إضافة دولة أخرى",
    "Add Country":"إضافة الدولة",
    "Edit country":"تعديل الدولة",
    "Save Changes":"حفظ التغييرات",
    "Cancel":"إلغاء",
    "Remove":"إزالة",
    "Trip dates will follow your country dates automatically.":"سيتم تحديد تواريخ الرحلة تلقائيًا حسب تواريخ الدول.",
    "Total trip budget":"إجمالي ميزانية الرحلة",
    "Enter budget":"أدخل الميزانية",
    "Travelers":"المسافرون",
    "Add the people whose spending you want to track.":"أضف الأشخاص الذين تريد متابعة مصروفاتهم.",
    "Your name":"اسمك",
    "(first traveler)":"(المسافر الأول)",
    "Enter your name":"أدخل اسمك",
    "＋ Add traveler":"＋ إضافة مسافر",
    "+ Add traveler":"+ إضافة مسافر",
    "Add traveler":"إضافة مسافر",
    "＋ Add another":"＋ إضافة آخر",
    "+ Add another":"+ إضافة آخر",
    "Add another":"إضافة آخر",
    "Traveler name":"اسم المسافر",
    "Enter traveler name":"أدخل اسم المسافر",
    "Add Traveler":"إضافة المسافر",
    "Edit traveler":"تعديل المسافر",
    "Your total budget and reports use this currency.":"تُستخدم هذه العملة في الميزانية الإجمالية والتقارير.",
    "Create Trip":"إنشاء الرحلة",
    "automatic":"تلقائي",
    "First country start date":"تاريخ بداية الدولة الأولى",
    "First country end date":"تاريخ نهاية الدولة الأولى",
    "Additional country start date":"تاريخ بداية الدولة الإضافية",
    "Additional country end date":"تاريخ نهاية الدولة الإضافية",

    "Home":"الرئيسية",
    "Expenses":"المصروفات",
    "Plan":"الخطة",
    "Analytics":"التحليلات",
    "Settings":"الإعدادات",
    "TODAY":"اليوم",
    "Your trip at a glance":"رحلتك بنظرة سريعة",
    "Stay on budget and keep the day moving.":"تابع ميزانيتك وخطط يومك بسهولة.",
    "TRIP BUDGET LEFT":"المتبقي من ميزانية الرحلة",
    "Budget":"الميزانية",
    "Spent":"المصروف",
    "BUDGET DETAILS":"تفاصيل الميزانية",
    "Budget details":"تفاصيل الميزانية",
    "Plans & available balance":"الخطط والرصيد المتاح",
    "Reserved for plans":"محجوز للخطط",
    "Available after plans":"المتاح بعد الخطط",
    "No upcoming costs reserved":"لا توجد تكاليف قادمة محجوزة",
    "Safe today":"المتاح اليوم",
    "☀️ Safe today":"المتاح اليوم ☀️",
    "Spent today":"مصروف اليوم",
    "🧾 Spent today":"مصروف اليوم 🧾",
    "Your balance after upcoming planned costs, divided across the days left in your trip.":"رصيدك بعد التكاليف المخططة القادمة، مقسومًا على الأيام المتبقية في الرحلة.",
    "WHERE YOU ARE":"موقعك الآن",
    "Current trip":"الرحلة الحالية",
    "CURRENT COUNTRY • AUTO BY DATE":"الدولة الحالية • تلقائي حسب التاريخ",
    "Current country • auto by date":"الدولة الحالية • تلقائي حسب التاريخ",
    "No country budget":"لا توجد ميزانية للدولة",
    "NEXT UP":"التالي",
    "Next up":"التالي",
    "YOUR ROUTE":"مسار رحلتك",
    "Country budgets":"ميزانيات الدول",
    "Manage":"إدارة",
    "Tap a country to set its budget.":"اضغط على دولة لتحديد ميزانيتها.",
    "Set budget":"تحديد الميزانية",
    "On track":"ضمن الميزانية",
    "Over budget":"تجاوزت الميزانية",
    "Trip history":"سجل الرحلات",
    "Trips & history":"الرحلات والسجل",
    "No past trips yet • tap to manage trips":"لا توجد رحلات سابقة • اضغط لإدارة الرحلات",

    "MONEY":"المال",
    "Add expense":"إضافة مصروف",
    "＋ Add expense":"＋ إضافة مصروف",
    "Search expenses":"ابحث في المصروفات",
    "All categories":"كل الفئات",
    "All payments":"كل طرق الدفع",
    "All payment methods":"كل طرق الدفع",
    "No expenses yet":"لا توجد مصروفات بعد",
    "No matching expenses":"لا توجد مصروفات مطابقة",
    "Load more":"عرض المزيد",
    "Expense details":"تفاصيل المصروف",
    "Amount":"المبلغ",
    "Date":"التاريخ",
    "Category":"الفئة",
    "Payment":"الدفع",
    "Paid by":"دفع بواسطة",
    "Personal expense for":"مصروف شخصي لـ",
    "Shared with":"مشترك مع",
    "Everyone":"الجميع",
    "Note":"ملاحظة",
    "Receipt":"الإيصال",
    "📷 Add receipt":"📷 إضافة إيصال",
    "Receipt attached":"تم إرفاق الإيصال",
    "Saved locally":"محفوظ محليًا",
    "More options":"خيارات إضافية",
    "Use suggestion":"استخدام الاقتراح",
    "Exchange rate":"سعر الصرف",
    "Enter the exchange rate.":"أدخل سعر الصرف.",
    "Use Latest Rate":"استخدام أحدث سعر",
    "Save Expense":"حفظ المصروف",
    "Personal":"شخصي",
    "Shared":"مشترك",
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

    "TRIP PLAN":"خطة الرحلة",
    "Itinerary":"برنامج الرحلة",
    "Flights, hotels, activities and transport in one place.":"الرحلات والفنادق والأنشطة والتنقل في مكان واحد.",
    "＋ Add item":"＋ إضافة عنصر",
    "Add item":"إضافة عنصر",
    "No itinerary items yet":"لا توجد عناصر في برنامج الرحلة بعد",
    "Upcoming costs":"التكاليف القادمة",
    "Hotels, activities, transport and other expected costs.":"الفنادق والأنشطة والتنقل والتكاليف المتوقعة الأخرى.",
    "＋ Add cost":"＋ إضافة تكلفة",
    "Add planned cost":"إضافة تكلفة مخططة",
    "What are you planning?":"ما الذي تخطط له؟",
    "Estimated cost":"التكلفة التقديرية",
    "Add Planned Cost":"إضافة التكلفة المخططة",
    "Planned":"مخطط",
    "Booked":"محجوز",
    "Time":"الوقت",
    "Location":"الموقع",
    "Booking reference":"مرجع الحجز",
    "Title":"العنوان",
    "Type":"النوع",
    "Status":"الحالة",

    "Total spent":"إجمالي المصروف",
    "Daily average":"المتوسط اليومي",
    "By category":"حسب الفئة",
    "By country":"حسب الدولة",
    "Top categories":"أعلى الفئات",
    "Spending trend":"اتجاه الإنفاق",
    "Settlements":"التسويات",
    "Everyone is settled ✓":"تمت تسوية الجميع ✓",
    "No travelers yet.":"لا يوجد مسافرون بعد.",
    "View all travelers":"عرض كل المسافرين",

    "Trip settings":"إعدادات الرحلة",
    "Primary destination":"الوجهة الرئيسية",
    "Trip start":"بداية الرحلة",
    "Trip end":"نهاية الرحلة",
    "Default payment":"طريقة الدفع الافتراضية",
    "Save trip settings":"حفظ إعدادات الرحلة",
    "Appearance":"المظهر",
    "Choose how TripSpend looks on this device.":"اختر مظهر TripSpend على هذا الجهاز.",
    "System":"النظام",
    "Light":"فاتح",
    "Dark":"داكن",
    "Manage trips":"إدارة الرحلات",
    "Countries & plans":"الدول والخطط",
    "Manage Travelers":"إدارة المسافرين",
    "Data & safety":"البيانات والأمان",
    "Export backup":"تصدير نسخة احتياطية",
    "Import backup":"استيراد نسخة احتياطية",
    "Switch trip":"تبديل الرحلة",

    "Ask TripSpend AI":"اسأل TripSpend AI",
    "Ask TripSpend":"اسأل TripSpend",
    "Ask or make a change…":"اسأل أو اطلب تغييرًا…",
    "Send question":"إرسال السؤال",
    "Close TripSpend AI":"إغلاق TripSpend AI",
    "Confirm":"تأكيد",
    "Confirm change":"تأكيد التغيير",
    "Nothing changes until you tap Confirm.":"لن يتغير شيء حتى تضغط تأكيد.",
    "Undo":"تراجع",
    "Delete":"حذف",
    "Edit":"تعديل",
    "Save":"حفظ",
    "Done":"تم",
    "Clear":"مسح"
  }));

  function language() {
    return window.TripSpendI18n?.language?.() === "ar" ? "ar" : "en";
  }

  function exactOrPattern(text) {
    const raw = String(text ?? "");
    const trimmed = raw.trim();
    if (!trimmed) return raw;
    if (AR.has(trimmed)) return raw.replace(trimmed, AR.get(trimmed));

    let m = trimmed.match(/^Overall trip:\s*(.+)$/i);
    if (m) return raw.replace(trimmed, `إجمالي الرحلة: ${m[1]}`);

    m = trimmed.match(/^Country\s+(\d+):\s*(.+)$/i);
    if (m) return raw.replace(trimmed, `الدولة ${m[1]}: ${m[2]}`);

    m = trimmed.match(/^Traveler\s+(\d+)$/i);
    if (m) return raw.replace(trimmed, `المسافر ${m[1]}`);

    m = trimmed.match(/^(\d+)\s+countries$/i);
    if (m) return raw.replace(trimmed, `${m[1]} دول`);

    m = trimmed.match(/^(\d+(?:\.\d+)?)%\s*used$/i);
    if (m) return raw.replace(trimmed, `تم استخدام ${m[1]}٪`);

    m = trimmed.match(/^Good morning,\s*(.+)$/i);
    if (m) return raw.replace(trimmed, `صباح الخير، ${m[1]}`);
    m = trimmed.match(/^Good afternoon,\s*(.+)$/i);
    if (m) return raw.replace(trimmed, `مساء الخير، ${m[1]}`);
    m = trimmed.match(/^Good evening,\s*(.+)$/i);
    if (m) return raw.replace(trimmed, `مساء الخير، ${m[1]}`);

    m = trimmed.match(/^At your current pace you may finish around\s+(.+?)\s+under budget\.?$/i);
    if (m) return raw.replace(trimmed, `بحسب وتيرتك الحالية قد تنهي الرحلة بأقل من الميزانية بحوالي ${m[1]}.`);
    m = trimmed.match(/^At your current pace you may finish around\s+(.+?)\s+over budget\.?$/i);
    if (m) return raw.replace(trimmed, `بحسب وتيرتك الحالية قد تنهي الرحلة بأعلى من الميزانية بحوالي ${m[1]}.`);

    return raw;
  }

  function rememberAttr(el, attr, value) {
    let map = attrOriginals.get(el);
    if (!map) {
      map = new Map();
      attrOriginals.set(el, map);
    }
    map.set(attr, value);
  }

  function scanTextNode(node, lang) {
    if (node.nodeType !== Node.TEXT_NODE || !node.nodeValue?.trim()) return;
    const parent = node.parentElement;
    if (!parent || parent.closest("script,style,noscript")) return;

    if (lang === "en") {
      if (originals.has(node)) {
        const original = originals.get(node);
        if (node.nodeValue !== original) node.nodeValue = original;
        originals.delete(node);
      }
      return;
    }

    const current = node.nodeValue;
    const translated = exactOrPattern(current);
    if (translated !== current) {
      if (!originals.has(node)) originals.set(node, current);
      node.nodeValue = translated;
      parent.classList.add("ts-ar-text");
    } else if (ARABIC_RE.test(current)) {
      parent.classList.add("ts-ar-text");
    }
  }

  function scanAttribute(el, attr, lang) {
    if (!el.hasAttribute(attr)) return;
    const current = el.getAttribute(attr) || "";
    const map = attrOriginals.get(el);

    if (lang === "en") {
      const original = map?.get(attr);
      if (original !== undefined) {
        if (current !== original) el.setAttribute(attr, original);
        map.delete(attr);
      }
      return;
    }

    const translated = exactOrPattern(current);
    if (translated !== current) {
      if (!map?.has(attr)) rememberAttr(el, attr, current);
      el.setAttribute(attr, translated);
    }
  }

  function enforceVersion() {
    document.querySelectorAll(".version-badge").forEach(el => {
      const wanted = `v${APP_VERSION}`;
      if (el.textContent !== wanted) el.textContent = wanted;
      el.setAttribute("dir", "ltr");
    });
  }

  function scanElement(el, lang) {
    if (!(el instanceof Element)) return;
    ["placeholder", "title", "aria-label"].forEach(attr => scanAttribute(el, attr, lang));
    el.childNodes.forEach(child => {
      if (child.nodeType === Node.TEXT_NODE) scanTextNode(child, lang);
      else if (child.nodeType === Node.ELEMENT_NODE) scanElement(child, lang);
    });
  }

  function installStyles() {
    if (document.getElementById("tripSpendLanguageAuditV690")) return;
    const style = document.createElement("style");
    style.id = "tripSpendLanguageAuditV690";
    style.textContent = `
      body.lang-ar input::placeholder,
      body.lang-ar textarea::placeholder{direction:rtl;text-align:right;letter-spacing:0!important}
      body.lang-ar option{direction:rtl;text-align:right;letter-spacing:0!important}
      body.lang-ar .ts-ar-text{letter-spacing:0!important;word-spacing:normal!important;text-transform:none!important}
      body.lang-ar .version-badge{direction:ltr!important;unicode-bidi:isolate!important;letter-spacing:0!important}
    `;
    document.head.appendChild(style);
  }

  function apply() {
    if (busy || !document.body) return;
    busy = true;
    observer?.disconnect();
    try {
      installStyles();
      const lang = language();
      scanElement(document.body, lang);
      enforceVersion();
    } finally {
      busy = false;
      observe();
    }
  }

  function observe() {
    if (!observer || !document.body) return;
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["placeholder", "title", "aria-label"]
    });
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
    observer = new MutationObserver(() => {
      if (!busy) queue();
    });
    window.addEventListener("tripspend:language", queue);
    apply();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
