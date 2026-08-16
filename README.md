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


## v5.9.1

- Fixed the oversized **Date** control inside Add/Edit Expense.
- Expense Date now uses the same compact iPhone date-card design as the rest of TripSpend.
- Personal expenses explicitly state that they **count toward overall trip spending and country budgets**.
- A self-paid personal expense creates no debt in **Who owes whom**, but still reduces the relevant budgets and appears in spending analytics.
- Analytics settlement explanation now makes this distinction clear.


## v6.0 — Dashboard redesign

TripSpend v6 focuses Home on the few things a traveler needs immediately.

### New Home hierarchy
1. Current country, dates, local currency, and country-budget progress
2. Remaining trip budget
3. Safe to spend today + spent today
4. One prominent **Add Expense** button
5. Compact country budget cards on multi-country trips
6. One compact **Next destination** row
7. Small trip-health status

### Removed from Home
- Live Currency Exchange
- Large Trip Plan widget
- Travelers
- Recent Expenses
- Smart Insights
- Top Categories
- Projected Total / Days Left cards

### Where those features live now
- Currency Converter → **Settings**
- Countries / planned costs → **Countries & trip planner**
- Travelers → **Settings → Manage Travelers**
- Expense history → **Expenses**
- Detailed charts + Who owes whom → **Analytics**

No spending, traveler, country, planned-cost, FX, or settlement data was removed. This release changes dashboard presentation and navigation only.


## v6.0.1

- Added small country flag emoji beside country names.
- Flags now appear on:
  - Home current-country card
  - multi-country header
  - country budget cards
  - Next destination row
  - Countries & Costs planner
  - expense country selector
  - planned-cost country selector
  - New Trip country search suggestions
  - added-country setup cards
- Country input values remain plain country names internally, so search/editing remains reliable.


## v6.1 — Smart Expense Entry

### Automatic country switching
- TripSpend chooses the active country from the expense date automatically.
- On a transition date shared by two countries, the country starting that day is selected.
- Home labels the current country as **AUTO BY DATE**.
- If TripSpend stays open overnight, or is resumed on a new day, it refreshes the current country automatically.
- A stale previously-used country can no longer override the date-driven selection for a new expense.

### Faster Add Expense
A normal expense is now designed around:
**Amount → Personal/Shared → Save Expense**

TripSpend automatically fills:
- current country
- local currency
- payer
- personal beneficiary
- recent payment method
- recent category
- date
- remembered/live exchange rate

The compact **AUTO-FILLED** row shows what TripSpend selected. Tap it or **More options** to change country, payer, beneficiary, category, payment, date, note or exchange rate.

- Editing an existing expense opens the details automatically.
- If an exchange rate is still required, details open automatically.
- Shared expenses keep the traveler selection visible because those choices directly affect settlement.

### Simpler Who Owes Whom
- Final settlement payments are shown first.
- Example: **Hu → Mohammed — 15.000 OMR**
- Paid/share accounting is hidden behind **Show calculation details**.
- Self-paid personal expenses remain excluded from debt while still counting toward trip spending.


## v6.2 — Analytics makeover

Analytics is now organized around decisions instead of showing every chart at once.

### New top overview
- Big **Total Spent**
- Budget percentage and progress
- Remaining budget
- Top spending category
- Personal spending
- Shared spending
- Number of expenses

### Cleaner highlights
Only three quick statistics stay visible:
- Average per day
- Average expense
- Largest expense

### Spending breakdown
**Where your money went** is the main visible chart and shows category spending clearly.

### Settlement
**Who owes whom** remains visible because it is actionable, while Paid vs Share details stay collapsed.

### More insights
Payment methods, traveler share, highest-spend day, and daily spending are now under one **More insights** control so Analytics stays compact on iPhone.

No expense or analytics data was removed.


## v6.3 — Visual polish

This release focuses on making TripSpend feel more like a finished iPhone app without adding dashboard clutter.

### Appearance
- Added **Auto / Light / Dark** under Settings → Appearance.
- Auto follows the device appearance and responds when iOS changes theme.
- The browser/PWA theme color also adapts.
- Dark mode uses purpose-built TripSpend surfaces rather than simple color inversion.

