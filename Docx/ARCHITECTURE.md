# Architecture

The Bench is deliberately simple: static files, no build step, no framework, no backend. This document covers how the shared pieces fit together and, at the bottom, exactly how to add a 36th tool that fits the existing pattern.

## 1. High-level layout

```
20-web-projects/
├── index.html                 the hub page ("The Bench")
├── assets/
│   ├── css/
│   │   ├── style.css          design system: CSS variables, base elements, .glass/.btn/.chip/.container etc.
│   │   ├── loader.css         hub-only: full-screen loading mask shown until window 'load'
│   │   └── parallax.css       hub-only: background "glow" parallax on scroll
│   └── js/
│       ├── storage.js         window.Bench — Storage, toast, debounce, formatTime (loaded by every page)
│       └── main.js            hub-only: catalog data array, card rendering, search/filter, theme toggle, GSAP entrance
└── projects/
    └── NN-tool-slug/
        ├── index.html         links ../../assets/css/style.css + local style.css; loads ../../assets/js/storage.js + local script.js
        ├── script.js           self-contained IIFE; the only file that changes tool-to-tool logic
        └── style.css           tool-specific layout/visuals only — never redefines shared tokens
```

There is no package.json, no bundler config, and no server code anywhere in the project. Every `<script src>` and `<link href>` is a plain relative path (or, for a couple of tools, a CDN URL — see below).

## 2. The shared design system (`assets/css/style.css`)

All visual language — color palette, type, spacing, buttons, glassmorphism panels — lives in one file, defined as CSS custom properties on `:root`:

```css
:root{
  --ink: #12151c;       --ink-2: #0c0e13;      /* backgrounds */
  --panel: #1a1f2a;     --panel-2: #212837;    /* card/panel surfaces */
  --border: rgba(232,230,225,0.09);
  --text: #e8e6e1;      --muted: #8b93a1;      --muted-2: #5b6270;
  --amber: #f0a868;     --teal: #5ec8bd;       --danger: #e2685f;
  --font-display: 'Space Grotesk', sans-serif;
  --font-body: 'Inter', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  --r-sm: 8px; --r-md: 14px; --r-lg: 22px;
}
```

**Theming** is a single attribute swap: `<html data-theme="dark">` vs. `<html data-theme="light">`. A second `:root[data-theme="light"]{ ... }` block overrides the ink/panel/text/muted variables for the light palette — every component built on the variables (not hardcoded colors) re-themes automatically. The hub's theme toggle button just flips this attribute and persists the choice (see §3).

Individual tool `style.css` files only ever add tool-specific layout (grids, card shapes, canvas sizing) and should reference the shared variables (`var(--panel)`, `var(--amber)`, etc.) rather than hardcoding colors, so a tool automatically respects the dark/light toggle.

Google Fonts (Space Grotesk / Inter / JetBrains Mono) are pulled via a single `@import url(...)` at the top of `style.css` — this is a network dependency shared by every page; see API-DEPENDENCIES.md.

`loader.css` and `parallax.css` are hub-only visual flourishes (the "warming up the bench…" loading mask, and the scroll-linked background glow blobs behind the hero) — no tool page includes them.

## 3. `Bench.Storage` — the shared persistence layer (`assets/js/storage.js`)

Every page loads this script before its own `script.js`. It attaches a global `Bench` object:

```js
Bench.Storage.get(ns, name, fallback)   // reads bench:<ns>:<name> from localStorage, JSON-parsed
Bench.Storage.set(ns, name, value)      // JSON-stringifies and writes bench:<ns>:<name>
Bench.Storage.remove(ns, name)          // deletes one key
Bench.Storage.clearNamespace(ns)        // deletes every key under bench:<ns>:*
```

Every actual `localStorage` key is prefixed `bench:` and namespaced by tool (e.g. `bench:todo:tasks`, `bench:snake:best`) specifically so that 35 independent tools sharing one `localStorage` origin (the whole site is one origin) never collide on key names. Each tool's `script.js` declares `const NS = 'todo'` (etc.) once at the top and passes it into every `Storage.get/set` call.

Also on `Bench`:
- `Bench.debounce(fn, wait=300)` — generic debounce, used for search boxes, autosave, and live-recompute inputs across most tools
- `Bench.formatTime(totalSeconds, showHours=false)` — `MM:SS` or `HH:MM:SS` formatting, used by timers/stopwatches (Pomodoro, Memory Flip, Typing Trial, Sound Deck)
- `Bench.toast(message, type)` — a minimal, dependency-free toast/notification system. It lazily creates a fixed-position host `<div id="bench-toast-host">` on first use and animates toasts in/out with inline styles (no CSS file needed) — used for validation errors, success confirmations, and "can't reach the API" warnings

Because `Bench.Storage` is the **only** persistence mechanism in the whole project, there is no IndexedDB, no cookies, and no server-side session anywhere — see §6 for what this means for reuse/deployment.

## 4. The hub (`index.html` + `assets/js/main.js`)

The hub is the one page that isn't a "tool" — it's the catalog/landing page. Its logic lives in `assets/js/main.js`:

