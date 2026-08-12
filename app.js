(() => {
  "use strict";

  const APP_VERSION = "6.5.2";
  const APP_BOOT_STARTED = performance.now();
  const DB_NAME = "tripspend.db";
  const DB_VERSION = 1;
  const DB_STATE_STORE = "state";
  const DB_BACKUP_STORE = "backups";
  const DB_META_STORE = "meta";
  const STORAGE_SAVE_DELAY = 140;
  const MAX_DAILY_BACKUPS = 7;

  let storageDB = null;
  let storageMode = "starting";
  let storagePersistent = false;
  let storageSaveTimer = 0;
  let pendingStorageSnapshot = null;
  let lastStorageWriteAt = 0;
  let appStartupMs = 0;
  let lastRenderMs = 0;


  const KEY = "tripspend.v1";
  const CURS = ["OMR","AED","SAR","QAR","KWD","BHD","USD","EUR","GBP","THB","IDR","JPY","MYR","SGD","INR","TRY","CHF","AUD","CAD","NZD","CNY","KRW","PHP","VND"];
  const DESTS = ["Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cambodia", "Cameroon", "Canada", "Cape Verde", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic", "Democratic Republic of the Congo", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Ivory Coast", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Republic of the Congo", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe", "Multiple countries / Other"];
  const COUNTRY_CODES = {"Afghanistan":"AF","Albania":"AL","Algeria":"DZ","Andorra":"AD","Angola":"AO","Antigua and Barbuda":"AG","Argentina":"AR","Armenia":"AM","Australia":"AU","Austria":"AT","Azerbaijan":"AZ","Bahamas":"BS","Bahrain":"BH","Bangladesh":"BD","Barbados":"BB","Belarus":"BY","Belgium":"BE","Belize":"BZ","Benin":"BJ","Bhutan":"BT","Bolivia":"BO","Bosnia and Herzegovina":"BA","Botswana":"BW","Brazil":"BR","Brunei":"BN","Bulgaria":"BG","Burkina Faso":"BF","Burundi":"BI","Cambodia":"KH","Cameroon":"CM","Canada":"CA","Cape Verde":"CV","Central African Republic":"CF","Chad":"TD","Chile":"CL","China":"CN","Colombia":"CO","Comoros":"KM","Costa Rica":"CR","Croatia":"HR","Cuba":"CU","Cyprus":"CY","Czech Republic":"CZ","Democratic Republic of the Congo":"CD","Denmark":"DK","Djibouti":"DJ","Dominica":"DM","Dominican Republic":"DO","Ecuador":"EC","Egypt":"EG","El Salvador":"SV","Equatorial Guinea":"GQ","Eritrea":"ER","Estonia":"EE","Eswatini":"SZ","Ethiopia":"ET","Fiji":"FJ","Finland":"FI","France":"FR","Gabon":"GA","Gambia":"GM","Georgia":"GE","Germany":"DE","Ghana":"GH","Greece":"GR","Grenada":"GD","Guatemala":"GT","Guinea":"GN","Guinea-Bissau":"GW","Guyana":"GY","Haiti":"HT","Honduras":"HN","Hungary":"HU","Iceland":"IS","India":"IN","Indonesia":"ID","Iran":"IR","Iraq":"IQ","Ireland":"IE","Israel":"IL","Italy":"IT","Ivory Coast":"CI","Jamaica":"JM","Japan":"JP","Jordan":"JO","Kazakhstan":"KZ","Kenya":"KE","Kiribati":"KI","Kuwait":"KW","Kyrgyzstan":"KG","Laos":"LA","Latvia":"LV","Lebanon":"LB","Lesotho":"LS","Liberia":"LR","Libya":"LY","Liechtenstein":"LI","Lithuania":"LT","Luxembourg":"LU","Madagascar":"MG","Malawi":"MW","Malaysia":"MY","Maldives":"MV","Mali":"ML","Malta":"MT","Marshall Islands":"MH","Mauritania":"MR","Mauritius":"MU","Mexico":"MX","Micronesia":"FM","Moldova":"MD","Monaco":"MC","Mongolia":"MN","Montenegro":"ME","Morocco":"MA","Mozambique":"MZ","Myanmar":"MM","Namibia":"NA","Nauru":"NR","Nepal":"NP","Netherlands":"NL","New Zealand":"NZ","Nicaragua":"NI","Niger":"NE","Nigeria":"NG","North Korea":"KP","North Macedonia":"MK","Norway":"NO","Oman":"OM","Pakistan":"PK","Palau":"PW","Palestine":"PS","Panama":"PA","Papua New Guinea":"PG","Paraguay":"PY","Peru":"PE","Philippines":"PH","Poland":"PL","Portugal":"PT","Qatar":"QA","Republic of the Congo":"CG","Romania":"RO","Russia":"RU","Rwanda":"RW","Saint Kitts and Nevis":"KN","Saint Lucia":"LC","Saint Vincent and the Grenadines":"VC","Samoa":"WS","San Marino":"SM","Sao Tome and Principe":"ST","Saudi Arabia":"SA","Senegal":"SN","Serbia":"RS","Seychelles":"SC","Sierra Leone":"SL","Singapore":"SG","Slovakia":"SK","Slovenia":"SI","Solomon Islands":"SB","Somalia":"SO","South Africa":"ZA","South Korea":"KR","South Sudan":"SS","Spain":"ES","Sri Lanka":"LK","Sudan":"SD","Suriname":"SR","Sweden":"SE","Switzerland":"CH","Syria":"SY","Taiwan":"TW","Tajikistan":"TJ","Tanzania":"TZ","Thailand":"TH","Timor-Leste":"TL","Togo":"TG","Tonga":"TO","Trinidad and Tobago":"TT","Tunisia":"TN","Turkey":"TR","Turkmenistan":"TM","Tuvalu":"TV","Uganda":"UG","Ukraine":"UA","United Arab Emirates":"AE","United Kingdom":"GB","United States":"US","Uruguay":"UY","Uzbekistan":"UZ","Vanuatu":"VU","Vatican City":"VA","Venezuela":"VE","Vietnam":"VN","Yemen":"YE","Zambia":"ZM","Zimbabwe":"ZW","Multiple countries / Other":""};

  function countryFlag(country) {
    const code = COUNTRY_CODES[country] || "";
    if (!/^[A-Z]{2}$/.test(code)) return "🌍";
    return [...code]
      .map(char => String.fromCodePoint(127397 + char.charCodeAt(0)))
      .join("");
  }

  function countryLabel(country) {
    return `${countryFlag(country)} ${country}`;
  }
  const CATS = [["Food","🍽️"],["Transport","🚕"],["Hotel","🏨"],["Shopping","🛍️"],["Activities","🎟️"],["Flights","✈️"],["Coffee","☕"],["Groceries","🛒"],["Other","🧾"]];
  const PAYS = ["Cash","Credit Card","Debit Card","Apple Pay","Other"];
  const KEYWORDS = {Coffee:["coffee","cafe","café","latte","espresso","starbucks"],Food:["dinner","lunch","breakfast","restaurant","meal","burger","pizza","sushi","food","brunch"],Transport:["taxi","uber","grab","careem","metro","bus","train","fuel","gas","parking","toll"],Hotel:["hotel","resort","room","booking","airbnb","hostel"],Shopping:["shopping","mall","clothes","shirt","shoes","souvenir","gift"],Activities:["ticket","tour","museum","spa","massage","activity","excursion","park"],Flights:["flight","airline","airport","baggage","luggage"],Groceries:["grocery","groceries","supermarket","market","water","snacks"]};
  const $ = id => document.getElementById(id);

  const APPEARANCE_VALUES = new Set(["system", "light", "dark"]);

  function normalizedAppearance(value) {
    return APPEARANCE_VALUES.has(value) ? value : "system";
  }

  function resolvedAppearance(value = "system") {
    const pref = normalizedAppearance(value);
    if (pref === "light" || pref === "dark") return pref;
    return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? "dark" : "light";
  }

  function applyAppearance(value = "system") {
    const pref = normalizedAppearance(value);
    const resolved = resolvedAppearance(pref);
    document.documentElement.dataset.appearance = pref;
    document.documentElement.dataset.theme = resolved;

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", resolved === "dark" ? "#0b1018" : "#f4f6fa");
  }

  function renderAppearanceControls() {
    const pref = normalizedAppearance(state?.preferences?.appearance || "system");
    document.querySelectorAll("[data-appearance]").forEach(button => {
      const active = button.dataset.appearance === pref;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  function setAppearancePreference(value) {
    const pref = normalizedAppearance(value);
    state.preferences = state.preferences || {};

    // Appearance changes are intentionally silent. This prevents theme
    // confirmations from interrupting normal app use on iPhone.
    if (state.preferences.appearance === pref) {
      applyAppearance(pref);
      renderAppearanceControls();
      return;
    }

    state.preferences.appearance = pref;
    save();
    applyAppearance(pref);
    renderAppearanceControls();
  }

  // State is initialized from the migration seed below, then hydrated from IndexedDB.
  let installPrompt = null;
  let suggestedCategory = "";

  function uid(prefix = "id") {
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function makePerson(name, active = true) {
    return {
      id: uid("person"),
      name: String(name || "Traveler").trim().slice(0, 50) || "Traveler",
      active,
      createdAt: Date.now()
    };
  }

  function blank() {
    return { trip: null, expenses: [], rates: {}, people: [], stops: [], plans: [], settlements: [], tripHistory: [], preferences: {} };
  }

  function normalizeExpense(expense) {
    const e = { ...expense };
    if (!Array.isArray(e.personShares)) e.personShares = [];
    e.personShares = e.personShares
      .filter(s => s && s.personId)
      .map(s => ({ personId: String(s.personId), amount: num(s.amount) }));
    e.paidByPersonId = e.paidByPersonId ? String(e.paidByPersonId) : "";
    e.stopId = e.stopId ? String(e.stopId) : "";
    e.planId = e.planId ? String(e.planId) : "";
    e.expenseType = e.expenseType === "shared" || e.expenseType === "personal"
      ? e.expenseType
      : (e.personShares.length <= 1 ? "personal" : "shared");
    return e;
  }

  function normalizeState(raw) {
    const clean = raw && typeof raw === "object" ? raw : {};
    const trip = clean.trip
      ? {
          ...clean.trip,
          id: String(clean.trip.id || uid("trip"))
        }
      : null;
    let people = Array.isArray(clean.people)
      ? clean.people
          .filter(p => p && p.id)
          .map(p => ({
            id: String(p.id),
            name: String(p.name || "Traveler").trim().slice(0, 50) || "Traveler",
            active: p.active !== false,
            createdAt: num(p.createdAt, Date.now())
          }))
      : [];

    // v1-v3 migration: keep old expenses unchanged and introduce one traveler.
    // Existing historical expenses remain unassigned rather than being guessed.
    if (trip && !people.length) people = [makePerson("Me")];

    const stops = Array.isArray(clean.stops) && clean.stops.length
      ? clean.stops.filter(s => s && s.id).map(s => ({
          id: String(s.id),
          country: String(s.country || trip?.destination || "").trim(),
          startDate: String(s.startDate || trip?.startDate || ""),
          endDate: String(s.endDate || trip?.endDate || ""),
          currency: String(s.currency || trip?.tripCurrency || "USD"),
          budget: num(s.budget, 0),
          createdAt: num(s.createdAt, Date.now())
        }))
      : (trip ? [{
          id: "stop-primary",
          country: String(trip.destination || ""),
          startDate: String(trip.startDate || ""),
          endDate: String(trip.endDate || ""),
          currency: String(trip.tripCurrency || "USD"),
          budget: num(trip.budget, 0),
          createdAt: num(trip.createdAt, Date.now())
        }] : []);

    const plans = Array.isArray(clean.plans)
      ? clean.plans.filter(p => p && p.id).map(p => ({
          id: String(p.id),
          title: String(p.title || "Planned cost").trim().slice(0, 80),
          homeAmount: num(p.homeAmount, 0),
          date: String(p.date || trip?.startDate || ""),
          stopId: p.stopId ? String(p.stopId) : "",
          category: String(p.category || "Other"),
          note: String(p.note || "").slice(0, 120),
          status: p.status === "paid" ? "paid" : "planned",
          createdAt: num(p.createdAt, Date.now())
        }))
      : [];

    const settlements = Array.isArray(clean.settlements)
      ? clean.settlements
          .filter(s => s && s.id && s.fromPersonId && s.toPersonId && num(s.amount) > 0)
          .map(s => ({
            id: String(s.id),
            fromPersonId: String(s.fromPersonId),
            toPersonId: String(s.toPersonId),
            amount: num(s.amount),
            date: String(s.date || ""),
            note: String(s.note || ""),
            createdAt: num(s.createdAt, Date.now())
          }))
      : [];

    const tripHistory = Array.isArray(clean.tripHistory)
      ? clean.tripHistory
          .filter(record => record && record.id && record.data?.trip)
          .map(record => ({
            id: String(record.id),
            status: record.status === "completed" ? "completed" : "archived",
            archivedAt: num(record.archivedAt, Date.now()),
            completedAt: num(record.completedAt, 0),
            summary: record.summary && typeof record.summary === "object" ? record.summary : {},
            data: record.data
          }))
      : [];

    return {
      trip,
      expenses: Array.isArray(clean.expenses) ? clean.expenses.map(normalizeExpense) : [],
      rates: clean.rates && typeof clean.rates === "object" ? clean.rates : {},
      people,
      stops,
      plans,
      settlements,
      tripHistory,
      preferences: {
        lastPaymentMethod: String(clean.preferences?.lastPaymentMethod || trip?.defaultPayment || "Credit Card"),
        lastCategory: String(clean.preferences?.lastCategory || "Food"),
        recentCategories: Array.isArray(clean.preferences?.recentCategories)
          ? clean.preferences.recentCategories.filter(x => CATS.includes(x)).slice(0, 5)
          : [],
        lastStopId: clean.preferences?.lastStopId ? String(clean.preferences.lastStopId) : "",
        lastPaidByPersonId: clean.preferences?.lastPaidByPersonId ? String(clean.preferences.lastPaidByPersonId) : "",
        appearance: normalizedAppearance(clean.preferences?.appearance || "system")
      }
    };
  }

  function snapshotTripData(source = state) {
    return {
      trip: safeClone(source.trip),
      expenses: safeClone(source.expenses || []),
      rates: safeClone(source.rates || {}),
      people: safeClone(source.people || []),
      stops: safeClone(source.stops || []),
      plans: safeClone(source.plans || []),
      settlements: safeClone(source.settlements || []),
      preferences: safeClone(source.preferences || {})
    };
  }

  function inferredExpenseType(expense) {
    if (expense?.expenseType === "shared" || expense?.expenseType === "personal") {
      return expense.expenseType;
    }
    return (expense?.personShares || []).length > 1 ? "shared" : "personal";
  }

  function settlementBalancesFor(data) {
    const people = Array.isArray(data?.people) ? data.people : [];
    const balances = new Map(people.map(person => [person.id, 0]));
    const paid = new Map(people.map(person => [person.id, 0]));
    const shares = new Map(people.map(person => [person.id, 0]));

    (data?.expenses || []).forEach(expense => {
      const payerId = expense.paidByPersonId;
      const expenseShares = Array.isArray(expense.personShares) ? expense.personShares : [];
      if (!payerId || !balances.has(payerId) || !expenseShares.length) return;

      const type = inferredExpenseType(expense);
      const selfPaidPersonal =
        type === "personal" &&
        expenseShares.length === 1 &&
        expenseShares[0].personId === payerId;

      if (selfPaidPersonal) return;

      paid.set(payerId, (paid.get(payerId) || 0) + num(expense.homeAmount));

      expenseShares.forEach(share => {
        if (!balances.has(share.personId)) return;
        shares.set(share.personId, (shares.get(share.personId) || 0) + num(share.amount));
      });
    });

    people.forEach(person => {
      balances.set(person.id, (paid.get(person.id) || 0) - (shares.get(person.id) || 0));
    });

    (data?.settlements || []).forEach(payment => {
      const amount = num(payment.amount);
      if (!(amount > 0)) return;
      if (balances.has(payment.fromPersonId)) {
        balances.set(payment.fromPersonId, (balances.get(payment.fromPersonId) || 0) + amount);
      }
      if (balances.has(payment.toPersonId)) {
        balances.set(payment.toPersonId, (balances.get(payment.toPersonId) || 0) - amount);
      }
    });

    return balances;
  }

  function settlementOutstandingFor(data) {
    const balances = settlementBalancesFor(data);
    let total = 0;
    balances.forEach(value => {
      if (value < -0.000001) total += Math.abs(value);
    });
    return total;
  }

  function tripSummaryFor(data) {
    const trip = data?.trip;
    if (!trip) return {};

    const totalSpent = (data.expenses || []).reduce((sum, expense) => sum + num(expense.homeAmount), 0);
    const byCategory = new Map();

    (data.expenses || []).forEach(expense => {
      const category = expense.category || "Other";
      byCategory.set(category, (byCategory.get(category) || 0) + num(expense.homeAmount));
    });

    const topCategory = [...byCategory.entries()].sort((a, b) => b[1] - a[1])[0] || null;

    return {
      tripName: trip.name,
      destination: trip.destination,
      startDate: trip.startDate,
      endDate: trip.endDate,
      budget: num(trip.budget),
      spent: totalSpent,
      difference: num(trip.budget) - totalSpent,
      homeCurrency: trip.homeCurrency,
      countries: (data.stops || []).length,
      flags: (data.stops || []).map(stop => countryFlag(stop.country)),
      topCategory: topCategory?.[0] || "",
      topCategoryAmount: topCategory?.[1] || 0,
      settlementOutstanding: settlementOutstandingFor(data),
      expenseCount: (data.expenses || []).length
    };
  }

  function makeTripHistoryRecord(status = "archived", data = snapshotTripData()) {
    if (!data?.trip) return null;
    const normalizedStatus = status === "completed" || data.trip.historyStatus === "completed"
      ? "completed"
      : "archived";
    return {
      id: String(data.trip.id || uid("trip")),
      status: normalizedStatus,
      archivedAt: Date.now(),
      completedAt: normalizedStatus === "completed" ? Date.now() : 0,
      summary: tripSummaryFor(data),
      data: safeClone(data)
    };
  }

  function archiveCurrentTrip(status = "archived") {
    if (!state.trip) return null;
    const record = makeTripHistoryRecord(status);
    state.tripHistory = Array.isArray(state.tripHistory) ? state.tripHistory : [];
    state.tripHistory = [
      ...state.tripHistory.filter(item => item.id !== record.id),
      record
    ];
    return record;
  }

  function emptyActiveTripState(history = state.tripHistory || [], appearance = state.preferences?.appearance || "system") {
    const next = blank();
    next.tripHistory = safeClone(history);
    next.preferences = { appearance: normalizedAppearance(appearance) };
    return next;
  }

  function tripFlagsFor(data) {
    const flags = (data?.stops || []).map(stop => countryFlag(stop.country)).filter(Boolean);
    return flags.length ? flags.join(" ") : countryFlag(data?.trip?.destination || "");
  }

  function resetSetupForNewTrip() {
    $("setupForm")?.reset();
    initDates();
    if ($("ownerName")) $("ownerName").value = "";
    setDestinationValue("destination", "");
    opts($("homeCurrency"), CURS, "OMR");
    opts($("tripCurrency"), CURS, "THB");
    window.TripSpendV5?.clearSetupStops?.();
    window.TripSpendV5?.clearSetupPeople?.();
  }

  async function startNewTripFlow() {
    if (state.trip) {
      const ok = confirm(`Archive “${state.trip.name}” and start a new trip? You can reopen it anytime from Past Trips.`);
      if (!ok) return;

      if (storageMode === "indexeddb") {
        await createBackupSnapshot("Before starting a new trip", state, "manual");
      }
      archiveCurrentTrip("archived");
    }

    const history = safeClone(state.tripHistory || []);
    const appearance = state.preferences?.appearance || "system";
    state = emptyActiveTripState(history, appearance);
    await persistStateImmediately(state);
    resetSetupForNewTrip();
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast("Ready for a new trip");
  }

  async function openTripFromHistory(id) {
    const record = (state.tripHistory || []).find(item => item.id === id);
    if (!record?.data?.trip) return;

    if (state.trip && state.trip.id !== id) {
      const ok = confirm(`Open “${record.data.trip.name}”? Your current trip will move to Past Trips.`);
      if (!ok) return;
    }

    const appearance = state.preferences?.appearance || "system";
    let history = (state.tripHistory || []).filter(item => item.id !== id);

    if (state.trip && state.trip.id !== id) {
      const currentRecord = makeTripHistoryRecord("archived");
      history = [
        ...history.filter(item => item.id !== currentRecord.id),
        currentRecord
      ];
    }

    const loaded = normalizeState(record.data);
    loaded.trip.historyStatus = record.status;
    loaded.tripHistory = history;
    loaded.preferences.appearance = normalizedAppearance(appearance);
    state = loaded;

    await persistStateImmediately(state);
    applyAppearance(state.preferences.appearance);
    render();
    page("dashboard");
    toast(`${state.trip.name} opened`);
  }

  async function deleteTripHistoryRecord(id) {
    const record = (state.tripHistory || []).find(item => item.id === id);
    if (!record) return;
    const name = record.data?.trip?.name || "this trip";

    if (!confirm(`Delete “${name}” from Past Trips? This cannot be undone from Trip History.`)) return;

    if (storageMode === "indexeddb") {
      await createBackupSnapshot("Before deleting a past trip", state, "before-delete");
    }

    state.tripHistory = state.tripHistory.filter(item => item.id !== id);
    await persistStateImmediately(state);
    renderTripsPage();
    renderSetupTripHistory();
    toast("Past trip deleted");
  }

  function renderTripHistoryCard(record, compact = false) {
    const data = record.data || {};
    const trip = data.trip || {};
    const summary = record.summary && Object.keys(record.summary).length
      ? record.summary
      : tripSummaryFor(data);

    const card = document.createElement("div");
    card.className = `trip-history-card${compact ? " compact" : ""}`;

    const head = document.createElement("div");
    head.className = "trip-history-card-head";

    const identity = document.createElement("div");
    const flags = document.createElement("span");
    flags.className = "trip-history-flags";
    flags.textContent = tripFlagsFor(data);
    const copy = document.createElement("div");
    const strong = document.createElement("strong");
    strong.textContent = trip.name || "Trip";
    const dates = document.createElement("small");
    dates.textContent = `${fmtDateWithYear(trip.startDate)} – ${fmtDateWithYear(trip.endDate)}`;
    copy.append(strong, dates);
    identity.append(flags, copy);

    const status = document.createElement("span");
    status.className = `trip-history-status ${record.status === "completed" ? "completed" : "archived"}`;
    status.textContent = record.status === "completed" ? "COMPLETED" : "PAST";

    head.append(identity, status);

    const metrics = document.createElement("div");
    metrics.className = "trip-history-metrics";
    [
      ["Spent", money(summary.spent || 0, trip.homeCurrency || summary.homeCurrency || "OMR")],
      ["Budget", money(summary.budget || 0, trip.homeCurrency || summary.homeCurrency || "OMR")],
      ["Expenses", String(summary.expenseCount || (data.expenses || []).length)]
    ].forEach(([label, value]) => {
      const item = document.createElement("div");
      const small = document.createElement("small");
      small.textContent = label;
      const valueEl = document.createElement("strong");
      valueEl.textContent = value;
      item.append(small, valueEl);
      metrics.append(item);
    });

    const actions = document.createElement("div");
    actions.className = "trip-history-card-actions";

    const open = document.createElement("button");
    open.type = "button";
    open.className = "primary compact-btn";
    open.textContent = "Open Trip";
    open.onclick = () => openTripFromHistory(record.id);

    const del = document.createElement("button");
    del.type = "button";
    del.className = "secondary compact-btn";
    del.textContent = "Delete";
    del.onclick = () => deleteTripHistoryRecord(record.id);

    actions.append(open, del);
    card.append(head, metrics, actions);
    return card;
  }

  function renderSetupTripHistory() {
    const section = $("setupHistorySection");
    const list = $("setupHistoryList");
    if (!section || !list) return;

    const history = (state.tripHistory || []).slice().sort((a, b) => b.archivedAt - a.archivedAt);
    section.classList.toggle("hidden", !history.length);
    list.replaceChildren();

    history.slice(0, 4).forEach(record => list.append(renderTripHistoryCard(record, true)));
  }

  function renderTripsPage() {
    const currentHost = $("currentTripHistoryCard");
    const currentSection = $("currentTripHistorySection");
    const historyList = $("tripHistoryList");
    if (!historyList) return;

    if (currentSection) currentSection.classList.toggle("hidden", !state.trip);
    if ($("finishTripBtn")) $("finishTripBtn").classList.toggle("hidden", !state.trip);
    if ($("startNewTripBtn")) $("startNewTripBtn").textContent = state.trip ? "＋ Start New Trip" : "＋ New Trip";

    if (currentHost) {
      currentHost.replaceChildren();
      if (state.trip) {
        const data = snapshotTripData();
        const summary = tripSummaryFor(data);
        const card = document.createElement("div");
        card.className = "trip-current-card";

        const identity = document.createElement("div");
        identity.className = "trip-current-identity";
        const flags = document.createElement("span");
        flags.textContent = tripFlagsFor(data);
        const copy = document.createElement("div");
        const strong = document.createElement("strong");
        strong.textContent = state.trip.name;
        const small = document.createElement("small");
        small.textContent = `${fmtDateWithYear(state.trip.startDate)} – ${fmtDateWithYear(state.trip.endDate)}`;
        copy.append(strong, small);
        identity.append(flags, copy);

        const metrics = document.createElement("div");
        metrics.className = "trip-current-metrics";
        [
          ["Spent", money(summary.spent, state.trip.homeCurrency)],
          ["Remaining", money(summary.difference, state.trip.homeCurrency)],
          ["Settlement", money(summary.settlementOutstanding, state.trip.homeCurrency)]
        ].forEach(([label, value]) => {
          const item = document.createElement("div");
          const s = document.createElement("small");
          s.textContent = label;
          const v = document.createElement("strong");
          v.textContent = value;
          item.append(s, v);
          metrics.append(item);
        });

        card.append(identity, metrics);
        currentHost.append(card);
      }
    }

    historyList.replaceChildren();
    const history = (state.tripHistory || []).slice().sort((a, b) => b.archivedAt - a.archivedAt);

    if (!history.length) {
      const empty = document.createElement("div");
      empty.className = "empty empty-premium compact";
      empty.innerHTML = "<strong>No past trips yet</strong><span>Finished and archived trips will stay here.</span>";
      historyList.append(empty);
    } else {
      history.forEach(record => historyList.append(renderTripHistoryCard(record)));
    }
  }

  function showFinishTripSummary() {
    if (!state.trip) return;

    const data = snapshotTripData();
    const summary = tripSummaryFor(data);
    const diff = summary.difference;

    $("finishTripFlags").textContent = tripFlagsFor(data);
    $("finishTripName").textContent = state.trip.name;
    $("finishTripDates").textContent = `${fmtDateWithYear(state.trip.startDate)} – ${fmtDateWithYear(state.trip.endDate)}`;
    $("finishTripBudget").textContent = money(summary.budget, state.trip.homeCurrency);
    $("finishTripSpent").textContent = money(summary.spent, state.trip.homeCurrency);
    $("finishTripSavedLabel").textContent = diff >= 0 ? "Saved" : "Over budget";
    $("finishTripSaved").textContent = money(Math.abs(diff), state.trip.homeCurrency);
    $("finishTripSaved").classList.toggle("negative", diff < 0);
    $("finishTripTopCategory").textContent = summary.topCategory ? `${icon(summary.topCategory)} ${summary.topCategory}` : "—";
    $("finishTripCountries").textContent = String(summary.countries || 0);
    $("finishTripSettlement").textContent = money(summary.settlementOutstanding, state.trip.homeCurrency);

    $("finishTripModal").classList.remove("hidden");
  }

  function closeFinishTripSummary() {
    $("finishTripModal")?.classList.add("hidden");
  }

  async function finishCurrentTrip() {
    if (!state.trip) return;

    try {
      if (storageMode === "indexeddb") {
        await createBackupSnapshot("Before finishing trip", state, "manual");
      }

      archiveCurrentTrip("completed");
      const history = safeClone(state.tripHistory || []);
      const appearance = state.preferences?.appearance || "system";

      state = emptyActiveTripState(history, appearance);
      await persistStateImmediately(state);

      closeFinishTripSummary();
      resetSetupForNewTrip();
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
      toast("Trip finished and saved to Past Trips");
    } catch {
      alert("TripSpend could not finish the trip safely.");
    }
  }

  function safeClone(value) {
    try {
      return structuredClone(value);
    } catch {
      return JSON.parse(JSON.stringify(value));
    }
  }

  function meaningfulState(value) {
    return !!(
      value?.trip ||
      value?.expenses?.length ||
      value?.people?.length ||
      value?.stops?.length ||
      value?.plans?.length ||
      value?.settlements?.length ||
      value?.tripHistory?.length
    );
  }

  function loadLegacyState() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY));
      return raw ? normalizeState(raw) : blank();
    } catch {
      return blank();
    }
  }

  function openStorageDB() {
    return new Promise((resolve, reject) => {
      if (!("indexedDB" in window)) {
        reject(new Error("IndexedDB unavailable"));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;

        if (!db.objectStoreNames.contains(DB_STATE_STORE)) {
          db.createObjectStore(DB_STATE_STORE, { keyPath: "key" });
        }

        if (!db.objectStoreNames.contains(DB_BACKUP_STORE)) {
          const backups = db.createObjectStore(DB_BACKUP_STORE, { keyPath: "id" });
          backups.createIndex("createdAt", "createdAt");
        }

        if (!db.objectStoreNames.contains(DB_META_STORE)) {
          db.createObjectStore(DB_META_STORE, { keyPath: "key" });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("IndexedDB failed"));
      request.onblocked = () => reject(new Error("IndexedDB blocked"));
    });
  }

  function idbRequest(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("Storage request failed"));
    });
  }

  function txComplete(tx) {
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error("Storage transaction failed"));
      tx.onabort = () => reject(tx.error || new Error("Storage transaction aborted"));
    });
  }

  async function idbReadState() {
    if (!storageDB) return null;
    const tx = storageDB.transaction(DB_STATE_STORE, "readonly");
    const result = await idbRequest(tx.objectStore(DB_STATE_STORE).get("current"));
    await txComplete(tx);
    return result?.data ? normalizeState(result.data) : null;
  }

  async function idbReadMeta(key) {
    if (!storageDB) return null;
    const tx = storageDB.transaction(DB_META_STORE, "readonly");
    const result = await idbRequest(tx.objectStore(DB_META_STORE).get(key));
    await txComplete(tx);
    return result?.value ?? null;
  }

  async function idbWriteMeta(key, value) {
    if (!storageDB) return;
    const tx = storageDB.transaction(DB_META_STORE, "readwrite");
    tx.objectStore(DB_META_STORE).put({ key, value, updatedAt: Date.now() });
    await txComplete(tx);
  }

  function backupRecord(id, kind, label, snapshot, createdAt = Date.now()) {
    return {
      id,
      kind,
      label,
      createdAt,
      appVersion: APP_VERSION,
      data: safeClone(snapshot)
    };
  }

  async function idbPutBackup(record) {
    if (!storageDB) return;
    const tx = storageDB.transaction(DB_BACKUP_STORE, "readwrite");
    tx.objectStore(DB_BACKUP_STORE).put(record);
    await txComplete(tx);
  }

  async function idbGetBackup(id) {
    if (!storageDB) return null;
    const tx = storageDB.transaction(DB_BACKUP_STORE, "readonly");
    const result = await idbRequest(tx.objectStore(DB_BACKUP_STORE).get(id));
    await txComplete(tx);
    return result || null;
  }

  async function idbListBackups() {
    if (!storageDB) return [];
    const tx = storageDB.transaction(DB_BACKUP_STORE, "readonly");
    const store = tx.objectStore(DB_BACKUP_STORE);
    const rows = await idbRequest(store.getAll());
    await txComplete(tx);
    return Array.isArray(rows) ? rows.sort((a, b) => b.createdAt - a.createdAt) : [];
  }

  async function cleanupAutomaticBackups() {
    if (!storageDB) return;
    const rows = await idbListBackups();
    const daily = rows
      .filter(row => row.kind === "daily")
      .sort((a, b) => b.createdAt - a.createdAt);

    if (daily.length <= MAX_DAILY_BACKUPS) return;

    const remove = daily.slice(MAX_DAILY_BACKUPS);
    const tx = storageDB.transaction(DB_BACKUP_STORE, "readwrite");
    const store = tx.objectStore(DB_BACKUP_STORE);
    remove.forEach(row => store.delete(row.id));
    await txComplete(tx);
  }

  function backupDateLabel(dateString) {
    if (!dateString) return "Recent";
    const current = today();
    const yesterdayDate = dlocal(current);
    yesterdayDate?.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate
      ? `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, "0")}-${String(yesterdayDate.getDate()).padStart(2, "0")}`
      : "";

    if (dateString === current) return "Today";
    if (dateString === yesterday) return "Yesterday";
    return fmtDateWithYear(dateString);
  }

  async function createBackupSnapshot(label = "Manual snapshot", snapshot = state, kind = "manual") {
    if (storageMode !== "indexeddb" || !storageDB || !meaningfulState(snapshot)) return null;

    const id = `${kind}:${Date.now()}:${Math.random().toString(16).slice(2)}`;
    const record = backupRecord(id, kind, label, snapshot);
    await idbPutBackup(record);
    renderStoragePanel();
    return record;
  }

  async function persistStateImmediately(snapshot = state, { maintainBackups = true } = {}) {
    const cleanSnapshot = safeClone(snapshot);

    if (storageMode !== "indexeddb" || !storageDB) {
      localStorage.setItem(KEY, JSON.stringify(cleanSnapshot));
      lastStorageWriteAt = Date.now();
      renderStoragePanel();
      return;
    }

    const now = Date.now();
    const day = today();
    const tx = storageDB.transaction([DB_STATE_STORE, DB_BACKUP_STORE], "readwrite");

    tx.objectStore(DB_STATE_STORE).put({
      key: "current",
      data: cleanSnapshot,
      updatedAt: now,
      appVersion: APP_VERSION
    });

    if (maintainBackups && meaningfulState(cleanSnapshot)) {
      const backups = tx.objectStore(DB_BACKUP_STORE);
      backups.put(backupRecord("latest", "latest", "Latest", cleanSnapshot, now));
      backups.put(backupRecord(`daily:${day}`, "daily", backupDateLabel(day), cleanSnapshot, now));
    }

    await txComplete(tx);
    lastStorageWriteAt = now;
    pendingStorageSnapshot = null;

    // IndexedDB is primary after a successful write.
    localStorage.removeItem(KEY);

    if (maintainBackups) {
      cleanupAutomaticBackups().catch(() => {});
    }

    renderStoragePanel();
  }

  async function flushPendingSave() {
    clearTimeout(storageSaveTimer);
    storageSaveTimer = 0;

    const snapshot = pendingStorageSnapshot || safeClone(state);
    pendingStorageSnapshot = null;

    try {
      await persistStateImmediately(snapshot);
    } catch {
      // Fail safe: if IndexedDB ever becomes unavailable, retain the current
      // trip in Web Storage rather than dropping the save.
      storageMode = "localStorage";
      localStorage.setItem(KEY, JSON.stringify(snapshot));
      lastStorageWriteAt = Date.now();
      renderStoragePanel();
    }
  }

  function save(options = {}) {
    const immediate = !!options.immediate;
    pendingStorageSnapshot = safeClone(state);

    if (storageMode !== "indexeddb") {
      localStorage.setItem(KEY, JSON.stringify(pendingStorageSnapshot));
      lastStorageWriteAt = Date.now();
      return;
    }

    clearTimeout(storageSaveTimer);
    storageSaveTimer = window.setTimeout(flushPendingSave, immediate ? 0 : STORAGE_SAVE_DELAY);
  }

  async function requestPersistentStorage() {
    try {
      if (!navigator.storage?.persisted) return false;
      if (await navigator.storage.persisted()) return true;
      if (!navigator.storage.persist) return false;
      return await navigator.storage.persist();
    } catch {
      return false;
    }
  }

  async function initializePersistentStorage(legacyState) {
    const boot = $("storageBoot");

    try {
      storageDB = await openStorageDB();

      const stored = await idbReadState();

      if (stored) {
        state = stored;
      } else {
        state = normalizeState(legacyState || blank());

        if (meaningfulState(state)) {
          // First v6.4 migration: preserve the complete pre-upgrade state before
          // IndexedDB becomes the primary store.
          await idbPutBackup(
            backupRecord(
              "upgrade:v6.4",
              "upgrade",
              "Before v6.4 upgrade",
              state
            )
          );
        }

        storageMode = "indexeddb";
        await persistStateImmediately(state);
      }

      storageMode = "indexeddb";
      storagePersistent = await requestPersistentStorage();

      await idbWriteMeta("storageVersion", 1);
      await idbWriteMeta("lastAppVersion", APP_VERSION);

      // Once IndexedDB is confirmed, remove the old full-state copy.
      localStorage.removeItem(KEY);
    } catch {
      storageMode = "localStorage";
      storageDB = null;
      state = normalizeState(legacyState || blank());
      try {
        localStorage.setItem(KEY, JSON.stringify(state));
      } catch {}
    }

    applyAppearance(state.preferences?.appearance || "system");

    if (boot) {
      boot.classList.add("leaving");
      window.setTimeout(() => boot.classList.add("hidden"), 180);
    }

    const renderStart = performance.now();
    render();
    lastRenderMs = performance.now() - renderStart;
    appStartupMs = performance.now() - APP_BOOT_STARTED;
    renderStoragePanel();
  }

  function storageAgeText(timestamp) {
    if (!timestamp) return "Waiting for first save";
    const seconds = Math.max(0, Math.round((Date.now() - timestamp) / 1000));
    if (seconds < 8) return "Saved just now";
    if (seconds < 60) return `Saved ${seconds}s ago`;
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `Saved ${minutes}m ago`;
    return `Saved ${Math.round(minutes / 60)}h ago`;
  }

  async function renderStoragePanel() {
    const badge = $("storageModeBadge");
    const status = $("storageStatus");
    const perf = $("storagePerfStatus");
    const list = $("backupList");
    if (!badge || !status || !perf || !list) return;

    if (storageMode === "indexeddb") {
      badge.textContent = "INDEXEDDB";
      badge.classList.remove("fallback");
      status.textContent = storagePersistent
        ? "Protected local storage is active."
        : "Fast local database is active.";
    } else if (storageMode === "localStorage") {
      badge.textContent = "SAFE FALLBACK";
      badge.classList.add("fallback");
      status.textContent = "Compatibility storage is active.";
    } else {
      badge.textContent = "STARTING";
      status.textContent = "Preparing local storage…";
    }

    const perfBits = [];
    if (appStartupMs > 0) perfBits.push(`startup ${Math.round(appStartupMs)} ms`);
    if (lastRenderMs > 0) perfBits.push(`render ${Math.max(1, Math.round(lastRenderMs))} ms`);
    perfBits.push(storageAgeText(lastStorageWriteAt));
    perf.textContent = perfBits.join(" • ");

    list.replaceChildren();

    if (storageMode !== "indexeddb" || !storageDB) {
      const empty = document.createElement("div");
      empty.className = "backup-empty";
      empty.textContent = "Automatic restore points require IndexedDB. Your trip still saves using the safe fallback.";
      list.append(empty);
      return;
    }

    try {
      const rows = await idbListBackups();
      const latest = rows.find(row => row.kind === "latest");
      const daily = rows
        .filter(row => row.kind === "daily" && !row.id.endsWith(`:${today()}`))
        .slice(0, 3);
      const protectedRows = rows
        .filter(row => ["upgrade", "manual", "before-restore", "before-import", "before-delete"].includes(row.kind))
        .slice(0, 3);

      const visible = [
        ...(latest ? [latest] : []),
        ...daily,
        ...protectedRows
      ];

      const unique = [];
      const seen = new Set();
      visible.forEach(row => {
        if (seen.has(row.id)) return;
        seen.add(row.id);
        unique.push(row);
      });

      if (!unique.length) {
        const empty = document.createElement("div");
        empty.className = "backup-empty";
        empty.textContent = "Your first restore point will be created automatically after saving.";
        list.append(empty);
        return;
      }

      unique.forEach(row => {
        const item = document.createElement("div");
        item.className = "backup-item";

        const copy = document.createElement("div");
        const strong = document.createElement("strong");
        strong.textContent = row.kind === "daily"
          ? backupDateLabel(row.id.replace("daily:", ""))
          : row.label;
        const small = document.createElement("small");
        const d = new Date(row.createdAt);
        small.textContent = `${d.toLocaleDateString([], { day: "numeric", month: "short" })} • ${d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
        copy.append(strong, small);

        const restore = document.createElement("button");
        restore.type = "button";
        restore.className = "secondary compact-btn backup-restore";
        restore.textContent = "Restore";
        restore.onclick = () => restoreBackup(row.id);

        item.append(copy, restore);
        list.append(item);
      });
    } catch {
      const empty = document.createElement("div");
      empty.className = "backup-empty";
      empty.textContent = "Restore points are temporarily unavailable.";
      list.append(empty);
    }
  }

  async function restoreBackup(id) {
    if (storageMode !== "indexeddb" || !storageDB) return;
    const backup = await idbGetBackup(id);
    if (!backup?.data) return toast("Restore point unavailable");

    if (!confirm(`Restore “${backup.label || "this snapshot"}”? Your current trip will be kept as a safety snapshot first.`)) {
      return;
    }

    try {
      if (meaningfulState(state)) {
        await createBackupSnapshot("Before restore", state, "before-restore");
      }

      state = normalizeState(backup.data);
      await persistStateImmediately(state);
      applyAppearance(state.preferences?.appearance || "system");
      render();
      page("dashboard");
      toast("Restore point restored");
    } catch {
      alert("TripSpend could not restore that snapshot.");
    }
  }

  const legacySeedState = loadLegacyState();
  let state = legacySeedState;
  applyAppearance(state.preferences?.appearance || "system");


  function num(v, d = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : d;
  }

  function today() {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  }

  function dlocal(s) {
    if (!s) return null;
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  function days(a, b) {
    const x = dlocal(a), y = dlocal(b);
    return x && y ? Math.max(0, Math.floor((y - x) / 86400000) + 1) : 0;
  }

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  function money(v, c) {
    const n = num(v);
    const dec = ["OMR", "KWD", "BHD"].includes(c) ? 3 : 2;
    return new Intl.NumberFormat(undefined, {
      minimumFractionDigits: dec,
      maximumFractionDigits: dec
    }).format(n) + " " + c;
  }

  function fmtDate(s) {
    const d = dlocal(s);
    return d ? new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" }).format(d) : "";
  }

  function fmtDateWithYear(s) {
    const d = dlocal(s);
    return d ? new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" }).format(d) : "";
  }

  function fmtDateLong(s) {
    const d = dlocal(s);
    return d ? new Intl.DateTimeFormat(undefined, { weekday: "short", day: "numeric", month: "short" }).format(d) : "";
  }

  function opts(el, arr, selected) {
    if (!el) return;
    el.replaceChildren();
    arr.forEach(x => {
      const value = Array.isArray(x) ? x[0] : x;
      const label = Array.isArray(x) ? `${x[1]} ${x[0]}` : x;
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      option.selected = value === selected;
      el.append(option);
    });
  }

  const destinationComboboxes = new Map();

  function destinationMatches(query) {
    const q = String(query || "").trim().toLocaleLowerCase();
    if (!q) return [];

    return DESTS
      .map(country => {
        const name = country.toLocaleLowerCase();
        const starts = name.startsWith(q);
        const at = name.indexOf(q);
        return { country, rank: starts ? 0 : (at >= 0 ? 1 : 2), at };
      })
      .filter(x => x.rank < 2)
      .sort((a, b) => a.rank - b.rank || a.at - b.at || a.country.localeCompare(b.country))
      .slice(0, 16)
      .map(x => x.country);
  }

  function setDestinationValue(inputId, value) {
    const input = $(inputId);
    if (!input) return;
    input.value = value || "";
    input.dataset.selectedCountry = value || "";
    const api = destinationComboboxes.get(inputId);
    if (api) api.close();
  }

  function canonicalDestination(inputId) {
    const input = $(inputId);
    const value = input?.value.trim() || "";
    const exact = DESTS.find(country => country.toLocaleLowerCase() === value.toLocaleLowerCase());
    if (!exact) {
      toast("Choose a country from the destination suggestions");
      input?.focus();
      destinationComboboxes.get(inputId)?.show();
      return null;
    }
    setDestinationValue(inputId, exact);
    return exact;
  }

  function initDestinationAutocomplete(inputId, listId, selected = "") {
    const input = $(inputId);
    const list = $(listId);
    if (!input || !list) return;

    let activeIndex = -1;
    let currentMatches = [];

    const close = () => {
      list.classList.add("hidden");
      input.setAttribute("aria-expanded", "false");
      input.removeAttribute("aria-activedescendant");
      activeIndex = -1;
    };

    const markActive = () => {
      const buttons = [...list.querySelectorAll(".country-option")];
      buttons.forEach((button, i) => {
        const active = i === activeIndex;
        button.classList.toggle("active", active);
        button.setAttribute("aria-selected", active ? "true" : "false");
      });
      if (activeIndex >= 0 && buttons[activeIndex]) {
        const button = buttons[activeIndex];
        input.setAttribute("aria-activedescendant", button.id);
        button.scrollIntoView({ block: "nearest" });
      } else {
        input.removeAttribute("aria-activedescendant");
      }
    };

    const choose = country => {
      setDestinationValue(inputId, country);
      close();
      input.dispatchEvent(new Event("change", { bubbles: true }));
    };

    const show = () => {
      const q = input.value.trim();
      list.replaceChildren();
      activeIndex = -1;

      if (!q) {
        close();
        return;
      }

      currentMatches = destinationMatches(q);

      if (!currentMatches.length) {
        const empty = document.createElement("div");
        empty.className = "country-no-results";
        empty.textContent = "No matching countries";
        list.append(empty);
        list.classList.remove("hidden");
        input.setAttribute("aria-expanded", "true");
        return;
      }

      currentMatches.forEach((country, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.id = `${listId}-option-${index}`;
        button.className = "country-option";
        button.setAttribute("role", "option");
        button.setAttribute("aria-selected", "false");

        const name = document.createElement("span");
        name.className = "country-option-name";
        const flag = document.createElement("span");
        flag.className = "country-flag";
        flag.textContent = countryFlag(country);
        const countryText = document.createElement("span");
        countryText.textContent = country;
        name.append(flag, countryText);
        const hint = document.createElement("small");
        hint.textContent = country.toLocaleLowerCase().startsWith(q.toLocaleLowerCase()) ? "BEST MATCH" : "MATCH";

        button.append(name, hint);
        button.addEventListener("mousedown", event => event.preventDefault());
        button.addEventListener("click", () => choose(country));
        list.append(button);
      });

      list.classList.remove("hidden");
      input.setAttribute("aria-expanded", "true");
    };

    input.addEventListener("input", () => {
      input.dataset.selectedCountry = "";
      show();
    });

    input.addEventListener("focus", () => {
      if (input.value.trim() && !input.dataset.selectedCountry) show();
    });

    input.addEventListener("keydown", event => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        if (list.classList.contains("hidden")) show();
        if (currentMatches.length) {
          activeIndex = Math.min(activeIndex + 1, currentMatches.length - 1);
          markActive();
        }
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        if (currentMatches.length) {
          activeIndex = Math.max(activeIndex - 1, 0);
          markActive();
        }
      } else if (event.key === "Enter" && !list.classList.contains("hidden") && activeIndex >= 0) {
        event.preventDefault();
        choose(currentMatches[activeIndex]);
      } else if (event.key === "Escape") {
        close();
      }
    });

    input.addEventListener("blur", () => {
      window.setTimeout(() => {
        const exact = DESTS.find(country =>
          country.toLocaleLowerCase() === input.value.trim().toLocaleLowerCase()
        );
        if (exact) setDestinationValue(inputId, exact);
        else close();
      }, 120);
    });

    destinationComboboxes.set(inputId, { show, close });
    setDestinationValue(inputId, selected);
  }

  function toast(text) {
    const el = $("toast");
    el.textContent = text;
    el.classList.remove("hidden");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => el.classList.add("hidden"), 2200);
  }

  function icon(category) {
    return CATS.find(x => x[0] === category)?.[1] || "🧾";
  }

  function initials(name) {
    const parts = String(name || "?").trim().split(/\s+/).filter(Boolean);
    return (parts.slice(0, 2).map(p => p[0]).join("") || "?").toUpperCase();
  }

  function activePeople() {
    return state.people.filter(p => p.active !== false);
  }

  function personById(id) {
    return state.people.find(p => p.id === id) || null;
  }

  function personName(id) {
    return personById(id)?.name || "Former traveler";
  }

  function spent() {
    return state.expenses.reduce((sum, e) => sum + num(e.homeAmount), 0);
  }

  function totalTripDays() {
    return state.trip ? Math.max(1, days(state.trip.startDate, state.trip.endDate)) : 1;
  }

  function left() {
    if (!state.trip) return 0;
    const t = today();
    if (t > state.trip.endDate) return 0;
    return days(t < state.trip.startDate ? state.trip.startDate : t, state.trip.endDate);
  }

  function elapsed() {
    if (!state.trip) return 1;
    const t = today();
    if (t < state.trip.startDate) return 0;
    if (t > state.trip.endDate) return totalTripDays();
    return days(state.trip.startDate, t);
  }

  function todaySpent() {
    const t = today();
    return state.expenses
      .filter(e => e.date === t)
      .reduce((sum, e) => sum + num(e.homeAmount), 0);
  }

  function toHome(amount, currency, rate) {
    if (!state.trip) return 0;
    const a = num(amount);
    const r = num(rate, 1);
    return currency === state.trip.homeCurrency ? a : r > 0 ? a / r : 0;
  }

  function rateKey(currency) {
    return state.trip ? `${state.trip.homeCurrency}->${currency}` : "";
  }

  function savedRate(currency) {
    return num(state.rates?.[rateKey(currency)], 0);
  }

  function projected() {
    if (!state.trip) return 0;
    const e = elapsed(), s = spent();
    if (e <= 0) return 0;
    return s / e * totalTripDays();
  }

  function aggregate(field) {
    const map = new Map();
    state.expenses.forEach(e => {
      const key = e[field] || "Other";
      map.set(key, (map.get(key) || 0) + num(e.homeAmount));
    });
    return [...map].map(([label, amount]) => ({ label, amount })).sort((a, b) => b.amount - a.amount);
  }

  function dailyRows() {
    const map = new Map();
    state.expenses.forEach(e => map.set(e.date, (map.get(e.date) || 0) + num(e.homeAmount)));
    return [...map].map(([date, amount]) => ({ date, amount })).sort((a, b) => a.date.localeCompare(b.date));
  }

  function personRows(includeZero = true) {
    const rows = state.people.map(person => {
      let amount = 0;
      let expenseCount = 0;
      state.expenses.forEach(e => {
        const share = (e.personShares || []).find(s => s.personId === person.id);
        if (share) {
          amount += num(share.amount);
          expenseCount += 1;
        }
      });
      return { person, amount, expenseCount };
    });

    const filtered = includeZero ? rows : rows.filter(r => r.amount > 0);
    return filtered.sort((a, b) => b.amount - a.amount || a.person.name.localeCompare(b.person.name));
  }

  function assignedTotal() {
    return state.expenses.reduce((sum, e) => {
      return sum + (e.personShares || []).reduce((s, share) => s + num(share.amount), 0);
    }, 0);
  }

  function unassignedTotal() {
    return Math.max(0, spent() - assignedTotal());
  }

  function expenseAssignmentText(e) {
    const shares = Array.isArray(e.personShares) ? e.personShares : [];
    if (!shares.length) return "Unassigned";
    if (shares.length === 1) return personName(shares[0].personId);
    const names = shares.map(s => personName(s.personId));
    if (names.length <= 2) return `Shared • ${names.join(" & ")}`;
    return `Shared • ${names.length} travelers`;
  }

  function makePersonShares(selection, homeAmount) {
    const amount = num(homeAmount);
    if (!selection) return [];

    if (selection === "__everyone__") {
      const people = activePeople();
      if (!people.length) return [];
      const each = amount / people.length;
      return people.map(p => ({ personId: p.id, amount: each }));
    }

    if (personById(selection)) {
      return [{ personId: selection, amount }];
    }

    return [];
  }

  function selectedPersonValue(e) {
    const shares = Array.isArray(e?.personShares) ? e.personShares : [];
    if (!shares.length) return "";
    if (shares.length === 1) return shares[0].personId;
    return "__everyone__";
  }

  function health() {
    const t = state.trip, s = spent(), p = projected();
    if (!t) return { cls: "on-track", icon: "✓", title: "Ready", text: "Create your trip to start tracking." };
    if (s > t.budget) return { cls: "over", icon: "!", title: "Over budget", text: `You are ${money(s - t.budget, t.homeCurrency)} over your trip budget.` };
    if (elapsed() > 0 && p > t.budget * 1.05) return { cls: "watch", icon: "↗", title: "Watch your pace", text: `At this pace you may finish around ${money(p - t.budget, t.homeCurrency)} over budget.` };
    if (elapsed() > 0 && p > 0) return { cls: "on-track", icon: "✓", title: "On track", text: `At your current pace you may finish around ${money(Math.max(0, t.budget - p), t.homeCurrency)} under budget.` };
    return { cls: "on-track", icon: "✓", title: "Budget ready", text: `You have ${money(t.budget, t.homeCurrency)} planned for this trip.` };
  }

  function renderHealth() {
    const h = health(), banner = $("healthBanner");
    banner.className = `health-banner ${h.cls}`;
    $("healthIcon").textContent = h.icon;
    $("healthTitle").textContent = h.title;
    $("healthText").textContent = h.text;
  }

  function smartInsights() {
    const t = state.trip, s = spent(), categoryRows = aggregate("category"), drows = dailyRows(), out = [];
    if (!t) return out;

    const remaining = t.budget - s, daysLeft = left(), forecast = projected();

    if (elapsed() > 0 && forecast > 0) {
      out.push({
        i: "🔮",
        t: "End-of-trip forecast",
        d: forecast > t.budget
          ? `Current pace projects ${money(forecast, t.homeCurrency)}, above your budget.`
          : `Current pace projects ${money(forecast, t.homeCurrency)}, within your budget.`
      });
    } else {
      out.push({
        i: "🧭",
        t: "Before your trip",
        d: `Your starting daily allowance is about ${money(t.budget / totalTripDays(), t.homeCurrency)}.`
      });
    }

    if (categoryRows.length) {
      const top = categoryRows[0], pct = s > 0 ? Math.round(top.amount / s * 100) : 0;
      out.push({
        i: icon(top.label),
        t: `${top.label} is your top category`,
        d: `It accounts for ${pct}% of your spending (${money(top.amount, t.homeCurrency)}).`
      });
    }

    const prows = personRows(false);
    if (prows.length) {
      const top = prows[0];
      out.push({
        i: "👤",
        t: `${top.person.name} has the highest assigned spend`,
        d: `${money(top.amount, t.homeCurrency)} is currently assigned to ${top.person.name}.`
      });
    }

    if (unassignedTotal() > 0) {
      out.push({
        i: "🏷️",
        t: "Some spending is unassigned",
        d: `${money(unassignedTotal(), t.homeCurrency)} has not been assigned to a traveler yet.`
      });
    }

    if (drows.length) {
      const biggest = drows.slice().sort((a, b) => b.amount - a.amount)[0];
      out.push({
        i: "📈",
        t: "Highest-spend day",
        d: `${fmtDateLong(biggest.date)} was your biggest day at ${money(biggest.amount, t.homeCurrency)}.`
      });
    }

    if (daysLeft > 0) {
      out.push({
        i: "☀️",
        t: "Daily spending room",
        d: `You can spend about ${money(Math.max(0, remaining) / daysLeft, t.homeCurrency)} per remaining day and stay within budget.`
      });
    }

    return out.slice(0, 5);
  }

  function renderInsights() {
    const el = $("smartInsights");
    el.replaceChildren();
    smartInsights().forEach(x => {
      const row = document.createElement("div");
      row.className = "insight";

      const iconEl = document.createElement("div");
      iconEl.className = "insight-icon";
      iconEl.textContent = x.i;

      const body = document.createElement("div");
      const strong = document.createElement("strong");
      strong.textContent = x.t;
      const span = document.createElement("span");
      span.textContent = x.d;
      body.append(strong, span);

      row.append(iconEl, body);
      el.append(row);
    });
  }

  function renderBars(el, rows, labelFormatter = x => x.label) {
    el.replaceChildren();
    if (!rows.length) {
      const empty = document.createElement("div");
      empty.className = "empty empty-premium compact";
      empty.innerHTML = "<strong>Nothing to chart yet</strong><span>Add a few expenses and this breakdown will build automatically.</span>";
      el.append(empty);
      return;
    }

    const max = Math.max(...rows.map(r => num(r.amount)), 1);
    rows.forEach(row => {
      const wrap = document.createElement("div");
      wrap.className = "bar-row";

      const meta = document.createElement("div");
      meta.className = "bar-meta";
      const label = document.createElement("span");
      label.textContent = labelFormatter(row);
      const amount = document.createElement("strong");
      amount.textContent = money(row.amount, state.trip.homeCurrency);
      meta.append(label, amount);

      const track = document.createElement("div");
      track.className = "bar-track";
      const fill = document.createElement("div");
      fill.className = "bar-fill";
      fill.style.width = `${Math.max(2, row.amount / max * 100)}%`;
      track.append(fill);

      wrap.append(meta, track);
      el.append(wrap);
    });
  }

  function renderDaily(el) {
    const rows = dailyRows().slice(-12);
    el.replaceChildren();

    if (!rows.length) {
      const empty = document.createElement("div");
      empty.className = "empty empty-premium compact";
      empty.innerHTML = "<strong>No daily trend yet</strong><span>Daily spending appears after you start recording expenses.</span>";
      el.append(empty);
      return;
    }

    const max = Math.max(...rows.map(r => r.amount), 1);
    rows.forEach(r => {
      const row = document.createElement("div");
      row.className = "daily";

      const date = document.createElement("span");
      date.textContent = fmtDate(r.date);

      const track = document.createElement("div");
      track.className = "bar-track";
      const fill = document.createElement("div");
      fill.className = "bar-fill";
      fill.style.width = `${Math.max(2, r.amount / max * 100)}%`;
      track.append(fill);

      const amount = document.createElement("strong");
      amount.textContent = money(r.amount, state.trip.homeCurrency);

      row.append(date, track, amount);
      el.append(row);
    });
  }

  function renderPeopleBars() {
    const rows = personRows(false).map(r => ({
      label: r.person.name + (r.person.active ? "" : " (archived)"),
      amount: r.amount
    }));
    const unassigned = unassignedTotal();
    if (unassigned > 0) rows.push({ label: "Unassigned", amount: unassigned });
    rows.sort((a, b) => b.amount - a.amount);
    renderBars($("peopleAnalytics"), rows);
  }

  function sortNew(a, b) {
    if (a.date === b.date) return num(b.createdAt) - num(a.createdAt);
    return a.date < b.date ? 1 : -1;
  }

  function filteredExpenses() {
    const q = $("searchExpense").value.trim().toLowerCase();
    const category = $("filterCategory").value;
    const type = $("filterType")?.value || "";
    const country = $("filterCountry")?.value || "";
    const payment = $("filterPayment").value;
    const person = $("filterPerson").value;
    const dateFrom = $("filterDateFrom")?.value || "";
    const dateTo = $("filterDateTo")?.value || "";

    return state.expenses
      .filter(e => !category || e.category === category)
      .filter(e => !type || inferredExpenseType(e) === type)
      .filter(e => !country || e.stopId === country)
      .filter(e => !payment || e.paymentMethod === payment)
      .filter(e => !dateFrom || e.date >= dateFrom)
      .filter(e => !dateTo || e.date <= dateTo)
      .filter(e => {
        if (!person) return true;
        if (person === "__unassigned__") return !(e.personShares || []).length;
        return (e.personShares || []).some(s => s.personId === person);
      })
      .filter(e => {
        if (!q) return true;
        const stop = (state.stops || []).find(s => s.id === e.stopId);
        const payer = e.paidByPersonId ? personName(e.paidByPersonId) : "";
        const typeText = inferredExpenseType(e);
        return `${e.category} ${e.note || ""} ${e.paymentMethod} ${expenseAssignmentText(e)} ${stop?.country || ""} ${payer} ${typeText}`.toLowerCase().includes(q);
      })
      .slice()
      .sort(sortNew);
  }

  function renderCountryFilter() {
    const select = $("filterCountry");
    if (!select) return;

    const current = select.value;
    select.replaceChildren();

    const all = document.createElement("option");
    all.value = "";
    all.textContent = "All countries";
    select.append(all);

    (state.stops || []).forEach(stop => {
      const option = document.createElement("option");
      option.value = stop.id;
      option.textContent = `${countryFlag(stop.country)} ${stop.country}`;
      select.append(option);
    });

    if ([...select.options].some(option => option.value === current)) {
      select.value = current;
    }
  }

  function expenseFilterCount() {
    return [
      $("filterCategory")?.value,
      $("filterType")?.value,
      $("filterCountry")?.value,
      $("filterPayment")?.value,
      $("filterPerson")?.value,
      $("filterDateFrom")?.value,
      $("filterDateTo")?.value
    ].filter(Boolean).length;
  }

  function renderExpenseFilterUI() {
    const count = expenseFilterCount();
    const badge = $("expenseFilterCount");
    if (badge) {
      badge.textContent = String(count);
      badge.classList.toggle("hidden", !count);
    }
    $("expenseFiltersToggle")?.classList.toggle("active", count > 0);
  }

  function clearExpenseFilters() {
    ["filterCategory","filterType","filterCountry","filterPayment","filterPerson","filterDateFrom","filterDateTo"].forEach(id => {
      if (!$(id)) return;
      $(id).value = "";
      if (id === "filterDateFrom" || id === "filterDateTo") {
        $(id).dispatchEvent(new Event("input", { bubbles: true }));
      }
    });
    renderExpenseViews();
  }

  function filteredTotal(expenses) {
    const person = $("filterPerson").value;
    if (!person || person === "__unassigned__") {
      if (person === "__unassigned__") return expenses.reduce((sum, e) => sum + num(e.homeAmount), 0);
      return expenses.reduce((sum, e) => sum + num(e.homeAmount), 0);
    }
    return expenses.reduce((sum, e) => {
      const share = (e.personShares || []).find(s => s.personId === person);
      return sum + num(share?.amount);
    }, 0);
  }

  function renderExpenseList(el, expenses, actions = true) {
    el.replaceChildren();

    if (!expenses.length) {
      const empty = document.createElement("div");
      empty.className = "empty empty-premium";
      empty.innerHTML = `
        <span class="empty-premium-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3.5h12v17l-2.2-1.4-1.9 1.4-1.9-1.4-1.9 1.4-1.9-1.4L6 20.5z"/><path d="M9 8h6M9 12h6M9 16h4"/></svg></span>
        <strong>No expenses yet</strong>
        <span>Your spending will appear here as soon as you add the first expense.</span>
      `;

      if (actions) {
        const add = document.createElement("button");
        add.type = "button";
        add.className = "secondary empty-action";
        add.textContent = "＋ Add first expense";
        add.onclick = () => openModal();
        empty.append(add);
      }

      el.append(empty);
      return;
    }

    expenses.forEach(expense => {
      const row = document.createElement("div");
      row.className = "expense";

      const iconEl = document.createElement("div");
      iconEl.className = "expense-icon";
      iconEl.textContent = icon(expense.category);

      const main = document.createElement("div");
      main.className = "expense-main";
      const title = document.createElement("strong");
      title.textContent = expense.note?.trim() || expense.category;
      const sub = document.createElement("span");
      const expenseStop = (state.stops || []).find(s => s.id === expense.stopId);
      const payerText = expense.paidByPersonId ? `Paid by ${personName(expense.paidByPersonId)}` : "Payer not tracked";
      const stopText = expenseStop?.country ? `${expenseStop.country} • ` : "";
      sub.textContent = `${stopText}${expense.category} • ${fmtDateLong(expense.date)} • ${payerText} • For ${expenseAssignmentText(expense)}`;
      main.append(title, sub);

      const side = document.createElement("div");
      side.className = "expense-side";
      const amount = document.createElement("strong");
      amount.textContent = money(expense.homeAmount, state.trip.homeCurrency);
      const original = document.createElement("span");
      original.textContent = expense.currency === state.trip.homeCurrency
        ? expense.currency
        : money(expense.amount, expense.currency);
      side.append(amount, original);

      row.append(iconEl, main, side);

      if (actions) {
        const act = document.createElement("div");
        act.className = "expense-actions";

        const repeat = document.createElement("button");
        repeat.className = "mini";
        repeat.type = "button";
        repeat.textContent = "Repeat";
        repeat.onclick = () => openModal("", expense);

        const edit = document.createElement("button");
        edit.className = "mini";
        edit.type = "button";
        edit.textContent = "Edit";
        edit.onclick = () => openModal(expense.id);

        const del = document.createElement("button");
        del.className = "mini delete";
        del.type = "button";
        del.textContent = "Delete";
        del.onclick = () => removeExpense(expense.id);

        act.append(repeat, edit, del);
        row.append(act);
      }

      el.append(row);
    });
  }

  function renderPersonFilter() {
    const select = $("filterPerson");
    const current = select.value;
    select.replaceChildren();

    const all = document.createElement("option");
    all.value = "";
    all.textContent = "All travelers";
    select.append(all);

    const unassigned = document.createElement("option");
    unassigned.value = "__unassigned__";
    unassigned.textContent = "Unassigned";
    select.append(unassigned);

    state.people.forEach(person => {
      const option = document.createElement("option");
      option.value = person.id;
      option.textContent = person.name + (person.active ? "" : " (archived)");
      select.append(option);
    });

    if ([...select.options].some(o => o.value === current)) select.value = current;
  }

  function fillExpensePeople(selected = "", includeIds = []) {
    const select = $("expensePerson");
    select.replaceChildren();

    const unassigned = document.createElement("option");
    unassigned.value = "";
    unassigned.textContent = "Unassigned";
    select.append(unassigned);

    const active = activePeople();
    if (active.length) {
      const everyone = document.createElement("option");
      everyone.value = "__everyone__";
      everyone.textContent = active.length === 1 ? `Everyone (${active[0].name})` : `Everyone equally (${active.length} people)`;
      select.append(everyone);
    }

    const added = new Set();
    active.forEach(person => {
      const option = document.createElement("option");
      option.value = person.id;
      option.textContent = person.name;
      select.append(option);
      added.add(person.id);
    });

    includeIds.forEach(id => {
      if (!id || added.has(id)) return;
      const person = personById(id);
      if (!person) return;
      const option = document.createElement("option");
      option.value = person.id;
      option.textContent = `${person.name} (archived)`;
      select.append(option);
      added.add(id);
    });

    if ([...select.options].some(o => o.value === selected)) select.value = selected;
    else select.value = "";
  }

  function renderPeopleSnapshot() {
    const el = $("peopleSnapshot");
    el.replaceChildren();

    const rows = personRows(true)
      .filter(r => r.person.active)
      .sort((a, b) => b.amount - a.amount || a.person.name.localeCompare(b.person.name));

    if (!rows.length) {
      const empty = document.createElement("div");
      empty.className = "empty people-empty";
      empty.textContent = "Add a traveler to start assigning expenses.";
      el.append(empty);
      return;
    }

    const total = spent();
    rows.slice(0, 4).forEach(r => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "person-mini-card";
      card.onclick = () => page("people");

      const avatar = document.createElement("span");
      avatar.className = "avatar";
      avatar.textContent = initials(r.person.name);

      const name = document.createElement("strong");
      name.textContent = r.person.name;

      const amount = document.createElement("b");
      amount.textContent = money(r.amount, state.trip.homeCurrency);

      const pct = document.createElement("small");
      pct.textContent = total > 0 ? `${Math.round(r.amount / total * 100)}% of trip spend` : "No assigned spend yet";

      card.append(avatar, name, amount, pct);
      el.append(card);
    });

    if (rows.length > 4) {
      const more = document.createElement("button");
      more.type = "button";
      more.className = "person-mini-card more-people";
      more.onclick = () => page("people");
      const count = document.createElement("strong");
      count.textContent = `+${rows.length - 4} more`;
      const small = document.createElement("small");
      small.textContent = "View all travelers";
      more.append(count, small);
      el.append(more);
    }
  }

  function renderPeoplePage() {
    if (!state.trip) return;
    $("peopleGroupTotal").textContent = money(spent(), state.trip.homeCurrency);
    $("peopleUnassigned").textContent = money(unassignedTotal(), state.trip.homeCurrency);

    const el = $("peopleList");
    el.replaceChildren();
    const rows = personRows(true).sort((a, b) => Number(b.person.active) - Number(a.person.active) || b.amount - a.amount);

    if (!rows.length) {
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.textContent = "No travelers yet.";
      el.append(empty);
      return;
    }

    rows.forEach(r => {
      const card = document.createElement("div");
      card.className = "person-row";

      const avatar = document.createElement("div");
      avatar.className = "avatar";
      avatar.textContent = initials(r.person.name);

      const info = document.createElement("div");
      info.className = "person-row-main";
      const head = document.createElement("div");
      head.className = "person-name-line";
      const name = document.createElement("strong");
      name.textContent = r.person.name;
      head.append(name);
      if (!r.person.active) {
        const badge = document.createElement("span");
        badge.className = "archive-badge";
        badge.textContent = "Archived";
        head.append(badge);
      }
      const sub = document.createElement("span");
      sub.textContent = `${r.expenseCount} assigned expense${r.expenseCount === 1 ? "" : "s"}`;
      info.append(head, sub);

      const value = document.createElement("div");
      value.className = "person-row-value";
      const total = document.createElement("strong");
      total.textContent = money(r.amount, state.trip.homeCurrency);
      const share = document.createElement("span");
      share.textContent = spent() > 0 ? `${Math.round(r.amount / spent() * 100)}% of trip` : "0% of trip";
      value.append(total, share);

      const actions = document.createElement("div");
      actions.className = "person-row-actions";

      const rename = document.createElement("button");
      rename.type = "button";
      rename.className = "mini";
      rename.textContent = "Rename";
      rename.onclick = () => renamePerson(r.person.id);

      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "mini";
      if (!r.person.active) {
        toggle.textContent = "Restore";
        toggle.onclick = () => restorePerson(r.person.id);
      } else if (r.expenseCount > 0) {
        toggle.textContent = "Archive";
        toggle.onclick = () => archivePerson(r.person.id);
      } else {
        toggle.textContent = "Delete";
        toggle.classList.add("delete");
        toggle.onclick = () => deletePerson(r.person.id);
      }

      actions.append(rename, toggle);
      card.append(avatar, info, value, actions);
      el.append(card);
    });
  }

  function renderExpenseViews() {
    if (!state.trip) return;
    renderPersonFilter();
    renderCountryFilter();
    renderExpenseFilterUI();
    const filtered = filteredExpenses();
    renderExpenseList($("allList"), filtered, true);

    const summaryTotal = filteredTotal(filtered);
    const suffix = $("filterPerson").value && $("filterPerson").value !== "__unassigned__" ? " assigned share" : "";
    $("expenseSummary").textContent = `${filtered.length} expense${filtered.length === 1 ? "" : "s"} • ${money(summaryTotal, state.trip.homeCurrency)}${suffix}`;
  }


  function renderAnalyticsOverview() {
    if (!state.trip) return;

    const total = spent();
    const budget = num(state.trip.budget);
    const remaining = budget - total;
    const pct = budget > 0 ? clamp(total / budget * 100, 0, 100) : 0;
    const categories = aggregate("category");
    const top = categories[0] || null;

    let personal = 0;
    let shared = 0;

    state.expenses.forEach(expense => {
      const type = expense.expenseType === "shared" || expense.expenseType === "personal"
        ? expense.expenseType
        : ((expense.personShares || []).length > 1 ? "shared" : "personal");

      if (type === "shared") shared += num(expense.homeAmount);
      else personal += num(expense.homeAmount);
    });

    if ($("analyticsTotalSpent")) {
      $("analyticsTotalSpent").textContent = money(total, state.trip.homeCurrency)
        .replace(` ${state.trip.homeCurrency}`, "");
    }
    if ($("analyticsCurrency")) $("analyticsCurrency").textContent = state.trip.homeCurrency;

    if ($("analyticsBudgetPct")) {
      $("analyticsBudgetPct").textContent = budget > 0
        ? `${Math.round(total / budget * 100)}% of budget`
        : "No budget";
      $("analyticsBudgetPct").classList.toggle("over", budget > 0 && total > budget);
    }

    if ($("analyticsBudgetBar")) {
      $("analyticsBudgetBar").style.width = `${pct}%`;
      $("analyticsBudgetBar").classList.toggle("over", budget > 0 && total > budget);
    }

    if ($("analyticsRemaining")) {
      $("analyticsRemaining").textContent = remaining >= 0
        ? money(remaining, state.trip.homeCurrency)
        : `${money(Math.abs(remaining), state.trip.homeCurrency)} over`;
      $("analyticsRemaining").classList.toggle("analytics-over", remaining < 0);
    }

    if ($("analyticsTopCategory")) {
      $("analyticsTopCategory").textContent = top
        ? `${icon(top.label)} ${top.label}`
        : "No spending yet";
    }

    if ($("analyticsCategoryHint")) {
      $("analyticsCategoryHint").textContent = top
        ? `${icon(top.label)} ${top.label} is highest at ${money(top.amount, state.trip.homeCurrency)}`
        : "Spending by category";
    }

    if ($("analyticsPersonalSpend")) {
      $("analyticsPersonalSpend").textContent = money(personal, state.trip.homeCurrency);
    }
    if ($("analyticsSharedSpend")) {
      $("analyticsSharedSpend").textContent = money(shared, state.trip.homeCurrency);
    }
    if ($("analyticsExpenseCount")) {
      $("analyticsExpenseCount").textContent = String(state.expenses.length);
    }
  }

  function renderAnalyticsPage() {
    if (!state.trip) return;

    const t = state.trip;
    const s = spent();
    const count = state.expenses.length;

    renderAnalyticsOverview();
    $("avgDay").textContent = money(s / Math.max(1, elapsed() || 1), t.homeCurrency);
    $("avgTransaction").textContent = money(count ? s / count : 0, t.homeCurrency);
    $("largest").textContent = money(state.expenses.reduce((m, e) => Math.max(m, num(e.homeAmount)), 0), t.homeCurrency);

    const drows = dailyRows();
    const biggest = drows.length ? drows.slice().sort((a, b) => b.amount - a.amount)[0] : null;
    $("biggestDay").textContent = biggest ? `${fmtDate(biggest.date)} • ${money(biggest.amount, t.homeCurrency)}` : "—";

    renderBars($("categoryAnalytics"), aggregate("category"), r => `${icon(r.label)} ${r.label}`);
    renderBars($("paymentAnalytics"), aggregate("paymentMethod"));
    renderPeopleBars();
    renderDaily($("dailyAnalytics"));
  }

  function render() {
    const hasTrip = !!state.trip;
    $("setupView").classList.toggle("hidden", hasTrip);
    $("mainView").classList.toggle("hidden", !hasTrip);
    $("nav").classList.toggle("hidden", !hasTrip);
    $("navAdd")?.classList.toggle("hidden", !hasTrip);
    $("settingsShortcut").classList.toggle("hidden", !hasTrip);

    if (!hasTrip) {
      $("headerTitle").textContent = "TripSpend";
      $("headerSub").textContent = "Travel spending, made simple.";
      renderSetupTripHistory();
      renderTripsPage();
      return;
    }

    const t = state.trip, s = spent(), remaining = t.budget - s, daysLeft = left();
    const pct = t.budget > 0 ? clamp(s / t.budget * 100, 0, 100) : 0;
    const forecast = projected();

    $("headerTitle").textContent = t.name;
    $("headerSub").textContent = `${countryFlag(t.destination)} ${t.destination} • ${fmtDate(t.startDate)} – ${fmtDate(t.endDate)}`;

    renderHealth();
    $("remainingValue").textContent = money(remaining, t.homeCurrency).replace(` ${t.homeCurrency}`, "");
    $("remainingCode").textContent = t.homeCurrency;
    const rawBudgetPct = t.budget > 0 ? (s / t.budget * 100) : 0;
    $("usedPct").textContent = `${Math.round(rawBudgetPct)}% used`;
    $("usedPct").classList.toggle("budget-watch", rawBudgetPct >= 80 && rawBudgetPct <= 100);
    $("usedPct").classList.toggle("budget-over", rawBudgetPct > 100);
    $("progressBar").style.width = `${pct}%`;
    $("progressBar").classList.toggle("budget-watch", rawBudgetPct >= 80 && rawBudgetPct <= 100);
    $("progressBar").classList.toggle("budget-over", rawBudgetPct > 100);
    $("budgetValue").textContent = money(t.budget, t.homeCurrency);
    $("spentValue").textContent = money(s, t.homeCurrency);
    $("safeToday").textContent = money(daysLeft > 0 ? Math.max(0, remaining) / daysLeft : 0, t.homeCurrency);
    $("spentToday").textContent = money(todaySpent(), t.homeCurrency);
    $("projectedTotal").textContent = forecast > 0 ? money(forecast, t.homeCurrency) : "—";
    $("daysLeft").textContent = String(daysLeft);

    const activePage = document.querySelector(".page.active")?.id || "dashboard";

    // v6.4 only renders heavier views when they are actually visible.
    if (activePage === "expenses") renderExpenseViews();
    if (activePage === "analytics") renderAnalyticsPage();

    if (activePage === "settings") {
      fillSettings();
      renderAppearanceControls();
      renderRates();
      renderStoragePanel();
    }

    if (activePage === "trips") renderTripsPage();
    if (activePage === "people") renderPeoplePage();

    window.dispatchEvent(new CustomEvent("tripspend:render", { detail: { activePage } }));
  }

  function page(id) {
    document.querySelectorAll(".page").forEach(p => p.classList.toggle("active", p.id === id));
    const navPage = id === "trips" || id === "people" ? "settings" : id;
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.toggle("active", b.dataset.page === navPage));
    window.scrollTo({ top: 0, behavior: "smooth" });

    const started = performance.now();

    if (id === "people") renderPeoplePage();
    if (id === "expenses") renderExpenseViews();
    if (id === "analytics") renderAnalyticsPage();
    if (id === "settings") {
      fillSettings();
      renderAppearanceControls();
      renderRates();
      renderStoragePanel();
    }
    if (id === "trips") renderTripsPage();

    lastRenderMs = performance.now() - started;
    window.dispatchEvent(new CustomEvent("tripspend:page", { detail: { id } }));
  }


  function renderRecentCategoryChips() {
    const el = $("recentCategoryChips");
    if (!el) return;

    el.replaceChildren();
    const recent = (state.preferences?.recentCategories || [])
      .filter(category => CATS.includes(category))
      .slice(0, 4);

    el.classList.toggle("hidden", !recent.length);

    recent.forEach(category => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "recent-category-chip";
      button.textContent = `${icon(category)} ${category}`;
      button.onclick = () => {
        $("expenseCategory").value = category;
        duplicateCheck();
        renderRecentCategoryChips();
      };
      el.append(button);
    });
  }

  function openModal(id = "", template = null) {
    if (!state.trip) return;

    const existing = id ? state.expenses.find(e => e.id === id) : null;
    const source = existing || template;
    const isRepeat = !existing && !!template;

    $("editId").value = existing?.id || "";
    $("modalTitle").textContent = existing ? "Edit Expense" : isRepeat ? "Repeat Expense" : "Add Expense";

    opts($("expenseCurrency"), CURS, source?.currency || state.trip.tripCurrency);
    opts($("expenseCategory"), CATS, source?.category || state.preferences?.lastCategory || "Food");
    opts($("paymentMethod"), PAYS, source?.paymentMethod || state.preferences?.lastPaymentMethod || state.trip.defaultPayment || "Credit Card");

    const selection = source ? selectedPersonValue(source) : (activePeople().length === 1 ? activePeople()[0].id : "");
    const includeIds = source?.personShares?.map(s => s.personId) || [];
    fillExpensePeople(selection, includeIds);

    $("expenseAmount").value = source?.amount ?? "";
    $("exchangeRate").value = source?.rate ?? "";
    $("expenseDate").value = existing ? existing.date : today();
    $("expenseDate").dispatchEvent(new Event("input", { bubbles: true }));
    $("expenseNote").value = source?.note || "";
    $("liveRateStatus").textContent = "";

    suggestedCategory = "";
    $("categorySuggestion").classList.add("hidden");
    rateUI(true);
    preview();
    duplicateCheck();
    renderRecentCategoryChips();

    const smartPrep = window.TripSpendV5?.prepareExpense?.(source, existing, isRepeat);
    Promise.resolve(smartPrep)
      .catch(() => {})
      .finally(() => {
        window.TripSpendV61?.prepareSmartExpenseUI?.({ existing: !!existing, isRepeat: !!isRepeat });
      });

    $("modal").classList.remove("hidden");
    document.body.style.overflow = "hidden";
    setTimeout(() => $("expenseAmount").focus(), 60);
  }

  function closeModal() {
    $("modal").classList.add("hidden");
    document.body.style.overflow = "";
    $("expenseForm").reset();
    $("editId").value = "";
  }

  function rateUI(autofill = false) {
    const currency = $("expenseCurrency").value;
    const same = currency === state.trip.homeCurrency;
    $("rateWrap").classList.toggle("hidden", same);
    $("exchangeRate").required = !same;
    $("rateHelp").textContent = `Enter how many ${currency} equal 1 ${state.trip.homeCurrency}.`;

    const remembered = savedRate(currency), mem = $("rateMemory");
    if (!same && remembered > 0) {
      mem.textContent = `Remembered rate: 1 ${state.trip.homeCurrency} = ${remembered} ${currency}`;
      mem.classList.remove("hidden");
      if (autofill && !$("exchangeRate").value) $("exchangeRate").value = remembered;
    } else {
      mem.classList.add("hidden");
    }
  }

  function preview() {
    if (!state.trip) return;
    const currency = $("expenseCurrency").value;
    const rate = currency === state.trip.homeCurrency ? 1 : num($("exchangeRate").value);
    $("conversion").textContent = "≈ " + money(toHome($("expenseAmount").value, currency, rate), state.trip.homeCurrency);
  }

  function suggestCategory() {
    const q = $("expenseNote").value.trim().toLowerCase();
    suggestedCategory = "";
    if (q.length < 2) {
      $("categorySuggestion").classList.add("hidden");
      return;
    }

    for (const [category, words] of Object.entries(KEYWORDS)) {
      if (words.some(word => q.includes(word))) {
        suggestedCategory = category;
        break;
      }
    }

    if (suggestedCategory && suggestedCategory !== $("expenseCategory").value) {
      $("suggestionText").textContent = `Looks like ${icon(suggestedCategory)} ${suggestedCategory}`;
      $("categorySuggestion").classList.remove("hidden");
    } else {
      $("categorySuggestion").classList.add("hidden");
    }
  }

  function duplicateCheck() {
    if (!state.trip) return;
    const id = $("editId").value;
    const amount = num($("expenseAmount").value);
    const date = $("expenseDate").value;
    const note = $("expenseNote").value.trim().toLowerCase();
    const category = $("expenseCategory").value;
    const currency = $("expenseCurrency").value;

    const dup = amount > 0 && state.expenses.some(e =>
      e.id !== id &&
      Math.abs(num(e.amount) - amount) < 0.000001 &&
      e.currency === currency &&
      e.date === date &&
      e.category === category &&
      (!note || !e.note || e.note.trim().toLowerCase() === note)
    );

    $("duplicateWarning").classList.toggle("hidden", !dup);
  }

  function removeExpense(id) {
    const expense = state.expenses.find(x => x.id === id);
    if (expense && confirm(`Delete ${expense.note || expense.category}?`)) {
      state.expenses = state.expenses.filter(x => x.id !== id);
      save();
      render();
      toast("Expense deleted");
    }
  }

  function fillSettings() {
    const t = state.trip;
    $("sTripName").value = t.name;
    setDestinationValue("sDestination", t.destination);
    $("sStartDate").value = t.startDate;
    $("sEndDate").value = t.endDate;
    if ($("sStartDateDisplay")) $("sStartDateDisplay").textContent = fmtDateWithYear(t.startDate);
    if ($("sEndDateDisplay")) $("sEndDateDisplay").textContent = fmtDateWithYear(t.endDate);
    $("sBudget").value = t.budget;
    opts($("sHomeCurrency"), CURS, t.homeCurrency);
    opts($("sTripCurrency"), CURS, t.tripCurrency);
    opts($("sDefaultPayment"), PAYS, t.defaultPayment || "Credit Card");
  }

  function renderRates() {
    const el = $("savedRates");
    el.replaceChildren();
    const rows = Object.entries(state.rates || {});

    if (!rows.length) {
      const empty = document.createElement("span");
      empty.className = "mini-summary";
      empty.textContent = "No saved rates yet.";
      el.append(empty);
      return;
    }

    rows.forEach(([pair, rate]) => {
      const row = document.createElement("div");
      row.className = "rate-chip";
      const label = document.createElement("span");
      label.textContent = pair;
      const value = document.createElement("strong");
      value.textContent = rate;
      row.append(label, value);
      el.append(row);
    });
  }

  function validDates(a, b) {
    return a && b && a <= b;
  }

  function renamePerson(id) {
    const person = personById(id);
    if (!person) return;
    const value = prompt("Traveler name", person.name);
    if (value === null) return;
    const name = value.trim().slice(0, 50);
    if (!name) return toast("Name cannot be empty");

    const duplicate = state.people.some(p => p.id !== id && p.active && p.name.toLowerCase() === name.toLowerCase());
    if (duplicate) return toast("That traveler already exists");

    person.name = name;
    save();
    render();
    toast("Traveler renamed");
  }

  function archivePerson(id) {
    const person = personById(id);
    if (!person) return;
    const activeCount = activePeople().length;
    const warning = activeCount <= 1
      ? `Archive ${person.name}? You will have no active travelers until you restore or add someone. Historical totals will stay intact.`
      : `Archive ${person.name}? Historical spending will stay intact, but they will no longer appear when adding new expenses.`;
    if (!confirm(warning)) return;
    person.active = false;
    save();
    render();
    toast("Traveler archived");
  }

  function restorePerson(id) {
    const person = personById(id);
    if (!person) return;
    person.active = true;
    save();
    render();
    toast("Traveler restored");
  }

  function deletePerson(id) {
    const person = personById(id);
    if (!person) return;
    const used = state.expenses.some(e => (e.personShares || []).some(s => s.personId === id));
    if (used) return toast("Archive this traveler instead to preserve history");
    if (!confirm(`Delete ${person.name} from this trip?`)) return;
    state.people = state.people.filter(p => p.id !== id);
    save();
    render();
    toast("Traveler deleted");
  }

  $("setupForm").onsubmit = e => {
    e.preventDefault();
    const primaryStart = $("startDate").value, primaryEnd = $("endDate").value;
    if (!validDates(primaryStart, primaryEnd)) return toast("The first country's end date must be after its start date");
    const destination = canonicalDestination("destination");
    if (!destination) return;

    const ownerName = $("ownerName").value.trim().replace(/\s+/g, " ").slice(0, 50);
    if (!ownerName) return toast("Enter your name");

    const setupExtraPeople = window.TripSpendV5?.setupPeople?.() || [];
    if (setupExtraPeople.some(person => person.name.trim().toLowerCase() === ownerName.toLowerCase())) {
      return toast("Traveler names must be unique");
    }

    const setupExtraStops = window.TripSpendV5?.setupStops?.() || [];
    const primaryStop = {
      id: "stop-primary",
      country: destination,
      startDate: primaryStart,
      endDate: primaryEnd,
      currency: $("tripCurrency").value,
      budget: num($("primaryCountryBudget")?.value, 0),
      createdAt: Date.now()
    };

    const allSetupStops = [primaryStop, ...setupExtraStops];
    const tripStart = allSetupStops.map(stop => stop.startDate).filter(Boolean).sort()[0] || primaryStart;
    const tripEnd = allSetupStops.map(stop => stop.endDate).filter(Boolean).sort().at(-1) || primaryEnd;

    const preservedHistory = safeClone(state.tripHistory || []);
    const preservedAppearance = normalizedAppearance(state.preferences?.appearance || "system");

    state = {
      trip: {
        id: uid("trip"),
        name: $("tripName").value.trim(),
        destination,
        startDate: tripStart,
        endDate: tripEnd,
        budget: num($("budget").value),
        homeCurrency: $("homeCurrency").value,
        tripCurrency: $("tripCurrency").value,
        defaultPayment: "Credit Card",
        createdAt: Date.now()
      },
      expenses: [],
      rates: {},
      people: [
        makePerson(ownerName),
        ...(window.TripSpendV5?.setupPeople?.() || []).map(person => makePerson(person.name))
      ],
      stops: allSetupStops,
      plans: [],
      settlements: [],
      tripHistory: preservedHistory,
      preferences: {
        lastPaymentMethod: "Credit Card",
        lastCategory: "Food",
        recentCategories: [],
        lastStopId: "",
        lastPaidByPersonId: "",
        appearance: preservedAppearance
      }
    };

    // A one-country trip automatically uses the total trip budget as its
    // country budget when the user leaves Country budget blank.
    if (state.stops.length === 1 && !(state.stops[0].budget > 0)) {
      state.stops[0].budget = num(state.trip.budget);
    }

    window.TripSpendV5?.clearSetupStops?.();
    window.TripSpendV5?.clearSetupPeople?.();
    save();
    render();
    page("dashboard");
    const countryText = state.stops.length > 1 ? `${state.stops.length} countries` : "1 country";
    const travelerText = state.people.length > 1 ? `${state.people.length} travelers` : "1 traveler";
    toast(`Trip created • ${countryText} • ${travelerText}`);
  };

  $("settingsForm").onsubmit = e => {
    e.preventDefault();
    const start = $("sStartDate").value, end = $("sEndDate").value;
    if (!validDates(start, end)) return toast("End date must be after start date");
    const destination = canonicalDestination("sDestination");
    if (!destination) return;

    const newHome = $("sHomeCurrency").value;
    if (state.expenses.length && newHome !== state.trip.homeCurrency &&
        !confirm("Existing expenses and traveler shares will not be recalculated into the new home currency. Continue?")) return;

    state.trip = {
      ...state.trip,
      name: $("sTripName").value.trim(),
      destination,
      startDate: start,
      endDate: end,
      budget: num($("sBudget").value),
      homeCurrency: newHome,
      tripCurrency: $("sTripCurrency").value,
      defaultPayment: $("sDefaultPayment").value
    };

    if (state.stops?.length === 1) {
      state.stops[0] = {
        ...state.stops[0],
        country: destination,
        startDate: start,
        endDate: end,
        currency: $("sTripCurrency").value,
        budget: num($("sBudget").value)
      };
    }

    save();
    render();
    toast("Trip updated");
  };

  $("expenseForm").onsubmit = e => {
    e.preventDefault();

    const amount = num($("expenseAmount").value);
    const currency = $("expenseCurrency").value;
    const rate = currency === state.trip.homeCurrency ? 1 : num($("exchangeRate").value);

    if (amount <= 0) return toast("Enter an amount greater than zero");
    if (currency !== state.trip.homeCurrency && rate <= 0) return toast("Enter a valid exchange rate");

    const homeAmount = toHome(amount, currency, rate);
    const selection = $("expensePerson").value;
    if (selection === "__everyone__" && !activePeople().length) return toast("Add an active traveler first");

    const x = {
      id: $("editId").value || uid("expense"),
      amount,
      currency,
      rate,
      homeAmount,
      category: $("expenseCategory").value,
      paymentMethod: $("paymentMethod").value,
      date: $("expenseDate").value,
      note: $("expenseNote").value.trim(),
      personShares: makePersonShares(selection, homeAmount),
      createdAt: Date.now()
    };

    const v5ExpenseData = window.TripSpendV5?.expenseData?.(homeAmount);
    if (v5ExpenseData?.__error) return toast(v5ExpenseData.__error);
    if (v5ExpenseData) {
      delete v5ExpenseData.__error;
      Object.assign(x, v5ExpenseData);
    }

    const index = state.expenses.findIndex(y => y.id === x.id);
    if (index >= 0) {
      x.createdAt = state.expenses[index].createdAt;
      state.expenses[index] = x;
    } else {
      state.expenses.push(x);
    }

    if (currency !== state.trip.homeCurrency) state.rates[rateKey(currency)] = rate;

    state.preferences = state.preferences || {};
    state.preferences.lastPaymentMethod = x.paymentMethod;
    state.preferences.lastCategory = x.category;
    state.preferences.lastStopId = x.stopId || "";
    state.preferences.lastPaidByPersonId = x.paidByPersonId || "";
    state.preferences.recentCategories = [
      x.category,
      ...(state.preferences.recentCategories || []).filter(category => category !== x.category)
    ].filter(category => CATS.includes(category)).slice(0, 5);

    save();

    const saveButton = e.submitter || $("expenseForm")?.querySelector('button[type="submit"]');
    const originalLabel = saveButton?.textContent || "Save Expense";
    if (saveButton) {
      saveButton.disabled = true;
      saveButton.classList.add("save-success");
      saveButton.innerHTML = `<span class="save-check"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.2 4.2L19.5 6.8"/></svg></span> Saved`;
    }

    const message = index >= 0 ? "Expense updated" : "Expense saved";
    window.setTimeout(() => {
      closeModal();
      render();
      toast(message);

      if (saveButton) {
        saveButton.disabled = false;
        saveButton.classList.remove("save-success");
        saveButton.textContent = originalLabel;
      }
    }, 260);
  };

  $("addPersonForm").onsubmit = e => {
    e.preventDefault();
    const name = $("newPersonName").value.trim().slice(0, 50);
    if (!name) return toast("Enter a traveler name");

    const activeDuplicate = state.people.some(p => p.active && p.name.toLowerCase() === name.toLowerCase());
    if (activeDuplicate) return toast("That traveler is already on the trip");

    state.people.push(makePerson(name));
    $("newPersonName").value = "";
    save();
    render();
    toast("Traveler added");
  };

  function download(name, text, type) {
    const blob = new Blob([text], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.append(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function exportBackup() {
    const name = (state.trip?.name || "tripspend").replace(/[^a-z0-9]+/gi, "-");
    download(
      `${name}-backup.json`,
      JSON.stringify({ app: "TripSpend", version: 6, appVersion: APP_VERSION, exportedAt: new Date().toISOString(), data: state }, null, 2),
      "application/json"
    );
    toast("Backup exported");
  }

  function csvCell(v) {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
  }

  function exportCSV() {
    if (!state.trip) return;
    const headers = [
      "Date", "Category", "Note", "Payment Method",
      "Original Amount", "Original Currency", "Exchange Rate",
      "Home Amount", "Home Currency", "Country", "Expense Type", "Paid By", "Expense For", "Traveler Shares"
    ];

    const rows = state.expenses.slice().sort(sortNew).map(e => {
      const shares = e.personShares || [];
      const assigned = expenseAssignmentText(e);
      const detail = shares.map(s => `${personName(s.personId)}: ${money(s.amount, state.trip.homeCurrency)}`).join(" | ");
      return [
        e.date, e.category, e.note, e.paymentMethod,
        e.amount, e.currency, e.rate, e.homeAmount, state.trip.homeCurrency,
        (state.stops || []).find(s => s.id === e.stopId)?.country || "",
        e.expenseType === "shared" ? "Shared" : "Personal",
        e.paidByPersonId ? personName(e.paidByPersonId) : "",
        assigned, detail
      ];
    });

    download(
      `${state.trip.name.replace(/[^a-z0-9]+/gi, "-")}-expenses.csv`,
      [headers, ...rows].map(r => r.map(csvCell).join(",")).join("\n"),
      "text/csv;charset=utf-8"
    );
    toast("CSV exported");
  }

  async function importBackup(file) {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const data = parsed.data || parsed;
      if (!data?.trip || !Array.isArray(data.expenses)) throw new Error("invalid");
      if (!confirm("Import this backup? It will replace the current trip in this browser.")) return;

      if (meaningfulState(state) && storageMode === "indexeddb") {
        await createBackupSnapshot("Before import", state, "before-import");
      }

      state = normalizeState(data);
      await persistStateImmediately(state);
      applyAppearance(state.preferences?.appearance || "system");
      render();
      page("dashboard");
      toast("Backup imported");
    } catch {
      alert("That file is not a valid TripSpend backup.");
    } finally {
      $("importFile").value = "";
    }
  }

  $("createSnapshotBtn")?.addEventListener("click", async () => {
    if (!meaningfulState(state)) return toast("Nothing to snapshot yet");
    if (storageMode !== "indexeddb") return toast("Restore points need IndexedDB");

    try {
      await flushPendingSave();
      await createBackupSnapshot("Manual snapshot", state, "manual");
      toast("Snapshot saved");
    } catch {
      toast("Could not save snapshot");
    }
  });

  $("exportBtn").onclick = exportBackup;
  $("csvBtn").onclick = exportCSV;
  $("importFile").onchange = e => importBackup(e.target.files?.[0]);

  $("clearRates").onclick = () => {
    if (confirm("Clear all remembered exchange rates?")) {
      state.rates = {};
      save();
      renderRates();
      toast("Saved rates cleared");
    }
  };

  $("deleteTrip").onclick = async () => {
    if (state.trip && confirm(`Delete “${state.trip.name}” and all expenses?`)) {
      try {
        if (storageMode === "indexeddb") {
          await createBackupSnapshot("Before deleting trip", state, "before-delete");
        }

        const history = safeClone(state.tripHistory || []);
        const appearance = state.preferences?.appearance || "system";
        state = emptyActiveTripState(history, appearance);
        await persistStateImmediately(state, { maintainBackups: false });
        localStorage.removeItem(KEY);

        resetSetupForNewTrip();
        render();
        toast("Current trip deleted");
      } catch {
        alert("TripSpend could not delete the trip safely.");
      }
    }
  };

  ["quickAdd", "pageAdd", "navAdd"].forEach(id => $(id).onclick = () => openModal());
  $("closeModal").onclick = closeModal;
  $("modal").onclick = e => { if (e.target === $("modal")) closeModal(); };

  $("expenseAmount").oninput = () => { preview(); duplicateCheck(); };
  $("exchangeRate").oninput = preview;
  $("expenseCurrency").onchange = () => { rateUI(true); preview(); duplicateCheck(); };
  $("expenseDate").onchange = duplicateCheck;
  $("expenseCategory").onchange = () => { suggestCategory(); duplicateCheck(); };
  $("expenseNote").oninput = () => { suggestCategory(); duplicateCheck(); };

  $("applySuggestion").onclick = () => {
    if (suggestedCategory) {
      $("expenseCategory").value = suggestedCategory;
      $("categorySuggestion").classList.add("hidden");
      duplicateCheck();
    }
  };

  $("searchExpense").oninput = renderExpenseViews;
  ["filterCategory","filterType","filterCountry","filterPayment","filterPerson","filterDateFrom","filterDateTo"].forEach(id => {
    if ($(id)) $(id).onchange = renderExpenseViews;
  });

  $("expenseFiltersToggle")?.addEventListener("click", () => {
    const panel = $("expenseAdvancedFilters");
    if (!panel) return;
    panel.classList.toggle("hidden");
    $("expenseFiltersToggle").classList.toggle("open", !panel.classList.contains("hidden"));
  });

  $("clearExpenseFilters")?.addEventListener("click", clearExpenseFilters);

  $("seeAll").onclick = () => page("expenses");
  $("settingsShortcut").onclick = () => page("settings");
  $("managePeople").onclick = () => page("people");
  $("settingsPeople").onclick = () => page("people");
  $("settingsTrips")?.addEventListener("click", () => page("trips"));
  $("tripsDone")?.addEventListener("click", () => page("settings"));
  $("finishTripBtn")?.addEventListener("click", showFinishTripSummary);
  $("startNewTripBtn")?.addEventListener("click", startNewTripFlow);
  $("closeFinishTrip")?.addEventListener("click", closeFinishTripSummary);
  $("cancelFinishTrip")?.addEventListener("click", closeFinishTripSummary);
  $("confirmFinishTrip")?.addEventListener("click", finishCurrentTrip);
  $("finishTripModal")?.addEventListener("click", event => {
    if (event.target === $("finishTripModal")) closeFinishTripSummary();
  });
  $("peopleDone").onclick = () => page("dashboard");

  document.querySelectorAll(".nav-btn").forEach(button => {
    button.onclick = () => page(button.dataset.page);
  });

  document.querySelectorAll("[data-appearance]").forEach(button => {
    button.onclick = () => setAppearancePreference(button.dataset.appearance);
  });

  const colorSchemeMedia = window.matchMedia?.("(prefers-color-scheme: dark)");
  colorSchemeMedia?.addEventListener?.("change", () => {
    if (normalizedAppearance(state.preferences?.appearance || "system") === "system") {
      applyAppearance("system");
    }
  });

  document.onkeydown = e => {
    if (e.key !== "Escape") return;
    if (!$("modal").classList.contains("hidden")) closeModal();
    if (!$("finishTripModal")?.classList.contains("hidden")) closeFinishTripSummary();
  };

  function isStandaloneApp() {
    return window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
  }

  function isIOSDevice() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  }

  function isIOSSafari() {
    const ua = navigator.userAgent;
    return isIOSDevice() &&
      /Safari/i.test(ua) &&
      !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua);
  }

  function updateInstallUI() {
    const card = $("installCard");
    const button = $("installBtn");
    const help = $("installHelp");
    if (!card || !button || !help) return;

    if (isStandaloneApp()) {
      card.classList.add("install-complete");
      $("installTitle").textContent = "TripSpend is installed";
      $("installText").textContent = "You are already using the home-screen app.";
      button.textContent = "Installed ✓";
      button.disabled = true;
      help.classList.add("hidden");
      return;
    }

    card.classList.remove("install-complete");
    button.disabled = false;

    if (installPrompt) {
      $("installTitle").textContent = "Install TripSpend";
      $("installText").textContent = "Add TripSpend as an app on this device.";
      button.textContent = "Install TripSpend";
      help.classList.add("hidden");
      return;
    }

    if (isIOSDevice()) {
      $("installTitle").textContent = "Add TripSpend to Home Screen";
      $("installText").textContent = isIOSSafari()
        ? "Safari installs TripSpend from the Share menu."
        : "On iPhone, open TripSpend in Safari to add it to your Home Screen.";
      button.textContent = isIOSSafari() ? "Show iPhone Steps" : "How to Install";
      return;
    }

    $("installTitle").textContent = "Install TripSpend";
    $("installText").textContent = "Install availability depends on your browser.";
    button.textContent = "Show Install Steps";
  }

  window.addEventListener("beforeinstallprompt", e => {
    e.preventDefault();
    installPrompt = e;
    updateInstallUI();
  });

  window.addEventListener("appinstalled", () => {
    installPrompt = null;
    updateInstallUI();
    toast("TripSpend installed");
  });

  window.matchMedia("(display-mode: standalone)").addEventListener?.("change", updateInstallUI);

  $("installBtn").onclick = async () => {
    const help = $("installHelp");

    if (isStandaloneApp()) {
      updateInstallUI();
      return;
    }

    if (installPrompt) {
      installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice?.outcome === "accepted") {
        installPrompt = null;
      }
      updateInstallUI();
      return;
    }

    if (isIOSDevice()) {
      help.textContent = isIOSSafari()
        ? "1. Tap the Share button (square with the upward arrow).\n2. Scroll and tap “Add to Home Screen”.\n3. Tap “Add”.\n\nAfter that, open TripSpend from its Home Screen icon."
        : "1. Open this TripSpend page in Safari.\n2. Tap Safari’s Share button.\n3. Choose “Add to Home Screen”.\n4. Tap “Add”.";
      help.classList.remove("hidden");
      return;
    }

    help.textContent = "Open your browser menu and look for “Install app”, “Install TripSpend”, or “Add to Home screen”. If that option is not shown yet, refresh the page once and try again.";
    help.classList.remove("hidden");
  };

  updateInstallUI();


  $("analyticsMoreToggle")?.addEventListener("click", () => {
    const details = $("analyticsMoreDetails");
    const arrow = $("analyticsMoreArrow");
    if (!details) return;

    const open = details.classList.contains("hidden");
    details.classList.toggle("hidden", !open);
    if (arrow) arrow.textContent = open ? "⌃" : "⌄";
    $("analyticsMoreToggle")?.classList.toggle("open", open);
  });

  function setupDateDisplays() {
    const display = (inputId, displayId) => {
      const input = $(inputId);
      const target = $(displayId);
      if (!input || !target) return;
      const refresh = () => {
        target.textContent = input.value ? fmtDate(input.value) : "Select date";
      };
      input.addEventListener("change", refresh);
      input.addEventListener("input", refresh);
      refresh();
    };
    display("startDate", "startDateDisplay");
    display("endDate", "endDateDisplay");

    const settingsDisplay = (inputId, displayId) => {
      const input = $(inputId);
      const target = $(displayId);
      if (!input || !target) return;
      const refresh = () => {
        target.textContent = input.value ? fmtDateWithYear(input.value) : "Select date";
      };
      input.addEventListener("change", refresh);
      input.addEventListener("input", refresh);
      refresh();
    };
    settingsDisplay("sStartDate", "sStartDateDisplay");
    settingsDisplay("sEndDate", "sEndDateDisplay");
    settingsDisplay("expenseDate", "expenseDateDisplay");
    settingsDisplay("filterDateFrom", "filterDateFromDisplay");
    settingsDisplay("filterDateTo", "filterDateToDisplay");
  }

  function initDates() {
    const t = today();
    $("startDate").value = t;
    const d = new Date();
    d.setDate(d.getDate() + 6);
    $("endDate").value = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

    if ($("startDateDisplay")) $("startDateDisplay").textContent = fmtDate($("startDate").value);
    if ($("endDateDisplay")) $("endDateDisplay").textContent = fmtDate($("endDate").value);
  }

  initDestinationAutocomplete("destination", "destinationOptions", "");
  initDestinationAutocomplete("sDestination", "sDestinationOptions", "");

  window.TripSpendCore = {
    getState: () => state,
    save,
    render,
    page,
    openModal,
    toast,
    uid,
    money,
    fmtDate,
    fmtDateWithYear,
    fmtDateLong,
    num,
    today,
    spent,
    todaySpent,
    validDates,
    opts,
    CURS,
    DESTS,
    CATS,
    PAYS,
    activePeople,
    personName,
    personById,
    makePerson,
    initDestinationAutocomplete,
    canonicalDestination,
    setDestinationValue,
    countryFlag,
    countryLabel,
    renderStoragePanel,
    flushPendingSave,
    settlementBalancesFor,
    settlementOutstandingFor,
    renderTripsPage
  };
  opts($("homeCurrency"), CURS, "OMR");
  opts($("tripCurrency"), CURS, "THB");
  opts($("sHomeCurrency"), CURS, "OMR");
  opts($("sTripCurrency"), CURS, "THB");
  opts($("sDefaultPayment"), PAYS, "Credit Card");
  opts($("expenseCurrency"), CURS, "THB");
  opts($("expenseCategory"), CATS, "Food");
  opts($("paymentMethod"), PAYS, "Credit Card");

  CATS.forEach(([name, emoji]) => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = `${emoji} ${name}`;
    $("filterCategory").append(option);
  });

  PAYS.forEach(name => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    $("filterPayment").append(option);
  });

  setupDateDisplays();
  initDates();
  initializePersistentStorage(legacySeedState);

  // Flush the most recent in-memory state when iOS backgrounds the PWA.
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && storageMode === "indexeddb" && pendingStorageSnapshot) {
      flushPendingSave();
    }
  });

  window.addEventListener("pagehide", () => {
    if (storageMode === "indexeddb" && pendingStorageSnapshot) {
      flushPendingSave();
    }
  });

  async function checkAppVersion() {
    try {
      const response = await fetch(`./version.json?t=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) return;
      const latest = await response.json();
      if (!latest?.version || latest.version === APP_VERSION) return;

      const banner = $("updateBanner");
      const versionText = $("updateVersionText");
      if (versionText) versionText.textContent = `v${latest.version} is ready`;
      if (banner) banner.classList.remove("hidden");
    } catch {
      // Offline is fine; the installed app continues using the current cached version.
    }
  }

  async function forceAppUpdate() {
    try {
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.update().catch(() => {});
        }
      }
      const keys = await caches.keys();
      await Promise.all(
        keys.filter(key => key.startsWith("tripspend-")).map(key => caches.delete(key))
      );
    } catch {
      // Ignore cache-management failures and still reload.
    }
    location.reload();
  }

  $("applyUpdateBtn")?.addEventListener("click", forceAppUpdate);

  if ("serviceWorker" in navigator) {
    addEventListener("load", async () => {
      try {
        const reg = await navigator.serviceWorker.register("./sw.js?v=6.5.2", {
          updateViaCache: "none"
        });
        await reg.update().catch(() => {});
      } catch {}

      checkAppVersion();
    });

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      // The new worker is active. A manual or next launch refresh will use it.
      checkAppVersion();
    });
  } else {
    addEventListener("load", checkAppVersion);
  }
})();
