const { test, expect } = require("@playwright/test");

function seededTrip() {
  const now = Date.now();
  return {
    trip:{id:"trip-long-route",name:"Long Route",destination:"Germany",startDate:"2026-08-12",endDate:"2026-08-28",budget:1500,homeCurrency:"OMR",tripCurrency:"EUR",defaultPayment:"Credit Card"},
    expenses:[],rates:{},
    people:[{id:"me",name:"Me",active:true,createdAt:now}],
    stops:[
      {id:"de",country:"Germany",startDate:"2026-08-12",endDate:"2026-08-14",currency:"EUR",budget:0,createdAt:now},
      {id:"at",country:"Austria",startDate:"2026-08-14",endDate:"2026-08-16",currency:"EUR",budget:0,createdAt:now+1},
      {id:"it",country:"Italy",startDate:"2026-08-16",endDate:"2026-08-18",currency:"EUR",budget:0,createdAt:now+2},
      {id:"fr",country:"France",startDate:"2026-08-18",endDate:"2026-08-20",currency:"EUR",budget:0,createdAt:now+3},
      {id:"es",country:"Spain",startDate:"2026-08-20",endDate:"2026-08-22",currency:"EUR",budget:0,createdAt:now+4},
      {id:"pt",country:"Portugal",startDate:"2026-08-22",endDate:"2026-08-24",currency:"EUR",budget:0,createdAt:now+5},
      {id:"ch",country:"Switzerland",startDate:"2026-08-24",endDate:"2026-08-28",currency:"CHF",budget:0,createdAt:now+6}
    ],
    plans:[],itinerary:[],settlements:[],tripHistory:[],preferences:{}
  };
}

async function boot(page) {
  await page.addInitScript(value => localStorage.setItem("tripspend.v1", JSON.stringify(value)), seededTrip());
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

test("Switch Trip flags swipe horizontally and Start New Trip uses premium onboarding", async ({ page }) => {
  await boot(page);

  await page.locator("#tripSwitcherTrigger").click();
  await expect(page.locator("#tripSwitcherModal")).not.toHaveClass(/hidden/);

  const strip = page.locator("#tripSwitcherModal .trip-switcher-flags");
  await expect(strip).toHaveClass(/ts-swipe-flags-v705/);
  await expect(strip.locator(".ts-country-flag-v705")).toHaveCount(7);

  const metrics = await strip.evaluate(el => ({
    clientWidth:Math.round(el.clientWidth),
    scrollWidth:Math.round(el.scrollWidth),
    overflowX:getComputedStyle(el).overflowX,
    touchAction:getComputedStyle(el).touchAction
  }));
  expect(metrics.scrollWidth).toBeGreaterThan(metrics.clientWidth);
  expect(metrics.overflowX).toBe("auto");
  expect(metrics.touchAction).toContain("pan-x");

  const didScroll = await strip.evaluate(el => {
    el.scrollLeft = 1000;
    return el.scrollLeft > 0;
  });
  expect(didScroll).toBe(true);

  page.once("dialog", dialog => dialog.accept());
  await page.locator("#tripSwitcherNewBtn").click();

  await expect(page.locator("#setupView")).not.toHaveClass(/hidden/);
  await expect(page.locator("#setupForm")).toHaveClass(/ts-setup-onboarding-form/);
  await expect(page.locator(".ts-setup-stage")).toBeVisible();
  await expect(page.locator(".ts-setup-progress")).toBeVisible();
  await expect(page.locator("#mainView")).toHaveClass(/hidden/);
  await expect(page.locator("body")).toHaveClass(/ts-setup-onboarding-active/);
});
