import fs from "node:fs";
import vm from "node:vm";

const VERSION = "7.0.4";
const INNER_WORKER_VERSION = "7.0.0";
const WORKER_RUNTIME_VERSION = "7.0.3";
const read = path => fs.readFileSync(path,"utf8");
const fail = message => { console.error(`✗ ${message}`); process.exitCode = 1; };
const ok = message => console.log(`✓ ${message}`);

const version = JSON.parse(read("version.json"));
if (version.version !== VERSION) fail(`version.json is ${version.version}, expected ${VERSION}`); else ok("version.json matches app release");

const manifest = JSON.parse(read("manifest.webmanifest"));
if (!String(manifest.name).includes(VERSION)) fail(`manifest name does not include ${VERSION}`); else ok("manifest matches app release");

const sw = read("sw.js");
if (!sw.includes(`const APP_VERSION = "${VERSION}"`)) fail("service worker version mismatch"); else ok("service worker version matches");
if (!sw.includes("locale-v700.js") || !sw.includes("receipt-ai-v700.js") || !sw.includes("expense-locale-v703.js") || !sw.includes("page-locale-v704.js")) fail("v7 runtime modules missing from service worker"); else ok("v7 runtime modules are wired");
if (!sw.includes("upgradeLocaleJs")) fail("locale release is not synchronized by service worker"); else ok("locale release is synchronized by service worker");

const shellMatch = sw.match(/const APP_SHELL = \[([\s\S]*?)\];/);
const shell = shellMatch?.[1] || "";
for (const old of ["i18n.js","i18n-layout-fix.js","i18n-audit-v690.js","rtl-polish-v687.js","lang-flag.js","setup-lang-v688.js","budget-labels-v689.js","expense-ar-v691.js"]) {
  if (shell.includes(`./${old}`)) fail(`retired runtime ${old} is still in APP_SHELL`);
}
ok("legacy localization patches are retired from APP_SHELL");

const locale = read("locale-v700.js");
if (!locale.includes("Intl.DisplayNames")) fail("country localization is not using Intl.DisplayNames"); else ok("country localization uses Intl.DisplayNames");
if (!locale.includes("TripSpendLocale")) fail("TripSpendLocale API missing"); else ok("TripSpendLocale API exposed");

const dynamicLocale = read("locale-dynamic-v700.js");
if (!dynamicLocale.includes("dashboardGreeting") || !dynamicLocale.includes("dashboardDate")) fail("dashboard localization polish missing"); else ok("dashboard localization polish is wired");
if (!dynamicLocale.includes("activePage === \"dashboard\"")) fail("Home floating add overlap protection missing"); else ok("Home floating add overlap protection is wired");

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

const receipt = read("receipt-ai-v700.js");
for (const id of ["receiptInput","expenseAmount","expenseCurrency","expenseDate","expenseCategory","expenseNote"]) {
  if (!receipt.includes(id)) fail(`receipt client does not reference ${id}`);
}
ok("receipt suggestions target the expense form only");

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

for (const path of ["sw.js","locale-v700.js","locale-dynamic-v700.js","expense-locale-v703.js","page-locale-v704.js","setup-language-host-v700.js","receipt-capability-v700.js","receipt-ai-v700.js"]) {
  try { new vm.Script(read(path), {filename:path}); ok(`${path} parses`); }
  catch (error) { fail(`${path} syntax error: ${error.message}`); }
}

if (process.exitCode) process.exit(process.exitCode);
