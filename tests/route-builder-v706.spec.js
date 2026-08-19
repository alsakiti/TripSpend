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

  await page.evaluate(() => {
    const set = (id, value) => {
      const el = document.getElementById(id);
      el.value = value;
      el.dispatchEvent(new Event("input", { bubbles:true }));
      el.dispatchEvent(new Event("change", { bubbles:true }));
    };
    set("tripName", "Europe");
    window.TripSpendCore?.setDestinationValue?.("destination", "Germany");
    set("startDate", "2026-08-22");
    set("endDate", "2026-08-25");
    window.TripSpendSetupOnboarding?.showStep?.(2, { scroll:false });
  });
  await expect(page.locator('.ts-setup-panel[data-setup-step="2"]')).toBeVisible();

  await page.locator("#setupToggleCountries").click();
  const panel = page.locator("#setupMultiCountryPanel");
  await expect(panel).toBeVisible();

  const from = page.locator("#setupExtraStart");
  const to = page.locator("#setupExtraEnd");
  await expect(from).toBeEnabled();
  await expect(from).toHaveValue("2026-08-25");

  await from.fill("2026-08-26");
  await from.dispatchEvent("change");
  await to.fill("2026-08-28");
  await to.dispatchEvent("change");
  await expect(from).toHaveValue("2026-08-26");

  await page.evaluate(() => window.TripSpendCore?.setDestinationValue?.("setupExtraCountry", "Austria"));
  await page.locator("#setupAddCountry").click();

  await expect(panel).toBeHidden();
  await expect(page.locator("#setupRouteList")).toContainText("Austria");
  await expect.poll(() => page.evaluate(() => window.TripSpendV5?.setupStops?.()[0]?.startDate)).toBe("2026-08-26");
  await expect.poll(() => page.evaluate(() => window.TripSpendV5?.setupStops?.()[0]?.endDate)).toBe("2026-08-28");

  await page.locator("#setupToggleCountries").click();
  await expect(panel).toBeVisible();
  await page.locator("#setupCancelCountry").click();
  await expect(panel).toBeHidden();

  await page.locator("#tsSetupNext").click();
  await expect(page.locator('.ts-setup-panel[data-setup-step="3"]')).toBeVisible();
});
