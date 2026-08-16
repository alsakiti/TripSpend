# TripSpend AI Worker — v6.8.1

TripSpend AI uses Cloudflare Workers AI through a Worker binding named `AI`. No third-party AI API key is required.

## Required Worker setup

- Add/keep a **Workers AI** binding named `AI`.
- Add/keep a text variable `ALLOWED_ORIGIN` with value `https://alsakiti.github.io`.
- Deploy `ai-worker.js` from this folder as the Worker code.
- Keep the root `ai-config.json` endpoint pointed at the deployed Worker URL.

The model is `@cf/zai-org/glm-4.7-flash`.

## v6.8.1 write actions

The Worker can now return a structured proposed action for:

- add/edit expense
- add/edit itinerary item
- add/edit planned cost
- change trip budget
- change country budget

The Worker does **not** write to TripSpend storage. It only proposes one action. The browser app validates it, shows the user a confirmation card, and writes only after the user taps **Confirm change**. Delete actions are intentionally unsupported in v6.8.1.

## Security

The Worker checks the browser Origin and limits request size. CORS is not a full abuse-control system, so before offering TripSpend AI broadly, add rate limiting and/or another abuse-control layer in Cloudflare.

## Data sent by the AI client

The client sends a compact snapshot of the active trip: trip dates/budget, country/traveler IDs and names, recent expenses, plans, itinerary, settlements and current dashboard metrics. It intentionally excludes receipt images, backups and past-trip archives. Chat history is kept only in browser memory for the current page session.
