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
    people:[
      {id:"person-test",name:"Me",active:true,createdAt:Date.now()},
      {id:"person-hu",name:"Hu",active:true,createdAt:Date.now()}
    ],
    stops:[
      {id:"stop-test",country:"Germany",startDate:"2026-08-12",endDate:"2026-08-18",currency:"EUR",budget:0,createdAt:Date.now()},
      {id:"stop-austria",country:"Austria",startDate:"2026-08-18",endDate:"2026-08-20",currency:"EUR",budget:0,createdAt:Date.now()},
      {id:"stop-italy",country:"Italy",startDate:"2026-08-20",endDate:"2026-08-22",currency:"EUR",budget:0,createdAt:Date.now()}
    ],
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
  await expect(page.locator(".version-badge").first()).toHaveText("v7.0.9");
}

async function openPageByEnglishLabel(page, label) {
  const clicked = await page.evaluate(text => {
    const candidates = [...document.querySelectorAll("button,a")];
    const target = candidates.find(el => el.textContent.trim() === text);
    target?.click();
    return !!target;
  }, label);
  expect(clicked).toBeTruthy();
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
  await expect(page.locator("#headerSub")).toContainText("3 دول");
  await expect(page.locator("#headerSub")).toContainText("ألمانيا");
  await expect(page.locator("#headerSub")).toContainText("النمسا");
  await expect(page.locator("#headerSub")).toContainText("إيطاليا");
  await expect(page.locator("#currentCountryStatus")).not.toContainText(/FIRST|CURRENT|LAST|AUTO BY DATE/);
  await expect(page.locator("#healthTitle")).not.toContainText(/Budget ready|On track|Over budget/);
  await expect(page.locator("#healthText")).not.toContainText(/You have|planned for this trip|under budget|over budget/);
  await expect(page.locator("#countryBudgetList")).not.toContainText(/Set budget|left|over/);

  const dynamicArabic = await page.evaluate(() => [
    "FIRST COUNTRY • AUTO BY DATE",
    "LAST COUNTRY • AUTO BY DATE",
    "Budget ready",
    "You have 2,500 OMR planned for this trip.",
    "500 OMR still unallocated.",
    "100 OMR over-allocated.",
    "250 OMR left"
  ].map(value => window.TripSpendLocale?.t?.(value)));
  for (const value of dynamicArabic) expect(value).toMatch(/[\u0600-\u06FF]/);

  const flagIsLeft = await visibleLanguageButton(page).evaluate(el => {
    const r = el.getBoundingClientRect();
    return r.left + r.width / 2 < window.innerWidth / 2;
  });
  expect(flagIsLeft).toBeTruthy();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
  await page.screenshot({ path:"test-results/home-ar.png", fullPage:true });

  await visibleLanguageButton(page).click();
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await page.waitForTimeout(150);
  await expect(page.locator("#headerSub")).toContainText("3 countries");
  await expect(page.locator("#headerSub")).toContainText("Germany");
  await expect(page.locator("#headerSub")).toContainText("Austria");
  await expect(page.locator("#headerSub")).toContainText("Italy");
  await expect(page.locator("#headerSub")).not.toContainText("دول");
  await expect(page.locator("#headerSub")).not.toContainText("ألمانيا");

  await openPageByEnglishLabel(page, "Expenses");
  await page.waitForTimeout(150);
  const englishExpenses = await page.locator("#expenses").innerText();
  expect(englishExpenses).not.toMatch(/[\u0600-\u06FF]/);
  await expect(page.locator("#expenseSummary")).toContainText(/expenses?/);
});

test("existing trip expense cards localize dynamic Arabic text", async ({ page }) => {
  await seedTrip(page);
  await bootV7(page);
  await page.waitForSelector("#mainView:not(.hidden)");

  await openPageByEnglishLabel(page, "Expenses");

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

  await visibleLanguageButton(page).click();
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await page.waitForTimeout(250);
  const restoredEnglish = await page.locator("#expenses").innerText();
  expect(restoredEnglish).not.toMatch(/[\u0600-\u06FF]/);
  expect(restoredEnglish).toContain("Dinner");
  expect(restoredEnglish).toContain("Food");
  expect(restoredEnglish).toContain("Repeat");
  await expect(page.locator("#expenseSummary")).toContainText(/expense/);
});

