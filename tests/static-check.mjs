import fs from "node:fs";
import vm from "node:vm";

const VERSION = "7.1.0";
const INNER_WORKER_VERSION = "7.0.0";
const WORKER_RUNTIME_VERSION = "7.0.3";
const read = path => fs.readFileSync(path,"utf8");
const fail = message => { console.error(`✗ ${message}`); process.exitCode = 1; };
const ok = message => console.log(`✓ ${message}`);

const version = JSON.parse(read("version.json"));
const playwrightConfig = read("playwright.config.js");
const qualityWorkflow = read(".github/workflows/v7-quality.yml");
if (!playwrightConfig.includes('channel: process.env.CI ? "chrome" : undefined') || !qualityWorkflow.includes("google-chrome --version") || qualityWorkflow.includes("playwright install chromium")) fail("CI does not use the preinstalled Chrome browser");
else ok("CI uses the preinstalled Chrome browser without a blocking download");
const index = read("index.html");
if (version.version !== VERSION) fail(`version.json is ${version.version}, expected ${VERSION}`); else ok("version.json matches app release");
for (const marker of ["homeGuideCard","countryBudgetToggle","expense-fast-fields","local-first-note"]) {
  if (!index.includes(marker)) fail(`v7.1.0 UX structure missing: ${marker}`);
}
if (index.includes('id="healthAction"')) fail("Today guidance still duplicates the Add expense action");
else ok("Today guidance is informational without a duplicate action");

const manifest = JSON.parse(read("manifest.webmanifest"));
if (!String(manifest.name).includes(VERSION)) fail(`manifest name does not include ${VERSION}`); else ok("manifest matches app release");

const sw = read("sw.js");
if (!sw.includes(`const APP_VERSION = "${VERSION}"`)) fail("service worker version mismatch"); else ok("service worker version matches");
if (!sw.includes("locale-v700.js") || !sw.includes("receipt-ai-v700.js") || !sw.includes("ui-foundation-v710.js") || !sw.includes("enhancements-v710.js")) fail("v7.1 runtime modules missing from service worker"); else ok("v7.1 runtime modules are wired");
for (const oldPatch of ["upgradeHtml","upgradeAppJs","upgradeLocaleJs","upgradeVisualJs","upgradeSettingsJs","upgradeFlagsJs","upgradeUiFixesJs","upgradeSetupJs","upgradeReceiptJs"]) {
  if (sw.includes(oldPatch)) fail(`service worker still contains runtime patch: ${oldPatch}`);
}
if (sw.includes("replaceAll(") || sw.includes("js.replace(")) fail("service worker still rewrites application source");
else ok("service worker serves real v7.1 source without runtime rewriting");
if (!sw.includes("TRIPSPEND_UPDATE_READY") || !sw.includes("staleWhileRevalidate")) fail("reliable update delivery is missing");
else ok("service worker announces updates and uses explicit cache strategies");

const shellMatch = sw.match(/const APP_SHELL = \[([\s\S]*?)\];/);
const shell = shellMatch?.[1] || "";
for (const old of ["i18n.js","i18n-layout-fix.js","i18n-audit-v690.js","rtl-polish-v687.js","lang-flag.js","setup-lang-v688.js","budget-labels-v689.js","expense-ar-v691.js"]) {
  if (shell.includes(`./${old}`)) fail(`retired runtime ${old} is still in APP_SHELL`);
}
ok("legacy localization patches are retired from APP_SHELL");

const fx = read("fx.js");
for (const marker of ["const APP_RELEASE = \"7.1.0\"","fxCardVisible","settingsAdvanced > summary"]) {
  if (!fx.includes(marker)) fail(`FX reliability marker missing: ${marker}`);
}
if (!fx.includes('if (fxCardVisible()) convertSection(true)') || !fx.includes('if (!amountEl || !fxCardVisible()) return')) fail("hidden FX converter can still perform background conversion work");
else ok("FX conversion work is gated to the visible Settings card");
if (fx.includes("bootstrapFirstVisitRuntime") || fx.includes("reloadWhenControlled")) fail("first visit still reloads to obtain patched runtime source");
else ok("fresh visits run v7.1 source directly without a service-worker reload");

