(() => {
  "use strict";

  const RELEASE = "7.0.4";
  const $ = id => document.getElementById(id);
  const core = () => window.TripSpendCore;
  let scheduled = 0;

  const COLORS = ["#1f7cff", "#20c9c3", "#8b7cf6", "#f0a14a", "#4ac77a", "#ef6d91"];

  function language() {
    return window.TripSpendLocale?.language?.() || document.documentElement.lang || "en";
  }

  function ar() { return language() === "ar"; }
  function text(en, arabic) { return ar() ? arabic : en; }

  function injectStyles() {
    if ($("tripSpendVisualPolishV704Styles")) return;
    const style = document.createElement("style");
    style.id = "tripSpendVisualPolishV704Styles";
    style.textContent = `
      /* v7.0.4 — Analytics reference visual pass */
      #analytics.analytics-v651{
        max-width:700px;
      }
      #analytics .analytics-more-row{
        display:flex!important;
        width:100%;
        margin:18px 0 12px!important;
        padding:16px 18px!important;
        align-items:center;
        justify-content:space-between;
        border:1px solid color-mix(in srgb,var(--brand) 22%,var(--line))!important;
        border-radius:19px!important;
        background:linear-gradient(145deg,color-mix(in srgb,var(--surface) 96%,#07152a),color-mix(in srgb,var(--surface2) 92%,#071426))!important;
        box-shadow:0 14px 34px rgba(0,30,74,.08)!important;
      }
      #analytics .analytics-more-row>span:first-child{
        display:grid;
        gap:4px;
        text-align:start;
      }
      #analytics .analytics-more-row small{
        color:color-mix(in srgb,var(--brand) 72%,var(--muted))!important;
        font-size:10.5px!important;
        font-weight:850!important;
        letter-spacing:.13em!important;
      }
      #analytics .analytics-more-row strong{
        color:var(--text)!important;
        font-size:16px!important;
        line-height:1.25;
      }
      #analytics #analyticsMoreArrow{
        color:var(--muted);
        font-size:19px!important;
        transform:rotate(180deg);
      }
      #analytics .analytics-more-details{
        display:grid!important;
        gap:12px!important;
        margin-top:0!important;
      }
      #analytics .analytics-secondary-block,
      #analytics .analytics-busiest-row{
        border:1px solid color-mix(in srgb,var(--brand) 18%,var(--line))!important;
        background:linear-gradient(145deg,color-mix(in srgb,var(--surface) 97%,#07152a),color-mix(in srgb,var(--surface2) 94%,#071426))!important;
        box-shadow:0 14px 38px rgba(0,28,70,.07)!important;
      }
      #analytics .analytics-secondary-block{
        padding:18px!important;
        border-radius:20px!important;
      }
      #analytics .analytics-busiest-row{
        position:relative;
        min-height:58px!important;
        padding:14px 16px 14px 48px!important;
        border-radius:16px!important;
      }
      #analytics .analytics-busiest-row::before{
        content:"";
        position:absolute;
        left:17px;
        top:50%;
        width:18px;
        height:18px;
        transform:translateY(-50%);
        opacity:.78;
        background:center/contain no-repeat url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%239eb3ca' stroke-width='1.8'%3E%3Crect x='4' y='5.5' width='16' height='14' rx='2'/%3E%3Cpath d='M8 3.5v4M16 3.5v4M4 9.5h16'/%3E%3C/svg%3E");
      }
      #analytics .analytics-busiest-row small{
        font-size:12px!important;
      }
      #analytics .analytics-busiest-row strong{
        font-size:14px!important;
      }
      html[dir="rtl"] #analytics .analytics-busiest-row{
        padding:14px 48px 14px 16px!important;
      }
      html[dir="rtl"] #analytics .analytics-busiest-row::before{
        left:auto;
        right:17px;
      }

      #analytics .analytics-block-title{
        margin-bottom:14px!important;
      }
      #analytics .analytics-block-title h3{
        margin:0;
        font-size:18px!important;
        letter-spacing:-.025em;
      }
      #analytics .analytics-block-title small{
        margin-top:4px!important;
        font-size:12px!important;
      }

      /* Payment method reference rows */
      #paymentAnalytics.ts-payment-reference{
        display:grid;
        gap:12px;
      }
      .ts-payment-row{
        display:grid;
        grid-template-columns:48px minmax(0,1fr) auto;
        align-items:center;
        gap:12px;
      }
      .ts-payment-icon{
        display:grid;
        width:48px;
        height:48px;
        place-items:center;
        border-radius:13px;
        background:linear-gradient(145deg,#1556df,#167cff);
        box-shadow:0 8px 20px rgba(25,111,255,.22);
      }
      .ts-payment-icon svg{
        width:25px;
        height:25px;
        fill:none;
        stroke:#fff;
        stroke-width:2;
      }
      .ts-payment-name{
        color:var(--text);
        font-size:14px;
        font-weight:720;
      }
      .ts-payment-value{
        text-align:end;
      }
      .ts-payment-value strong,
      .ts-payment-value small{
        display:block;
      }
      .ts-payment-value strong{
        color:var(--text);
        font-size:14px;
        font-weight:820;
      }
      .ts-payment-value small{
        margin-top:3px;
        color:var(--muted);
        font-size:11px;
      }
      .ts-reference-progress{
        grid-column:1/-1;
        height:7px;
        overflow:hidden;
        border-radius:999px;
        background:color-mix(in srgb,var(--surface2) 88%,#0a2038);
      }
      .ts-reference-progress>span{
        display:block;
        height:100%;
        border-radius:inherit;
        background:linear-gradient(90deg,var(--ts-color,#1f7cff),color-mix(in srgb,var(--ts-color,#1f7cff) 82%,#55b9ff));
        box-shadow:0 0 14px color-mix(in srgb,var(--ts-color,#1f7cff) 30%,transparent);
      }

      /* Traveler reference rows */
      #peopleAnalytics.ts-traveler-reference{
        display:grid;
        gap:13px;
      }
      .ts-traveler-row{
        display:grid;
        grid-template-columns:46px minmax(0,1fr) auto;
        align-items:center;
        gap:11px;
      }
      .ts-traveler-avatar{
        display:grid;
        width:42px;
        height:42px;
        place-items:center;
        border:1.5px solid var(--ts-color,#1f7cff);
        border-radius:50%;
        color:var(--ts-color,#1f7cff);
        background:color-mix(in srgb,var(--ts-color,#1f7cff) 8%,transparent);
        font-size:12px;
        font-weight:760;
      }
      .ts-traveler-name{
        color:var(--text);
        font-size:14px;
        font-weight:720;
      }
      .ts-traveler-value{
        text-align:end;
      }
      .ts-traveler-value strong,
      .ts-traveler-value small{
        display:block;
      }
      .ts-traveler-value strong{
        color:var(--text);
        font-size:14px;
        font-weight:820;
      }
      .ts-traveler-value small{
        margin-top:2px;
        color:var(--muted);
        font-size:11px;
      }

      /* Daily spending — glossy bars + smooth line */
      .ts-daily-head{
        display:flex!important;
        align-items:flex-start!important;
        justify-content:space-between!important;
        gap:12px!important;
      }
      .ts-period-pill{
        flex:0 0 auto;
        min-height:34px;
        padding:0 12px;
        border:1px solid color-mix(in srgb,var(--brand) 22%,var(--line));
        border-radius:999px;
        background:color-mix(in srgb,var(--surface) 92%,#07152a);
        color:var(--text);
        font-size:11px;
        font-weight:720;
      }
      #dailyAnalytics.ts-daily-reference{
        display:block!important;
        margin-top:0!important;
      }
      .ts-daily-chart-shell{
        position:relative;
        width:100%;
        min-height:220px;
        overflow:hidden;
      }
      .ts-daily-chart-shell svg{
        display:block;
        width:100%;
        height:auto;
        overflow:visible;
      }
      .ts-daily-grid-line{
        stroke:color-mix(in srgb,var(--line) 55%,transparent);
        stroke-width:.7;
      }
      .ts-daily-axis-label,
      .ts-daily-date-label,
      .ts-daily-value-label{
        fill:var(--muted);
        font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
      }
      .ts-daily-axis-label{font-size:8px}
      .ts-daily-date-label{font-size:8px}
      .ts-daily-value-label{
        fill:var(--text);
        font-size:7.6px;
        font-weight:760;
      }
      .ts-daily-date-label.active{
        fill:#2684ff;
        font-weight:850;
      }
      .ts-daily-highlight-text{
        fill:#fff;
        font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
        font-size:7.6px;
        font-weight:800;
      }
      .ts-daily-summary{
        display:grid;
        grid-template-columns:1fr 1px 1fr;
        align-items:center;
        gap:15px;
        margin-top:4px;
        padding:12px 14px;
        border:1px solid color-mix(in srgb,var(--brand) 14%,var(--line));
        border-radius:15px;
        background:color-mix(in srgb,var(--surface2) 74%,transparent);
      }
      .ts-daily-summary-divider{
        width:1px;
        height:36px;
        background:var(--line);
      }
      .ts-daily-summary-item{
        display:grid;
        grid-template-columns:30px minmax(0,1fr);
        align-items:center;
        gap:9px;
      }
      .ts-daily-summary-icon{
        display:grid;
        width:28px;
        height:28px;
        place-items:center;
        color:#24c8c0;
      }
      .ts-daily-summary-icon svg{
        width:24px;
        height:24px;
        fill:none;
        stroke:currentColor;
        stroke-width:1.8;
      }
      .ts-daily-summary-item:last-child .ts-daily-summary-icon{color:#8fb6ff}
      .ts-daily-summary-copy small,
      .ts-daily-summary-copy strong{
        display:block;
      }
      .ts-daily-summary-copy small{
        color:var(--muted);
        font-size:10.5px!important;
      }
      .ts-daily-summary-copy strong{
        margin-top:3px;
        color:var(--text);
        font-size:13px!important;
        font-weight:820;
      }

      /* AI Settings card: Gemini is primary; backend is secondary. */
      #tripAiSettingsCard.ts-ai-polished{padding:16px!important}
      #tripAiSettingsCard.ts-ai-polished .trip-ai-settings-head{align-items:flex-start}
      #tripAiSettingsCard.ts-ai-polished .trip-ai-settings-head>div>strong{font-size:15px!important}
      #tripAiSettingsCard.ts-ai-polished .trip-ai-settings-head>div>p{max-width:46ch;margin-top:5px;font-size:11.5px!important;line-height:1.45}
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
      #tripAiSettingsCard.ts-ai-polished .trip-ai-status::before{content:"";width:6px;height:6px;border-radius:50%;background:currentColor;opacity:.9}
      #tripAiSettingsCard.ts-ai-polished .trip-ai-provider-line{align-items:center;margin-top:12px!important;padding:11px 12px!important}
      #tripAiSettingsCard.ts-ai-polished .trip-ai-provider-line strong{font-size:13px!important}
      #tripAiSettingsCard.ts-ai-polished .trip-ai-provider-line small{color:var(--muted);font-size:10.5px!important;line-height:1.35}
      .ts-ai-route{max-width:150px;text-align:end}

      /* Settings country flags: flag-sized, no oversized tile. */
      #settings .settings-country-row{grid-template-columns:30px minmax(0,1fr) auto!important;gap:11px!important}
      #settings .settings-country-flag{
        width:30px!important;height:24px!important;padding:0!important;border:0!important;border-radius:5px!important;
        background:transparent!important;box-shadow:none!important;font-size:20px!important;line-height:24px!important;overflow:visible!important;
      }

      @media(max-width:600px){
        #analytics .analytics-secondary-block{padding:16px!important}
        .ts-payment-row{grid-template-columns:44px minmax(0,1fr) auto;gap:10px}
        .ts-payment-icon{width:44px;height:44px;border-radius:12px}
        .ts-traveler-row{grid-template-columns:42px minmax(0,1fr) auto;gap:9px}
        .ts-traveler-avatar{width:38px;height:38px}
        .ts-daily-summary{gap:10px;padding:11px 10px}
        .ts-daily-summary-item{grid-template-columns:26px minmax(0,1fr);gap:7px}
      }
      @media(max-width:370px){
        .ts-payment-name,.ts-traveler-name{font-size:13px}
        .ts-payment-value strong,.ts-traveler-value strong{font-size:12.5px}
        .ts-daily-summary-copy strong{font-size:11.5px!important}
      }
    `;
    document.head.append(style);
  }

  function parseAmount(textValue) {
    const normalized = String(textValue || "")
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
        index,
        label: labelEl?.textContent?.trim() || "",
        amountText: amountEl?.textContent?.trim() || "",
        amount: parseAmount(amountEl?.textContent)
      };
    });
  }

  function colorFor(index) { return COLORS[index % COLORS.length]; }

  function pctText(value) {
    if (value >= 99.95) return "100%";
    return `${value.toFixed(1)}%`;
  }

  function cardIconSvg() {
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="6" width="17" height="12" rx="2.4"/><path d="M3.8 10h16.4M7 14.5h4.8"/></svg>`;
  }

  function polishPaymentChart() {
    const host = $("paymentAnalytics");
    if (!host) return;
    const rows = chartRows(host);
    if (!rows.length) return;

    const total = rows.reduce((sum, item) => sum + item.amount, 0) || 1;
    host.className = "ts-payment-reference";
    host.replaceChildren();

    rows.forEach((item, index) => {
      const color = colorFor(index);
      const pct = item.amount / total * 100;
      const row = document.createElement("div");
      row.className = "ts-payment-row";
      row.style.setProperty("--ts-color", color);

      const icon = document.createElement("span");
      icon.className = "ts-payment-icon";
      icon.innerHTML = cardIconSvg();
      const name = document.createElement("span");
      name.className = "ts-payment-name";
      name.textContent = item.label;
      const value = document.createElement("span");
      value.className = "ts-payment-value";
      const strong = document.createElement("strong");
      strong.textContent = item.amountText;
      const small = document.createElement("small");
      small.textContent = pctText(pct);
      value.append(strong, small);
      const progress = document.createElement("span");
      progress.className = "ts-reference-progress";
      const fill = document.createElement("span");
      fill.style.width = `${Math.max(1.5, pct)}%`;
      progress.append(fill);
      row.append(icon, name, value, progress);
      host.append(row);
    });
  }

  function avatarLabel(label) {
    const value = String(label || "?").trim();
    if (value.length <= 2) return value;
    return value.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join("").toUpperCase();
  }

  function polishTravelerChart() {
    const host = $("peopleAnalytics");
    if (!host) return;
    const rows = chartRows(host);
    if (!rows.length) return;

    const total = rows.reduce((sum, item) => sum + item.amount, 0) || 1;
    host.className = "ts-traveler-reference";
    host.replaceChildren();

    rows.forEach((item, index) => {
      const color = colorFor(index);
      const pct = item.amount / total * 100;
      const row = document.createElement("div");
      row.className = "ts-traveler-row";
      row.style.setProperty("--ts-color", color);

      const avatar = document.createElement("span");
      avatar.className = "ts-traveler-avatar";
      avatar.textContent = avatarLabel(item.label);
      const name = document.createElement("span");
      name.className = "ts-traveler-name";
      name.textContent = item.label;
      const value = document.createElement("span");
      value.className = "ts-traveler-value";
      const strong = document.createElement("strong");
      strong.textContent = item.amountText;
      const small = document.createElement("small");
      small.textContent = pctText(pct);
      value.append(strong, small);
      const progress = document.createElement("span");
      progress.className = "ts-reference-progress";
      const fill = document.createElement("span");
      fill.style.width = `${Math.max(1.5, pct)}%`;
      progress.append(fill);
      row.append(avatar, name, value, progress);
      host.append(row);
    });
  }

  function parseDate(value) { return new Date(`${value}T12:00:00`); }
  function isoDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  function addDays(value, offset) {
    const d = parseDate(value);
    d.setDate(d.getDate() + offset);
    return isoDate(d);
  }
  function clampDate(value, min, max) {
    if (min && value < min) return min;
    if (max && value > max) return max;
    return value;
  }
  function shortDate(value) {
    const d = parseDate(value);
    const locale = ar() ? "ar" : "en";
    return d.toLocaleDateString(locale, { day:"numeric", month:"short" }).replace(/\./g, "");
  }
  function format3(value) { return Number(value || 0).toFixed(3); }
  function escapeXml(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&apos;"}[char]));
  }
  function niceAxisMax(max) {
    if (!(max > 0)) return 1;
    const step = max <= 8 ? 2 : max <= 24 ? 8 : max <= 60 ? 20 : Math.pow(10, Math.floor(Math.log10(max)) - 1) * 5;
    return Math.ceil(max / step) * step;
  }
  function smoothPath(points) {
    if (!points.length) return "";
    let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const cur = points[i];
      const mid = (prev.x + cur.x) / 2;
      d += ` C ${mid.toFixed(2)} ${prev.y.toFixed(2)}, ${mid.toFixed(2)} ${cur.y.toFixed(2)}, ${cur.x.toFixed(2)} ${cur.y.toFixed(2)}`;
    }
    return d;
  }

  function recentDailyRows() {
    const state = core()?.getState?.();
    const trip = state?.trip;
    if (!trip) return [];
    const expenses = Array.isArray(state.expenses) ? state.expenses : [];
    const totals = new Map();
    expenses.forEach(expense => totals.set(expense.date, (totals.get(expense.date) || 0) + Number(expense.homeAmount || 0)));

    const today = core()?.today?.() || isoDate(new Date());
    const end = clampDate(today, trip.startDate, trip.endDate);
    let start = addDays(end, -6);
    if (trip.startDate && start < trip.startDate) start = trip.startDate;

    const rows = [];
    let current = start;
    while (current <= end && rows.length < 7) {
      rows.push({ date:current, amount:totals.get(current) || 0 });
      current = addDays(current, 1);
    }
    return rows;
  }

  function summaryIcon(kind) {
    if (kind === "total") return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19V11h3v8H5Zm5 0V5h3v14h-3Zm5 0V8h3v11h-3Z"/></svg>`;
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 17 5-5 3 3 7-8"/><path d="M15 7h4v4M18.5 16.5v4M16.5 18.5h4"/></svg>`;
  }

  function polishDailyChart() {
    const host = $("dailyAnalytics");
    if (!host) return;
    const rows = recentDailyRows();
    if (!rows.length) return;

    const state = core()?.getState?.();
    const currency = state?.trip?.homeCurrency || "OMR";
    const total = rows.reduce((sum, row) => sum + row.amount, 0);
    const average = total / Math.max(1, rows.length);
    const maxAmount = Math.max(...rows.map(row => row.amount), 0);
    const axisMax = niceAxisMax(maxAmount || 1);
    const biggestIndex = rows.reduce((best, row, index) => row.amount > rows[best].amount ? index : best, 0);

    const W = 350, H = 220, left = 30, right = 342, top = 42, bottom = 166;
    const usableW = right - left;
    const stepX = rows.length > 1 ? usableW / (rows.length - 1) : usableW;
    const yFor = value => bottom - Math.min(1, value / axisMax) * (bottom - top);
    const points = rows.map((row, index) => ({ x:left + stepX * index, y:yFor(row.amount), ...row, index }));
    const line = smoothPath(points);
    const axisTicks = [0, axisMax / 3, axisMax * 2 / 3, axisMax];

    let svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${escapeXml(text("Daily spending chart", "مخطط الإنفاق اليومي"))}">
      <defs>
        <linearGradient id="tsDailyBarGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#2796ff"/><stop offset="100%" stop-color="#1059df" stop-opacity=".62"/></linearGradient>
        <filter id="tsDailyGlow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="2.3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>`;

    axisTicks.forEach(value => {
      const y = yFor(value);
      svg += `<line class="ts-daily-grid-line" x1="${left}" y1="${y}" x2="${right}" y2="${y}"/><text class="ts-daily-axis-label" x="4" y="${y + 3}">${escapeXml(Number.isInteger(value) ? String(value) : value.toFixed(1))}</text>`;
    });

    points.forEach(point => {
      const barWidth = 19;
      const barHeight = Math.max(2, bottom - point.y);
      svg += `<rect x="${(point.x - barWidth / 2).toFixed(2)}" y="${(bottom - barHeight).toFixed(2)}" width="${barWidth}" height="${barHeight.toFixed(2)}" rx="5" fill="url(#tsDailyBarGradient)" opacity="${point.amount > 0 ? 1 : .22}"/>`;
    });

    svg += `<path d="${line}" fill="none" stroke="#2684ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" filter="url(#tsDailyGlow)"/>`;

    points.forEach(point => {
      const active = point.index === biggestIndex && point.amount > 0;
      if (active) {
        const boxY = Math.max(5, point.y - 34);
        svg += `<rect x="${(point.x - 25).toFixed(2)}" y="${boxY.toFixed(2)}" width="50" height="27" rx="6" fill="#1676f7" filter="url(#tsDailyGlow)"/>
          <text class="ts-daily-highlight-text" x="${point.x}" y="${(boxY + 11).toFixed(2)}" text-anchor="middle">${escapeXml(format3(point.amount))}</text>
          <text class="ts-daily-highlight-text" x="${point.x}" y="${(boxY + 21).toFixed(2)}" text-anchor="middle">${escapeXml(currency)}</text>`;
      } else if (point.amount > 0) {
        const labelY = Math.max(13, point.y - 16);
        svg += `<text class="ts-daily-value-label" x="${point.x}" y="${labelY.toFixed(2)}" text-anchor="middle">${escapeXml(format3(point.amount))}</text>
          <text class="ts-daily-value-label" x="${point.x}" y="${(labelY + 9).toFixed(2)}" text-anchor="middle">${escapeXml(currency)}</text>`;
      }
      svg += `<circle cx="${point.x}" cy="${point.y}" r="3.8" fill="#0b1421" stroke="#fff" stroke-width="1.5"/>
        <text class="ts-daily-date-label${active ? " active" : ""}" x="${point.x}" y="185" text-anchor="middle">${escapeXml(shortDate(point.date))}</text>`;
    });
    svg += `</svg>`;

    host.className = "ts-daily-reference";
    host.replaceChildren();
    const shell = document.createElement("div");
    shell.className = "ts-daily-chart-shell";
    shell.innerHTML = svg;

    const summary = document.createElement("div");
    summary.className = "ts-daily-summary";
    const leftItem = document.createElement("div");
    leftItem.className = "ts-daily-summary-item";
    leftItem.innerHTML = `<span class="ts-daily-summary-icon">${summaryIcon("total")}</span><span class="ts-daily-summary-copy"><small>${escapeXml(text(`Total (${rows.length} days)`, `الإجمالي (${rows.length} أيام)`))}</small><strong>${escapeXml(`${format3(total)} ${currency}`)}</strong></span>`;
    const divider = document.createElement("span");
    divider.className = "ts-daily-summary-divider";
    const rightItem = document.createElement("div");
    rightItem.className = "ts-daily-summary-item";
    rightItem.innerHTML = `<span class="ts-daily-summary-icon">${summaryIcon("average")}</span><span class="ts-daily-summary-copy"><small>${escapeXml(text("Daily average", "المتوسط اليومي"))}</small><strong>${escapeXml(`${format3(average)} ${currency}`)}</strong></span>`;
    summary.append(leftItem, divider, rightItem);
    host.append(shell, summary);

    const block = host.closest(".analytics-secondary-block");
    const title = block?.querySelector(".analytics-block-title");
    if (title) {
      title.classList.add("ts-daily-head");
      let pill = title.querySelector(".ts-period-pill");
      if (!pill) {
        pill = document.createElement("button");
        pill.type = "button";
        pill.className = "ts-period-pill";
        title.append(pill);
      }
      pill.textContent = text("Last 7 days⌄", "آخر 7 أيام⌄");
      pill.setAttribute("aria-label", text("Showing the last 7 days", "عرض آخر 7 أيام"));
    }
  }

  function polishMoreInsights() {
    const toggle = $("analyticsMoreToggle");
    const details = $("analyticsMoreDetails");
    if (toggle) toggle.setAttribute("aria-expanded", "true");
    if (details) details.classList.remove("hidden");
    if ($("analyticsMoreArrow")) $("analyticsMoreArrow").textContent = "⌄";
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
    if (status && status.textContent.trim().toUpperCase().includes("READY")) status.textContent = "READY";

    const providerLine = card.querySelector(".trip-ai-provider-line");
    if (!providerLine) return;
    const provider = providerLine.querySelector("span > strong");
    const worker = $("tripAiWorkerVersion");
    const route = providerLine.querySelector(":scope > small");
    let workerVersion = "";
    const versionMatch = (worker?.textContent || "").match(/Worker\s+v([\d.]+)/i);
    if (versionMatch) workerVersion = versionMatch[1];
    if (provider) provider.textContent = "Google Gemini";
    if (worker) worker.textContent = "Gemini 3.5 Flash-Lite";
    if (route) {
      route.classList.add("ts-ai-route");
      route.textContent = workerVersion ? `via Cloudflare Worker v${workerVersion} • confirm writes` : "via Cloudflare Worker • confirm writes";
    }
  }

  function polish() {
    injectStyles();
    polishMoreInsights();
    polishPaymentChart();
    polishTravelerChart();
    polishDailyChart();
    polishAiCard();
  }

  function schedule() {
    clearTimeout(scheduled);
    scheduled = window.setTimeout(() => requestAnimationFrame(polish), 45);
  }

  function start() {
    polish();
    window.addEventListener("tripspend:render", schedule);
    window.addEventListener("tripspend:page", schedule);
    window.addEventListener("tripspend:language", schedule);
    window.setTimeout(polish, 350);
    window.setTimeout(polish, 1100);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once:true });
  else start();

  window.TripSpendVisualPolish = { version:RELEASE, refresh:polish };
})();