### Navigation
- Rebuilt the bottom navigation with consistent lightweight SVG icons.
- Added a dedicated **Plan** tab.
- The frequent **Add Expense** action is now a floating blue button above the navigation.
- Active tabs use a subtle blue filled indicator.

### Visual hierarchy
- Cleaner system typography and stronger important numbers.
- Softer cards, fewer heavy shadows, and subtler borders.
- Tabular numerals improve alignment for money values.
- Current-trip flags appear together with the active country emphasized.

### Motion
- Gentle page/sheet transitions.
- Progress bars animate smoothly.
- Save Expense briefly changes to **✓ Saved** before closing.
- All decorative motion is disabled automatically when Reduce Motion is enabled.

### Empty states
- Expenses and Analytics now use clearer intentional empty states instead of plain blank messages.
- The empty Expenses page includes **Add first expense**.

### Status colors
- Budget progress stays neutral normally.
- Amber appears near the limit.
- Red appears only when over budget.
- Online/offline state uses a small status dot.


## v6.3.1

- Removed the black Appearance confirmation toast.
- Auto / Light / Dark still work normally.
- Appearance changes are now completely silent.
- Selecting the already-active appearance no longer performs an unnecessary save.


## v6.4 — Reliability & Performance

### IndexedDB primary storage
- TripSpend now uses **IndexedDB** as its primary trip database.
- Existing v6.3.1/localStorage data is migrated automatically.
- A full **Before v6.4 upgrade** restore point is created before migration.
- After IndexedDB is confirmed, the old full-state localStorage copy is removed.
- If IndexedDB is unavailable or fails, TripSpend automatically falls back to the existing Web Storage path instead of losing the save.

### Automatic restore points
Settings → **Data safety** now shows:
- **Latest**
- up to 3 recent day snapshots, including Yesterday when available
- **Before v6.4 upgrade**
- manual / pre-restore / pre-import / pre-delete safety snapshots

Use **Restore** to return the trip to a snapshot.
TripSpend creates another safety snapshot before a restore.

### Save performance
- Frequent saves are batched for ~140 ms instead of synchronously serializing the full trip to localStorage on every small edit.
- Pending state is flushed when iOS backgrounds/closes the PWA.
- The current state plus Latest/Today restore points are written asynchronously.
- Only the latest 7 daily automatic backups are retained.

### Render performance
- Expense lists render only when Expenses is visible.
- Analytics charts render only when Analytics is visible.
- Planner DOM renders only when Plan is visible.
- Settlement details render only when Analytics is visible.
- Settings/People heavy content renders only on those pages.
- Home no longer rebuilds hidden legacy analytics/traveler widgets.

### Storage durability
- TripSpend asks the browser for persistent storage when supported.
- Settings shows the current storage backend and basic startup/render timing.

### Service worker
- Old TripSpend caches are removed on activation.
- Navigation Preload is enabled when the browser supports it.
- Offline app-shell behavior is preserved.


## v6.5 — Trips, Settlements & Search

This release combines the planned v6.5, v6.6 and v6.7 functionality into one update.

### Multiple Trips + Trip History
- Your current v6.4 trip remains the **Current Trip** automatically after upgrading.
- Every trip now has a stable internal trip ID.
- Settings → **Trips & history** shows:
  - Current Trip
  - Finish Trip
  - Start New Trip
  - Past Trips
- Starting another trip archives the current trip instead of deleting it.
- Past trips keep their:
  - expenses
  - travelers
  - countries
  - budgets
  - planned costs
  - exchange-rate memory
  - analytics
  - settlement history
- Tap **Open Trip** to make any previous trip current again. If another trip is currently active, it is safely moved to Past Trips.
- Past trips can be deleted independently.
- The New Trip screen also shows recent Past Trips when there is no active trip.

### Finish Trip
- **Finish Trip** opens a final summary showing:
  - Budget
  - Total spent
  - Saved / over budget
  - Top category
  - Country count
  - Outstanding settlement
- **Finish & Archive** moves the complete trip to Past Trips.
- A safety snapshot is created before finishing when IndexedDB is active.

