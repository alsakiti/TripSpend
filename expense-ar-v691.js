(() => {
  "use strict";

  const ARABIC_RE = /[\u0600-\u06FF]/;
  const originals = new WeakMap();
  let observer = null;
  let queued = false;
  let busy = false;

  const EXACT = new Map(Object.entries({
    "HISTORY": "السجل",
    "History": "السجل",
    "Filters": "التصفية",
    "Add +": "إضافة +",
    "Add": "إضافة",
    "Dinner": "عشاء",
    "Lunch": "غداء",
    "Breakfast": "فطور",
    "Coffee": "قهوة",
    "Taxi": "سيارة أجرة",
    "Transport": "النقل",
    "Hotel": "الفندق",
    "Shopping": "التسوق",
    "Groceries": "البقالة",
    "Flight": "رحلة جوية",
    "Flights": "الرحلات الجوية",
    "Restaurant": "مطعم",
    "Activity": "نشاط",
    "Activities": "الأنشطة",
    "Food": "الطعام",
    "Shared": "مشترك",
    "Personal": "شخصي"
  }));

  const WORDS = [
    [/\bFood\b/g, "الطعام"],
    [/\bTransport\b/g, "النقل"],
    [/\bHotel\b/g, "الفندق"],
    [/\bShopping\b/g, "التسوق"],
    [/\bActivities\b/g, "الأنشطة"],
    [/\bFlights\b/g, "الرحلات الجوية"],
    [/\bCoffee\b/g, "القهوة"],
    [/\bGroceries\b/g, "البقالة"],
    [/\bShared\b/g, "مشترك"],
    [/\bPersonal\b/g, "شخصي"],
    [/\bSun\b/g, "الأحد"],
    [/\bMon\b/g, "الاثنين"],
    [/\bTue\b/g, "الثلاثاء"],
    [/\bWed\b/g, "الأربعاء"],
    [/\bThu\b/g, "الخميس"],
    [/\bFri\b/g, "الجمعة"],
    [/\bSat\b/g, "السبت"],
    [/\bJan\b/g, "يناير"],
    [/\bFeb\b/g, "فبراير"],
    [/\bMar\b/g, "مارس"],
    [/\bApr\b/g, "أبريل"],
    [/\bMay\b/g, "مايو"],
    [/\bJun\b/g, "يونيو"],
    [/\bJul\b/g, "يوليو"],
    [/\bAug\b/g, "أغسطس"],
    [/\bSep\b/g, "سبتمبر"],
    [/\bOct\b/g, "أكتوبر"],
    [/\bNov\b/g, "نوفمبر"],
    [/\bDec\b/g, "ديسمبر"]
  ];

  const PLACEHOLDERS = new Map(Object.entries({
    "Search note, category, country, payer…": "ابحث بالملاحظة أو الفئة أو الدولة أو الدافع…",
    "Search note, category, country, payer...": "ابحث بالملاحظة أو الفئة أو الدولة أو الدافع…",
    "Search expenses": "ابحث في المصروفات"
  }));

  function isArabic() {
    return window.TripSpendI18n?.language?.() === "ar" || document.body?.classList.contains("lang-ar");
  }

  function translateCompound(value) {
    const raw = String(value || "");
    const trimmed = raw.trim();
    if (!trimmed) return raw;

    if (EXACT.has(trimmed)) return raw.replace(trimmed, EXACT.get(trimmed));

    let out = raw;
    out = out.replace(/\bPaid by Me\b/gi, "الدافع: أنا");
    out = out.replace(/\bPaid by\s+([^•·]+?)(?=\s*[•·]|$)/gi, (_m, name) => `الدافع: ${name.trim()}`);
    out = out.replace(/\bFor Me\b/gi, "لي");
    out = out.replace(/\bFor\s+([^•·]+?)(?=\s*[•·]|$)/gi, (_m, name) => `لـ ${name.trim()}`);
    out = out.replace(/\bMe\s*&\s*/gi, "أنا و ");
    out = out.replace(/\b(\d+)\s+expenses\b/gi, "$1 مصروفات");

    for (const [re, ar] of WORDS) out = out.replace(re, ar);
    return out;
  }

  function translateNode(node) {
    if (node.nodeType !== Node.TEXT_NODE || !node.nodeValue?.trim()) return;
    const parent = node.parentElement;
    if (!parent || parent.closest("script,style,noscript")) return;

    const current = node.nodeValue;
    if (!isArabic()) {
      const original = originals.get(node);
      if (original !== undefined) {
        if (!/[A-Za-z]/.test(current) || ARABIC_RE.test(current)) node.nodeValue = original;
        originals.delete(node);
      }
      return;
    }

    const translated = translateCompound(current);
    if (translated !== current) {
      if (!originals.has(node)) originals.set(node, current);
      node.nodeValue = translated;
      parent.classList.add("ts-ar-text");
    }
  }

  function translateAttrs(el) {
    if (!(el instanceof Element) || !isArabic()) return;
    for (const attr of ["placeholder", "aria-label", "title"]) {
      if (!el.hasAttribute(attr)) continue;
      const current = el.getAttribute(attr) || "";
      const translated = PLACEHOLDERS.get(current) || translateCompound(current);
      if (translated !== current) el.setAttribute(attr, translated);
    }
  }

  function walk(root) {
    if (!(root instanceof Element)) return;
    translateAttrs(root);
    root.childNodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) translateNode(node);
      else if (node.nodeType === Node.ELEMENT_NODE) walk(node);
    });
  }

  function apply() {
    if (busy || !document.body) return;
    busy = true;
    observer?.disconnect();
    try {
      const expenses = document.getElementById("expensesPage") || document.getElementById("expenses") || document.body;
      walk(expenses);
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
      attributeFilter: ["placeholder", "aria-label", "title"]
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
