(() => {
  "use strict";

  const APP_RELEASE = "7.0.6";
  const FIRST_LOAD_RUNTIME = "tripspend:first-load-runtime";
  const APP_KEY = "tripspend.v1";
  const FX_KEY = "tripspend.fxcache.v1";
  const API = "https://api.frankfurter.dev/v2/rate";
  const CURS = ["OMR","AED","SAR","QAR","KWD","BHD","USD","EUR","GBP","THB","IDR","JPY","MYR","SGD","INR","TRY","CHF","AUD","CAD","NZD","CNY","KRW","PHP","VND"];
  const $ = id => document.getElementById(id);
  let conversionRequestId = 0;
  let pageSyncQueued = false;
  let firstLoadBootStarted = false;
  let firstLoadReloadQueued = false;

  function appState() {
    try { return JSON.parse(localStorage.getItem(APP_KEY) || "{}"); }
    catch { return {}; }
  }

  function fxCache() {
    try {
      const x = JSON.parse(localStorage.getItem(FX_KEY) || "{}");
      return x && typeof x === "object" ? x : {};
    } catch { return {}; }
  }

  function saveCache(cache) {
    try { localStorage.setItem(FX_KEY, JSON.stringify(cache)); }
    catch {}
  }

  function pairKey(from, to) {
    return `${from}->${to}`;
  }

  function rateDecimals(rate) {
    const n = Number(rate);
    if (!Number.isFinite(n)) return "—";
    if (n >= 100) return n.toFixed(2);
    if (n >= 10) return n.toFixed(3);
    if (n >= 1) return n.toFixed(4);
    return n.toFixed(6);
  }

  function amountDecimals(currency) {
    return ["OMR","KWD","BHD"].includes(currency) ? 3 : 2;
  }

  function formatAmount(value, currency) {
    const n = Number(value);
    if (!Number.isFinite(n)) return "—";
    return `${n.toLocaleString(undefined, {
      minimumFractionDigits: amountDecimals(currency),
      maximumFractionDigits: amountDecimals(currency)
    })} ${currency}`;
  }

  function fillSelect(el, selected) {
    if (!el) return;
    el.replaceChildren();
    CURS.forEach(code => {
      const o = document.createElement("option");
      o.value = code;
      o.textContent = code;
      o.selected = code === selected;
      el.appendChild(o);
    });
  }

  function saved(from, to) {
    return fxCache()[pairKey(from, to)] || null;
  }

  function store(from, to, rate, date) {
    const cache = fxCache();
    cache[pairKey(from, to)] = {
      from, to,
      rate: Number(rate),
      date: date || new Date().toISOString().slice(0, 10),
      fetchedAt: Date.now()
    };
    saveCache(cache);
    return cache[pairKey(from, to)];
  }

  async function fetchRate(from, to, { allowCache = true } = {}) {
    if (!from || !to) throw new Error("Choose two currencies.");

    if (from === to) {
      return { from, to, rate: 1, date: new Date().toISOString().slice(0,10), source: "same" };
    }

    if (navigator.onLine) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      try {
        const response = await fetch(`${API}/${encodeURIComponent(from)}/${encodeURIComponent(to)}`, {
          headers: { "Accept": "application/json" },
          signal: controller.signal,
          cache: "no-store"
        });
        if (!response.ok) throw new Error(`Rate service returned ${response.status}`);
        const data = await response.json();
        const rate = Number(data.rate);
        if (!Number.isFinite(rate) || rate <= 0) throw new Error("Invalid exchange rate");

        const item = store(from, to, rate, data.date);
        return { ...item, source: "live" };
      } catch (error) {
        if (!allowCache) throw error;
      } finally {
        clearTimeout(timer);
      }
    }

    if (allowCache) {
      const cached = saved(from, to);
      if (cached && Number(cached.rate) > 0) return { ...cached, source: "cache" };
    }

    throw new Error(navigator.onLine
      ? "Could not retrieve a rate and no saved offline rate is available."
      : "You are offline and there is no saved rate for this currency pair yet.");
  }

  function fxCardVisible() {
    const card = document.querySelector(".settings-fx-card");
    if (!card) return false;
    if (document.querySelector(".page.active")?.id !== "settings") return false;

    // The FX card lives inside the collapsed Advanced & data section. Some
    // browsers still report layout boxes for descendants of a closed details
    // element, so explicitly require every containing <details> to be open
    // before any background rate request is allowed.
    for (let parent = card.parentElement; parent; parent = parent.parentElement) {
      if (parent.tagName === "DETAILS" && !parent.open) return false;
    }

    const style = getComputedStyle(card);
    return style.display !== "none" && style.visibility !== "hidden" && card.getClientRects().length > 0;
  }

  function setNetworkBadge() {
    const badge = $("networkBadge");
    if (!badge) return;
    const online = navigator.onLine;
    badge.textContent = online ? "ONLINE" : "OFFLINE";
    badge.classList.toggle("online-badge", online);
    badge.classList.toggle("offline-badge", !online);
  }

  function syncTripCurrencies(force = false) {
    const trip = appState().trip;
    if (!trip || !$("fxFrom") || !$("fxTo")) return;

    const initialized = $("fxFrom").dataset.ready === "1";
    if (!initialized || force) {
      fillSelect($("fxFrom"), trip.homeCurrency || "OMR");
      fillSelect($("fxTo"), trip.tripCurrency || "THB");
      $("fxFrom").dataset.ready = "1";
      $("fxTo").dataset.ready = "1";
    }
  }

  async function convertSection(forceNetwork = false) {
    const amountEl = $("fxAmount");
    if (!amountEl || !fxCardVisible()) return;

    const amount = Number(amountEl.value || 0);
    const from = $("fxFrom")?.value;
    const to = $("fxTo")?.value;
    const status = $("fxStatus");
    if (!from || !to || !status) return;
    const requestId = ++conversionRequestId;

    if (!(amount >= 0)) return;

    const cached = saved(from, to);
    const sixHours = 6 * 60 * 60 * 1000;
    const cacheIsRecent = cached?.fetchedAt && (Date.now() - Number(cached.fetchedAt) < sixHours);

    let info = null;

    try {
      if (!forceNetwork && cached && (!navigator.onLine || cacheIsRecent)) {
        info = { ...cached, source: "cache" };
      } else {
        status.className = "fx-status";
        status.textContent = navigator.onLine
          ? "Getting the latest available reference rate…"
          : "Offline — checking saved rates…";
        info = await fetchRate(from, to, { allowCache: true });
      }

      if (requestId !== conversionRequestId || $("fxFrom")?.value !== from || $("fxTo")?.value !== to) return;

      const currentAmount = Number(amountEl.value || 0);
      $("fxRateValue").textContent = `1 ${from} = ${rateDecimals(info.rate)} ${to}`;
      $("fxConverted").textContent = formatAmount(currentAmount * Number(info.rate), to);

      if (info.source === "live") {
        status.className = "fx-status good";
        status.textContent = `Latest available reference rate • rate date ${info.date}. Saved for offline use.`;
      } else if (info.source === "cache") {
        status.className = navigator.onLine ? "fx-status" : "fx-status warn";
        const when = info.fetchedAt ? new Date(info.fetchedAt).toLocaleString() : "earlier";
        status.textContent = navigator.onLine
          ? `Saved rate • last refreshed ${when}${info.date ? ` • rate date ${info.date}` : ""}. Tap Refresh Rate for a new check.`
          : `Offline/cached rate • saved ${when}${info.date ? ` (${info.date})` : ""}.`;
      } else {
        status.className = "fx-status good";
        status.textContent = "Same currency — no exchange rate needed.";
      }
    } catch (err) {
      if (requestId !== conversionRequestId) return;
      $("fxRateValue").textContent = "—";
      $("fxConverted").textContent = "—";
      status.className = "fx-status bad";
      status.textContent = err?.message || "Exchange rate unavailable.";
    }
  }

  async function useRateInExpense() {
    const trip = appState().trip;
    const currencyEl = $("expenseCurrency");
    const rateEl = $("exchangeRate");
    const status = $("liveRateStatus");
    if (!trip || !currencyEl || !rateEl || !status) return;

    const from = trip.homeCurrency;
    const to = currencyEl.value;

    if (from === to) {
      rateEl.value = "1";
      status.textContent = "Home currency selected — no conversion needed.";
      rateEl.dispatchEvent(new Event("input", { bubbles: true }));
      return;
    }

    status.textContent = navigator.onLine ? "Getting latest rate…" : "Offline — looking for a saved rate…";
    try {
      const info = await fetchRate(from, to);
      rateEl.value = Number(info.rate).toPrecision(8).replace(/0+$/,"").replace(/\.$/,"");
      rateEl.dispatchEvent(new Event("input", { bubbles: true }));
      if (info.source === "live") {
        status.textContent = `Latest available rate loaded (${info.date}) and saved for offline use.`;
      } else {
        status.textContent = `Using your saved offline rate${info.date ? ` (${info.date})` : ""}.`;
      }
    } catch (err) {
      status.textContent = err?.message || "No exchange rate is available.";
    }
  }

  function refreshVisibleFx({ forceNetwork = false, forceCurrencies = false } = {}) {
    if (!fxCardVisible()) return;
    syncTripCurrencies(forceCurrencies);
    setNetworkBadge();
    convertSection(forceNetwork);
  }

  function queueVisibleRefresh(options = {}) {
    if (pageSyncQueued) return;
    pageSyncQueued = true;
    requestAnimationFrame(() => {
      pageSyncQueued = false;
      refreshVisibleFx(options);
    });
  }

  function reloadWhenControlled() {
    if (firstLoadReloadQueued || !navigator.serviceWorker?.controller) return;
    firstLoadReloadQueued = true;
    window.setTimeout(() => location.reload(), 120);
  }

  function bootstrapFirstVisitRuntime() {
    if (firstLoadBootStarted || navigator.serviceWorker?.controller || appState()?.trip) return;
    firstLoadBootStarted = true;

    document.querySelectorAll(".version-badge").forEach(el => { el.textContent = `v${APP_RELEASE}`; });
    window.dispatchEvent(new CustomEvent(FIRST_LOAD_RUNTIME, { detail:{ version:APP_RELEASE, mode:"worker-reload" } }));
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.addEventListener("controllerchange", reloadWhenControlled, { once:true });
    navigator.serviceWorker.ready.then(reloadWhenControlled).catch(()=>{});
  }

  function wire() {
    if (!$("fxFrom")) return;

    syncTripCurrencies(true);
    setNetworkBadge();

    $("fxAmount")?.addEventListener("input", () => convertSection(false));
    $("fxFrom")?.addEventListener("change", () => convertSection(false));
    $("fxTo")?.addEventListener("change", () => convertSection(false));

    $("fxSwap")?.addEventListener("click", () => {
      const a = $("fxFrom").value;
      $("fxFrom").value = $("fxTo").value;
      $("fxTo").value = a;
      convertSection(false);
    });

    $("fxRefresh")?.addEventListener("click", () => convertSection(true));
    $("useLiveRate")?.addEventListener("click", useRateInExpense);

    window.addEventListener("online", () => {
      setNetworkBadge();
      if (fxCardVisible()) convertSection(true);
    });
    window.addEventListener("offline", () => {
      setNetworkBadge();
      if (fxCardVisible()) convertSection(false);
    });

    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && fxCardVisible()) queueVisibleRefresh();
    });

    window.addEventListener("tripspend:page", () => queueVisibleRefresh({ forceCurrencies:true }));
    window.addEventListener("tripspend:render", () => queueVisibleRefresh());

    document.addEventListener("click", event => {
      if (!event.target?.closest?.("#settingsAdvanced > summary")) return;
      window.setTimeout(() => queueVisibleRefresh({ forceCurrencies:true }), 0);
    });

    queueVisibleRefresh();
  }

  window.TripSpendFX = {
    version:APP_RELEASE,
    fetchRate,
    saved,
    refresh: () => refreshVisibleFx({ forceNetwork:true, forceCurrencies:true }),
    visible: fxCardVisible,
    bootstrapFirstVisitRuntime
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      wire();
      bootstrapFirstVisitRuntime();
    }, { once:true });
  } else {
    wire();
    bootstrapFirstVisitRuntime();
  }
})();
