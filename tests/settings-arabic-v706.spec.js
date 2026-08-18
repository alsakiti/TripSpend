const { test, expect } = require("@playwright/test");

function seedTrip() {
  const now = Date.now();
  return {
    trip:{id:"settings-ar-trip",name:"Europe",destination:"Germany",startDate:"2026-08-12",endDate:"2026-08-22",budget:1000,homeCurrency:"OMR",tripCurrency:"EUR",defaultPayment:"Credit Card"},
    expenses:[],rates:{},
    people:[{id:"me",name:"Me",active:true,createdAt:now}],
    stops:[
      {id:"de",country:"Germany",startDate:"2026-08-12",endDate:"2026-08-17",currency:"EUR",budget:500,createdAt:now},
      {id:"it",country:"Italy",startDate:"2026-08-17",endDate:"2026-08-22",currency:"EUR",budget:500,createdAt:now+1}
    ],
    plans:[],itinerary:[],settlements:[],tripHistory:[],preferences:{}
  };
}

async function bootControlled(page) {
  await page.addInitScript(value => localStorage.setItem("tripspend.v1", JSON.stringify(value)), seedTrip());
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

test("Settings fully localizes visible UI to Arabic and can switch back to English", async ({ page }) => {
  await bootControlled(page);
  await page.locator('.nav-btn[data-page="settings"]').click();
  await expect(page.locator("#settings")).toHaveClass(/active/);

  await page.evaluate(() => window.TripSpendLocale?.setLanguage?.("ar"));
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("#settingsBasicPanel h3")).toHaveText("تفاصيل الرحلة");
  await expect(page.locator("#settingsCountriesPanel h3")).toHaveText("الدول");
  await expect(page.locator("#settingsBudgetPanel h3")).toHaveText("الميزانية والدفع");
  await expect(page.locator("#settingsAdvanced > summary strong")).toHaveText("الخيارات المتقدمة والبيانات");

  const advanced = page.locator("#settingsAdvanced");
  await advanced.locator(":scope > summary").click();
  await expect(advanced).toHaveAttribute("open", "");
  await expect(page.locator("#settings")).toContainText("أمان البيانات");
  await expect(page.locator("#settings")).toContainText("تحديث التطبيق");
  await expect(page.locator("#settings")).toContainText("حالة التطبيق");
  await expect(page.locator("#settings")).toContainText("محول العملات");
  await expect(page.locator("#settings")).toContainText("نسخة احتياطية قابلة للنقل");
  await expect(page.locator("#settings")).toContainText("أسعار الصرف المحفوظة");
  await expect(page.locator("#settings")).toContainText("حذف الرحلة");
  await expect(page.locator("#settings")).toContainText("قاعدة البيانات المحلية السريعة مفعّلة.");
  await expect(page.locator("#settings")).toContainText("عرض خطوات التثبيت");
  await expect(page.locator("#settings")).toContainText("لا توجد أسعار صرف محفوظة بعد.");

  const visibleText = await page.locator("#settings").innerText();
  for (const english of [
    "Trip name", "Start date", "End date", "Total budget", "Home currency", "Trip currency",
    "Default payment method", "Manage trip", "Trips & history", "Manage Travelers", "Appearance",
    "Advanced & data", "Data safety", "App update", "App health", "Tools & data",
    "Currency converter", "Portable backup", "Saved exchange rates", "Delete trip",
    "Fast local database is active", "Waiting for first save", "Before v6.4 upgrade",
    "UP TO DATE", "Install availability depends on your browser", "Show Install Steps",
    "No saved rates yet", "Gemini-powered trip analysis", "confirm writes",
    "countries • Germany", "Everything looks healthy", " expenses • ", " stored • OK"
  ]) {
    expect(visibleText).not.toContain(english);
  }

  await page.evaluate(() => window.TripSpendLocale?.setLanguage?.("en"));
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(page.locator("#settingsBasicPanel h3")).toHaveText("Trip details");
  await expect(page.locator("#settingsAdvanced > summary strong")).toHaveText("Advanced & data");
  await expect(page.locator("#settings")).toContainText("Portable backup");
  await expect(page.locator("#settings")).toContainText("Fast local database is active.");
});
