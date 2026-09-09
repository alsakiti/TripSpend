import { access, copyFile, cp, mkdir, readFile, rm } from "node:fs/promises";

const requiredFiles = [
  "index.html",
  "style.css",
  "dashboard.css",
  "app.js",
  "fx.js",
  "v5.js",
  "ai-v684.js",
  "locale-v700.js",
  "locale-dynamic-v700.js",
  "expense-locale-v703.js",
  "page-locale-v704.js",
  "settings-polish-v704.js",
  "visual-polish-v704.js",
  "setup-language-host-v700.js",
  "setup-onboarding-v704.js",
  "flags-v705.js",
  "ui-fixes-v705.js",
  "receipt-capability-v700.js",
  "receipt-ai-v700.js",
  "ui-foundation-v710.js",
  "ai-intelligence-v720.js",
  "enhancements-v710.js",
  "sw.js",
  "manifest.webmanifest",
  "version.json",
  "ai-config.json"
];

const pkg = JSON.parse(await readFile("package.json", "utf8"));

for (const file of requiredFiles) {
  await access(file).catch(() => {
    throw new Error(`Missing required app asset: ${file}`);
  });
}

await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });

for (const file of requiredFiles) {
  await copyFile(file, `dist/${file}`);
}
await cp("icons", "dist/icons", { recursive: true });

console.log(`TripSpend v${pkg.version} Capacitor bundle complete.`);
