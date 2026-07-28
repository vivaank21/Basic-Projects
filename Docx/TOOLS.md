# Tools — Controls, Storage, and Implementation Notes

Every tool below follows the shared conventions described in [ARCHITECTURE.md](./ARCHITECTURE.md): an IIFE in `script.js`, a `const NS = '...'` storage namespace, and `Bench.Storage.get/set(NS, key, fallback)` for persistence. Storage keys are listed as `NS:key` (the actual `localStorage` key is `bench:NS:key` — see ARCHITECTURE.md for the prefixing rule).

---

## 01 · Task Board (`todo-list`)
**Category:** Productivity

**Controls**
- Text input + category `<select>` (Work/Personal/Learning/Errands) + priority `<select>` (High/Medium/Low) + "Add task"
- Search box (debounced 150ms) filters visible tasks by title substring
- Category filter chips (All/Work/Personal/Learning/Errands)
- "Hide completed" checkbox
- Checkbox per task toggles done state; ✕ button deletes a task
- Tasks are drag-and-drop reorderable (native HTML5 drag events)
- "Clear completed" footer button

**Storage:** `todo:tasks` — array of `{ id, title, category, priority, done }`

**Notable implementation details**
- IDs via `crypto.randomUUID()`
- Reordering: on `drop`, the DOM order of `<li data-id>` elements is read back and used to re-sort the `tasks` array before saving — the list itself is the source of truth for order, not a separate `position` field
- User-entered text is HTML-escaped via a throwaway `<div>.textContent` trick before being interpolated into the list markup

---

## 02 · Calculator (`calculator`)
**Category:** Utility

**Controls**
- Standard/Scientific mode toggle (Scientific pad adds sin/cos/tan/√/x^y/log/parens/π/n!)
- Full on-screen keypad, or type directly — keyboard support for digits, operators, Enter (=), Backspace, Escape (clear)
- "History" toggle opens a drawer of past calculations; clicking a past result loads it back into the expression; "Clear" empties history

**Storage:** `calculator:history` — array of `{ expr, res }`, capped at the 20 most recent entries

**Notable implementation details**
- Expressions are evaluated with `Function("use strict"; return (...))(...)` after string substitution (`π`→value, `sqrt(`→`Math.sqrt(`, `^`→`**`, `n!`→computed factorial, etc.) — **not** a safe expression parser, just template substitution before running it through `Function`. This is a client-only calculator with no untrusted external input, so the risk is low, but it's worth knowing this isn't a hardened expression evaluator.
- Results are rounded via `.toPrecision(12)` before display to avoid floating-point artifacts like `0.1 + 0.2`.

---

## 03 · Snake (`snake`)
**Category:** Game

**Controls**
- Arrow keys to steer, Space to start/restart
- Touch swipe (up/down/left/right) on the canvas for mobile
- Skin `<select>` (Teal/Amber/Striped), sound toggle button

**Storage:**
- `snake:best` — high score (number)
- `snake:leaderboard` — array of `{ score, date }`, top 5 by score
- `snake:skin` — selected skin name
- `snake:sound` — boolean

**Notable implementation details**
- Canvas-based (20×20 grid on a 400×400 canvas), game loop via `setInterval` at 110ms
- Sound effects use the raw Web Audio API (`AudioContext` + `OscillatorNode`), not audio files — a short square-wave beep on eating food, a low tone on game over
- Food placement rejects any cell currently occupied by the snake body

---

## 04 · Sign-Up Flow (`registration-form`)
**Category:** Form

**Controls**
- 3-step wizard: Account (email/password/confirm) → Profile (name/role/bio) → Review
- Back / Continue / Create account buttons; step dots show progress
- Live validation: email format regex, password length + strength meter (bar fill + color, scored on length ≥8, uppercase, digit, symbol), confirm-password match
- Draft autosaves as you type (debounced 500ms) with a small "Draft saved" note

**Storage:** `registration:draft` — object of non-password field values (`email`, `name`, `role`, `bio`); explicitly **excludes** `password`/`confirm` from what's persisted. Cleared via `Bench.Storage.remove` on successful "submit."

