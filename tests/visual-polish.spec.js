const { test, expect } = require("@playwright/test");

function seedState() {
  return {
    trip:{id:"trip-visual",name:"Europe",destination:"Germany",startDate:"2026-08-12",endDate:"2026-08-22",budget:1000,homeCurrency:"OMR",tripCurrency:"EUR",defaultPayment:"Credit Card"},
    expenses:[
      {id:"e1",amount:17.767,currency:"OMR",rate:1,homeAmount:17.767,category:"Food",paymentMethod:"Credit Card",date:"2026-08-12",note:"Lunch",expenseType:"personal",paidByPersonId:"me",stopId:"de",personShares:[{personId:"me",amount:17.767}],planId:"",receiptId:"",createdAt:1},
      {id:"e2",amount:12,currency:"OMR",rate:1,homeAmount:12,category:"Food",paymentMethod:"Cash",date:"2026-08-16",note:"Dinner",expenseType:"personal",paidByPersonId:"me",stopId:"de",personShares:[{personId:"me",amount:12}],planId:"",receiptId:"",createdAt:2},
      {id:"e3",amount:22,currency:"OMR",rate:1,homeAmount:22,category:"Food",paymentMethod:"Credit Card",date:"2026-08-17",note:"Shared meal",expenseType:"shared",paidByPersonId:"me",stopId:"de",personShares:[{personId:"me",amount:11},{personId:"hu",amount:11}],planId:"",receiptId:"",createdAt:3}
    ],
    rates:{},
    people:[{id:"me",name:"Me",active:true,createdAt:1},{id:"hu",name:"Hu",active:true,createdAt:2}],
    stops:[
      {id:"de",country:"Germany",startDate:"2026-08-12",endDate:"2026-08-18",currency:"EUR",budget:0,createdAt:1},
      {id:"at",country:"Austria",startDate:"2026-08-18",endDate:"2026-08-20",currency:"EUR",budget:0,createdAt:2},
      {id:"it",country:"Italy",startDate:"2026-08-20",endDate:"2026-08-22",currency:"EUR",budget:0,createdAt:3}
    ],
    plans:[],itinerary:[],settlements:[],tripHistory:[],preferences:{}
  };
}

async function boot(page) {
  await page.addInitScript(value => localStorage.setItem("tripspend.v1", JSON.stringify(value)), seedState());
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

async function openTab(page, label) {
  await page.evaluate(text => {
    [...document.querySelectorAll(".nav-btn")].find(el => el.textContent.trim() === text)?.click();
  }, label);
}

test("Analytics uses real graphical views and Settings shows Gemini with scaled flags", async ({ page }) => {
  await boot(page);

  await openTab(page, "Analytics");
  await expect(page.locator("#analytics")).toHaveClass(/active/);
  await expect(page.locator("#paymentAnalytics")).toHaveClass(/ts-payment-legend/);
  await expect(page.locator("#paymentAnalytics > .ts-payment-stack")).toBeVisible();
  await expect(page.locator("#peopleAnalytics")).toHaveClass(/ts-traveler-legend/);
  await expect(page.locator("#peopleAnalytics .ts-traveler-ring")).toBeVisible();
  await expect(page.locator("#dailyAnalytics")).toHaveClass(/ts-daily-chart/);
  await expect(page.locator("#dailyAnalytics .daily")).toHaveCount(3);

  const dailyTrack = await page.locator("#dailyAnalytics .daily .bar-track").first().evaluate(el => {
    const style = getComputedStyle(el);
    return {width:parseFloat(style.width),height:parseFloat(style.height)};
  });
  expect(dailyTrack.height).toBeGreaterThan(dailyTrack.width * 4);

  await openTab(page, "Settings");
  await expect(page.locator("#settings")).toHaveClass(/active/);
  await page.waitForTimeout(1200);

  await expect(page.locator("#tripAiSettingsCard")).toContainText("Google Gemini");
  await expect(page.locator("#tripAiSettingsCard")).toContainText("Gemini 3.5 Flash-Lite");
  await expect(page.locator("#tripAiSettingsCard")).not.toContainText("Cloudflare AI");
  await expect(page.locator("#tripAiServiceStatus")).toHaveText("READY");

  const statusBox = await page.locator("#tripAiServiceStatus").evaluate(el => {
    const r = el.getBoundingClientRect();
    return {width:r.width,height:r.height};
  });
  expect(statusBox.height).toBeLessThanOrEqual(32);
  expect(statusBox.width).toBeLessThan(90);

  const flags = page.locator(".settings-country-flag");
  await expect(flags).toHaveCount(3);
  const flagBox = await flags.first().evaluate(el => {
    const r = el.getBoundingClientRect();
    return {width:r.width,height:r.height};
  });
  expect(flagBox.width).toBeLessThanOrEqual(32);
  expect(flagBox.height).toBeLessThanOrEqual(26);

  await page.screenshot({path:"test-results/visual-polish-settings.png",fullPage:true});
});