### Settlement History + Mark Paid
- **Who owes whom** now has **Mark Paid ✓** beside each suggested payment.
- Marking a payment as paid updates the remaining balances immediately.
- Real-world repayments are stored separately from expenses.
- **Settlement history** shows who paid whom, the date and amount.
- **Undo** removes an accidental settlement record and restores the debt.

### Advanced Expense Search & Filters
Expenses now keeps Search visible and hides detailed filters until needed.

Filters include:
- Category
- Personal / Shared
- Country
- Traveler
- Payment method
- From date
- To date

The Filters button shows how many filters are currently active.
**Clear filters** resets them all.

Search also matches:
- note
- category
- country
- payer
- traveler assignment
- payment method
- Personal / Shared type

### Data safety
- v6.4 IndexedDB storage and automatic restore points remain unchanged.
- Trip History is stored inside the same protected database and portable JSON backup.


## v6.5.2 — Plan & Analytics Makeover

### Plan
- New compact trip-progress hero.
- Country flags form a visual route with the current country highlighted.
- Spent / Upcoming / Committed totals are compact.
- Add Country form is hidden until **+ Add country** is tapped.
- Add Planned Cost form is hidden until **+ Add cost** is tapped.
- Country cards are smaller and focus on Spent / Planned / Budget left.
- All existing country, budget, remove, planned-cost and date functionality remains.

### Analytics
- Total Spent is the primary focus.
- Remaining and Top Category sit directly below the budget progress.
- Personal / Shared / Expense Count are compact.
- Avg/day, Avg expense and Largest use a single clean row.
- Category spending no longer sits inside a heavy chart card.
- Who Owes Whom stays visible with Mark Paid and Settlement History.
- Payment, Traveler and Daily breakdowns remain behind More Insights.
- Dark Mode remains supported.

This release does not change trip data, multi-trip history, settlement records, filters, IndexedDB, restore points, or backup behavior.


## v6.5.2 — Larger Typography Tuning

This version keeps all v6.5.1 functionality, but increases text size in the two redesigned sections:

- Plan
- Analytics

What changed:
- Bigger section headings
- Bigger subtitles and helper text
- Larger country names and dates
- Larger country metric cards
- Larger planned-cost cards
- Bigger Total Spent number
- Bigger remaining / top category text
- Bigger Personal / Shared / Expenses blocks
- Bigger settlement text and buttons
- Improved readability on iPhone

No feature logic was changed in this release.


## v6.6 — Receipts, Smart Budget, Reports & Performance

### Receipt photos
- Add/Edit Expense → More options → **Add receipt**
- iPhone can open the camera directly or choose an existing image.
- Images are resized/compressed before storage.
- Receipt images are stored in a separate IndexedDB `receipts` store so normal expense state and automatic snapshots stay lightweight.
- Expenses with a receipt show a **Receipt** badge.
- Editing an expense shows the existing receipt.
- Repeating an expense intentionally does **not** copy the old receipt.
- Deleting an expense also deletes its stored receipt image.

### Smarter daily budget
Home now reserves upcoming planned costs before calculating Safe Today:
- Remaining trip budget
- Reserved for plans
- Available after plans
- Safe to spend today

Safe Today is based on **Available after plans**, not just raw remaining budget.

### Repeat Expense
- Existing one-tap Repeat is retained and highlighted.
- Repeat continues to prefill amount, category, payment, country, payer and other smart defaults.
- Receipts are excluded from repeats because each transaction should have its own receipt.

### Trip report
Trips & History now has **Trip Report**.
Finish Trip also has:
- **Share Report** → creates a polished PNG report and uses the iPhone Share Sheet when available.
- **Print / PDF** → opens a print-friendly report that can be printed or saved as PDF.

Reports include:
- total spent
- budget / saved or over budget
- country count
- expense count
- Personal vs Shared
- top categories
- settlement remaining

Past-trip cards also include **Report**.

### Large-trip performance
- Analytics calculations for spent/category/daily data are memoized and invalidated only when trip data changes.
- Expenses renders the first 100 transactions, then **Show 100 more**.
- Search/filter summaries still use the full matching dataset.
- Search/filter changes reset back to the first 100.
- Existing v6.4 lazy page rendering remains active.

