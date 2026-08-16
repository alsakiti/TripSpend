(() => {
  "use strict";

  const ENDPOINT_FALLBACK = "https://tripspend-ai.alsukaiti1998.workers.dev";
  const PROVIDER = { key: "cloudflare", label: "Cloudflare AI", short: "Llama 3.3 70B" };
  const MAX_HISTORY = 8;
  const SUPPORTED_ACTIONS = new Set([
    "add_expense", "edit_expense",
    "add_itinerary", "edit_itinerary",
    "add_plan", "edit_plan",
    "set_trip_budget", "set_country_budget"
  ]);
  const ITINERARY_TYPES = new Set(["Flight", "Hotel", "Activity", "Restaurant", "Transport", "Note"]);
  const CATEGORY_NAMES = new Set(["Food", "Transport", "Hotel", "Shopping", "Activities", "Flights", "Coffee", "Groceries", "Other"]);
  const PAYMENT_NAMES = new Set(["Cash", "Credit Card", "Debit Card", "Apple Pay", "Other"]);
  const ITINERARY_CATEGORY = {
    Flight: "Flights",
    Hotel: "Hotel",
    Activity: "Activities",
    Restaurant: "Food",
    Transport: "Transport",
    Note: "Other"
  };

  const $ = id => document.getElementById(id);
  const core = window.TripSpendCore;

  let endpoint = ENDPOINT_FALLBACK;
  let chatHistory = [];
  let requestController = null;
  let workerActionsReady = false;
  let pendingAction = null;

  function cleanText(value, max = 240) {
    return String(value || "").trim().slice(0, max);
  }

  function localDateString(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function state() {
    return core?.getState?.();
  }

  function personName(appState, id) {
    return appState.people?.find(person => person.id === id)?.name || "Unknown";
  }

  function stopName(appState, id) {
    return appState.stops?.find(stop => stop.id === id)?.country || appState.trip?.destination || "Unknown";
  }

  function stopForDate(appState, date) {
    const rows = Array.isArray(appState?.stops) ? appState.stops : [];
    if (!date) return rows[0] || null;
    return rows.find(stop => stop.startDate <= date && stop.endDate >= date) ||
      rows.find(stop => stop.startDate >= date) || rows.at(-1) || null;
  }

  function personByRef(appState, id, name) {
    const rows = (appState.people || []).filter(person => person.active !== false);
    if (id) {
      const exact = rows.find(person => person.id === id);
      if (exact) return exact;
    }
    const needle = cleanText(name, 60).toLowerCase();
    if (needle) {
      const exact = rows.find(person => person.name.trim().toLowerCase() === needle);
      if (exact) return exact;
    }
    return rows[0] || null;
  }

  function stopByRef(appState, id, country, date) {
    const rows = Array.isArray(appState.stops) ? appState.stops : [];
    if (id) {
      const exact = rows.find(stop => stop.id === id);
      if (exact) return exact;
    }
    const needle = cleanText(country, 80).toLowerCase();
    if (needle) {
      const exact = rows.find(stop => stop.country.trim().toLowerCase() === needle);
      if (exact) return exact;
    }
    return stopForDate(appState, date);
  }

  function clampTripDate(appState, date) {
    const trip = appState?.trip;
    const value = /^\d{4}-\d{2}-\d{2}$/.test(String(date || "")) ? String(date) : localDateString();
    if (!trip?.startDate || !trip?.endDate) return value;
    if (value < trip.startDate) return trip.startDate;
    if (value > trip.endDate) return trip.endDate;
    return value;
  }

  async function loadConfig() {
    try {
      const response = await fetch(`./ai-config.json?t=${Date.now()}`, { cache: "no-store" });
      if (response.ok) {
        const config = await response.json();
        const next = String(config?.endpoint || "").trim();
        if (next.startsWith("https://")) endpoint = next.replace(/\/$/, "");
      }
    } catch {}
    await checkWorkerCapabilities();
    updateServiceStatus();
  }

  async function checkWorkerCapabilities() {
    workerActionsReady = false;
    if (!endpoint) return;
    try {
      const response = await fetch(endpoint, { method: "GET", cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json();
      workerActionsReady = data?.actions === true;
    } catch {}
  }

  function buildTripContext() {
    const appState = state();
    if (!appState?.trip) return { today: localDateString(), trip: null };

    const trip = appState.trip;
    const people = Array.isArray(appState.people) ? appState.people : [];
    const stops = Array.isArray(appState.stops) ? appState.stops : [];
    const expenses = Array.isArray(appState.expenses) ? appState.expenses : [];
    const plans = Array.isArray(appState.plans) ? appState.plans : [];
    const itinerary = Array.isArray(appState.itinerary) ? appState.itinerary : [];
    const settlements = Array.isArray(appState.settlements) ? appState.settlements : [];

    return {
      today: localDateString(),
      trip: {
        id: trip.id || "",
        name: cleanText(trip.name, 80),
        destination: cleanText(trip.destination, 80),
        startDate: trip.startDate || "",
        endDate: trip.endDate || "",
        budget: Number(trip.budget || 0),
        homeCurrency: trip.homeCurrency || "",
        tripCurrency: trip.tripCurrency || "",
        defaultPayment: trip.defaultPayment || "Credit Card"
      },
      dashboard: {
        budgetLeft: $("remainingValue")?.textContent || "",
        currency: $("remainingCode")?.textContent || trip.homeCurrency || "",
        safeToday: $("safeToday")?.textContent || "",
        spentToday: $("spentToday")?.textContent || "",
        currentCountry: $("currentCountryName")?.textContent || "",
        health: $("healthTitle")?.textContent || ""
      },
      countries: stops.map(stop => ({
        id: stop.id,
        country: cleanText(stop.country, 80),
        startDate: stop.startDate || "",
        endDate: stop.endDate || "",
        currency: stop.currency || "",
        budget: Number(stop.budget || 0)
      })),
      travelers: people.filter(person => person?.active !== false).map(person => ({
        id: person.id,
        name: cleanText(person.name, 60)
      })),
      expenses: expenses.slice(-250).map(expense => ({
        id: expense.id,
        date: expense.date || "",
        stopId: expense.stopId || "",
        country: stopName(appState, expense.stopId),
        category: cleanText(expense.category, 60),
        expenseType: expense.expenseType || "",
        amount: Number(expense.amount || 0),
        currency: expense.currency || "",
        homeAmount: Number(expense.homeAmount || 0),
        paymentMethod: cleanText(expense.paymentMethod, 60),
        paidByPersonId: expense.paidByPersonId || "",
        paidBy: personName(appState, expense.paidByPersonId),
        sharedWithPersonIds: (expense.personShares || []).map(share => share.personId),
        note: cleanText(expense.note, 140)
      })),
      upcomingCosts: plans.slice(-150).map(plan => ({
        id: plan.id,
        title: cleanText(plan.title, 100),
        date: plan.date || "",
        stopId: plan.stopId || "",
        country: stopName(appState, plan.stopId),
        category: cleanText(plan.category, 60),
        amount: Number(plan.homeAmount || 0),
        status: plan.status || "",
        note: cleanText(plan.note, 140)
      })),
      itinerary: itinerary.slice(-150).map(item => ({
        id: item.id,
        title: cleanText(item.title, 100),
        type: cleanText(item.type, 40),
        date: item.date || "",
        time: item.time || "",
        stopId: item.stopId || "",
        country: stopName(appState, item.stopId),
        location: cleanText(item.location, 140),
        bookingRef: cleanText(item.bookingRef, 100),
        status: item.status || "",
        estimatedCost: Number(item.homeAmount || 0),
        note: cleanText(item.note, 220)
      })),
      settlements: settlements.slice(-120).map(item => ({
        from: personName(appState, item.fromPersonId),
        to: personName(appState, item.toPersonId),
        amount: Number(item.amount || 0),
        date: item.date || "",
        note: cleanText(item.note, 120)
      })),
      privacy: {
        receiptsIncluded: false,
        pastTripsIncluded: false,
        backupsIncluded: false
      }
    };
  }

  function injectStyles() {
    if ($("tripAiStyles")) return;
    const style = document.createElement("style");
    style.id = "tripAiStyles";
    style.textContent = `
      .dashboard-welcome-mark.trip-ai-ready{cursor:pointer;border:0;font:inherit;transition:transform .16s ease,box-shadow .16s ease}
      .dashboard-welcome-mark.trip-ai-ready:active{transform:scale(.95)}
      .dashboard-welcome-mark.trip-ai-ready:focus-visible{outline:3px solid rgba(22,119,255,.28);outline-offset:3px}
      .trip-ai-settings-card{padding:16px;margin-top:12px}.trip-ai-settings-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
      .trip-ai-settings-head p{margin:4px 0 0;color:var(--muted);font-size:12px;line-height:1.45}.trip-ai-status{display:inline-flex;padding:6px 9px;border-radius:999px;background:var(--surface2);color:var(--muted);font-size:10px;font-weight:850;white-space:nowrap}.trip-ai-status.ready{background:var(--okbg);color:var(--ok)}
      .trip-ai-provider-line{margin-top:12px;padding:10px 12px;border-radius:13px;background:var(--surface2);display:flex;justify-content:space-between;gap:10px;align-items:center}.trip-ai-provider-line small{color:var(--muted)}
      .trip-ai-sheet{display:flex;flex-direction:column;max-height:min(92vh,780px);padding-bottom:max(12px,env(safe-area-inset-bottom))}.trip-ai-head-copy{display:flex;align-items:center;gap:10px}.trip-ai-orb{width:38px;height:38px;border-radius:14px;display:grid;place-items:center;background:linear-gradient(145deg,#eef7ff,#fff);color:#1677ff;border:1px solid #d8e9ff;font-size:19px;box-shadow:0 8px 20px rgba(22,119,255,.1)}
      .trip-ai-provider-pill{display:inline-flex;margin-top:4px;padding:4px 8px;border-radius:999px;background:var(--surface2);color:var(--muted);font-size:10px;font-weight:800}.trip-ai-privacy{margin:8px 0 10px;padding:9px 11px;border-radius:13px;background:var(--surface2);color:var(--muted);font-size:11px;line-height:1.45}
      .trip-ai-suggestions{display:flex;gap:7px;overflow-x:auto;padding:2px 0 10px;scrollbar-width:none}.trip-ai-suggestions::-webkit-scrollbar{display:none}.trip-ai-suggestion{flex:0 0 auto;border:1px solid var(--line);border-radius:999px;background:var(--surface);color:var(--text);padding:8px 11px;font-size:11px;font-weight:750}
      .trip-ai-messages{min-height:180px;max-height:48vh;overflow:auto;display:flex;flex-direction:column;gap:9px;padding:8px 2px 12px}.trip-ai-message{max-width:88%;padding:10px 12px;border-radius:16px;font-size:13px;line-height:1.48;white-space:pre-wrap;overflow-wrap:anywhere}.trip-ai-message.user{align-self:flex-end;background:var(--brand);color:#fff;border-bottom-right-radius:6px}.trip-ai-message.assistant{align-self:flex-start;background:var(--surface2);color:var(--text);border-bottom-left-radius:6px}.trip-ai-message.system{align-self:center;max-width:100%;padding:7px 10px;background:transparent;color:var(--muted);font-size:11px;text-align:center}
      .trip-ai-compose{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;border-top:1px solid var(--line);padding-top:10px}.trip-ai-compose textarea{resize:none;min-height:46px;max-height:110px;border:1px solid var(--line);border-radius:15px;background:var(--surface);color:var(--text);padding:11px 12px;outline:none;font:inherit;font-size:16px;line-height:1.35}.trip-ai-send{width:48px;min-height:46px;border:0;border-radius:15px;background:var(--brand);color:#fff;font-size:18px;font-weight:900}.trip-ai-send:disabled{opacity:.45}
      .trip-ai-action{align-self:stretch;max-width:100%;padding:13px;border:1px solid color-mix(in srgb,var(--brand) 18%,var(--line));border-radius:17px;background:linear-gradient(145deg,color-mix(in srgb,var(--brand) 5%,var(--surface)),var(--surface));box-shadow:0 8px 22px rgba(16,24,40,.06)}
      .trip-ai-action-head{display:flex;align-items:center;justify-content:space-between;gap:10px}.trip-ai-action-head strong{font-size:13px}.trip-ai-action-badge{padding:4px 7px;border-radius:999px;background:var(--brand-soft);color:var(--brand);font-size:9px;font-weight:900;letter-spacing:.05em}.trip-ai-action-details{display:grid;gap:5px;margin:10px 0}.trip-ai-action-details div{display:flex;justify-content:space-between;gap:12px;font-size:11px}.trip-ai-action-details span{color:var(--muted)}.trip-ai-action-details strong{text-align:right;font-size:11px;overflow-wrap:anywhere}.trip-ai-action-note{margin:8px 0 0;color:var(--muted);font-size:10px;line-height:1.4}.trip-ai-action-buttons{display:grid;grid-template-columns:1fr 1.35fr;gap:8px;margin-top:11px}.trip-ai-action-buttons button{min-height:40px;border-radius:12px;font-weight:800}.trip-ai-action-confirm{border:0;background:var(--brand);color:#fff}.trip-ai-action-cancel{border:1px solid var(--line);background:var(--surface);color:var(--text)}.trip-ai-action.done{border-color:color-mix(in srgb,var(--ok) 30%,var(--line))}.trip-ai-action.cancelled{opacity:.65}.trip-ai-action-buttons button:disabled{opacity:.5}
      html[data-theme="dark"] .trip-ai-orb{background:#172844;border-color:#274a78;color:#79b9ff}@media(max-width:480px){.trip-ai-sheet{max-height:94vh}.trip-ai-messages{max-height:50vh}.trip-ai-message{max-width:92%}}
    `;
    document.head.appendChild(style);
  }

  function injectModal() {
    if ($("tripAiModal")) return;
    const modal = document.createElement("div");
    modal.id = "tripAiModal";
    modal.className = "modal hidden";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "tripAiTitle");
    modal.innerHTML = `
      <div class="sheet trip-ai-sheet">
        <div class="handle"></div>
        <div class="modal-head">
          <div class="trip-ai-head-copy"><span class="trip-ai-orb" aria-hidden="true">✦</span><div><div class="eyebrow">TRIPSPEND AI</div><h2 id="tripAiTitle">Ask TripSpend</h2><span class="trip-ai-provider-pill">${PROVIDER.short}</span></div></div>
          <button id="tripAiClose" class="icon-btn" type="button" aria-label="Close TripSpend AI">✕</button>
        </div>
        <div class="trip-ai-privacy">AI can answer questions and prepare adds/edits. Every change requires your confirmation. Receipt images, backups and past trips are not sent.</div>
        <div class="trip-ai-suggestions" aria-label="Suggested questions">
          <button class="trip-ai-suggestion" type="button">Add 12 OMR dinner today</button><button class="trip-ai-suggestion" type="button">What is my plan tomorrow?</button><button class="trip-ai-suggestion" type="button">Where am I spending most?</button><button class="trip-ai-suggestion" type="button">Change my trip budget to 900 OMR</button>
        </div>
        <div id="tripAiMessages" class="trip-ai-messages" aria-live="polite"></div>
        <form id="tripAiForm" class="trip-ai-compose"><textarea id="tripAiInput" rows="1" maxlength="800" placeholder="Ask or make a change…" aria-label="Ask TripSpend AI"></textarea><button id="tripAiSend" class="trip-ai-send" type="submit" aria-label="Send question">↑</button></form>
      </div>`;
    document.body.appendChild(modal);

    $("tripAiClose")?.addEventListener("click", closeAi);
    modal.addEventListener("click", event => { if (event.target === modal) closeAi(); });
    $("tripAiForm")?.addEventListener("submit", event => {
      event.preventDefault();
      const input = $("tripAiInput");
      const question = String(input?.value || "").trim();
      if (!question) return;
      input.value = "";
      ask(question);
    });
    modal.querySelectorAll(".trip-ai-suggestion").forEach(button => button.addEventListener("click", () => ask(button.textContent.trim())));
  }

  function injectSettings() {
    if ($("tripAiSettingsCard")) return;
    const appearance = document.querySelector("#settings .appearance-card");
    if (!appearance) return;
    const card = document.createElement("div");
    card.id = "tripAiSettingsCard";
    card.className = "card trip-ai-settings-card";
    card.innerHTML = `<div class="trip-ai-settings-head"><div><strong>TripSpend AI</strong><p>Ask questions or prepare adds and edits. Every write requires confirmation.</p></div><span id="tripAiServiceStatus" class="trip-ai-status">CHECKING</span></div><div class="trip-ai-provider-line"><span><strong>${PROVIDER.label}</strong><br><small>${PROVIDER.short}</small></span><small>Free beta</small></div>`;
    appearance.insertAdjacentElement("afterend", card);
    updateServiceStatus();
  }

  function activateTrigger() {
    let mark = document.querySelector(".dashboard-welcome-mark");
    if (!mark) return;
    if (mark.tagName !== "BUTTON") {
      const button = document.createElement("button");
      button.type = "button";
      button.className = mark.className;
      button.textContent = mark.textContent || "✦";
      mark.replaceWith(button);
      mark = button;
    }
    mark.id = "tripAiTrigger";
    mark.classList.add("trip-ai-ready");
    mark.removeAttribute("aria-hidden");
    mark.setAttribute("aria-label", "Ask TripSpend AI");
    mark.setAttribute("title", "Ask TripSpend AI");
    mark.addEventListener("click", openAi);
  }

  function addMessage(role, text) {
    const messages = $("tripAiMessages");
    if (!messages) return;
    const row = document.createElement("div");
    row.className = `trip-ai-message ${role}`;
    row.textContent = text;
    messages.appendChild(row);
    messages.scrollTop = messages.scrollHeight;
    return row;
  }

  function actionTitle(type) {
    return ({
      add_expense: "Add expense",
      edit_expense: "Edit expense",
      add_itinerary: "Add itinerary item",
      edit_itinerary: "Edit itinerary item",
      add_plan: "Add planned cost",
      edit_plan: "Edit planned cost",
      set_trip_budget: "Change trip budget",
      set_country_budget: "Change country budget"
    })[type] || "Trip change";
  }

  function displayAction(action) {
    const appState = state();
    const fields = action?.fields || {};
    const rows = [];
    const add = (label, value) => { if (value !== undefined && value !== null && String(value) !== "") rows.push([label, String(value)]); };

    if (action.type === "edit_expense") {
      const item = appState?.expenses?.find(row => row.id === action.targetId);
      add("Expense", item ? `${item.category} • ${core.money(item.homeAmount, appState.trip.homeCurrency)}` : action.targetId);
    } else if (action.type === "edit_itinerary") {
      add("Item", appState?.itinerary?.find(row => row.id === action.targetId)?.title || action.targetId);
    } else if (action.type === "edit_plan") {
      add("Planned cost", appState?.plans?.find(row => row.id === action.targetId)?.title || action.targetId);
    } else if (action.type === "set_country_budget") {
      add("Country", appState?.stops?.find(row => row.id === action.targetId)?.country || fields.country || action.targetId);
    }

    add("Title", fields.title);
    add("Amount", fields.amount != null && appState?.trip ? core.money(Number(fields.amount), appState.trip.homeCurrency) : "");
    add("Date", fields.date ? core.fmtDateWithYear(fields.date) : "");
    add("Time", fields.time);
    add("Category", fields.category);
    add("Type", fields.type || fields.expenseType);
    add("Country", fields.country);
    add("Location", fields.location);
    add("Payment", fields.paymentMethod);
    add("Note", fields.note);
    return rows.slice(0, 7);
  }

  function renderActionCard(action) {
    if (!SUPPORTED_ACTIONS.has(action?.type)) return null;
    const messages = $("tripAiMessages");
    if (!messages) return null;
    pendingAction = action;

    const card = document.createElement("div");
    card.className = "trip-ai-action";
    const head = document.createElement("div");
    head.className = "trip-ai-action-head";
    const title = document.createElement("strong");
    title.textContent = actionTitle(action.type);
    const badge = document.createElement("span");
    badge.className = "trip-ai-action-badge";
    badge.textContent = "CONFIRM";
    head.append(title, badge);

    const details = document.createElement("div");
    details.className = "trip-ai-action-details";
    displayAction(action).forEach(([label, value]) => {
      const row = document.createElement("div");
      const l = document.createElement("span");
      const v = document.createElement("strong");
      l.textContent = label;
      v.textContent = value;
      row.append(l, v);
      details.append(row);
    });

    const note = document.createElement("p");
    note.className = "trip-ai-action-note";
    note.textContent = "Nothing changes until you tap Confirm.";

    const buttons = document.createElement("div");
    buttons.className = "trip-ai-action-buttons";
    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "trip-ai-action-cancel";
    cancel.textContent = "Cancel";
    const confirm = document.createElement("button");
    confirm.type = "button";
    confirm.className = "trip-ai-action-confirm";
    confirm.textContent = "Confirm change";
    buttons.append(cancel, confirm);

    cancel.addEventListener("click", () => {
      cancel.disabled = true;
      confirm.disabled = true;
      card.classList.add("cancelled");
      badge.textContent = "CANCELLED";
      note.textContent = "No changes were made.";
      if (pendingAction === action) pendingAction = null;
      addMessage("system", "Cancelled. Nothing was changed.");
    });

    confirm.addEventListener("click", () => {
      cancel.disabled = true;
      confirm.disabled = true;
      const result = applyAction(action);
      if (result.ok) {
        card.classList.add("done");
        badge.textContent = "SAVED";
        note.textContent = result.message;
        if (pendingAction === action) pendingAction = null;
        addMessage("assistant", result.message);
      } else {
        cancel.disabled = false;
        confirm.disabled = false;
        badge.textContent = "CHECK";
        note.textContent = result.message;
      }
    });

    card.append(head, details, note, buttons);
    messages.append(card);
    messages.scrollTop = messages.scrollHeight;
    return card;
  }

  function normalizeExpenseFields(appState, fields, existing = null) {
    const amount = fields.amount != null ? Number(fields.amount) : Number(existing?.homeAmount || 0);
    if (!(amount > 0)) throw new Error("Expense amount must be greater than zero");
    const date = clampTripDate(appState, fields.date || existing?.date || localDateString());
    const stop = stopByRef(appState, fields.stopId, fields.country, date);
    const category = CATEGORY_NAMES.has(fields.category) ? fields.category : (existing?.category || "Other");
    const paymentMethod = PAYMENT_NAMES.has(fields.paymentMethod) ? fields.paymentMethod : (existing?.paymentMethod || appState.trip.defaultPayment || "Credit Card");
    const active = (appState.people || []).filter(person => person.active !== false);
    if (!active.length) throw new Error("Add a traveler before saving an AI expense");
    const payer = personByRef(appState, fields.paidByPersonId || existing?.paidByPersonId, fields.paidBy);
    const expenseType = fields.expenseType === "shared" || fields.expenseType === "personal" ? fields.expenseType : (existing?.expenseType || "personal");

    let personShares = [];
    if (expenseType === "shared") {
      const requestedIds = Array.isArray(fields.sharedWithPersonIds) ? fields.sharedWithPersonIds : [];
      let selected = requestedIds.map(id => active.find(person => person.id === id)).filter(Boolean);
      if (!selected.length && Array.isArray(fields.sharedWithNames)) {
        selected = fields.sharedWithNames.map(name => personByRef(appState, "", name)).filter(Boolean);
      }
      if (!selected.length && existing?.expenseType === "shared") {
        selected = (existing.personShares || []).map(share => active.find(person => person.id === share.personId)).filter(Boolean);
      }
      if (!selected.length) selected = active;
      selected = [...new Map(selected.map(person => [person.id, person])).values()];
      const each = amount / selected.length;
      personShares = selected.map(person => ({ personId: person.id, amount: each }));
    } else {
      const existingBeneficiary = existing?.personShares?.[0]?.personId || "";
      const beneficiary = personByRef(appState, fields.personId || existingBeneficiary || payer?.id, fields.personName);
      if (!beneficiary) throw new Error("Choose who the personal expense is for");
      personShares = [{ personId: beneficiary.id, amount }];
    }

    return {
      amount,
      currency: appState.trip.homeCurrency,
      rate: 1,
      homeAmount: amount,
      category,
      paymentMethod,
      date,
      note: cleanText(fields.note != null ? fields.note : existing?.note, 120),
      expenseType,
      paidByPersonId: payer?.id || "",
      stopId: stop?.id || "",
      personShares
    };
  }

  function syncItineraryPlan(appState, item) {
    const amount = Number(item.homeAmount || 0);
    const existing = item.planId ? appState.plans.find(plan => plan.id === item.planId) : null;
    const recorded = existing && appState.expenses.some(expense => expense.planId === existing.id);
    if (!(amount > 0)) {
      if (existing && !recorded) appState.plans = appState.plans.filter(plan => plan.id !== existing.id);
      if (!recorded) item.planId = "";
      return;
    }
    const category = ITINERARY_CATEGORY[item.type] || "Other";
    if (existing) {
      existing.title = item.title;
      existing.homeAmount = amount;
      existing.date = item.date;
      existing.stopId = item.stopId;
      existing.category = category;
      existing.note = [item.location, item.bookingRef, item.note].filter(Boolean).join(" • ").slice(0, 120);
      if (!recorded) existing.status = "planned";
      return;
    }
    const plan = {
      id: core.uid("plan"),
      title: item.title,
      homeAmount: amount,
      date: item.date,
      stopId: item.stopId,
      category,
      note: [item.location, item.bookingRef, item.note].filter(Boolean).join(" • ").slice(0, 120),
      status: "planned",
      createdAt: Date.now()
    };
    appState.plans.push(plan);
    item.planId = plan.id;
  }

  function applyAction(action) {
    try {
      if (!SUPPORTED_ACTIONS.has(action?.type)) throw new Error("That AI action is not supported");
      const appState = state();
      if (!appState?.trip) throw new Error("Open a trip before making changes");
      const fields = action.fields && typeof action.fields === "object" ? action.fields : {};

      if (action.type === "add_expense") {
        const normalized = normalizeExpenseFields(appState, fields);
        appState.expenses.push({
          id: core.uid("expense"),
          ...normalized,
          planId: "",
          receiptId: "",
          createdAt: Date.now()
        });
        appState.preferences = appState.preferences || {};
        appState.preferences.lastPaymentMethod = normalized.paymentMethod;
        appState.preferences.lastCategory = normalized.category;
        appState.preferences.lastStopId = normalized.stopId;
        appState.preferences.lastPaidByPersonId = normalized.paidByPersonId;
        core.save({ immediate: true });
        core.render();
        return { ok: true, message: `Expense added: ${core.money(normalized.homeAmount, appState.trip.homeCurrency)} • ${normalized.category}.` };
      }

      if (action.type === "edit_expense") {
        const item = appState.expenses.find(expense => expense.id === action.targetId);
        if (!item) throw new Error("I could not find that expense anymore");
        const normalized = normalizeExpenseFields(appState, fields, item);
        Object.assign(item, normalized);
        core.save({ immediate: true });
        core.render();
        return { ok: true, message: `Expense updated: ${core.money(item.homeAmount, appState.trip.homeCurrency)} • ${item.category}.` };
      }

      if (action.type === "add_itinerary") {
        const date = clampTripDate(appState, fields.date);
        const stop = stopByRef(appState, fields.stopId, fields.country, date);
        const type = ITINERARY_TYPES.has(fields.type) ? fields.type : "Activity";
        const item = {
          id: core.uid("itinerary"),
          title: cleanText(fields.title, 100) || "Trip plan",
          type,
          date,
          time: /^\d{2}:\d{2}$/.test(String(fields.time || "")) ? fields.time : "",
          stopId: stop?.id || "",
          location: cleanText(fields.location, 140),
          bookingRef: cleanText(fields.bookingRef, 100),
          note: cleanText(fields.note, 220),
          homeAmount: Math.max(0, Number(fields.amount || 0)),
          planId: "",
          status: fields.status === "booked" ? "booked" : "planned",
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        appState.itinerary.push(item);
        syncItineraryPlan(appState, item);
        core.save({ immediate: true });
        core.render();
        return { ok: true, message: `Added to itinerary: ${item.title} on ${core.fmtDateWithYear(item.date)}.` };
      }

      if (action.type === "edit_itinerary") {
        const item = appState.itinerary.find(row => row.id === action.targetId);
        if (!item) throw new Error("I could not find that itinerary item anymore");
        if (fields.title != null) item.title = cleanText(fields.title, 100) || item.title;
        if (fields.type != null && ITINERARY_TYPES.has(fields.type)) item.type = fields.type;
        if (fields.date != null) item.date = clampTripDate(appState, fields.date);
        if (fields.time != null) item.time = /^\d{2}:\d{2}$/.test(String(fields.time)) ? fields.time : "";
        if (fields.country != null || fields.stopId != null || fields.date != null) item.stopId = stopByRef(appState, fields.stopId, fields.country, item.date)?.id || item.stopId;
        if (fields.location != null) item.location = cleanText(fields.location, 140);
        if (fields.bookingRef != null) item.bookingRef = cleanText(fields.bookingRef, 100);
        if (fields.note != null) item.note = cleanText(fields.note, 220);
        if (fields.amount != null) item.homeAmount = Math.max(0, Number(fields.amount || 0));
        if (fields.status === "booked" || fields.status === "planned") item.status = fields.status;
        item.updatedAt = Date.now();
        syncItineraryPlan(appState, item);
        core.save({ immediate: true });
        core.render();
        return { ok: true, message: `Itinerary updated: ${item.title}.` };
      }

      if (action.type === "add_plan") {
        const amount = Number(fields.amount || 0);
        if (!(amount > 0)) throw new Error("Planned cost must be greater than zero");
        const date = clampTripDate(appState, fields.date);
        const stop = stopByRef(appState, fields.stopId, fields.country, date);
        const plan = {
          id: core.uid("plan"),
          title: cleanText(fields.title, 100) || "Planned cost",
          homeAmount: amount,
          date,
          stopId: stop?.id || "",
          category: CATEGORY_NAMES.has(fields.category) ? fields.category : "Other",
          note: cleanText(fields.note, 140),
          status: "planned",
          createdAt: Date.now()
        };
        appState.plans.push(plan);
        core.save({ immediate: true });
        core.render();
        return { ok: true, message: `Planned cost added: ${plan.title} • ${core.money(amount, appState.trip.homeCurrency)}.` };
      }

      if (action.type === "edit_plan") {
        const plan = appState.plans.find(row => row.id === action.targetId);
        if (!plan) throw new Error("I could not find that planned cost anymore");
        if (plan.status === "paid" || appState.expenses.some(expense => expense.planId === plan.id)) throw new Error("That planned cost is already recorded as an expense and cannot be edited here");
        if (fields.title != null) plan.title = cleanText(fields.title, 100) || plan.title;
        if (fields.amount != null) {
          const amount = Number(fields.amount);
          if (!(amount > 0)) throw new Error("Planned cost must be greater than zero");
          plan.homeAmount = amount;
        }
        if (fields.date != null) plan.date = clampTripDate(appState, fields.date);
        if (fields.country != null || fields.stopId != null || fields.date != null) plan.stopId = stopByRef(appState, fields.stopId, fields.country, plan.date)?.id || plan.stopId;
        if (fields.category != null && CATEGORY_NAMES.has(fields.category)) plan.category = fields.category;
        if (fields.note != null) plan.note = cleanText(fields.note, 140);
        core.save({ immediate: true });
        core.render();
        return { ok: true, message: `Planned cost updated: ${plan.title}.` };
      }

      if (action.type === "set_trip_budget") {
        const amount = Number(fields.amount);
        if (!Number.isFinite(amount) || amount < 0) throw new Error("Trip budget must be zero or more");
        appState.trip.budget = amount;
        if (appState.stops?.length === 1) appState.stops[0].budget = amount;
        core.save({ immediate: true });
        core.render();
        return { ok: true, message: `Trip budget updated to ${core.money(amount, appState.trip.homeCurrency)}.` };
      }

      if (action.type === "set_country_budget") {
        const stop = stopByRef(appState, action.targetId || fields.stopId, fields.country, fields.date);
        if (!stop) throw new Error("I could not find that country in this trip");
        const amount = Number(fields.amount);
        if (!Number.isFinite(amount) || amount < 0) throw new Error("Country budget must be zero or more");
        stop.budget = amount;
        core.save({ immediate: true });
        core.render();
        return { ok: true, message: `${stop.country} budget updated to ${core.money(amount, appState.trip.homeCurrency)}.` };
      }

      throw new Error("That action is not supported yet");
    } catch (error) {
      return { ok: false, message: error?.message || "TripSpend could not apply that change." };
    }
  }

  function openAi() {
    const modal = $("tripAiModal");
    if (!modal) return;
    modal.classList.remove("hidden");
    if (!$("tripAiMessages")?.children.length) {
      addMessage("system", workerActionsReady
        ? "Ask about your trip or tell me what to add/edit. I will always ask before saving a change."
        : "Ask me about this trip. Add/edit actions need the v6.8.2 AI Worker update.");
    }
    setTimeout(() => $("tripAiInput")?.focus(), 80);
  }

  function closeAi() {
    requestController?.abort();
    requestController = null;
    $("tripAiModal")?.classList.add("hidden");
  }

  function updateServiceStatus() {
    const badge = $("tripAiServiceStatus");
    if (!badge) return;
    badge.textContent = !endpoint ? "SETUP" : (workerActionsReady ? "ACTIONS READY" : "READ ONLY");
    badge.classList.toggle("ready", !!endpoint);
  }

  async function ask(question) {
    if (!endpoint) {
      addMessage("system", "TripSpend AI is not configured yet.");
      return;
    }

    addMessage("user", question);
    chatHistory.push({ role: "user", content: question });
    chatHistory = chatHistory.slice(-MAX_HISTORY);

    const send = $("tripAiSend");
    if (send) send.disabled = true;
    const waiting = addMessage("assistant", "Thinking…");
    requestController?.abort();
    requestController = new AbortController();
    const timer = setTimeout(() => requestController?.abort(), 30000);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: requestController.signal,
        body: JSON.stringify({
          provider: PROVIDER.key,
          question,
          context: buildTripContext(),
          history: chatHistory.slice(0, -1),
          capabilities: { writeActions: true, confirmationRequired: true }
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || `AI request failed (${response.status})`);
      const answer = cleanText(data?.answer, 5000) || (data?.action ? "Review the proposed change below." : "I couldn't produce an answer for that question.");
      if (waiting) waiting.textContent = answer;
      chatHistory.push({ role: "assistant", content: answer });
      chatHistory = chatHistory.slice(-MAX_HISTORY);
      if (data?.action && SUPPORTED_ACTIONS.has(data.action.type)) renderActionCard(data.action);
    } catch (error) {
      const message = error?.name === "AbortError" ? "The AI request timed out. Please try again." : (error?.message || "TripSpend AI is unavailable right now.");
      if (waiting) waiting.textContent = message;
    } finally {
      clearTimeout(timer);
      requestController = null;
      if (send) send.disabled = false;
    }
  }

  function init() {
    injectStyles();
    injectModal();
    injectSettings();
    activateTrigger();
    loadConfig();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
