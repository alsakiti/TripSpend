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


## v5.0 — Trip Planner & Group Settlement

### Multi-country trips
- Add multiple countries with dates, local currency, and optional destination budget.
- Expenses can be linked to the country where they happened.
- Dashboard shows the route and number of countries.
- Destination totals show spent, upcoming, and budget.

### Planned costs
- Add upcoming hotels, tours, transfers, activities, and other expected costs.
- Dashboard shows **Upcoming** and **Committed** (actual + upcoming).
- Planned costs can be turned into an expense with **Record expense**.

### Paid By / Expense For
- Every expense can store who paid.
- Select one or more travelers who benefited.
- Costs are split equally between selected travelers.
- **Settle up** calculates the simplest payments between travelers.

### Compatibility
- Existing v4 expenses remain compatible.
- Historical expenses without a payer remain valid but are excluded from settlement until edited.
- Offline mode, live currency conversion, traveler tracking, searchable destination fields, backup/export, PWA install, and the TripSpend logo are preserved.


## v5.1

- Settings Start/End dates now use the same custom iPhone date-card design as New Trip.
- Settings date values include the year and stay centered inside the controls.
- Settings now labels the first country as **Primary destination**.
- A prominent **+ Add another country** button appears directly below the primary destination.
- Settings shows how many countries are currently in the trip.
- **Manage Countries & Plans** is clearer than the old Trip Planner wording.
- Tapping **+ Add another country** opens the planner directly at the country form.


## v5.2

- Planner **From / To** fields now use compact date cards instead of oversized native iPhone date inputs.
- Planned-cost Date uses the same clean date card.
- New Trip setup now includes an optional **+ Add another country** flow.
- Users can build a multi-country route before creating the trip.
- Each extra country can have its own dates and local currency.
- The route is shown inline before Create Trip and individual countries can be removed.
- One-country setup remains just as simple; the extra-country UI stays collapsed until requested.
- If a trip is created with multiple countries, the total trip budget remains the overall budget and can later be allocated by country in the planner.


## v5.3

- Home dashboard now has a prominent **+ Add traveler** button.
- Travelers can be added without opening Settings.
- The quick form validates blank and duplicate traveler names.
- New travelers immediately appear in traveler totals, expense assignment, split-expense controls, and settlement calculations.
- Existing **Manage** control remains for rename/archive/delete and detailed traveler management.


## v5.4

- New Trip setup now includes **Traveling with others?**
- Tap **+ Add traveler** before creating the trip.
- Add as many additional travelers as needed.
- Added travelers are shown inline and can be removed before creating the trip.
- Duplicate traveler names are blocked.
- The first traveler's name and additional travelers are all saved when **Create Trip** is tapped.
- Travelers remain available immediately for individual spending, expense splitting, Paid By / Expense For, and Settle Up.
- Home dashboard **+ Add traveler** from v5.3 remains available for adding people later.


## v5.5 — Simpler New Trip setup

The New Trip screen was redesigned after mobile usability feedback.

- Removed visible **route** terminology.
- First country, its dates, and its local currency are now grouped together as **Country 1**.
- Removed the separate Start/End date row that previously appeared below additional countries.
- **+ Add another country** stays compact until tapped.
- Additional countries appear as Country 2, Country 3, etc.
- The next country starts by default the day after the previous country ends.
- Overall trip dates are calculated automatically from all country dates.
- The first country's local currency automatically follows the chosen country when known.
- Travelers are grouped into one simple Travelers section.
- **+ Add traveler** stays compact until tapped.
- Only **Home currency** remains as a trip-level currency; local currencies live with each country.


## v5.6

- Added **Edit** beside every additional country during New Trip setup.
- Edit reopens the country form with its country, From/To dates, and local currency already filled.
- Added **Edit** beside every additional traveler during New Trip setup.
- Edit reopens the traveler form with the current name.
- Existing **Remove** controls remain.
- Country 1 remains directly editable in its visible fields.
- The first traveler remains directly editable in the **Your name** field.
- Prevents invalid country dates: moving From after To automatically adjusts To.


## v5.6.1

- Country dates are now continuous by default with **no gap**.
- If Country 1 ends on 18 Aug, Country 2 starts on 18 Aug.
- If Country 2 ends on 22 Aug, Country 3 starts on 22 Aug.
- Additional-country **From** is automatic during New Trip setup.
- Changing an earlier country's end date automatically shifts following countries to keep the trip continuous.
- Removing a country automatically closes the gap between the remaining countries.
- The Countries & Costs planner also defaults each newly added country to the previous country's end date.


## v5.7

### Country budgets
- Every country can have its own optional budget in the home currency.
- Country 1 and additional countries can receive budgets during New Trip setup.
- A one-country trip automatically uses the total trip budget as the country budget if no separate country budget is entered.
- Home shows spent, remaining, progress and upcoming planned costs by country.
- Tap any country budget card to set/edit its budget.
- Countries & Costs also has Set budget / Edit budget controls.
- TripSpend warns if country budgets are under-allocated or exceed the total trip budget.

### Faster Add Expense
- Remembers the last payment method.
- Remembers the last category and shows recent category shortcut chips.
- Automatically selects the country based on today's/date-selected country.
- Automatically switches to that country's local currency.
- Remembers exchange rates and can automatically load the latest live/cached FX rate when needed.
- Remembers the last payer for quicker group-trip entry.
- Shows a compact context strip with country, payment method and exchange-rate readiness.

### Focused Home dashboard
- Home starts with the current country, dates, local currency and country-budget status.
- Main budget area focuses on Remaining, Safe today and Spent today.
- Forecast/Days Left remain calculated but are removed from the primary Home metrics.
- Country budgets are directly below Add Expense.
- Duplicate traveler summary, Home smart-insights list and Home top-category bars are hidden to reduce clutter.
- Analytics remains the place for detailed categories, forecasts and spending analysis.


## v5.8

### Cleaner Home
- Removed the **Travelers** section from Home.
- Removed **Recent expenses** from Home.
- Traveler management remains available in **Settings → Manage Travelers**.
- Expense history remains available in the **Expenses** tab.

### Who owes whom
- Group settlement moved from Trip Planner to **Analytics → Who owes whom**.
- Each traveler now shows:
  - amount they **Paid**
  - their actual **Share**
  - how much they **Owe** or **Should receive**
- TripSpend then shows the exact payments needed to settle the group, for example:
  - **Ahmed owes Mohammed 12.500 OMR**
- Expenses missing **Paid by** or **Expense for** are clearly flagged and excluded from the settlement until edited.


## v5.9

### Personal vs Shared expenses
- Add Expense now starts with a clear **Personal / Shared** choice.
- **Personal** = the expense belongs to one traveler.
- If that traveler also paid it, the expense counts toward their spending but creates **no group debt**.
- If another traveler paid that personal expense, TripSpend calculates that person-to-person debt.
- **Shared** = select everyone who shared the cost; TripSpend splits it equally.

### Settlement improvements
- **Who owes whom** ignores self-paid personal expenses automatically.
- It only calculates expenses that can actually create a debt.
- Each person's settlement summary now says **Group paid / Group share**, making it clear this is not their total personal spending.
- Analytics explains how much self-paid personal spending was intentionally excluded.
- “Not tracked” was renamed to **No payer (exclude settlement)**.
