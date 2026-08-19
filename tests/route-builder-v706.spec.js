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
  await page.waitForFunction(() => !!document.querySelector("#setupView:not(.hidden) .ts-setup-stage"));
}

test("route builder keeps From editable and Add/Cancel/Continue remain responsive", async ({ page }) => {
  await bootV7(page);

  await page.locator("#tripName").fill("Europe");
  await page.locator("#destination").fill("Ger");
  await page.locator("#destinationOptions .country-option", { hasText:"Germany" }).click();
  await page.locator("#startDate").fill("2026-08-22");
  await page.locator("#endDate").fill("2026-08-25");
  await page.locator("#tsSetupNext").click();
  await expect(page.locator('.ts-setup-panel[data-setup-step="2"]')).toBeVisible();

  await page.locator("#setupToggleCountries").click();
  const panel = page.locator("#setupMultiCountryPanel");
  await expect(panel).toBeVisible();

  const from = page.locator("#setupExtraStart");
  const to = page.locator("#setupExtraEnd");
  await expect(from).toBeEnabled();
  await expect(from).toHaveValue("2026-08-25");
  await expect(page.locator("#setupMultiCountryPanel .date-field-label > span").first()).toHaveText("From");

  const dateHitTargets = await page.locator("#setupMultiCountryPanel .date-picker-card").evaluateAll(cards => cards.map(card => {
    const rect = card.getBoundingClientRect();
    const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    return { width:rect.width, height:rect.height, inputId:hit?.closest("input")?.id || "" };
  }));
  expect(dateHitTargets[0].inputId).toBe("setupExtraStart");
  expect(dateHitTargets[1].inputId).toBe("setupExtraEnd");
  expect(dateHitTargets.every(target => target.width > 100 && target.height >= 48)).toBe(true);

  await from.fill("2026-08-26");
  await from.dispatchEvent("change");
  await to.fill("2026-08-24");
  await to.dispatchEvent("change");
  await expect(from).toHaveValue("2026-08-26");
  await expect(page.locator("#setupExtraDateError")).toContainText("To date cannot be before From date.");

  await to.fill("2026-08-28");
  await to.dispatchEvent("change");
  await expect(page.locator("#setupExtraDateError")).toBeHidden();
  await expect(from).toHaveValue("2026-08-26");

  await page.locator("#setupExtraCountry").fill("Aus");
  await page.locator("#setupExtraCountryOptions .country-option", { hasText:"Austria" }).click();

  const addButton = page.locator("#setupAddCountry");
  await addButton.scrollIntoViewIfNeeded();
  const addTarget = await addButton.evaluate(button => {
    const rect = button.getBoundingClientRect();
    const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    return { height:rect.height, id:hit?.closest("button")?.id || "" };
  });
  expect(addTarget.height).toBeGreaterThanOrEqual(48);
  expect(addTarget.id).toBe("setupAddCountry");
  await addButton.click();

  await expect(panel).toBeHidden();
  await expect(page.locator("#setupRouteList")).toContainText("Austria");
  await expect.poll(() => page.evaluate(() => window.TripSpendV5?.setupStops?.()[0]?.startDate)).toBe("2026-08-26");
  await expect.poll(() => page.evaluate(() => window.TripSpendV5?.setupStops?.()[0]?.endDate)).toBe("2026-08-28");
  const formattedRange = await page.evaluate(() => {
    const core = window.TripSpendCore;
    return `${core.fmtDateWithYear("2026-08-26")} – ${core.fmtDateWithYear("2026-08-28")}`;
  });
  await expect(page.locator("#setupRouteList")).toContainText(formattedRange);
  const overallRange = await page.evaluate(() => {
    const core = window.TripSpendCore;
    return `${core.fmtDateWithYear("2026-08-22")} – ${core.fmtDateWithYear("2026-08-28")}`;
  });
  await expect(page.locator("#setupTripDatesHint")).toContainText(overallRange);

  await page.locator("#setupToggleCountries").click();
  await expect(panel).toBeVisible();
  await page.locator("#setupExtraCountry").fill("Italy");
  await page.locator("#setupCancelCountry").click();
  await expect(panel).toBeHidden();
  await expect.poll(() => page.evaluate(() => window.TripSpendV5?.setupStops?.().length)).toBe(1);

  await page.locator("#setupToggleCountries").click();
  await page.locator("#setupExtraCountry").fill("Italy");

  await page.locator("#tsSetupNext").click();
  await expect(page.locator('.ts-setup-panel[data-setup-step="3"]')).toBeVisible();
  await expect(panel).toBeHidden();
  await expect.poll(() => page.evaluate(() => window.TripSpendV5?.setupStops?.().length)).toBe(1);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
});
