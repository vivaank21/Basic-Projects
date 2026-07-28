# The Bench — 35 Small Web Tools

> One workshop, thirty-five tools. Everything runs in the browser, every save stays on your own device.

The Bench is a static, no-build, no-backend collection of 35 self-contained web apps — a task board, a calculator, a snake game, an invoice generator, a pixel art studio, and more — all hung on the same "pegboard" hub page. Despite the hub still saying "20 Tools" in its `<title>` and footer copy (a leftover from an earlier version of the project), the catalog and folder structure currently contain **35** tools, numbered `01` through `35`.

There is no server, no database, and no build step. Every page is plain HTML/CSS/JS, opened directly in a browser or served by any static file host. Anything a tool needs to remember (tasks, high scores, saved palettes, invoice counters, etc.) is written to the browser's `localStorage` under a namespaced key — see [ARCHITECTURE.md](./ARCHITECTURE.md) for how that works.

## Quick start

No install, no dependencies to fetch (aside from a couple of CDN `<script>` tags loaded at runtime). To run locally:

```bash
# from the project root
python3 -m http.server 8000
# then open http://localhost:8000/index.html
```

Opening `index.html` directly via `file://` mostly works too, but a local server is recommended since a couple of tools (weather, currency conversion, recipe search) make `fetch()` calls that some browsers restrict on `file://` origins.

## Project structure

```
20-web-projects/
├── index.html              ← the hub ("The Bench") — catalog, search, category filters
├── assets/
│   ├── css/
│   │   ├── style.css       ← shared design system (colors, type, buttons, layout, dark/light theme)
│   │   ├── loader.css      ← hub page-load mask animation
│   │   └── parallax.css    ← hub hero background glow parallax
│   └── js/
│       ├── storage.js      ← Bench.Storage (localStorage wrapper) + Bench.toast/debounce/formatTime
│       └── main.js         ← hub catalog data, rendering, search/filter, theme toggle, entrance animation
└── projects/
    ├── 01-todo-list/
    │   ├── index.html
    │   ├── script.js
    │   └── style.css
    ├── 02-calculator/
    ├── 03-snake-game/
    ├── ...
    └── 35-expense-invoice-tracker/
```

Every tool folder follows the exact same three-file shape (`index.html`, `script.js`, `style.css`), which is what makes the suite easy to extend — see [ARCHITECTURE.md](./ARCHITECTURE.md#adding-a-new-tool) for the recipe.

## The catalog

| # | Tool | Category | What it does |
|---|------|----------|---------------|
| 01 | Task Board | Productivity | Categorized tasks, priority tags, drag-to-reorder, saved filters |
| 02 | Calculator | Utility | Standard and scientific modes with a running history drawer |
| 03 | Snake | Game | Canvas arcade snake with skins, sound toggle, local high-score table |
| 04 | Sign-Up Flow | Form | Multi-step registration with live validation and password-strength meter |
| 05 | Hero Slider | Media | Touch-swipe slider with autoplay, captions, thumbnail rail |
| 06 | BMI Gauge | Utility | Interactive sliders feeding a live gauge and saved history log |
| 07 | Password Smith | Utility | Entropy-rated password generator with a small saved vault |
| 08 | Palette Forge | Utility | Lock colors, convert HEX/RGB/HSL, export a saved palette |
| 09 | Counter Bank | Productivity | Multiple named counters with step size, targets, and history |
| 10 | QR Bench | Utility | Custom QR codes with color/size control and a scan history log |
| 11 | Weather Bench | Data | City search with a 5-day outlook and saved favorite locations |
| 12 | Ledger | Finance | Income vs. expense bars, category filters, monthly summaries |
| 13 | Quiz Master | Game | Timed trivia with card-flip reveals and a top-scores board |
| 14 | Focus Timer | Productivity | Configurable work/break cycles with streak tracking |
| 15 | Memory Flip | Game | 3D flipping match game across three grid sizes with a move counter |
| 16 | Markdown Bench | Productivity | Live-preview note editor with tags, word count, and export |
| 17 | Typing Trial | Game | WPM and accuracy trainer with a live results graph |
| 18 | Recipe Box | Data | Ingredient search, cook timers, bookmarked favorites |
| 19 | Unit Bench | Utility | Currency, length, weight, temperature, and speed conversions |
| 20 | Sound Deck | Media | Playlist player with an animated visualizer and equalizer |
| 21 | Car Racing | Game | Lane-dodging racer that speeds up the longer you survive |
| 22 | Treasure Hunter Adventure | Game | Procedural dungeon crawl — grab the gems, dodge the traps |
| 23 | Space Defender | Game | Wave-based invader shooter with escalating enemy fire |
| 24 | Zombie Survival Arena | Game | Twin-stick survival against endless waves of the horde |
| 25 | Tower Defense | Game | Place towers, hold the path, survive escalating waves |
| 26 | Gradient Generator | Creative | Color-theory palettes turned into ready CSS gradients |
| 27 | Logo Maker | Creative | Emblem, name, and layout combined into an exportable logo |
| 28 | Poster Designer | Creative | Drag-to-place headline and subtitle over a custom background |
| 29 | Pixel Art Studio | Creative | Grid-based pixel painter with fill tool and PNG export |
| 30 | Social Post Creator | Creative | Square, story, or landscape posts, ready to export |
| 31 | Receipt Generator | Business | Itemized receipts with tax, ready to print or save as PDF |
| 32 | Invoice Generator | Business | Client invoices with line items, tax, and due dates |
| 33 | GST Billing | Business | Indian GST invoices with automatic CGST/SGST/IGST split |
| 34 | Quotation Maker | Business | Client estimates with validity dates and clear terms |
| 35 | Biz Tracker | Business | Invoiced, collected, pending, and expenses in one dashboard |

For controls, storage keys, and implementation notes on each of these, see **[TOOLS.md](./TOOLS.md)**.

## Tech stack

- Vanilla HTML/CSS/JS — no framework, no bundler, no package.json
- Each tool is a self-executing `(function () { ... })();` in its own `script.js`
- Shared `Bench` global (`window.Bench`) provides `Storage`, `toast`, `debounce`, and `formatTime` helpers to every tool
- GSAP (via CDN) powers the hub's entrance animation only — individual tools don't use it
- A handful of tools call free, keyless third-party HTTP APIs (weather, currency, recipes) — see **[API-DEPENDENCIES.md](./API-DEPENDENCIES.md)**
- Theming is a single `data-theme="dark"|"light"` attribute on `<html>`, backed by CSS custom properties in `style.css`

## Documentation index

- **[README.md](./README.md)** — this file: what the project is, how to run it, the full catalog
- **[TOOLS.md](./TOOLS.md)** — per-tool deep dive: controls, storage keys, notable implementation details
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** — shared systems, file conventions, and how to add a new tool
- **[API-DEPENDENCIES.md](./API-DEPENDENCIES.md)** — exact external endpoints used and each tool's offline/failure behavior
- **[OVERVIEW.txt](./OVERVIEW.txt)** — single-file combined overview of the whole project

## Known quirks

- The hub's `<title>` and footer text still read "20 Tools" / "a bench of 35 small tools" even though the catalog and folder listing hold 35 entries — cosmetic leftover from before the suite grew.
- Everything is client-side only: clearing browser data (or using a different browser/device/incognito window) resets every tool's saved state, since it all lives in `localStorage` with no server-side sync.
- A few tools depend on free public APIs with no authentication and no formal uptime guarantee (see API-DEPENDENCIES.md) — they degrade gracefully but won't work without a network connection.
