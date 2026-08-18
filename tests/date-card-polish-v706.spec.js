const { test, expect } = require("@playwright/test");

function seededTrip() {
  const now = Date.now();
  return {
    trip:{id:"trip-date-polish",name:"Europe",destination:"Germany",startDate:"2026-08-12",endDate:"2026-08-28",budget:1500,homeCurrency:"OMR",tripCurrency:"EUR",defaultPayment:"Credit Card"},
    expenses:[],rates:{},people:[{id:"me",name:"Me",active:true,createdAt:now}],
    stops:[{id:"de",country:"Germany",startDate:"2026-08-12",endDate:"2026-08-28",currency:"EUR",budget:0,createdAt:now}],
    plans:[],itinerary:[],settlements:[],tripHistory:[],preferences:{}
  };
}

async function openNewTrip(page) {
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
  await page.locator("#tripSwitcherTrigger").click();
  page.once("dialog", dialog => dialog.accept());
  await page.locator("#tripSwitcherNewBtn").click();
  await expect(page.locator("#setupForm")).toHaveClass(/ts-setup-onboarding-form/);
  await page.evaluate(() => {
    const setDate = (id, value) => {
      const input = document.getElementById(id);
      input.value = value;
      input.dispatchEvent(new Event("input", { bubbles:true }));
    };
    setDate("startDate", "2026-08-20");
    setDate("endDate", "2026-08-24");
  });
}

function cardMetrics(card) {
  const cardRect = card.getBoundingClientRect();
  const display = card.querySelector(".date-display");
  const icon = card.querySelector(".date-calendar");
  const displayRect = display.getBoundingClientRect();
  const iconRect = icon.getBoundingClientRect();
  const displayStyle = getComputedStyle(display);
  return {
    cardTop:cardRect.top,
    cardBottom:cardRect.bottom,
    cardLeft:cardRect.left,
    cardRight:cardRect.right,
    cardCenterY:(cardRect.top + cardRect.bottom) / 2,
    displayTop:displayRect.top,
    displayBottom:displayRect.bottom,
    displayHeight:displayRect.height,
    fontSize:parseFloat(displayStyle.fontSize),
    lineHeight:parseFloat(displayStyle.lineHeight),
    iconLeft:iconRect.left,
    iconRight:iconRect.right,
    iconCenterY:(iconRect.top + iconRect.bottom) / 2,
    iconTransform:getComputedStyle(icon).transform,
    svgTransform:getComputedStyle(icon.querySelector("svg")).transform
  };
}

test("onboarding dates are not clipped and calendar icons are upright and centered", async ({ page }) => {
  await openNewTrip(page);

  const startCard = page.locator('.ts-setup-panel[data-setup-step="1"] .primary-country-dates .date-picker-card').first();
  await expect(page.locator("#startDateDisplay")).toHaveText("20 Aug 2026");

  const english = await startCard.evaluate(cardMetrics);
  expect(english.lineHeight).toBeGreaterThan(english.fontSize * 1.25);
  expect(english.displayHeight).toBeGreaterThan(english.fontSize * 1.25);
  expect(english.displayTop - english.cardTop).toBeGreaterThanOrEqual(8);
  expect(english.cardBottom - english.displayBottom).toBeGreaterThanOrEqual(8);
  expect(Math.abs(english.iconCenterY - english.cardCenterY)).toBeLessThanOrEqual(1.5);
  expect(english.iconTransform).toBe("none");
  expect(english.svgTransform).toBe("none");
  expect(english.cardRight - english.iconRight).toBeGreaterThanOrEqual(11);

  await page.evaluate(() => window.TripSpendLocale?.setLanguage?.("ar"));
  await expect(page.locator("#startDateDisplay")).toHaveText("20 أغسطس 2026");

  const arabic = await startCard.evaluate(cardMetrics);
  expect(arabic.lineHeight).toBeGreaterThan(arabic.fontSize * 1.25);
  expect(arabic.displayTop - arabic.cardTop).toBeGreaterThanOrEqual(8);
  expect(arabic.cardBottom - arabic.displayBottom).toBeGreaterThanOrEqual(8);
  expect(Math.abs(arabic.iconCenterY - arabic.cardCenterY)).toBeLessThanOrEqual(1.5);
  expect(arabic.iconTransform).toBe("none");
  expect(arabic.svgTransform).toBe("none");
  expect(arabic.iconLeft - arabic.cardLeft).toBeGreaterThanOrEqual(11);
});