**Notable implementation details**
- Submission is fully local/simulated — there's no backend, so "Create account" just shows a success toast, clears the draft, and resets the form to step 1.
- Password strength score (0–4) drives both the meter fill percentage and its color (red/amber/teal).

---

## 05 · Hero Slider (`image-slider`)
**Category:** Media
**Storage:** none (no persistent state — mode/position resets on reload)

**Controls**
- Prev/next arrows, dot navigation, thumbnail rail, play/pause button
- Autoplay every 4s; pauses on mouse hover and resumes on mouse leave
- Touch swipe (threshold 40px) advances/retreats a slide

**Notable implementation details**
- Slide images are placeholder photos from `https://picsum.photos/seed/<name>/1200/700` (five fixed seeds) — see API-DEPENDENCIES.md
- Any interaction (arrow, dot, thumbnail, swipe) calls `restart()`, which resets the autoplay timer so it doesn't fire immediately after a manual navigation

---

## 06 · BMI Gauge (`bmi-calculator`)
**Category:** Utility

**Controls**
- Height slider/input (cm), weight slider/input (kg) — live-recompute on input
- "Log entry" button appends the current reading to history

**Storage:** `bmi:history` — array of `{ date, bmi, height, weight }`, capped at 15 entries

**Notable implementation details**
- BMI category bands: <18.5 Underweight, 18.5–25 Healthy, 25–30 Overweight, ≥30 Higher range — each with its own gauge color
- Gauge is an SVG arc; fill uses `stroke-dashoffset` against a fixed `ARC_LENGTH` of 251, mapped from a BMI range of 12–40 clamped to [0,1]
- Page copy explicitly notes this is a general index, not a diagnosis, and suggests consulting a clinician for personal guidance

---

## 07 · Password Smith (`password-generator`)
**Category:** Utility

**Controls**
- Length slider, checkboxes for uppercase/lowercase/numbers/symbols/"exclude ambiguous characters" (l, I, 1, O, 0)
- "Generate," "Copy" (to clipboard), a label input + "Save to vault," and a vault list with per-entry remove

**Storage:** `password:vault` — array of `{ label, password, date }`

**Notable implementation details**
- Randomness comes from `crypto.getRandomValues` (not `Math.random()`) mapped modulo the active character-set length
- Entropy estimate: `length * log2(poolSize)` bits, mapped to a 0–100% meter and a Weak/Fair/Strong/Very strong label (thresholds at 40/64/100 bits)
- Regenerates automatically whenever length or any checkbox changes

---

## 08 · Palette Forge (`color-generator`)
**Category:** Utility

**Controls**
- "Shuffle" button or Space bar (when not focused in a text field) — regenerates all unlocked swatches
- Click a swatch's lock icon to keep it through the next shuffle
- Click a swatch's code to copy it to clipboard
- Double-click anywhere in the row to cycle the displayed format: HEX → RGB → HSL
- "Save palette" stores the current 5-color set

**Storage:**
- `palette:current` — current 5 colors (as `{h,s,l}` objects), persisted so a reload doesn't lose your in-progress palette
- `palette:locked` — 5-element boolean array of which swatches are locked
- `palette:saved` — array of saved 5-color palettes, capped at 8

**Notable implementation details**
- Colors are generated in HSL (hue random 0–360, saturation 55–90%, lightness 40–70%) and converted to hex for both the swatch fill and hex display via a manual `hslToHex` conversion
- Text color on each swatch auto-switches between light/dark based on the swatch's lightness for legibility

---

## 09 · Counter Bank (`counters`)
**Category:** Productivity

**Controls**
- Name / step size / optional target inputs + "Add" to create a new counter card
- Per-card +/− buttons (by the configured step), reset (↺), and delete
- Optional progress bar shown when a target is set

**Storage:** `counters:list` — array of `{ id, name, step, target, value, history }`, where `history` is an array of `{ t: timestamp, v: value }` snapshots recorded on every increment/decrement

