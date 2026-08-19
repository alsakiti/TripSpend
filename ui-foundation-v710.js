(() => {
  "use strict";

  const $ = id => document.getElementById(id);
  const arabic = () => window.TripSpendLocale?.language?.() === "ar";
  const text = (en, ar) => arabic() ? ar : en;
  let dialogResolve = null;
  let dialogMode = "confirm";
  let dialogReturnFocus = null;
  let routeStopId = "";
  let activeModal = null;
  const modalReturnFocus = new WeakMap();

  function localizedLabel(value) {
    if (!arabic()) return value;
    return new Map([
      ["Start new trip","بدء رحلة جديدة"],["Open trip","فتح الرحلة"],["Delete","حذف"],["Remove","إزالة"],
      ["Restore","استعادة"],["Archive","أرشفة"],["Edit traveler","تعديل المسافر"],["Traveler name","اسم المسافر"],
      ["Save","حفظ"],["Import","استيراد"],["Clear","مسح"],["Delete trip","حذف الرحلة"]
    ]).get(value) || value;
  }

  function localizedMessage(message) {
    const value = String(message || "");
    if (!arabic()) return value;
    const exact = new Map([
      ["Remove this receipt from the expense?", "هل تريد إزالة هذا الإيصال من المصروف؟"],
      ["Existing expenses and traveler shares will not be recalculated into the new home currency. Continue?", "لن تتم إعادة احتساب المصروفات الحالية وحصص المسافرين بالعملة الأساسية الجديدة. هل تريد المتابعة؟"],
      ["Clear all remembered exchange rates?", "هل تريد مسح جميع أسعار الصرف المحفوظة؟"],
      ["TripSpend could not finish the trip safely.", "تعذّر على TripSpend إنهاء الرحلة بأمان."],
      ["TripSpend could not restore that snapshot safely.", "تعذّر على TripSpend استعادة نقطة الحفظ بأمان."],
      ["TripSpend could not create the portable backup.", "تعذّر على TripSpend إنشاء النسخة الاحتياطية."],
      ["That file is not a valid TripSpend backup.", "هذا الملف ليس نسخة احتياطية صالحة لـ TripSpend."],
      ["TripSpend could not delete the trip safely.", "تعذّر على TripSpend حذف الرحلة بأمان."]
    ]);
    if (exact.has(value)) return exact.get(value);

    const rules = [
      [/^Archive “(.+)” and start a new trip\? You can reopen it anytime from Past Trips\.$/, "هل تريد أرشفة «$1» وبدء رحلة جديدة؟ يمكنك فتحها لاحقًا من الرحلات السابقة."],
      [/^Open “(.+)”\? Your current trip will move to Past Trips\.$/, "هل تريد فتح «$1»؟ سيتم نقل رحلتك الحالية إلى الرحلات السابقة."],
      [/^Delete “(.+)” from Past Trips\? This cannot be undone from Trip History\.$/, "هل تريد حذف «$1» من الرحلات السابقة؟ لا يمكن التراجع عن ذلك من سجل الرحلات."],
      [/^Delete (.+) from this trip\?$/, "هل تريد حذف $1 من هذه الرحلة؟"],
      [/^Delete “(.+)” and all expenses\?$/, "هل تريد حذف «$1» وجميع مصروفاتها؟"],
      [/^Delete “(.+)” from your itinerary\?$/, "هل تريد حذف «$1» من برنامج الرحلة؟"],
      [/^Delete planned cost “(.+)”\?$/, "هل تريد حذف التكلفة المخططة «$1»؟"],
      [/^Delete (.+)\?$/, "هل تريد حذف $1؟"],
      [/^Remove (.+) from this trip\?$/, "هل تريد إزالة $1 من هذه الرحلة؟"],
      [/^Archive (.+)\? You will have no active travelers until you restore or add someone\. Historical totals will stay intact\.$/, "هل تريد أرشفة $1؟ لن يبقى أي مسافر نشط حتى تستعيد أو تضيف مسافرًا، وستبقى البيانات السابقة محفوظة."],
      [/^Archive (.+)\? Historical spending will stay intact, but they will no longer appear when adding new expenses\.$/, "هل تريد أرشفة $1؟ ستبقى المصروفات السابقة محفوظة، ولن يظهر المسافر عند إضافة مصروف جديد."],
      [/^This backup contains (.+) of receipt photos, which is too large to package safely on iPhone\. Remove unnecessary receipts or export from a device with more memory\.$/, "تحتوي النسخة الاحتياطية على $1 من صور الإيصالات، وهو حجم كبير جدًا على iPhone. احذف الصور غير الضرورية أو صدّرها من جهاز ذي ذاكرة أكبر."],
      [/^This backup includes (.+) of receipt photos and may take longer to create\. Continue\?$/, "تتضمن النسخة الاحتياطية $1 من صور الإيصالات وقد يستغرق إنشاؤها وقتًا أطول. هل تريد المتابعة؟"],
      [/^This backup is (.+) and is too large to import safely on this device\.$/, "حجم النسخة الاحتياطية $1، وهو كبير جدًا للاستيراد بأمان على هذا الجهاز."],
      [/^Import this backup\?\n\n([\s\S]+)\n\nIt will replace the current TripSpend data in this browser\.$/, "هل تريد استيراد هذه النسخة الاحتياطية؟\n\n$1\n\nستستبدل بيانات TripSpend الحالية على هذا الجهاز."],
      [/^Restore “(.+)”\?\n\n([\s\S]+)\n\nYour current data will be kept as a safety snapshot first\.$/, "هل تريد استعادة «$1»؟\n\n$2\n\nسيتم حفظ بياناتك الحالية أولًا كنقطة أمان."],
      [/^This restore point failed validation and was not restored\.\n\n([\s\S]+)$/, "فشل التحقق من نقطة الاستعادة ولم تتم استعادتها.\n\n$1"],
      [/^This backup failed validation and was not imported\.\n\n([\s\S]+)$/, "فشل التحقق من النسخة الاحتياطية ولم يتم استيرادها.\n\n$1"]
    ];
    for (const [pattern, replacement] of rules) if (pattern.test(value)) return value.replace(pattern, replacement);
    return value;
  }

  function closeDialog(value) {
    const modal = $("appDialogModal");
    modal?.classList.add("hidden");
    document.body.classList.remove("modal-open");
    const resolve = dialogResolve;
    dialogResolve = null;
    if (dialogReturnFocus?.isConnected) dialogReturnFocus.focus({ preventScroll:true });
    dialogReturnFocus = null;
    resolve?.(value);
  }

  function openDialog(mode, message, options = {}) {
    if (dialogResolve) closeDialog(mode === "prompt" ? null : false);
    dialogMode = mode;
    dialogReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const modal = $("appDialogModal");
    const sheet = modal?.querySelector(".app-dialog-sheet");
    if (!modal || !sheet) return Promise.resolve(mode === "alert" ? true : mode === "prompt" ? null : false);

    const danger = !!options.danger;
    sheet.classList.toggle("is-alert", mode === "alert");
    sheet.classList.toggle("is-danger", danger);
    $("appDialogIcon").textContent = danger ? "!" : mode === "alert" ? "i" : mode === "prompt" ? "✎" : "?";
    $("appDialogTitle").textContent = options.title ? localizedLabel(options.title) : (mode === "alert"
      ? text("Something needs attention", "تنبيه")
      : mode === "prompt" ? text("Enter details", "أدخل البيانات")
      : danger ? text("Confirm deletion", "تأكيد الحذف") : text("Confirm action", "تأكيد الإجراء"));
    $("appDialogMessage").textContent = localizedMessage(message);
    $("appDialogCancel").textContent = options.cancelText ? localizedLabel(options.cancelText) : text("Cancel", "إلغاء");
    $("appDialogConfirm").textContent = options.confirmText ? localizedLabel(options.confirmText) : (mode === "alert" ? text("OK", "حسنًا") : text("Continue", "متابعة"));
    const inputWrap = $("appDialogInputWrap");
    const input = $("appDialogInput");
    inputWrap?.classList.toggle("hidden", mode !== "prompt");
    if (mode === "prompt" && input) {
      $("appDialogInputLabel").textContent = options.inputLabel ? localizedLabel(options.inputLabel) : text("Name", "الاسم");
      input.value = String(options.defaultValue || "");
    }
    modal.classList.remove("hidden");
    document.body.classList.add("modal-open");
    requestAnimationFrame(() => (mode === "prompt" ? input : $("appDialogConfirm"))?.focus());
    return new Promise(resolve => { dialogResolve = resolve; });
  }

  window.TripSpendDialog = {
    confirm: (message, options) => openDialog("confirm", message, options),
    alert: (message, options) => openDialog("alert", message, options),
    prompt: (message, defaultValue = "", options = {}) => openDialog("prompt", message, { ...options, defaultValue })
  };

  $("appDialogCancel")?.addEventListener("click", () => closeDialog(dialogMode === "prompt" ? null : false));
  $("appDialogConfirm")?.addEventListener("click", () => {
    const value = dialogMode === "prompt" ? $("appDialogInput")?.value ?? "" : true;
    closeDialog(value);
  });
  $("appDialogInput")?.addEventListener("keydown", event => {
    if (event.key === "Enter") { event.preventDefault(); $("appDialogConfirm")?.click(); }
  });

  function stopSpent(state, stopId) {
    return (state.expenses || []).filter(expense => expense.stopId === stopId).reduce((sum, expense) => sum + Number(expense.homeAmount || 0), 0);
  }

  function closeRouteInfo() {
    $("routeCountryModal")?.classList.add("hidden");
    document.body.classList.remove("modal-open");
    const flag = document.querySelector(`.trip-flag[data-stop-id="${CSS.escape(routeStopId)}"]`);
    routeStopId = "";
    flag?.focus({ preventScroll:true });
  }

  function openRouteInfo(stopId) {
    const core = window.TripSpendCore;
    const state = core?.getState?.();
    const stop = (state?.stops || []).find(item => item.id === stopId);
    if (!stop || !state?.trip) return;
    routeStopId = stop.id;
    const spent = stopSpent(state, stop.id);
    const budget = Number(stop.budget || 0);
    const remaining = budget - spent;
    $("routeCountryKicker").textContent = text("ROUTE COUNTRY", "دولة في المسار");
    const countryName = window.TripSpendLocale?.country?.(stop.country) || stop.country;
    $("routeCountryTitle").textContent = `${core.countryFlag(stop.country)} ${countryName}`;
    $("routeCountryDates").textContent = `${core.fmtDateWithYear(stop.startDate)} – ${core.fmtDateWithYear(stop.endDate)} • ${stop.currency}`;
    $("routeCountryBudgetLabel").textContent = text("Budget", "الميزانية");
    $("routeCountrySpentLabel").textContent = text("Spent", "المصروف");
    $("routeCountryRemainingLabel").textContent = remaining < 0 ? text("Over budget", "تجاوز الميزانية") : text("Remaining", "المتبقي");
    $("routeCountryBudget").textContent = budget > 0 ? core.money(budget, state.trip.homeCurrency) : text("Not set", "غير محددة");
    $("routeCountrySpent").textContent = core.money(spent, state.trip.homeCurrency);
    $("routeCountryRemaining").textContent = budget > 0 ? core.money(Math.abs(remaining), state.trip.homeCurrency) : "—";
    $("routeCountryEditBudget").textContent = text("Edit country budget", "تعديل ميزانية الدولة");
    $("closeRouteCountry").setAttribute("aria-label", text("Close country details", "إغلاق تفاصيل الدولة"));
    $("routeCountryModal").classList.remove("hidden");
    document.body.classList.add("modal-open");
    requestAnimationFrame(() => $("closeRouteCountry")?.focus());
  }

  window.TripSpendRouteInfo = { open:openRouteInfo, close:closeRouteInfo };
  $("closeRouteCountry")?.addEventListener("click", closeRouteInfo);
  $("routeCountryModal")?.addEventListener("click", event => { if (event.target === $("routeCountryModal")) closeRouteInfo(); });
  $("routeCountryEditBudget")?.addEventListener("click", () => {
    const stopId = routeStopId;
    closeRouteInfo();
    window.TripSpendV5?.openCountryBudget?.(stopId);
  });

  function focusable(modal) {
    return [...modal.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])')]
      .filter(node => !node.closest(".hidden") && node.getClientRects().length);
  }

  function syncVisibleModal() {
    const next = [...document.querySelectorAll(".modal:not(.hidden)")].at(-1) || null;
    if (next === activeModal) return;
    if (activeModal && !next) {
      modalReturnFocus.get(activeModal)?.focus?.({ preventScroll:true });
      activeModal = null;
      return;
    }
    activeModal = next;
    if (next) {
      modalReturnFocus.set(next, document.activeElement);
      requestAnimationFrame(() => focusable(next)[0]?.focus({ preventScroll:true }));
    }
  }

  const modalObserver = new MutationObserver(syncVisibleModal);
  document.querySelectorAll(".modal").forEach(modal => modalObserver.observe(modal, { attributes:true, attributeFilter:["class"] }));
  document.addEventListener("keydown", event => {
    const modal = [...document.querySelectorAll(".modal:not(.hidden)")].at(-1);
    if (!modal) return;
    if (event.key === "Escape") {
      event.preventDefault();
      if (modal === $("appDialogModal")) return closeDialog(dialogMode === "prompt" ? null : false);
      if (modal === $("routeCountryModal")) return closeRouteInfo();
      modal.querySelector('[aria-label^="Close"],#closeModal,#closeFinishTrip,#closeTripSwitcher,#closeExpenseDetail,#closeReceiptViewer,#closeCountryBudgetEditor')?.click();
      return;
    }
    if (event.key !== "Tab") return;
    const nodes = focusable(modal);
    if (!nodes.length) return;
    const first = nodes[0], last = nodes.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });

  window.addEventListener("tripspend:language", () => {
    if (!$("routeCountryModal")?.classList.contains("hidden") && routeStopId) openRouteInfo(routeStopId);
  });

  syncVisibleModal();
})();
