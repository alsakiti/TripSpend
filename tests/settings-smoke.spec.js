const { test, expect } = require("@playwright/test");

function seedTripState() {
  return {
    trip:{
      id:"trip-settings",name:"Europe",destination:"Germany",
      startDate:"2026-08-12",endDate:"2026-08-22",budget:1000,
      homeCurrency:"OMR",tripCurrency:"EUR",defaultPayment:"Credit Card"
    },
    expenses:[],rates:{},
    people:[{id:"person-me",name:"Me",active:true,createdAt:Date.now()}],
    stops:[
      {id:"de",country:"Germany",startDate:"2026-08-12",endDate:"2026-08-18",currency:"EUR",budget:0,createdAt:Date.now()},
      {id:"at",country:"Austria",startDate:"2026-08-18",endDate:"2026-08-20",currency:"EUR",budget:0,createdAt:Date.now()},
      {id:"it",country:"Italy",startDate:"2026-08-20",endDate:"2026-08-22",currency:"EUR",budget:0,createdAt:Date.now()}
    ],
    plans:[],itinerary:[],settlements:[],tripHistory:[],preferences:{}
  };
}

async function boot(page) {
  await page.addInitScript(value => localStorage.setItem("tripspend.v1", JSON.stringify(value)), seedTripState());
  await page.goto("/");
  await page.evaluate(async () => {
    if (!("serviceWorker" in navigator)) return;
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise(resolve => navigator.serviceWorker.addEventListener("controllerchange", resolve, {once:true}));
    }
  });
  await page.reload();
  await page.waitForSelector("#mainView:not(.hidden)");
}

test("Settings is simplified and floating add does not cover Settings or Analytics", async ({ page }) => {
  await boot(page);

  await page.locator('.nav-btn[data-page="settings"]').click();
  await expect(page.locator("#settings")).toHaveClass(/active/);
  await expect(page.locator("#settingsForm")).toHaveClass(/settings-simple-form/);
  await expect(page.locator("#settingsBasicPanel")).toBeVisible();
  await expect(page.locator("#settingsCountriesPanel")).toBeVisible();
  await expect(page.locator("#settingsBudgetPanel")).toBeVisible();
  await expect(page.locator("#settingsCountryListCompact .settings-country-row")).toHaveCount(3);
  await expect(page.locator(".settings-legacy-destination")).toBeHidden();
  await expect(page.locator(".settings-save-dock")).toBeVisible();
  await expect(page.locator("#settingsAdvanced")).toBeVisible();
  await expect(page.locator("#navAdd")).toBeHidden();
  await expect(page.locator("body")).toHaveClass(/ts-page-settings/);

  const settingsOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(settingsOverflow).toBeLessThanOrEqual(2);
  await page.screenshot({path:"test-results/settings-simplified.png",fullPage:true});

  await page.locator('.nav-btn[data-page="analytics"]').click();
  await expect(page.locator("#analytics")).toHaveClass(/active/);
  await expect(page.locator("#navAdd")).toBeHidden();
});
