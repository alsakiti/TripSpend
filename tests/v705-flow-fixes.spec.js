const { test, expect } = require("@playwright/test");

function seededTrip() {
  const now = Date.now();
  return {
    trip:{id:"trip-long-route",name:"Long Route",destination:"Germany",startDate:"2026-08-12",endDate:"2026-08-28",budget:1500,homeCurrency:"OMR",tripCurrency:"EUR",defaultPayment:"Credit Card"},
    expenses:[],rates:{},
    people:[{id:"me",name:"Me",active:true,createdAt:now}],
    stops:[
      {id:"de",country:"Germany",startDate:"2026-08-12",endDate:"2026-08-14",currency:"EUR",budget:0,createdAt:now},
      {id:"at",country:"Austria",startDate:"2026-08-14",endDate:"2026-08-16",currency:"EUR",budget:0,createdAt:now+1},
      {id:"it",country:"Italy",startDate:"2026-08-16",endDate:"2026-08-18",currency:"EUR",budget:0,createdAt:now+2},
      {id:"fr",country:"France",startDate:"2026-08-18",endDate:"2026-08-20",currency:"EUR",budget:0,createdAt:now+3},
      {id:"es",country:"Spain",startDate:"2026-08-20",endDate:"2026-08-22",currency:"EUR",budget:0,createdAt:now+4},
      {id:"pt",country:"Portugal",startDate:"2026-08-22",endDate:"2026-08-24",currency:"EUR",budget:0,createdAt:now+5},
      {id:"ch",country:"Switzerland",startDate:"2026-08-24",endDate:"2026-08-28",currency:"CHF",budget:0,createdAt:now+6}
    ],
    plans:[],itinerary:[],settlements:[],tripHistory:[],preferences:{}
  };
}

async function boot(page) {
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
}

