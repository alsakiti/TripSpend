(() => {
  "use strict";

  const KEY = "tripspend.v1";
  const CURS = ["OMR","AED","SAR","QAR","KWD","BHD","USD","EUR","GBP","THB","IDR","JPY","MYR","SGD","INR","TRY","CHF","AUD","CAD","NZD","CNY","KRW","PHP","VND"];
  const DESTS = ["Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cambodia", "Cameroon", "Canada", "Cape Verde", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic", "Democratic Republic of the Congo", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Ivory Coast", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Republic of the Congo", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe", "Multiple countries / Other"];
  const CATS = [["Food","🍽️"],["Transport","🚕"],["Hotel","🏨"],["Shopping","🛍️"],["Activities","🎟️"],["Flights","✈️"],["Coffee","☕"],["Groceries","🛒"],["Other","🧾"]];
  const PAYS = ["Cash","Credit Card","Debit Card","Apple Pay","Other"];
  const KEYWORDS = {Coffee:["coffee","cafe","café","latte","espresso","starbucks"],Food:["dinner","lunch","breakfast","restaurant","meal","burger","pizza","sushi","food","brunch"],Transport:["taxi","uber","grab","careem","metro","bus","train","fuel","gas","parking","toll"],Hotel:["hotel","resort","room","booking","airbnb","hostel"],Shopping:["shopping","mall","clothes","shirt","shoes","souvenir","gift"],Activities:["ticket","tour","museum","spa","massage","activity","excursion","park"],Flights:["flight","airline","airport","baggage","luggage"],Groceries:["grocery","groceries","supermarket","market","water","snacks"]};
  const $ = id => document.getElementById(id);

  let state = load();
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
    return { trip: null, expenses: [], rates: {}, people: [] };
  }

  function normalizeExpense(expense) {
    const e = { ...expense };
    if (!Array.isArray(e.personShares)) e.personShares = [];
    e.personShares = e.personShares
      .filter(s => s && s.personId)
      .map(s => ({ personId: String(s.personId), amount: num(s.amount) }));
    return e;
  }

  function normalizeState(raw) {
    const clean = raw && typeof raw === "object" ? raw : {};
    const trip = clean.trip || null;
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

    return {
      trip,
      expenses: Array.isArray(clean.expenses) ? clean.expenses.map(normalizeExpense) : [],
      rates: clean.rates && typeof clean.rates === "object" ? clean.rates : {},
      people
    };
  }

  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY));
      return raw ? normalizeState(raw) : blank();
    } catch {
      return blank();
    }
  }

  function save() {
    localStorage.setItem(KEY, JSON.stringify(state));
  }

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
        name.textContent = country;
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
      empty.className = "empty";
      empty.textContent = "Not enough data yet.";
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
      empty.className = "empty";
      empty.textContent = "Daily spending will appear here.";
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
    const payment = $("filterPayment").value;
    const person = $("filterPerson").value;

    return state.expenses
      .filter(e => !category || e.category === category)
      .filter(e => !payment || e.paymentMethod === payment)
      .filter(e => {
        if (!person) return true;
        if (person === "__unassigned__") return !(e.personShares || []).length;
        return (e.personShares || []).some(s => s.personId === person);
      })
      .filter(e => !q || `${e.category} ${e.note || ""} ${e.paymentMethod} ${expenseAssignmentText(e)}`.toLowerCase().includes(q))
      .slice()
      .sort(sortNew);
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
      empty.className = "empty";
      empty.textContent = "No expenses yet.";
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
      sub.textContent = `${expense.category} • ${fmtDateLong(expense.date)} • ${expense.paymentMethod} • ${expenseAssignmentText(expense)}`;
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
    const filtered = filteredExpenses();
    renderExpenseList($("allList"), filtered, true);

    const summaryTotal = filteredTotal(filtered);
    const suffix = $("filterPerson").value && $("filterPerson").value !== "__unassigned__" ? " assigned share" : "";
    $("expenseSummary").textContent = `${filtered.length} expense${filtered.length === 1 ? "" : "s"} • ${money(summaryTotal, state.trip.homeCurrency)}${suffix}`;
  }

  function render() {
    const hasTrip = !!state.trip;
    $("setupView").classList.toggle("hidden", hasTrip);
    $("mainView").classList.toggle("hidden", !hasTrip);
    $("nav").classList.toggle("hidden", !hasTrip);
    $("settingsShortcut").classList.toggle("hidden", !hasTrip);

    if (!hasTrip) {
      $("headerTitle").textContent = "TripSpend";
      $("headerSub").textContent = "Travel spending, made simple.";
      return;
    }

    const t = state.trip, s = spent(), remaining = t.budget - s, daysLeft = left();
    const pct = t.budget > 0 ? clamp(s / t.budget * 100, 0, 100) : 0;
    const forecast = projected();

    $("headerTitle").textContent = t.name;
    $("headerSub").textContent = `${t.destination} • ${fmtDate(t.startDate)} – ${fmtDate(t.endDate)}`;

    renderHealth();
    $("remainingValue").textContent = money(remaining, t.homeCurrency).replace(` ${t.homeCurrency}`, "");
    $("remainingCode").textContent = t.homeCurrency;
    $("usedPct").textContent = `${Math.round(pct)}% used`;
    $("progressBar").style.width = `${pct}%`;
    $("budgetValue").textContent = money(t.budget, t.homeCurrency);
    $("spentValue").textContent = money(s, t.homeCurrency);
    $("safeToday").textContent = money(daysLeft > 0 ? Math.max(0, remaining) / daysLeft : 0, t.homeCurrency);
    $("spentToday").textContent = money(todaySpent(), t.homeCurrency);
    $("projectedTotal").textContent = forecast > 0 ? money(forecast, t.homeCurrency) : "—";
    $("daysLeft").textContent = String(daysLeft);

    renderPeopleSnapshot();
    renderInsights();
    renderExpenseList($("recentList"), state.expenses.slice().sort(sortNew).slice(0, 5), false);
    renderBars($("topCategories"), aggregate("category").slice(0, 4), r => `${icon(r.label)} ${r.label}`);

    renderExpenseViews();

    const count = state.expenses.length;
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

    fillSettings();
    renderRates();
    renderPeoplePage();
  }

  function page(id) {
    document.querySelectorAll(".page").forEach(p => p.classList.toggle("active", p.id === id));
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.toggle("active", b.dataset.page === id));
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (id === "people") renderPeoplePage();
    if (id === "expenses") renderExpenseViews();
  }

  function openModal(id = "", template = null) {
    if (!state.trip) return;

    const existing = id ? state.expenses.find(e => e.id === id) : null;
    const source = existing || template;
    const isRepeat = !existing && !!template;

    $("editId").value = existing?.id || "";
    $("modalTitle").textContent = existing ? "Edit Expense" : isRepeat ? "Repeat Expense" : "Add Expense";

    opts($("expenseCurrency"), CURS, source?.currency || state.trip.tripCurrency);
    opts($("expenseCategory"), CATS, source?.category || "Food");
    opts($("paymentMethod"), PAYS, source?.paymentMethod || state.trip.defaultPayment || "Credit Card");

    const selection = source ? selectedPersonValue(source) : (activePeople().length === 1 ? activePeople()[0].id : "");
    const includeIds = source?.personShares?.map(s => s.personId) || [];
    fillExpensePeople(selection, includeIds);

    $("expenseAmount").value = source?.amount ?? "";
    $("exchangeRate").value = source?.rate ?? "";
    $("expenseDate").value = existing ? existing.date : today();
    $("expenseNote").value = source?.note || "";
    $("liveRateStatus").textContent = "";

    suggestedCategory = "";
    $("categorySuggestion").classList.add("hidden");
    rateUI(true);
    preview();
    duplicateCheck();

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
    const start = $("startDate").value, end = $("endDate").value;
    if (!validDates(start, end)) return toast("End date must be after start date");
    const destination = canonicalDestination("destination");
    if (!destination) return;

    const ownerName = $("ownerName").value.trim() || "Me";
    state = {
      trip: {
        name: $("tripName").value.trim(),
        destination,
        startDate: start,
        endDate: end,
        budget: num($("budget").value),
        homeCurrency: $("homeCurrency").value,
        tripCurrency: $("tripCurrency").value,
        defaultPayment: "Credit Card",
        createdAt: Date.now()
      },
      expenses: [],
      rates: {},
      people: [makePerson(ownerName)]
    };

    save();
    render();
    page("dashboard");
    toast("Trip created");
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

    const index = state.expenses.findIndex(y => y.id === x.id);
    if (index >= 0) {
      x.createdAt = state.expenses[index].createdAt;
      state.expenses[index] = x;
    } else {
      state.expenses.push(x);
    }

    if (currency !== state.trip.homeCurrency) state.rates[rateKey(currency)] = rate;

    save();
    closeModal();
    render();
    toast(index >= 0 ? "Expense updated" : "Expense saved");
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
      JSON.stringify({ app: "TripSpend", version: 4, exportedAt: new Date().toISOString(), data: state }, null, 2),
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
      "Home Amount", "Home Currency", "Assigned To", "Traveler Shares"
    ];

    const rows = state.expenses.slice().sort(sortNew).map(e => {
      const shares = e.personShares || [];
      const assigned = expenseAssignmentText(e);
      const detail = shares.map(s => `${personName(s.personId)}: ${money(s.amount, state.trip.homeCurrency)}`).join(" | ");
      return [
        e.date, e.category, e.note, e.paymentMethod,
        e.amount, e.currency, e.rate, e.homeAmount, state.trip.homeCurrency,
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

      state = normalizeState(data);
      save();
      render();
      page("dashboard");
      toast("Backup imported");
    } catch {
      alert("That file is not a valid TripSpend backup.");
    } finally {
      $("importFile").value = "";
    }
  }

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

  $("deleteTrip").onclick = () => {
    if (state.trip && confirm(`Delete “${state.trip.name}” and all expenses?`)) {
      state = blank();
      localStorage.removeItem(KEY);
      render();
      $("setupForm").reset();
      initDates();
      $("ownerName").value = "Me";
      setDestinationValue("destination", "Thailand");
      opts($("homeCurrency"), CURS, "OMR");
      opts($("tripCurrency"), CURS, "THB");
      toast("Trip deleted");
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
  $("filterCategory").onchange = renderExpenseViews;
  $("filterPayment").onchange = renderExpenseViews;
  $("filterPerson").onchange = renderExpenseViews;

  $("seeAll").onclick = () => page("expenses");
  $("settingsShortcut").onclick = () => page("settings");
  $("managePeople").onclick = () => page("people");
  $("settingsPeople").onclick = () => page("people");
  $("peopleDone").onclick = () => page("dashboard");

  document.querySelectorAll(".nav-btn").forEach(button => {
    button.onclick = () => page(button.dataset.page);
  });

  document.onkeydown = e => {
    if (e.key === "Escape" && !$("modal").classList.contains("hidden")) closeModal();
  };

  window.addEventListener("beforeinstallprompt", e => {
    e.preventDefault();
    installPrompt = e;
    $("installBtn").disabled = false;
  });

  $("installBtn").onclick = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      await installPrompt.userChoice;
      installPrompt = null;
    } else {
      const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
      $("installHelp").textContent = ios
        ? "On iPhone: open TripSpend in Safari → Share → Add to Home Screen."
        : "Use your browser menu and choose Install app or Add to Home screen.";
      $("installHelp").classList.remove("hidden");
    }
  };

  function initDates() {
    const t = today();
    $("startDate").value = t;
    const d = new Date();
    d.setDate(d.getDate() + 6);
    $("endDate").value = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  }

  initDestinationAutocomplete("destination", "destinationOptions", "Thailand");
  initDestinationAutocomplete("sDestination", "sDestinationOptions", "Thailand");
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

  initDates();
  render();

  if ("serviceWorker" in navigator) {
    addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
  }
})();
