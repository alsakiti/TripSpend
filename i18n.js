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
    if (!observer || !document.body) return;
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

  addEventListener("DOMContentLoaded", () => {
    install();
    observer = new MutationObserver(queueApply);
    apply();
  });
})();