test("Switch Trip flags swipe horizontally and Start New Trip uses premium onboarding", async ({ page }) => {
  await boot(page);

  await page.locator("#tripSwitcherTrigger").click();
  await expect(page.locator("#tripSwitcherModal")).not.toHaveClass(/hidden/);

  const strip = page.locator("#tripSwitcherModal .trip-switcher-flags");
  await expect(strip).toHaveClass(/ts-swipe-flags-v705/);
  await expect(strip.locator(".ts-country-flag-v705")).toHaveCount(7);

  const metrics = await strip.evaluate(el => ({
    clientWidth:Math.round(el.clientWidth),
    scrollWidth:Math.round(el.scrollWidth),
    overflowX:getComputedStyle(el).overflowX,
    touchAction:getComputedStyle(el).touchAction
  }));
  expect(metrics.scrollWidth).toBeGreaterThan(metrics.clientWidth);
  expect(metrics.overflowX).toBe("auto");
  expect(metrics.touchAction).toContain("pan-x");

  const didScroll = await strip.evaluate(el => {
    el.scrollLeft = 1000;
    return el.scrollLeft > 0;
  });
  expect(didScroll).toBe(true);

  page.once("dialog", dialog => dialog.accept());
  await page.locator("#tripSwitcherNewBtn").click();

  await expect(page.locator("#setupView")).not.toHaveClass(/hidden/);
  await expect(page.locator("#setupForm")).toHaveClass(/ts-setup-onboarding-form/);
  await expect(page.locator(".ts-setup-stage")).toBeVisible();
  await expect(page.locator(".ts-setup-progress")).toBeVisible();
  await expect(page.locator("#mainView")).toHaveClass(/hidden/);
  await expect(page.locator("body")).toHaveClass(/ts-setup-onboarding-active/);

  const destinationBox = await page.locator("#destination").boundingBox();
  expect(destinationBox).not.toBeNull();
  expect(destinationBox.width).toBeGreaterThan(240);

  const dateCards = page.locator('.ts-setup-panel[data-setup-step="1"] .primary-country-dates .date-picker-card');
  await expect(dateCards).toHaveCount(2);
  const dateBoxes = await dateCards.evaluateAll(elements => elements.map(el => {
    const r = el.getBoundingClientRect();
    return {width:Math.round(r.width), height:Math.round(r.height), top:Math.round(r.top)};
  }));
  expect(dateBoxes[0].width).toBeGreaterThan(110);
  expect(dateBoxes[1].width).toBeGreaterThan(110);
  expect(Math.abs(dateBoxes[0].top - dateBoxes[1].top)).toBeLessThanOrEqual(2);

  const setupStageOverflow = await page.locator(".ts-setup-stage").evaluate(el => el.scrollWidth - el.clientWidth);
  expect(setupStageOverflow).toBeLessThanOrEqual(1);

  // TripSpend owns the visible date format rather than inheriting the browser locale.
  await page.evaluate(() => {
    const setDate = (id, value) => {
      const input = document.getElementById(id);
      input.value = value;
      input.dispatchEvent(new Event("input", { bubbles:true }));
    };
    setDate("startDate", "2026-08-20");
    setDate("endDate", "2026-08-24");
  });
  await expect(page.locator("#startDateDisplay")).toHaveText("20 Aug 2026");
  await expect(page.locator("#endDateDisplay")).toHaveText("24 Aug 2026");

  // Arabic regression: From (من) must be the right-hand field and To (إلى)
  // the left-hand field, both must stay on the same row, keep an explicit
  // day-month-year display, and clicking either card must invoke the picker.
  await page.evaluate(() => window.TripSpendLocale?.setLanguage?.("ar"));
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");

  const dateLabels = page.locator('.ts-setup-panel[data-setup-step="1"] .primary-country-dates>.date-field-label');
  await expect(dateLabels.nth(0).locator(":scope > span")).toHaveText("من");
  await expect(dateLabels.nth(1).locator(":scope > span")).toHaveText("إلى");
  await expect(page.locator("#startDateDisplay")).toHaveText("20 أغسطس 2026");
  await expect(page.locator("#endDateDisplay")).toHaveText("24 أغسطس 2026");
  await expect(page.locator("#startDateDisplay")).toHaveAttribute("dir", "ltr");
  await expect(page.locator("#endDateDisplay")).toHaveAttribute("dir", "ltr");

  const rtlLayout = await dateLabels.evaluateAll(elements => elements.map(el => {
    const r = el.getBoundingClientRect();
    const card = el.querySelector(".date-picker-card");
    const display = el.querySelector(".date-display");
    const input = el.querySelector('input[type="date"]');
    const inputStyle = getComputedStyle(input);
    return {
      left:Math.round(r.left),
      top:Math.round(r.top),
      direction:getComputedStyle(card).direction,
      textAlign:getComputedStyle(display).textAlign,
      inputWidth:Math.round(input.getBoundingClientRect().width),
      cardWidth:Math.round(card.getBoundingClientRect().width),
      inputHeight:Math.round(input.getBoundingClientRect().height),
      cardHeight:Math.round(card.getBoundingClientRect().height),
      zIndex:inputStyle.zIndex
    };
  }));
  expect(rtlLayout[0].left).toBeGreaterThan(rtlLayout[1].left);
  expect(Math.abs(rtlLayout[0].top - rtlLayout[1].top)).toBeLessThanOrEqual(2);
  expect(rtlLayout[0].direction).toBe("rtl");
  expect(rtlLayout[1].direction).toBe("rtl");
  expect(rtlLayout[0].textAlign).toBe("right");
  expect(rtlLayout[1].textAlign).toBe("right");
  expect(Math.abs(rtlLayout[0].inputWidth - rtlLayout[0].cardWidth)).toBeLessThanOrEqual(2);
  expect(Math.abs(rtlLayout[1].inputWidth - rtlLayout[1].cardWidth)).toBeLessThanOrEqual(2);
  expect(Math.abs(rtlLayout[0].inputHeight - rtlLayout[0].cardHeight)).toBeLessThanOrEqual(2);
  expect(Math.abs(rtlLayout[1].inputHeight - rtlLayout[1].cardHeight)).toBeLessThanOrEqual(2);

  await page.evaluate(() => {
    window.__tsPickerCalls = { start:0, end:0 };
    document.querySelector("#startDate").showPicker = () => { window.__tsPickerCalls.start += 1; };
    document.querySelector("#endDate").showPicker = () => { window.__tsPickerCalls.end += 1; };
  });
  await dateCards.nth(0).click();
  await dateCards.nth(1).click();
  expect(await page.evaluate(() => window.__tsPickerCalls)).toEqual({ start:1, end:1 });
});
