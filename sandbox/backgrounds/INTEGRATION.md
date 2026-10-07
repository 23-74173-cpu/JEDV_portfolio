# INTEGRATION.md — combo preset only (01 drift + 02 spotlight + 05 grain)

> **NOT APPLIED.** Everything below is a proposal. The sandbox
> (`sandbox/backgrounds/`) stays unimported until you approve.
> Covers the **combo** = the two top picks (02 spotlight, 05 grain) plus 01
> drift at reduced intensity. Option 03 (dot grid) is documented as
> “add with changes” in the review and is NOT specced here. Options 04 and
> 06 are skipped (see evaluation in the review message).

## 1. What ships (ported, not copied)

Three sandbox files are ported into one dependency-free vanilla module
`src/fx/background.ts` (new file, ~200 lines, no GSAP — the sandbox rAF lerp
is kept; `gsap.quickTo` is an optional later swap for the spotlight only).
No React state touches the animation; React only mounts/unmounts.

Proposed tokens (the only additions — everything else reuses existing tokens):

```css
--bg-fx-opacity: 1;      /* master multiplier, 0 disables */
```

Light theme gets lower intensity inside the module's own CSS
(`:root[data-theme="light"]` overrides, same as the sandbox), so no extra
token is needed per theme.

## 2. Exact diffs (proposed — do not apply yet)

### Patch A — `src/index.css` (append; base layer + kill switches)

```diff
+/* ============ Background FX (combo: drift + spotlight + grain) ============
+   Fixed layers sit at z-index 0, below everything. Content paints above
+   via its own stacking; paper sections are opaque and occlude the FX fully.
+   Cursor layers never mount on touch (JS gate); this CSS is the backstop. */
+.jedv-bg-fixed { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
+.site-shell { isolation: isolate; } /* contain the z-0 layers inside the shell */
+@media (hover: none), (pointer: coarse), (max-width: 700px) {
+  .jedv-bg-fixed { display: none; }
+}
+@media (prefers-reduced-motion: reduce) {
+  .jedv-bg-fixed .jedv-anim { animation: none !important; }
+}
+:root[data-theme="light"] .jedv-bg-fixed { opacity: 0.55; }
```

### Patch B — new `src/fx/background.ts` (vanilla, port of the 3 sandbox modules)

Condensed port — full code would be written at implementation time from
`sandbox/backgrounds/bg-01…`, `bg-02…`, `bg-05…`, `bg-combo.js`:

```ts
// mountBackgroundFx(): mounts 3 fixed layers (drift 0.65 / spot 0.8 / grain 0.55)
// honors prefers-reduced-motion, (hover:hover)+(pointer:fine) for the spot,
// visibilitychange pause. Returns destroy() — idempotent, StrictMode-safe.
export function mountBackgroundFx(): () => void { /* … */ }
```

### Patch C — `src/App.tsx` (mount in the shell, cleanup on unmount)

```diff
 import gsap from 'gsap';
 import { ScrollTrigger } from 'gsap/ScrollTrigger';
 import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
+import { mountBackgroundFx } from './fx/background';
@@
 function App({ ssr = false }: { ssr?: boolean }) {
@@
+  // Background FX: imperative fixed layers only. No ScrollTrigger, no scrub,
+  // no React state — cannot affect pins. Cleanup removes layers + listeners.
+  useEffect(() => {
+    if (ssr) return undefined;
+    const destroy = mountBackgroundFx();
+    return () => destroy();
+  }, [ssr]);
+
   const [theme, setTheme] = useState<Theme>(() => /* unchanged */);
```

### Patch D — `src/main.tsx` — no change needed (App owns the lifecycle).

## 3. Z-index stack (after patches)

| Layer | z | Notes |
|---|---|---|
| bg-fx fixed layers (3) | **0** | `pointer-events:none`, `aria-hidden`, inside `isolation:isolate` shell |
| page content | auto / 1+ | paints above z-0 by stacking order |
| scroll readout `.scroll-readout` | 29 | unaffected, always above |
| toasts `.toast-region`, rail `.section-rail` | 30 | unaffected |
| command palette `.palette-backdrop` | 40 | unaffected |
| inspection dialog | 45 | unaffected |
| sticky header `.site-header` | 50 | solid `var(--bg)` — occludes FX, stays readable |
| boot screen `.boot-screen` | 60 | opaque, covers FX during boot |

The existing pinned project deck and horizontal timeline create their own
stacking contexts **above** z-0 content; pinning math (`projects-reveal`,
`timeline-horizontal`) reads scroll positions only and never queries these
layers, so scrub/snap distances are byte-identical.

## 4. Timeline exclusion + mobile

- **Timeline (and About/Skills/GitHub/Contact):** these are `.paper-section`
  with opaque `var(--paper)` backgrounds. A fixed z-0 layer physically cannot
  show through opaque paint — exclusion is structural, zero JS. Verified with
  the “paper panel” in `preview.html` (if FX is ever visible inside it, that
  is a P0 bug in the port).
- **Mobile / touch:** two gates — (a) the spotlight module never mounts its
  follower unless `(hover:hover) and (pointer:fine)`; (b) Patch A hides all
  `.jedv-bg-fixed` layers on `(hover:none)`, `(pointer:coarse)`, or
  `≤700px`. Drift + grain are CSS-only and cheap, but hidden anyway so the
  phone pays nothing.
- **Reduced motion:** static first frame (modules park transforms / kill
  keyframes); the CSS backstop in Patch A covers any porting slip.

## 5. Cleanup on unmount

`destroy()` (returned by `mountBackgroundFx`, wired in Patch C):

1. `cancelAnimationFrame` the spotlight loop,
2. remove `pointermove / visibilitychange / jedv-sim-rm` listeners,
3. remove the 3 layer nodes + the injected `<style>` node,
4. safe to call twice (StrictMode dev double-mount).

## 6. Verify ScrollTrigger is untouched (post-implementation checklist)

```sh
npx tsc --noEmit
rg -n "ScrollTrigger|scrollTrigger|quickTo|gsap\." src/fx/background.ts || echo "no GSAP in FX module"
git diff --stat -- src/App.tsx src/index.css   # only the patches above
npm run build && npm run preview
```

Manual: open `?` — hero pin start/end, project deck snap slots, and
`timeline-horizontal` progress fill must match `main` exactly (record
`ScrollTrigger.getById('projects-reveal').start/end` before/after);
FPS overlay in `preview.html` should show no new longtasks on desktop.
