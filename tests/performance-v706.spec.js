const { test, expect } = require("@playwright/test");

function seedTrip() {
  const now = Date.now();
  return {
    trip:{id:"perf-trip",name:"Performance Trip",destination:"Germany",startDate:"2026-08-12",endDate:"2026-08-22",budget:1000,homeCurrency:"OMR",tripCurrency:"EUR",defaultPayment:"Credit Card"},
    expenses:[{id:"e1",amount:12,currency:"OMR",rate:1,homeAmount:12,category:"Food",paymentMethod:"Credit Card",date:"2026-08-17",note:"Dinner",personShares:[{personId:"me",amount:12}],paidByPersonId:"me",stopId:"de",expenseType:"personal",createdAt:now}],
    rates:{},
    people:[{id:"me",name:"Me",active:true,createdAt:now}],
    stops:[{id:"de",country:"Germany",startDate:"2026-08-12",endDate:"2026-08-22",currency:"EUR",budget:1000,createdAt:now}],
    plans:[],itinerary:[],settlements:[],tripHistory:[],preferences:{}
  };
}

async function boot(page) {
  await page.addInitScript(value => localStorage.setItem("tripspend.v1", JSON.stringify(value)), seedTrip());
  await page.goto("/");
  await page.evaluate(async () => {
    if (!("serviceWorker" in navigator)) return;
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise(resolve => navigator.serviceWorker.addEventListener("controllerchange", resolve, { once:true }));
    }
  });
  await page.reload();
  await page.waitForSelector("#mainView:not(.hidden)");
}

test("v7.0.7 defers non-visible UI work and serves optimized runtimes", async ({ page }) => {
  await boot(page);

  // Settings should not restructure hidden DOM during Home startup.
  await expect(page.locator("#settingsForm")).not.toHaveClass(/settings-simple-form/);

  const runtimes = await page.evaluate(async () => {
    const names = ["app.js","visual-polish-v704.js","settings-polish-v704.js","flags-v705.js","ui-fixes-v705.js","setup-onboarding-v704.js","receipt-ai-v700.js"];
    const out = {};
    for (const name of names) out[name] = await (await fetch(`./${name}?perf=${Date.now()}`, {cache:"no-store"})).text();
    return out;
  });

  expect(runtimes["app.js"]).toContain('const APP_VERSION = "7.0.7"');
  expect(runtimes["app.js"]).toContain("const STORAGE_SAVE_DELAY = 220;");
  expect(runtimes["app.js"]).toContain("requestIdleCallback(runDeferredSettingsWork");

  expect(runtimes["visual-polish-v704.js"]).toContain('const RELEASE = "7.0.7"');
  expect(runtimes["visual-polish-v704.js"]).toContain('active === "analytics"');
  expect(runtimes["visual-polish-v704.js"]).toContain("tsV706Signature");
  expect(runtimes["visual-polish-v704.js"]).not.toContain("window.setTimeout(polish, 1100)");

  expect(runtimes["settings-polish-v704.js"]).not.toContain("installStyles();\n    buildSettings();\n    syncPageMode();");
  expect(runtimes["flags-v705.js"]).not.toContain('window.addEventListener("tripspend:render", scheduleUpgrade);');
  expect(runtimes["ui-fixes-v705.js"]).not.toContain("observer.observe(document.body");
  expect(runtimes["ui-fixes-v705.js"]).toContain("observeChildren");
  expect(runtimes["setup-onboarding-v704.js"]).toContain("afterChangeTimer");
  expect(runtimes["receipt-ai-v700.js"]).toContain("canvas.toBlob");
  expect(runtimes["receipt-ai-v700.js"]).toContain("1280 : 1440");
  expect(runtimes["receipt-ai-v700.js"]).not.toContain('canvas.toDataURL("image/jpeg",0.82)');

  await page.locator('.nav-btn[data-page="settings"]').click();
  await expect(page.locator("#settings")).toHaveClass(/active/);
  await expect(page.locator("#settingsForm")).toHaveClass(/settings-simple-form/);
});
