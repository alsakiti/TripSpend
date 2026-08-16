# TripSpend AI Worker

TripSpend is a public static PWA, so AI provider keys must never be stored in `index.html`, `app.js`, `ai.js`, localStorage, or any other browser-delivered file. This Worker keeps provider credentials server-side.

## Environment variables / secrets

Required for each provider you enable:

- `OPENAI_API_KEY` — secret
- `OPENAI_MODEL` — optional; defaults to `gpt-5.6`
- `ANTHROPIC_API_KEY` — secret
- `ANTHROPIC_MODEL` — required if Claude is enabled
- `GEMINI_API_KEY` — secret
- `GEMINI_MODEL` — optional; defaults to `gemini-3.6-flash`
- `ALLOWED_ORIGIN` — use `https://alsakiti.github.io`

After deploying the Worker, put its HTTPS URL in the root `ai-config.json` file as the `endpoint` value. You can remove providers from `enabledProviders` if their server-side secret/model is not configured.

## Security before public launch

The Worker checks the browser Origin and limits request size, but Origin/CORS alone is not an authentication or billing-control mechanism. Before offering TripSpend AI broadly, add abuse protection such as Cloudflare rate limiting and/or Turnstile, or require authenticated TripSpend users. Do not expose a provider API key or a reusable private token in the PWA as a shortcut.

## Data sent by the current AI client

The client sends a compact snapshot of the active trip: trip dates/budget, countries, traveler names, up to 300 recent expenses, plans, itinerary details, settlements and current dashboard metrics. It intentionally excludes receipt images, backups and past-trip archives. Chat history is kept in browser memory only for the current page session.

TripSpend AI is read-only in this first version: it can answer questions but cannot modify expenses, budgets, itinerary or settlements.
