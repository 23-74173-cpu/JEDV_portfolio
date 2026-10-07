/* 02 · Cursor spotlight — sandbox only, NOT imported by the app.
 * Soft radial glow following the pointer with rAF lerp smoothing.
 * Fades out when the pointer leaves. transform + opacity only.
 * Fine-pointer only; touch/mobile mounts to an (invisible) static state.
 * NOTE: GSAP *is* installed in this repo (gsap 3.15). The sandbox uses rAF
 * lerp deliberately (zero-dep, preview has no build step). At integration,
 * the lerp below can be swapped for gsap.quickTo with identical visuals. */
(function () {
  var ID = 'cursor-spotlight';
  var CSS = [
    '.jedv-bg2{position:fixed;inset:0;overflow:hidden;pointer-events:none;z-index:0}',
    '.jedv-bg2 .glow{position:absolute;top:0;left:0;width:560px;height:560px;margin:-280px 0 0 -280px;border-radius:50%;will-change:transform,opacity;',
    'background:radial-gradient(closest-side,color-mix(in srgb,var(--lime) 10%,transparent),transparent 65%);opacity:0}',
    ':root[data-theme="light"] .jedv-bg2 .glow{background:radial-gradient(closest-side,color-mix(in srgb,var(--lime) 6%,transparent),transparent 65%)}',
    '@media (prefers-reduced-motion:reduce){.jedv-bg2 .glow{transition:none}}'
  ].join('\n');

  function finePointer() {
    return window.matchMedia &&
      window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  }
  function reduced() {
    return document.documentElement.classList.contains('sim-rm') ||
      (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function mount(opts) {
    opts = opts || {};
    var intensity = typeof opts.intensity === 'number' ? opts.intensity : 1;
    var style = document.createElement('style');
    style.setAttribute('data-jedv-bg', ID);
    style.textContent = CSS;
    document.head.appendChild(style);

    var layer = document.createElement('div');
    layer.className = 'jedv-bg2';
    layer.setAttribute('aria-hidden', 'true');
    var glow = document.createElement('div');
    glow.className = 'glow';
    layer.appendChild(glow);
    document.body.appendChild(layer);

    var cx = window.innerWidth / 2, cy = window.innerHeight / 3;
    var tx = cx, ty = cy;           // target
    var curO = 0, targetO = 0;      // opacity (lerped, transform/opacity only)
    var raf = 0, running = false, paused = false, destroyed = false;
    var enabled = finePointer() && !reduced();

    function frame() {
      if (destroyed || paused || document.hidden) { running = false; return; }
      // Lerp toward the pointer; snap when close so the loop can idle.
      cx += (tx - cx) * 0.14;
      cy += (ty - cy) * 0.14;
      curO += (targetO - curO) * 0.12;
      var settled = Math.abs(tx - cx) < 0.4 && Math.abs(ty - cy) < 0.4 && Math.abs(targetO - curO) < 0.004;
      glow.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0)';
      glow.style.opacity = (curO * intensity).toFixed(3);
      if (settled && targetO === 0) { running = false; return; } // idle: no loop
      raf = window.requestAnimationFrame(frame);
    }
    function kick() {
      if (!running && !destroyed && !paused && !document.hidden && enabled) {
        running = true;
        raf = window.requestAnimationFrame(frame);
      }
    }
    function onMove(e) {
      if (!enabled) return;
      tx = e.clientX; ty = e.clientY; targetO = 1;
      kick();
    }
    function onLeave() { targetO = 0; kick(); }
    function onVis() { if (!document.hidden) kick(); }
    function onSim() {
      enabled = finePointer() && !reduced();
      if (!enabled) { targetO = 0; glow.style.opacity = '0'; }
    }

    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    window.addEventListener('blur', onLeave);
    document.addEventListener('visibilitychange', onVis);
    document.addEventListener('jedv-sim-rm', onSim);

    return {
      id: ID,
      layer: layer,
      setIntensity: function (v) { intensity = Math.max(0, Math.min(1.5, v)); kick(); },
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
  window.JEDV_BG[ID] = { id: ID, name: 'Cursor spotlight', mount: mount };
})();