**Notable implementation details**
- Ships with one default counter ("Daily reps", step 5, target 100) the first time it loads with no saved data
- Decrementing is clamped at a minimum value of 0

---

## 10 · QR Bench (`qr-code-generator`)
**Category:** Utility

**Controls**
- Text input (any string: URL, note, contact info), size slider, foreground/background color pickers
- "Download PNG" and "Download SVG" buttons
- History list of recent inputs (click to reload)

**Storage:** `qr:history` — array of up to 8 recent generated strings (deduplicated, most-recent-first), truncated to 50 chars in the history list display

**Notable implementation details**
- Uses the third-party **qrcodejs** library loaded from a CDN (`cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js`) — the only tool in the suite with a non-hub CDN dependency
- Regenerates on a 400ms debounce as you type, and immediately on size/color change
- "Download SVG" is a thin wrapper: it embeds the already-rendered PNG canvas as a `data:` URI inside a one-element `<svg><image .../></svg>` rather than generating true vector paths

---

## 11 · Weather Bench (`weather-app`)
**Category:** Data

**Controls**
- City search box + "Search" button (Enter also triggers search)
- Favorite city chips (click to reload that city's weather)
- ★/☆ toggle to save/remove the currently displayed city as a favorite (max 6 favorites kept)

**Storage:** `weather:favorites` — array of `{ name, lat, lon }`, capped at 6

**Notable implementation details**
- Two-step network flow: geocode the city name (Open-Meteo Geocoding API) to get lat/lon, then fetch current + hourly + 5-day daily forecast (Open-Meteo Forecast API) — see API-DEPENDENCIES.md for both endpoints and exact failure behavior
- Weather codes (WMO codes 0–99) are mapped to a small hardcoded dictionary of `[description, emoji]` pairs; unrecognized codes fall back to `['Unknown', '🌡️']`
- On first load: if there are saved favorites, it loads the first one; otherwise it defaults to searching "Rajkot"

---

## 12 · Ledger (`expense-tracker`)
**Category:** Finance

**Controls**
- Description + amount + income/expense type + category, "Add" button
- Category filter chips
- ✕ deletes a transaction row
- Running income/expense/balance summary with a proportion bar

**Storage:** `ledger:transactions` — array of `{ id, desc, amount, type, category, date }`

**Notable implementation details**
- Amounts are formatted as Indian Rupees (`₹`, `toLocaleString('en-IN')`)
- The balance bar's fill width is `income / (income + expense) * 100`, defaulting to 50% when there's no data yet

---

## 13 · Quiz Master (`quiz`)
**Category:** Game

**Controls**
- Category picker (Science, History, Code, Geography — 8 questions each, hardcoded in `script.js`)
- Each question has a 15-second countdown; picking an option (or timing out) flips a card to reveal correct/incorrect
- "Retry" returns to category selection after results

**Storage:** `quiz:topscores` — array of `{ score, category, date }`, sorted descending by score, capped at 6

**Notable implementation details**
- All question banks are static data embedded directly in `script.js` — there is no external trivia API
- A missed/timed-out answer is scored the same as any wrong answer (passed as `chosen = -1`, which never matches a valid option index)

---

## 14 · Focus Timer (`pomodoro`)
**Category:** Productivity

**Controls**
- Work/Short break/Long break mode buttons
- Start/Pause, Reset
- Editable durations for each mode (minutes)
- Optional "linked task" text field describing what you're focusing on

**Storage:**
- `pomodoro:settings` — `{ work, short, long }` minutes, defaults `{25, 5, 15}`
- `pomodoro:streak` — `{ lastDate, streak, todayCount }`
- `pomodoro:task` — the linked-task text (debounced 400ms)

**Notable implementation details**
- Streak logic: completing a work session on the same calendar day increments `todayCount`; completing one on a new day either continues the streak (if the previous completion was yesterday) or resets it to 1
- The countdown ring is an SVG circle whose `stroke-dashoffset` is animated against a fixed circumference (`2π×90`)
- Only completing a **work** session (not a break) counts toward the streak

---

## 15 · Memory Flip (`memory`)
**Category:** Game

**Controls**
- Grid size `<select>` (determines rows×cols, e.g. 4×4/4×6/6×6)
- Click cards to flip; two non-matching flips auto-revert after 800ms
- "New game" restarts with a fresh shuffle

**Storage:** `memory:best-<gridSize>` — separate best score object `{ moves, seconds }` **per grid size** (e.g. `memory:best-4x4`), so difficulty levels don't share a leaderboard

**Notable implementation details**
- Card icons are workshop-themed emoji (🔧🔨🪛🪚🧰🔩⚙️🪜🧲📏✂️🖌️), sliced to however many pairs the current grid size needs
- Star rating (1–3 stars) is based on an "efficiency" ratio of `pairCount / moves` (>0.8 → 3 stars, >0.5 → 2 stars, else 1)
- 3D flip visual is CSS-driven (`.mem-card-inner` front/back faces), not canvas

---

## 16 · Markdown Bench (`markdown-notes`)
**Category:** Productivity

**Controls**
- Notes list (searchable) on the left; title/tags/body editor with a live preview pane on the right
- "New note," "Delete," "Export" (downloads the current note as a `.md` file)

**Storage:** `markdown:notes` — array of `{ id, title, tags[], body }`

**Notable implementation details**
- Ships with a "Welcome" note pre-populated the first time there's no saved data
- The Markdown → HTML renderer is a small hand-rolled regex pipeline (headings, bold/italic/inline code, code fences, blockquotes, links, unordered lists, paragraphs) — **not** a full CommonMark implementation, so edge cases (nested lists, tables, ordered lists) aren't supported
- Autosaves 350ms after you stop typing in any of title/tags/body

---

## 17 · Typing Trial (`typing`)
**Category:** Game

**Controls**
- Duration `<select>` (e.g. 15/30/60s)
- "Custom text" button reveals a textarea to paste your own passage (Enter submits, Shift+Enter for a newline)
- Type into the input to match the displayed passage; correctness is shown character-by-character

**Storage:** `typing:best-<duration>` — best WPM **per duration setting** (e.g. `typing:best-30`)

**Notable implementation details**
- WPM is computed as `(charactersTyped / 5) / elapsedMinutes` (the standard "5 chars = 1 word" convention), sampled every second into a `wpmHistory` array
- A small canvas line graph plots WPM over the course of the run
- Five built-in passages are chosen at random each run unless a custom passage is supplied
- Accuracy = `(totalKeystrokes - mistakes) / totalKeystrokes`, floored at 0%

---

## 18 · Recipe Box (`recipe-finder`)
**Category:** Data

**Controls**
- Search box + "Search" button (defaults to "chicken" on first load)
- Filter chips: "All results" / "★ Favorites"
- Click a card to open a detail modal with full ingredients + instructions and a "Start 10-min cook timer" button
- ★/☆ toggle per card to bookmark/unbookmark

**Storage:** `recipes:favorites` — array of bookmarked `{ id, name, img, category, area }`

**Notable implementation details**
- Backed entirely by **TheMealDB**'s free public API (`search.php` by name, `lookup.php` by id) — see API-DEPENDENCIES.md
- The cook timer is a simple fixed 10-minute (600s) countdown with a toast notification on completion — it isn't tied to any recipe-specific cook time from the API (TheMealDB doesn't provide one)
- Favorited items retain a snapshot of name/image/category/area at the time they were saved, so they still render correctly even if the API is later unreachable

