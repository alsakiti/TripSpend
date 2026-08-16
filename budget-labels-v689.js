(() => {
  "use strict";

  let observer = null;
  let queued = false;
  let applying = false;

  function currentLanguage() {
    return window.TripSpendI18n?.language?.() === "ar" ? "ar" : "en";
  }

  function setLabelDirection(el, lang) {
    if (!el) return;
    if (lang === "ar") {
      el.setAttribute("dir", "rtl");
      el.style.letterSpacing = "0";
      el.style.textTransform = "none";
      el.style.unicodeBidi = "plaintext";
    } else {
      el.removeAttribute("dir");
      el.style.letterSpacing = "";
      el.style.textTransform = "";
      el.style.unicodeBidi = "";
    }
  }

  function applyBudgetLabels() {
    if (applying) return;
    applying = true;
    try {
      const lang = currentLanguage();

      const safeLabel = document.querySelector(".today-metric-label");
      if (safeLabel) {
        let textNode = [...safeLabel.childNodes].find(node => node.nodeType === Node.TEXT_NODE);
        if (!textNode) {
          textNode = document.createTextNode("");
          safeLabel.insertBefore(textNode, safeLabel.firstChild);
        }
        const desired = lang === "ar" ? "المتاح اليوم ☀️ " : "☀️ Safe today ";
        if (textNode.nodeValue !== desired) textNode.nodeValue = desired;
        setLabelDirection(safeLabel, lang);

        const info = safeLabel.querySelector("#safeTodayInfo");
        if (info) {
          info.setAttribute(
            "aria-label",
            lang === "ar" ? "كيفية حساب المتاح اليوم" : "How Safe today is calculated"
          );
        }
      }

      const spentValue = document.getElementById("spentToday");
      const spentLabel = spentValue?.previousElementSibling;
      if (spentLabel?.tagName === "SMALL") {
        const desired = lang === "ar" ? "مصروف اليوم 🧾" : "🧾 Spent today";
        if (spentLabel.textContent !== desired) spentLabel.textContent = desired;
        setLabelDirection(spentLabel, lang);
      }

      const explanation = document.getElementById("safeTodayExplanation");
      if (explanation) {
        const desired = lang === "ar"
          ? "رصيدك بعد التكاليف المخططة القادمة، مقسومًا على الأيام المتبقية في الرحلة."
          : "Your balance after upcoming planned costs, divided across the days left in your trip.";
        if (explanation.textContent !== desired) explanation.textContent = desired;
        setLabelDirection(explanation, lang);
      }
    } finally {
      applying = false;
    }
  }

  function queueApply() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      applyBudgetLabels();
    });
  }

  function start() {
    applyBudgetLabels();
    window.addEventListener("tripspend:language", queueApply);

    const dashboard = document.getElementById("dashboard") || document.body;
    observer = new MutationObserver(() => {
      if (!applying) queueApply();
    });
    observer.observe(dashboard, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
