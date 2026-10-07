/* 01 · Gradient drift — sandbox only, NOT imported by the app.
 * 2–3 soft radial gradients drifting on 40–60s loops.
 * transform + opacity only. Tokens only (no hardcoded colors).
 * Static when prefers-reduced-motion (or simulated). Pauses when hidden. */
(function () {
  var ID = 'gradient-drift';
  var CSS = [
    '.jedv-bg1{position:fixed;inset:0;overflow:hidden;pointer-events:none;z-index:0}',
    '.jedv-bg1 i{position:absolute;width:62vmax;height:62vmax;border-radius:50%;will-change:transform}',
    '.jedv-bg1 .a{left:-18vmax;top:-20vmax;background:radial-gradient(closest-side,color-mix(in srgb,var(--lime) 11%,transparent),transparent 72%);animation:jedv-drift-a 56s ease-in-out infinite alternate}',
    '.jedv-bg1 .b{right:-20vmax;top:-10vmax;background:radial-gradient(closest-side,color-mix(in srgb,var(--text-muted) 16%,transparent),transparent 70%);animation:jedv-drift-b 48s ease-in-out infinite alternate}',
    '.jedv-bg1 .c{left:22vw;bottom:-26vmax;background:radial-gradient(closest-side,color-mix(in srgb,var(--lime) 7%,transparent),transparent 70%);animation:jedv-drift-c 64s ease-in-out infinite alternate}',
    '@keyframes jedv-drift-a{from{transform:translate3d(0,0,0)}to{transform:translate3d(9vmax,6vmax,0)}}',
    '@keyframes jedv-drift-b{from{transform:translate3d(0,0,0)}to{transform:translate3d(-8vmax,7vmax,0)}}',
    '@keyframes jedv-drift-c{from{transform:translate3d(0,0,0)}to{transform:translate3d(-6vmax,-7vmax,0)}}',
    /* light theme: warm paper — lower intensity, warmer wash */
    ':root[data-theme="light"] .jedv-bg1 .a{background:radial-gradient(closest-side,color-mix(in srgb,var(--lime) 6%,transparent),transparent 72%)}',
    ':root[data-theme="light"] .jedv-bg1 .b{background:radial-gradient(closest-side,color-mix(in srgb,var(--text-muted) 10%,transparent),transparent 70%)}',
    ':root[data-theme="light"] .jedv-bg1 .c{background:radial-gradient(closest-side,color-mix(in srgb,var(--lime) 4%,transparent),transparent 70%)}',
    /* reduced motion (native or simulated via .sim-rm on <html>): parked, static */
    '@media (prefers-reduced-motion:reduce){.jedv-bg1 i{animation:none!important}}',
    '.sim-rm .jedv-bg1 i{animation:none!important}',
    '.sim-rm .jedv-bg1 .a{transform:translate3d(4vmax,3vmax,0)}',
    '.sim-rm .jedv-bg1 .b{transform:translate3d(-4vmax,3vmax,0)}',
    '.sim-rm .jedv-bg1 .c{transform:translate3d(-3vmax,-3vmax,0)}'
  ].join('\n');

  function reduced() {
    return document.documentElement.classList.contains('sim-rm') ||
      (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function mount(opts) {
    opts = opts || {};
    var style = document.createElement('style');
    style.setAttribute('data-jedv-bg', ID);
    style.textContent = CSS;
    document.head.appendChild(style);

    var layer = document.createElement('div');
    layer.className = 'jedv-bg1';
    layer.setAttribute('aria-hidden', 'true');
    layer.innerHTML = '<i class="a"></i><i class="b"></i><i class="c"></i>';
    document.body.appendChild(layer);

    var blobs = layer.querySelectorAll('i');
    function applyStaticpark() {
      if (!reduced()) return;
      blobs[0].style.transform = 'translate3d(4vmax,3vmax,0)';
      blobs[1].style.transform = 'translate3d(-4vmax,3vmax,0)';
      blobs[2].style.transform = 'translate3d(-3vmax,-3vmax,0)';
    }
    function clearPark() {
      for (var k = 0; k < blobs.length; k++) blobs[k].style.transform = '';
    }
    // Re-evaluate when the preview toggles simulated reduced motion.
    function onSim() { if (reduced()) applyStaticpark(); else clearPark(); }
    document.addEventListener('jedv-sim-rm', onSim);

    // CSS animations do not paint while the tab is hidden; still, honor the
    // contract explicitly so no work is scheduled.
    function onVis() {
      var paused = document.hidden;
      for (var k = 0; k < blobs.length; k++) {
        blobs[k].style.animationPlayState = paused ? 'paused' : '';
      }
    }
    document.addEventListener('visibilitychange', onVis);

    // Fixed layers are always "onscreen", but keep the observer so the
    // module honors the offscreen-pause contract if reused in a scroller.
    var io = null;
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(function (entries) {
        var vis = entries[0] && entries[0].isIntersecting && !document.hidden;
        for (var k = 0; k < blobs.length; k++) {
          blobs[k].style.animationPlayState = vis ? '' : 'paused';
        }
      });
      io.observe(layer);
    }

    var api = {
      id: ID,
      layer: layer,
      setIntensity: function (v) {
        layer.style.opacity = String(Math.max(0, Math.min(1.5, v)));
      },
      setPaused: function (p) {
        for (var k = 0; k < blobs.length; k++) {
          blobs[k].style.animationPlayState = p ? 'paused' : '';
        }
      },
      destroy: function () {
        document.removeEventListener('jedv-sim-rm', onSim);
        document.removeEventListener('visibilitychange', onVis);
        if (io) io.disconnect();
        if (style.parentNode) style.parentNode.removeChild(style);
        if (layer.parentNode) layer.parentNode.removeChild(layer);
      }
    };
    if (typeof opts.intensity === 'number') api.setIntensity(opts.intensity);
    if (reduced()) applyStaticpark();
    return api;
  }

  window.JEDV_BG = window.JEDV_BG || {};
  window.JEDV_BG[ID] = { id: ID, name: 'Gradient drift', mount: mount };
})();
