const { test, expect } = require("@playwright/test");

function tripState() {
  const now = Date.now();
  return {
    trip:{id:"foundation",name:"Europe",destination:"Germany",startDate:"2026-08-12",endDate:"2026-08-31",budget:2500,homeCurrency:"OMR",tripCurrency:"EUR",defaultPayment:"Credit Card"},
    expenses:[{id:"expense-1",amount:33.6,currency:"OMR",rate:1,homeAmount:33.6,category:"Food",paymentMethod:"Credit Card",date:"2026-08-19",note:"Dinner",expenseType:"personal",paidByPersonId:"me",stopId:"de",personShares:[{personId:"me",amount:33.6}],createdAt:now}],
    rates:{},plans:[],itinerary:[],settlements:[],tripHistory:[],
    people:[{id:"me",name:"Me",active:true,createdAt:now}],
    stops:[
      {id:"de",country:"Germany",startDate:"2026-08-12",endDate:"2026-08-22",currency:"EUR",budget:1000,createdAt:now},
      {id:"at",country:"Austria",startDate:"2026-08-23",endDate:"2026-08-25",currency:"EUR",budget:600,createdAt:now+1},
      {id:"it",country:"Italy",startDate:"2026-08-26",endDate:"2026-08-28",currency:"EUR",budget:500,createdAt:now+2},
      {id:"at-2",country:"Austria",startDate:"2026-08-29",endDate:"2026-08-31",currency:"EUR",budget:400,createdAt:now+3}
    ],
    preferences:{}
  };
}

async function boot(page) {
  await page.addInitScript(value => localStorage.setItem("tripspend.v1", JSON.stringify(value)), tripState());
  await page.goto("/");
  await page.evaluate(async () => {
    if (!("serviceWorker" in navigator)) return;
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) await new Promise(resolve => navigator.serviceWorker.addEventListener("controllerchange", resolve, {once:true}));
  });
  await page.reload();
  await page.waitForSelector("#mainView:not(.hidden)");
  await expect(page.locator(".version-badge").first()).toHaveText("v7.1.0");
}

function languageButton(page) {
  return page.locator("#languageToggleV7:visible, #setupLanguageToggleV7:visible");
}

test("guidance becomes concrete and route flags open useful country details", async ({ page }) => {
  await page.setViewportSize({width:390,height:844});
  await boot(page);

  await expect(page.locator("#healthTitle")).toHaveText("Today’s spending guide");
  await expect(page.locator("#healthText")).toContainText("You can spend up to");

  const flags = page.locator("#tripFlagRail .trip-flag");
  await expect(flags).toHaveCount(4);
  await expect(flags.first()).toHaveAttribute("aria-current", "step");
  await flags.first().click();
  await expect(page.locator("#routeCountryModal")).toBeVisible();
  await expect(page.locator("#routeCountryTitle")).toContainText("Germany");
  await expect(page.locator("#routeCountryBudget")).toContainText("1,000 OMR");
  await expect(page.locator("#routeCountrySpent")).toContainText("33.600 OMR");
  await expect(page.locator("#routeCountryModal")).toHaveAttribute("aria-modal", "true");
  await page.keyboard.press("Escape");
  await expect(page.locator("#routeCountryModal")).toBeHidden();
  await expect(flags.first()).toBeFocused();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
});

test("in-app dialogs replace browser popups and remain Arabic-safe", async ({ page }) => {
  await boot(page);
  await page.evaluate(() => {
    window.confirm = () => { throw new Error("native confirm must not be used"); };
    window.__dialogResult = null;
    void window.TripSpendDialog.confirm("Clear all remembered exchange rates?", {danger:true,confirmText:"Clear"}).then(value => { window.__dialogResult = value; });
  });
  await expect(page.locator("#appDialogModal")).toBeVisible();
  await expect(page.locator("#appDialogConfirm")).toHaveText("Clear");
  await page.locator("#appDialogCancel").click();
  await expect.poll(() => page.evaluate(() => window.__dialogResult)).toBe(false);

  await languageButton(page).click();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await page.evaluate(() => { void window.TripSpendDialog.confirm("Clear all remembered exchange rates?", {danger:true,confirmText:"Clear"}); });
  await expect(page.locator("#appDialogMessage")).toHaveText("هل تريد مسح جميع أسعار الصرف المحفوظة؟");
  await expect(page.locator("#appDialogConfirm")).toHaveText("مسح");
  await expect(page.locator("#appDialogModal")).not.toContainText(/Clear all|Confirm deletion|Cancel/);
  await page.keyboard.press("Escape");
  await expect(page.locator("#appDialogModal")).toBeHidden();
});

test("returning to the app surfaces a clear update banner", async ({ page }) => {
  let latest = "7.1.0";
  await page.route("**/version.json*", route => route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({version:latest,label:`TripSpend v${latest}`})}));
  await boot(page);
  latest = "7.1.1";
  await page.evaluate(() => window.dispatchEvent(new Event("online")));
  await expect(page.locator("#updateBanner")).toBeVisible();
  await expect(page.locator("#updateVersionText")).toContainText("v7.1.1 is ready");
  await expect(page.locator("#applyUpdateBtn")).toHaveText("Update now");
});