### Storage upgrade
- IndexedDB schema moves from v1 to v2.
- A dedicated receipt store is created automatically.
- Existing expenses, trips, history and backups are unchanged.


## v6.6.1 — Receipt button moved into main Add Expense screen

### What changed
- **Add receipt** is now visible directly in the main **Add Expense** window.
- Users no longer need to open **More options** to attach a receipt.
- Receipt preview, replace/add flow, and remove button still work the same.
- All receipt storage remains local in IndexedDB.

### Why
This makes receipt attachment easier to discover and reduces friction when saving expenses during a trip.


## v6.6.2 — Budget card readability fix

### What changed
- Darker, higher-contrast blue budget card background
- Brighter label text and stronger values
- Larger small text for Budget, Spent, Reserved for plans, and Available after plans
- Stronger divider and better progress bar contrast
- Improved readability on iPhone screens


## v6.6.3 — Reliability & Receipt Fixes

### Receipt viewer
- Tap an expense to open **Expense Details**.
- Tap **View** on an attached receipt to open the full receipt.
- Receipt viewer supports iPhone pinch zoom plus − / + zoom controls.
- Replace or remove the receipt directly from Expense Details.

### Expense details
Tapping any expense now shows:
- home amount and original amount
- country and date
- Personal / Shared
- Paid by
- Expense For
- category
- payment method
- exchange rate
- per-person shared split
- receipt

Edit, Repeat and Delete are available at the bottom.

### Portable backup now includes receipts
- Export Backup packages all receipt photos referenced by the current trip and Past Trips into the JSON backup.
- Import Backup restores those receipt files back into IndexedDB.
- Backups without receipts from older TripSpend versions still import normally.

### Receipt storage safety
- Receipt replacements receive a new receipt ID instead of overwriting the old image.
- Old receipt files are preserved when an automatic/manual restore point still references them.
- Settings → Data Safety shows local storage usage and receipt-photo usage.
- **Clean unused receipt files** removes only receipt images not referenced by the current data or any local restore point.
- Deleting expenses/trips triggers safe orphan cleanup.

### Update controls
Settings now shows:
- Current version
- Latest version from GitHub Pages
- Check for Update
- Refresh App

This makes stale Home Screen/service-worker versions much easier to fix.

### Shared expense preview
Before saving a Shared expense, TripSpend now shows the equal split:
- total amount
- number of travelers
- amount per person
- approximate home-currency share when FX is required

No settlement rules were changed.


## v6.6.4 — Stability & Edge-Case Fixes

### Receipt save safety
- A new receipt and its expense update now save in one IndexedDB transaction.
- If receipt storage fails, the expense change is rolled back instead of leaving a broken receipt link.

### Backup/import protection
- Restore points are validated before use.
- Restore confirmation shows trip name, dates and expense count.
- Receipt-heavy portable backups warn above 25 MB.
- Receipt data above 75 MB is blocked from on-device packaging to reduce iPhone memory crashes.
- Portable imports above 100 MB are blocked.
- Imports are validated before replacing current data.

### Trip isolation / integrity
App Health checks for duplicate IDs, invalid dates, broken expense references, invalid settlements and current-trip/Past-Trip collisions.

### Settlement edge cases
- Mark Paid cannot overpay the remaining balance.
- Repeated taps on an already settled payment do nothing.
- Self-payments are ignored.
- Travelers referenced by expense payer or settlement history must be archived instead of deleted.

### Country/date boundaries
On a shared transition date, the country beginning that exact date wins deterministically.

### Planned-cost reserve
Paid or already-converted planned costs are reserved only once.
The lookup is faster on large trips.

### App Health
Settings → App health checks:
- Storage
- Database
- Receipts
- Offline app / service worker
- Data integrity
- Performance

### Update reliability
Refresh App now shows **Refreshing…**, then confirms **App refreshed • v6.6.4** after reload.

### Memory cleanup
Receipt preview/viewer image URLs and image sources are released when closed or when iOS backgrounds the app.


## v6.6.5 — Design & Performance Polish

