const { test, expect } = require("@playwright/test");

function seededTrip() {
  const now = Date.UTC(2026,7,18,8,0,0);
  return {
    trip:{id:"trip-home-language",name:"Europe",destination:"Germany",startDate:"2026-08-12",endDate:"2026-08-22",budget:1000,homeCurrency:"OMR",tripCurrency:"EUR",defaultPayment:"Credit Card"},
    expenses:[],rates:{},
    people:[{id:"me",name:"Me",active:true,createdAt:now}],
    stops:[
      {id:"de",country:"Germany",startDate:"2026-08-12",endDate:"2026-08-18",currency:"EUR",budget:0,createdAt:now},
      {id:"at",country:"Austria",startDate:"2026-08-18",endDate:"2026-08-20",currency:"EUR",budget:0,createdAt:now+1},
      {id:"it",country:"Italy",startDate:"2026-08-20",endDate:"2026-08-22",currency:"EUR",budget:0,createdAt:now+2}
    ],
    plans:[],itinerary:[],settlements:[],tripHistory:[],preferences:{}
  };
}

async function boot(page) {
  await page.addInitScript(value => {
    const fixed = Date.parse("2026-08-18T13:24:00Z");
    const RealDate = Date;
    class FixedDate extends RealDate {
      constructor(...args) { super(...(args.length ? args : [fixed])); }
      static now() { return fixed; }
    }
    window.Date = FixedDate;
    localStorage.setItem("tripspend.language","en");
    localStorage.setItem("tripspend.v1",JSON.stringify(value));
  }, seededTrip());

  await page.goto("/");
  await page.evaluate(async () => {
    if (!("serviceWorker" in navigator)) return;
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise(resolve => navigator.serviceWorker.addEventListener("controllerchange",resolve,{once:true}));
    }
  });
  await page.reload();
  await page.waitForSelector("#mainView:not(.hidden)");
  await expect(page.locator("#dashboard")).toHaveClass(/active/);
}

test("Home countries follow active language and Next Up uses the polished layout", async ({ page }) => {
  await boot(page);

  await expect(page.locator("html")).toHaveAttribute("dir","ltr");
  await expect(page.locator("#currentCountryName")).toContainText("Austria");
  await expect(page.locator("#currentCountryName")).not.toContainText("النمسا");
  await expect(page.locator("#v6NextCountry")).toContainText("Italy");
  await expect(page.locator("#v6PlanLabel")).toHaveText("NEXT UP");

  const layout = await page.locator("#v6PlanRow").evaluate(card => {
    const icon = card.querySelector(".v6-plan-icon");
    const country = card.querySelector("#v6NextCountry");
    const dates = card.querySelector("#v6NextCountryDates");
    const cardStyle = getComputedStyle(card);
    const iconStyle = getComputedStyle(icon);
    const countryStyle = getComputedStyle(country);
    return {
      cardHeight:Math.round(card.getBoundingClientRect().height),
      radius:parseFloat(cardStyle.borderRadius),
      iconWidth:Math.round(icon.getBoundingClientRect().width),
      iconHeight:Math.round(icon.getBoundingClientRect().height),
      countryDisplay:countryStyle.display,
      countryAlign:countryStyle.alignItems,
      countrySize:parseFloat(countryStyle.fontSize),
      dateSize:parseFloat(getComputedStyle(dates).fontSize),
      background:cardStyle.backgroundImage
    };
  });

  expect(layout.cardHeight).toBeGreaterThanOrEqual(72);
  expect(layout.radius).toBeGreaterThanOrEqual(16);
  expect(layout.iconWidth).toBeGreaterThanOrEqual(40);
  expect(layout.iconHeight).toBeGreaterThanOrEqual(40);
  expect(layout.countryDisplay).toBe("flex");
  expect(layout.countryAlign).toBe("center");
  expect(layout.countrySize).toBeGreaterThanOrEqual(14);
  expect(layout.dateSize).toBeGreaterThanOrEqual(11);
  expect(layout.background).not.toBe("none");

  await page.evaluate(() => window.TripSpendLocale?.setLanguage?.("ar"));
  await expect(page.locator("html")).toHaveAttribute("dir","rtl");
  await expect(page.locator("#currentCountryName")).toContainText("النمسا");
  await expect(page.locator("#v6NextCountry")).toContainText("إيطاليا");

  await page.evaluate(() => window.TripSpendLocale?.setLanguage?.("en"));
  await expect(page.locator("html")).toHaveAttribute("dir","ltr");
  await expect(page.locator("#currentCountryName")).toContainText("Austria");
  await expect(page.locator("#currentCountryName")).not.toContainText("النمسا");
  await expect(page.locator("#v6NextCountry")).toContainText("Italy");
});
