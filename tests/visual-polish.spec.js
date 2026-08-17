const { test, expect } = require("@playwright/test");

function seedState() {
  return {
    trip:{id:"trip-visual",name:"Europe",destination:"Germany",startDate:"2026-08-12",endDate:"2026-08-22",budget:1000,homeCurrency:"OMR",tripCurrency:"EUR",defaultPayment:"Credit Card"},
    expenses:[
      {id:"e1",amount:17.767,currency:"OMR",rate:1,homeAmount:17.767,category:"Food",paymentMethod:"Credit Card",date:"2026-08-12",note:"Lunch",expenseType:"personal",paidByPersonId:"me",stopId:"de",personShares:[{personId:"me",amount:17.767}],planId:"",receiptId:"",createdAt:1},
      {id:"e2",amount:8.23,currency:"OMR",rate:1,homeAmount:8.23,category:"Transport",paymentMethod:"Credit Card",date:"2026-08-13",note:"Taxi",expenseType:"personal",paidByPersonId:"me",stopId:"de",personShares:[{personId:"me",amount:8.23}],planId:"",receiptId:"",createdAt:2},
      {id:"e3",amount:6.21,currency:"OMR",rate:1,homeAmount:6.21,category:"Food",paymentMethod:"Credit Card",date:"2026-08-14",note:"Lunch",expenseType:"personal",paidByPersonId:"me",stopId:"de",personShares:[{personId:"me",amount:6.21}],planId:"",receiptId:"",createdAt:3},
      {id:"e4",amount:3.98,currency:"OMR",rate:1,homeAmount:3.98,category:"Coffee",paymentMethod:"Credit Card",date:"2026-08-15",note:"Coffee",expenseType:"personal",paidByPersonId:"me",stopId:"de",personShares:[{personId:"hu",amount:3.98}],planId:"",receiptId:"",createdAt:4},
      {id:"e5",amount:12,currency:"OMR",rate:1,homeAmount:12,category:"Food",paymentMethod:"Credit Card",date:"2026-08-16",note:"Dinner",expenseType:"personal",paidByPersonId:"me",stopId:"de",personShares:[{personId:"me",amount:12}],planId:"",receiptId:"",createdAt:5},
      {id:"e6",amount:22,currency:"OMR",rate:1,homeAmount:22,category:"Food",paymentMethod:"Credit Card",date:"2026-08-17",note:"Shared meal",expenseType:"shared",paidByPersonId:"me",stopId:"de",personShares:[{personId:"me",amount:17.558},{personId:"hu",amount:4.442}],planId:"",receiptId:"",createdAt:6},
      {id:"e7",amount:9.24,currency:"OMR",rate:1,homeAmount:9.24,category:"Transport",paymentMethod:"Credit Card",date:"2026-08-18",note:"Taxi",expenseType:"personal",paidByPersonId:"me",stopId:"at",personShares:[{personId:"me",amount:9.24}],planId:"",receiptId:"",createdAt:7}
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

test("Analytics matches the premium reference graphics and Settings keeps Gemini/flags polished", async ({ page }) => {
  await boot(page);
  await openTab(page, "Analytics");
  await expect(page.locator("#analytics")).toHaveClass(/active/);

  await expect(page.locator("#analyticsMoreToggle")).toBeVisible();
  await expect(page.locator("#analyticsMoreDetails")).toBeVisible();
  await expect(page.locator("#paymentAnalytics")).toHaveClass(/ts-payment-reference/);
  await expect(page.locator("#paymentAnalytics .ts-payment-row")).toHaveCount(1);
  await expect(page.locator("#paymentAnalytics .ts-payment-icon")).toBeVisible();
  await expect(page.locator("#paymentAnalytics .ts-reference-progress")).toBeVisible();

  await expect(page.locator("#peopleAnalytics")).toHaveClass(/ts-traveler-reference/);
  await expect(page.locator("#peopleAnalytics .ts-traveler-row")).toHaveCount(2);
  await expect(page.locator("#peopleAnalytics .ts-traveler-avatar")).toHaveCount(2);

  await expect(page.locator("#dailyAnalytics")).toHaveClass(/ts-daily-reference/);
  await expect(page.locator("#dailyAnalytics svg")).toBeVisible();
  await expect(page.locator("#dailyAnalytics svg path")).toHaveCount(1);
  await expect(page.locator("#dailyAnalytics .ts-daily-summary")).toBeVisible();
  await expect(page.locator("#dailyAnalytics")).toContainText("79.427 OMR");
  await expect(page.locator("#dailyAnalytics")).toContainText("11.347 OMR");
  await expect(page.locator(".ts-period-pill")).toContainText("Last 7 days");

  const chartBox = await page.locator("#dailyAnalytics .ts-daily-chart-shell").evaluate(el => {
    const r = el.getBoundingClientRect();
    return { width:r.width, height:r.height };
  });
  expect(chartBox.width).toBeGreaterThan(250);
  expect(chartBox.height).toBeGreaterThan(180);

  await page.screenshot({path:"test-results/analytics-reference.png",fullPage:true});

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
});