This release intentionally adds no major feature. It focuses on making TripSpend cleaner, lighter and faster.

### Design
- More consistent spacing, card radius and tap targets.
- Home uses larger readable secondary labels and a cleaner visual hierarchy.
- Expense rows are lighter and easier to scan while keeping Repeat/Edit/Delete available.
- Add Expense is tighter and the Save button stays easier to reach when the iPhone keyboard is open.
- Plan country cards and planned-cost rows use lighter surfaces and cleaner actions.
- Analytics keeps the larger v6.5.2 typography while reducing visual weight.
- Settings is grouped into **Manage trip**, **Preferences & safety**, and **Tools & data**.
- Dark-mode muted text and borders have stronger contrast.
- Subtle page entrance motion respects Reduce Motion.

### Performance
- Expense text search is debounced by 120 ms.
- Expense search text is indexed and cached until trip data changes.
- Expense filters run in one pass instead of seven chained array scans.
- Traveler and country filter menus rebuild only when their source data changes.
- Expense list DOM is not rebuilt if data/filter state is unchanged.
- Analytics charts are not rebuilt when underlying trip data has not changed.
- Personal/shared/largest and biggest-day analytics reuse cached calculations.
- Plan country totals are aggregated once per render instead of scanning all expenses for every country.
- Planned-cost rendering no longer writes to storage on every page render unless a status actually changed.
- v5 Home widgets render only when Home is visible; returning to Home refreshes them.
- Existing 100-expense progressive rendering remains in place.

### Compatibility
- No data-model migration.
- Existing trips, receipts, settlements, Past Trips, backups and appearance settings are preserved.


## v6.6.6 — Trip Switcher & Easier Past Trips

Past Trips are now much easier to discover without adding another bottom-navigation tab.

### Quick access
- Tap the **current trip name** at the top of the app.
- Or tap **Trips & history** near the bottom of Home.

### Trip Switcher
The new bottom sheet shows:
- Current Trip with flags, dates, amount spent, country count and expense count.
- Up to 5 recent Past Trips with flags, dates, status and total spent.
- Tap a Past Trip to reopen it.
- **Manage All Trips** opens the full Trips & History page.
- **Start New Trip** is available directly from the switcher.
- If you have more than 5 Past Trips, a **View all** shortcut appears.

### Full management remains available
Settings → Trips & history still contains Finish Trip, Trip Report, Start New Trip, full history and Delete controls.

### Compatibility
- No new bottom navigation item.
- No data-model or IndexedDB migration.
- Existing trips, receipts, settlements, reports, Past Trips and backups are preserved.


## v6.6.7 — Daily Use Refinement

### Home
- Reserved/Available budget information now sits behind a compact **Budget Details** row.
- Safe Today continues to include planned costs automatically.
- The main Home budget card is easier to scan.

### Expenses
- On touch devices, use **•••** or swipe left to reveal **Repeat / Edit / Delete**.
- Swipe right to close quick actions.
- Tapping the expense itself still opens Expense Details.
- Desktop action buttons remain visible.
- Expense list rendering now reuses country/traveler maps and appends rows in one DOM fragment.

### Past Trips
- Past Trip cards emphasize **Spent**, **Saved / Over**, and **Expenses**.
- Open Trip remains the strongest action.
- Trip Switcher also shows saved/over-budget result.

### Plan
- Planned costs now clearly say **Planned** or **Added to expenses**.

### Analytics
- Added one compact budget-pace line: Before trip, On pace, Spending faster, or Trip complete.
- No extra chart was added.

### Filters
- Search/filters remain while using the same trip.
- They automatically reset when switching trips or starting a new one.

### Receipts
- Receipt preview in Expense Details is larger.
- Receipt images still load only when opened.

### Compatibility
- No data-model or IndexedDB migration.
- Existing data remains compatible.


## v6.6.8 — Smooth & Aesthetic Pass

This release intentionally adds no major feature. It focuses on making TripSpend feel calmer, smoother and more like a native mobile app.

### Motion
- Faster, softer page transitions.
- Bottom sheets use a more natural iOS-style entrance.
- Modal backdrops fade in smoothly.
- Expense quick actions reveal more naturally.
- Button press feedback is more consistent.
- Reduce Motion is respected across the full interface.

