# API & External Dependencies

The Bench is a static site — 32 of its 35 tools have **no** network dependency at all beyond the shared Google Fonts import used site-wide. Three tools call free, keyless third-party HTTP APIs, one tool loads a small CDN library, one loads placeholder photo URLs, and the hub itself loads an animation library. This document lists every external call in the project, exactly, plus what each caller does if the request fails.

## Site-wide (every page)

| What | URL pattern | Used by | If it fails |
|---|---|---|---|
| Google Fonts | `https://fonts.googleapis.com/css2?family=Space+Grotesk:...&family=Inter:...&family=JetBrains+Mono:...` | `assets/css/style.css` `@import`, loaded on every page | Browser falls back to the generic `sans-serif`/`monospace` families named after each custom font in the CSS `font-family` stacks. Purely cosmetic — no functional impact. |

## Hub only

| What | URL | Used by | If it fails |
|---|---|---|---|
| GSAP 3.12.5 | `https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js` | `index.html` `<head>` script tag | `assets/js/main.js` checks `if (window.gsap)` before using it — if the script fails to load, the hero entrance animation is simply skipped and all hero content renders instantly and statically instead. No error is surfaced to the user. |

## Tool #10 — QR Bench (`qr-code-generator`)

| What | URL | If it fails |
|---|---|---|
| qrcodejs library | `https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js` | If this script fails to load, `QRCode` is undefined and the tool throws when it tries to render — there is no explicit fallback/try-catch around QR generation itself. This is the one tool in the suite without a graceful degradation path for its core dependency. |

## Tool #5 — Hero Slider (`image-slider`)

| What | URL pattern | If it fails |
|---|---|---|
| Placeholder photos | `https://picsum.photos/seed/<name>/1200/700` (5 fixed seeds: `bench-forge`, `bench-wood`, `bench-tools`, `bench-light`, `bench-notes`) | Standard `<img>` tags with no `onerror` handler — if an image fails to load, the browser shows a broken-image icon in that slide but the slider's navigation, autoplay, and captions all continue to function normally. |

## Tool #11 — Weather Bench (`weather-app`)

Two-step flow against **Open-Meteo** (no API key required):

| Step | Endpoint | Example |
|---|---|---|
| 1. Geocode city name → coordinates | `GET https://geocoding-api.open-meteo.com/v1/search?name=<city>&count=1` | `?name=London&count=1` |
| 2. Fetch weather for those coordinates | `GET https://api.open-meteo.com/v1/forecast?latitude=<lat>&longitude=<lon>&current_weather=true&hourly=relativehumidity_2m,apparent_temperature&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto` | current conditions + hourly humidity/feels-like + 5-day daily forecast |

**If the geocode step returns no results:** a `Bench.toast('City not found', 'error')` is shown and nothing further happens.

**If either fetch throws (network error, non-JSON response, etc.):** caught in a try/catch; shows `Bench.toast('Could not load weather. Check your connection.', 'error')` and reveals the "no data" empty state (`#weather-empty`) instead of the current-conditions card.

**On first load:** if the user has saved favorite cities, the first favorite is loaded automatically; otherwise it defaults to searching "Rajkot".

## Tool #18 — Recipe Box (`recipe-finder`)

Two endpoints against **TheMealDB** free tier (test API key baked into the base URL path, `/1/`, no separate key needed):

| Purpose | Endpoint | Example |
|---|---|---|
| Search meals by name | `GET https://www.themealdb.com/api/json/v1/1/search.php?s=<query>` | `?s=chicken` |
| Look up full recipe by id | `GET https://www.themealdb.com/api/json/v1/1/lookup.php?i=<id>` | `?i=52771` |

**If the search call fails:** caught in a try/catch; shows `Bench.toast('Could not reach the recipe API', 'error')`. The grid is left empty (cleared before the request begins) and the "no recipes found" empty state is shown once loading finishes.

**If the lookup call (opening a recipe's detail modal) fails:** caught separately; shows `Bench.toast('Could not load recipe details', 'error')` and the modal does not open with content.

**Favorites are resilient to API failure:** bookmarked recipes store a snapshot of `{ id, name, img, category, area }` at save time, so the favorites list still renders correctly even if TheMealDB is completely unreachable — only opening a favorite's full detail (ingredients/instructions) requires a live `lookup.php` call.

## Tool #19 — Unit Bench (`unit-converter`)

| Purpose | Endpoint |
|---|---|
| USD-based exchange rates (Currency tab only) | `GET https://open.er-api.com/v6/latest/USD` |

Length/weight/speed/temperature conversions are pure client-side math and make **no** network calls — only switching to the Currency tab triggers this fetch, and it's fetched once per page load (cached in memory for the session).

**If the fetch fails:** caught in a try/catch; shows `Bench.toast('Currency rates unavailable offline', 'warn')` and falls back to a synthetic rate table of `{ USD: 1 }` — meaning every currency effectively converts 1:1 with USD until the page is reloaded and the fetch succeeds. This is a soft degradation (the tool keeps working and keeps producing numbers), not a hard failure state, so it's worth knowing the displayed conversions become meaningless (not just unavailable) while offline.

## Summary table

| Tool | Network dependency | Fails gracefully? |
|---|---|---|
| Weather Bench | Open-Meteo geocoding + forecast | Yes — toast + empty state |
| Recipe Box | TheMealDB search + lookup | Yes — toast, favorites still render from cached snapshot |
| Unit Bench (Currency tab) | open.er-api.com | Partially — silently falls back to 1:1 USD rates rather than blocking |
| QR Bench | qrcodejs CDN script | No — no fallback if the library fails to load |
| Hero Slider | picsum.photos images | Yes — broken image icon only, rest of UI unaffected |
| Hub | GSAP CDN script | Yes — animation skipped, content shown statically |
| All pages | Google Fonts | Yes — falls back to system fonts |
| All other 29 tools | none | N/A — fully offline-capable once the page itself has loaded |
