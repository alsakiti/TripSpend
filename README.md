# TripSpend

A GitHub Pages-ready travel spending tracker built with plain HTML, CSS, and JavaScript.

## Included

- Trip name, destination, dates, budget, home currency, and trip currency
- Add expenses in home or foreign currency
- Saves the exchange rate used for each transaction
- Budget / spent / remaining totals
- Safe-to-spend-today calculation
- Expense search, filtering, editing, and deletion
- Category and daily-spending analytics
- JSON backup export/import
- Browser local storage
- Responsive mobile UI and automatic dark mode
- Offline caching after the first successful load

## Publish with GitHub Pages

1. Create a GitHub repository, e.g. `tripspend`.
2. Upload **all files from this folder** to the repository root.
3. Commit the files.
4. Open **Settings → Pages**.
5. Under **Build and deployment**, choose **Deploy from a branch**.
6. Pick the `main` branch and `/ (root)` folder.
7. Save.
8. Wait for GitHub to show your live Pages URL.

## Storage warning

TripSpend stores data in this browser using `localStorage`. Clearing site/browser data removes the local trip. Use **Settings → Export Backup** regularly. The JSON backup can be imported later or on another device.

## Exchange rate convention

Enter the exchange rate as:

`1 HOME currency = X EXPENSE currency`

Example: if `1 OMR = 100 THB`, spending `500 THB` is stored as `5 OMR`.

## Files

- `index.html` — app structure
- `style.css` — visual design
- `app.js` — logic and local data
- `manifest.webmanifest` — web-app metadata
- `sw.js` — offline cache
