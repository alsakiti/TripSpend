const { test, expect } = require("@playwright/test");
const fs = require("node:fs");

function seedTrip() {
  const now = Date.now();
  return {
    trip:{id:"reliability-trip",name:"Reliability Trip",destination:"Germany",startDate:"2026-08-12",endDate:"2026-08-22",budget:1000,homeCurrency:"OMR",tripCurrency:"EUR",defaultPayment:"Credit Card"},
    expenses:[],rates:{},
    people:[{id:"me",name:"Me",active:true,createdAt:now}],
    stops:[{id:"de",country:"Germany",startDate:"2026-08-12",endDate:"2026-08-22",currency:"EUR",budget:1000,createdAt:now}],
    plans:[],itinerary:[],settlements:[],tripHistory:[],preferences:{}
  };
}

async function bootControlled(page) {
  await page.clock.setFixedTime(new Date("2026-08-18T12:00:00Z"));
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

test("first visit runs the current source without a service-worker reload", () => {
  const fx = fs.readFileSync("fx.js", "utf8");
  const app = fs.readFileSync("app.js", "utf8");
  const index = fs.readFileSync("index.html", "utf8");
  expect(app).toContain('const APP_VERSION = "7.2.1"');
  expect(index).toContain('enhancements-v710.js?v=7.2.1');
  const enhancements = fs.readFileSync("enhancements-v710.js", "utf8");
  expect(enhancements).toContain('"app.js"');
  expect(enhancements).toContain('"ui-foundation-v710.js"');
  expect(enhancements).toContain('window.addEventListener("load", run');
  expect(fx).not.toContain("bootstrapFirstVisitRuntime");
  expect(fx).not.toContain("reloadWhenControlled");
});

test("hidden FX card does not make background rate requests", async ({ page }) => {
  let rateRequests = 0;
  await page.route("**/api.frankfurter.dev/**", async route => {
    rateRequests += 1;
    await route.fulfill({
      status:200,
      contentType:"application/json",
      body:JSON.stringify({ from:"OMR", to:"EUR", rate:2.35, date:"2026-08-18" })
    });
  });

  await bootControlled(page);
  await page.waitForTimeout(250);
  expect(rateRequests).toBe(0);

  await page.evaluate(() => window.dispatchEvent(new Event("online")));
  await page.waitForTimeout(120);
  expect(rateRequests).toBe(0);

  await page.locator('.nav-btn[data-page="settings"]').click();
  await expect(page.locator("#settings")).toHaveClass(/active/);
  await page.waitForTimeout(120);
  expect(rateRequests).toBe(0);

  const advanced = page.locator("#settingsAdvanced");
  await expect(advanced).toBeVisible();
  await advanced.locator(":scope > summary").click();
  await expect(advanced).toHaveAttribute("open", "");
  await expect.poll(() => rateRequests).toBeGreaterThan(0);

  const fxResultBackground = await page.locator(".fx-result > div").first().evaluate(el => getComputedStyle(el).backgroundColor);
  expect(fxResultBackground).not.toBe("rgba(0, 0, 0, 0)");
});

test("v7.2.1 cache revision serves source files stale-while-revalidate", async ({ page }) => {
  await bootControlled(page);
  const sw = await page.evaluate(async () => await (await fetch("./sw.js?health=1", {cache:"no-store"})).text());
  expect(sw).toContain('const CACHE = `tripspend-v${APP_VERSION}-r1`');
  expect(sw).toContain("staleWhileRevalidate");
  expect(sw).toContain("TRIPSPEND_UPDATE_READY");
  expect(sw).not.toContain("upgradeAppJs");
});
