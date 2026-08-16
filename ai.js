(() => {
  "use strict";

  const ENDPOINT_FALLBACK = "https://tripspend-ai.alsukaiti1998.workers.dev";
  const PROVIDER = { key: "cloudflare", label: "Cloudflare AI", short: "GLM-4.7 Flash" };
  const MAX_HISTORY = 8;
  const $ = id => document.getElementById(id);
  const core = window.TripSpendCore;

  let endpoint = ENDPOINT_FALLBACK;
  let chatHistory = [];
  let requestController = null;

  function cleanText(value, max = 240) {
    return String(value || "").trim().slice(0, max);
  }

  function localDateString(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function personName(state, id) {
    return state.people?.find(person => person.id === id)?.name || "Unknown";
  }

  function stopName(state, id) {
    return state.stops?.find(stop => stop.id === id)?.country || state.trip?.destination || "Unknown";
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
    updateServiceStatus();
  }

  function buildTripContext() {
    const state = core?.getState?.();
    if (!state?.trip) return { today: localDateString(), trip: null };

    const trip = state.trip;
    const people = Array.isArray(state.people) ? state.people : [];
    const stops = Array.isArray(state.stops) ? state.stops : [];
    const expenses = Array.isArray(state.expenses) ? state.expenses : [];
    const plans = Array.isArray(state.plans) ? state.plans : [];
    const itinerary = Array.isArray(state.itinerary) ? state.itinerary : [];
    const settlements = Array.isArray(state.settlements) ? state.settlements : [];

    return {
      today: localDateString(),
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
        country: cleanText(stop.country, 80),
        startDate: stop.startDate || "",
        endDate: stop.endDate || "",
        currency: stop.currency || "",
        budget: Number(stop.budget || 0)
      })),
      travelers: people.filter(person => person?.active !== false).map(person => ({
        name: cleanText(person.name, 60)
      })),
      expenses: expenses.slice(-250).map(expense => ({
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
      upcomingCosts: plans.slice(-150).map(plan => ({
        title: cleanText(plan.title, 100),
        date: plan.date || "",
        country: stopName(state, plan.stopId),
        category: cleanText(plan.category, 60),
        amount: Number(plan.homeAmount || 0),
        status: plan.status || "",
        note: cleanText(plan.note, 140)
      })),
      itinerary: itinerary.slice(-150).map(item => ({
        title: cleanText(item.title, 100),
        type: cleanText(item.type, 40),
        date: item.date || "",
        time: item.time || "",
        country: stopName(state, item.stopId),
        location: cleanText(item.location, 140),
        bookingRef: cleanText(item.bookingRef, 100),
        status: item.status || "",
        estimatedCost: Number(item.homeAmount || 0),
        note: cleanText(item.note, 220)
      })),
      settlements: settlements.slice(-120).map(item => ({
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
      .dashboard-welcome-mark.trip-ai-ready:focus-visible{outline:3px solid rgba(22,119,255,.28);outline-offset:3px}
      .trip-ai-settings-card{padding:16px;margin-top:12px}.trip-ai-settings-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
      .trip-ai-settings-head p{margin:4px 0 0;color:var(--muted);font-size:12px;line-height:1.45}.trip-ai-status{display:inline-flex;padding:6px 9px;border-radius:999px;background:var(--surface2);color:var(--muted);font-size:10px;font-weight:850;white-space:nowrap}.trip-ai-status.ready{background:var(--okbg);color:var(--ok)}
      .trip-ai-provider-line{margin-top:12px;padding:10px 12px;border-radius:13px;background:var(--surface2);display:flex;justify-content:space-between;gap:10px;align-items:center}.trip-ai-provider-line small{color:var(--muted)}
      .trip-ai-sheet{display:flex;flex-direction:column;max-height:min(92vh,780px);padding-bottom:max(12px,env(safe-area-inset-bottom))}.trip-ai-head-copy{display:flex;align-items:center;gap:10px}.trip-ai-orb{width:38px;height:38px;border-radius:14px;display:grid;place-items:center;background:linear-gradient(145deg,#eef7ff,#fff);color:#1677ff;border:1px solid #d8e9ff;font-size:19px;box-shadow:0 8px 20px rgba(22,119,255,.1)}
      .trip-ai-provider-pill{display:inline-flex;margin-top:4px;padding:4px 8px;border-radius:999px;background:var(--surface2);color:var(--muted);font-size:10px;font-weight:800}.trip-ai-privacy{margin:8px 0 10px;padding:9px 11px;border-radius:13px;background:var(--surface2);color:var(--muted);font-size:11px;line-height:1.45}
      .trip-ai-suggestions{display:flex;gap:7px;overflow-x:auto;padding:2px 0 10px;scrollbar-width:none}.trip-ai-suggestions::-webkit-scrollbar{display:none}.trip-ai-suggestion{flex:0 0 auto;border:1px solid var(--line);border-radius:999px;background:var(--surface);color:var(--text);padding:8px 11px;font-size:11px;font-weight:750}
      .trip-ai-messages{min-height:180px;max-height:48vh;overflow:auto;display:flex;flex-direction:column;gap:9px;padding:8px 2px 12px}.trip-ai-message{max-width:88%;padding:10px 12px;border-radius:16px;font-size:13px;line-height:1.48;white-space:pre-wrap;overflow-wrap:anywhere}.trip-ai-message.user{align-self:flex-end;background:var(--brand);color:#fff;border-bottom-right-radius:6px}.trip-ai-message.assistant{align-self:flex-start;background:var(--surface2);color:var(--text);border-bottom-left-radius:6px}.trip-ai-message.system{align-self:center;max-width:100%;padding:7px 10px;background:transparent;color:var(--muted);font-size:11px;text-align:center}
      .trip-ai-compose{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;border-top:1px solid var(--line);padding-top:10px}.trip-ai-compose textarea{resize:none;min-height:46px;max-height:110px;border:1px solid var(--line);border-radius:15px;background:var(--surface);color:var(--text);padding:11px 12px;outline:none;font:inherit;font-size:13px}.trip-ai-send{width:48px;min-height:46px;border:0;border-radius:15px;background:var(--brand);color:#fff;font-size:18px;font-weight:900}.trip-ai-send:disabled{opacity:.45}
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
        <div class="trip-ai-privacy">Read-only assistant. It can analyze this trip's expenses, budgets and plans. Receipt images, backups and past trips are not sent.</div>
        <div class="trip-ai-suggestions" aria-label="Suggested questions">
          <button class="trip-ai-suggestion" type="button">How am I doing?</button><button class="trip-ai-suggestion" type="button">What is my plan tomorrow?</button><button class="trip-ai-suggestion" type="button">Where am I spending most?</button><button class="trip-ai-suggestion" type="button">Can I afford 50 OMR today?</button>
        </div>
        <div id="tripAiMessages" class="trip-ai-messages" aria-live="polite"></div>
        <form id="tripAiForm" class="trip-ai-compose"><textarea id="tripAiInput" rows="1" maxlength="800" placeholder="Ask about your trip…" aria-label="Ask TripSpend AI"></textarea><button id="tripAiSend" class="trip-ai-send" type="submit" aria-label="Send question">↑</button></form>
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
    card.innerHTML = `<div class="trip-ai-settings-head"><div><strong>TripSpend AI</strong><p>Ask questions about the current trip. This beta is read-only and uses Cloudflare Workers AI.</p></div><span id="tripAiServiceStatus" class="trip-ai-status">CHECKING</span></div><div class="trip-ai-provider-line"><span><strong>${PROVIDER.label}</strong><br><small>${PROVIDER.short}</small></span><small>Free beta</small></div>`;
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

  function openAi() {
    const modal = $("tripAiModal");
    if (!modal) return;
    modal.classList.remove("hidden");
    if (!$("tripAiMessages")?.children.length) addMessage("system", "Ask me about this trip's budget, spending or plans.");
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
    badge.textContent = endpoint ? "READY" : "SETUP";
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
          history: chatHistory.slice(0, -1)
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || `AI request failed (${response.status})`);
      const answer = cleanText(data?.answer, 5000) || "I couldn't produce an answer for that question.";
      if (waiting) waiting.textContent = answer;
      chatHistory.push({ role: "assistant", content: answer });
      chatHistory = chatHistory.slice(-MAX_HISTORY);
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
