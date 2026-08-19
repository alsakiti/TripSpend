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

test("first visit upgrades through the service worker without blocking page load", () => {
  const fx = fs.readFileSync("fx.js", "utf8");
  expect(fx).toContain('const FIRST_LOAD_RUNTIME = "tripspend:first-load-runtime"');
  expect(fx).toContain('navigator.serviceWorker.addEventListener("controllerchange", reloadWhenControlled');
  expect(fx).toContain("location.reload()");
  expect(fx).toContain("appState()?.trip");
  expect(fx).not.toContain("loadRuntimeScript(");
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

test("v7.0.9 cache revision serves FX network-first", async ({ page }) => {
  await bootControlled(page);
  const sw = await page.evaluate(async () => await (await fetch("./sw.js?health=1", {cache:"no-store"})).text());
  expect(sw).toContain('const CACHE = `tripspend-v${APP_VERSION}-r2`');
  expect(sw).toContain('if (path.endsWith("/fx.js"))');
  expect(sw).toContain('event.respondWith(networkFirst(request));');
});
