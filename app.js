Warning: truncated output (original token count: 49206)
Total output lines: 5311

(() => {
  "use strict";

  const APP_VERSION = "6.8.3";
  const APP_BOOT_STARTED = performance.now();
  const DB_NAME = "tripspend.db";
  const DB_VERSION = 2;
  const DB_STATE_STORE = "state";
  const DB_BACKUP_STORE = "backups";
  const DB_META_STORE = "meta";
  const DB_RECEIPT_STORE = "receipts";
  const STORAGE_SAVE_DELAY = 140;
  const MAX_DAILY_BACKUPS = 7;
  const PORTABLE_BACKUP_WARN_BYTES = 25 * 1024 * 1024;
  const PORTABLE_BACKUP_MAX_BYTES = 75 * 1024 * 1024;
  const PORTABLE_IMPORT_MAX_BYTES = 100 * 1024 * 1024;

  let storageDB = null;
  let storageMode = "starting";
  let storagePersistent = false;
  let storageSaveTimer = 0;
  let pendingStorageSnapshot = null;
  let lastStorageWriteAt = 0;
  let appStartupMs = 0;
  let lastRenderMs = 0;
  let expenseRenderLimit = 100;
  let pendingReceiptBlob = null;
  let pendingReceiptName = "";
  let removeExistingReceipt = false;
  let receiptPreviewURL = "";
  let analyticsCacheRevision = 0;
  const analyticsCache = new Map();
  let activeExpenseDetailId = "";
  let expenseDetailReceiptURL = "";
  let receiptViewerURL = "";
  let receiptViewerScale = 1;
  let latestVersionKnown = "";
  let lastExpenseRenderKey = "";
  let lastAnalyticsRenderKey = "";
  let expensePersonFilterSignature = "";
  let expenseCountryFilterSignature = "";
  let expenseSearchTimer = 0;
  let homeBudgetDetailsOpen = false;
  let dashboardWelcomeTimer = 0;


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
    return { trip: null, expenses: [], rates: {}, people: [], stops: [], plans: [], itinerary: [], settlements: [], tripHistory: [], preferences: {} };
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
    e.receiptId = e.receiptId ? String(e.receiptId) : "";
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

    const itinerary = Array.isArray(clean.itinerary)
      ? clean.itinerary.filter(item => item && item.id).map(item => ({
          id: String(item.id),
          title: String(item.title || "Itinerary item").trim().slice(0, 90),
          type: ["Flight","Hotel","Activity","Restaurant","Transport","Note"].includes(item.type)
            ? item.type
            : "Activity",
          date: String(item.date || trip?.startDate || ""),
          time: String(item.time || "").slice(0, 5),
          stopId: item.stopId ? String(item.stopId) : "",
          location: String(item.location || "").slice(0, 120),
          bookingRef: String(item.bookingRef || "").slice(0, 80),
          note: String(item.note || "").slice(0, 240),
          homeAmount: num(item.homeAmount, 0),
          planId: item.planId ? String(item.planId) : "",
          status: item.status === "done" ? "done" : (item.status === "booked" ? "booked" : "planned"),
          createdAt: num(item.createdAt, Date.now()),
          updatedAt: num(item.updatedAt, item.createdAt || Date.now())
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
      itinerary,
      settlements,
      tripHistory,
      preferences: {
        lastPaymentMethod: String(clean.preferences?.lastPaymentMethod || trip?.defaultPayment || "Credit Card"),
        lastCategory: String(clean.preferences?.lastCategory || "Food"),
        recentCategories: Array.isArray(clean.preferences?.recentCategories)
          ? clean.preferences.recentCategories.filter(x => CATS.some(([name]) => name === x)).slice(0, 5)
          : [],
        lastStopId: clean.preferences?.lastStopId ? String(clean.preferences.lastStopId) : "",
        lastPaidByPersonId: clean.preferences?.lastPaidByPersonId ? String(clean.preferences.lastPaidByPersonId) : "",
        appearance: normalizedAppearance(clean.preferences?.appearance || "system")
      }
    };
  }

  function stateIntegrityReport(data) {
    const errors = [];
    const warnings = [];

    if (!data || typeof data !== "object") {
      return { ok: false, errors: ["State is not an object"], warnings };
    }

    const trip = data.trip || null;
    const expenses = Array.isArray(data.expenses) ? data.expenses : [];
    const people = Array.isArray(data.people) ? data.people : [];
    const stops = Array.isArray(data.stops) ? data.stops : [];
    const plans = Array.isArray(data.plans) ? data.plans : [];
    const itinerary = Array.isArray(data.itinerary) ? data.itinerary : [];
    const settlements = Array.isArray(data.settlements) ? data.settlements : [];
    const history = Array.isArray(data.tripHistory) ? data.tripHistory : [];

    if (trip) {
      if (!trip.id) errors.push("Current trip is missing an ID");
      if (trip.startDate && trip.endDate && trip.startDate > trip.endDate) {
        errors.push("Current trip dates are reversed");
      }
    }

    const checkDuplicates = (rows, label) => {
      const seen = new Set();
      rows.forEach(row => {
        if (!row?.id) return;
        const id = String(row.id);
        if (seen.has(id)) errors.push(`Duplicate ${label} ID`);
        seen.add(id);
      });
    };

    checkDuplicates(expenses, "expense");
    checkDuplicates(people, "traveler");
    checkDuplicates(stops, "country");
    checkDuplicates(plans, "planned cost");
    checkDuplicates(itinerary, "itinerary");
    checkDuplicates(settlements, "settlement");

    const personIds = new Set(people.map(person => String(person.id)));
    const stopIds = new Set(stops.map(stop => String(stop.id)));
    const planIds = new Set(plans.map(plan => String(plan.id)));

    stops.forEach(stop => {
      if (stop.startDate && stop.endDate && stop.startDate > stop.endDate) {
        errors.push(`Country dates are reversed for ${stop.country || "a country"}`);
      }
    });

    itinerary.forEach(item => {
      if (!item.date) warnings.push("An itinerary item has no date");
      if (item.stopId && !stopIds.has(String(item.stopId))) warnings.push("An itinerary item references a missing country");
      if (item.planId && !planIds.has(String(item.planId))) warnings.push("An itinerary item references a missing planned cost");
    });

    expenses.forEach(expense => {
      if (!(Number(expense.homeAmount) >= 0)) errors.push("An expense has an invalid amount");
      if (expense.stopId && !stopIds.has(String(expense.stopId))) warnings.push("An expense references a missing country");
      if (expense.paidByPersonId && !personIds.has(String(expense.paidByPersonId))) warnings.push("An expense references a missing payer");
      if (expense.planId && !planIds.has(String(expense.planId))) warnings.push("An expense references a missing planned cost");

      (expense.personShares || []).forEach(share => {
        if (share.personId && !personIds.has(String(share.personId))) {
          warnings.push("An expense references a missing traveler");
        }
      });
    });

    settlements.forEach(payment => {
      if (!(Number(payment.amount) > 0)) errors.push("A settlement has an invalid amount");
      if (payment.fromPersonId === payment.toPersonId) errors.push("A settlement pays the same traveler");
      if (!personIds.has(String(payment.fromPersonId)) || !personIds.has(String(payment.toPersonId))) {
        warnings.push("A settlement references a missing traveler");
      }
    });

    if (trip?.id && history.some(record => String(record.id) === String(trip.id))) {
      errors.push("Current trip also exists in Past Trips");
    }

    history.forEach(record => {
      if (!record?.data?.trip) errors.push("A Past Trip has no trip data");
      if (record?.data?.tripHistory?.length) warnings.push("A Past Trip contains nested trip history");
    });

    return {
      ok: errors.length === 0,
      errors: [...new Set(errors)],
      warnings: [...new Set(warnings)]
    };
  }

  function snapshotDescription(data) {
    const trip = data?.trip;
    if (!trip) {
      const count = Array.isArray(data?.tripHistory) ? data.tripHistory.length : 0;
      return `${count} past trip${count === 1 ? "" : "s"} • no active trip`;
    }

    const count = Array.isArray(data.expenses) ? data.expenses.length : 0;
    return `${trip.name || "Trip"} • ${fmtDateWithYear(trip.startDate)} – ${fmtDateWithYear(trip.endDate)} • ${count} expense${count === 1 ? "" : "s"}`;
  }

  function snapshotTripData(source = state) {
    return {
      trip: safeClone(source.trip),
      expenses: safeClone(source.expenses || []),
      rates: safeClone(source.rates || {}),
      people: safeClone(source.people || []),
      stops: safeClone(source.stops || []),
      plans: safeClone(source.plans || []),
      itinerary: safeClone(source.itinerary || []),
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
      if (!(amount > 0) || payment.fromPersonId === payment.toPersonId) return;
      if (!balances.has(payment.fromPersonId) || !balances.has(payment.toPersonId)) return;

      balances.set(payment.fromPersonId, (balances.get(payment.fromPersonId) || 0) + amount);
      balances.set(payment.toPersonId, (balances.get(payment.toPersonId) || 0) - amount);
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

  function resetExpenseFiltersForTripChange() {
    if ($("searchExpense")) $("searchExpense").value = "";
    [
      "filterCategory",
      "filterType",
      "filterCountry",
      "filterPayment",
      "filterPerson",
      "filterDateFrom",
      "filterDateTo"
    ].forEach(id => {
      if ($(id)) $(id).value = "";
    });

    expensePersonFilterSignature = "";
    expenseCountryFilterSignature = "";
    resetExpenseRenderLimit();
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
    resetExpenseFiltersForTripChange();
    homeBudgetDetailsOpen = false;
    resetSetupForNewTrip();
    render();
    window.scrollTo({
      top: 0,
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"
    });
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
    resetExpenseFiltersForTripChange();
    homeBudgetDetailsOpen = false;

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
    renderHomeTripHistoryAccess();
    cleanupUnusedReceipts({ silent: true }).catch(() => {});
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

    const currency = trip.homeCurrency || summary.homeCurrency || "OMR";
    const difference = Number(summary.difference || 0);
    const resultLabel = difference >= 0 ? "Saved" : "Over";
    const resultValue = money(Math.abs(difference), currency);

    [
      ["Spent", money(summary.spent || 0, currency), ""],
      [resultLabel, resultValue, difference >= 0 ? "trip-result-good" : "trip-result-over"],
      ["Expenses", String(summary.expenseCount || (data.expenses || []).length), ""]
    ].forEach(([label, value, cls]) => {
      const item = document.createElement("div");
      if (cls) item.classList.add(cls);
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

    const report = document.createElement("button");
    report.type = "button";
    report.className = "secondary compact-btn";
    report.textContent = "Report";
    report.onclick = () => shareTripReport(data);

    actions.append(open, report, del);
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

  function closeTripSwitcher() {
    $("tripSwitcherModal")?.classList.add("hidden");
    document.body.classList.remove("sheet-open");
    document.body.style.overflow = "";
  }

  function renderHomeTripHistoryAccess() {
    const meta = $("homeTripHistoryMeta");
    if (!meta) return;

    const count = (state.tripHistory || []).length;
    if (count === 0) {
      meta.textContent = "No past trips yet • tap to manage trips";
    } else if (count === 1) {
      meta.textContent = "1 past trip • tap to switch";
    } else {
      meta.textContent = `${count} past trips • tap to switch`;
    }
  }

  function tripSwitcherCurrentCard() {
    const data = snapshotTripData();
    const summary = tripSummaryFor(data);

    const card = document.createElement("div");
    card.className = "trip-switcher-current-card";

    const top = document.createElement("div");
    top.className = "trip-switcher-current-top";

    const identity = document.createElement("div");
    identity.className = "trip-switcher-current-identity";

    const flags = document.createElement("span");
    flags.className = "trip-switcher-flags";
    flags.textContent = tripFlagsFor(data);

    const copy = document.createElement("div");
    const name = document.createElement("strong");
    name.textContent = state.trip?.name || "Current trip";
    const dates = document.createElement("small");
    dates.textContent = `${fmtDateWithYear(state.trip?.startDate)} – ${fmtDateWithYear(state.trip?.endDate)}`;
    copy.append(name, dates);
    identity.append(flags, copy);

    const active = document.createElement("span");
    active.className = "trip-switcher-active-pill";
    active.textContent = "CURRENT";

    top.append(identity, active);

    const metrics = document.createElement("div");
    metrics.className = "trip-switcher-current-metrics";
    [
      ["Spent", money(summary.spent || 0, state.trip?.homeCurrency || "OMR")],
      ["Countries", String(summary.countries || (state.stops || []).length)],
      ["Expenses", String(summary.expenseCount || state.expenses.length)]
    ].forEach(([label, value]) => {
      const item = document.createElement("div");
      const small = document.createElement("small");
      small.textContent = label;
      const strong = document.createElement("strong");
      strong.textContent = value;
      item.append(small, strong);
      metrics.append(item);
    });

    card.append(top, metrics);
    return card;
  }

  function tripSwitcherPastCard(record) {
    const data = record.data || {};
    const trip = data.trip || {};
    const summary = record.summary && Object.keys(record.summary).length
      ? record.summary
      : tripSummaryFor(data);

    const button = document.createElement("button");
    button.type = "button";
    button.className = "trip-switcher-past-card";

    const flags = document.createElement("span");
    flags.className = "trip-switcher-past-flags";
    flags.textContent = tripFlagsFor(data);

    const copy = document.createElement("span");
    copy.className = "trip-switcher-past-copy";
    const name = document.createElement("strong");
    name.textContent = trip.name || "Trip";
    const dates = document.createElement("small");
    dates.textContent = `${fmtDateWithYear(trip.startDate)} – ${fmtDateWithYear(trip.endDate)}`;
    const spent = document.createElement("span");
    const currency = trip.homeCurrency || "OMR";
    const difference = Number(summary.difference || 0);
    const resultText = difference >= 0
      ? `${money(Math.abs(difference), currency)} saved`
      : `${money(Math.abs(difference), currency)} over`;
    spent.textContent = `${money(summary.spent || 0, currency)} spent • ${resultText}`;
    spent.classList.toggle("trip-switcher-result-over", difference < 0);
    copy.append(name, dates, spent);

    const side = document.createElement("span");
    side.className = "trip-switcher-past-side";
    const status = document.createElement("small");
    status.textContent = record.status === "completed" ? "COMPLETED" : "PAST";
    const arrow = document.createElement("strong");
    arrow.textContent = "›";
    side.append(status, arrow);

    button.append(flags, copy, side);
    button.onclick = async () => {
      closeTripSwitcher();
      await openTripFromHistory(record.id);
    };

    return button;
  }

  function renderTripSwitcher() {
    const currentHost = $("tripSwitcherCurrent");
    const pastList = $("tripSwitcherPastList");
    const countText = $("tripSwitcherPastCount");
    if (!currentHost || !pastList || !state.trip) return;

    currentHost.replaceChildren(tripSwitcherCurrentCard());

    const history = (state.tripHistory || [])
      .slice()
      .sort((a, b) => Number(b.archivedAt || 0) - Number(a.archivedAt || 0));

    countText.textContent = `${history.length} trip${history.length === 1 ? "" : "s"}`;
    pastList.replaceChildren();

    if (!history.length) {
      const empty = document.createElement("div");
      empty.className = "trip-switcher-empty";
      const strong = document.createElement("strong");
      strong.textContent = "No past trips yet";
      const small = document.createElement("small");
      small.textContent = "Finished or archived trips will appear here for quick switching.";
      empty.append(strong, small);
      pastList.append(empty);
    } else {
      history.slice(0, 5).forEach(record => pastList.append(tripSwitcherPastCard(record)));

      if (history.length > 5) {
        const more = document.createElement("button");
        more.type = "button";
        more.className = "trip-switcher-more-btn";
        more.textContent = `View all ${history.length} past trips`;
        more.onclick = () => {
          closeTripSwitcher();
          page("trips");
        };
        pastList.append(more);
      }
    }

    $("tripSwitcherNew…29206 tokens truncated…le?.() || []).map(person => makePerson(person.name))
      ],
      stops: allSetupStops,
      plans: [],
      itinerary: [],
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

  $("expenseForm").onsubmit = async e => {
    e.preventDefault();

    const stateBeforeExpenseSave = safeClone(state);
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
      receiptId: "",
      createdAt: Date.now()
    };

    const v5ExpenseData = window.TripSpendV5?.expenseData?.(homeAmount);
    if (v5ExpenseData?.__error) return toast(v5ExpenseData.__error);
    if (v5ExpenseData) {
      delete v5ExpenseData.__error;
      Object.assign(x, v5ExpenseData);
    }

    const index = state.expenses.findIndex(y => y.id === x.id);
    const previousExpense = index >= 0 ? state.expenses[index] : null;

    if (previousExpense?.receiptId && !removeExistingReceipt && !pendingReceiptBlob) {
      x.receiptId = previousExpense.receiptId;
    }

    if (pendingReceiptBlob) {
      x.receiptId = coreReceiptId(x.id);
    }

    if (removeExistingReceipt && !pendingReceiptBlob) {
      x.receiptId = "";
    }

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
    ].filter(category => CATS.some(([name]) => name === category)).slice(0, 5);

    try {
      if (pendingReceiptBlob) {
        if (storageMode !== "indexeddb") throw new Error("Receipt storage needs IndexedDB");

        await persistStateAndReceiptAtomically(state, {
          id: x.receiptId,
          tripId: state.trip.id,
          expenseId: x.id,
          name: pendingReceiptName || "Receipt.jpg",
          type: pendingReceiptBlob.type || "image/jpeg",
          size: pendingReceiptBlob.size || 0,
          blob: pendingReceiptBlob,
          createdAt: Date.now()
        });
      } else {
        save({ immediate: removeExistingReceipt });
      }
    } catch {
      state = normalizeState(stateBeforeExpenseSave);
      render();
      toast("Nothing was saved because the receipt could not be stored safely");
      return;
    }

    if (pendingReceiptBlob || removeExistingReceipt) {
      cleanupUnusedReceipts({ silent: true }).catch(() => {});
    }

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

  async function exportBackup() {
    const name = (state.trip?.name || "tripspend").replace(/[^a-z0-9]+/gi, "-");
    const button = $("exportBtn");
    const oldText = button?.textContent || "Export Backup";

    if (button) {
      button.disabled = true;
      button.textContent = "Preparing backup…";
    }

    try {
      const ids = collectReceiptIds(state, new Set());
      const receipts = [];
      let receiptBytes = 0;

      if (storageMode === "indexeddb" && storageDB && ids.size) {
        for (const id of ids) {
          const record = await idbGetReceipt(id);
          if (record?.blob) receiptBytes += Number(record.size || record.blob.size || 0);
        }

        if (receiptBytes > PORTABLE_BACKUP_MAX_BYTES) {
          alert(`This backup contains ${humanBytes(receiptBytes)} of receipt photos, which is too large to package safely on iPhone. Remove unnecessary receipts or export from a device with more memory.`);
          return;
        }

        if (receiptBytes > PORTABLE_BACKUP_WARN_BYTES &&
            !confirm(`This backup includes ${humanBytes(receiptBytes)} of receipt photos and may take longer to create. Continue?`)) {
          return;
        }
        for (const id of ids) {
          const record = await idbGetReceipt(id);
          if (!record?.blob) continue;
          receipts.push({
            id: record.id,
            tripId: record.tripId || "",
            expenseId: record.expenseId || "",
            name: record.name || "Receipt.jpg",
            type: record.type || record.blob.type || "image/jpeg",
            size: record.size || record.blob.size || 0,
            createdAt: record.createdAt || Date.now(),
            dataURL: await blobToDataURL(record.blob)
          });
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }

      download(
        `${name}-backup.json`,
        JSON.stringify({
          app: "TripSpend",
          version: 7,
          appVersion: APP_VERSION,
          exportedAt: new Date().toISOString(),
          data: state,
          receipts
        }, null, 2),
        "application/json"
      );
      toast(receipts.length ? `Backup exported with ${receipts.length} receipt${receipts.length === 1 ? "" : "s"}` : "Backup exported");
    } catch {
      alert("TripSpend could not create the portable backup.");
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = oldText;
      }
    }
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
      if (file.size > PORTABLE_IMPORT_MAX_BYTES) {
        alert(`This backup is ${humanBytes(file.size)} and is too large to import safely on this device.`);
        return;
      }

      const parsed = JSON.parse(await file.text());
      const data = parsed.data || parsed;
      const hasTripData = !!data?.trip || (Array.isArray(data?.tripHistory) && data.tripHistory.length > 0);
      if (!data || !Array.isArray(data.expenses || []) || !hasTripData) throw new Error("invalid");

      const normalizedImport = normalizeState(data);
      const integrity = stateIntegrityReport(normalizedImport);
      if (!integrity.ok) {
        alert(`This backup failed validation and was not imported.\n\n${integrity.errors.slice(0, 3).join("\n")}`);
        return;
      }

      const importDescription = snapshotDescription(normalizedImport);
      if (!confirm(`Import this backup?\n\n${importDescription}\n\nIt will replace the current TripSpend data in this browser.`)) return;

      if (meaningfulState(state) && storageMode === "indexeddb") {
        await createBackupSnapshot("Before import", state, "before-import");
      }

      state = normalizedImport;
      await persistStateImmediately(state);

      const receiptRows = Array.isArray(parsed.receipts) ? parsed.receipts : [];
      if (receiptRows.length && storageMode === "indexeddb") {
        for (const receipt of receiptRows) {
          if (!receipt?.id || !receipt?.dataURL) continue;
          const blob = dataURLToBlob(receipt.dataURL);
          await idbPutReceipt({
            id: String(receipt.id),
            tripId: String(receipt.tripId || ""),
            expenseId: String(receipt.expenseId || ""),
            name: String(receipt.name || "Receipt.jpg"),
            type: String(receipt.type || blob.type || "image/jpeg"),
            size: Number(receipt.size || blob.size || 0),
            blob,
            createdAt: Number(receipt.createdAt || Date.now())
          });
        }
      }

      applyAppearance(state.preferences?.appearance || "system");
      render();
      page(state.trip ? "dashboard" : "settings");
      await renderReceiptStorageStats();
      cleanupUnusedReceipts({ silent: true }).catch(() => {});
      toast(receiptRows.length ? `Backup imported with ${receiptRows.length} receipt${receiptRows.length === 1 ? "" : "s"}` : "Backup imported");
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
        cleanupUnusedReceipts({ silent: true }).catch(() => {});
        toast("Current trip deleted");
      } catch {
        alert("TripSpend could not delete the trip safely.");
      }
    }
  };

  ["quickAdd", "pageAdd", "navAdd"].forEach(id => $(id).onclick = () => openModal());

  const guide = $("homeGuideCard");
  const guideDismissed = localStorage.getItem("tripspend.home-guide.v709") === "1";
  guide?.classList.toggle("hidden", guideDismissed);
  $("dismissHomeGuide")?.addEventListener("click", () => {
    localStorage.setItem("tripspend.home-guide.v709", "1");
    guide?.classList.add("hidden");
  });

  $("homeBudgetDetailsToggle")?.addEventListener("click", () => {
    homeBudgetDetailsOpen = !homeBudgetDetailsOpen;
    const details = $("homeBudgetDetails");
    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (details) {
      details.getAnimations?.().forEach(animation => animation.cancel());

      if (homeBudgetDetailsOpen) {
        details.classList.remove("hidden");
        if (!reduceMotion && details.animate) {
          details.animate(
            [
              { opacity: 0, transform: "translateY(-4px)" },
              { opacity: 1, transform: "translateY(0)" }
            ],
            { duration: 180, easing: "cubic-bezier(.2,.8,.2,1)" }
          );
        }
      } else if (!reduceMotion && details.animate) {
        const animation = details.animate(
          [
            { opacity: 1, transform: "translateY(0)" },
            { opacity: 0, transform: "translateY(-4px)" }
          ],
          { duration: 140, easing: "ease-in" }
        );
        animation.onfinish = () => {
          if (!homeBudgetDetailsOpen) details.classList.add("hidden");
        };
      } else {
        details.classList.add("hidden");
      }
    }
    $("homeBudgetDetailsToggle")?.setAttribute("aria-expanded", String(homeBudgetDetailsOpen));
    if ($("homeBudgetDetailsArrow")) $("homeBudgetDetailsArrow").textContent = homeBudgetDetailsOpen ? "⌃" : "⌄";
  });

  $("safeTodayInfo")?.addEventListener("click", () => {
    const explanation = $("safeTodayExplanation");
    if (!explanation) return;
    const open = explanation.classList.toggle("hidden") === false;
    $("safeTodayInfo").setAttribute("aria-expanded", String(open));
  });

  $("closeModal").onclick = closeModal;
  $("modal").onclick = e => { if (e.target === $("modal")) closeModal(); };

  $("expenseAmount").oninput = () => { preview(); duplicateCheck(); };
  $("exchangeRate").oninput = preview;
  $("expenseCurrency").onchange = () => { rateUI(true); preview(); duplicateCheck(); };
  $("expenseDate").onchange = duplicateCheck;
  $("expenseCategory").onchange = () => { suggestCategory(); duplicateCheck(); renderRecentCategoryChips(); };
  $("expenseNote").oninput = () => { suggestCategory(); duplicateCheck(); };

  $("applySuggestion").onclick = () => {
    if (suggestedCategory) {
      $("expenseCategory").value = suggestedCategory;
      $("categorySuggestion").classList.add("hidden");
      duplicateCheck();
    }
  };

  $("receiptInput")?.addEventListener("change", async event => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      if (storageMode !== "indexeddb") throw new Error("Receipt storage needs IndexedDB");
      const blob = await compressReceiptImage(file);
      pendingReceiptBlob = blob;
      pendingReceiptName = file.name || "Receipt.jpg";
      removeExistingReceipt = false;
      showReceiptPreview(blob, pendingReceiptName);
      toast("Receipt attached");
    } catch (error) {
      event.target.value = "";
      toast(error?.message || "Could not attach receipt");
    }
  });

  $("removeReceiptBtn")?.addEventListener("click", () => {
    const editing = state.expenses.find(expense => expense.id === $("editId")?.value);
    removeExistingReceipt = !!editing?.receiptId;
    pendingReceiptBlob = null;
    pendingReceiptName = "";
    clearReceiptPreviewURL();
    $("receiptPreview")?.classList.add("hidden");
    if ($("receiptInput")) $("receiptInput").value = "";
  });

  $("cleanReceiptStorageBtn")?.addEventListener("click", () => cleanupUnusedReceipts());
  $("runDiagnosticsBtn")?.addEventListener("click", () => runDiagnostics({ announce: true }));

  $("checkUpdateBtn")?.addEventListener("click", () => checkAppVersion({ announce: true }));
  $("refreshAppBtn")?.addEventListener("click", forceAppUpdate);

  $("closeExpenseDetail")?.addEventListener("click", closeExpenseDetails);
  $("expenseDetailModal")?.addEventListener("click", event => {
    if (event.target === $("expenseDetailModal")) closeExpenseDetails();
  });

  $("viewDetailReceiptBtn")?.addEventListener("click", () => {
    const expense = state.expenses.find(item => item.id === activeExpenseDetailId);
    if (expense?.receiptId) openReceiptViewer(expense.receiptId);
  });

  $("detailReceiptReplaceInput")?.addEventListener("change", event => {
    replaceDetailReceipt(event.target.files?.[0]);
  });
  $("removeDetailReceiptBtn")?.addEventListener("click", removeDetailReceipt);

  $("detailEditExpenseBtn")?.addEventListener("click", () => {
    const id = activeExpenseDetailId;
    closeExpenseDetails();
    if (id) openModal(id);
  });

  $("detailRepeatExpenseBtn")?.addEventListener("click", () => {
    const expense = state.expenses.find(item => item.id === activeExpenseDetailId);
    closeExpenseDetails();
    if (expense) openModal("", expense);
  });

  $("detailDeleteExpenseBtn")?.addEventListener("click", async () => {
    const id = activeExpenseDetailId;
    closeExpenseDetails();
    if (id) await removeExpense(id);
  });

  $("closeReceiptViewer")?.addEventListener("click", closeReceiptViewer);
  $("receiptViewerModal")?.addEventListener("click", event => {
    if (event.target === $("receiptViewerModal")) closeReceiptViewer();
  });
  $("receiptZoomIn")?.addEventListener("click", () => {
    receiptViewerScale = Math.min(3, receiptViewerScale + 0.25);
    applyReceiptViewerScale();
  });
  $("receiptZoomOut")?.addEventListener("click", () => {
    receiptViewerScale = Math.max(0.5, receiptViewerScale - 0.25);
    applyReceiptViewerScale();
  });

  $("searchExpense").oninput = () => {
    resetExpenseRenderLimit();
    clearTimeout(expenseSearchTimer);
    expenseSearchTimer = setTimeout(renderExpenseViews, 120);
  };
  ["filterCategory","filterType","filterCountry","filterPayment","filterPerson","filterDateFrom","filterDateTo"].forEach(id => {
    if ($(id)) $(id).onchange = () => {
      resetExpenseRenderLimit();
      renderExpenseViews();
    };
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

  $("tripSwitcherTrigger")?.addEventListener("click", openTripSwitcher);
  $("homeTripHistoryBtn")?.addEventListener("click", openTripSwitcher);
  $("closeTripSwitcher")?.addEventListener("click", closeTripSwitcher);
  $("tripSwitcherModal")?.addEventListener("click", event => {
    if (event.target === $("tripSwitcherModal")) closeTripSwitcher();
  });
  $("tripSwitcherManageBtn")?.addEventListener("click", () => {
    closeTripSwitcher();
    page("trips");
  });
  $("tripSwitcherNewBtn")?.addEventListener("click", () => {
    closeTripSwitcher();
    startNewTripFlow();
  });

  $("managePeople").onclick = () => page("people");
  $("settingsPeople").onclick = () => page("people");
  $("settingsTrips")?.addEventListener("click", () => page("trips"));
  $("tripsDone")?.addEventListener("click", () => page("settings"));
  $("finishTripBtn")?.addEventListener("click", showFinishTripSummary);
  $("currentTripReportBtn")?.addEventListener("click", () => shareTripReport(snapshotTripData()));
  $("shareTripReportBtn")?.addEventListener("click", () => shareTripReport(snapshotTripData()));
  $("printTripReportBtn")?.addEventListener("click", () => printTripReport(snapshotTripData()));
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
    renderTripsPage,
    toHome
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
    if (document.hidden) {
      clearTimeout(dashboardWelcomeTimer);
    } else {
      refreshDashboardWelcome();
    }
  });

  window.addEventListener("focus", refreshDashboardWelcome);

  window.addEventListener("pagehide", () => {
    if (storageMode === "indexeddb" && pendingStorageSnapshot) {
      flushPendingSave();
    }
    clearReceiptPreviewURL();
    clearExpenseDetailReceiptURL();
    clearReceiptViewerURL();
  });

  function setDiagnostic(id, text, status = "ok") {
    const el = $(id);
    if (!el) return;
    el.textContent = text;
    el.className = `diag-${status}`;
  }

  async function runDiagnostics({ announce = false } = {}) {
    const started = performance.now();
    let issues = 0;

    if (storageMode === "indexeddb") {
      setDiagnostic("diagStorage", storagePersistent ? "Persistent • OK" : "IndexedDB • OK", "ok");
    } else if (storageMode === "localStorage") {
      setDiagnostic("diagStorage", "Safe fallback", "warn");
      issues += 1;
    } else {
      setDiagnostic("diagStorage", "Starting…", "warn");
      issues += 1;
    }

    try {
      if (storageMode === "indexeddb" && storageDB) {
        await idbReadMeta("storageVersion");
        setDiagnostic("diagDatabase", "Readable • OK", "ok");
      } else {
        setDiagnostic("diagDatabase", "Fallback mode", "warn");
        issues += 1;
      }
    } catch {
      setDiagnostic("diagDatabase", "Read failed", "bad");
      issues += 1;
    }

    try {
      const referenced = collectReceiptIds(state, new Set());
      const rows = storageMode === "indexeddb" && storageDB ? await idbListReceipts() : [];
      const available = new Set(rows.map(row => String(row.id)));
      const missing = [...referenced].filter(id => !available.has(id));

      if (!missing.length) {
        setDiagnostic("diagReceipts", `${rows.length} stored • OK`, "ok");
      } else {
        setDiagnostic("diagReceipts", `${missing.length} missing`, "warn");
        issues += 1;
      }
    } catch {
      setDiagnostic("diagReceipts", "Check failed", "warn");
      issues += 1;
    }

    try {
      const registration = "serviceWorker" in navigator
        ? await navigator.serviceWorker.getRegistration()
        : null;

      if (registration) {
        const active = !!navigator.serviceWorker.controller;
        setDiagnostic("diagServiceWorker", active ? "Active • OK" : "Installed", active ? "ok" : "warn");
        if (!active) issues += 1;
      } else {
        setDiagnostic("diagServiceWorker", "Not installed", "warn");
        issues += 1;
      }
    } catch {
      setDiagnostic("diagServiceWorker", "Check failed", "warn");
      issues += 1;
    }

    const integrity = stateIntegrityReport(state);
    if (integrity.ok && !integrity.warnings.length) {
      setDiagnostic("diagIntegrity", "Healthy • OK", "ok");
    } else if (integrity.ok) {
      setDiagnostic("diagIntegrity", `${integrity.warnings.length} warning${integrity.warnings.length === 1 ? "" : "s"}`, "warn");
      issues += 1;
    } else {
      setDiagnostic("diagIntegrity", `${integrity.errors.length} error${integrity.errors.length === 1 ? "" : "s"}`, "bad");
      issues += 1;
    }

    const perfStatus = lastRenderMs > 250 ? "warn" : "ok";
    setDiagnostic(
      "diagPerformance",
      `${state.expenses.length} expenses • ${Math.max(1, Math.round(lastRenderMs || 0))} ms render`,
      perfStatus
    );
    if (perfStatus === "warn") issues += 1;

    const elapsedMs = Math.max(1, Math.round(performance.now() - started));
    const summary = $("diagSummary");
    if (summary) {
      summary.textContent = issues
        ? `${issues} item${issues === 1 ? "" : "s"} need attention • checked in ${elapsedMs} ms`
        : `Everything looks healthy • checked in ${elapsedMs} ms`;
    }

    if (announce) toast(issues ? "Diagnostics finished with warnings" : "TripSpend checks passed");
    return { issues, integrity };
  }

  function renderUpdateSettings(status = "checking") {
    if ($("currentVersionText")) $("currentVersionText").textContent = `v${APP_VERSION}`;
    if ($("latestVersionText")) {
      $("latestVersionText").textContent =
        status === "offline" ? "Offline"
        : latestVersionKnown ? `v${latestVersionKnown}`
        : "Checking…";
    }

    const badge = $("updateSettingsBadge");
    if (!badge) return;

    if (status === "offline") {
      badge.textContent = "OFFLINE";
      badge.className = "smart-badge update-offline";
    } else if (latestVersionKnown && latestVersionKnown !== APP_VERSION) {
      badge.textContent = "UPDATE";
      badge.className = "smart-badge update-ready";
    } else if (latestVersionKnown === APP_VERSION) {
      badge.textContent = "UP TO DATE";
      badge.className = "smart-badge update-current";
    } else {
      badge.textContent = "CHECKING";
      badge.className = "smart-badge";
    }
  }

  async function checkAppVersion({ announce = false } = {}) {
    renderUpdateSettings("checking");
    try {
      const response = await fetch(`./version.json?t=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error("version fetch failed");
      const latest = await response.json();
      if (!latest?.version) throw new Error("invalid version");

      latestVersionKnown = String(latest.version);
      renderUpdateSettings("online");

      const banner = $("updateBanner");
      const versionText = $("updateVersionText");

      if (latestVersionKnown !== APP_VERSION) {
        if (versionText) versionText.textContent = `v${latestVersionKnown} is ready`;
        if (banner) banner.classList.remove("hidden");
        if (announce) toast(`v${latestVersionKnown} is available`);
      } else {
        if (banner) banner.classList.add("hidden");
        if (announce) toast("TripSpend is up to date");
      }

      return latestVersionKnown;
    } catch {
      renderUpdateSettings("offline");
      if (announce) toast("Could not check for updates while offline");
      return "";
    }
  }

  async function forceAppUpdate() {
    const button = $("refreshAppBtn") || $("applyUpdateBtn");
    if (button) {
      button.disabled = true;
      button.textContent = "Refreshing…";
    }

    sessionStorage.setItem("tripspend.refreshRequested", String(Date.now()));

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
      // Reload still gives the network a chance to fetch the newest shell.
    }

    location.reload();
  }

  $("applyUpdateBtn")?.addEventListener("click", forceAppUpdate);

  if ("serviceWorker" in navigator) {
    addEventListener("load", async () => {
      try {
        const reg = await navigator.serviceWorker.register("./sw.js?v=6.8.3-manual1", {
          updateViaCache: "none"
        });
        await reg.update().catch(() => {});
      } catch {}

      checkAppVersion();
    });

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      // The new worker is active. A manual or next launch refresh will use it.
      checkAppVersion().then(() => {
        if (sessionStorage.getItem("tripspend.refreshRequested")) {
          sessionStorage.removeItem("tripspend.refreshRequested");
          toast(`App refreshed • v${APP_VERSION}`);
        }
      });
    });
  } else {
    addEventListener("load", () => {
      checkAppVersion().then(() => {
        if (sessionStorage.getItem("tripspend.refreshRequested")) {
          sessionStorage.removeItem("tripspend.refreshRequested");
          toast(`App refreshed • v${APP_VERSION}`);
        }
      });
    });
  }
})();
