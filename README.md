# TripSpend v2

A smarter, offline-first travel spending tracker that runs on GitHub Pages.

## New in v2

- Smart trip health: on-track / watch pace / over-budget status
- End-of-trip spending forecast
- Smart insights for top category, biggest day, and daily spending room
- Today spending and projected total on the dashboard
- Automatic category suggestions from expense notes
- Remembered exchange rates per currency pair
- Duplicate-expense warning
- Repeat-expense button for fast re-entry
- Payment-method analytics and filtering
- Average transaction and biggest-spend-day analytics
- CSV export for Excel
- JSON backup/import
- Installable PWA with app icons and offline cache
- Keeps compatibility with existing v1 TripSpend data

## Update your GitHub Pages app

Replace the files in the root of your TripSpend repository with the v2 files, including the `icons` folder. Commit the changes. GitHub Pages will deploy automatically.

If your browser shows the old version after deployment, refresh once or twice. The v2 service worker uses a new cache version so the updated app should take over.

## Privacy

Trip and expense data are stored in your browser's localStorage. GitHub hosts the app code only; your entered expenses are not written to your GitHub repository. Export a JSON backup regularly if the data matters.


## v3 additions

- Live Currency Exchange card on the Home dashboard
- Latest available reference-rate lookup through Frankfurter
- One-tap **Use Latest Rate** inside Add Expense
- Last successful rates cached locally for offline conversion
- Online/offline status shown in the exchange section
- Stronger offline app-shell caching through the service worker
- Existing trip and expense data remains stored in browser local storage

### Offline behavior

Open TripSpend successfully at least once while online after publishing v3. The service worker caches the app shell. After that, the dashboard, expense entry, analytics, settings, and saved data can open without internet.

Live exchange rates require internet for a fresh rate. When offline, TripSpend uses the last successful saved rate for that exact currency pair when available.

### Exchange-rate note

The exchange service supplies the latest available reference rate. Your card issuer, bank, ATM, or cash exchange counter can apply a different rate or fee, so TripSpend still allows manual exchange-rate editing.
