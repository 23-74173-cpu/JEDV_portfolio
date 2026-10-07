/* 06 · Section-aware tint — sandbox only, NOT imported by the app.
 * No animation loop. Three full-screen washes cross-fade by *scroll progress*:
 *   p=0    ink/neutral (rest)      · .s0 opacity 1
 *   p=0.5  lime command glow       · .s1 peaks mid-page
 *   p=1    cool muted steel        · .s2 takes over at the end
 * Drive it with setProgress(0..1). Opacity writes only — no transform loop,
 * no rAF of its own. Safe under reduced motion (scroll-driven = instant).
 * Integration hook: call setProgress(scrollY / (scrollHeight - innerHeight))
 * from the existing ScrollTrigger onUpdate / scroll listener. */
(function () {
  var ID = 'section-tint';
  var CSS = [
    '.jedv-bg6{position:fixed;inset:0;overflow:hidden;pointer-events:none;z-index:0}',
    '.jedv-bg6 div{position:absolute;inset:0;will-change:opacity}',
    '.jedv-bg6 .s0{background:radial-gradient(120% 90% at 50% 0%,color-mix(in srgb,var(--text-muted) 7%,transparent),transparent 60%);opacity:1}',
    '.jedv-bg6 .s1{background:radial-gradient(100% 80% at 15% 30%,color-mix(in srgb,var(--lime) 8%,transparent),transparent 62%);opacity:0}',
    '.jedv-bg6 .s2{background:radial-gradient(110% 85% at 85% 70%,color-mix(in srgb,var(--text-muted) 12%,transparent),transparent 60%);opacity:0}',
    ':root[data-theme="light"] .jedv-bg6 .s0{background:radial-gradient(120% 90% at 50% 0%,color-mix(in srgb,var(--text-muted) 5%,transparent),transparent 60%)}',
    ':root[data-theme="light"] .jedv-bg6 .s1{background:radial-gradient(100% 80% at 15% 30%,color-mix(in srgb,var(--lime) 4%,transparent),transparent 62%)}',
    ':root[data-theme="light"] .jedv-bg6 .s2{background:radial-gradient(110% 85% at 85% 70%,color-mix(in srgb,var(--text-muted) 8%,transparent),transparent 60%)}'
  ].join('\n');

  function clamp01(v) { v = Number(v); if (isNaN(v)) return 0; return Math.min(1, Math.max(0, v)); }

  function mount(opts) {
    opts = opts || {};
    var intensity = typeof opts.intensity === 'number' ? opts.intensity : 1;
    var style = document.createElement('style');
    style.setAttribute('data-jedv-bg', ID);
    style.textContent = CSS;
    document.head.appendChild(style);

    var layer = document.createElement('div');
    layer.className = 'jedv-bg6';
    layer.setAttribute('aria-hidden', 'true');
    var s0 = document.createElement('div'); s0.className = 's0';
    var s1 = document.createElement('div'); s1.className = 's1';
    var s2 = document.createElement('div'); s2.className = 's2';
    layer.appendChild(s0); layer.appendChild(s1); layer.appendChild(s2);
    document.body.appendChild(layer);

    var last = -1;
    function setProgress(p) {
      p = clamp01(p);
      if (p === last) return; // no DOM write when nothing changed
      last = p;
      // Triangular weights: s0 fades 0→0.5, s1 peaks at 0.5, s2 rises 0.5→1.
      var w0 = Math.max(0, 1 - p * 2);
      var w1 = p < 0.5 ? p * 2 : (1 - p) * 2;
      var w2 = Math.max(0, (p - 0.5) * 2);
      s0.style.opacity = (w0 * intensity).toFixed(3);
      s1.style.opacity = (w1 * intensity).toFixed(3);
      s2.style.opacity = (w2 * intensity).toFixed(3);
    }
    setProgress(typeof opts.progress === 'number' ? opts.progress : 0);

    var api = {
      id: ID,
      layer: layer,
      setProgress: setProgress,
      setIntensity: function (v) { intensity = Math.max(0, Math.min(1.5, v)); last = -1; },
      setPaused: function () { /* no loop — nothing to pause */ },
      destroy: function () {
        if (style.parentNode) style.parentNode.removeChild(style);
        if (layer.parentNode) layer.parentNode.removeChild(layer);
      }
    };
    // Later-integration hook (global, documented in README/INTEGRATION.md).
    window.JEDV_SECTION_TINT = window.JEDV_SECTION_TINT || {};
    window.JEDV_SECTION_TINT.setProgress = setProgress;
    var prevDestroy = api.destroy;
    api.destroy = function () {
      if (window.JEDV_SECTION_TINT && window.JEDV_SECTION_TINT.setProgress === setProgress) {
        window.JEDV_SECTION_TINT.setProgress = function () {};
      }
      prevDestroy();
    };
    return api;
  }

  window.JEDV_BG = window.JEDV_BG || {};
  window.JEDV_BG[ID] = { id: ID, name: 'Section-aware tint', mount: mount };
})();