### Visual polish
- Softer card borders and shadows.
- More consistent corner radii.
- Cleaner typography spacing and hierarchy.
- Quieter Settings and Plan surfaces.
- Refined Home budget treatment.
- More elegant Analytics hero and category bars.
- Improved Trip Switcher treatment.
- Toast messages are less visually intrusive.

### Navigation
- Re-tapping the current tab no longer rebuilds the page.
- Re-tapping the current tab smoothly returns to the top.
- Switching tabs changes immediately instead of waiting for a long scroll animation.
- Open expense quick-actions close automatically when changing pages.

### Performance
- Long expense, country, planned-cost and trip-history views use containment hints.
- Expense and Plan rows can use `content-visibility` to reduce off-screen rendering work.
- Animation rules favor transform/opacity instead of broad layout-affecting transitions.
- Backdrop blur gracefully falls back to solid surfaces when unsupported.

### Mobile
- Slightly tighter horizontal spacing.
- Bottom navigation uses a lighter glass treatment.
- Bottom sheets have more native proportions.
- Dark Mode uses softer borders and shadows while preserving readability.

### Compatibility
- No data-model or IndexedDB migration.
- Existing trips, receipts, settlements, Past Trips, backups and settings remain compatible.


## v6.6.9 — Number & Readability Polish

### Smart money formatting
Whole currency amounts no longer show unnecessary decimal zeros.

Examples for OMR:
- `1,000.000 OMR` → `1,000 OMR`
- `500.000 OMR` → `500 OMR`
- `0.000 OMR` → `0 OMR`

If an OMR amount has a real fractional value, TripSpend keeps all 3 decimal places:
- `17.767 OMR` → `17.767 OMR`
- `1,250.500 OMR` → `1,250.500 OMR`
- `982.233 OMR` → `982.233 OMR`

Currencies normally displayed with 2 decimal places follow the same rule: whole values hide `.00`, while fractional values keep their normal precision.

### Cleaner percentages
- Whole percentages display without `.0`.
- Meaningful fractional percentages may use one decimal.
- Progress-bar calculations are unchanged.

### Large values
- Main Home balance, Analytics total and Expense Details automatically use a smaller font when values become very long.
- Numeric values use tabular figures for cleaner alignment.
- Narrow iPhone layouts are protected from monetary-value overflow.

### Consistency
The shared money formatter is used throughout Home, Expenses, Plan, Analytics, Past Trips, settlement and trip reports.

Exchange-rate precision is intentionally unchanged.

### Compatibility
- Display-only update.
- No calculation changes.
- No data-model or IndexedDB migration.
- Existing trips, receipts, settlements, Past Trips and backups remain compatible.


## v6.7 — Trip Planner

The existing Plan tab is now a lightweight Trip Planner without turning TripSpend into a complicated itinerary app.

### Itinerary | Costs
The Plan tab now has two clean views:
- **Itinerary** — day-by-day travel plans
- **Costs** — the existing countries, country budgets and planned costs

### Itinerary items
Add:
- ✈️ Flight
- 🏨 Hotel
- 🎟️ Activity
- 🍽️ Restaurant
- 🚕 Transport
- 📝 Note

Each item can have:
- date
- optional time
- country
- Planned / Booked status
- location
- booking reference
- optional estimated cost
- note

### Cost connection
When an itinerary item has an estimated cost:
- TripSpend automatically creates/updates a linked Planned Cost
- it is included in existing Safe Today / planned-reserve calculations
- **+ Expense** opens Add Expense already filled from the itinerary item
- once recorded, the itinerary item shows **PAID**
- no duplicate data entry is required

### Day-by-day timeline
- Plans are grouped by date
- Today is highlighted
- Times and country/location appear directly in the timeline
- Completed items fade back
- Mark items Done / Undo
- Edit and Delete from the timeline

### Home integration
The existing compact plan row on Home now quietly prioritizes:
- **TODAY** when you have an itinerary item today
- otherwise **NEXT PLAN**
- otherwise it falls back to the next destination as before

