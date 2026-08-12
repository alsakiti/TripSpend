(() => {
  "use strict";

  const core = window.TripSpendCore;
  if (!core) return;

  const $ = id => document.getElementById(id);
  let preparedSource = null;
  let setupDraftStops = [];

  const CURRENCY_BY_COUNTRY = {
    Oman:"OMR", Thailand:"THB", Indonesia:"IDR", Singapore:"SGD", Malaysia:"MYR",
    "United Arab Emirates":"AED", "Saudi Arabia":"SAR", Qatar:"QAR", Kuwait:"KWD",
    Bahrain:"BHD", Japan:"JPY", "United Kingdom":"GBP", "United States":"USD",
    France:"EUR", Germany:"EUR", Italy:"EUR", Spain:"EUR", Austria:"EUR",
    Netherlands:"EUR", Belgium:"EUR", Portugal:"EUR", Greece:"EUR", Ireland:"EUR",
    Switzerland:"CHF", Turkey:"TRY", India:"INR", China:"CNY", "South Korea":"KRW",
    Philippines:"PHP", Vietnam:"VND", Australia:"AUD", Canada:"CAD", "New Zealand":"NZD"
  };

  function state() { return core.getState(); }
  function stops() { return Array.isArray(state().stops) ? state().stops : []; }
  function plans() { return Array.isArray(state().plans) ? state().plans : []; }
  function people() { return core.activePeople(); }
  function stopById(id) { return stops().find(s => s.id === id) || null; }
  function personById(id) { return state().people.find(p => p.id === id) || null; }


  function bindDateDisplay(inputId, displayId, withYear = true) {
    const input = $(inputId);
    const display = $(displayId);
    if (!input || !display || input.dataset.v5DateBound === "1") return;
    const refresh = () => {
      if (!input.value) {
        display.textContent = "Select date";
      } else {
        display.textContent = withYear
          ? core.fmtDateWithYear(input.value)
          : core.fmtDate(input.value);
      }
    };
    input.addEventListener("input", refresh);
    input.addEventListener("change", refresh);
    input.dataset.v5DateBound = "1";
    refresh();
  }

  function daysAfter(iso, days = 1) {
    if (!iso) return core.today();
    const [y,m,d] = iso.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + days);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0,10);
  }

  function setupRouteCurrency(country) {
    return CURRENCY_BY_COUNTRY[country] || "USD";
  }

  function renderSetupRoute() {
    const list = $("setupRouteList");
    if (!list) return;
    list.replaceChildren();

    setupDraftStops.forEach((stop, index) => {
      const row = document.createElement("div");
      row.className = "setup-route-item";

      const number = document.createElement("span");
      number.className = "setup-route-number";
      number.textContent = String(index + 2);

      const body = document.createElement("div");
      const strong = document.createElement("strong");
      strong.textContent = stop.country;
      const small = document.createElement("small");
      small.textContent = `${core.fmtDate(stop.startDate)} – ${core.fmtDate(stop.endDate)} • ${stop.currency}`;
      body.append(strong, small);

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "mini-btn delete";
      remove.textContent = "Remove";
      remove.onclick = () => {
        setupDraftStops.splice(index, 1);
        renderSetupRoute();
      };

      row.append(number, body, remove);
      list.append(row);
    });

    const toggle = $("setupToggleCountries");
    if (toggle) toggle.textContent = setupDraftStops.length ? "＋ Add another" : "＋ Add another country";
  }

  function setSetupExtraDefaults() {
    const lastEnd = setupDraftStops.at(-1)?.endDate || $("endDate")?.value || $("startDate")?.value || core.today();
    const start = daysAfter(lastEnd, setupDraftStops.length ? 1 : 0);
    const tripEnd = $("endDate")?.value || start;
    $("setupExtraStart").value = start;
    $("setupExtraEnd").value = tripEnd >= start ? tripEnd : start;
    $("setupExtraStart").dispatchEvent(new Event("input", { bubbles: true }));
    $("setupExtraEnd").dispatchEvent(new Event("input", { bubbles: true }));
  }

  function addSetupCountry() {
    const country = core.canonicalDestination("setupExtraCountry");
    if (!country) return;

    const startDate = $("setupExtraStart").value;
    const endDate = $("setupExtraEnd").value;
    if (!core.validDates(startDate, endDate)) return core.toast("Country end date must be after its start date");

    if (setupDraftStops.some(s => s.country === country && s.startDate === startDate)) {
      return core.toast("That country is already in your route");
    }

    setupDraftStops.push({
      id: core.uid("stop"),
      country,
      startDate,
      endDate,
      currency: $("setupExtraCurrency").value || setupRouteCurrency(country),
      budget: 0,
      createdAt: Date.now()
    });

    setupDraftStops.sort((a,b) => a.startDate.localeCompare(b.startDate));
    core.setDestinationValue("setupExtraCountry", "");
    renderSetupRoute();
    setSetupExtraDefaults();
    core.toast(`${country} added to route`);
  }

  function setupStops() {
    return setupDraftStops.map(s => ({ ...s }));
  }

  function clearSetupStops() {
    setupDraftStops = [];
    renderSetupRoute();
    core.setDestinationValue("setupExtraCountry", "");
    $("setupMultiCountryPanel")?.classList.add("hidden");
  }

  function ensureV5Data() {
    const s = state();
    if (!Array.isArray(s.stops)) s.stops = [];
    if (!Array.isArray(s.plans)) s.plans = [];

    if (s.trip && !s.stops.length) {
      s.stops.push({
        id: "stop-primary",
        country: s.trip.destination,
        startDate: s.trip.startDate,
        endDate: s.trip.endDate,
        currency: s.trip.tripCurrency,
        budget: Number(s.trip.budget || 0),
        createdAt: s.trip.createdAt || Date.now()
      });
      core.save();
    }
  }

  function tripSpent() {
    return state().expenses.reduce((sum, e) => sum + Number(e.homeAmount || 0), 0);
  }

  function upcomingPlans() {
    return plans().filter(p => p.status !== "paid");
  }

  function upcomingTotal() {
    return upcomingPlans().reduce((sum, p) => sum + Number(p.homeAmount || 0), 0);
  }

  function stopSpent(stopId) {
    return state().expenses
      .filter(e => e.stopId === stopId)
      .reduce((sum, e) => sum + Number(e.homeAmount || 0), 0);
  }

  function stopPlanned(stopId) {
    return upcomingPlans()
      .filter(p => p.stopId === stopId)
      .reduce((sum, p) => sum + Number(p.homeAmount || 0), 0);
  }

  function stopForDate(date) {
    if (!date) return stops()[0] || null;
    return stops().find(s => s.startDate <= date && date <= s.endDate) || stops()[0] || null;
  }

  function sortStops() {
    state().stops.sort((a,b) => (a.startDate || "").localeCompare(b.startDate || "") || a.createdAt - b.createdAt);
  }

  function setHeaderRoute() {
    if (!state().trip || !stops().length) return;
    const names = stops().map(s => s.country);
    const sub = $("headerSub");
    if (!sub) return;
    if (names.length === 1) return;
    const preview = names.length <= 3 ? names.join(" → ") : `${names[0]} → ${names[1]} → +${names.length - 2} more`;
    sub.textContent = `${names.length} countries • ${preview}`;
  }

  function renderDashboardPlan() {
    if (!state().trip) return;

    const route = $("routeChips");
    if (route) {
      route.replaceChildren();
      stops().forEach((s, i) => {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "route-chip";
        chip.textContent = `${i + 1}. ${s.country} · ${s.currency}`;
        chip.onclick = () => core.page("plan");
        route.append(chip);
      });
    }

    if ($("countryCount")) $("countryCount").textContent = String(stops().length);
    if ($("upcomingCost")) $("upcomingCost").textContent = core.money(upcomingTotal(), state().trip.homeCurrency);
    if ($("committedCost")) $("committedCost").textContent = core.money(tripSpent() + upcomingTotal(), state().trip.homeCurrency);

    const next = upcomingPlans().slice().sort((a,b) => (a.date || "").localeCompare(b.date || ""))[0];
    const nextEl = $("nextPlanItem");
    if (nextEl) {
      nextEl.replaceChildren();
      if (!next) {
        nextEl.innerHTML = '<span>✓</span><div><strong>No upcoming costs yet</strong><small>Add hotels, tours, transfers, or other planned costs.</small></div>';
      } else {
        const stop = stopById(next.stopId);
        const icon = document.createElement("span");
        icon.textContent = "📌";
        const body = document.createElement("div");
        const strong = document.createElement("strong");
        strong.textContent = next.title;
        const small = document.createElement("small");
        small.textContent = `${core.fmtDateLong(next.date)}${stop ? ` • ${stop.country}` : ""} • ${core.money(next.homeAmount, state().trip.homeCurrency)}`;
        body.append(strong, small);
        nextEl.append(icon, body);
      }
    }
  }

  function renderPlannerSummary() {
    if (!state().trip) return;
    $("plannerSpent").textContent = core.money(tripSpent(), state().trip.homeCurrency);
    $("plannerUpcoming").textContent = core.money(upcomingTotal(), state().trip.homeCurrency);
    $("plannerCommitted").textContent = core.money(tripSpent() + upcomingTotal(), state().trip.homeCurrency);
    if ($("planCurrencyHint")) $("planCurrencyHint").textContent = `(${state().trip.homeCurrency})`;
  }

  function renderStops() {
    const el = $("stopList");
    if (!el || !state().trip) return;
    el.replaceChildren();

    if (!stops().length) {
      el.innerHTML = '<div class="empty-state">No countries added yet.</div>';
      return;
    }

    stops().forEach((s, idx) => {
      const spent = stopSpent(s.id);
      const planned = stopPlanned(s.id);
      const card = document.createElement("div");
      card.className = "stop-card";

      const top = document.createElement("div");
      top.className = "stop-card-top";
      const number = document.createElement("span");
      number.className = "stop-number";
      number.textContent = String(idx + 1);
      const title = document.createElement("div");
      const strong = document.createElement("strong");
      strong.textContent = s.country;
      const dates = document.createElement("small");
      dates.textContent = `${core.fmtDate(s.startDate)} – ${core.fmtDate(s.endDate)} • ${s.currency}`;
      title.append(strong, dates);
      top.append(number, title);

      const metrics = document.createElement("div");
      metrics.className = "stop-metrics";
      const budget = Number(s.budget || 0);
      metrics.innerHTML = `
        <div><small>Spent</small><strong>${core.money(spent, state().trip.homeCurrency)}</strong></div>
        <div><small>Upcoming</small><strong>${core.money(planned, state().trip.homeCurrency)}</strong></div>
        <div><small>Budget</small><strong>${budget > 0 ? core.money(budget, state().trip.homeCurrency) : "—"}</strong></div>
      `;

      const actions = document.createElement("div");
      actions.className = "stop-actions";
      if (stops().length > 1) {
        const del = document.createElement("button");
        del.className = "mini-btn delete";
        del.type = "button";
        del.textContent = "Remove";
        del.onclick = () => removeStop(s.id);
        actions.append(del);
      }

      card.append(top, metrics, actions);
      el.append(card);
    });
  }

  function removeStop(id) {
    const s = stopById(id);
    if (!s) return;
    const used = state().expenses.some(e => e.stopId === id) || plans().some(p => p.stopId === id);
    if (used) return core.toast("This country has expenses or planned costs. Remove those first.");
    if (!confirm(`Remove ${s.country} from this trip?`)) return;
    state().stops = stops().filter(x => x.id !== id);
    sortStops();
    core.save();
    core.render();
    core.toast("Country removed");
  }

  function renderPlanStopOptions() {
    const select = $("planStop");
    if (!select) return;
    select.replaceChildren();
    stops().forEach(s => {
      const o = document.createElement("option");
      o.value = s.id;
      o.textContent = `${s.country} • ${s.currency}`;
      select.append(o);
    });
  }

  function renderPlannedCosts() {
    const el = $("planList");
    if (!el || !state().trip) return;
    el.replaceChildren();

    const rows = plans().slice().sort((a,b) => (a.date || "").localeCompare(b.date || "") || a.createdAt - b.createdAt);

    if (!rows.length) {
      el.innerHTML = '<div class="empty-state"><strong>No planned costs yet</strong><span>Add upcoming hotels, transfers, activities, or other expected costs.</span></div>';
      return;
    }

    rows.forEach(p => {
      const paid = p.status === "paid" || state().expenses.some(e => e.planId === p.id);
      if (paid && p.status !== "paid") p.status = "paid";

      const row = document.createElement("div");
      row.className = `planned-item ${paid ? "paid" : ""}`;
      const icon = document.createElement("div");
      icon.className = "planned-icon";
      icon.textContent = paid ? "✓" : "📅";

      const body = document.createElement("div");
      body.className = "planned-body";
      const title = document.createElement("strong");
      title.textContent = p.title;
      const meta = document.createElement("small");
      const stop = stopById(p.stopId);
      meta.textContent = `${core.fmtDateLong(p.date)}${stop ? ` • ${stop.country}` : ""} • ${p.category}`;
      body.append(title, meta);

      const side = document.createElement("div");
      side.className = "planned-side";
      const amount = document.createElement("strong");
      amount.textContent = core.money(p.homeAmount, state().trip.homeCurrency);
      const status = document.createElement("small");
      status.textContent = paid ? "Recorded" : "Upcoming";
      side.append(amount, status);

      const actions = document.createElement("div");
      actions.className = "planned-actions";

      if (!paid) {
        const record = document.createElement("button");
        record.type = "button";
        record.className = "mini-btn";
        record.textContent = "Record expense";
        record.onclick = () => recordPlanAsExpense(p);
        actions.append(record);
      }

      const del = document.createElement("button");
      del.type = "button";
      del.className = "mini-btn delete";
      del.textContent = "Delete";
      del.onclick = () => {
        if (!confirm(`Delete planned cost “${p.title}”?`)) return;
        state().plans = plans().filter(x => x.id !== p.id);
        core.save();
        core.render();
        core.toast("Planned cost deleted");
      };
      actions.append(del);

      row.append(icon, body, side, actions);
      el.append(row);
    });

    core.save();
  }

  function recordPlanAsExpense(p) {
    preparedSource = p;
    core.openModal("", {
      amount: p.homeAmount,
      currency: state().trip.homeCurrency,
      rate: 1,
      category: p.category,
      paymentMethod: state().trip.defaultPayment || "Credit Card",
      date: p.date,
      note: p.title,
      personShares: [],
      paidByPersonId: "",
      stopId: p.stopId,
      planId: p.id
    });
  }

  function renderSettlement() {
    const el = $("settlementList");
    if (!el || !state().trip) return;
    el.replaceChildren();

    const net = new Map();
    state().people.forEach(p => net.set(p.id, 0));

    let tracked = 0;
    state().expenses.forEach(e => {
      if (!e.paidByPersonId || !(e.personShares || []).length) return;
      const payer = personById(e.paidByPersonId);
      if (!payer) return;

      tracked += Number(e.homeAmount || 0);
      net.set(payer.id, (net.get(payer.id) || 0) + Number(e.homeAmount || 0));
      (e.personShares || []).forEach(share => {
        net.set(share.personId, (net.get(share.personId) || 0) - Number(share.amount || 0));
      });
    });

    if (tracked <= 0) {
      el.innerHTML = '<div class="empty-state"><strong>No settlements yet</strong><span>Set “Paid by” and “Expense for” on expenses to calculate who owes whom.</span></div>';
      return;
    }

    const eps = 0.000001;
    const creditors = [...net].filter(([,v]) => v > eps).map(([id,v]) => ({id, amount:v})).sort((a,b)=>b.amount-a.amount);
    const debtors = [...net].filter(([,v]) => v < -eps).map(([id,v]) => ({id, amount:-v})).sort((a,b)=>b.amount-a.amount);
    const settlements = [];

    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
      const amount = Math.min(debtors[i].amount, creditors[j].amount);
      if (amount > eps) settlements.push({ from: debtors[i].id, to: creditors[j].id, amount });
      debtors[i].amount -= amount;
      creditors[j].amount -= amount;
      if (debtors[i].amount <= eps) i++;
      if (creditors[j].amount <= eps) j++;
    }

    if (!settlements.length) {
      el.innerHTML = '<div class="settled-message">✓ Everyone is settled up.</div>';
      return;
    }

    settlements.forEach(s => {
      const row = document.createElement("div");
      row.className = "settlement-row";
      const from = personById(s.from)?.name || "Traveler";
      const to = personById(s.to)?.name || "Traveler";
      row.innerHTML = `<div><strong>${from}</strong><span> pays </span><strong>${to}</strong></div><strong>${core.money(s.amount, state().trip.homeCurrency)}</strong>`;
      el.append(row);
    });
  }

  function fillExpenseStop(selectedId = "") {
    const select = $("expenseStop");
    if (!select) return;
    select.replaceChildren();

    stops().forEach(s => {
      const o = document.createElement("option");
      o.value = s.id;
      o.textContent = `${s.country} • ${s.currency}`;
      select.append(o);
    });

    const fallback = stopForDate($("expenseDate")?.value)?.id || stops()[0]?.id || "";
    select.value = stopById(selectedId) ? selectedId : fallback;
  }

  function fillPaidBy(selectedId = "") {
    const select = $("expensePaidBy");
    if (!select) return;
    select.replaceChildren();

    const blank = document.createElement("option");
    blank.value = "";
    blank.textContent = "Not tracked";
    select.append(blank);

    const ids = new Set(people().map(p => p.id));
    if (selectedId && !ids.has(selectedId)) {
      const old = personById(selectedId);
      if (old) {
        const o = document.createElement("option");
        o.value = old.id;
        o.textContent = `${old.name} (archived)`;
        select.append(o);
      }
    }

    people().forEach(p => {
      const o = document.createElement("option");
      o.value = p.id;
      o.textContent = p.name;
      select.append(o);
    });

    select.value = selectedId && personById(selectedId) ? selectedId : (people()[0]?.id || "");
  }

  function renderExpenseFor(selectedIds = []) {
    const el = $("expenseForPeople");
    if (!el) return;
    el.replaceChildren();

    const include = new Set(selectedIds);
    const all = state().people.filter(p => p.active !== false || include.has(p.id));

    all.forEach(p => {
      const label = document.createElement("label");
      label.className = "person-check";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.value = p.id;
      input.checked = include.has(p.id);
      const avatar = document.createElement("span");
      avatar.className = "person-check-avatar";
      avatar.textContent = (p.name || "?").trim().split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase();
      const name = document.createElement("span");
      name.textContent = p.name + (p.active === false ? " (archived)" : "");
      label.append(input, avatar, name);
      el.append(label);
    });
  }

  function selectedExpenseForIds() {
    return [...document.querySelectorAll("#expenseForPeople input[type=checkbox]:checked")].map(x => x.value);
  }

  function prepareExpense(source) {
    preparedSource = source || null;
    const selected = (source?.personShares || []).map(s => s.personId);
    const payer = source?.paidByPersonId || "";
    fillPaidBy(payer);
    renderExpenseFor(selected.length ? selected : (people()[0] ? [people()[0].id] : []));
    fillExpenseStop(source?.stopId || stopForDate($("expenseDate")?.value)?.id || "");

    if (!source) {
      const stop = stopById($("expenseStop")?.value);
      const currency = $("expenseCurrency");
      if (stop && currency && currency.value !== stop.currency) {
        currency.value = stop.currency;
        currency.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }
  }

  function expenseData(homeAmount) {
    const ids = selectedExpenseForIds();
    const amount = Number(homeAmount || 0);
    const each = ids.length ? amount / ids.length : 0;

    return {
      paidByPersonId: $("expensePaidBy")?.value || "",
      stopId: $("expenseStop")?.value || "",
      planId: preparedSource?.planId || "",
      personShares: ids.map(id => ({ personId: id, amount: each }))
    };
  }

  function renderAll() {
    ensureV5Data();
    setHeaderRoute();
    renderDashboardPlan();
    renderPlannerSummary();
    renderStops();
    renderPlanStopOptions();
    renderPlannedCosts();
    renderSettlement();

    const countrySummary = $("settingsCountrySummary");
    if (countrySummary) {
      const count = stops().length;
      const names = stops().map(s => s.country).filter(Boolean);
      countrySummary.textContent = count === 1
        ? `1 country • ${names[0] || ""}`
        : `${count} countries • ${names.slice(0, 3).join(" → ")}${count > 3 ? ` → +${count - 3} more` : ""}`;
    }
  }

  window.TripSpendV5 = {
    prepareExpense,
    expenseData,
    setupStops,
    clearSetupStops
  };


  // Optional multi-country route during initial trip setup.
  core.opts($("setupExtraCurrency"), core.CURS, "USD");
  core.initDestinationAutocomplete("setupExtraCountry", "setupExtraCountryOptions", "");

  bindDateDisplay("setupExtraStart", "setupExtraStartDisplay", true);
  bindDateDisplay("setupExtraEnd", "setupExtraEndDisplay", true);
  bindDateDisplay("newStopStart", "newStopStartDisplay", true);
  bindDateDisplay("newStopEnd", "newStopEndDisplay", true);
  bindDateDisplay("planDate", "planDateDisplay", true);

  $("setupToggleCountries")?.addEventListener("click", () => {
    const panel = $("setupMultiCountryPanel");
    if (!panel) return;
    panel.classList.toggle("hidden");
    if (!panel.classList.contains("hidden")) {
      setSetupExtraDefaults();
      setTimeout(() => $("setupExtraCountry")?.focus(), 80);
    }
  });

  $("setupExtraCountry")?.addEventListener("change", () => {
    const exact = core.DESTS.find(c => c.toLowerCase() === $("setupExtraCountry").value.trim().toLowerCase());
    if (exact) $("setupExtraCurrency").value = setupRouteCurrency(exact);
  });

  $("setupAddCountry")?.addEventListener("click", addSetupCountry);

  // Planner navigation
  $("openPlan")?.addEventListener("click", () => core.page("plan"));
  $("settingsPlan")?.addEventListener("click", () => core.page("plan"));
  $("settingsAddCountry")?.addEventListener("click", () => {
    core.page("plan");
    setTimeout(() => {
      $("newStopCountry")?.focus();
      $("addStopForm")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  });
  $("planDone")?.addEventListener("click", () => core.page("dashboard"));

  // New country form
  core.opts($("newStopCurrency"), core.CURS, state().trip?.tripCurrency || "USD");
  core.initDestinationAutocomplete("newStopCountry", "newStopCountryOptions", "");

  $("newStopCountry")?.addEventListener("change", () => {
    const exact = core.DESTS.find(c => c.toLowerCase() === $("newStopCountry").value.trim().toLowerCase());
    if (exact && CURRENCY_BY_COUNTRY[exact]) $("newStopCurrency").value = CURRENCY_BY_COUNTRY[exact];
  });

  $("addStopForm")?.addEventListener("submit", e => {
    e.preventDefault();
    const country = core.canonicalDestination("newStopCountry");
    if (!country) return;
    const startDate = $("newStopStart").value;
    const endDate = $("newStopEnd").value;
    if (!core.validDates(startDate, endDate)) return core.toast("Country end date must be after its start date");

    if (stops().some(s => s.country.toLowerCase() === country.toLowerCase() && s.startDate === startDate)) {
      return core.toast("That country is already in the trip plan for those dates");
    }

    state().stops.push({
      id: core.uid("stop"),
      country,
      startDate,
      endDate,
      currency: $("newStopCurrency").value,
      budget: Number($("newStopBudget").value || 0),
      createdAt: Date.now()
    });
    sortStops();

    $("addStopForm").reset();
    core.setDestinationValue("newStopCountry", "");
    const last = stops()[stops().length - 1];
    $("newStopStart").value = last?.endDate || state().trip.startDate;
    $("newStopEnd").value = last?.endDate || state().trip.endDate;
    $("newStopStart").dispatchEvent(new Event("input", { bubbles: true }));
    $("newStopEnd").dispatchEvent(new Event("input", { bubbles: true }));
    core.opts($("newStopCurrency"), core.CURS, state().trip.tripCurrency);

    core.save();
    core.render();
    core.toast("Country added");
  });

  // Planned costs
  core.opts($("planCategory"), core.CATS, "Hotel");

  $("addPlanForm")?.addEventListener("submit", e => {
    e.preventDefault();
    const title = $("planTitle").value.trim();
    const amount = Number($("planAmount").value || 0);
    if (!title) return core.toast("Enter a planned cost");
    if (!(amount > 0)) return core.toast("Enter an estimated cost");

    state().plans.push({
      id: core.uid("plan"),
      title,
      homeAmount: amount,
      date: $("planDate").value,
      stopId: $("planStop").value || "",
      category: $("planCategory").value,
      note: $("planNote").value.trim(),
      status: "planned",
      createdAt: Date.now()
    });

    $("addPlanForm").reset();
    $("planDate").value = core.today();
    $("planDate").dispatchEvent(new Event("input", { bubbles: true }));
    core.opts($("planCategory"), core.CATS, "Hotel");
    renderPlanStopOptions();

    core.save();
    core.render();
    core.toast("Planned cost added");
  });

  // Expense-for shortcuts
  $("expenseForEveryone")?.addEventListener("click", () => {
    document.querySelectorAll("#expenseForPeople input[type=checkbox]").forEach(x => {
      if (!x.disabled) x.checked = true;
    });
  });
  $("expenseForClear")?.addEventListener("click", () => {
    document.querySelectorAll("#expenseForPeople input[type=checkbox]").forEach(x => x.checked = false);
  });

  $("expenseStop")?.addEventListener("change", () => {
    const stop = stopById($("expenseStop").value);
    if (!stop) return;
    const currency = $("expenseCurrency");
    if (currency && currency.value !== stop.currency) {
      currency.value = stop.currency;
      currency.dispatchEvent(new Event("change", { bubbles: true }));
    }
  });

  $("expenseDate")?.addEventListener("change", () => {
    const stop = stopForDate($("expenseDate").value);
    if (stop && $("expenseStop")) {
      $("expenseStop").value = stop.id;
      const currency = $("expenseCurrency");
      if (currency && currency.value !== stop.currency) {
        currency.value = stop.currency;
        currency.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }
  });

  // Planner form sensible defaults.
  if ($("newStopStart")) $("newStopStart").value = state().trip?.startDate || core.today();
  if ($("newStopEnd")) $("newStopEnd").value = state().trip?.endDate || core.today();
  if ($("planDate")) $("planDate").value = core.today();
  $("newStopStart")?.dispatchEvent(new Event("input", { bubbles: true }));
  $("newStopEnd")?.dispatchEvent(new Event("input", { bubbles: true }));
  $("planDate")?.dispatchEvent(new Event("input", { bubbles: true }));

  renderSetupRoute();

  window.addEventListener("tripspend:render", renderAll);
  renderAll();
})();