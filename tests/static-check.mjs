import fs from "node:fs";
import vm from "node:vm";

const VERSION = "7.0.0";
const read = path => fs.readFileSync(path,"utf8");
const fail = message => { console.error(`✗ ${message}`); process.exitCode = 1; };
const ok = message => console.log(`✓ ${message}`);

const version = JSON.parse(read("version.json"));
if (version.version !== VERSION) fail(`version.json is ${version.version}, expected ${VERSION}`); else ok("version.json matches v7");

const manifest = JSON.parse(read("manifest.webmanifest"));
if (!String(manifest.name).includes(VERSION)) fail("manifest name does not include v7.0.0"); else ok("manifest matches v7");

const sw = read("sw.js");
if (!sw.includes(`const APP_VERSION = "${VERSION}"`)) fail("service worker version mismatch"); else ok("service worker version matches");
if (!sw.includes("locale-v700.js") || !sw.includes("receipt-ai-v700.js")) fail("v7 runtime modules missing from service worker"); else ok("v7 runtime modules are wired");

const shellMatch = sw.match(/const APP_SHELL = \[([\s\S]*?)\];/);
const shell = shellMatch?.[1] || "";
for (const old of ["i18n.js","i18n-layout-fix.js","i18n-audit-v690.js","rtl-polish-v687.js","lang-flag.js","setup-lang-v688.js","budget-labels-v689.js","expense-ar-v691.js"]) {
  if (shell.includes(`./${old}`)) fail(`retired runtime ${old} is still in APP_SHELL`);
}
ok("legacy localization patches are retired from APP_SHELL");

const locale = read("locale-v700.js");
if (!locale.includes("Intl.DisplayNames")) fail("country localization is not using Intl.DisplayNames"); else ok("country localization uses Intl.DisplayNames");
if (!locale.includes("TripSpendLocale")) fail("TripSpendLocale API missing"); else ok("TripSpendLocale API exposed");

const receipt = read("receipt-ai-v700.js");
for (const id of ["receiptInput","expenseAmount","expenseCurrency","expenseDate","expenseCategory","expenseNote"]) {
  if (!receipt.includes(id)) fail(`receipt client does not reference ${id}`);
}
ok("receipt suggestions target the expense form only");

const worker = read("worker/ai-worker.js");
if (!worker.includes(`const WORKER_VERSION = "${VERSION}"`)) fail("AI worker version mismatch"); else ok("AI worker version matches");
if (!worker.includes("@cf/moondream/moondream3.1-9B-A2B")) fail("receipt vision model missing"); else ok("receipt vision model configured");
if (!worker.includes("AI_RATE_LIMITER")) fail("rate limiter binding support missing"); else ok("rate limiter binding supported");
if (!worker.includes("budget-forecast") || !worker.includes("trend-analysis")) fail("AI intelligence capabilities missing"); else ok("AI intelligence capabilities exposed");

for (const path of ["sw.js","locale-v700.js","receipt-ai-v700.js"]) {
  try { new vm.Script(read(path), {filename:path}); ok(`${path} parses`); }
  catch (error) { fail(`${path} syntax error: ${error.message}`); }
}

if (process.exitCode) process.exit(process.exitCode);
