/* 03 · Dot grid with cursor reveal — sandbox only, NOT imported by the app.
 * Faint dot matrix everywhere; a brighter patch follows the cursor.
 * Strictly transform/opacity: the reveal is a masked follower box moved with
 * translate3d, and its inner dot sheet counter-shifts so the 26px tile phase
 * stays aligned with the base grid (no mask-position / paint animation).
 * Static base grid only on touch or reduced motion. */
(function () {
  var ID = 'dot-grid-reveal';
  var TILE = 26, FOLLOW = 440;
  var CSS = [
    '.jedv-bg3{position:fixed;inset:0;overflow:hidden;pointer-events:none;z-index:0}',
    '.jedv-bg3 .base{position:absolute;inset:-220px;',
    'background-image:radial-gradient(circle,var(--text-faint) 1px,transparent 1.4px);',
    'background-size:' + TILE + 'px ' + TILE + 'px;opacity:.42}',
    '.jedv-bg3 .follow{position:absolute;top:0;left:0;width:' + FOLLOW + 'px;height:' + FOLLOW + 'px;will-change:transform;opacity:0;',
    '-webkit-mask-image:radial-gradient(closest-side,#000 30%,transparent 72%);',
    'mask-image:radial-gradient(closest-side,#000 30%,transparent 72%)}',
    '.jedv-bg3 .follow .inner{position:absolute;inset:-660px;will-change:transform;',
    'background-image:radial-gradient(circle,color-mix(in srgb,var(--text) 55%,transparent) 1px,transparent 1.4px);',
    'background-size:' + TILE + 'px ' + TILE + 'px;opacity:.5}',
    '.jedv-bg3 .follow .wash{position:absolute;inset:60px;border-radius:50%;',
    'background:radial-gradient(closest-side,color-mix(in srgb,var(--lime) 9%,transparent),transparent 70%)}',
    ':root[data-theme="light"] .jedv-bg3 .base{opacity:.5}',
    ':root[data-theme="light"] .jedv-bg3 .follow .inner{opacity:.42}',
    ':root[data-theme="light"] .jedv-bg3 .follow .wash{background:radial-gradient(closest-side,color-mix(in srgb,var(--lime) 5%,transparent),transparent 70%)}'
  ].join('\n');

  function finePointer() {
    return window.matchMedia &&
      window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  }
  function reduced() {
    return document.documentElement.classList.contains('sim-rm') ||
      (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }
  function mod(n, m) { return ((n % m) + m) % m; }

  function mount(opts) {
    opts = opts || {};
    var intensity = typeof opts.intensity === 'number' ? opts.intensity : 1;
    var style = document.createElement('style');
    style.setAttribute('data-jedv-bg', ID);
    style.textContent = CSS;
    document.head.appendChild(style);

    var layer = document.createElement('div');
    layer.className = 'jedv-bg3';
    layer.setAttribute('aria-hidden', 'true');
    var base = document.createElement('div'); base.className = 'base';
    var follow = document.createElement('div'); follow.className = 'follow';
    var inner = document.createElement('div'); inner.className = 'inner';
    var wash = document.createElement('div'); wash.className = 'wash';
    follow.appendChild(inner); follow.appendChild(wash);
    layer.appendChild(base); layer.appendChild(follow);
    document.body.appendChild(layer);
    layer.style.opacity = String(Math.max(0, Math.min(1.5, intensity)));

    var BASE_PAD = 220;          // .base inset offset
    var fx = -9999, fy = -9999;  // follower top-left (so center lands on cursor)
    var tfx = fx, tfy = fy, fop = 0, tfop = 0;
    var raf = 0, running = false, paused = false, destroyed = false;
    var enabled = finePointer() && !reduced();

    function frame() {
      if (destroyed || paused || document.hidden) { running = false; return; }
      fx += (tfx - fx) * 0.2; fy += (tfy - fy) * 0.2; fop += (tfop - fop) * 0.15;
      // Keep the inner sheet tile-aligned with .base: base tiles from
      // (-BASE_PAD,-BASE_PAD); follower tiles from (fx,fy) + inner inset.
      var dx = mod((fx - (-BASE_PAD)) + (-660 - 0), TILE);
      var dy = mod((fy - (-BASE_PAD)) + (-660 - 0), TILE);
      follow.style.transform = 'translate3d(' + fx.toFixed(1) + 'px,' + fy.toFixed(1) + 'px,0)';
      inner.style.transform = 'translate3d(' + (-dx).toFixed(1) + 'px,' + (-dy).toFixed(1) + 'px,0)';
      follow.style.opacity = fop.toFixed(3);
      var settled = Math.abs(tfx - fx) < 0.4 && Math.abs(tfy - fy) < 0.4 && Math.abs(tfop - fop) < 0.004;
      if (settled && tfop === 0) { running = false; return; }
      raf = window.requestAnimationFrame(frame);
    }
    function kick() {
      if (!running && !destroyed && !paused && !document.hidden && enabled) {
        running = true; raf = window.requestAnimationFrame(frame);
      }
    }
    function onMove(e) {
      if (!enabled) return;
      tfx = e.clientX - FOLLOW / 2; tfy = e.clientY - FOLLOW / 2; tfop = 1;
      kick();
    }
    function onLeave() { tfop = 0; kick(); }
    function onSim() {
      enabled = finePointer() && !reduced();
      if (!enabled) { tfop = 0; fop = 0; follow.style.opacity = '0'; }
    }
    function onVis() { if (!document.hidden) kick(); }

    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    window.addEventListener('blur', onLeave);
    document.addEventListener('visibilitychange', onVis);
    document.addEventListener('jedv-sim-rm', onSim);

    return {
      id: ID,
      layer: layer,
      setIntensity: function (v) {
        intensity = Math.max(0, Math.min(1.5, v));
        layer.style.opacity = String(intensity);
      },
      setPaused: function (p) {
        paused = !!p;
        if (!paused) kick();
        else if (running) { running = false; window.cancelAnimationFrame(raf); }
      },
      destroy: function () {
        destroyed = true;
        window.cancelAnimationFrame(raf);
        window.removeEventListener('pointermove', onMove);
        document.documentElement.removeEventListener('pointerleave', onLeave);
        window.removeEventListener('blur', onLeave);
        document.removeEventListener('visibilitychange', onVis);
        document.removeEventListener('jedv-sim-rm', onSim);
        if (style.parentNode) style.parentNode.removeChild(style);
        if (layer.parentNode) layer.parentNode.removeChild(layer);
      }
    };
  }

  window.JEDV_BG = window.JEDV_BG || {};
  window.JEDV_BG[ID] = { id: ID, name: 'Dot grid + cursor reveal', mount: mount };
})();
