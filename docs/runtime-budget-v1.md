# LUNEA runtime budget V1

`index.html` starts with one inline script, `luneaRuntimeBudgetV1`, that runs before every other module.
It changes no module. It removes work the modules did without visible effect.

## Why

Measured on a 390×844 viewport, Chrome with CPU ×4 (iPhone-class), before this change:

- Idle, with the home screen open and nothing touched, the page used **64–78 % CPU**.
- 112 MutationObservers (32 watching the whole document) and 47 intervals re-applied the same
  attribute, class, style or text thousands of times a second. Every identical write still queues a
  mutation record, which wakes every document-wide observer, which writes again.
- 42 infinite CSS animations ran on the home screen; the glow loops animate `box-shadow`/`filter`
  and repaint every frame.
- Horary/Prashna, Intimacy, Meihua and Lenormand modules (~650 KB) ran before the home screen was shown.

## What it does

1. **DOM write guard** — `setAttribute`, `removeAttribute`, `toggleAttribute`, `classList.add/remove/toggle(force)`,
   `style.setProperty`, common `style.*` properties, `hidden`, `className`, `id`, `cssText` and `textContent`
   skip a write that would not change the DOM. Not guarded: `src`/`href`, and `textContent` on an element
   whose children are not a single text node. Skips are counted in `window.__LUNEA_DOM_WRITE_GUARD_STATS__`.
2. **Motion budget** — infinite loops that animate `box-shadow`, `filter`, `background-position`,
   `backdrop-filter` or `text-shadow` play two cycles, then rest at their end state. Transform/opacity loops
   keep running. Home animations pause while `body.modal-open`.
3. **Feature defer** — `<script>` insertions whose file name contains `horary`, `prashna`, `intimacy`,
   `meihua` or `lenormand` are held until `html.lunea-ui-ready` (or the first tap after it, or 9 s).
   An inert placeholder with the same `id` and `src` stays in the document so loaders that look for an
   existing element or scan `document.scripts` do not insert the module twice. On release the original
   element replaces the placeholder in the original order and fires its own `load`/`error`.

## Result (same setup)

| | before | after |
|---|---|---|
| idle CPU, 30–36 s after load | 64 % | 3 % |
| idle CPU, first 30 s | 68 % | 34 % |
| home reveal, 150 ms RTT, CPU ×2 | 6.0 s | 5.0 s |

Home controls at reveal, the nine feature entries (General, Love, Career, Timing, Intimacy, Lenormand,
Meihua, Horary, Thai) and page errors were compared against `main` and are identical.

## Adding modules

- A new module that the home screen needs must not have one of the deferred words in its file name.
- A new feature module named with one of those words loads after reveal automatically.
