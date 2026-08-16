const { test, expect } = require("@playwright/test");

function visibleLanguageButton(page) {
  return page.locator("#setupLanguageToggleV7:visible, #languageToggleV7:visible");
}

function seedTripState() {
  return {
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
}

async function seedTrip(page) {
  await page.addInitScript(value => {
    localStorage.setItem("tripspend.v1", JSON.stringify(value));
  }, seedTripState());
}

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
  await expect(visibleLanguageButton(page)).toHaveCount(1);
  await expect(page.locator(".version-badge").first()).toHaveText("v7.0.1");
}

test("setup screen is bilingual, RTL-safe and keeps Arabic flag on the left", async ({ page }) => {
  await bootV7(page);
  await expect(page.locator("#setupView")).toBeVisible();
  await expect(visibleLanguageButton(page)).toHaveCount(1);
  await expect(page.locator("#tripName")).toHaveAttribute("placeholder", "Enter trip name");

  await visibleLanguageButton(page).click();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("#tripName")).toHaveAttribute("placeholder", "أدخل اسم الرحلة");
  await expect(page.locator("#destination")).toHaveAttribute("placeholder", "ابحث عن دولة…");

  const flagIsLeft = await visibleLanguageButton(page).evaluate(el => {
    const r = el.getBoundingClientRect();
    return r.left + r.width / 2 < window.innerWidth / 2;
  });
  expect(flagIsLeft).toBeTruthy();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
  await page.screenshot({ path:"test-results/setup-ar.png", fullPage:true });

  await visibleLanguageButton(page).click();
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(page.locator("#tripName")).toHaveAttribute("placeholder", "Enter trip name");
});

test("Arabic Home has localized welcome text and no floating add overlap", async ({ page }) => {
  await seedTrip(page);
  await bootV7(page);
  await page.waitForSelector("#mainView:not(.hidden)");
  await expect(page.locator("#dashboard")).toHaveClass(/active/);

  await visibleLanguageButton(page).click();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await page.waitForTimeout(250);

  await expect(page.locator("#dashboardDate")).toHaveText(/[\u0600-\u06FF]/);
  await expect(page.locator("#dashboardGreeting")).toHaveText(/^(صباح الخير|مساء الخير)، Europe$/);
  await expect(page.locator("#dashboardGreeting .ts-trip-name")).toHaveAttribute("dir", "ltr");
  await expect(page.locator("#quickAdd small")).toHaveText("سجّل مصروفك خلال ثوانٍ");
  await expect(page.locator("#navAdd")).toHaveClass(/hidden/);

  const flagIsLeft = await visibleLanguageButton(page).evaluate(el => {
    const r = el.getBoundingClientRect();
    return r.left + r.width / 2 < window.innerWidth / 2;
  });
  expect(flagIsLeft).toBeTruthy();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
  await page.screenshot({ path:"test-results/home-ar.png", fullPage:true });
});

test("existing trip expense cards localize dynamic Arabic text", async ({ page }) => {
  await seedTrip(page);
  await bootV7(page);
  await page.waitForSelector("#mainView:not(.hidden)");

  const clicked = await page.evaluate(() => {
    const candidates = [...document.querySelectorAll("button,a")];
    const target = candidates.find(el => el.textContent.trim() === "Expenses");
    target?.click();
    return !!target;
  });
  expect(clicked).toBeTruthy();

  await visibleLanguageButton(page).click();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await page.waitForTimeout(250);

  await expect(page.locator("#pageAdd")).toContainText("إضافة");
  await expect(page.locator("#headerSub")).toContainText("ألمانيا");
  await expect(page.locator("#expenseSummary")).toContainText("مصروف");

  const visibleText = await page.locator("body").innerText();
  expect(visibleText).toContain("المصروفات");
  expect(visibleText).toContain("عشاء");
  expect(visibleText).toContain("الطعام");
  expect(visibleText).toContain("تكرار");
  expect(visibleText).not.toContain("Paid by Me");
  expect(visibleText).not.toContain("Germany");
  expect(visibleText).not.toMatch(/\bRepeat\b/);
  expect(visibleText).not.toMatch(/\b1 expense\b/);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
  await page.screenshot({ path:"test-results/expenses-ar.png", fullPage:true });
});