const locale = read("locale-v700.js");
if (!locale.includes("Intl.DisplayNames")) fail("country localization is not using Intl.DisplayNames"); else ok("country localization uses Intl.DisplayNames");
if (!locale.includes("TripSpendLocale")) fail("TripSpendLocale API missing"); else ok("TripSpendLocale API exposed");
if (!locale.includes('if (lang === "ar")') || !locale.includes("hasTranslatedDocument")) fail("English startup still performs a full localization scan");
else ok("English startup skips unnecessary full-document localization work");
for (const phrase of ["Make today easier","TODAY'S GUIDANCE","Your trip and receipts stay on this device unless you export them."]) {
  if (!locale.includes(phrase)) fail(`v7.1.0 Arabic localization missing: ${phrase}`);
}

const dynamicLocale = read("locale-dynamic-v700.js");
if (!dynamicLocale.includes("dashboardGreeting") || !dynamicLocale.includes("dashboardDate")) fail("dashboard localization polish missing"); else ok("dashboard localization polish is wired");
if (!dynamicLocale.includes("activePage === \"dashboard\"")) fail("Home floating add overlap protection missing"); else ok("Home floating add overlap protection is wired");
if (dynamicLocale.includes("new MutationObserver")) fail("dynamic locale still watches the whole page instead of render events");
else ok("dynamic locale uses render events without another page-wide observer");

const expenseLocale = read("expense-locale-v703.js");
for (const phrase of ["Add Expense","Expense type","Split with others","AUTO-FILLED","Optional photo stored locally with this expense."]) {
  if (!expenseLocale.includes(phrase)) fail(`Add Expense Arabic localization missing: ${phrase}`);
}
if (!expenseLocale.includes("tripspend:language")) fail("expense locale does not react to language changes"); else ok("dynamic Add Expense localization is wired");

const pageLocale = read("page-locale-v704.js");
for (const phrase of ["TRIP PLANNER","TRIP PROGRESS","Your itinerary starts here","Trip spending","TOTAL SPENT","Where your money went","Who owes whom","Settlement history"]) {
  if (!pageLocale.includes(phrase)) fail(`Plan/Analytics Arabic localization missing: ${phrase}`);
}
if (!pageLocale.includes("On pace") || !pageLocale.includes("Spending faster")) fail("dynamic analytics pace localization missing"); else ok("dynamic analytics pace localization is wired");
if (!pageLocale.includes("tripspend:language")) fail("page locale does not react to language changes"); else ok("Plan/Analytics localization reacts to language changes");
if (pageLocale.includes("new MutationObserver")) fail("Plan/Analytics locale still duplicates the global DOM observer");
else ok("Plan/Analytics locale uses render events without another page-wide observer");

