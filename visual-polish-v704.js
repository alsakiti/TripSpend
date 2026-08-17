(() => {
  "use strict";

  const RELEASE = "7.0.4";
  const $ = id => document.getElementById(id);
  let scheduled = 0;

  const COLORS = [
    "#2684ff",
    "#28c8c0",
    "#8b7cf6",
    "#f0a14a",
    "#4ac77a",
    "#ef6d91"
  ];

  function injectStyles() {
    if ($("tripSpendVisualPolishV704Styles")) return;
    const style = document.createElement("style");
    style.id = "tripSpendVisualPolishV704Styles";
    style.textContent = `
      /* v7.0.4 real Analytics graphics */
      #paymentAnalytics.ts-payment-legend,
      #peopleAnalytics.ts-traveler-legend{
        display:grid;
        gap:10px;
      }
      .ts-payment-stack{
        display:flex;
        width:100%;
        height:14px;
        margin:2px 0 8px;
        overflow:hidden;
        border-radius:999px;
        background:var(--surface2);
        box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--line) 72%,transparent);
      }
      .ts-payment-segment{
        min-width:4px;
        height:100%;
      }
      #paymentAnalytics.ts-payment-legend .bar-row,
      #peopleAnalytics.ts-traveler-legend .bar-row{
        display:grid;
        grid-template-columns:minmax(0,1fr) auto;
        align-items:center;
        gap:12px;
        min-height:34px;
        padding:0;
      }
      #paymentAnalytics.ts-payment-legend .bar-meta,
      #peopleAnalytics.ts-traveler-legend .bar-meta{
        display:contents;
      }
      #paymentAnalytics.ts-payment-legend .bar-meta>span,
      #peopleAnalytics.ts-traveler-legend .bar-meta>span{
        position:relative;
        padding-inline-start:18px;
        color:var(--text);
        font-size:13px!important;
      }
      #paymentAnalytics.ts-payment-legend .bar-meta>span::before,
      #peopleAnalytics.ts-traveler-legend .bar-meta>span::before{
        content:"";
        position:absolute;
        inset-inline-start:0;
        top:50%;
        width:9px;
        height:9px;
        border-radius:50%;
        transform:translateY(-50%);
        background:var(--ts-chart-color,#2684ff);
      }
      #paymentAnalytics.ts-payment-legend .bar-meta>strong,
      #peopleAnalytics.ts-traveler-legend .bar-meta>strong{
        color:var(--text);
        font-size:13px!important;
        font-weight:800;
        white-space:nowrap;
      }
      #paymentAnalytics.ts-payment-legend .bar-track,
      #peopleAnalytics.ts-traveler-legend .bar-track{
        display:none!important;
      }

      .ts-traveler-summary{
        display:grid;
        grid-template-columns:96px minmax(0,1fr);
        align-items:center;
        gap:18px;
        margin:0 0 8px;
        padding:4px 0 10px;
      }
      .ts-traveler-ring{
        position:relative;
        display:grid;
        width:92px;
        height:92px;
        place-items:center;
        border-radius:50%;
        box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--line) 70%,transparent);
      }
      .ts-traveler-ring::after{
        content:"";
        position:absolute;
        inset:15px;
        border-radius:50%;
        background:var(--surface);
        box-shadow:0 0 0 1px color-mix(in srgb,var(--line) 62%,transparent);
      }
      .ts-traveler-ring-copy{
        position:relative;
        z-index:1;
        text-align:center;
      }
      .ts-traveler-ring-copy strong,
      .ts-traveler-ring-copy small{
        display:block;
      }
      .ts-traveler-ring-copy strong{
        color:var(--text);
        font-size:20px;
        line-height:1;
      }
      .ts-traveler-ring-copy small{
        margin-top:4px;
        color:var(--muted);
        font-size:10px;
        line-height:1.1;
      }
      .ts-traveler-summary-copy strong,
      .ts-traveler-summary-copy small{
        display:block;
      }
      .ts-traveler-summary-copy strong{
        color:var(--text);
        font-size:14px;
      }
      .ts-traveler-summary-copy small{
        margin-top:5px;
        color:var(--muted);
        font-size:11.5px;
        line-height:1.4;
      }

      #dailyAnalytics.ts-daily-chart{
        display:grid;
        grid-auto-flow:column;
        grid-auto-columns:minmax(62px,1fr);
        align-items:end;
        gap:12px;
        min-height:208px;
        margin-top:4px;
        padding:12px 2px 2px;
        overflow-x:auto;
        overscroll-behavior-inline:contain;
        scrollbar-width:none;
      }
      #dailyAnalytics.ts-daily-chart::-webkit-scrollbar{display:none}
      #dailyAnalytics.ts-daily-chart .daily{
        display:grid;
        grid-template-rows:34px 132px 24px;
        align-items:end;
        gap:7px;
        min-width:62px;
        padding:0;
      }
      #dailyAnalytics.ts-daily-chart .daily>strong{
        grid-row:1;
        align-self:end;
        overflow:hidden;
        color:var(--text);
        font-size:11px!important;
        font-weight:800;
        text-align:center;
        text-overflow:ellipsis;
        white-space:nowrap;
      }
      #dailyAnalytics.ts-daily-chart .daily>.bar-track{
        grid-row:2;
        display:flex!important;
        width:18px!important;
        height:132px!important;
        align-items:flex-end;
        justify-self:center;
        overflow:hidden;
        border-radius:999px;
        background:color-mix(in srgb,var(--surface2) 88%,transparent)!important;
        box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--line) 55%,transparent);
      }
      #dailyAnalytics.ts-daily-chart .daily>.bar-track>.bar-fill{
        width:100%!important;
        height:var(--ts-daily-value,2%);
        min-height:5px;
        border-radius:999px;
        transition:height .25s ease;
      }
      #dailyAnalytics.ts-daily-chart .daily>span:first-child{
        grid-row:3;
        align-self:start;
        color:var(--muted);
        font-size:10.5px!important;
        text-align:center;
        white-space:nowrap;
      }

      /* AI Settings card: provider truth + compact status */
      #tripAiSettingsCard.ts-ai-polished{
        padding:16px!important;
      }
      #tripAiSettingsCard.ts-ai-polished .trip-ai-settings-head{
        align-items:flex-start;
      }
      #tripAiSettingsCard.ts-ai-polished .trip-ai-settings-head>div>strong{
        font-size:15px!important;
      }
      #tripAiSettingsCard.ts-ai-polished .trip-ai-settings-head>div>p{
        max-width:46ch;
        margin-top:5px;
        font-size:11.5px!important;
        line-height:1.45;
      }
      #tripAiSettingsCard.ts-ai-polished .trip-ai-status{
        display:inline-flex!important;
        min-width:0!important;
        min-height:28px!important;
        height:28px!important;
        align-items:center;
        gap:6px;
        padding:0 9px!important;
        border-radius:999px!important;
        font-size:9.5px!important;
        line-height:1!important;
        white-space:nowrap;
      }
      #tripAiSettingsCard.ts-ai-polished .trip-ai-status::before{
        content:"";
        width:6px;
        height:6px;
        border-radius:50%;
        background:currentColor;
        opacity:.9;
      }
      #tripAiSettingsCard.ts-ai-polished .trip-ai-provider-line{
        align-items:center;
        margin-top:12px!important;
        padding:11px 12px!important;
      }
      #tripAiSettingsCard.ts-ai-polished .trip-ai-provider-line strong{
        font-size:13px!important;
      }
      #tripAiSettingsCard.ts-ai-polished .trip-ai-provider-line small{
        color:var(--muted);
        font-size:10.5px!important;
        line-height:1.35;
      }
      .ts-ai-route{
        max-width:150px;
        text-align:end;
      }

      /* Settings country flags should look like flags, not oversized icon tiles. */
      #settings .settings-country-row{
        grid-template-columns:30px minmax(0,1fr) auto!important;
        gap:11px!important;
      }
      #settings .settings-country-flag{
        width:30px!important;
        height:24px!important;
        padding:0!important;
        border:0!important;
        border-radius:5px!important;
        background:transparent!important;
        box-shadow:none!important;
        font-size:20px!important;
        line-height:24px!important;
        overflow:visible!important;
      }

      @media(max-width:600px){
        .ts-traveler-summary{grid-template-columns:82px minmax(0,1fr);gap:14px}
        .ts-traveler-ring{width:80px;height:80px}
        .ts-traveler-ring::after{inset:13px}
        #dailyAnalytics.ts-daily-chart{grid-auto-columns:60px;gap:10px;min-height:196px}
        #dailyAnalytics.ts-daily-chart .daily{grid-template-rows:32px 122px 24px;min-width:60px}
        #dailyAnalytics.ts-daily-chart .daily>.bar-track{height:122px!important}
      }
    `;
    document.head.append(style);
  }

  function parseAmount(text) {
    const normalized = String(text || "")
      .replace(/,/g, "")
      .replace(/[٠-٩]/g, d => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
    const match = normalized.match(/-?\d+(?:\.\d+)?/);
    return match ? Math.max(0, Number(match[0]) || 0) : 0;
  }

  function chartRows(host) {
    if (!host) return [];
    return [...host.querySelectorAll(":scope > .bar-row")].map((row, index) => {
      const labelEl = row.querySelector(".bar-meta > span");
      const amountEl = row.querySelector(".bar-meta > strong");
      return {
        row,
        index,
        label: labelEl?.textContent?.trim() || "",
        amount: parseAmount(amountEl?.textContent),
        labelEl,
        amountEl
      };
    });
  }

  function colorFor(index) {
    return COLORS[index % COLORS.length];
  }

  function polishPaymentChart() {
    const host = $("paymentAnalytics");
    if (!host) return;
    const rows = chartRows(host);
    if (!rows.length) return;

    host.classList.add("ts-payment-legend");
    host.querySelector(":scope > .ts-payment-stack")?.remove();

    const total = rows.reduce((sum, item) => sum + item.amount, 0) || 1;
    const stack = document.createElement("div");
    stack.className = "ts-payment-stack";
    stack.setAttribute("aria-hidden", "true");

    rows.forEach((item, index) => {
      const color = colorFor(index);
      item.row.style.setProperty("--ts-chart-color", color);
      const segment = document.createElement("span");
      segment.className = "ts-payment-segment";
      segment.style.background = color;
      segment.style.flex = `${Math.max(item.amount / total, 0.012)} 1 0`;
      stack.append(segment);
    });

    host.prepend(stack);
  }

  function polishTravelerChart() {
    const host = $("peopleAnalytics");
    if (!host) return;
    const rows = chartRows(host);
    if (!rows.length) return;

    host.classList.add("ts-traveler-legend");
    host.querySelector(":scope > .ts-traveler-summary")?.remove();

    const total = rows.reduce((sum, item) => sum + item.amount, 0) || 1;
    let cursor = 0;
    const segments = [];
    rows.forEach((item, index) => {
      const color = colorFor(index);
      item.row.style.setProperty("--ts-chart-color", color);
      const start = cursor;
      cursor += item.amount / total * 100;
      segments.push(`${color} ${start.toFixed(2)}% ${cursor.toFixed(2)}%`);
    });

    const dominant = rows.slice().sort((a, b) => b.amount - a.amount)[0];
    const dominantPct = dominant ? Math.round(dominant.amount / total * 100) : 0;
    const rtl = document.documentElement.dir === "rtl";

    const summary = document.createElement("div");
    summary.className = "ts-traveler-summary";

    const ring = document.createElement("div");
    ring.className = "ts-traveler-ring";
    ring.style.background = `conic-gradient(${segments.join(",")})`;
    ring.innerHTML = `<span class="ts-traveler-ring-copy"><strong>${rows.length}</strong><small>${rtl ? "مسافر" : (rows.length === 1 ? "traveler" : "travelers")}</small></span>`;

    const copy = document.createElement("div");
    copy.className = "ts-traveler-summary-copy";
    const strong = document.createElement("strong");
    strong.textContent = dominant?.label || "—";
    const small = document.createElement("small");
    small.textContent = dominant
      ? (rtl ? `${dominantPct}% من الإنفاق المعيّن` : `${dominantPct}% of assigned spending`)
      : "";
    copy.append(strong, small);
    summary.append(ring, copy);
    host.prepend(summary);
  }

  function polishDailyChart() {
    const host = $("dailyAnalytics");
    if (!host) return;
    const rows = [...host.querySelectorAll(":scope > .daily")];
    if (!rows.length) return;

    host.classList.add("ts-daily-chart");
    rows.forEach(row => {
      const fill = row.querySelector(".bar-fill");
      const value = fill?.style?.width || "2%";
      row.style.setProperty("--ts-daily-value", value);
    });
  }

  function polishAiCard() {
    const card = $("tripAiSettingsCard");
    if (!card) return;
    card.classList.add("ts-ai-polished");

    const title = card.querySelector(".trip-ai-settings-head strong");
    if (title) title.textContent = `TripSpend AI v${RELEASE}`;

    const description = card.querySelector(".trip-ai-settings-head p");
    if (description) description.textContent = "Gemini-powered trip analysis and confirmed changes.";

    const status = $("tripAiServiceStatus");
    if (status) {
      const current = status.textContent.trim().toUpperCase();
      if (current.includes("READY")) status.textContent = "READY";
    }

    const providerLine = card.querySelector(".trip-ai-provider-line");
    if (!providerLine) return;
    const provider = providerLine.querySelector("span > strong");
    const worker = $("tripAiWorkerVersion");
    const route = providerLine.querySelector(":scope > small");

    let workerVersion = "";
    const workerText = worker?.textContent || "";
    const versionMatch = workerText.match(/Worker\s+v([\d.]+)/i);
    if (versionMatch) workerVersion = versionMatch[1];

    if (provider) provider.textContent = "Google Gemini";
    if (worker) worker.textContent = "Gemini 3.5 Flash-Lite";
    if (route) {
      route.classList.add("ts-ai-route");
      route.textContent = workerVersion
        ? `via Cloudflare Worker v${workerVersion} • confirm writes`
        : "via Cloudflare Worker • confirm writes";
    }
  }

  function polish() {
    injectStyles();
    polishPaymentChart();
    polishTravelerChart();
    polishDailyChart();
    polishAiCard();
  }

  function schedule() {
    clearTimeout(scheduled);
    scheduled = window.setTimeout(() => requestAnimationFrame(polish), 35);
  }

  function start() {
    polish();
    window.addEventListener("tripspend:render", schedule);
    window.addEventListener("tripspend:page", schedule);
    window.addEventListener("tripspend:language", schedule);
    window.setTimeout(polish, 350);
    window.setTimeout(polish, 1100);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once:true });
  } else {
    start();
  }

  window.TripSpendVisualPolish = { version: RELEASE, refresh: polish };
})();