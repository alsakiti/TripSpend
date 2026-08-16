(() => {
  "use strict";

  const KEY = "tripspend.language";
  const AR = new Map(Object.entries({
    "Home":"الرئيسية",
    "Expenses":"المصروفات",
    "Plan":"الخطة",
    "Analytics":"التحليلات",
    "Settings":"الإعدادات",
    "Your trip at a glance":"رحلتك بنظرة سريعة",
    "Current trip":"الرحلة الحالية",
    "Country budgets":"ميزانيات الدول",
    "WHERE YOU ARE":"موقعك الآن",
    "YOUR ROUTE":"مسار رحلتك",
    "TODAY":"اليوم",
    "Manage Trips":"إدارة الرحلات",
    "Manage Countries & Plans":"إدارة الدول والخطط",
    "Manage Travelers":"إدارة المسافرين",
    "Add another country":"إضافة دولة أخرى",
    "Preferences & safety":"التفضيلات والأمان",
    "Tools & data":"الأدوات والبيانات",
    "Trip settings":"إعدادات الرحلة",
    "Ask TripSpend AI":"اسأل TripSpend AI",
    "Ask or make a change…":"اسأل أو اطلب تغييرًا…",
    "Send question":"إرسال السؤال",
    "Close TripSpend AI":"إغلاق TripSpend AI",
    "Cancel":"إلغاء",
    "Confirm":"تأكيد",
    "Save":"حفظ",
    "Delete":"حذف",
    "Edit":"تعديل",
    "Add expense":"إضافة مصروف",
    "Add traveler":"إضافة مسافر",
    "Trip budget":"ميزانية الرحلة",
    "Budget":"الميزانية",
    "Spent":"المصروف",
    "Remaining":"المتبقي",
    "Upcoming":"القادم",
    "Today":"اليوم",
    "This trip":"هذه الرحلة",
    "Free beta":"نسخة تجريبية مجانية",
    "CHECKING":"جارٍ التحقق",
    "ONLINE":"متصل",
    "OFFLINE":"غير متصل",
    "Everyone is settled ✓":"تمت تسوية الجميع ✓",
    "No travelers yet.":"لا يوجد مسافرون بعد.",
    "View all travelers":"عرض كل المسافرين"
  }));

  Object.entries({
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
    "Countries":"الدول",
    "Add the countries you will visit and the dates for each one.":"أضف الدول التي ستزورها وتواريخ كل دولة.",
    "Country":"الدولة",
    "From":"من",
    "To":"إلى",
    "Select date":"اختر التاريخ",
    "Local currency":"العملة المحلية",
    "Country budget":"ميزانية الدولة",
    "(optional)":"(اختياري)",
    "＋ Add another country":"＋ إضافة دولة أخرى",
    "Add Country":"إضافة الدولة",
    "Trip dates will follow your country dates automatically.":"سيتم تحديد تواريخ الرحلة تلقائيًا حسب تواريخ الدول.",
    "Total trip budget":"إجمالي ميزانية الرحلة",
    "Travelers":"المسافرون",
    "Add the people whose spending you want to track.":"أضف الأشخاص الذين تريد متابعة مصروفاتهم.",
    "Your name":"اسمك",
    "(first traveler)":"(المسافر الأول)",
    "＋ Add traveler":"＋ إضافة مسافر",
    "Traveler name":"اسم المسافر",
    "Add Traveler":"إضافة المسافر",
    "Home currency":"العملة الأساسية",
    "Your total budget and reports use this currency.":"تُستخدم هذه العملة في الميزانية الإجمالية والتقارير.",
    "Create Trip":"إنشاء الرحلة",
    "Stay on budget and keep the day moving.":"تابع ميزانيتك وخطط يومك بسهولة.",
    "TRIP BUDGET LEFT":"المتبقي من ميزانية الرحلة",
    "BUDGET DETAILS":"تفاصيل الميزانية",
    "Plans & available balance":"الخطط والرصيد المتاح",
    "Reserved for plans":"محجوز للخطط",
    "Available after plans":"المتاح بعد الخطط",
    "Safe to spend today":"المتاح للإنفاق اليوم",
    "Based on your remaining trip budget.":"بناءً على الميزانية المتبقية للرحلة.",
    "Current country":"الدولة الحالية",
    "Trip dates":"تواريخ الرحلة",
    "Spent here":"المصروف هنا",
    "Country budget left":"المتبقي من ميزانية الدولة",
    "SPENT TODAY":"مصروف اليوم",
    "No spending yet today":"لا توجد مصروفات اليوم بعد",
    "TRIP PROGRESS":"تقدم الرحلة",
    "BUDGET HEALTH":"حالة الميزانية",
    "You're on track":"أنت ضمن الخطة",
    "Keep spending around your safe daily amount.":"حافظ على إنفاقك قريبًا من المبلغ اليومي الآمن.",
    "Next up":"التالي",
    "Upcoming plan":"الخطة القادمة",
    "Open Plan":"فتح الخطة",
    "Trip countries":"دول الرحلة",
    "Your country-by-country spending.":"مصروفاتك حسب كل دولة.",
    "See how everyone is doing.":"اطّلع على مصروفات الجميع.",
    "View all":"عرض الكل",
    "MONEY":"المال",
    "＋ Add expense":"＋ إضافة مصروف",
    "Load more":"عرض المزيد",
    "TRIP PLAN":"خطة الرحلة",
    "Itinerary":"برنامج الرحلة",
    "Flights, hotels, activities and transport in one place.":"الرحلات والفنادق والأنشطة والتنقل في مكان واحد.",
    "＋ Add item":"＋ إضافة عنصر",
    "Manage the countries in this trip and their budgets.":"إدارة دول الرحلة وميزانياتها.",
    "＋ Add country":"＋ إضافة دولة",
    "Upcoming costs":"التكاليف القادمة",
    "Hotels, activities, transport and other expected costs.":"الفنادق والأنشطة والتنقل والتكاليف المتوقعة الأخرى.",
    "＋ Add cost":"＋ إضافة تكلفة",
    "Add planned cost":"إضافة تكلفة مخططة",
    "What are you planning?":"ما الذي تخطط له؟",
    "Estimated cost":"التكلفة التقديرية",
    "Date":"التاريخ",
    "Category":"الفئة",
    "Note":"ملاحظة",
    "Add Planned Cost":"إضافة التكلفة المخططة",
    "YOUR TRIPS":"رحلاتك",
    "Trips & history":"الرحلات والسجل",
    "Done":"تم",
    "ACTIVE":"نشطة",
    "Finish Trip":"إنهاء الرحلة",
    "Trip Report":"تقرير الرحلة",
    "＋ Start New Trip":"＋ بدء رحلة جديدة",
    "Open any trip to see its expenses, analytics and settlements again.":"افتح أي رحلة لعرض مصروفاتها وتحليلاتها وتسوياتها مرة أخرى.",
    "TRIP":"الرحلة",
    "Primary destination":"الوجهة الرئيسية",
    "This is the first country in the trip. Add more countries below.":"هذه هي الدولة الأولى في الرحلة. يمكنك إضافة دول أخرى أدناه.",
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
    "Data & safety":"البيانات والأمان",
    "Export backup":"تصدير نسخة احتياطية",
    "Import backup":"استيراد نسخة احتياطية",
    "Switch trip":"تبديل الرحلة",
    "Itinerary item":"عنصر في برنامج الرحلة",
    "Title":"العنوان",
    "Type":"النوع",
    "Status":"الحالة",
    "Planned":"مخطط",
    "Booked":"محجوز",
    "Time":"الوقت",
    "Location":"الموقع",
    "Booking reference":"مرجع الحجز",
    "Amount":"المبلغ",
    "Currency":"العملة",
    "AUTO-FILLED":"معبأ تلقائيًا",
    "Shared with":"مشترك مع",
    "Everyone":"الجميع",
    "Clear":"مسح",
    "Receipt":"الإيصال",
    "📷 Add receipt":"📷 إضافة إيصال",
    "Receipt attached":"تم إرفاق الإيصال",
    "Saved locally":"محفوظ محليًا",
    "Remove":"إزالة",
    "More options":"خيارات إضافية",
    "Expense details":"تفاصيل المصروف",
    "Paid by":"دفع بواسطة",
    "Personal expense for":"مصروف شخصي لـ",
    "Use suggestion":"استخدام الاقتراح",
    "Payment":"الدفع",
    "Exchange rate":"سعر الصرف",
    "Enter the exchange rate.":"أدخل سعر الصرف.",
    "Use Latest Rate":"استخدام أحدث سعر",
    "Save Expense":"حفظ المصروف",
    "COUNTRY BUDGET":"ميزانية الدولة",
    "Set country budget":"تحديد ميزانية الدولة",
    "Budget in":"الميزانية بـ",
    "home currency":"العملة الأساسية",
    "Clear budget":"مسح الميزانية",
    "Save budget":"حفظ الميزانية",
    "Confirm change":"تأكيد التغيير",
    "Nothing changes until you tap Confirm.":"لن يتغير شيء حتى تضغط تأكيد.",
    "Undo":"تراجع",
    "TRIPSPEND AI":"مساعد TRIPSPEND",
    "Ask TripSpend":"اسأل TripSpend",
    "AI can answer questions and prepare adds/edits. Every change requires your confirmation. Receipt images, backups and past trips are not sent.":"يمكن للذكاء الاصطناعي الإجابة عن الأسئلة وتجهيز الإضافات والتعديلات. كل تغيير يحتاج إلى تأكيدك. لا يتم إرسال صور الإيصالات أو النسخ الاحتياطية أو الرحلات السابقة.",
    "Add 12 OMR dinner today":"أضف مصروف عشاء بقيمة 12 ر.ع اليوم",
    "What is my plan tomorrow?":"ما خطتي غدًا؟",
    "Where am I spending most?":"أين أنفق أكثر؟",
    "Change my trip budget to 900 OMR":"غيّر ميزانية رحلتي إلى 900 ر.ع",
    "Ask questions or prepare adds and edits. Every write requires confirmation.":"اسأل عن رحلتك أو جهّز إضافات وتعديلات. كل تغيير يحتاج إلى تأكيد.",
    "Free beta":"نسخة تجريبية مجانية"
  }).forEach(([key, value]) => AR.set(key, value));

  let lang = "en";
  try {
    lang = localStorage.getItem(KEY) === "ar" ? "ar" : "en";
  } catch {}

  const textOriginals = new WeakMap();
  const attrOriginals = new WeakMap();
  let observer = null;
  let scheduled = false;
  let busy = false;

  function rememberAttr(el, attr, value) {
    let map = attrOriginals.get(el);
    if (!map) {
      map = new Map();
      attrOriginals.set(el, map);
    }
    map.set(attr, value);
  }

  function readRememberedAttr(el, attr) {
    return attrOriginals.get(el)?.get(attr);
  }

  function forgetAttr(el, attr) {
    attrOriginals.get(el)?.delete(attr);
  }

  function translateTextNode(node) {
    if (node.nodeType !== 3 || !node.nodeValue?.trim()) return;

    const current = node.nodeValue;
    const currentKey = current.trim();
    let original = textOriginals.get(node);

    if (original !== undefined) {
      const key = original.trim();
      const translated = AR.has(key) ? original.replace(key, AR.get(key)) : original;

      // If TripSpend itself changed this node, stop treating the old value as its source.
      if (current !== original && current !== translated) {
        textOriginals.delete(node);
        original = undefined;
      }
    }

    if (original === undefined) {
      if (!AR.has(currentKey)) return;
      original = current;
      textOriginals.set(node, original);
    }

    const key = original.trim();
    if (!AR.has(key)) return;

    const desired = lang === "ar" ? original.replace(key, AR.get(key)) : original;
    if (node.nodeValue !== desired) node.nodeValue = desired;
  }

  function translateAttribute(el, attr) {
    if (!el.hasAttribute(attr)) return;

    const current = el.getAttribute(attr) || "";
    let original = readRememberedAttr(el, attr);

    if (original !== undefined) {
      const translated = AR.has(original) ? AR.get(original) : original;
      if (current !== original && current !== translated) {
        forgetAttr(el, attr);
        original = undefined;
      }
    }

    if (original === undefined) {
      if (!AR.has(current)) return;
      original = current;
      rememberAttr(el, attr, original);
    }

    const desired = lang === "ar" && AR.has(original) ? AR.get(original) : original;
    if (current !== desired) el.setAttribute(attr, desired);
  }

  function walk(el) {
    if (!(el instanceof Element)) return;

    ["placeholder", "aria-label", "title"].forEach(attr => translateAttribute(el, attr));
    el.childNodes.forEach(node => {
      if (node.nodeType === 3) translateTextNode(node);
      else if (node.nodeType === 1) walk(node);
    });
  }

  function observe() {
    if (!observer || !document.body || lang !== "ar") return;
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  function apply() {
    if (busy) return;
    busy = true;

    // Prevent our own translations from recursively triggering the observer.
    observer?.disconnect();

    try {
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
      document.body?.classList.toggle("lang-ar", lang === "ar");

      if (document.body) walk(document.body);

      const button = document.getElementById("languageToggle");
      if (button) {
        button.textContent = lang === "ar" ? "EN" : "عربي";
        button.setAttribute(
          "aria-label",
          lang === "ar" ? "Switch to English" : "التبديل إلى العربية"
        );
      }
    } finally {
      busy = false;
      observe();
    }

    window.dispatchEvent(new CustomEvent("tripspend:language", {
      detail: { language: lang }
    }));
  }

  function install() {
    if (document.getElementById("languageToggle")) return;
    const header = document.querySelector(".dashboard-welcome");
    if (!header) return;

    const button = document.createElement("button");
    button.id = "languageToggle";
    button.type = "button";
    button.className = "language-toggle";
    button.addEventListener("click", () => {
      lang = lang === "ar" ? "en" : "ar";
      try { localStorage.setItem(KEY, lang); } catch {}
      apply();
    });
    header.appendChild(button);
  }

  function queueApply() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      install();
      apply();
    });
  }

  window.TripSpendI18n = {
    language: () => lang,
    setLanguage(value) {
      lang = value === "ar" ? "ar" : "en";
      try { localStorage.setItem(KEY, lang); } catch {}
      apply();
    }
  };

  function startAfterTripSpendBoot() {
    const boot = document.getElementById("storageBoot");
    if (boot && !boot.classList.contains("hidden") && !boot.classList.contains("leaving")) {
      window.setTimeout(startAfterTripSpendBoot, 250);
      return;
    }

    install();
    observer = new MutationObserver(() => {
      if (!busy && lang === "ar") queueApply();
    });
    apply();
  }

  addEventListener("DOMContentLoaded", startAfterTripSpendBoot);
})();
