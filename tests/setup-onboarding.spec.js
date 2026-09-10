const { test, expect } = require("@playwright/test");

async function bootV7(page) {
  await page.goto("/");
  await page.evaluate(async () => {
    if (!("serviceWorker" in navigator)) return;
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise(resolve => navigator.serviceWorker.addEventListener("controllerchange", resolve, { once:true }));
    }
  });
  await page.reload();
  await page.waitForFunction(() => {
    const main = document.querySelector("#mainView:not(.hidden)");
    const setup = document.querySelector("#setupView:not(.hidden) .ts-setup-stage");
    return !!(main || setup);
  });
}

function seedTripState() {
  return {
    trip:{id:"trip-toggle",name:"Europe",destination:"Germany",startDate:"2026-08-12",endDate:"2026-08-22",budget:1000,homeCurrency:"OMR",tripCurrency:"EUR",defaultPayment:"Credit Card"},
    expenses:[{id:"expense-toggle",amount:22,currency:"OMR",rate:1,homeAmount:22,category:"Food",paymentMethod:"Credit Card",date:"2026-08-17",note:"Dinner",expenseType:"personal",paidByPersonId:"me",stopId:"de",personShares:[{personId:"me",amount:22}],planId:"",receiptId:"",createdAt:1}],
    rates:{},
    people:[{id:"me",name:"Me",active:true,createdAt:1}],
    stops:[{id:"de",country:"Germany",startDate:"2026-08-12",endDate:"2026-08-22",currency:"EUR",budget:1000,createdAt:1}],
    plans:[],itinerary:[],settlements:[],tripHistory:[],preferences:{}
  };
}

async function openAnalytics(page) {
  await page.evaluate(() => {
    [...document.querySelectorAll(".nav-btn")].find(el => el.textContent.trim() === "Analytics")?.click();
  });
  await expect(page.locator("#analytics")).toHaveClass(/active/);
}

test("new trip setup uses the premium 3-step onboarding and final preview", async ({ page }) => {
  await bootV7(page);
  await expect(page.locator("#setupView")).toBeVisible();
  await expect(page.locator(".ts-setup-stage")).toBeVisible();
  await expect(page.locator(".ts-setup-progress-dot")).toHaveCount(3);
  await expect(page.locator('.ts-setup-panel[data-setup-step="1"]')).toBeVisible();
  await expect(page.locator('.ts-setup-panel[data-setup-step="1"] h2')).toHaveText("Where are you going?");

  await page.locator("#tripName").fill("Europe Road Trip");
  await page.locator("#destination").fill("Germany");
  await page.locator("#startDate").fill("2026-08-12");
  await page.locator("#endDate").fill("2026-08-22");
  await page.locator("#tsSetupNext").click();

  await expect(page.locator('.ts-setup-panel[data-setup-step="2"]')).toBeVisible();
  await expect(page.locator('.ts-setup-panel[data-setup-step="2"] h2')).toHaveText("Build your route");
  await expect(page.locator("#tsSetupPrimaryRoute")).toContainText("Germany");
  await page.locator("#tsSetupNext").click();

  await expect(page.locator('.ts-setup-panel[data-setup-step="3"]')).toBeVisible();
  await expect(page.locator('.ts-setup-panel[data-setup-step="3"] h2')).toHaveText("Trip settings");
  await page.locator("#budget").fill("1000");
  await page.locator("#ownerName").fill("Me");
  await page.locator("#homeCurrency").selectOption("OMR");
  await page.locator("#tripCurrency").selectOption("EUR");
  await page.locator("#setupDefaultPayment").selectOption("Apple Pay");
  await page.locator("#tsSetupNext").click();

  await expect(page.locator('.ts-setup-panel[data-setup-step="4"]')).toBeVisible();
  await expect(page.locator('.ts-setup-panel[data-setup-step="4"] h2')).toHaveText("Almost ready!");
  await expect(page.locator("#tsSetupPreview")).toContainText("Europe Road Trip");
  await expect(page.locator("#tsSetupPreview")).toContainText("Germany");
  await expect(page.locator("#tsSetupPreview")).toContainText("1,000 OMR");

  const editBudget = page.getByRole("button", { name:"Edit budget" });
  const editCurrency = page.getByRole("button", { name:"Edit trip currency" });
  await expect(editBudget).toBeVisible();
  await expect(editCurrency).toBeVisible();

  await editBudget.click();
  await expect(page.locator('.ts-setup-panel[data-setup-step="3"]')).toBeVisible();
  await expect(page.locator("#budget")).toHaveValue("1000");
  await expect.poll(() => page.locator("#budget").evaluate(el => getComputedStyle(el).fontSize)).toBe("16px");
  await expect.poll(() => page.evaluate(() => document.activeElement?.tagName || "")).toBe("BODY");
  const hiddenPreview = await page.locator("#tsSetupPreview").innerHTML();
  await page.locator("#budget").fill("1200");
  await expect(page.locator("#tsSetupPreview")).toHaveJSProperty("innerHTML", hiddenPreview);
  await page.locator("#tsSetupNext").click();
  await expect(page.locator("#tsSetupPreview")).toContainText("1,200 OMR");

  await editCurrency.click();
  await expect(page.locator('.ts-setup-panel[data-setup-step="3"]')).toBeVisible();
  await expect(page.locator("#tripCurrency")).toHaveValue("EUR");
  await page.locator("#tsSetupNext").click();
  await expect(page.locator('.ts-setup-panel[data-setup-step="4"]')).toBeVisible();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
  await page.screenshot({path:"test-results/setup-onboarding.png",fullPage:true});

  await page.locator('.ts-setup-panel[data-setup-step="4"] button[type="submit"]').click();
  await page.waitForSelector("#mainView:not(.hidden)");
  await expect.poll(() => page.evaluate(() => window.TripSpendCore?.getState?.().trip?.defaultPayment)).toBe("Apple Pay");
});

