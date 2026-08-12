(() => {
  "use strict";

  const core = window.TripSpendCore;
  if (!core) return;

  const $ = id => document.getElementById(id);
  let preparedSource = null;
  let currentExpenseType = "personal";
  let setupDraftStops = [];
  let setupDraftPeople = [];
  let editingSetupStopIndex = -1;
  let editingSetupPersonIndex = -1;

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
      strong.textContent = `Country ${index + 2}: ${core.countryFlag(stop.country)} ${stop.country}`;
      const small = document.createElement("small");
      small.textContent = `${core.fmtDateWithYear(stop.startDate)} – ${core.fmtDateWithYear(stop.endDate)} • ${stop.currency}`;
      body.append(strong, small);

      const actions = document.createElement("div");
      actions.className = "setup-item-actions";

      const edit = document.createElement("button");
      edit.type = "button";
      edit.className = "mini-btn";
      edit.textContent = "Edit";
      edit.onclick = () => editSetupCountry(index);

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "mini-btn delete";
      remove.textContent = "Remove";
      remove.onclick = () => {
        if (editingSetupStopIndex === index) cancelSetupCountryEdit();
        setupDraftStops.splice(index, 1);
        if (editingSetupStopIndex > index) editingSetupStopIndex -= 1;
        syncSetupCountryDates();
      };

      actions.append(edit, remove);
      row.append(number, body, actions);
      list.append(row);
    });

    const toggle = $("setupToggleCountries");
    if (toggle) toggle.textContent = "＋ Add another country";

    const hint = $("setupTripDatesHint");
    if (hint) {
      const primaryStart = $("startDate")?.value;
      const primaryEnd = $("endDate")?.value;
      const all = [
        ...(primaryStart && primaryEnd ? [{ startDate: primaryStart, endDate: primaryEnd }] : []),
        ...setupDraftStops
      ];
      if (all.length) {
        const starts = all.map(x => x.startDate).filter(Boolean).sort();
        const ends = all.map(x => x.endDate).filter(Boolean).sort();
        hint.textContent = starts.length && ends.length
          ? `Overall trip: ${core.fmtDateWithYear(starts[0])} – ${core.fmtDateWithYear(ends.at(-1))}`
          : "Trip dates will follow your country dates automatically.";
      } else {
        hint.textContent = "Trip dates will follow your country dates automatically.";
      }
    }
  }


  function setCountryPanelMode(editing = false) {
    if ($("setupCountryPanelTitle")) {
      $("setupCountryPanelTitle").textContent = editing ? "Edit country" : "Add another country";
    }
    if ($("setupAddCountry")) {
      $("setupAddCountry").textContent = editing ? "Save Changes" : "Add Country";
    }
  }

  function editSetupCountry(index) {
    const stop = setupDraftStops[index];
    if (!stop) return;

    editingSetupStopIndex = index;
    setCountryPanelMode(true);
    $("setupMultiCountryPanel")?.classList.remove("hidden");

    core.setDestinationValue("setupExtraCountry", stop.country);
    $("setupExtraStart").value = stop.startDate;
    $("setupExtraStart").disabled = true;
    $("setupExtraEnd").value = stop.endDate;
    $("setupExtraEnd").min = stop.startDate;
    $("setupExtraCurrency").value = stop.currency;
    if ($("setupExtraBudget")) $("setupExtraBudget").value = stop.budget > 0 ? stop.budget : "";

    $("setupExtraStart").dispatchEvent(new Event("input", { bubbles: true }));
    $("setupExtraEnd").dispatchEvent(new Event("input", { bubbles: true }));

    setTimeout(() => {
      $("setupMultiCountryPanel")?.scrollIntoView({ behavior: "smooth", block: "center" });
      $("setupExtraCountry")?.focus();
    }, 60);
  }

  function cancelSetupCountryEdit() {
    editingSetupStopIndex = -1;
    setCountryPanelMode(false);
    core.setDestinationValue("setupExtraCountry", "");
    $("setupMultiCountryPanel")?.classList.add("hidden");
  }

  function setSetupExtraDefaults() {
    const lastEnd = setupDraftStops.at(-1)?.endDate || $("endDate")?.value || $("startDate")?.value || core.today();
    const start = lastEnd;
    const end = daysAfter(start, 2);
    $("setupExtraStart").value = start;
    $("setupExtraStart").disabled = true;
    $("setupExtraEnd").value = end;
    $("setupExtraEnd").min = start;
    if ($("setupExtraBudget") && editingSetupStopIndex < 0) $("setupExtraBudget").value = "";
    $("setupExtraStart").dispatchEvent(new Event("input", { bubbles: true }));
    $("setupExtraEnd").dispatchEvent(new Event("input", { bubbles: true }));
  }


  function setupStopDurationDays(stop) {
    if (!stop?.startDate || !stop?.endDate) return 0;
    const [sy, sm, sd] = stop.startDate.split("-").map(Number);
    const [ey, em, ed] = stop.endDate.split("-").map(Number);
    const start = new Date(sy, sm - 1, sd);
    const end = new Date(ey, em - 1, ed);
    return Math.max(0, Math.round((end - start) / 86400000));
  }

  function syncSetupCountryDates() {
    let previousEnd = $("endDate")?.value || "";
    if (!previousEnd) return;

    setupDraftStops.forEach(stop => {
      const duration = setupStopDurationDays(stop);
      stop.startDate = previousEnd;
      stop.endDate = daysAfter(previousEnd, duration);
      previousEnd = stop.endDate;
    });

    renderSetupRoute();
  }

  function addSetupCountry() {
    const country = core.canonicalDestination("setupExtraCountry");
    if (!country) return;

    const startDate = $("setupExtraStart").value;
    const endDate = $("setupExtraEnd").value;
    if (!core.validDates(startDate, endDate)) {
      return core.toast("Country end date must be after its start date");
    }

    const duplicate = setupDraftStops.some((s, i) =>
      i !== editingSetupStopIndex &&
      s.country.toLowerCase() === country.toLowerCase() &&
      s.startDate === startDate
    );
    if (duplicate) return core.toast("That country is already added for those dates");

    const data = {
      id: editingSetupStopIndex >= 0
        ? setupDraftStops[editingSetupStopIndex].id
        : core.uid("stop"),
      country,
      startDate,
      endDate,
      currency: $("setupExtraCurrency").value || setupRouteCurrency(country),
      budget: Number($("setupExtraBudget")?.value || 0),
      createdAt: editingSetupStopIndex >= 0
        ? setupDraftStops[editingSetupStopIndex].createdAt
        : Date.now()
    };

    const wasEditing = editingSetupStopIndex >= 0;
    if (wasEditing) {
      setupDraftStops[editingSetupStopIndex] = data;
    } else {
      setupDraftStops.push(data);
    }

    editingSetupStopIndex = -1;
    setCountryPanelMode(false);
    core.setDestinationValue("setupExtraCountry", "");
    syncSetupCountryDates();

    if (wasEditing) {
      $("setupMultiCountryPanel")?.classList.add("hidden");
      core.toast(`${country} updated`);
    } else {
      setSetupExtraDefaults();
      core.toast(`${country} added`);
    }
  }

  function setupStops() {
    return setupDraftStops.map(s => ({ ...s }));
  }

  function clearSetupStops() {
    setupDraftStops = [];
    editingSetupStopIndex = -1;
    setCountryPanelMode(false);
    renderSetupRoute();
    core.setDestinationValue("setupExtraCountry", "");
    $("setupMultiCountryPanel")?.classList.add("hidden");
  }


  function cleanTravelerName(value) {
    return String(value || "").trim().replace(/\s+/g, " ").slice(0, 50);
  }

  function renderSetupTravelers() {
    const list = $("setupTravelerList");
    if (!list) return;
    list.replaceChildren();

    setupDraftPeople.forEach((person, index) => {
      const row = document.createElement("div");
      row.className = "setup-traveler-item";

      const avatar = document.createElement("span");
      avatar.className = "setup-traveler-avatar";
      avatar.textContent = person.name
        .split(/\s+/)
        .slice(0, 2)
        .map(part => part[0])
        .join("")
        .toUpperCase();

      const body = document.createElement("div");
      const strong = document.createElement("strong");
      strong.textContent = person.name;
      const small = document.createElement("small");
      small.textContent = `Traveler ${index + 2}`;
      body.append(strong, small);

      const actions = document.createElement("div");
      actions.className = "setup-item-actions";

      const edit = document.createElement("button");
      edit.type = "button";
      edit.className = "mini-btn";
      edit.textContent = "Edit";
      edit.onclick = () => editSetupTraveler(index);

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "mini-btn delete";
      remove.textContent = "Remove";
      remove.onclick = () => {
        if (editingSetupPersonIndex === index) cancelSetupTravelerEdit();
        setupDraftPeople.splice(index, 1);
        if (editingSetupPersonIndex > index) editingSetupPersonIndex -= 1;
        renderSetupTravelers();
      };

      actions.append(edit, remove);
      row.append(avatar, body, actions);
      list.append(row);
    });

    const toggle = $("setupToggleTravelers");
    if (toggle) {
      toggle.textContent = setupDraftPeople.length
        ? "＋ Add another"
        : "＋ Add traveler";
    }
  }


  function setTravelerPanelMode(editing = false) {
    if ($("setupTravelerPanelTitle")) {
      $("setupTravelerPanelTitle").textContent = editing ? "Edit traveler" : "Add traveler";
    }
    if ($("setupAddTraveler")) {
      $("setupAddTraveler").textContent = editing ? "Save Changes" : "Add Traveler";
    }
  }

  function editSetupTraveler(index) {
    const person = setupDraftPeople[index];
    if (!person) return;

    editingSetupPersonIndex = index;
    setTravelerPanelMode(true);
    $("setupTravelersPanel")?.classList.remove("hidden");
    $("setupTravelerName").value = person.name;

    setTimeout(() => {
      $("setupTravelersPanel")?.scrollIntoView({ behavior: "smooth", block: "center" });
      $("setupTravelerName")?.focus();
      $("setupTravelerName")?.select();
    }, 60);
  }

  function cancelSetupTravelerEdit() {
    editingSetupPersonIndex = -1;
    setTravelerPanelMode(false);
    if ($("setupTravelerName")) $("setupTravelerName").value = "";
    $("setupTravelersPanel")?.classList.add("hidden");
  }

  function addSetupTraveler() {
    const input = $("setupTravelerName");
    if (!input) return;

    const name = cleanTravelerName(input.value);
    if (!name) return core.toast("Enter a traveler name");

    const ownerName = cleanTravelerName($("ownerName")?.value);
    if (ownerName && ownerName.toLowerCase() === name.toLowerCase()) {
      return core.toast("That is already the first traveler");
    }

    const duplicate = setupDraftPeople.some((person, i) =>
      i !== editingSetupPersonIndex &&
      person.name.toLowerCase() === name.toLowerCase()
    );
    if (duplicate) return core.toast("That traveler is already added");

    const wasEditing = editingSetupPersonIndex >= 0;
    if (wasEditing) {
      setupDraftPeople[editingSetupPersonIndex] = { name };
    } else {
      setupDraftPeople.push({ name });
    }

    editingSetupPersonIndex = -1;
    setTravelerPanelMode(false);
    input.value = "";
    renderSetupTravelers();

    if (wasEditing) {
      $("setupTravelersPanel")?.classList.add("hidden");
      core.toast(`${name} updated`);
    } else {
      core.toast(`${name} added`);
      setTimeout(() => input.focus(), 50);
    }
  }

  function setupPeople() {
    return setupDraftPeople.map(person => ({ ...person }));
  }

  function clearSetupPeople() {
    setupDraftPeople = [];
    editingSetupPersonIndex = -1;
    setTravelerPanelMode(false);
    renderSetupTravelers();
    const input = $("setupTravelerName");
    if (input) input.value = "";
    $("setupTravelersPanel")?.classList.add("hidden");
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
    const ordered = stops().slice().sort((a,b) => (a.startDate || "").localeCompare(b.startDate || ""));
    const active = ordered.filter(s => s.startDate <= date && date <= s.endDate);
    if (active.length) return active.at(-1); // shared transition date belongs to the next country
    if (date < (ordered[0]?.startDate || date)) return ordered[0] || null;
    return ordered.filter(s => s.startDate <= date).at(-1) || ordered[0] || null;
  }

  function sortStops() {
    state().stops.sort((a,b) => (a.startDate || "").localeCompare(b.startDate || "") || a.createdAt - b.createdAt);
  }

  function setHeaderRoute() {
    if (!state().trip || !stops().length) return;
    const names = stops().map(s => `${core.countryFlag(s.country)} ${s.country}`);
    const sub = $("headerSub");
    if (!sub) return;
    if (names.length === 1) return;
    const preview = names.length <= 3 ? names.join(" → ") : `${names[0]} → ${names[1]} → +${names.length - 2} more`;
    sub.textContent = `${names.length} countries • ${preview}`;
  }


  function currentStop() {
    return stopForDate(core.today());
  }

  function stopBudgetState(stop) {
    if (!stop) return { budget: 0, spent: 0, planned: 0, committed: 0, remaining: 0, pct: 0 };
    const budget = Number(stop.budget || 0);
    const actual = stopSpent(stop.id);
    const planned = stopPlanned(stop.id);
    const committed = actual + planned;
    return {
      budget,
      spent: actual,
      planned,
      committed,
      remaining: budget > 0 ? budget - actual : 0,
      pct: budget > 0 ? Math.max(0, Math.min(100, actual / budget * 100)) : 0
    };
  }

  function renderCurrentCountry() {
    const stop = currentStop();
    if (!stop || !state().trip) return;

    const today = core.today();
    const beforeTrip = today < state().trip.startDate;
    const afterTrip = today > state().trip.endDate;
    const status = $("currentCountryStatus");
    const name = $("currentCountryName");
    const dates = $("currentCountryDates");
    const currency = $("currentCountryCurrency");
    const budgetText = $("currentCountryBudgetText");
    const bar = $("currentCountryBudgetBar");

    if (status) status.textContent = beforeTrip
      ? "FIRST COUNTRY • AUTO BY DATE"
      : afterTrip
        ? "LAST COUNTRY • AUTO BY DATE"
        : "CURRENT COUNTRY • AUTO BY DATE";
    if (name) name.textContent = `${core.countryFlag(stop.country)} ${stop.country}`;
    if (dates) dates.textContent = `${core.fmtDateWithYear(stop.startDate)} – ${core.fmtDateWithYear(stop.endDate)}`;
    if (currency) currency.textContent = stop.currency;

    const b = stopBudgetState(stop);
    if (budgetText) {
      budgetText.textContent = b.budget > 0
        ? `${core.money(Math.max(0, b.remaining), state().trip.homeCurrency)} left`
        : "No country budget";
    }
    if (bar) {
      bar.style.width = `${b.pct}%`;
      const rawCountryPct = b.budget > 0 ? (b.spent / b.budget * 100) : 0;
      bar.classList.toggle("budget-watch", rawCountryPct >= 80 && rawCountryPct <= 100);
      bar.classList.toggle("budget-over", rawCountryPct > 100);
    }

    const rail = $("tripFlagRail");
    if (rail) {
      rail.replaceChildren();
      stops().forEach(tripStop => {
        const flag = document.createElement("span");
        flag.className = "trip-flag";
        flag.classList.toggle("active", tripStop.id === stop.id);
        flag.textContent = core.countryFlag(tripStop.country);
        flag.title = tripStop.country;
        rail.append(flag);
      });
    }
  }

  function renderCountryBudgets() {
    const list = $("countryBudgetList");
    const summary = $("countryBudgetSummary");
    const section = $("countryBudgetSection");
    if (!list || !summary || !state().trip) return;

    list.replaceChildren();

    // Country 1's budget is already shown in the current-country card.
    // The horizontal country strip only adds value on multi-country trips.
    if (section) section.classList.toggle("hidden", stops().length <= 1);
    if (stops().length <= 1) return;

    const home = state().trip.homeCurrency;
    const allocated = stops().reduce((sum, stop) => sum + Number(stop.budget || 0), 0);
    const tripBudget = Number(state().trip.budget || 0);
    const allocationDiff = tripBudget - allocated;

    if (allocated <= 0) {
      summary.className = "country-budget-summary neutral";
      summary.textContent = "Tap a country to set its budget.";
    } else if (Math.abs(allocationDiff) < 0.000001) {
      summary.className = "country-budget-summary good";
      summary.textContent = "Trip budget fully allocated.";
    } else if (allocationDiff > 0) {
      summary.className = "country-budget-summary neutral";
      summary.textContent = `${core.money(allocationDiff, home)} still unallocated.`;
    } else {
      summary.className = "country-budget-summary warn";
      summary.textContent = `${core.money(Math.abs(allocationDiff), home)} over-allocated.`;
    }

    stops().forEach(stop => {
      const b = stopBudgetState(stop);
      const row = document.createElement("button");
      row.type = "button";
      row.className = "country-budget-row v6-country-chip";

      const top = document.createElement("div");
      top.className = "country-budget-row-top";

      const label = document.createElement("div");
      const strong = document.createElement("strong");
      strong.textContent = `${core.countryFlag(stop.country)} ${stop.country}`;
      const small = document.createElement("small");
      small.textContent = `${stop.currency} • ${core.fmtDate(stop.startDate)}–${core.fmtDate(stop.endDate)}`;
      label.append(strong, small);

      const amount = document.createElement("strong");
      amount.className = b.budget > 0 && b.remaining < 0 ? "country-over-budget" : "";
      amount.textContent = b.budget > 0
        ? (b.remaining >= 0
            ? `${core.money(b.remaining, home)} left`
            : `${core.money(Math.abs(b.remaining), home)} over`)
        : "Set budget";

      top.append(label, amount);

      const track = document.createElement("div");
      track.className = "country-budget-track";
      const fill = document.createElement("div");
      fill.className = "country-budget-fill";
      fill.style.width = `${b.pct}%`;
      track.append(fill);

      row.append(top, track);
      row.onclick = () => setCountryBudget(stop.id);
      list.append(row);
    });
  }

  function setCountryBudget(stopId) {
    const stop = stopById(stopId);
    if (!stop) return;
    const current = Number(stop.budget || 0);
    const response = prompt(
      `Budget for ${stop.country} (${state().trip.homeCurrency})`,
      current > 0 ? String(current) : ""
    );
    if (response === null) return;

    const value = Number(response);
    if (!Number.isFinite(value) || value < 0) return core.toast("Enter a valid country budget");
    stop.budget = value;
    core.save();
    core.render();
    core.toast(`${stop.country} budget updated`);
  }


  function renderV6NextDestination() {
    const button = $("v6PlanRow");
    const label = $("v6PlanLabel");
    const name = $("v6NextCountry");
    const dates = $("v6NextCountryDates");
    if (!button || !name || !dates || !state().trip) return;

    const ordered = stops().slice().sort((a,b) =>
      (a.startDate || "").localeCompare(b.startDate || "")
    );
    const today = core.today();

    let next = ordered.find(stop => stop.startDate > today);

    if (!next && today < state().trip.startDate) {
      next = ordered[0] || null;
    }

    if (next) {
      if (label) label.textContent = today < state().trip.startDate ? "FIRST DESTINATION" : "NEXT DESTINATION";
      name.textContent = `${core.countryFlag(next.country)} ${next.country}`;
      dates.textContent = `${core.fmtDateWithYear(next.startDate)} • ${next.currency}`;
    } else {
      const current = stopForDate(today);
      if (label) label.textContent = today > state().trip.endDate ? "TRIP COMPLETE" : "TRIP PLAN";
      name.textContent = today > state().trip.endDate ? "Trip complete" : (current ? `${core.countryFlag(current.country)} ${current.country}` : "View trip");
      dates.textContent = today > state().trip.endDate
        ? `${core.fmtDateWithYear(state().trip.startDate)} – ${core.fmtDateWithYear(state().trip.endDate)}`
        : "View countries & planned costs";
    }
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
        chip.textContent = `${i + 1}. ${core.countryFlag(s.country)} ${s.country} · ${s.currency}`;
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
      strong.textContent = `${core.countryFlag(s.country)} ${s.country}`;
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

      const budgetBtn = document.createElement("button");
      budgetBtn.className = "mini-btn";
      budgetBtn.type = "button";
      budgetBtn.textContent = budget > 0 ? "Edit budget" : "Set budget";
      budgetBtn.onclick = () => setCountryBudget(s.id);
      actions.append(budgetBtn);

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
      o.textContent = `${core.countryFlag(s.country)} ${s.country} • ${s.currency}`;
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
      meta.textContent = `${core.fmtDateLong(p.date)}${stop ? ` • ${core.countryFlag(stop.country)} ${stop.country}` : ""} • ${p.category}`;
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
    const summaryEl = $("settlementPeopleSummary");
    const warningEl = $("settlementWarning");
    const personalInfoEl = $("settlementPersonalInfo");
    if (!el || !summaryEl || !state().trip) return;

    el.replaceChildren();
    summaryEl.replaceChildren();

    if (warningEl) {
      warningEl.classList.add("hidden");
      warningEl.textContent = "";
    }
    if (personalInfoEl) {
      personalInfoEl.classList.add("hidden");
      personalInfoEl.textContent = "";
    }

    const paid = new Map();
    const shares = new Map();
    const net = new Map();

    state().people.forEach(person => {
      paid.set(person.id, 0);
      shares.set(person.id, 0);
      net.set(person.id, 0);
    });

    let trackedAmount = 0;
    let untrackedAmount = 0;
    let untrackedCount = 0;
    let selfPersonalAmount = 0;
    let selfPersonalCount = 0;

    state().expenses.forEach(expense => {
      const amount = Number(expense.homeAmount || 0);
      const payer = expense.paidByPersonId ? personById(expense.paidByPersonId) : null;
      const expenseShares = Array.isArray(expense.personShares) ? expense.personShares : [];
      const type = expense.expenseType === "shared" || expense.expenseType === "personal"
        ? expense.expenseType
        : (expenseShares.length <= 1 ? "personal" : "shared");

      if (!payer || !expenseShares.length) {
        untrackedAmount += amount;
        untrackedCount += 1;
        return;
      }

      // Personal expense paid by that same traveler: it is real spending,
      // but nobody owes anybody, so keep it out of settlement entirely.
      const isSelfPaidPersonal =
        type === "personal" &&
        expenseShares.length === 1 &&
        expenseShares[0].personId === payer.id;

      if (isSelfPaidPersonal) {
        selfPersonalAmount += amount;
        selfPersonalCount += 1;
        return;
      }

      trackedAmount += amount;
      paid.set(payer.id, (paid.get(payer.id) || 0) + amount);

      expenseShares.forEach(share => {
        if (!personById(share.personId)) return;
        shares.set(share.personId, (shares.get(share.personId) || 0) + Number(share.amount || 0));
      });
    });

    state().people.forEach(person => {
      net.set(person.id, (paid.get(person.id) || 0) - (shares.get(person.id) || 0));
    });

    const visiblePeople = state().people
      .filter(person => person.active !== false || Math.abs(net.get(person.id) || 0) > 0.000001)
      .sort((a, b) => {
        const av = Math.abs(net.get(a.id) || 0);
        const bv = Math.abs(net.get(b.id) || 0);
        return bv - av || a.name.localeCompare(b.name);
      });

    visiblePeople.forEach(person => {
      const paidAmount = paid.get(person.id) || 0;
      const shareAmount = shares.get(person.id) || 0;
      const balance = net.get(person.id) || 0;

      const row = document.createElement("div");
      row.className = "settlement-person-row";

      const identity = document.createElement("div");
      identity.className = "settlement-person-identity";

      const avatar = document.createElement("span");
      avatar.className = "settlement-avatar";
      avatar.textContent = (person.name || "?")
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(part => part[0])
        .join("")
        .toUpperCase();

      const name = document.createElement("div");
      const strong = document.createElement("strong");
      strong.textContent = person.name;
      const small = document.createElement("small");
      small.textContent = `Group paid ${core.money(paidAmount, state().trip.homeCurrency)} • Group share ${core.money(shareAmount, state().trip.homeCurrency)}`;
      name.append(strong, small);
      identity.append(avatar, name);

      const result = document.createElement("div");
      result.className = "settlement-person-balance";

      const resultLabel = document.createElement("small");
      const resultAmount = document.createElement("strong");

      if (balance > 0.000001) {
        result.classList.add("receives");
        resultLabel.textContent = "Should receive";
        resultAmount.textContent = core.money(balance, state().trip.homeCurrency);
      } else if (balance < -0.000001) {
        result.classList.add("owes");
        resultLabel.textContent = "Owes";
        resultAmount.textContent = core.money(Math.abs(balance), state().trip.homeCurrency);
      } else {
        result.classList.add("settled");
        resultLabel.textContent = "Group balance";
        resultAmount.textContent = "Settled";
      }

      result.append(resultLabel, resultAmount);
      row.append(identity, result);
      summaryEl.append(row);
    });

    if (trackedAmount <= 0) {
      el.innerHTML = '<div class="empty-state"><strong>No group debts yet</strong><span>Personal expenses paid by the same person do not create debt. Shared expenses, or personal expenses paid for someone else, will appear here.</span></div>';
    } else {
      const eps = 0.000001;
      const creditors = [...net]
        .filter(([,value]) => value > eps)
        .map(([id,value]) => ({ id, amount: value }))
        .sort((a,b) => b.amount - a.amount);

      const debtors = [...net]
        .filter(([,value]) => value < -eps)
        .map(([id,value]) => ({ id, amount: -value }))
        .sort((a,b) => b.amount - a.amount);

      const settlements = [];
      let i = 0, j = 0;

      while (i < debtors.length && j < creditors.length) {
        const amount = Math.min(debtors[i].amount, creditors[j].amount);

        if (amount > eps) {
          settlements.push({
            from: debtors[i].id,
            to: creditors[j].id,
            amount
          });
        }

        debtors[i].amount -= amount;
        creditors[j].amount -= amount;

        if (debtors[i].amount <= eps) i += 1;
        if (creditors[j].amount <= eps) j += 1;
      }

      if (!settlements.length) {
        el.innerHTML = '<div class="settled-message">✓ Everyone is settled up.</div>';
      } else {
        settlements.forEach(settlement => {
          const row = document.createElement("div");
          row.className = "settlement-row settlement-payment-row";

          const from = personById(settlement.from)?.name || "Traveler";
          const to = personById(settlement.to)?.name || "Traveler";

          const text = document.createElement("div");
          text.className = "settlement-payment-copy";

          const strongFrom = document.createElement("strong");
          strongFrom.textContent = from;

          const arrow = document.createElement("span");
          arrow.className = "settlement-transfer-arrow";
          arrow.textContent = "→";

          const strongTo = document.createElement("strong");
          strongTo.textContent = to;

          const label = document.createElement("small");
          label.textContent = `${from} pays ${to}`;

          const names = document.createElement("div");
          names.append(strongFrom, arrow, strongTo);
          text.append(names, label);

          const amount = document.createElement("strong");
          amount.className = "settlement-payment-amount";
          amount.textContent = core.money(settlement.amount, state().trip.homeCurrency);

          row.append(text, amount);
          el.append(row);
        });
      }
    }

    if (personalInfoEl && selfPersonalCount > 0) {
      personalInfoEl.textContent =
        `${selfPersonalCount} self-paid personal expense${selfPersonalCount === 1 ? "" : "s"} (${core.money(selfPersonalAmount, state().trip.homeCurrency)}) still count toward trip spending and budgets, but are correctly excluded from group debts.`;
      personalInfoEl.classList.remove("hidden");
    }

    if (warningEl && untrackedCount > 0) {
      warningEl.textContent =
        `${untrackedCount} expense${untrackedCount === 1 ? "" : "s"} (${core.money(untrackedAmount, state().trip.homeCurrency)}) are not included because the payer or beneficiary is missing.`;
      warningEl.classList.remove("hidden");
    }
  }

  function fillExpenseStop(selectedId = "") {
    const select = $("expenseStop");
    if (!select) return;
    select.replaceChildren();

    stops().forEach(s => {
      const o = document.createElement("option");
      o.value = s.id;
      o.textContent = `${core.countryFlag(s.country)} ${s.country} • ${s.currency}`;
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
    blank.textContent = "No payer (exclude settlement)";
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


  function fillPersonalExpenseFor(selectedId = "") {
    const select = $("personalExpenseFor");
    if (!select) return;
    select.replaceChildren();

    const active = people();
    const validIds = new Set(active.map(person => person.id));

    if (selectedId && !validIds.has(selectedId)) {
      const archived = personById(selectedId);
      if (archived) {
        const option = document.createElement("option");
        option.value = archived.id;
        option.textContent = `${archived.name} (archived)`;
        select.append(option);
      }
    }

    active.forEach(person => {
      const option = document.createElement("option");
      option.value = person.id;
      option.textContent = person.name;
      select.append(option);
    });

    const payer = $("expensePaidBy")?.value;
    select.value = selectedId && personById(selectedId)
      ? selectedId
      : (payer && personById(payer) ? payer : (active[0]?.id || ""));
  }

  function setExpenseType(type, { preserveSelection = false } = {}) {
    currentExpenseType = type === "shared" ? "shared" : "personal";

    $("expenseTypePersonal")?.classList.toggle("active", currentExpenseType === "personal");
    $("expenseTypeShared")?.classList.toggle("active", currentExpenseType === "shared");
    $("personalExpenseForWrap")?.classList.toggle("hidden", currentExpenseType !== "personal");
    $("sharedExpenseForWrap")?.classList.toggle("hidden", currentExpenseType !== "shared");

    const help = $("expenseTypeHelp");
    if (help) {
      help.textContent = currentExpenseType === "personal"
        ? "Counts toward trip and country budgets. If the same traveler pays for themselves, it creates no debt."
        : "Choose everyone who shared this expense. TripSpend divides the cost equally between them.";
    }

    if (!preserveSelection) {
      if (currentExpenseType === "personal") {
        fillPersonalExpenseFor($("expensePaidBy")?.value || "");
      } else {
        const checked = selectedExpenseForIds();
        if (!checked.length) {
          renderExpenseFor(people().map(person => person.id));
        }
      }
    }
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


  function setSmartExpenseAdvanced(open, { scroll = false } = {}) {
    const fields = $("expenseAdvancedFields");
    const button = $("expenseMoreOptions");
    const arrow = $("expenseMoreOptionsArrow");
    if (!fields || !button) return;

    fields.classList.toggle("hidden", !open);
    button.classList.toggle("open", open);
    button.childNodes[0].nodeValue = open ? "Fewer options " : "More options ";
    if (arrow) arrow.textContent = open ? "⌃" : "⌄";

    if (open && scroll) {
      setTimeout(() => fields.scrollIntoView({ behavior: "smooth", block: "nearest" }), 50);
    }
  }

  function smartExpenseAdvancedOpen() {
    return !$("expenseAdvancedFields")?.classList.contains("hidden");
  }

  function updateSmartExpenseSummary() {
    const stop = stopById($("expenseStop")?.value) || stopForDate($("expenseDate")?.value);
    const payer = personById($("expensePaidBy")?.value);
    const summary = $("expenseAutoSummaryText");
    if (!summary) return;

    if (currentExpenseType === "personal") {
      const beneficiary = personById($("personalExpenseFor")?.value);
      const payerName = payer?.name || "No payer";
      const beneficiaryName = beneficiary?.name || "Traveler";
      const debtText = payer && beneficiary && payer.id !== beneficiary.id
        ? `${beneficiaryName} will owe ${payerName}`
        : "No group debt";
      summary.textContent = `${stop ? `${core.countryFlag(stop.country)} ${stop.country}` : "Country"} • ${payerName} paid • for ${beneficiaryName} • ${debtText}`;
    } else {
      const ids = selectedExpenseForIds();
      const names = ids.map(id => personById(id)?.name).filter(Boolean);
      const peopleText = names.length
        ? (names.length <= 2 ? names.join(" + ") : `${names.slice(0,2).join(" + ")} +${names.length - 2}`)
        : "Nobody selected";
      summary.textContent = `${stop ? `${core.countryFlag(stop.country)} ${stop.country}` : "Country"} • ${payer?.name || "No payer"} paid • shared with ${peopleText}`;
    }
  }

  function prepareSmartExpenseUI({ existing = false, isRepeat = false } = {}) {
    // Editing should expose all details. New and repeated expenses stay fast.
    setSmartExpenseAdvanced(existing);

    // If a fresh rate could not be loaded, reveal details automatically so the
    // user immediately sees what is required to save.
    const currency = $("expenseCurrency")?.value;
    const rate = Number($("exchangeRate")?.value || 0);
    if (!existing && currency && currency !== state().trip.homeCurrency && !(rate > 0)) {
      setSmartExpenseAdvanced(true);
    }

    updateSmartExpenseSummary();
  }

  window.TripSpendV61 = {
    prepareSmartExpenseUI
  };

  async function prepareExpense(source) {
    preparedSource = source || null;
    const prefs = state().preferences || {};
    const selected = (source?.personShares || []).map(s => s.personId);
    const payer = source?.paidByPersonId || prefs.lastPaidByPersonId || "";

    fillPaidBy(payer);

    const inferredType = source?.expenseType === "shared" || source?.expenseType === "personal"
      ? source.expenseType
      : (selected.length > 1 ? "shared" : "personal");

    if (inferredType === "shared") {
      renderExpenseFor(selected.length ? selected : people().map(person => person.id));
      fillPersonalExpenseFor(selected[0] || payer);
    } else {
      fillPersonalExpenseFor(selected[0] || payer || people()[0]?.id || "");
      renderExpenseFor([]);
    }
    setExpenseType(inferredType, { preserveSelection: true });

    const datedStop = stopForDate($("expenseDate")?.value);
    const selectedStop = source?.stopId
      ? stopById(source.stopId)
      : (datedStop || stops()[0] || null);

    fillExpenseStop(selectedStop?.id || "");

    if (!source && selectedStop) {
      const currency = $("expenseCurrency");
      if (currency && currency.value !== selectedStop.currency) {
        currency.value = selectedStop.currency;
        currency.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }

    updateQuickExpenseContext();

    // Use the most recent stored/manual rate immediately. If there is no rate,
    // silently ask the live/cached FX layer and fill it when available.
    const currency = $("expenseCurrency")?.value;
    if (!source && currency && currency !== state().trip.homeCurrency && !$("exchangeRate")?.value) {
      try {
        const info = await window.TripSpendFX?.fetchRate?.(state().trip.homeCurrency, currency);
        if (info?.rate > 0 && !$("exchangeRate").value) {
          $("exchangeRate").value = Number(info.rate).toPrecision(8).replace(/0+$/,"").replace(/\.$/,"");
          $("exchangeRate").dispatchEvent(new Event("input", { bubbles: true }));
          if ($("liveRateStatus")) {
            $("liveRateStatus").textContent = info.source === "live"
              ? `Latest available rate loaded automatically (${info.date || "today"}).`
              : "Saved offline rate loaded automatically.";
          }
        }
      } catch {
        // Manual rate entry remains available.
      }
    }

    updateQuickExpenseContext();
    updateSmartExpenseSummary();
  }

  function updateQuickExpenseContext() {
    const stop = stopById($("expenseStop")?.value) || stopForDate($("expenseDate")?.value);
    const payment = $("paymentMethod")?.value || state().preferences?.lastPaymentMethod || "";
    const currency = $("expenseCurrency")?.value || stop?.currency || "";
    const rate = Number($("exchangeRate")?.value || 0);

    if ($("quickCountryText")) $("quickCountryText").textContent = stop ? `${core.countryFlag(stop.country)} ${stop.country} · ${currency}` : `📍 ${currency}`;
    if ($("quickPaymentText")) $("quickPaymentText").textContent = payment ? `💳 ${payment}` : "💳 Payment";
    if ($("quickRateText")) {
      $("quickRateText").textContent = currency === state().trip.homeCurrency
        ? "✓ No conversion"
        : rate > 0 ? "✓ Rate ready" : "↻ Rate needed";
      $("quickRateText").classList.toggle("needs-rate", currency !== state().trip.homeCurrency && !(rate > 0));
    }
    updateSmartExpenseSummary();
  }

  function expenseData(homeAmount) {
    const amount = Number(homeAmount || 0);

    if (currentExpenseType === "personal") {
      const beneficiaryId = $("personalExpenseFor")?.value || "";
      if (!beneficiaryId) {
        return { __error: "Choose who this personal expense is for" };
      }

      return {
        expenseType: "personal",
        paidByPersonId: $("expensePaidBy")?.value || "",
        stopId: $("expenseStop")?.value || "",
        planId: preparedSource?.planId || "",
        personShares: [{ personId: beneficiaryId, amount }]
      };
    }

    const ids = selectedExpenseForIds();
    if (!ids.length) {
      return { __error: "Select at least one traveler for this shared expense" };
    }

    const each = amount / ids.length;

    return {
      expenseType: "shared",
      paidByPersonId: $("expensePaidBy")?.value || "",
      stopId: $("expenseStop")?.value || "",
      planId: preparedSource?.planId || "",
      personShares: ids.map(id => ({ personId: id, amount: each }))
    };
  }

  function showDashboardTravelerForm(show = true) {
    const form = $("dashboardTravelerForm");
    const input = $("dashboardTravelerName");
    if (!form) return;

    form.classList.toggle("hidden", !show);
    if (show) {
      input.value = "";
      setTimeout(() => input.focus(), 60);
    }
  }

  function addDashboardTraveler(name) {
    const clean = String(name || "").trim().replace(/\s+/g, " ").slice(0, 50);
    if (!clean) return core.toast("Enter a traveler name");

    const duplicate = state().people.some(
      p => p.active !== false && p.name.trim().toLowerCase() === clean.toLowerCase()
    );
    if (duplicate) return core.toast("That traveler is already in this trip");

    state().people.push(core.makePerson(clean));
    core.save();
    core.render();
    showDashboardTravelerForm(false);
    core.toast(`${clean} added`);
  }

  function renderSettingsCountrySummary() {
    const countrySummary = $("settingsCountrySummary");
    if (!countrySummary) return;

    const count = stops().length;
    const names = stops().map(s => s.country).filter(Boolean);
    countrySummary.textContent = count === 1
      ? `1 country • ${names[0] || ""}`
      : `${count} countries • ${names.slice(0, 3).join(" → ")}${count > 3 ? ` → +${count - 3} more` : ""}`;
  }

  function renderFeaturePage(id) {
    if (!state().trip) return;

    if (id === "plan") {
      renderPlannerSummary();
      renderStops();
      renderPlanStopOptions();
      renderPlannedCosts();
    }

    if (id === "analytics") {
      renderSettlement();
    }

    if (id === "settings") {
      renderSettingsCountrySummary();
    }
  }

  function renderAll(event) {
    ensureV5Data();
    setHeaderRoute();

    // Home-critical information stays fresh.
    renderCurrentCountry();
    renderCountryBudgets();
    renderV6NextDestination();

    // Heavy planner/settlement DOM is built only when that page is visible.
    const activePage =
      event?.detail?.activePage ||
      document.querySelector(".page.active")?.id ||
      "dashboard";

    renderFeaturePage(activePage);
  }

  window.TripSpendV5 = {
    prepareExpense,
    expenseData,
    setupStops,
    clearSetupStops,
    setupPeople,
    clearSetupPeople
  };



  // Optional travelers during initial trip setup.
  $("setupToggleTravelers")?.addEventListener("click", () => {
    const panel = $("setupTravelersPanel");
    if (!panel) return;

    if (panel.classList.contains("hidden")) {
      editingSetupPersonIndex = -1;
      setTravelerPanelMode(false);
      if ($("setupTravelerName")) $("setupTravelerName").value = "";
      panel.classList.remove("hidden");
      setTimeout(() => $("setupTravelerName")?.focus(), 60);
    } else {
      cancelSetupTravelerEdit();
    }
  });

  $("setupAddTraveler")?.addEventListener("click", addSetupTraveler);

  $("setupTravelerName")?.addEventListener("keydown", event => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    addSetupTraveler();
  });

  // Optional additional countries during initial trip setup.
  core.opts($("setupExtraCurrency"), core.CURS, "USD");

  $("startDate")?.addEventListener("change", () => {
    const start = $("startDate").value;
    const end = $("endDate").value;
    if (start) $("endDate").min = start;
    if (start && (!end || end < start)) {
      $("endDate").value = daysAfter(start, 2);
      $("endDate").dispatchEvent(new Event("input", { bubbles: true }));
    }
    renderSetupRoute();
  });

  $("endDate")?.addEventListener("change", () => {
    const start = $("startDate").value;
    const end = $("endDate").value;
    if (start && end && end < start) {
      $("endDate").value = start;
      $("endDate").dispatchEvent(new Event("input", { bubbles: true }));
      core.toast("End date adjusted to match the start date");
    }
    syncSetupCountryDates();
  });

  $("setupExtraStart")?.addEventListener("change", () => {
    const previousEnd = editingSetupStopIndex > 0
      ? setupDraftStops[editingSetupStopIndex - 1]?.endDate
      : $("endDate")?.value;
    if (previousEnd) $("setupExtraStart").value = previousEnd;

    const start = $("setupExtraStart").value;
    const end = $("setupExtraEnd").value;
    if (start) $("setupExtraEnd").min = start;
    if (start && (!end || end < start)) {
      $("setupExtraEnd").value = daysAfter(start, 2);
      $("setupExtraEnd").dispatchEvent(new Event("input", { bubbles: true }));
    }
  });

  $("setupExtraEnd")?.addEventListener("change", () => {
    const start = $("setupExtraStart").value;
    const end = $("setupExtraEnd").value;
    if (start && end && end < start) {
      $("setupExtraEnd").value = start;
      $("setupExtraEnd").dispatchEvent(new Event("input", { bubbles: true }));
      core.toast("End date adjusted to match the start date");
    }
  });
  core.initDestinationAutocomplete("setupExtraCountry", "setupExtraCountryOptions", "");

  bindDateDisplay("setupExtraStart", "setupExtraStartDisplay", true);
  bindDateDisplay("setupExtraEnd", "setupExtraEndDisplay", true);
  bindDateDisplay("newStopStart", "newStopStartDisplay", true);
  bindDateDisplay("newStopEnd", "newStopEndDisplay", true);
  bindDateDisplay("planDate", "planDateDisplay", true);

  $("setupToggleCountries")?.addEventListener("click", () => {
    const panel = $("setupMultiCountryPanel");
    if (!panel) return;

    if (panel.classList.contains("hidden")) {
      editingSetupStopIndex = -1;
      setCountryPanelMode(false);
      core.setDestinationValue("setupExtraCountry", "");
      setSetupExtraDefaults();
      panel.classList.remove("hidden");
      setTimeout(() => $("setupExtraCountry")?.focus(), 80);
    } else {
      cancelSetupCountryEdit();
    }
  });

  $("destination")?.addEventListener("change", () => {
    const exact = core.DESTS.find(c => c.toLowerCase() === $("destination").value.trim().toLowerCase());
    if (exact && $("tripCurrency")) $("tripCurrency").value = setupRouteCurrency(exact);
  });

  $("setupExtraCountry")?.addEventListener("change", () => {
    const exact = core.DESTS.find(c => c.toLowerCase() === $("setupExtraCountry").value.trim().toLowerCase());
    if (exact) $("setupExtraCurrency").value = setupRouteCurrency(exact);
  });

  $("setupAddCountry")?.addEventListener("click", addSetupCountry);




  // v6.1 smart expense details.
  $("expenseMoreOptions")?.addEventListener("click", () => {
    setSmartExpenseAdvanced(!smartExpenseAdvancedOpen(), { scroll: true });
  });

  $("expenseAutoSummary")?.addEventListener("click", () => {
    setSmartExpenseAdvanced(true, { scroll: true });
  });

  $("personalExpenseFor")?.addEventListener("change", updateSmartExpenseSummary);
  $("expenseForPeople")?.addEventListener("change", updateSmartExpenseSummary);

  // Simpler settlement: final payments first, accounting details on demand.
  $("settlementDetailsToggle")?.addEventListener("click", () => {
    const details = $("settlementDetails");
    const button = $("settlementDetailsToggle");
    const arrow = $("settlementDetailsArrow");
    if (!details || !button) return;

    const open = details.classList.contains("hidden");
    details.classList.toggle("hidden", !open);
    button.childNodes[0].nodeValue = open ? "Hide calculation details " : "Show calculation details ";
    if (arrow) arrow.textContent = open ? "⌃" : "⌄";
  });

  // If the app stays open across midnight, or resumes on a new day, refresh
  // the current country automatically.
  let lastAutomaticCountryDay = core.today();
  function refreshAutomaticCountryIfNeeded() {
    const day = core.today();
    if (day !== lastAutomaticCountryDay) {
      lastAutomaticCountryDay = day;
      core.render();
    }
  }

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) refreshAutomaticCountryIfNeeded();
  });
  window.addEventListener("focus", refreshAutomaticCountryIfNeeded);
  setInterval(refreshAutomaticCountryIfNeeded, 60000);

  // Personal vs Shared expense behavior.
  $("expenseTypePersonal")?.addEventListener("click", () => {
    setExpenseType("personal");
    updateSmartExpenseSummary();
  });
  $("expenseTypeShared")?.addEventListener("click", () => {
    setExpenseType("shared");
    updateSmartExpenseSummary();
  });

  $("expensePaidBy")?.addEventListener("change", () => {
    if (currentExpenseType === "personal") {
      const currentFor = $("personalExpenseFor")?.value;
      const oldPayer = $("personalExpenseFor")?.dataset.lastPayer || "";
      const newPayer = $("expensePaidBy")?.value || "";

      // If the personal beneficiary was following the payer, keep following it.
      if (!currentFor || currentFor === oldPayer) {
        fillPersonalExpenseFor(newPayer);
      }
      if ($("personalExpenseFor")) $("personalExpenseFor").dataset.lastPayer = newPayer;
    }
    updateQuickExpenseContext();
    updateSmartExpenseSummary();
  });

  // Quick traveler management from Home dashboard.
  $("dashboardAddTraveler")?.addEventListener("click", () => {
    showDashboardTravelerForm(true);
    $("dashboardTravelerForm")?.scrollIntoView({ behavior: "smooth", block: "center" });
  });

  $("dashboardTravelerCancel")?.addEventListener("click", () => {
    showDashboardTravelerForm(false);
  });

  $("dashboardTravelerForm")?.addEventListener("submit", e => {
    e.preventDefault();
    addDashboardTraveler($("dashboardTravelerName")?.value);
  });


  $("setupCancelCountry")?.addEventListener("click", cancelSetupCountryEdit);
  $("setupCancelTraveler")?.addEventListener("click", cancelSetupTravelerEdit);


  $("paymentMethod")?.addEventListener("change", updateQuickExpenseContext);
  $("exchangeRate")?.addEventListener("input", updateQuickExpenseContext);
  $("expenseCurrency")?.addEventListener("change", updateQuickExpenseContext);

  // Planner navigation
  $("openPlan")?.addEventListener("click", () => core.page("plan"));
  $("countryBudgetManage")?.addEventListener("click", () => core.page("plan"));
  $("v6PlanRow")?.addEventListener("click", () => core.page("plan"));
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
    const nextStart = last?.endDate || state().trip.startDate;
    $("newStopStart").value = nextStart;
    $("newStopEnd").value = daysAfter(nextStart, 2);
    $("newStopEnd").min = nextStart;
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
    updateQuickExpenseContext();
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
    updateQuickExpenseContext();
  });

  // Planner form sensible defaults.
  if ($("newStopStart")) {
    const lastStop = stops().slice().sort((a,b) => (a.startDate || "").localeCompare(b.startDate || "")).at(-1);
    const nextStart = lastStop?.endDate || state().trip?.startDate || core.today();
    $("newStopStart").value = nextStart;
    $("newStopEnd").value = daysAfter(nextStart, 2);
    $("newStopEnd").min = nextStart;
  }
  if ($("planDate")) $("planDate").value = core.today();
  $("newStopStart")?.dispatchEvent(new Event("input", { bubbles: true }));
  $("newStopEnd")?.dispatchEvent(new Event("input", { bubbles: true }));
  $("planDate")?.dispatchEvent(new Event("input", { bubbles: true }));

  renderSetupRoute();
  renderSetupTravelers();

  window.addEventListener("tripspend:render", renderAll);
  window.addEventListener("tripspend:page", event => renderFeaturePage(event.detail?.id));
  renderAll();
})();