This adds trip planning without adding another Home card.

### Local-first
Itinerary data is stored in the same local TripSpend state:
- included in automatic restore points
- included in portable JSON backups
- included when trips move into Past Trips
- restored when reopening a Past Trip

### Compatibility
- Existing planned costs continue to work.
- Existing trips load with an empty itinerary until you add items.
- IndexedDB schema remains v2; no receipt-store migration is required.


## v6.7.2 — Home / Plan Separation

This release corrects the v6.7.1 direction and restores the cleaner v6.7 Home structure.

### Home
Home is again focused on:
- Trip Budget Left
- Safe Today / Spent Today
- Add Expense
- Current Country
- Country budgets
- one compact **Next Up** row
- Trip Health
- Trips & History

There is **no full Today itinerary card** and no second Plan-style experience on Home.

### Next Up
The existing compact Home planner row now shows only one useful preview:
- the next itinerary item today, if one exists
- otherwise the next future itinerary item
- otherwise the next country
- otherwise a simple Trip Planner / Trip Complete state

If multiple plans exist today, the label can show the count, while still displaying only one item.

Tapping **Next Up** opens the **Itinerary** view in Plan.

### Plan
Plan remains the only full planning surface:
- day-by-day itinerary
- flights
- hotels
- activities
- restaurants
- transport
- notes
- booking references
- estimated costs
- Planned / Booked / Done / Paid
- Itinerary | Costs

### Design
- Home stays visually lighter than Plan.
- Add Expense remains the dominant Home action.
- Next Up is styled as a compact bridge to the planner.
- Trip Health and Trips & History stay low emphasis.

### Compatibility
- No data-model migration.
- No IndexedDB migration.
- No calculation changes.
- Existing itinerary, expenses, receipts, settlements, history and backups remain compatible.


## v6.7.3 — Home Dashboard Polish

This release improves the responsiveness and consistency of the Home dashboard.

- Trip Health retains its compact Home styling after dashboard refreshes.
- Budget Details opens and closes smoothly while honoring reduced-motion preferences.
- Country flags and country-budget rows update with fewer live DOM operations.
- Country progress bars consistently indicate warning and over-budget states.
- Home actions have clearer keyboard focus, and country-budget controls expose descriptive labels.
- The service-worker cache is versioned as v6.7.3 so installed apps receive the updated shell.

## v6.7.4 — Refined Home Experience

- Reorders Home around today's budget, the primary expense action, and current trip context.
- Clarifies over-budget amounts and explains the Safe Today calculation.
- Replaces browser prompts with an accessible country-budget editor.
- Updates existing country-budget nodes where possible instead of rebuilding the full list.
- Improves Home typography, spacing, focus states, and reduced-motion-friendly interactions.

## v6.7.5 — Home Reliability Fixes

- Corrects over-budget wording in the current-country card.
- Keeps the main budget label aligned with the amount it represents.
- Restores focus after closing the country-budget editor and contains keyboard focus while it is open.
- Removes a browser-compatibility dependency from country-row updates.

## v6.7.6 — Currency Converter Reliability

- Prevents a slower, outdated exchange-rate request from overwriting the latest selected currency pair.
- Uses the current amount when an exchange-rate request finishes while the user is still typing.
- Cleans up exchange-rate request timeouts after both successful and failed requests.

## v6.8 — Today-first dashboard

- Adds a personalized, date-aware greeting and a clearer daily overview.
- Introduces a unified budget hero with integrated Safe Today and Spent Today metrics.
- Redesigns Add Expense as a prominent, descriptive quick action.
- Groups current-trip context and country budgets into clean, scannable surfaces.
- Adds responsive light and dark styling for a more polished mobile dashboard.

## v6.8.1 — Confirmed AI actions

- TripSpend AI can prepare adds/edits for expenses, itinerary items and planned costs.
- AI can prepare trip-budget and country-budget changes.
- Every write is validated locally and requires an explicit confirmation tap.
- Delete actions are not available in this release.
- AI still excludes receipt images, backups and past-trip archives.
- Cloudflare Worker must be updated with `worker/ai-worker.js` for action support.

