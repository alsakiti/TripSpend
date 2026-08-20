# TripSpend AI Worker — v7.1.0

TripSpend AI uses Gemini when `GEMINI_API_KEY` is configured and falls back to Cloudflare Workers AI through the `AI` binding.

## Required Worker setup

- Add/keep a **Workers AI** binding named `AI`.
- Add/keep a text variable `ALLOWED_ORIGIN` with value `https://alsakiti.github.io`.
- Deploy through `wrangler.toml`; `ai-worker-v703.js` is the configured entry point and wraps `ai-worker.js`.
- Keep the root `ai-config.json` endpoint pointed at the deployed Worker URL.

The primary model is `gemini-3.5-flash-lite`; the fallback is `@cf/zai-org/glm-4.7-flash`. Receipt vision uses `@cf/moondream/moondream3.1-9B-A2B`.

## Capabilities

The Worker can now return a structured proposed action for:

- add/edit/delete expenses, itinerary, planned costs, countries, travelers and settlements
- trip and country budget changes
- bilingual planning, forecasts, calculation explanations and duplicate analysis
- receipt field confidence, warnings and review-before-apply

The Worker does **not** write to TripSpend storage. It only proposes actions. The browser validates each proposal, shows a confirmation card and writes only after the user taps **Confirm change**. The browser also keeps a session undo snapshot.

## Security

The Worker checks the browser Origin, limits request size and uses the `AI_RATE_LIMITER` binding configured for 30 requests per client/trip per 60 seconds.

## Data sent by the AI client

The client sends a compact snapshot of the active trip: trip dates/budget, country/traveler IDs and names, recent expenses, plans, itinerary, settlements, current dashboard metrics and a small summary of trip-scoped learned preferences. It excludes receipt images, backups and past-trip archives from chat. Chat history and undo state stay in the current browser session. A receipt image is sent only when the user explicitly chooses **Scan receipt**.
