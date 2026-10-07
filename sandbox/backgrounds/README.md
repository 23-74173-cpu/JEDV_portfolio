# BG Sandbox — animated background options (NOT shipped)

Standalone experiments for the portfolio. **Nothing in this folder is imported
by the app, referenced by `vite.config.ts`, or included in the production
build** (`vite build` only bundles root `index.html` + `src/`). GSAP
pinning/snap/scroll logic in `src/App.tsx` is untouched.

## Open the preview

No build step. Serve the folder (module scripts + `file://` both work; serving
avoids any `file://` quirks):

```sh
cd /home/joed/portfolio/sandbox/backgrounds
python3 -m http.server 8123
# → http://localhost:8123/preview.html
```

or open `sandbox/backgrounds/preview.html` directly in a browser.

Preview controls: buttons / keys `1–7` switch option · `t` theme · `space`
pause · `r` simulated reduced-motion · intensity slider · theme toggle ·
live FPS + longtask readout · section-tint scroll slider + fake 4-section
scroller · opaque paper panel proving the timeline stays clean.

## Files

| File | What |
|---|---|
| `bg-01-gradient-drift.js` | 3 radial washes, 48/56/64s `alternate` drift (transform only) |
| `bg-02-cursor-spotlight.js` | rAF-lerped pointer glow, fades out on leave (GSAP `quickTo` swap noted in-file) |
| `bg-03-dot-grid-reveal.js` | 26px dot tile + masked follower, tile-phase aligned via counter-translate |
| `bg-04-blueprint-grid.js` | 56px 1px grid + `+` markers, one-tile 120s diagonal drift; tile built from computed `--text-faint` |
| `bg-05-grain-scanlines.js` | 128px achromatic feTurbulence tile + 3px scanlines, 9s opacity breathe |
| `bg-06-section-tint.js` | No loop. `setProgress(0..1)` cross-fades 3 washes; global `window.JEDV_SECTION_TINT.setProgress` |
| `bg-combo.js` | Preset: 01 @0.65 + 02 @0.80 + 05 @0.55 |
| `preview.html` | Standalone lab (uses a **copy** of the real tokens — source of truth stays `src/index.css`) |
| `INTEGRATION.md` | Patches for the picks — **not applied** |

## Module contract

Each file registers `window.JEDV_BG[id] = { id, name, mount }`.
`mount({ intensity })` creates its **own** fixed layer
(`position:fixed; inset:0; pointer-events:none; z-index:0`, `aria-hidden`)
and returns `{ layer, destroy(), setIntensity(v), setPaused(b) }`
(+ `setProgress(p)` on 06). Every module:

- animates **transform/opacity only** (verified by grep; the only `filter`
  string in the folder is the static SVG tile generator, not an animated CSS filter),
- renders **static** under `prefers-reduced-motion` (or the preview's
  `.sim-rm` simulation, via the `jedv-sim-rm` event),
- pauses on `visibilitychange` / `setPaused`,
- enables cursor followers only on `(hover:hover) and (pointer:fine)`
  (touch = static base or invisible),
- uses **existing tokens only**: `--bg --surface --surface-2 --text
  --text-muted --text-faint --border --lime --on-lime --paper --ink-text
  --ink-muted --ink-line --ink-line-strong --mono …`.
  No color is hardcoded, except the grain tile which is **achromatic noise**
  (identical on both themes — not a color choice). Light-mode intensity is
  lowered per-module with `:root[data-theme="light"]` overrides.

## Approx. cost per option (see preview FPS/longtask readout live)

| Option | Main-thread cost |
|---|---|
| 01 drift | 0 JS/frame; 3 compositor layers |
| 02 spotlight | 0 idle; 2 style writes/frame only while pointer moves |
| 03 dot reveal | 0 idle; 3 transform writes/frame only while pointer moves |
| 04 blueprint | 0 JS/frame; 1 translating layer |
| 05 grain | 0 JS/frame; 1 opacity tween @5% base alpha |
| 06 tint | 0 idle; ≤3 opacity writes per scroll tick |
| combo | sum of 01+02+05; still zero layout/paint |

## Proposed tokens (only if a pick ships — NOT added)

- `--bg-fx-opacity` — master intensity multiplier (default 1; light theme 0.55)
- `--bg-spot-size` — spotlight diameter (default 560px)

Everything else reuses tokens that already exist.
