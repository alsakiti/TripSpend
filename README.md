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


## v4 additions

- New TripSpend wallet + airplane brand icon throughout the app and home-screen install
- Multiple travelers per trip
- Assign each expense to one traveler
- Split an expense equally between all active travelers
- Historical per-person shares are stored on each expense so adding/removing people later does not rewrite old totals
- Traveler totals on the Home dashboard
- Dedicated traveler management screen
- Rename, archive, restore, or delete unused travelers
- Traveler filter in Expense History
- "By traveler" analytics
- Smart insight for the highest assigned spender and unassigned spending
- CSV export now includes assignment and traveler-share details
- v1-v3 data migrates automatically; old expenses remain unassigned rather than being guessed

### Traveler behavior

When you select **Everyone equally**, TripSpend stores a fixed share for every active traveler at the time the expense is saved. If a traveler later leaves the trip, archive them instead of deleting them; their historical totals remain intact.


## v4.1 — Searchable destination field

Destination selection now uses a live autocomplete field on both Trip Setup and Settings.

- Type one letter to see countries containing that letter.
- Matches that start with the typed text are ranked first.
- Every extra letter narrows the list immediately.
- Supports mouse/touch selection and keyboard arrows + Enter.
- The app validates that a country from the suggestion list was selected before saving.


## v4.2 fixes

- Compact iPhone setup layout
- Start/end dates stay inside their card and align correctly
- Date and currency pairs stay side-by-side on normal phone widths
- Reduced setup logo/card/input sizing for better mobile proportions
- Prevented iOS text auto-scaling from making controls oversized
- Added Apple home-screen metadata
- Install section now detects when TripSpend is already running as an installed app
- Supported browsers use their native install prompt when available
- iPhone/iPad shows clear Safari Add to Home Screen instructions instead of a non-working button
- Service-worker cache bumped to v4.2 so the layout update replaces older cached files


## v4.3 update

- Visible **v4.3** badge in the setup screen and beside the TripSpend brand
- Setup page scaled down substantially for iPhone
- Smaller logo, title, labels, input fields, margins, and cards
- Start/End dates use a compact two-column layout on normal iPhones
- Home/Trip currencies remain side-by-side
- Stronger iOS date-input width constraints
- Versioned CSS/JS URLs to prevent stale asset caching
- `version.json` added for future update detection
- Service worker now checks navigation/version files from the network when available
- New versions can surface an **Update now** banner


## v4.4 update

- Replaced visibly rendered iOS date inputs with clean custom date cards
- Tapping either date card still opens the native iPhone date picker
- Date text is vertically centered and consistent with the rest of the form
- New Trip no longer preselects Thailand
- Trip name uses a neutral “Enter trip name” hint rather than a realistic default
- First traveler name starts blank and must be entered
- Budget hint changed from 1000 to “Enter budget”
- Visible version updated to v4.4