- `Bench.catalog` — a plain array of `{ n, id, title, cat, desc, accent }` objects, one per tool, in display order. This array is the **single source of truth** for what appears on the hub; a tool's `projects/NN-slug/` folder existing on disk does nothing by itself — it must also have an entry here to show up (see §7).
- Card rendering (`cardHTML`) builds the anchor tag pointing at `projects/<NN>-<id>/index.html`, using `String(n).padStart(2,'0')` to generate the two-digit folder prefix.
- Search input (debounced 150ms) and category filter buttons both filter the same in-memory array and re-render.
- An `IntersectionObserver`-driven `.reveal`/`.is-visible` class pattern staggers card entrance as they scroll into view (falls back to showing everything immediately if `IntersectionObserver` is unavailable).
- A tilt-on-hover effect (`data-tilt`) computes cursor position relative to each card and sets `--rx`/`--ry` custom properties consumed by a CSS `transform: rotateX(var(--rx)) rotateY(var(--ry))` in `style.css`.
- Theme toggle reads/writes `Bench.Storage.get/set('hub', 'theme', 'dark')` and flips `document.documentElement.dataset.theme`.
- On `DOMContentLoaded`, if `window.gsap` is present (loaded via CDN in `index.html`'s `<head>`), a short entrance animation staggers the hero text/stats in. GSAP is **only** used on the hub — no individual tool page loads it.

## 5. The per-tool page pattern

Every `projects/NN-slug/index.html` follows the same shape:

```html
<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  ...
  <link rel="stylesheet" href="../../assets/css/style.css">
  <link rel="stylesheet" href="style.css">
</head>
<body class="pegboard">
  <a class="bench-nav glass" href="../../index.html">&larr; The Bench</a>
  <main class="container tool-shell">
    <header class="tool-head [center]">
      <span class="eyebrow">Tool #NN · Category</span>
      <h1>Tool Title</h1>
      <p>One-line description of what it does / how to use it.</p>
    </header>
    <!-- tool-specific markup -->
  </main>
  <script src="../../assets/js/storage.js"></script>
  <script src="script.js"></script>
</body>
</html>
```

And every `script.js` follows the same IIFE shape:

```js
(function () {
  const NS = 'tool-namespace';
  // grab DOM refs
  // load persisted state via Bench.Storage.get(NS, 'key', fallback)
  // define render()/save() functions
  // wire up event listeners
  // initial render() call
})();
```

This consistency — same file names, same load order, same wrapper pattern — is what makes the suite easy to skim, diff, and extend. There's no shared JS module system (no ES modules, no imports) — every tool's logic is fully self-contained in its own closure, and the only thing tools share at runtime is the `window.Bench` global from `storage.js`.

## 6. Deployment model

Because this is 100% static files with no server-side code:
- It can be hosted on **any** static file host (GitHub Pages, Netlify, Vercel static, S3+CloudFront, or just opened locally) — there's nothing to configure beyond serving the directory as-is.
- There is no environment-specific configuration (no `.env`, no API keys baked in — every external API used is a free, keyless public endpoint; see API-DEPENDENCIES.md).
- User data has zero server-side footprint: everything lives in that visitor's own browser `localStorage`. There is no cross-device sync, no accounts, and no way to recover data after clearing site data — this is a deliberate simplicity trade-off, not an oversight, and is called out on the hub itself ("100% Local storage").
- The only network calls the *hub* makes are for Google Fonts and the GSAP CDN script; individual tools may make additional calls per API-DEPENDENCIES.md.

## 7. Adding a new tool

To add tool #36 following the existing conventions:

1. **Create the folder**: `projects/36-your-tool-slug/` containing `index.html`, `script.js`, `style.css`.
2. **`index.html`**: copy the shared page shape from §5. Link `../../assets/css/style.css` first, then your own `style.css`. Load `../../assets/js/storage.js` before your own `script.js`. Set the `<title>`, the `Tool #36 · <Category>` eyebrow, `<h1>`, and description `<p>` to match your tool.
3. **`script.js`**: wrap everything in a single IIFE. Pick a short, unique `const NS = '...'` — check existing namespaces in TOOLS.md to avoid clashing with another tool's `localStorage` keys. Use `Bench.Storage.get/set(NS, key, fallback)` for anything that should persist, `Bench.toast(...)` for user-facing notifications, and `Bench.debounce(...)` for any live-typing/search input. Call your initial render function at the bottom of the IIFE.
4. **`style.css`**: only add tool-specific rules; reuse the shared classes already available globally (`.glass`, `.btn`, `.btn-primary`, `.btn-ghost`, `.btn-teal`, `.chip`, `.chip.is-active`, `.container`, `.tool-shell`, `.tool-head`) instead of re-implementing panel/button styling. Reference color/spacing tokens via `var(--...)` so the tool respects the dark/light theme toggle automatically.
5. **Register it in the hub**: add one entry to the `Bench.catalog` array in `assets/js/main.js`:
   ```js
   { n: 36, id: 'your-tool-slug', title: 'Display Title', cat: 'Utility', desc: 'One-line pitch.', accent: 'amber' }
   ```
   `n` drives the zero-padded folder-number prefix used in the generated link (`projects/${String(n).padStart(2,'0')}-${id}/index.html`), so it must match the folder name exactly. `cat` must be one of the existing filter categories shown in the hub's filter bar (or you'll need to add a new filter button too, in `index.html`'s `#catalog-filters`).
6. **If the tool calls an external API**, wrap the call in try/catch, show a `Bench.toast('...', 'error')` (or a similar inline empty-state message) on failure so the tool degrades gracefully offline — this is the pattern every existing networked tool follows (see API-DEPENDENCIES.md for the exact per-tool examples to copy).
7. **Update docs**: add a row to the catalog table in README.md and a corresponding section in TOOLS.md so the new tool is documented the same way as the other 35.

That's the entire process — there's no build step to run, no routing table to update elsewhere, and no server restart required. Dropping the folder in place and adding the one catalog entry is sufficient for the tool to appear and function.
