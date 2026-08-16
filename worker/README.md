# TripSpend AI Worker

TripSpend AI now uses Cloudflare Workers AI through a Worker binding named `AI`. No third-party AI API key is required in the PWA or Worker code.

## Required Worker setup

- Add a **Workers AI** binding named `AI`.
- Add a text variable `ALLOWED_ORIGIN` with value `https://alsakiti.github.io`.
- Deploy `ai-worker.js` as the Worker code.
- Set the root `ai-config.json` endpoint to the deployed Worker URL.

The current model is `@cf/zai-org/glm-4.7-flash`.

## Security before public launch

The Worker checks the browser Origin and limits request size. CORS is not a full abuse-control system, so before offering TripSpend AI broadly, add rate limiting and/or another abuse-control layer in Cloudflare.

## Data sent by the current AI client

The client sends a compact snapshot of the active trip: trip dates/budget, countries, traveler names, recent expenses, plans, itinerary details, settlements and current dashboard metrics. It intentionally excludes receipt images, backups and past-trip archives. Chat history is kept only in browser memory for the current page session.

TripSpend AI is read-only in this first version: it can answer questions but cannot modify expenses, budgets, itinerary or settlements.

The old `OPENAI_API_KEY` secret is not used by this version and can be removed from Cloudflare once the Workers AI version is confirmed working.
