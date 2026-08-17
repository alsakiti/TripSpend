const { test, expect } = require("@playwright/test");

async function waitForServiceWorker(page) {
  await page.goto("/");
  await page.evaluate(async () => {
    if (!("serviceWorker" in navigator)) return;
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise(resolve => navigator.serviceWorker.addEventListener("controllerchange", resolve, { once:true }));
    }
  });
  await page.reload();
}

function seededTrip() {
  return {
    trip:{id:"trip-flags",name:"Europe",destination:"Germany",startDate:"2026-08-12",endDate:"2026-08-22",budget:1000,homeCurrency:"OMR",tripCurrency:"EUR",defaultPayment:"Credit Card"},
    expenses:[
      {id:"e1",amount:20,currency:"OMR",rate:1,homeAmount:20,category:"Food",paymentMethod:"Credit Card",date:"2026-08-17",note:"Dinner",expenseType:"personal",paidByPersonId:"me",stopId:"de",personShares:[{personId:"me",amount:20}],planId:"",receiptId:"",createdAt:1}
    ],
    rates:{},
    people:[{id:"me",name:"Me",active:true,createdAt:1}],
    stops:[
      {id:"de",country:"Germany",startDate:"2026-08-12",endDate:"2026-08-18",currency:"EUR",budget:0,createdAt:1},
      {id:"at",country:"Austria",startDate:"2026-08-18",endDate:"2026-08-20",currency:"EUR",budget:0,createdAt:2},
      {id:"it",country:"Italy",startDate:"2026-08-20",endDate:"2026-08-22",currency:"EUR",budget:0,createdAt:3}
    ],
    plans:[],itinerary:[],settlements:[],tripHistory:[],preferences:{}
  };
}

test("country picker renders real SVG flags instead of regional-letter glyphs", async ({ page }) => {
  await waitForServiceWorker(page);
  await expect(page.locator("#setupView")).toBeVisible();
  await expect(page.locator(".version-badge").first()).toHaveText("v7.0.5");

  await page.locator("#destination").fill("om");
  await expect(page.locator("#destinationOptions")).not.toHaveClass(/hidden/);

  const omanFlag = page.locator('#destinationOptions .ts-country-flag-v705[data-country-code="OM"]');
  await expect(omanFlag).toBeVisible();
  await expect(omanFlag.locator("img")).toHaveAttribute("src", /flag-icons@7\.3\.2\/flags\/4x3\/om\.svg$/);

  const box = await omanFlag.evaluate(el => {
    const r = el.getBoundingClientRect();
    return { width:Math.round(r.width), height:Math.round(r.height) };
  });
  expect(box.width).toBeGreaterThanOrEqual(23);
  expect(box.width).toBeLessThanOrEqual(27);
  expect(box.height).toBeGreaterThanOrEqual(15);
  expect(box.height).toBeLessThanOrEqual(19);
});

test("Switch Trip flags share one consistent size", async ({ page }) => {
  await page.addInitScript(value => localStorage.setItem("tripspend.v1", JSON.stringify(value)), seededTrip());
  await waitForServiceWorker(page);
  await page.waitForSelector("#mainView:not(.hidden)");

  await page.locator("#tripSwitcherTrigger").click();
  await expect(page.locator("#tripSwitcherModal")).not.toHaveClass(/hidden/);

  const flags = page.locator("#tripSwitcherModal .ts-country-flag-v705");
  await expect.poll(async () => flags.count()).toBeGreaterThanOrEqual(3);

  const sizes = await flags.evaluateAll(elements => elements.slice(0, 3).map(el => {
    const r = el.getBoundingClientRect();
    return `${Math.round(r.width)}x${Math.round(r.height)}`;
  }));
  expect(new Set(sizes).size).toBe(1);

  const codes = await flags.evaluateAll(elements => elements.slice(0, 3).map(el => el.dataset.countryCode));
  expect(codes).toEqual(["DE","AT","IT"]);
});