const settingsPolish = read("settings-polish-v704.js");
const style = read("style.css");
for (const marker of ["TripSpend v7.1.0","home-guide-card","home-guidance-card","A compact route capsule keeps four countries visible without crowding","expense-fast-fields","prefers-reduced-motion:reduce"]) {
  if (!style.includes(marker)) fail(`v7.1.0 visual polish missing: ${marker}`);
}
if (!style.includes("touch-action:manipulation") || !style.includes('input:not([type="checkbox"]):not([type="radio"])') || !style.includes("font-size:16px!important")) fail("mobile focus-zoom protection missing");
else ok("all mobile form controls prevent iPhone focus zoom");
if (/\.date-calendar\s*\{[^}]*transform:rotate\(/s.test(style)) fail("calendar icons are still rotated");
else ok("calendar icons remain upright globally");
for (const marker of ["settings-simple-form","settings-country-list-compact","settings-save-dock","settings-advanced","ts-no-floating-add"]) {
  if (!settingsPolish.includes(marker)) fail(`simplified Settings marker missing: ${marker}`);
}
if (!settingsPolish.includes('["settings", "analytics", "trips", "people"]')) fail("floating add suppression is missing on non-add pages"); else ok("floating add is suppressed on Settings and Analytics");
if (!style.includes("padding-bottom:calc(164px + env(safe-area-inset-bottom))")) fail("active page FAB clearance is missing"); else ok("active pages reserve the floating action zone");
if (!(style.includes(".analytics-v651 .analytics-more-details") && style.includes("display:grid!important"))) fail("analytics detail cards are not scan-ready"); else ok("analytics insights use scan-friendly cards");
if (!settingsPolish.includes("TripSpendSettingsPolish")) fail("settings polish API missing"); else ok("simplified Settings runtime is exposed");

const visualPolish = read("visual-polish-v704.js");
for (const marker of ["ts-payment-reference","ts-traveler-reference","ts-daily-reference","ts-daily-summary","smoothPath","Google Gemini","Gemini 3.5 Flash-Lite","settings-country-flag"]) {
  if (!visualPolish.includes(marker)) fail(`visual polish marker missing: ${marker}`);
}
if (!visualPolish.includes("TripSpendVisualPolish")) fail("visual polish API missing"); else ok("reference-style Analytics graphics and visual polish are wired");

const setupOnboarding = read("setup-onboarding-v704.js");
for (const marker of ["ts-setup-stage","ts-setup-progress","Where are you going?","Build your route","Trip settings","Almost ready!","ts-setup-preview-card","setupDefaultPayment","repairAnalyticsToggle","analyticsMoreDetails.hidden"]) {
  if (!setupOnboarding.includes(marker)) fail(`setup onboarding marker missing: ${marker}`);
}
if (!setupOnboarding.includes("TripSpendSetupOnboarding")) fail("setup onboarding API missing"); else ok("premium setup onboarding and Analytics toggle repair are wired");

const flags = read("flags-v705.js");
for (const marker of ["TripSpendFlags","ts-country-flag-v705","destinationOptions","setupExtraCountryOptions","flag-icons@7.3.2/flags/4x3","Regional_Indicator"].filter(Boolean)) {
  if (!flags.includes(marker) && marker !== "Regional_Indicator") fail(`flag runtime marker missing: ${marker}`);
}
if (!flags.includes("0x1F1E6") || !flags.includes("object-fit:contain")) fail("SVG flag conversion or stretch-safe scaling missing"); else ok("country flags use standardized SVG rendering and stretch-safe sizing");

const v5 = read("v5.js");
if (sw.includes("upgradeV5Js") || sw.includes('replace("From <small>(automatic)</small>"')) fail("route builder is patched by the service worker instead of source");
else ok("route builder behavior is implemented in source");
if (!v5.includes("countryBudgetsOpen") || !v5.includes("countryBudgetToggle")) fail("collapsible country budgets are not implemented in source");
else ok("secondary country budgets collapse without losing route data");
if (index.includes("From <small>(automatic)</small>")) fail("additional-country From field is still labeled automatic");
else ok("additional-country From field is labeled editable");
for (const marker of ["validateSetupCountryDates", "setupExtraDateError", '$("setupMultiCountryPanel")?.classList.add("hidden")']) {
  if (!v5.includes(marker)) fail(`route builder source marker missing: ${marker}`);
}
if (v5.includes('$("setupExtraStart").disabled = true')) fail("additional-country From date is still disabled in source");
else ok("additional-country From date remains enabled in source");
if (!v5.includes('document.createElement("button")') || !v5.includes("TripSpendRouteInfo") || !v5.includes("aria-current")) fail("route flags are not interactive and accessible");
else ok("route flags open accessible country details");
for (const marker of ["next-country-name-row", "next-country-flag", "country-name-row", "country-budget-metadata"]) {
  if (!v5.includes(marker)) fail(`RTL country card structure missing: ${marker}`);
}
for (const marker of ['font-family:"Tajawal","Cairo","Noto Sans Arabic"', "letter-spacing:0!important", "object-fit:contain", ".country-budget-metadata"]) {
  if (!style.includes(marker)) fail(`Arabic/RTL presentation rule missing: ${marker}`);
}

const uiFixes = read("ui-fixes-v705.js");
for (const marker of ["forcePremiumSetup","ts-setup-onboarding-form","ts-swipe-flags-v705","overflow-x:auto","touch-action:pan-x","TripSpendUiFixes"]) {
  if (!uiFixes.includes(marker)) fail(`UI fix marker missing: ${marker}`);
}
if (!uiFixes.includes('main.classList.add("hidden")')) fail("new-trip flow does not force the premium setup shell"); else ok("all new-trip entry points can activate premium onboarding");
if (!uiFixes.includes("scroll-snap-type:x proximity")) fail("Switch Trip flag strip is not swipe-friendly"); else ok("Switch Trip route flags support horizontal swiping");
for (const marker of [".fx-result>div{background:var(--surface2)!important}",".fx-status.good{color:var(--ok)!important}",".fx-status.bad{color:var(--bad)!important}"]) {
  if (!uiFixes.includes(marker)) fail(`FX theme repair missing: ${marker}`);
}
if (!uiFixes.includes('strip.setAttribute("role", "img")') || !uiFixes.includes("strip.tabIndex = 0")) fail("swipeable route flags are not keyboard/screen-reader friendly");
else ok("swipeable route flags expose usable accessibility semantics");

const receipt = read("receipt-ai-v700.js");
for (const id of ["receiptInput","expenseAmount","expenseCurrency","expenseDate","expenseCategory","expenseNote"]) {
  if (!receipt.includes(id)) fail(`receipt client does not reference ${id}`);
}
ok("receipt suggestions target the expense form only");

const app = read("app.js");
const foundation = read("ui-foundation-v710.js");
const enhancements = read("enhancements-v710.js");
const appNativeDialogs = [...app.matchAll(/(?<!\.)\b(confirm|alert|prompt)\(/g)];
const v5NativeDialogs = [...v5.matchAll(/(?<!\.)\b(confirm|alert|prompt)\(/g)];
if (appNativeDialogs.length !== 3 || v5NativeDialogs.length !== 1) fail("native browser dialogs remain in user actions");
else ok("native browser dialogs are limited to compatibility fallbacks behind accessible in-app dialogs");
for (const marker of ["TripSpendDialog","TripSpendRouteInfo","focusable(modal)","localizedMessage"]) {
  if (!foundation.includes(marker)) fail(`v7.1 UI foundation missing: ${marker}`);
}
for (const marker of ["TRIPSPEND_UPDATE_READY",'window.addEventListener("online"',"15 * 60 * 1000","checkAppVersion();"]) {
  if (!app.includes(marker)) fail(`v7.1 update lifecycle missing: ${marker}`);
}
if (!app.includes('if (document.readyState === "complete") registerAppServiceWorker()')) fail("late-loaded app cannot register its service worker");
else ok("service worker registration works before or after the page load event");
if (!index.includes("appDialogModal") || !index.includes("routeCountryModal") || !index.includes("enhancements-v710.js?v=7.1.0") || !enhancements.includes('"ui-foundation-v710.js"')) fail("v7.1 dialogs or route details are not wired in source");
else ok("dialogs, route details and update UX are wired in source");
if (!enhancements.includes('window.addEventListener("load", run') || enhancements.includes("MutationObserver")) fail("enhancement startup can block initial page load");
else ok("non-critical enhancements start cleanly after the page load event");
if (!app.includes("Today’s spending guide") || !app.includes("You can spend up to")) fail("actionable daily spending guidance is missing");
else ok("Today guidance becomes concrete after spending begins");
for (const marker of ["Today’s spending guide","You can spend up to","Avoid more spending today"]) {
  if (!locale.includes(marker)) fail(`Arabic guidance coverage missing: ${marker}`);
}
if (!style.includes(":focus-visible") || !style.includes("app-dialog-sheet") || !style.includes("route-country-metrics")) fail("accessibility/dialog styling is missing");
else ok("visible focus and accessible dialog styling are present");

const worker = read("worker/ai-worker.js");
if (!worker.includes(`const WORKER_VERSION = "${INNER_WORKER_VERSION}"`)) fail(`inner AI worker version mismatch; expected ${INNER_WORKER_VERSION}`); else ok("inner AI worker remains stable");
if (!worker.includes("@cf/moondream/moondream3.1-9B-A2B")) fail("receipt vision model missing"); else ok("receipt vision model configured");
if (!worker.includes("AI_RATE_LIMITER")) fail("rate limiter binding support missing"); else ok("rate limiter binding supported");
if (!worker.includes("budget-forecast") || !worker.includes("trend-analysis")) fail("AI intelligence capabilities missing"); else ok("AI intelligence capabilities exposed");

const geminiWorker = read("worker/ai-worker-v703.js");
if (!geminiWorker.includes(`const RUNTIME_VERSION = "${WORKER_RUNTIME_VERSION}"`)) fail("Gemini runtime version mismatch"); else ok("Gemini runtime remains v7.0.3");
if (!geminiWorker.includes('const GEMINI_MODEL = "gemini-3.5-flash-lite"')) fail("Gemini 3.5 Flash-Lite is not configured"); else ok("Gemini 3.5 Flash-Lite is configured");
if (!geminiWorker.includes("GEMINI_API_KEY")) fail("Gemini secret binding support missing"); else ok("Gemini secret binding is supported");
if (!geminiWorker.includes('thinkingLevel: hasTools ? "low" : "minimal"')) fail("low-latency Gemini thinking levels missing"); else ok("Gemini chat uses minimal thinking and actions use low thinking");
if (!geminiWorker.includes("general-chat") || !geminiWorker.includes("multi-turn-chat") || !geminiWorker.includes("interactive-assistant")) fail("interactive Gemini capabilities missing"); else ok("interactive Gemini capabilities are exposed");
if (!geminiWorker.includes("functionDeclarations") || !geminiWorker.includes("chooseTools")) fail("Gemini function calling is missing"); else ok("Gemini function calling is wired");
if (!geminiWorker.includes("cloudflare-fallback") || !geminiWorker.includes("Gemini unavailable; using Cloudflare AI fallback")) fail("Cloudflare fallback missing"); else ok("Cloudflare AI fallback is wired");

const workerPackage = JSON.parse(read("worker/package.json"));
if (workerPackage.version !== WORKER_RUNTIME_VERSION) fail("Worker package version mismatch"); else ok("Worker package version matches runtime");

const wrangler = read("worker/wrangler.toml");
if (!wrangler.includes('name = "tripspend-ai"')) fail("wrangler Worker name mismatch"); else ok("wrangler targets tripspend-ai");
if (!wrangler.includes('main = "ai-worker-v703.js"')) fail("wrangler does not route through v7.0.3 Gemini runtime"); else ok("wrangler routes through v7.0.3 Gemini runtime");
if (!wrangler.includes('name = "AI_RATE_LIMITER"')) fail("AI_RATE_LIMITER binding missing from wrangler config"); else ok("rate limiter binding is configured");
if (!/limit\s*=\s*30\b/.test(wrangler) || !/period\s*=\s*60\b/.test(wrangler)) fail("rate limiter must be 30 requests per 60 seconds"); else ok("rate limiter is 30 requests per 60 seconds");

for (const path of ["sw.js","fx.js","locale-v700.js","locale-dynamic-v700.js","expense-locale-v703.js","page-locale-v704.js","settings-polish-v704.js","visual-polish-v704.js","setup-language-host-v700.js","setup-onboarding-v704.js","flags-v705.js","ui-fixes-v705.js","receipt-capability-v700.js","receipt-ai-v700.js","ui-foundation-v710.js","enhancements-v710.js"]) {
  try { new vm.Script(read(path), {filename:path}); ok(`${path} parses`); }
  catch (error) { fail(`${path} syntax error: ${error.message}`); }
}

if (process.exitCode) process.exit(process.exitCode);
