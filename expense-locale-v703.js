(() => {
  "use strict";

  const RELEASE = "7.0.3";
  const originals = new WeakMap();
  let observer = null;
  let busy = false;
  let queued = false;

  const EXTRA = new Map(Object.entries({
    "TRANSACTION":"عملية",
    "Add Expense":"إضافة مصروف",
    "Rate ready ✓":"سعر الصرف جاهز ✓",
    "Current country":"الدولة الحالية",
    "Expense type":"نوع المصروف",
    "For one traveler":"لمسافر واحد",
    "Split with others":"تقسيم مع الآخرين",
    "Counts toward trip and country budgets. If the same traveler pays for themselves, it creates no debt.":"يُحتسب ضمن ميزانية الرحلة والدولة. إذا دفع المسافر عن نفسه فلن ينشأ أي دين.",
    "Choose everyone who shared this expense. TripSpend divides the cost equally between them.":"اختر جميع من شاركوا في هذا المصروف. يقسم TripSpend التكلفة بينهم بالتساوي.",
    "AUTO-FILLED":"معبأ تلقائيًا",
    "Personal • payer and country selected automatically":"شخصي • تم اختيار الدافع والدولة تلقائيًا",
    "No payer (exclude settlement)":"بدون دافع (لا يدخل في التسوية)",
    "Select who shared this expense to see the split.":"اختر من شارك في هذا المصروف لعرض التقسيم.",
    "Select the travelers who shared this expense. TripSpend divides it equally.":"اختر المسافرين الذين شاركوا في هذا المصروف. يقسمه TripSpend بينهم بالتساوي.",
    "Optional photo stored locally with this expense.":"صورة اختيارية تُحفظ محليًا مع هذا المصروف.",
    "Receipt scan":"مسح الإيصال",
    "Scan receipt":"مسح الإيصال",
    "Scanning receipt…":"جارٍ مسح الإيصال…",
    "Scanning receipt...":"جارٍ مسح الإيصال…",
    "Personal expense for":"المصروف الشخصي لـ",
    "Shared with":"مشترك مع"
  }));

  function language() {
    return window.TripSpendLocale?.language?.() || window.TripSpendI18n?.language?.() || document.documentElement.lang || "en";
  }

  function isArabic() { return language() === "ar"; }

  function replacePersonWords(value) {
    return String(value)
      .replace(/\bMe\b/g, "أنا")
      .replace(/\bEveryone\b/g, "الجميع");
  }

  function translateCompound(text) {
    const raw = String(text ?? "");
    const trimmed = raw.trim();
    if (!trimmed) return raw;

    if (EXTRA.has(trimmed)) return raw.replace(trimmed, EXTRA.get(trimmed));

    let match = trimmed.match(/^(\d+)\s+travelers? selected\s*•\s*enter the amount to preview each share\.?$/i);
    if (match) return raw.replace(trimmed, `تم اختيار ${match[1]} مسافرين • أدخل المبلغ لمعاينة حصة كل شخص.`);

    match = trimmed.match(/^Each share:\s*(.+)$/i);
    if (match) return raw.replace(trimmed, `حصة كل شخص: ${match[1]}`);

    match = trimmed.match(/^(.+?)\s+paid\s*•\s*shared with\s+(.+)$/i);
    if (match) {
      const payer = replacePersonWords(match[1]);
      const shared = replacePersonWords(match[2]);
      return raw.replace(trimmed, `دفع ${payer} • مشترك مع ${shared}`);
    }

    const locale = window.TripSpendLocale;
    let translated = locale?.t ? locale.t(trimmed) : trimmed;

    translated = translated
      .replace(/\bCredit Card\b/g, "بطاقة ائتمان")
      .replace(/\bDebit Card\b/g, "بطاقة خصم")
      .replace(/\bCash\b/g, "نقدًا")
      .replace(/\bFor one traveler\b/g, "لمسافر واحد")
      .replace(/\bSplit with others\b/g, "تقسيم مع الآخرين")
      .replace(/\bMe paid\b/g, "دفعت أنا")
      .replace(/\bshared with\s+(.+)$/i, (_, people) => `مشترك مع ${replacePersonWords(people)}`);

    return raw.replace(trimmed, translated);
  }

  function applyTextNode(node) {
    if (!node || node.nodeType !== Node.TEXT_NODE) return;
    const current = node.nodeValue || "";
    if (!current.trim()) return;

    if (isArabic()) {
      const next = translateCompound(current);
      if (next !== current) {
        originals.set(node, current);
        node.nodeValue = next;
      }
      return;
    }

    const original = originals.get(node);
    if (original != null && node.nodeValue !== original) node.nodeValue = original;
  }

  function apply() {
    const root = document.getElementById("modal");
    if (!root || busy) return;
    busy = true;
    try {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) applyTextNode(node);

      if (isArabic()) root.setAttribute("dir", "rtl");
      else root.removeAttribute("dir");
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
    apply();
    const root = document.getElementById("modal") || document.body;
    observer = new MutationObserver(() => { if (!busy) queueApply(); });
    observer.observe(root, { childList:true, subtree:true, characterData:true });
    window.addEventListener("tripspend:language", queueApply);
    document.addEventListener("input", event => {
      if (event.target?.closest?.("#modal")) queueApply();
    }, true);
    document.addEventListener("change", event => {
      if (event.target?.closest?.("#modal")) queueApply();
    }, true);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once:true });
  else start();

  window.TripSpendExpenseLocale = { release:RELEASE, apply };
})();
