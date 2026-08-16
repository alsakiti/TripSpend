import fs from "node:fs";
import vm from "node:vm";

const VERSION = "7.0.1";
const INNER_WORKER_VERSION = "7.0.0";
const WORKER_RUNTIME_VERSION = "7.0.1";
const read = path => fs.readFileSync(path,"utf8");
const fail = message => { console.error(`✗ ${message}`); process.exitCode = 1; };
const ok = message => console.log(`✓ ${message}`);

const version = JSON.parse(read("version.json"));
if (version.version !== VERSION) fail(`version.json is ${version.version}, expected ${VERSION}`); else ok("version.json matches app release");

const manifest = JSON.parse(read("manifest.webmanifest"));
if (!String(manifest.name).includes(VERSION)) fail(`manifest name does not include ${VERSION}`); else ok("manifest matches app release");

const sw = read("sw.js");
if (!sw.includes(`const APP_VERSION = "${VERSION}"`)) fail("service worker version mismatch"); else ok("service worker version matches");
if (!sw.includes("locale-v700.js") || !sw.includes("receipt-ai-v700.js")) fail("v7 runtime modules missing from service worker"); else ok("v7 runtime modules are wired");
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
if (!dynamicLocale.includes("dashboardGreeting") || !dynamicLocale.includes("dashboardDate")) fail("v7.0.1 dashboard localization polish missing"); else ok("dashboard localization polish is wired");
if (!dynamicLocale.includes("activePage === \"dashboard\"")) fail("Home floating add overlap protection missing"); else ok("Home floating add overlap protection is wired");

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

const workerCompat = read("worker/ai-worker-v701.js");
if (!workerCompat.includes(`const RUNTIME_VERSION = "${WORKER_RUNTIME_VERSION}"`)) fail("AI compatibility runtime version mismatch"); else ok("AI compatibility runtime is v7.0.1");
if (!workerCompat.includes("8001") || !workerCompat.includes("falling back to chat-only")) fail("Workers AI invalid-input fallback missing"); else ok("Workers AI invalid-input fallback is wired");
if (!workerCompat.includes("chooseTools") || !workerCompat.includes("normalizeChatResult")) fail("Workers AI tool/response compatibility helpers missing"); else ok("Workers AI tool and response compatibility is wired");

const workerPackage = JSON.parse(read("worker/package.json"));
if (workerPackage.version !== WORKER_RUNTIME_VERSION) fail("Worker package version mismatch"); else ok("Worker package version matches runtime");

const wrangler = read("worker/wrangler.toml");
if (!wrangler.includes('name = "tripspend-ai"')) fail("wrangler Worker name mismatch"); else ok("wrangler targets tripspend-ai");
if (!wrangler.includes('main = "ai-worker-v701.js"')) fail("wrangler does not route through AI compatibility layer"); else ok("wrangler routes through AI compatibility layer");
if (!wrangler.includes('name = "AI_RATE_LIMITER"')) fail("AI_RATE_LIMITER binding missing from wrangler config"); else ok("rate limiter binding is configured");
if (!/limit\s*=\s*30\b/.test(wrangler) || !/period\s*=\s*60\b/.test(wrangler)) fail("rate limiter must be 30 requests per 60 seconds"); else ok("rate limiter is 30 requests per 60 seconds");

for (const path of ["sw.js","locale-v700.js","locale-dynamic-v700.js","setup-language-host-v700.js","receipt-capability-v700.js","receipt-ai-v700.js"]) {
  try { new vm.Script(read(path), {filename:path}); ok(`${path} parses`); }
  catch (error) { fail(`${path} syntax error: ${error.message}`); }
}

if (process.exitCode) process.exit(process.exitCode);