test("Arabic Add Expense sheet fully localizes static and dynamic copy", async ({ page }) => {
  await seedTrip(page);
  await bootV7(page);
  await page.waitForSelector("#mainView:not(.hidden)");

  await visibleLanguageButton(page).click();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");

  await page.evaluate(() => window.TripSpendCore?.openModal?.(""));
  await expect(page.locator("#modal")).not.toHaveClass(/hidden/);
  await page.waitForTimeout(250);

  // Receipt controls are intentionally part of the optional details in v7.0.9.
  await page.locator("#expenseMoreOptions").click();
  await expect(page.locator("#expenseAdvancedFields")).toBeVisible();
  await page.waitForTimeout(150);

  let modalText = await page.locator("#modal").innerText();
  expect(modalText).toContain("إضافة مصروف");
  expect(modalText).toContain("نوع المصروف");
  expect(modalText).toContain("لمسافر واحد");
  expect(modalText).toContain("تقسيم مع الآخرين");
  expect(modalText).toContain("معبأ تلقائيًا");
  expect(modalText).toContain("صورة اختيارية تُحفظ محليًا مع هذا المصروف.");

  for (const english of ["TRANSACTION","Add Expense","Expense type","For one traveler","Split with others","AUTO-FILLED","Optional photo stored locally with this expense."]) {
    expect(modalText).not.toContain(english);
  }

  await page.locator("#expenseTypeShared").click();
  await page.waitForTimeout(150);
  modalText = await page.locator("#modal").innerText();
  expect(modalText).toContain("اختر جميع من شاركوا في هذا المصروف");
  expect(modalText).not.toContain("Choose everyone who shared this expense");

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
  await page.screenshot({ path:"test-results/add-expense-ar.png", fullPage:true });
});

test("Arabic Plan page localizes planner, progress and empty itinerary", async ({ page }) => {
  await seedTrip(page);
  await bootV7(page);
  await page.waitForSelector("#mainView:not(.hidden)");
  await openPageByEnglishLabel(page, "Plan");
  await expect(page.locator("#plan")).toHaveClass(/active/);

  await visibleLanguageButton(page).click();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await page.waitForTimeout(300);

  let planText = await page.locator("#plan").innerText();
  for (const arabic of ["مخطط الرحلة","رحلتك","تقدم الرحلة","القادم","الملتزم به","التكاليف","يبدأ برنامج رحلتك من هنا","إضافة أول عنصر"]) {
    expect(planText).toContain(arabic);
  }
  for (const english of ["TRIP PLANNER","Your trip","TRIP PROGRESS","Upcoming","Committed","Costs","Your itinerary starts here","Add first item"]) {
    expect(planText).not.toContain(english);
  }
  await page.screenshot({ path:"test-results/plan-ar.png", fullPage:true });

  await visibleLanguageButton(page).click();
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await page.waitForTimeout(200);
  planText = await page.locator("#plan").innerText();
  expect(planText).toContain("TRIP PLANNER");
  expect(planText).toContain("TRIP PROGRESS");
  expect(planText).toContain("Your itinerary starts here");
});

test("Arabic Analytics page localizes redesigned insights, categories and debt empty state", async ({ page }) => {
  await seedTrip(page);
  await bootV7(page);
  await page.waitForSelector("#mainView:not(.hidden)");
  await openPageByEnglishLabel(page, "Analytics");
  await expect(page.locator("#analytics")).toHaveClass(/active/);

  await visibleLanguageButton(page).click();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await page.waitForTimeout(350);

  const insightsDetails = page.locator("#analyticsMoreDetails");
  if (await insightsDetails.isHidden()) await page.locator("#analyticsMoreToggle").click();
  await expect(insightsDetails).toBeVisible();

  let analyticsText = await page.locator("#analytics").innerText();
  for (const arabic of ["إنفاق الرحلة","إجمالي المصروف","أعلى فئة","متوسط المصروف","أين ذهبت أموالك","الطعام","من يدين لمن","لا توجد ديون جماعية بعد","عرض تفاصيل الحساب","أعلى يوم إنفاقًا","طرق الدفع","حصة المسافرين","الإنفاق اليومي"]) {
    expect(analyticsText).toContain(arabic);
  }
  for (const english of ["Trip spending","TOTAL SPENT","Top category","Avg expense","Where your money went","Who owes whom","No group debts yet","Show calculation details","MORE INSIGHTS","Payment methods","Traveler share","Daily spending"]) {
    expect(analyticsText).not.toContain(english);
  }
  expect(analyticsText).not.toContain("Personal expenses paid by the same person do not create debt");
  expect(analyticsText).not.toMatch(/\bFood\b/);
  expect(analyticsText).not.toContain("On pace");
  await expect(page.locator("body")).toHaveClass(/ts-no-floating-add/);
  await expect(page.locator("#navAdd")).toBeHidden();
  await page.screenshot({ path:"test-results/analytics-ar.png", fullPage:true });

  await visibleLanguageButton(page).click();
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await page.waitForTimeout(200);
  analyticsText = await page.locator("#analytics").innerText();
  expect(analyticsText).toContain("Trip spending");
  expect(analyticsText).toContain("TOTAL SPENT");
  expect(analyticsText).toContain("Where your money went");
  expect(analyticsText).toContain("No group debts yet");
  expect(analyticsText).toContain("Payment methods");
  expect(analyticsText).toContain("Traveler share");
  expect(analyticsText).toContain("Daily spending");
});
