const { test, expect } = require("@playwright/test");

function seededTrip() {
  const now = Date.now();
  return {
    trip:{id:"ux-v709",name:"Europe",destination:"Germany",startDate:"2026-08-22",endDate:"2026-08-31",budget:2500,homeCurrency:"OMR",tripCurrency:"EUR",defaultPayment:"Credit Card"},
    expenses:[],rates:{},plans:[],itinerary:[],settlements:[],tripHistory:[],
    people:[{id:"me",name:"Me",active:true,createdAt:now}],
    stops:[
      {id:"de",country:"Germany",startDate:"2026-08-22",endDate:"2026-08-25",currency:"EUR",budget:1000,createdAt:now},
      {id:"at",country:"Austria",startDate:"2026-08-26",endDate:"2026-08-28",currency:"EUR",budget:700,createdAt:now+1},
      {id:"it",country:"Italy",startDate:"2026-08-29",endDate:"2026-08-30",currency:"EUR",budget:500,createdAt:now+2},
      {id:"at-2",country:"Austria",startDate:"2026-08-31",endDate:"2026-08-31",currency:"EUR",budget:300,createdAt:now+3}
    ],
    preferences:{recentCategories:["Coffee","Transport"]}
  };
}

async function boot(page) {
  await page.clock.setFixedTime(new Date("2026-08-24T12:00:00Z"));
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
  await expect(page.locator(".version-badge").first()).toHaveText("v7.2.1");
}

test("v7.2.1 Home prioritizes guidance and keeps secondary route budgets collapsible", async ({ page }) => {
  await page.setViewportSize({width:390,height:844});
  await boot(page);

  await expect(page.locator("#homeGuideCard")).toBeVisible();
  await expect(page.locator("#healthBanner")).toBeVisible();
  await expect(page.locator("#healthTitle")).toHaveText("No spending recorded yet");
  await expect(page.locator("#healthText")).toHaveText("Your daily spending guidance will update after you record your first expense.");
  await expect(page.locator("#healthAction")).toHaveCount(0);

  const order = await page.evaluate(() => ({
    guidance:document.getElementById("healthBanner").getBoundingClientRect().top,
    add:document.getElementById("quickAdd").getBoundingClientRect().top,
    route:document.getElementById("currentCountryCard").getBoundingClientRect().top
  }));
  expect(order.guidance).toBeLessThan(order.add);
  expect(order.add).toBeLessThan(order.route);

  const route = page.locator("#tripFlagRail");
  await expect(route.locator(".trip-flag")).toHaveCount(4);
  await expect(route.locator(".trip-flag.active")).toHaveCount(1);
  const activeFlag = await route.locator(".trip-flag.active").evaluate(el => ({
    width:Math.round(el.getBoundingClientRect().width),
    radius:getComputedStyle(el).borderRadius,
    opacity:getComputedStyle(el).opacity,
    transform:getComputedStyle(el).transform
  }));
  expect(activeFlag.width).toBe(32);
  expect(activeFlag.radius).toBe("8px");
  expect(activeFlag.opacity).toBe("1");
  expect(activeFlag.transform).toBe("none");

  const railFit = await route.evaluate(el => ({clientWidth:el.clientWidth,scrollWidth:el.scrollWidth}));
  expect(railFit.scrollWidth).toBeLessThanOrEqual(railFit.clientWidth + 1);

  await expect(page.locator("#countryBudgetList")).toBeHidden();
  await page.locator("#countryBudgetToggle").click();
  await expect(page.locator("#countryBudgetList")).toBeVisible();
  await expect(page.locator("#countryBudgetToggle")).toHaveAttribute("aria-expanded", "true");
  await page.locator("#countryBudgetToggle").click();
  await expect(page.locator("#countryBudgetList")).toBeHidden();

  await page.locator("#dismissHomeGuide").click();
  await expect(page.locator("#homeGuideCard")).toBeHidden();
  expect(await page.evaluate(() => localStorage.getItem("tripspend.home-guide.v709"))).toBe("1");

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
});

test("Add Expense exposes fast category and note controls while keeping details optional", async ({ page }) => {
  await page.setViewportSize({width:390,height:844});
  await boot(page);
  await page.locator("#quickAdd").click();

  await expect(page.locator("#expenseAmount")).toBeVisible();
  await page.locator("#expenseAmount").focus();
  const amountFocusGap = await page.locator(".smart-amount-label").evaluate(label => {
    const textNode = [...label.childNodes].find(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
    const range = document.createRange();
    range.selectNodeContents(textNode);
    const labelText = range.getBoundingClientRect();
    const input = label.querySelector("#expenseAmount").getBoundingClientRect();
    return input.top - 6 - labelText.bottom;
  });
  expect(amountFocusGap).toBeGreaterThanOrEqual(4);
  await expect(page.locator("#expenseCategory")).toBeVisible();
  await expect(page.locator("#expenseNote")).toBeVisible();
  await expect(page.locator("#recentCategoryChips .recent-category-chip")).toHaveCount(2);
  await expect(page.locator("#expenseAdvancedFields")).toBeHidden();
  await expect(page.locator("#receiptInput")).toBeHidden();

  await page.getByRole("button", {name:/Coffee/}).click();
  await expect(page.locator("#expenseCategory")).toHaveValue("Coffee");
  await page.locator("#expenseNote").fill("Morning coffee");
  await expect(page.locator("#expenseCategory")).toHaveValue("Coffee");

  await page.locator("#expenseMoreOptions").click();
  await expect(page.locator("#expenseAdvancedFields")).toBeVisible();
  await expect(page.locator(".receipt-field")).toBeVisible();

  const controls = await page.locator("#expenseForm input, #expenseForm select, #expenseForm textarea").evaluateAll(nodes => nodes.filter(node => node.getClientRects().length).map(node => parseFloat(getComputedStyle(node).fontSize)));
  for (const fontSize of controls) expect(fontSize).toBeGreaterThanOrEqual(16);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
});

test("new Home guidance and privacy copy localize cleanly in Arabic", async ({ page }) => {
  await boot(page);
  await page.evaluate(() => window.TripSpendLocale?.setLanguage?.("ar"));
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");

  await expect(page.locator("#homeGuideCard")).toContainText("سهّل يومك");
  await expect(page.locator("#healthBanner .health-kicker")).toHaveText("إرشاد اليوم");
  await expect(page.locator(".local-first-note")).toContainText("تبقى بيانات رحلتك وإيصالاتك");
  await expect(page.locator("#countryBudgetToggle")).toHaveText("عرض");

  const arabicHome = await page.locator("#dashboard").innerText();
  expect(arabicHome).not.toContain("Make today easier");
  expect(arabicHome).not.toContain("TODAY'S GUIDANCE");
  expect(arabicHome).not.toContain("Your trip and receipts stay on this device");

  await page.evaluate(() => window.TripSpendLocale?.setLanguage?.("en"));
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  const englishHome = await page.locator("#dashboard").innerText();
  expect(englishHome).not.toMatch(/[\u0600-\u06FF]/);
});
