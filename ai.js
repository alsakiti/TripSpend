(() => {
  "use strict";

  const STORAGE_KEY = "tripspend.ai.provider";
  const DEFAULT_PROVIDER = "openai";
  const MAX_HISTORY = 8;
  const PROVIDERS = {
    openai: { label: "OpenAI", short: "GPT" },
    anthropic: { label: "Anthropic", short: "Claude" },
    gemini: { label: "Google", short: "Gemini" }
  };

  const $ = id => document.getElementById(id);
  const core = window.TripSpendCore;
  let config = { endpoint: "", enabledProviders: Object.keys(PROVIDERS) };
  let chatHistory = [];
  let requestController = null;

  function provider() {
    const saved = localStorage.getItem(STORAGE_KEY);
    return PROVIDERS[saved] ? saved : DEFAULT_PROVIDER;
  }

  function setProvider(value) {
    const next = PROVIDERS[value] ? value : DEFAULT_PROVIDER;
    localStorage.setItem(STORAGE_KEY, next);
    const select = $("tripAiProvider");
    if (select && select.value !== next) select.value = next;
    updateProviderLabels();
  }

  function enabledProviders() {
    const enabled = Array.isArray(config.enabledProviders) ? config.enabledProviders : Object.keys(PROVIDERS);
    return enabled.filter(key => PROVIDERS[key]);
  }

  async function loadConfig() {
    try {
      const response = await fetch(`./ai-config.json?t=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) return config;
      const next = await response.json();
      if (next && typeof next === "object") {
        config = {
          endpoint: String(next.endpoint || "").trim(),
          enabledProviders: Array.isArray(next.enabledProviders) ? next.enabledProviders : Object.keys(PROVIDERS)
        };
      }
    } catch {}
    refreshProviderOptions();
    updateServiceStatus();
    return config;
  }

  function personName(state, id) {
    return state.people?.find(person => person.id === id)?.name || "Unknown";
  }

  function stopName(state, id) {
    return state.stops?.find(stop => stop.id === id)?.country || state.trip?.destination || "Unknown";
  }

  function cleanText(value, max = 240) {
    return String(value || "").trim().slice(0, max);
  }

  function buildTripContext() {
    const state = core?.getState?.();
    if (!state?.trip) return { today: new Date().toISOString().slice(0, 10), trip: null };

    const trip = state.trip;
    const people = Array.isArray(state.people) ? state.people : [];
    const stops = Array.isArray(state.stops) ? state.stops : [];
    const expenses = Array.isArray(state.expenses) ? state.expenses : [];
    const plans = Array.isArray(state.plans) ? state.plans : [];
    const itinerary = Array.isArray(state.itinerary) ? state.itinerary : [];
    const settlements = Array.isArray(state.settlements) ? state.settlements : [];

    return {
      today: new Date().toISOString().slice(0, 10),
      trip: {
        name: cleanText(trip.name, 80),
        destination: cleanText(trip.destination, 80),
        startDate: trip.startDate || "",
        endDate: trip.endDate || "",
        budget: Number(trip.budget || 0),
        homeCurrency: trip.homeCurrency || "",
        tripCurrency: trip.tripCurrency || ""
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
      expenses: expenses.slice(-300).map(expense => ({
        date: expense.date || "",
        country: stopName(state, expense.stopId),
        category: cleanText(expense.category, 60),
        expenseType: expense.expenseType || "",
        amount: Number(expense.amount || 0),
        currency: expense.currency || "",
        homeAmount: Number(expense.homeAmount || 0),
        paymentMethod: cleanText(expense.paymentMethod, 60),
        paidBy: personName(state, expense.paidByPersonId),
        note: cleanText(expense.note, 140)
      })),
      upcomingCosts: plans.slice(-200).map(plan => ({
        title: cleanText(plan.title, 100),
        date: plan.date || "",
        country: stopName(state, plan.stopId),
        category: cleanText(plan.category, 60),
        amount: Number(plan.homeAmount || 0),
        status: plan.status || "",
        note: cleanText(plan.note, 140)
      })),
      itinerary: itinerary.slice(-200).map(item => ({
        title: cleanText(item.title, 100),
        type: cleanText(item.type, 40),
        date: item.date || "",
        time: item.time || "",
        country: stopName(state, item.stopId),
        location: cleanText(item.location, 140),
        bookingRef: cleanText(item.bookingRef, 100),
        status: item.status || "",
        estimatedCost: Number(item.homeAmount || 0),
        note: cleanText(item.note, 240)
      })),
      settlements: settlements.slice(-150).map(item => ({
        from: personName(state, item.fromPersonId),
        to: personName(state, item.toPersonId),
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
      .dashboard-welcome-mark.trip-ai-ready:focus-visible{outline:3px solid color-mix(in srgb,var(--brand) 30%,transparent);outline-offset:3px}
      .trip-ai-settings-card{padding:16px;margin-top:12px}
      .trip-ai-settings-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
      .trip-ai-settings-head strong,.trip-ai-settings-head p{display:block}.trip-ai-settings-head p{margin:4px 0 0;color:var(--muted);font-size:12px;line-height:1.45}
      .trip-ai-provider-row{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;margin-top:14px}
      .trip-ai-provider-row label{font-size:12px;font-weight:800;color:var(--muted)}
      .trip-ai-provider-row select{width:100%;min-height:44px;margin-top:6px;border:1px solid var(--line);border-radius:13px;background:var(--surface);color:var(--text);padding:0 12px}
      .trip-ai-status{display:inline-flex;align-items:center;gap:6px;padding:6px 9px;border-radius:999px;background:var(--surface2);color:var(--muted);font-size:10px;font-weight:850;white-space:nowrap}
      .trip-ai-status.ready{background:var(--okbg);color:var(--ok)}
      .trip-ai-sheet{display:flex;flex-direction:column;max-height:min(92vh,780px);padding-bottom:max(12px,env(safe-area-inset-bottom))}
      .trip-ai-head-copy{display:flex;align-items:center;gap:10px}.trip-ai-orb{width:38px;height:38px;border-radius:14px;display:grid;place-items:center;background:linear-gradient(145deg,#eef7ff,#fff);color:#1677ff;border:1px solid #d8e9ff;font-size:19px;box-shadow:0 8px 20px rgba(22,119,255,.1)}
      .trip-ai-provider-pill{display:inline-flex;margin-top:4px;padding:4px 8px;border-radius:999px;background:var(--surface2);color:var(--muted);font-size:10px;font-weight:800}
      .trip-ai-privacy{margin:8px 0 10px;padding:9px 11px;border-radius:13px;background:var(--surface2);color:var(--muted);font-size:11px;line-height:1.45}
      .trip-ai-suggestions{display:flex;gap:7px;overflow-x:auto;padding:2px 0 10px;scrollbar-width:none}.trip-ai-suggestions::-webkit-scrollbar{display:none}
      .trip-ai-suggestion{flex:0 0 auto;border:1px solid var(--line);border-radius:999px;background:var(--surface);color:var(--text);padding:8px 11px;font-size:11px;font-weight:750}
      .trip-ai-messages{min-height:180px;max-height:48vh;overflow:auto;display:flex;flex-direction:column;gap:9px;padding:8px 2px 12px}
      .trip-ai-message{max-width:88%;padding:10px 12px;border-radius:16px;font-size:13px;line-height:1.48;white-space:pre-wrap;overflow-wrap:anywhere}
      .trip-ai-message.user{align-self:flex-end;background:var(--brand);color:#fff;border-bottom-right-radius:6px}
      .trip-ai-message.assistant{align-self:flex-start;background:var(--surface2);color:var(--text);border-bottom-left-radius:6px}
      .trip-ai-message.system{align-self:center;max-width:100%;padding:7px 10px;background:transparent;color:var(--muted);font-size:11px;text-align:center}
      .trip-ai-compose{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;border-top:1px solid var(--line);padding-top:10px}
      .trip-ai-compose textarea{resize:none;min-height:46px;max-height:110px;border:1px solid var(--line);border-radius:15px;background:var(--surface);color:var(--text);padding:11px 12px;outline:none;font:inherit;font-size:13px}
      .trip-ai-compose textarea:focus{border-color:#98a2b3;box-shadow:0 0 0 4px rgba(152,162,179,.14)}
      .trip-ai-send{width:48px;min-height:46px;border:0;border-radius:15px;background:var(--brand);color:#fff;font-size:18px;font-weight:900}.trip-ai-send:disabled{opacity:.45}
      html[data-theme="dark"] .trip-ai-orb{background:#172844;border-color:#274a78;color:#79b9ff}
      @media(max-width:480px){.trip-ai-sheet{max-height:94vh}.trip-ai-messages{max-height:50vh}.trip-ai-message{max-width:92%}}
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
          <div class="trip-ai-head-copy">
            <span class="trip-ai-orb" aria-hidden="true">✦</span>
            <div><div class="eyebrow">TRIPSPEND AI</div><h2 id="tripAiTitle">Ask TripSpend</h2><span id="tripAiProviderPill" class="trip-ai-provider-pill">GPT</span></div>
          </div>
          <button id="tripAiClose" class="icon-btn" type="button" aria-label="Close TripSpend AI">✕</button>
        </div>
        <div class="trip-ai-privacy">Read-only assistant. It can analyze this trip's expenses, budgets and plans. Receipt images, backups and past trips are not sent.</div>
        <div class="trip-ai-suggestions" aria-label="Suggested questions">
          <button class="trip-ai-suggestion" type="button">How am I doing?</button>
          <button class="trip-ai-suggestion" type="button">What is my plan tomorrow?</button>
          <button class="trip-ai-suggestion" type="button">Where am I spending most?</button>
          <button class="trip-ai-suggestion" type="button">Can I afford 50 OMR today?</button>
        </div>
        <div id="tripAiMessages" class="trip-ai-messages" aria-live="polite"></div>
        <form id="tripAiForm" class="trip-ai-compose">
          <textarea id="tripAiInput" rows="1" maxlength="800" placeholder="Ask about your trip…" aria-label="Ask TripSpend AI"></textarea>
          <button id="tripAiSend" class="trip-ai-send" type="submit" aria-label="Send question">↑</button>
        </form>
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
    modal.querySelectorAll(".trip-ai-suggestion").forEach(button => {
      button.addEventListener("click", () => ask(button.textContent.trim()));
    });
  }

  function injectSettings() {
    if ($("tripAiSettingsCard")) return;
    const appearance = document.querySelector("#settings .appearance-card");
    if (!appearance) return;

    const card = document.createElement("div");
    card.id = "tripAiSettingsCard";
    card.className = "card trip-ai-settings-card";
    card.innerHTML = `
      <div class="trip-ai-settings-head">
        <div><strong>TripSpend AI</strong><p>Choose the AI used when you tap ✦. TripSpend sends only the current trip data needed to answer your question.</p></div>
        <span id="tripAiServiceStatus" class="trip-ai-status">SETUP</span>
      </div>
      <div class="trip-ai-provider-row">
        <label>AI provider<select id="tripAiProvider"></select></label>
      </div>`;
    appearance.insertAdjacentElement("afterend", card);

    refreshProviderOptions();
    $("tripAiProvider")?.addEventListener("change", event => setProvider(event.target.value));
    updateServiceStatus();
  }

  function refreshProviderOptions() {
    const select = $("tripAiProvider");
    if (!select) return;
    const current = provider();
    const enabled = enabledProviders();
    select.replaceChildren();
    enabled.forEach(key => {
      const option = document.createElement("option");
      option.value = key;
      option.textContent = PROVIDERS[key].label + " • " + PROVIDERS[key].short;
      select.appendChild(option);
    });
    if (enabled.includes(current)) select.value = current;
    else if (enabled[0]) setProvider(enabled[0]);
    updateProviderLabels();
  }

  function updateProviderLabels() {
    const details = PROVIDERS[provider()] || PROVIDERS.openai;
    if ($("tripAiProviderPill")) $("tripAiProviderPill").textContent = details.short;
  }

  function updateServiceStatus() {
    const status = $("tripAiServiceStatus");
    if (!status) return;
    if (config.endpoint) {
      status.textContent = "READY";
      status.className = "trip-ai-status ready";
    } else {
      status.textContent = "SETUP";
      status.className = "trip-ai-status";
    }
  }

  function prepareTrigger() {
    const trigger = document.querySelector(".dashboard-welcome-mark");
    if (!trigger || trigger.dataset.tripAiReady === "1") return;
    trigger.dataset.tripAiReady = "1";
    trigger.classList.add("trip-ai-ready");
    trigger.setAttribute("role", "button");
    trigger.setAttribute("tabindex", "0");
    trigger.setAttribute("aria-label", "Ask TripSpend AI");
    trigger.setAttribute("title", "Ask TripSpend AI");
    trigger.removeAttribute("aria-hidden");
    trigger.addEventListener("click", openAi);
    trigger.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openAi();
      }
    });
  }

  function addMessage(role, text) {
    const container = $("tripAiMessages");
    if (!container) return null;
    const message = document.createElement("div");
    message.className = `trip-ai-message ${role}`;
    message.textContent = text;
    container.appendChild(message);
    container.scrollTop = container.scrollHeight;
    return message;
  }

  async function openAi() {
    injectModal();
    await loadConfig();
    updateProviderLabels();
    $("tripAiModal")?.classList.remove("hidden");
    if (!$("tripAiMessages")?.children.length) {
      addMessage("assistant", "Hi — I can answer questions about your current TripSpend trip, budget, expenses and plans.");
    }
    setTimeout(() => $("tripAiInput")?.focus(), 60);
  }

  function closeAi() {
    requestController?.abort();
    requestController = null;
    $("tripAiModal")?.classList.add("hidden");
  }

  async function ask(question) {
    if (!question) return;
    addMessage("user", question);

    if (!navigator.onLine) {
      addMessage("system", "TripSpend AI needs an internet connection.");
      return;
    }

    await loadConfig();
    if (!config.endpoint) {
      addMessage("assistant", "TripSpend AI is built into this version, but its secure AI service has not been connected yet. Once the server endpoint is configured, this button will work without storing an API key in the app.");
      return;
    }

    const send = $("tripAiSend");
    if (send) send.disabled = true;
    const pending = addMessage("system", `${PROVIDERS[provider()]?.short || "AI"} is thinking…`);
    requestController?.abort();
    requestController = new AbortController();
    const timer = setTimeout(() => requestController?.abort(), 35000);

    try {
      const history = chatHistory.slice(-MAX_HISTORY);
      const response = await fetch(config.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: requestController.signal,
        body: JSON.stringify({
          provider: provider(),
          question,
          history,
          context: buildTripContext()
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || `AI service returned ${response.status}`);
      const answer = String(data.answer || "").trim();
      if (!answer) throw new Error("The AI returned an empty answer.");
      pending?.remove();
      addMessage("assistant", answer);
      chatHistory.push({ role: "user", content: question }, { role: "assistant", content: answer });
      chatHistory = chatHistory.slice(-MAX_HISTORY);
    } catch (error) {
      pending?.remove();
      const text = error?.name === "AbortError"
        ? "The AI request took too long. Please try again."
        : (error?.message || "TripSpend AI is unavailable right now.");
      addMessage("assistant", text);
    } finally {
      clearTimeout(timer);
      requestController = null;
      if (send) send.disabled = false;
    }
  }

  function boot() {
    injectStyles();
    injectModal();
    injectSettings();
    prepareTrigger();
    loadConfig();

    const observer = new MutationObserver(() => {
      prepareTrigger();
      injectSettings();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && !$("tripAiModal")?.classList.contains("hidden")) closeAi();
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