test("onboarding locks the outer viewport and covers the bottom edge in dark mode", async ({ page }) => {
  await page.setViewportSize({ width:430, height:932 });
  await page.emulateMedia({ colorScheme:"dark" });
  await bootV7(page);

  await expect(page.locator("html")).toHaveClass(/ts-setup-onboarding-active/);
  await expect(page.locator("body")).toHaveClass(/ts-setup-onboarding-active/);

  const viewport = await page.evaluate(() => {
    window.scrollTo(0, 200);
    const appRect = document.querySelector(".app").getBoundingClientRect();
    const rootStyle = getComputedStyle(document.documentElement);
    const bodyStyle = getComputedStyle(document.body);
    return {
      scrollY:window.scrollY,
      rootOverflow:rootStyle.overflow,
      bodyOverflow:bodyStyle.overflow,
      rootBackground:rootStyle.backgroundColor,
      bodyBackground:bodyStyle.backgroundColor,
      appBottom:Math.round(appRect.bottom),
      viewportHeight:window.innerHeight
    };
  });

  expect(viewport.scrollY).toBe(0);
  expect(viewport.rootOverflow).toBe("hidden");
  expect(viewport.bodyOverflow).toBe("hidden");
  expect(viewport.rootBackground).not.toBe("rgba(0, 0, 0, 0)");
  expect(viewport.bodyBackground).not.toBe("rgba(0, 0, 0, 0)");
  expect(viewport.appBottom).toBe(viewport.viewportHeight);
});

test("past trips stay compact until the user expands them", async ({ page }) => {
  const archived = seedTripState();
  await page.addInitScript(value => localStorage.setItem("tripspend.v1", JSON.stringify(value)), {
    trip:null,
    expenses:[],
    rates:{},
    people:[],
    stops:[],
    plans:[],
    itinerary:[],
    settlements:[],
    preferences:{},
    tripHistory:[{
      id:"history-europe",
      status:"completed",
      archivedAt:Date.parse("2026-08-23T00:00:00Z"),
      data:archived,
      summary:{budget:1000,spent:22,difference:978,expenseCount:1,homeCurrency:"OMR"}
    }]
  });
  await bootV7(page);

  const history = page.locator("#setupHistorySection");
  await expect(history).toBeVisible();
  await expect(history).not.toHaveAttribute("open", "");
  await expect(page.locator("#setupHistoryCount")).toHaveText("1");
  await expect(page.locator("#setupHistoryList")).toBeHidden();
  expect((await history.boundingBox()).height).toBeLessThanOrEqual(64);

  await page.locator(".setup-history-toggle").click();
  await expect(history).toHaveAttribute("open", "");
  await expect(page.locator("#setupHistoryList .trip-history-card")).toBeVisible();
  await expect(page.locator("#setupHistoryList")).toContainText("Open Trip");
  await expect(page.locator("#setupHistoryList")).toContainText("Report");
  await expect(page.locator("#setupHistoryList")).toContainText("Delete");
});

test("More Insights starts collapsed and truly expands and collapses the Analytics cards", async ({ page }) => {
  await page.addInitScript(value => localStorage.setItem("tripspend.v1", JSON.stringify(value)), seedTripState());
  await bootV7(page);
  await page.waitForSelector("#mainView:not(.hidden)");
  await openAnalytics(page);

  const toggle = page.locator("#analyticsMoreToggle");
  const details = page.locator("#analyticsMoreDetails");
  await expect(toggle).toBeVisible();
  await expect(details).toBeHidden();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");

  await toggle.click();
  await expect(details).not.toHaveClass(/hidden/);
  await expect(details).toBeVisible();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");

  await toggle.click();
  await expect(details).toHaveClass(/hidden/);
  await expect(details).toBeHidden();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
});