---

## 19 · Unit Bench (`unit-converter`)
**Category:** Utility

**Controls**
- Category tabs: Length, Weight, Speed, Temperature, Currency
- From/To unit selects, value input, swap button
- Recent conversions list

**Storage:** `converter:recent` — array of up to 8 recent conversion strings, e.g. `"5 km = 3.1069 mile"`

**Notable implementation details**
- Length/weight/speed use fixed conversion-factor tables relative to a base unit (meter, kilogram, m/s)
- Temperature has dedicated Celsius/Fahrenheit/Kelvin formulas (not a generic factor table, since temperature conversion isn't a simple multiply)
- Currency is the only category requiring a network call — it fetches USD-based exchange rates **once per page load** (cached in a `rates` variable) from `open.er-api.com`; see API-DEPENDENCIES.md for the fallback if that call fails
- Logging to "recent" is debounced 600ms on top of the immediate live conversion, so rapid typing doesn't spam the history list

---

## 20 · Sound Deck (`music-player`)
**Category:** Media

**Controls**
- Play/pause, prev/next
- Seek bar, volume slider, a single-band "EQ" gain slider
- File upload button to load your own audio file
- Playlist list combining 3 built-in demo tracks + any uploaded file

**Storage:** `soundeck:uploadedName` — just the filename of the last uploaded track (the audio blob itself is **not** persisted — `URL.createObjectURL` blobs don't survive a reload, so re-uploading is required each session)

**Notable implementation details**
- Two playback "modes": `demo` tracks are procedurally generated tones via Web Audio `OscillatorNode` (sine/triangle/sawtooth at fixed frequencies, no actual audio files), while an uploaded file plays through an `<audio>` element routed into the same Web Audio graph
- The visualizer is an `AnalyserNode` (`fftSize: 256`) drawn to canvas every animation frame as amber/teal alternating bars
- The EQ slider controls a single `BiquadFilterNode` (`type: 'lowshelf'`) gain — a very simplified "equalizer," not a real multi-band EQ

---

## 21 · Car Racing (`racing`)
**Category:** Game

**Controls**
- Arrow keys or A/D to change lanes; Space to start
- Tap left/right half of the canvas to change lanes on touch devices

**Storage:** `racing:best` — best score (number)

**Notable implementation details**
- 3-lane canvas game; obstacle spawn rate and scroll speed both increase with survival distance (`speed = 4 + distance/500`), shown to the player as a speed multiplier
- Score is `floor(distance / 10)`, not related to obstacles dodged directly
- Collision detection is simple AABB overlap between the player's lane rect and any obstacle rect in the same lane

---

## 22 · Treasure Hunter Adventure (`treasure-hunter-adventure`)
**Category:** Game

**Controls:** Arrow keys or WASD to move around a 10×10 grid; collect all gems, avoid traps, then reach the exit to advance a level

**Storage:** `treasure:best-level` — the deepest level reached across attempts

**Notable implementation details**
- Levels are procedurally generated: random wall density (scaling up slightly with level) and gem/trap counts, with up to 30 generation attempts per level to guarantee the layout is actually solvable
- Solvability is verified via a breadth-first search (BFS) flood-fill from the start cell — gems, traps, and the exit are only placed on cells reachable from the player's starting position
- Health starts at 3; hitting a trap costs 1 health (trap then clears itself) and reaching 0 ends the run and resets to level 1

---

## 23 · Space Defender (`space-defender`)
**Category:** Game

**Controls:** Arrow keys or A/D to move, Space to fire; pointer-down on the left/right half of the canvas also steers (for touch)

**Storage:** `defender:best` — best score (number)

**Notable implementation details**
- Classic Space-Invaders-style formation: enemy rows advance and reverse direction on hitting a screen edge, similar to the genre's traditional "step down" behavior
- Wave count and row count both scale with progress (`rows = min(2 + floor(wave/2), 5)`)
- Enemies fire back (`enemyBullets`), and the player has 3 lives before game over

---

## 24 · Zombie Survival Arena (`zombie-survival-arena`)
**Category:** Game

**Controls:** WASD to move, mouse to aim, click to shoot; survive as many waves as possible

**Storage:** `zombie:best-wave` — highest wave reached

**Notable implementation details**
- Twin-stick shooter: movement is independent of aim direction (mouse position sets aim/fire direction)
- Zombies spawn just outside the four canvas edges and walk toward the player's current position each frame
- Health starts at 100 and depletes on zombie contact; each wave adds more zombies (`spawnLeft = 4 + wave*2`)

---

## 25 · Tower Defense (`tower-defense`)
**Category:** Game

**Controls:** Pick a tower type from the picker row, then click an empty grid tile (off the enemy path) to place it; "Send wave" button starts each wave manually

**Storage:** `towerdefense:best-wave` — highest wave survived

**Notable implementation details**
- The enemy path is a hardcoded zigzag route built once at load time by walking across an 11×11 grid in a back-and-forth pattern (`PATH` array of `{x,y}` grid cells)
- Placing a tower costs gold; towers can only be placed on non-path tiles
- Losing all lives ends the run; "best wave" is only recorded on loss (checked against the wave counter at that point)

---

## 26 · Gradient Generator (`ai-gradient-generator`)
**Category:** Creative

**Controls**
- Scheme `<select>` (Complementary/Triadic/Analogous/Monochrome), gradient type (Linear/Radial/Conic), angle slider
- "Generate," "Copy CSS," "Save"
- Saved gradients grid (click to reload)

**Storage:** `gradient:saved` — array of up to 12 saved CSS `background` gradient strings

**Notable implementation details**
- Despite the "AI" in its catalog title, the color logic is deterministic color-theory math (hue offsets in HSL space per scheme), not a model call — no external API involved
- Saved entries store the final CSS gradient string directly (not the underlying color values), so loading a saved gradient just reassigns `preview.style.background`

---

## 27 · Logo Maker (`logo-maker`)
**Category:** Creative
**Storage:** none (the canvas resets on reload; nothing is saved between sessions)

**Controls**
- Emblem picker (12 emoji options), brand text + tagline inputs
- Layout `<select>` (icon-only/side-by-side/stacked), badge shape `<select>` (circle/rounded-square/none)
- Background/badge/foreground color pickers
- "Download PNG"

**Notable implementation details**
- Entirely canvas-drawn (no DOM/SVG logo elements) — text and emblem are rendered with `ctx.fillText`/`ctx.font`, and the badge shape is drawn with either an arc or a hand-rolled rounded-rect path
- Waits on `document.fonts.ready` before the first draw so the custom webfonts (Space Grotesk/JetBrains Mono) are loaded before text is rasterized — avoids a flash of fallback-font text baked into the exported PNG

---

## 28 · Poster Designer (`poster-designer`)
**Category:** Creative
**Storage:** none

**Controls**
- Title/subtitle text inputs, background style (`solid`/`gradient`) with two color pickers, text color, title font size slider
- Optional background image upload
- **Drag the title and subtitle directly on the canvas** to reposition them
- "Download PNG"

**Notable implementation details**
- Title text is word-wrapped manually (measuring `ctx.measureText` width against 85% of canvas width) and vertically centered around its drag position across however many lines it wraps to
- Dragging works via canvas-space hit-testing: mouse/touch position is converted to canvas coordinates (accounting for CSS scaling) and compared against the current title/subtitle anchor points using a distance threshold
- An uploaded background image is drawn "cover"-style (scaled to fill, cropped) with 55% opacity so text stays legible on top

---

## 29 · Pixel Art Studio (`pixel-art-studio`)
**Category:** Creative

**Controls**
- Grid size `<select>`
- 8-color palette swatches + a custom color picker
- Tool selector: Pencil / Eraser / Fill (bucket)
- Left-click (or touch-drag) paints; right-click erases; "Clear canvas"; "Download PNG"

**Storage:** `pixelart:grid-<n>` — the pixel grid contents, saved **per grid size** (e.g. `pixelart:grid-16`), so switching sizes doesn't overwrite a different size's saved art

**Notable implementation details**
- Fill tool is an iterative stack-based flood fill (not recursive, to avoid stack overflows on larger grids)
- Export downsizes to a true 1px-per-cell canvas (so a 16×16 piece exports as an actual 16×16 PNG, not a scaled-up image) — transparent cells are exported as `rgba(0,0,0,0)`
- Autosaves on every completed stroke (on `mouseup`/`touchend`), not on every individual cell paint

---

## 30 · Social Media Post Creator (`social-media-post-creator`)
**Category:** Creative
**Storage:** none

**Controls**
- Format `<select>` (Square/Story/Landscape — each resizes the canvas to different fixed dimensions)
- Headline + handle text inputs, two gradient color pickers, optional background image upload
- "Download PNG"

**Notable implementation details**
- If a background image is uploaded, it's drawn cover-style with a dark overlay (45% opacity) for text contrast; otherwise falls back to a two-color linear gradient
- Headline text wraps manually (same word-wrap approach as the Poster Designer) sized relative to canvas width so it scales sensibly across the three format presets

---

## 31 · Receipt Generator (`receipt-generator`)
**Category:** Business

**Controls**
- Store name/meta, receipt number (auto-numbered), item rows (name/qty/price, add/remove), tax rate, payment method
- "Print / Save as PDF" (uses the browser's native print dialog)

**Storage:** `receipt:counter` — an auto-incrementing receipt number, starting at 1000, incremented each time you print

**Notable implementation details**
- "Save as PDF" isn't a real PDF export in code — it calls `window.print()` and relies on the browser's built-in "Save as PDF" print destination; the tool's own `@media print` rules just hide the editor pane and let the receipt preview fill the page
- Amounts formatted as `₹` via `toLocaleString('en-IN')`

---

## 32 · Invoice Generator (`invoice-generator`)
**Category:** Business

**Controls**
- From/To name+email, invoice number (auto-numbered), due date (defaults to +14 days), item rows, tax rate, notes
- "Print / Save as PDF"

**Storage:** `invoice:counter` — auto-incrementing invoice number (zero-padded to 4 digits, e.g. `INV-0001`)

**Notable implementation details**
- Same print-to-PDF approach as the Receipt Generator (`window.print()` + print stylesheet), not a generated PDF file
- Ships with two example line items pre-filled ("Website design & build", "Monthly maintenance") as a starting template

---

## 33 · GST Billing System (`gst-billing-system`)
**Category:** Business

**Controls**
- Seller/buyer name, GSTIN, and state fields; invoice number (auto-numbered)
- Item rows include an HSN code field in addition to name/qty/price
- GST rate input
- "Print / Save as PDF"

**Storage:** `gst:counter` — auto-incrementing invoice number (e.g. `GST-0001`)

**Notable implementation details**
- Automatically detects intra-state vs. inter-state transactions by comparing the seller/buyer state strings (case-insensitive)
- Intra-state: splits the GST rate evenly into CGST + SGST (each half the entered rate); inter-state: applies the full rate as IGST — this mirrors India's actual GST structure at a basic level (no reverse charge, no multi-rate line items, no e-invoicing/IRN)

---

## 34 · Quotation & Estimate Maker (`quotation-estimate-maker`)
**Category:** Business

**Controls**
- From/To names, quote number (auto-numbered), validity date (defaults to +30 days), item rows, tax rate, terms text
- "Print / Save as PDF"

**Storage:** `quotation:counter` — auto-incrementing quote number (e.g. `QUO-0001`)

**Notable implementation details**
- Same line-item/print pattern as the invoice and receipt tools; the meaningful difference is the "valid until" date and a free-text terms field instead of due-date/payment semantics

---

## 35 · Expense & Invoice Tracker (`expense-invoice-tracker`)
**Category:** Business

**Controls**
- Two tabs: Invoices (client, amount, status: paid/pending) and Expenses (description, amount, category)
- Add/delete entries in either tab
- Summary row: total invoiced, collected, pending, expenses, net
- A small canvas bar chart of revenue vs. expenses for the last 6 months

**Storage:**
- `biztracker:invoices` — array of `{ id, client, amount, status, date }`
- `biztracker:expenses` — array of `{ id, desc, amount, category, date }`

**Notable implementation details**
- "Collected" = sum of invoices with `status === 'paid'`; "pending" = total invoiced minus collected — unpaid invoices still count toward the invoiced total but not toward collected/net
- The trend chart buckets entries into the trailing 6 calendar months by a computed `YYYY-M` key and draws grouped teal (revenue)/red (expense) bars per month with month labels
