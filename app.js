(() => {
  "use strict";

  const APP_VERSION = "6.7.5";
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
          ? clean.preferences.recentCategories.filter(x => CATS.includes(x)).slice(0, 5)
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

    $("tripSwitcherNewBtn").textContent = state.trip ? "＋ Start New Trip" : "＋ New Trip";
  }

  function openTripSwitcher() {
    if (!state.trip) return;
    renderTripSwitcher();
    $("tripSwitcherModal")?.classList.remove("hidden");
    document.body.classList.add("sheet-open");
    document.body.style.overflow = "hidden";
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

  function reportDataFor(source = snapshotTripData()) {
    const summary = tripSummaryFor(source);
    const categories = new Map();

    (source.expenses || []).forEach(expense => {
      const label = expense.category || "Other";
      categories.set(label, (categories.get(label) || 0) + num(expense.homeAmount));
    });

    const topCategories = [...categories.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, amount]) => ({ label, amount }));

    let personal = 0;
    let shared = 0;
    (source.expenses || []).forEach(expense => {
      if (inferredExpenseType(expense) === "shared") shared += num(expense.homeAmount);
      else personal += num(expense.homeAmount);
    });

    return { source, summary, topCategories, personal, shared };
  }

  function drawReportRoundedRect(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }

  async function buildTripReportPNG(source = snapshotTripData()) {
    const { summary, topCategories, personal, shared } = reportDataFor(source);
    const trip = source.trip;
    if (!trip) throw new Error("No trip");

    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1500;
    const ctx = canvas.getContext("2d");

    const bg = "#f4f7fb";
    const ink = "#101828";
    const muted = "#667085";
    const blue = "#1677ff";
    const navy = "#142033";

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = muted;
    ctx.font = "700 30px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillText("TRIPSPEND • TRIP REPORT", 80, 90);

    ctx.fillStyle = ink;
    ctx.font = "800 62px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillText(trip.name || "Trip", 80, 165);

    ctx.fillStyle = muted;
    ctx.font = "400 28px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillText(`${tripFlagsFor(source)}   ${fmtDateWithYear(trip.startDate)} – ${fmtDateWithYear(trip.endDate)}`, 80, 215);

    // Hero card.
    ctx.fillStyle = navy;
    drawReportRoundedRect(ctx, 60, 270, 960, 330, 34);
    ctx.fill();

    ctx.fillStyle = "#cbd5e1";
    ctx.font = "700 24px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillText("TOTAL SPENT", 100, 335);

    ctx.fillStyle = "#ffffff";
    ctx.font = "800 74px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillText(money(summary.spent, trip.homeCurrency), 100, 430);

    ctx.fillStyle = "#cbd5e1";
    ctx.font = "500 24px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillText(`Budget  ${money(summary.budget, trip.homeCurrency)}`, 100, 500);
    ctx.fillText(
      summary.difference >= 0
        ? `Saved  ${money(summary.difference, trip.homeCurrency)}`
        : `Over budget  ${money(Math.abs(summary.difference), trip.homeCurrency)}`,
      100, 550
    );

    const metrics = [
      ["Countries", String(summary.countries || 0)],
      ["Expenses", String(summary.expenseCount || 0)],
      ["Personal", money(personal, trip.homeCurrency)],
      ["Shared", money(shared, trip.homeCurrency)]
    ];

    let mx = 70, my = 640;
    metrics.forEach((metric, i) => {
      const x = mx + (i % 2) * 490;
      const y = my + Math.floor(i / 2) * 145;
      ctx.fillStyle = "#ffffff";
      drawReportRoundedRect(ctx, x, y, 450, 120, 24);
      ctx.fill();

      ctx.fillStyle = muted;
      ctx.font = "600 22px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillText(metric[0], x + 30, y + 42);

      ctx.fillStyle = ink;
      ctx.font = "800 34px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillText(metric[1], x + 30, y + 86);
    });

    ctx.fillStyle = ink;
    ctx.font = "800 38px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillText("Where your money went", 80, 970);

    const maxCategory = Math.max(1, ...topCategories.map(item => item.amount));
    let cy = 1025;
    topCategories.forEach(item => {
      ctx.fillStyle = ink;
      ctx.font = "700 28px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillText(`${icon(item.label)} ${item.label}`, 80, cy);

      ctx.textAlign = "right";
      ctx.fillText(money(item.amount, trip.homeCurrency), 1000, cy);
      ctx.textAlign = "left";

      ctx.fillStyle = "#e2e8f0";
      drawReportRoundedRect(ctx, 80, cy + 18, 920, 14, 7);
      ctx.fill();

      ctx.fillStyle = blue;
      drawReportRoundedRect(ctx, 80, cy + 18, 920 * (item.amount / maxCategory), 14, 7);
      ctx.fill();

      cy += 90;
    });

    ctx.fillStyle = muted;
    ctx.font = "500 23px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillText(
      summary.settlementOutstanding > 0
        ? `Settlement remaining: ${money(summary.settlementOutstanding, trip.homeCurrency)}`
        : "Everyone is settled ✓",
      80, 1430
    );

    ctx.textAlign = "right";
    ctx.fillText("Made with TripSpend", 1000, 1430);
    ctx.textAlign = "left";

    return await new Promise((resolve, reject) => {
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Could not create report")), "image/png");
    });
  }

  async function shareTripReport(source = snapshotTripData()) {
    try {
      const blob = await buildTripReportPNG(source);
      const safeName = (source.trip?.name || "Trip")
        .replace(/[^a-z0-9]+/gi, "-")
        .replace(/^-|-$/g, "") || "Trip";
      const file = new File([blob], `${safeName}-TripSpend-report.png`, { type: "image/png" });

      if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
        await navigator.share({
          title: `${source.trip?.name || "Trip"} • TripSpend`,
          text: "Trip spending report from TripSpend",
          files: [file]
        });
        return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast("Trip report saved as image");
    } catch (error) {
      if (error?.name !== "AbortError") toast("Could not create trip report");
    }
  }

  function printTripReport(source = snapshotTripData()) {
    const { summary, topCategories, personal, shared } = reportDataFor(source);
    const trip = source.trip;
    if (!trip) return;

    const rows = topCategories.map(item =>
      `<tr><td>${icon(item.label)} ${item.label}</td><td>${money(item.amount, trip.homeCurrency)}</td></tr>`
    ).join("");

    const popup = window.open("", "_blank");
    if (!popup) return toast("Allow pop-ups to print the report");

    popup.document.write(`<!doctype html>
<html><head><meta charset="utf-8"><title>${trip.name} • TripSpend Report</title>
<style>
body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;margin:40px;color:#101828}
h1{font-size:34px;margin:8px 0}.muted{color:#667085}
.hero{background:#142033;color:white;border-radius:18px;padding:24px;margin:24px 0}
.hero strong{font-size:38px}.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}
.card{background:#f2f5f8;border-radius:12px;padding:14px}.card small{color:#667085;display:block}
table{width:100%;border-collapse:collapse;margin-top:12px}td{padding:10px 0;border-bottom:1px solid #e8ecf1}
td:last-child{text-align:right;font-weight:700}
@media print{body{margin:20mm}.no-print{display:none}}
</style></head><body>
<div class="muted">TRIPSPEND • TRIP REPORT</div>
<h1>${tripFlagsFor(source)} ${trip.name}</h1>
<div class="muted">${fmtDateWithYear(trip.startDate)} – ${fmtDateWithYear(trip.endDate)}</div>
<div class="hero"><small>TOTAL SPENT</small><br><strong>${money(summary.spent, trip.homeCurrency)}</strong><br>
Budget ${money(summary.budget, trip.homeCurrency)} • ${summary.difference >= 0 ? `Saved ${money(summary.difference, trip.homeCurrency)}` : `Over ${money(Math.abs(summary.difference), trip.homeCurrency)}`}</div>
<div class="grid">
<div class="card"><small>Countries</small><strong>${summary.countries}</strong></div>
<div class="card"><small>Expenses</small><strong>${summary.expenseCount}</strong></div>
<div class="card"><small>Personal</small><strong>${money(personal, trip.homeCurrency)}</strong></div>
<div class="card"><small>Shared</small><strong>${money(shared, trip.homeCurrency)}</strong></div>
</div>
<h2>Where your money went</h2><table>${rows}</table>
<p><strong>${summary.settlementOutstanding > 0 ? `Settlement remaining: ${money(summary.settlementOutstanding, trip.homeCurrency)}` : "Everyone is settled ✓"}</strong></p>
<button class="no-print" onclick="window.print()">Print / Save as PDF</button>
</body></html>`);
    popup.document.close();
    popup.focus();
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

        if (!db.objectStoreNames.contains(DB_RECEIPT_STORE)) {
          db.createObjectStore(DB_RECEIPT_STORE, { keyPath: "id" });
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

  async function idbPutReceipt(record) {
    if (!storageDB || storageMode !== "indexeddb") return false;
    const tx = storageDB.transaction(DB_RECEIPT_STORE, "readwrite");
    tx.objectStore(DB_RECEIPT_STORE).put(record);
    await txComplete(tx);
    return true;
  }

  async function idbGetReceipt(id) {
    if (!id || !storageDB || storageMode !== "indexeddb") return null;
    const tx = storageDB.transaction(DB_RECEIPT_STORE, "readonly");
    const result = await idbRequest(tx.objectStore(DB_RECEIPT_STORE).get(id));
    await txComplete(tx);
    return result || null;
  }

  async function idbDeleteReceipt(id) {
    if (!id || !storageDB || storageMode !== "indexeddb") return;
    const tx = storageDB.transaction(DB_RECEIPT_STORE, "readwrite");
    tx.objectStore(DB_RECEIPT_STORE).delete(id);
    await txComplete(tx);
  }

  async function idbListReceipts() {
    if (!storageDB || storageMode !== "indexeddb") return [];
    const tx = storageDB.transaction(DB_RECEIPT_STORE, "readonly");
    const rows = await idbRequest(tx.objectStore(DB_RECEIPT_STORE).getAll());
    await txComplete(tx);
    return Array.isArray(rows) ? rows : [];
  }

  function blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(reader.error || new Error("Could not read receipt"));
      reader.readAsDataURL(blob);
    });
  }

  function dataURLToBlob(dataURL) {
    const [header, encoded] = String(dataURL || "").split(",", 2);
    if (!header || !encoded) throw new Error("Invalid receipt data");
    const mime = header.match(/data:([^;]+)/)?.[1] || "image/jpeg";
    const binary = atob(encoded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  }

  function collectReceiptIds(data, out = new Set()) {
    if (!data || typeof data !== "object") return out;

    (data.expenses || []).forEach(expense => {
      if (expense?.receiptId) out.add(String(expense.receiptId));
    });

    (data.tripHistory || []).forEach(record => collectReceiptIds(record?.data, out));
    return out;
  }

  async function protectedReceiptIds() {
    const ids = collectReceiptIds(state, new Set());

    if (storageMode === "indexeddb" && storageDB) {
      try {
        const backups = await idbListBackups();
        backups.forEach(backup => collectReceiptIds(backup?.data, ids));
      } catch {}
    }
    return ids;
  }

  async function receiptStorageStats() {
    if (storageMode !== "indexeddb" || !storageDB) return { count: 0, bytes: 0 };
    const rows = await idbListReceipts();
    return {
      count: rows.length,
      bytes: rows.reduce((sum, row) => sum + Number(row.size || row.blob?.size || 0), 0)
    };
  }

  async function renderReceiptStorageStats() {
    const usageEl = $("storageUsageText");
    const receiptEl = $("receiptUsageText");
    if (!usageEl || !receiptEl) return;

    try {
      const estimate = await navigator.storage?.estimate?.();
      usageEl.textContent = estimate?.usage != null ? humanBytes(estimate.usage) : "Unavailable";

      const receiptStats = await receiptStorageStats();
      receiptEl.textContent = `${humanBytes(receiptStats.bytes)} • ${receiptStats.count} photo${receiptStats.count === 1 ? "" : "s"}`;
    } catch {
      usageEl.textContent = "Unavailable";
      receiptEl.textContent = "Unavailable";
    }
  }

  async function cleanupUnusedReceipts({ silent = false } = {}) {
    if (storageMode !== "indexeddb" || !storageDB) {
      if (!silent) toast("Receipt cleanup needs IndexedDB");
      return { removed: 0, bytes: 0 };
    }

    const keep = await protectedReceiptIds();
    const rows = await idbListReceipts();
    const unused = rows.filter(row => !keep.has(String(row.id)));

    if (unused.length) {
      const tx = storageDB.transaction(DB_RECEIPT_STORE, "readwrite");
      const store = tx.objectStore(DB_RECEIPT_STORE);
      unused.forEach(row => store.delete(row.id));
      await txComplete(tx);
    }

    const bytes = unused.reduce((sum, row) => sum + Number(row.size || row.blob?.size || 0), 0);
    await renderReceiptStorageStats();

    if (!silent) {
      toast(unused.length
        ? `Cleaned ${unused.length} unused receipt${unused.length === 1 ? "" : "s"} • ${humanBytes(bytes)}`
        : "No unused receipt files");
    }

    return { removed: unused.length, bytes };
  }

  function humanBytes(bytes) {
    const n = Number(bytes || 0);
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
    return `${(n / 1024 / 1024).toFixed(1)} MB`;
  }

  async function compressReceiptImage(file) {
    if (!file || !file.type?.startsWith("image/")) throw new Error("Choose an image");

    const maxBytes = 10 * 1024 * 1024;
    if (file.size > maxBytes) throw new Error("Receipt image is too large");

    const url = URL.createObjectURL(file);

    try {
      const image = await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
      });

      const maxDimension = 1600;
      const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth || 1, image.naturalHeight || 1));
      const width = Math.max(1, Math.round(image.naturalWidth * scale));
      const height = Math.max(1, Math.round(image.naturalHeight * scale));

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d", { alpha: false });
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(image, 0, 0, width, height);

      const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", 0.82));
      return blob || file;
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  function clearReceiptPreviewURL() {
    if (receiptPreviewURL) {
      URL.revokeObjectURL(receiptPreviewURL);
      receiptPreviewURL = "";
    }
  }

  function showReceiptPreview(blob, name = "Receipt attached") {
    const preview = $("receiptPreview");
    const image = $("receiptPreviewImage");
    if (!preview || !image || !blob) return;

    clearReceiptPreviewURL();
    receiptPreviewURL = URL.createObjectURL(blob);
    image.src = receiptPreviewURL;
    $("receiptPreviewName").textContent = name || "Receipt attached";
    $("receiptPreviewSize").textContent = `${humanBytes(blob.size)} • stored locally`;
    preview.classList.remove("hidden");
  }

  function clearReceiptEditor() {
    pendingReceiptBlob = null;
    pendingReceiptName = "";
    removeExistingReceipt = false;
    clearReceiptPreviewURL();

    if ($("receiptInput")) $("receiptInput").value = "";
    if ($("receiptPreview")) $("receiptPreview").classList.add("hidden");
    if ($("receiptPreviewImage")) $("receiptPreviewImage").removeAttribute("src");
  }

  async function loadExpenseReceipt(expense) {
    clearReceiptEditor();
    if (!expense?.receiptId) return;

    try {
      const record = await idbGetReceipt(expense.receiptId);
      if (record?.blob) showReceiptPreview(record.blob, record.name || "Receipt attached");
    } catch {}
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

  async function persistStateAndReceiptAtomically(snapshot, receiptRecord) {
    if (storageMode !== "indexeddb" || !storageDB || !receiptRecord?.id || !receiptRecord?.blob) {
      throw new Error("Atomic receipt storage unavailable");
    }

    invalidateAnalyticsCache();
    const cleanSnapshot = safeClone(snapshot);
    const integrity = stateIntegrityReport(cleanSnapshot);
    if (!integrity.ok) throw new Error(`State integrity failed: ${integrity.errors[0]}`);

    const now = Date.now();
    const day = today();
    const tx = storageDB.transaction(
      [DB_STATE_STORE, DB_BACKUP_STORE, DB_RECEIPT_STORE],
      "readwrite"
    );

    tx.objectStore(DB_RECEIPT_STORE).put(receiptRecord);
    tx.objectStore(DB_STATE_STORE).put({
      key: "current",
      data: cleanSnapshot,
      updatedAt: now,
      appVersion: APP_VERSION
    });

    if (meaningfulState(cleanSnapshot)) {
      const backups = tx.objectStore(DB_BACKUP_STORE);
      backups.put(backupRecord("latest", "latest", "Latest", cleanSnapshot, now));
      backups.put(backupRecord(`daily:${day}`, "daily", backupDateLabel(day), cleanSnapshot, now));
    }

    await txComplete(tx);
    lastStorageWriteAt = now;
    pendingStorageSnapshot = null;
    localStorage.removeItem(KEY);
    cleanupAutomaticBackups().catch(() => {});
    renderStoragePanel();
  }

  async function persistStateImmediately(snapshot = state, { maintainBackups = true } = {}) {
    invalidateAnalyticsCache();
    const cleanSnapshot = safeClone(snapshot);
    const integrity = stateIntegrityReport(cleanSnapshot);
    if (!integrity.ok) throw new Error(`State integrity failed: ${integrity.errors[0]}`);

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
    invalidateAnalyticsCache();
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

    renderReceiptStorageStats();
  }

  async function restoreBackup(id) {
    if (storageMode !== "indexeddb" || !storageDB) return;
    const backup = await idbGetBackup(id);
    if (!backup?.data) return toast("Restore point unavailable");

    const normalized = normalizeState(backup.data);
    const integrity = stateIntegrityReport(normalized);

    if (!integrity.ok) {
      alert(`This restore point failed validation and was not restored.\n\n${integrity.errors.slice(0, 3).join("\n")}`);
      return;
    }

    const description = snapshotDescription(normalized);
    const warning = integrity.warnings.length ? `\n\nNote: ${integrity.warnings[0]}` : "";

    if (!confirm(`Restore “${backup.label || "this snapshot"}”?\n\n${description}${warning}\n\nYour current data will be kept as a safety snapshot first.`)) {
      return;
    }

    try {
      if (meaningfulState(state)) {
        await createBackupSnapshot("Before restore", state, "before-restore");
      }

      state = normalized;
      await persistStateImmediately(state);
      applyAppearance(state.preferences?.appearance || "system");
      render();
      page(state.trip ? "dashboard" : "settings");
      toast("Restore point validated and restored");
    } catch {
      alert("TripSpend could not restore that snapshot safely.");
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

  function currencyDecimals(c) {
    return ["OMR", "KWD", "BHD"].includes(c) ? 3 : 2;
  }

  function smartAmount(v, c) {
    const n = num(v);
    const dec = currencyDecimals(c);
    const rounded = Number(n.toFixed(dec));
    const isWhole = Math.abs(rounded - Math.round(rounded)) < 10 ** -(dec + 1);

    return new Intl.NumberFormat(undefined, {
      minimumFractionDigits: isWhole ? 0 : dec,
      maximumFractionDigits: dec
    }).format(rounded);
  }

  function money(v, c) {
    return `${smartAmount(v, c)} ${c}`;
  }

  function percentText(v) {
    const n = num(v);
    const nearestWhole = Math.round(n);
    const display = Math.abs(n - nearestWhole) < 0.05
      ? nearestWhole
      : Number(n.toFixed(1));

    return new Intl.NumberFormat(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1
    }).format(display) + "%";
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

  function invalidateAnalyticsCache() {
    analyticsCacheRevision += 1;
    analyticsCache.clear();
    lastExpenseRenderKey = "";
    lastAnalyticsRenderKey = "";
  }

  function cachedAnalytics(key, calculate) {
    const cacheKey = `${analyticsCacheRevision}:${key}`;
    if (analyticsCache.has(cacheKey)) return analyticsCache.get(cacheKey);
    const value = calculate();
    analyticsCache.set(cacheKey, value);
    return value;
  }

  function spent() {
    return cachedAnalytics("spent", () =>
      state.expenses.reduce((sum, e) => sum + num(e.homeAmount), 0)
    );
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
    return cachedAnalytics(`aggregate:${field}`, () => {
      const map = new Map();
      state.expenses.forEach(e => {
        const key = e[field] || "Other";
        map.set(key, (map.get(key) || 0) + num(e.homeAmount));
      });
      return [...map].map(([label, amount]) => ({ label, amount })).sort((a, b) => b.amount - a.amount);
    });
  }

  function dailyRows() {
    return cachedAnalytics("dailyRows", () => {
      const map = new Map();
      state.expenses.forEach(e => map.set(e.date, (map.get(e.date) || 0) + num(e.homeAmount)));
      return [...map].map(([date, amount]) => ({ date, amount })).sort((a, b) => a.date.localeCompare(b.date));
    });
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

  function applyLargeMoneyClass(el, text) {
    if (!el) return;
    const length = String(text || "").replace(/[\s,.]/g, "").length;
    el.classList.toggle("money-large", length >= 10);
    el.classList.toggle("money-xlarge", length >= 13);
  }

  function renderHealth() {
    const h = health(), banner = $("healthBanner");
    // Keep structural/modifier classes owned by the markup. Replacing className here
    // used to silently remove v6-health-banner after the first render.
    banner.classList.remove("on-track", "watch", "over");
    banner.classList.add(h.cls);
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

  function expenseSearchIndex() {
    return cachedAnalytics("expenseSearchIndex", () => {
      const stopNames = new Map((state.stops || []).map(stop => [stop.id, stop.country || ""]));
      const personNames = new Map((state.people || []).map(person => [person.id, person.name || ""]));
      const index = new Map();

      state.expenses.forEach(expense => {
        const payer = expense.paidByPersonId ? (personNames.get(expense.paidByPersonId) || "") : "";
        const assigned = (expense.personShares || [])
          .map(share => personNames.get(share.personId) || "")
          .join(" ");
        const typeText = inferredExpenseType(expense);

        index.set(
          expense.id,
          `${expense.category || ""} ${expense.note || ""} ${expense.paymentMethod || ""} ${assigned} ${stopNames.get(expense.stopId) || ""} ${payer} ${typeText}`.toLowerCase()
        );
      });

      return index;
    });
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
    const searchIndex = q ? expenseSearchIndex() : null;

    const rows = [];
    for (const expense of state.expenses) {
      if (category && expense.category !== category) continue;
      if (type && inferredExpenseType(expense) !== type) continue;
      if (country && expense.stopId !== country) continue;
      if (payment && expense.paymentMethod !== payment) continue;
      if (dateFrom && expense.date < dateFrom) continue;
      if (dateTo && expense.date > dateTo) continue;

      if (person) {
        if (person === "__unassigned__") {
          if ((expense.personShares || []).length) continue;
        } else if (!(expense.personShares || []).some(share => share.personId === person)) {
          continue;
        }
      }

      if (q && !searchIndex.get(expense.id)?.includes(q)) continue;
      rows.push(expense);
    }

    return rows.sort(sortNew);
  }

  function renderCountryFilter() {
    const select = $("filterCountry");
    if (!select) return;

    const signature = (state.stops || [])
      .map(stop => `${stop.id}:${stop.country}`)
      .join("|");
    if (signature === expenseCountryFilterSignature && select.options.length) return;
    expenseCountryFilterSignature = signature;

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

    const stopMap = new Map((state.stops || []).map(stop => [stop.id, stop]));
    const personMap = new Map((state.people || []).map(person => [person.id, person.name || "Traveler"]));
    const fragment = document.createDocumentFragment();

    const assignmentTextFast = expense => {
      const shares = Array.isArray(expense.personShares) ? expense.personShares : [];
      if (!shares.length) return "Unassigned";
      if (shares.length === 1) return personMap.get(shares[0].personId) || "Traveler";
      const names = shares.map(share => personMap.get(share.personId) || "Traveler");
      if (names.length <= 2) return `Shared • ${names.join(" & ")}`;
      return `Shared • ${names.length} travelers`;
    };

    expenses.forEach(expense => {
      const row = document.createElement("div");
      row.className = "expense expense-clickable";
      row.tabIndex = 0;
      row.setAttribute("role", "button");
      row.setAttribute("aria-label", `Open ${expense.note?.trim() || expense.category} expense details`);
      row.onclick = () => openExpenseDetails(expense.id);
      row.onkeydown = event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openExpenseDetails(expense.id);
        }
      };

      let touchStartX = 0;
      let touchStartY = 0;
      row.addEventListener("touchstart", event => {
        const touch = event.touches?.[0];
        if (!touch) return;
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
      }, { passive: true });

      row.addEventListener("touchend", event => {
        const touch = event.changedTouches?.[0];
        if (!touch) return;
        const dx = touch.clientX - touchStartX;
        const dy = touch.clientY - touchStartY;
        if (Math.abs(dx) < 44 || Math.abs(dx) < Math.abs(dy) * 1.25) return;

        if (dx < 0) {
          document.querySelectorAll(".expense.quick-actions-open").forEach(other => {
            if (other !== row) other.classList.remove("quick-actions-open");
          });
          row.classList.add("quick-actions-open");
        } else {
          row.classList.remove("quick-actions-open");
        }
      }, { passive: true });

      const iconEl = document.createElement("div");
      iconEl.className = "expense-icon";
      iconEl.textContent = icon(expense.category);

      const main = document.createElement("div");
      main.className = "expense-main";
      const title = document.createElement("strong");
      title.textContent = expense.note?.trim() || expense.category;
      const sub = document.createElement("span");
      const expenseStop = stopMap.get(expense.stopId);
      const payerName = expense.paidByPersonId ? personMap.get(expense.paidByPersonId) : "";
      const payerText = payerName ? `Paid by ${payerName}` : "Payer not tracked";
      const stopText = expenseStop?.country ? `${expenseStop.country} • ` : "";
      sub.textContent = `${stopText}${expense.category} • ${fmtDateLong(expense.date)} • ${payerText} • For ${assignmentTextFast(expense)}`;
      main.append(title, sub);

      if (expense.receiptId) {
        const receiptBadge = document.createElement("span");
        receiptBadge.className = "expense-receipt-badge";
        receiptBadge.textContent = "📎 Receipt";
        receiptBadge.onclick = event => {
          event.stopPropagation();
          openReceiptViewer(expense.receiptId);
        };
        main.append(receiptBadge);
      }

      const side = document.createElement("div");
      side.className = "expense-side";
      const amount = document.createElement("strong");
      amount.textContent = money(expense.homeAmount, state.trip.homeCurrency);
      const original = document.createElement("span");
      original.textContent = expense.currency === state.trip.homeCurrency
        ? expense.currency
        : money(expense.amount, expense.currency);
      side.append(amount, original);

      if (actions) {
        const quick = document.createElement("button");
        quick.type = "button";
        quick.className = "expense-quick-btn";
        quick.textContent = "•••";
        quick.setAttribute("aria-label", "Show expense actions");
        quick.onclick = event => {
          event.stopPropagation();
          const willOpen = !row.classList.contains("quick-actions-open");
          document.querySelectorAll(".expense.quick-actions-open").forEach(other => {
            if (other !== row) other.classList.remove("quick-actions-open");
          });
          row.classList.toggle("quick-actions-open", willOpen);
        };
        side.append(quick);
      }

      row.append(iconEl, main, side);

      if (actions) {
        const act = document.createElement("div");
        act.className = "expense-actions";

        const repeat = document.createElement("button");
        repeat.className = "mini";
        repeat.type = "button";
        repeat.textContent = "↻ Repeat";
        repeat.onclick = event => { event.stopPropagation(); openModal("", expense); };

        const edit = document.createElement("button");
        edit.className = "mini";
        edit.type = "button";
        edit.textContent = "Edit";
        edit.onclick = event => { event.stopPropagation(); openModal(expense.id); };

        const del = document.createElement("button");
        del.className = "mini delete";
        del.type = "button";
        del.textContent = "Delete";
        del.onclick = event => { event.stopPropagation(); removeExpense(expense.id); };

        act.append(repeat, edit, del);
        row.append(act);
      }

      fragment.append(row);
    });

    el.append(fragment);
  }

  function renderPersonFilter() {
    const select = $("filterPerson");
    if (!select) return;

    const signature = state.people
      .map(person => `${person.id}:${person.name}:${person.active !== false}`)
      .join("|");
    if (signature === expensePersonFilterSignature && select.options.length) return;
    expensePersonFilterSignature = signature;

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

    if ([...select.options].some(option => option.value === current)) select.value = current;
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

    const renderKey = [
      analyticsCacheRevision,
      state.trip.id,
      expenseRenderLimit,
      $("searchExpense")?.value || "",
      $("filterCategory")?.value || "",
      $("filterType")?.value || "",
      $("filterCountry")?.value || "",
      $("filterPayment")?.value || "",
      $("filterPerson")?.value || "",
      $("filterDateFrom")?.value || "",
      $("filterDateTo")?.value || ""
    ].join("|");

    if (renderKey === lastExpenseRenderKey) return;
    lastExpenseRenderKey = renderKey;

    const filtered = filteredExpenses();
    const visible = filtered.slice(0, expenseRenderLimit);
    renderExpenseList($("allList"), visible, true);

    const loadHost = $("expenseLoadMore");
    if (loadHost) {
      loadHost.replaceChildren();

      if (visible.length < filtered.length) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "secondary expense-load-more-btn";
        button.textContent = `Show 100 more • ${filtered.length - visible.length} remaining`;
        button.onclick = () => {
          expenseRenderLimit += 100;
          renderExpenseViews();
        };
        loadHost.append(button);
      }
    }

    const summaryTotal = filteredTotal(filtered);
    const suffix = $("filterPerson").value && $("filterPerson").value !== "__unassigned__" ? " assigned share" : "";
    const shownText = filtered.length > visible.length ? ` • showing ${visible.length}` : "";
    $("expenseSummary").textContent = `${filtered.length} expense${filtered.length === 1 ? "" : "s"}${shownText} • ${money(summaryTotal, state.trip.homeCurrency)}${suffix}`;
  }

  function resetExpenseRenderLimit() {
    expenseRenderLimit = 100;
    lastExpenseRenderKey = "";
  }


  function renderAnalyticsOverview() {
    if (!state.trip) return;

    const total = spent();
    const budget = num(state.trip.budget);
    const remaining = budget - total;
    const pct = budget > 0 ? clamp(total / budget * 100, 0, 100) : 0;
    const categories = aggregate("category");
    const top = categories[0] || null;

    const splitStats = cachedAnalytics("analyticsSplitStats", () => {
      let personal = 0;
      let shared = 0;
      let largest = 0;

      state.expenses.forEach(expense => {
        const type = expense.expenseType === "shared" || expense.expenseType === "personal"
          ? expense.expenseType
          : ((expense.personShares || []).length > 1 ? "shared" : "personal");
        const amount = num(expense.homeAmount);

        if (type === "shared") shared += amount;
        else personal += amount;
        if (amount > largest) largest = amount;
      });

      return { personal, shared, largest };
    });

    const { personal, shared } = splitStats;

    if ($("analyticsTotalSpent")) {
      $("analyticsTotalSpent").textContent = smartAmount(total, state.trip.homeCurrency);
      applyLargeMoneyClass($("analyticsTotalSpent"), $("analyticsTotalSpent").textContent);
    }
    if ($("analyticsCurrency")) $("analyticsCurrency").textContent = state.trip.homeCurrency;

    if ($("analyticsBudgetPct")) {
      $("analyticsBudgetPct").textContent = budget > 0
        ? `${percentText(total / budget * 100)} of budget`
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

    const pace = $("analyticsPace");
    if (pace) {
      const tripDays = Math.max(1, totalTripDays());
      const elapsedDays = elapsed();
      const budgetUsedPct = budget > 0 ? total / budget * 100 : 0;
      const timeUsedPct = elapsedDays > 0 ? Math.min(100, elapsedDays / tripDays * 100) : 0;

      pace.classList.remove("ahead", "watch", "complete");

      if (today() < state.trip.startDate) {
        pace.querySelector("span").textContent = "◎";
        pace.querySelector("strong").textContent = budget > 0
          ? `Before trip • ${money(budget / tripDays, state.trip.homeCurrency)} starting daily budget`
          : "Before trip • add a budget to track your pace";
      } else if (today() > state.trip.endDate) {
        pace.classList.add("complete");
        pace.querySelector("span").textContent = remaining >= 0 ? "✓" : "!";
        pace.querySelector("strong").textContent = remaining >= 0
          ? `Trip complete • ${money(remaining, state.trip.homeCurrency)} under budget`
          : `Trip complete • ${money(Math.abs(remaining), state.trip.homeCurrency)} over budget`;
      } else if (budget <= 0) {
        pace.querySelector("span").textContent = "◎";
        pace.querySelector("strong").textContent = "Add a trip budget to compare your spending pace";
      } else if (budgetUsedPct <= timeUsedPct + 5) {
        pace.classList.add("ahead");
        pace.querySelector("span").textContent = "✓";
        pace.querySelector("strong").textContent = `On pace • ${Math.round(budgetUsedPct)}% budget used vs ${Math.round(timeUsedPct)}% of trip`;
      } else {
        pace.classList.add("watch");
        pace.querySelector("span").textContent = "↗";
        pace.querySelector("strong").textContent = `Spending faster • ${Math.round(budgetUsedPct)}% budget used vs ${Math.round(timeUsedPct)}% of trip`;
      }
    }
  }

  function renderAnalyticsPage() {
    if (!state.trip) return;

    const renderKey = `${analyticsCacheRevision}|${state.trip.id}|${today()}`;
    if (renderKey === lastAnalyticsRenderKey) return;
    lastAnalyticsRenderKey = renderKey;

    const t = state.trip;
    const s = spent();
    const count = state.expenses.length;
    const splitStats = cachedAnalytics("analyticsSplitStats", () => {
      let personal = 0;
      let shared = 0;
      let largest = 0;
      state.expenses.forEach(expense => {
        const type = inferredExpenseType(expense);
        const amount = num(expense.homeAmount);
        if (type === "shared") shared += amount;
        else personal += amount;
        largest = Math.max(largest, amount);
      });
      return { personal, shared, largest };
    });

    renderAnalyticsOverview();
    $("avgDay").textContent = money(s / Math.max(1, elapsed() || 1), t.homeCurrency);
    $("avgTransaction").textContent = money(count ? s / count : 0, t.homeCurrency);
    $("largest").textContent = money(splitStats.largest, t.homeCurrency);

    const drows = dailyRows();
    const biggest = cachedAnalytics("biggestDay", () =>
      drows.length ? drows.reduce((best, row) => !best || row.amount > best.amount ? row : best, null) : null
    );
    $("biggestDay").textContent = biggest ? `${fmtDate(biggest.date)} • ${money(biggest.amount, t.homeCurrency)}` : "—";

    renderBars($("categoryAnalytics"), aggregate("category"), row => `${icon(row.label)} ${row.label}`);
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
    $("tripSwitcherTrigger")?.classList.toggle("hidden", !hasTrip);

    const headerTitle = $("headerTitle");
    if (headerTitle) {
      headerTitle.classList.toggle("trip-title-switchable", hasTrip);
      headerTitle.onclick = hasTrip ? openTripSwitcher : null;
      headerTitle.onkeydown = hasTrip ? event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openTripSwitcher();
        }
      } : null;

      if (hasTrip) {
        headerTitle.setAttribute("role", "button");
        headerTitle.setAttribute("tabindex", "0");
        headerTitle.setAttribute("aria-label", "Switch trip");
      } else {
        headerTitle.removeAttribute("role");
        headerTitle.removeAttribute("tabindex");
        headerTitle.removeAttribute("aria-label");
      }
    }

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
    renderHomeTripHistoryAccess();

    renderHealth();
    $("remainingValue").textContent = smartAmount(Math.abs(remaining), t.homeCurrency);
    if ($("budgetHeroLabel")) {
      $("budgetHeroLabel").textContent = remaining < 0 ? "OVER TRIP BUDGET" : "TRIP BUDGET LEFT";
    }
    applyLargeMoneyClass($("remainingValue"), $("remainingValue").textContent);
    $("remainingCode").textContent = t.homeCurrency;
    const rawBudgetPct = t.budget > 0 ? (s / t.budget * 100) : 0;
    $("usedPct").textContent = `${percentText(rawBudgetPct)} used`;
    $("usedPct").classList.toggle("budget-watch", rawBudgetPct >= 80 && rawBudgetPct <= 100);
    $("usedPct").classList.toggle("budget-over", rawBudgetPct > 100);
    $("progressBar").style.width = `${pct}%`;
    $("progressBar").classList.toggle("budget-watch", rawBudgetPct >= 80 && rawBudgetPct <= 100);
    $("progressBar").classList.toggle("budget-over", rawBudgetPct > 100);
    $("budgetValue").textContent = money(t.budget, t.homeCurrency);
    $("spentValue").textContent = money(s, t.homeCurrency);

    const convertedPlanIds = new Set(
      state.expenses.map(expense => expense.planId).filter(Boolean)
    );
    const plannedReserve = (state.plans || [])
      .filter(plan => plan.status !== "paid" && !convertedPlanIds.has(plan.id))
      .reduce((sum, plan) => sum + num(plan.homeAmount), 0);
    const availableAfterPlans = remaining - plannedReserve;
    const safeTodayAfterPlans = daysLeft > 0 ? Math.max(0, availableAfterPlans) / daysLeft : 0;

    if ($("plannedReserveValue")) $("plannedReserveValue").textContent = money(plannedReserve, t.homeCurrency);
    if ($("homeBudgetDetailsHint")) {
      $("homeBudgetDetailsHint").textContent = plannedReserve > 0
        ? `${money(plannedReserve, t.homeCurrency)} reserved`
        : "No upcoming costs reserved";
    }
    if ($("availableAfterPlansValue")) {
      $("availableAfterPlansValue").textContent = availableAfterPlans >= 0
        ? money(availableAfterPlans, t.homeCurrency)
        : `${money(Math.abs(availableAfterPlans), t.homeCurrency)} short`;
      $("availableAfterPlansValue").classList.toggle("negative", availableAfterPlans < 0);
    }

    $("safeToday").textContent = money(safeTodayAfterPlans, t.homeCurrency);
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
      renderUpdateSettings(latestVersionKnown ? "online" : "checking");
      runDiagnostics();
    }

    if (activePage === "trips") renderTripsPage();
    if (activePage === "people") renderPeoplePage();

    window.dispatchEvent(new CustomEvent("tripspend:render", { detail: { activePage } }));
  }

  function page(id) {
    const currentPage = document.querySelector(".page.active")?.id || "";
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Re-tapping the current tab should feel instant and avoid rebuilding the page.
    if (currentPage === id) {
      window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
      return;
    }

    document.querySelectorAll(".expense.quick-actions-open").forEach(row => {
      row.classList.remove("quick-actions-open");
    });

    document.querySelectorAll(".page").forEach(p => p.classList.toggle("active", p.id === id));
    const navPage = id === "trips" || id === "people" ? "settings" : id;
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.toggle("active", b.dataset.page === navPage));

    // Native-feeling page switches: content changes immediately, then the document settles at top.
    window.scrollTo({ top: 0, behavior: "auto" });

    const started = performance.now();

    if (id === "people") renderPeoplePage();
    if (id === "expenses") renderExpenseViews();
    if (id === "analytics") renderAnalyticsPage();
    if (id === "settings") {
      fillSettings();
      renderAppearanceControls();
      renderRates();
      renderStoragePanel();
      renderUpdateSettings(latestVersionKnown ? "online" : "checking");
      runDiagnostics();
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

  function clearExpenseDetailReceiptURL() {
    if (expenseDetailReceiptURL) {
      URL.revokeObjectURL(expenseDetailReceiptURL);
      expenseDetailReceiptURL = "";
    }
    if ($("expenseDetailReceiptThumb")) $("expenseDetailReceiptThumb").removeAttribute("src");
  }

  function clearReceiptViewerURL() {
    if (receiptViewerURL) {
      URL.revokeObjectURL(receiptViewerURL);
      receiptViewerURL = "";
    }
    if ($("receiptViewerImage")) {
      $("receiptViewerImage").removeAttribute("src");
      $("receiptViewerImage").style.transform = "";
    }
  }

  function expenseDetailItem(label, value) {
    const item = document.createElement("div");
    item.className = "expense-detail-item";
    const small = document.createElement("small");
    small.textContent = label;
    const strong = document.createElement("strong");
    strong.textContent = value || "—";
    item.append(small, strong);
    return item;
  }

  async function openExpenseDetails(id) {
    const expense = state.expenses.find(item => item.id === id);
    if (!expense) return;

    activeExpenseDetailId = expense.id;
    const stop = (state.stops || []).find(item => item.id === expense.stopId);
    const payer = expense.paidByPersonId ? personName(expense.paidByPersonId) : "Not tracked";
    const type = inferredExpenseType(expense) === "shared" ? "Shared" : "Personal";

    $("expenseDetailTitle").textContent = expense.note?.trim() || expense.category;
    $("expenseDetailAmount").textContent = money(expense.homeAmount, state.trip.homeCurrency);
    applyLargeMoneyClass($("expenseDetailAmount"), $("expenseDetailAmount").textContent);
    $("expenseDetailOriginal").textContent = expense.currency === state.trip.homeCurrency
      ? money(expense.amount, expense.currency)
      : `${money(expense.amount, expense.currency)} • rate ${Number(expense.rate || 0).toPrecision(6).replace(/0+$/,"").replace(/\.$/,"")}`;

    const grid = $("expenseDetailGrid");
    grid.replaceChildren(
      expenseDetailItem("Country", stop ? `${countryFlag(stop.country)} ${stop.country}` : "—"),
      expenseDetailItem("Date", fmtDateWithYear(expense.date)),
      expenseDetailItem("Type", type),
      expenseDetailItem("Paid by", payer),
      expenseDetailItem("For", expenseAssignmentText(expense)),
      expenseDetailItem("Category", `${icon(expense.category)} ${expense.category}`),
      expenseDetailItem("Payment", expense.paymentMethod || "—"),
      expenseDetailItem("Exchange rate", expense.currency === state.trip.homeCurrency ? "No conversion" : `1 ${state.trip.homeCurrency} = ${expense.rate} ${expense.currency}`)
    );

    const sharesEl = $("expenseDetailShares");
    sharesEl.replaceChildren();
    const shares = expense.personShares || [];
    if (shares.length > 1) {
      const title = document.createElement("strong");
      title.textContent = "Shared split";
      sharesEl.append(title);
      shares.forEach(share => {
        const row = document.createElement("div");
        const name = document.createElement("span");
        name.textContent = personName(share.personId);
        const amount = document.createElement("strong");
        amount.textContent = money(share.amount, state.trip.homeCurrency);
        row.append(name, amount);
        sharesEl.append(row);
      });
      sharesEl.classList.remove("hidden");
    } else {
      sharesEl.classList.add("hidden");
    }

    clearExpenseDetailReceiptURL();
    const receiptBox = $("expenseDetailReceipt");
    const noReceipt = $("expenseDetailNoReceipt");
    receiptBox.classList.add("hidden");
    noReceipt.classList.remove("hidden");

    if (expense.receiptId) {
      try {
        const record = await idbGetReceipt(expense.receiptId);
        if (record?.blob) {
          expenseDetailReceiptURL = URL.createObjectURL(record.blob);
          $("expenseDetailReceiptThumb").src = expenseDetailReceiptURL;
          $("expenseDetailReceiptMeta").textContent = `${humanBytes(record.size || record.blob.size)} • ${record.name || "Receipt"}`;
          receiptBox.classList.remove("hidden");
          noReceipt.classList.add("hidden");
        } else {
          noReceipt.textContent = "Receipt record exists, but the photo file is unavailable.";
        }
      } catch {
        noReceipt.textContent = "Receipt photo could not be opened.";
      }
    } else {
      noReceipt.textContent = "No receipt attached";
    }

    $("expenseDetailModal").classList.remove("hidden");
    document.body.classList.add("sheet-open");
    document.body.style.overflow = "hidden";
  }

  function closeExpenseDetails() {
    $("expenseDetailModal")?.classList.add("hidden");
    clearExpenseDetailReceiptURL();
    activeExpenseDetailId = "";
    if ($("receiptViewerModal")?.classList.contains("hidden")) {
      document.body.classList.remove("sheet-open");
      document.body.style.overflow = "";
    }
  }

  function applyReceiptViewerScale() {
    const image = $("receiptViewerImage");
    if (!image) return;
    image.style.transform = `scale(${receiptViewerScale})`;
    $("receiptZoomLabel").textContent = `${Math.round(receiptViewerScale * 100)}%`;
  }

  async function openReceiptViewer(receiptId) {
    if (!receiptId) return toast("No receipt attached");

    try {
      const record = await idbGetReceipt(receiptId);
      if (!record?.blob) return toast("Receipt photo is unavailable");

      clearReceiptViewerURL();
      receiptViewerURL = URL.createObjectURL(record.blob);
      receiptViewerScale = 1;

      $("receiptViewerTitle").textContent = record.name || "Receipt";
      $("receiptViewerImage").src = receiptViewerURL;
      applyReceiptViewerScale();

      $("receiptViewerModal").classList.remove("hidden");
      document.body.classList.add("sheet-open");
      document.body.style.overflow = "hidden";
    } catch {
      toast("Could not open receipt");
    }
  }

  function closeReceiptViewer() {
    $("receiptViewerModal")?.classList.add("hidden");
    clearReceiptViewerURL();
    receiptViewerScale = 1;
    if ($("expenseDetailModal")?.classList.contains("hidden") && $("modal")?.classList.contains("hidden")) {
      document.body.classList.remove("sheet-open");
      document.body.style.overflow = "";
    }
  }

  async function replaceDetailReceipt(file) {
    const expense = state.expenses.find(item => item.id === activeExpenseDetailId);
    if (!expense || !file) return;

    if (storageMode !== "indexeddb") return toast("Receipt storage needs IndexedDB");

    try {
      const blob = await compressReceiptImage(file);
      const receiptId = coreReceiptId(expense.id);

      await idbPutReceipt({
        id: receiptId,
        tripId: state.trip.id,
        expenseId: expense.id,
        name: file.name || "Receipt.jpg",
        type: blob.type || "image/jpeg",
        size: blob.size || 0,
        blob,
        createdAt: Date.now()
      });

      expense.receiptId = receiptId;
      save({ immediate: true });
      await openExpenseDetails(expense.id);
      renderExpenseViews();
      renderReceiptStorageStats();
      cleanupUnusedReceipts({ silent: true }).catch(() => {});
      toast("Receipt replaced");
    } catch {
      toast("Could not replace receipt");
    } finally {
      if ($("detailReceiptReplaceInput")) $("detailReceiptReplaceInput").value = "";
    }
  }

  async function removeDetailReceipt() {
    const expense = state.expenses.find(item => item.id === activeExpenseDetailId);
    if (!expense?.receiptId) return;

    if (!confirm("Remove this receipt from the expense?")) return;

    expense.receiptId = "";
    save({ immediate: true });
    await openExpenseDetails(expense.id);
    renderExpenseViews();
    cleanupUnusedReceipts({ silent: true }).catch(() => {});
    toast("Receipt removed");
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

    // Repeated expenses intentionally do not copy the previous receipt.
    loadExpenseReceipt(existing || null);

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
    document.body.classList.add("sheet-open");
    document.body.style.overflow = "hidden";
    setTimeout(() => $("expenseAmount").focus(), 60);
  }

  function closeModal() {
    $("modal").classList.add("hidden");
    document.body.classList.remove("sheet-open");
    document.body.style.overflow = "";
    $("expenseForm").reset();
    $("editId").value = "";
    clearReceiptEditor();
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

  function coreReceiptId(expenseId) {
    return `receipt:${state.trip?.id || "trip"}:${expenseId}:${uid("img")}`;
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

  async function removeExpense(id) {
    const expense = state.expenses.find(x => x.id === id);
    if (expense && confirm(`Delete ${expense.note || expense.category}?`)) {
      state.expenses = state.expenses.filter(x => x.id !== id);
      save();
      render();
      cleanupUnusedReceipts({ silent: true }).catch(() => {});
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
    const usedByExpenses = state.expenses.some(e =>
      e.paidByPersonId === id || (e.personShares || []).some(s => s.personId === id)
    );
    const usedBySettlements = (state.settlements || []).some(s =>
      s.fromPersonId === id || s.toPersonId === id
    );
    if (usedByExpenses || usedBySettlements) return toast("Archive this traveler instead to preserve history");
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
    ].filter(category => CATS.includes(category)).slice(0, 5);

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
  $("expenseCategory").onchange = () => { suggestCategory(); duplicateCheck(); };
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
  });

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
        const reg = await navigator.serviceWorker.register("./sw.js?v=6.7.5", {
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
