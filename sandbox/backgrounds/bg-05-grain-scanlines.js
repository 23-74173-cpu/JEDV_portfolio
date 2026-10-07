/* 05 · Grain + scanlines — sandbox only, NOT imported by the app.
 * Achromatic 128px feTurbulence noise tile (no color: identical on both
 * themes) + ultra-faint scanlines. Opacity-only "breathe" (9s, 0.75↔1 on the
 * grain at ~5% base alpha — effectively ±1% luminance). No blur, no filter
 * animation, no backdrop-filter anywhere. Static under reduced motion. */
(function () {
  var ID = 'grain-scanlines';
  var NOISE = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'128\' height=\'128\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'2\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'128\' height=\'128\' filter=\'url(%23n)\' opacity=\'0.6\'/%3E%3C/svg%3E")';
  var CSS = [
    '.jedv-bg5{position:fixed;inset:0;overflow:hidden;pointer-events:none;z-index:0}',
    '.jedv-bg5 .grain{position:absolute;inset:0;background-image:' + NOISE + ';background-size:128px 128px;opacity:.05;animation:jedv-grain-breathe 9s ease-in-out infinite}',
    '.jedv-bg5 .scan{position:absolute;inset:0;',
    'background:repeating-linear-gradient(to bottom,transparent 0 2px,color-mix(in srgb,var(--text) 4%,transparent) 2px 3px);opacity:.6}',
    '@keyframes jedv-grain-breathe{0%,100%{opacity:.045}50%{opacity:.06}}',
    ':root[data-theme="light"] .jedv-bg5 .grain{opacity:.04;animation-name:jedv-grain-breathe-lt}',
    '@keyframes jedv-grain-breathe-lt{0%,100%{opacity:.035}50%{opacity:.048}}',
    '@media (prefers-reduced-motion:reduce){.jedv-bg5 .grain{animation:none!important}}',
    '.sim-rm .jedv-bg5 .grain{animation:none!important}'
  ].join('\n');

  function mount(opts) {
    opts = opts || {};
    var style = document.createElement('style');
    style.setAttribute('data-jedv-bg', ID);
    style.textContent = CSS;
    document.head.appendChild(style);

    var layer = document.createElement('div');
    layer.className = 'jedv-bg5';
    layer.setAttribute('aria-hidden', 'true');
    var grain = document.createElement('div'); grain.className = 'grain';
    var scan = document.createElement('div'); scan.className = 'scan';
    layer.appendChild(grain); layer.appendChild(scan);
    document.body.appendChild(layer);

    function onVis() {
      var p = document.hidden ? 'paused' : '';
      grain.style.animationPlayState = p;
    }
    document.addEventListener('visibilitychange', onVis);

    var api = {
      id: ID,
      layer: layer,
      setIntensity: function (v) {
        layer.style.opacity = String(Math.max(0, Math.min(1.5, v)));
      },
      setPaused: function (p) { grain.style.animationPlayState = p ? 'paused' : ''; },
      destroy: function () {
        document.removeEventListener('visibilitychange', onVis);
        if (style.parentNode) style.parentNode.removeChild(style);
        if (layer.parentNode) layer.parentNode.removeChild(layer);
      }
    };
    if (typeof opts.intensity === 'number') api.setIntensity(opts.intensity);
    return api;
  }

  window.JEDV_BG = window.JEDV_BG || {};
  window.JEDV_BG[ID] = { id: ID, name: 'Grain + scanlines', mount: mount };
})();
