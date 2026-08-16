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
  await page.waitForSelector("#languageToggleV7", { state:"visible" });
  await expect(page.locator(".version-badge").first()).toHaveText("v7.0.0");
}

test("setup screen is bilingual, RTL-safe and uses one flag control", async ({ page }) => {
  await bootV7(page);
  await expect(page.locator("#setupView")).toBeVisible();
  await expect(page.locator("#languageToggleV7")).toHaveCount(1);
  await expect(page.locator("#tripName")).toHaveAttribute("placeholder", "Enter trip name");

  await page.locator("#languageToggleV7").click();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("#tripName")).toHaveAttribute("placeholder", "أدخل اسم الرحلة");
  await expect(page.locator("#destination")).toHaveAttribute("placeholder", "ابحث عن دولة…");

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
  await page.screenshot({ path:"test-results/setup-ar.png", fullPage:true });

  await page.locator("#languageToggleV7").click();
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(page.locator("#tripName")).toHaveAttribute("placeholder", "Enter trip name");
});

test("existing trip expense cards localize dynamic Arabic text", async ({ page }) => {
  const seed = {
    trip: {
      id:"trip-test", name:"Europe", destination:"Germany",
      startDate:"2026-08-12", endDate:"2026-08-22", budget:1000,
      homeCurrency:"OMR", tripCurrency:"EUR", defaultPayment:"Credit Card"
    },
    expenses:[{
      id:"expense-test", amount:12, currency:"OMR", rate:1, homeAmount:12,
      category:"Food", paymentMethod:"Credit Card", date:"2026-08-16", note:"Dinner",
      expenseType:"personal", paidByPersonId:"person-test", stopId:"stop-test",
      personShares:[{personId:"person-test",amount:12}], planId:"", receiptId:"", createdAt:Date.now()
    }],
    rates:{},
    people:[{id:"person-test",name:"Me",active:true,createdAt:Date.now()}],
    stops:[{id:"stop-test",country:"Germany",startDate:"2026-08-12",endDate:"2026-08-22",currency:"EUR",budget:0,createdAt:Date.now()}],
    plans:[], itinerary:[], settlements:[], tripHistory:[], preferences:{}
  };

  await page.addInitScript(value => {
    localStorage.setItem("tripspend.v1", JSON.stringify(value));
  }, seed);

  await bootV7(page);
  await page.waitForSelector("#mainView:not(.hidden)");

  const clicked = await page.evaluate(() => {
    const candidates = [...document.querySelectorAll("button,a")];
    const target = candidates.find(el => el.textContent.trim() === "Expenses");
    target?.click();
    return !!target;
  });
  expect(clicked).toBeTruthy();

  await page.locator("#languageToggleV7").click();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await page.waitForTimeout(150);

  const visibleText = await page.locator("body").innerText();
  expect(visibleText).toContain("المصروفات");
  expect(visibleText).toContain("عشاء");
  expect(visibleText).toContain("الطعام");
  expect(visibleText).not.toContain("Paid by Me");

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
  await page.screenshot({ path:"test-results/expenses-ar.png", fullPage:true });
});
