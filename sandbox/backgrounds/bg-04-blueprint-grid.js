/* 04 · Blueprint grid — sandbox only, NOT imported by the app.
 * Faint 1px line grid + "+" crosshair markers on intersections, one tile-sized
 * diagonal drift (120s loop, seamless). transform + opacity only.
 * The "+" tile is built at runtime from the computed --text-faint token so no
 * color is ever hardcoded; it rebuilds on theme change. */
(function () {
  var ID = 'blueprint-grid';
  var TILE = 56, ARM = 6; // 12px arms centered on each intersection
  var CSS = [
    '.jedv-bg4{position:fixed;inset:0;overflow:hidden;pointer-events:none;z-index:0}',
    '.jedv-bg4 .drift{position:absolute;inset:-80px;will-change:transform;animation:jedv-bp-drift 120s linear infinite}',
    '.jedv-bg4 .lines{position:absolute;inset:0;',
    'background-image:linear-gradient(var(--border) 1px,transparent 1px),linear-gradient(90deg,var(--border) 1px,transparent 1px);',
    'background-size:' + TILE + 'px ' + TILE + 'px;opacity:.9}',
    '.jedv-bg4 .crosses{position:absolute;inset:0;background-size:' + TILE + 'px ' + TILE + 'px;background-repeat:repeat;opacity:.8}',
    '@keyframes jedv-bp-drift{from{transform:translate3d(0,0,0)}to{transform:translate3d(' + TILE + 'px,' + TILE + 'px,0)}}',
    ':root[data-theme="light"] .jedv-bg4 .lines{opacity:.75}',
    ':root[data-theme="light"] .jedv-bg4 .crosses{opacity:.6}',
    '@media (prefers-reduced-motion:reduce){.jedv-bg4 .drift{animation:none!important}}',
    '.sim-rm .jedv-bg4 .drift{animation:none!important}'
  ].join('\n');

  function tokenColor() {
    var v = getComputedStyle(document.documentElement).getPropertyValue('--text-faint');
    return (v || '#6E6E68').trim() || '#6E6E68';
  }
  function tileURL(color) {
    var svg = "<svg xmlns='http://www.w3.org/2000/svg' width='" + TILE + "' height='" + TILE + "'>" +
      "<path d='M" + (-ARM) + " 0.5H" + ARM + "M0.5 " + (-ARM) + "V" + ARM + "' stroke='" + color +
      "' stroke-width='1' fill='none'/></svg>";
    return 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")';
  }

  function mount(opts) {
    opts = opts || {};
    var style = document.createElement('style');
    style.setAttribute('data-jedv-bg', ID);
    style.textContent = CSS;
    document.head.appendChild(style);

    var layer = document.createElement('div');
    layer.className = 'jedv-bg4';
    layer.setAttribute('aria-hidden', 'true');
    var drift = document.createElement('div'); drift.className = 'drift';
    var lines = document.createElement('div'); lines.className = 'lines';
    var crosses = document.createElement('div'); crosses.className = 'crosses';
    drift.appendChild(lines); drift.appendChild(crosses); layer.appendChild(drift);
    document.body.appendChild(layer);

    function paint() { crosses.style.backgroundImage = tileURL(tokenColor()); }
    paint();

    // Rebuild the tile when the theme flips (tokens change value).
    var mo = null;
    if ('MutationObserver' in window) {
      mo = new MutationObserver(function (muts) {
        for (var i = 0; i < muts.length; i++) {
          if (muts[i].attributeName === 'data-theme') { paint(); break; }
        }
      });
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    }

    function onVis() {
      drift.style.animationPlayState = document.hidden ? 'paused' : '';
    }
    document.addEventListener('visibilitychange', onVis);

    var api = {
      id: ID,
      layer: layer,
      setIntensity: function (v) {
        layer.style.opacity = String(Math.max(0, Math.min(1.5, v)));
      },
      setPaused: function (p) { drift.style.animationPlayState = p ? 'paused' : ''; },
      destroy: function () {
        document.removeEventListener('visibilitychange', onVis);
        if (mo) mo.disconnect();
        if (style.parentNode) style.parentNode.removeChild(style);
        if (layer.parentNode) layer.parentNode.removeChild(layer);
      }
    };
    if (typeof opts.intensity === 'number') api.setIntensity(opts.intensity);
    return api;
  }

  window.JEDV_BG = window.JEDV_BG || {};
  window.JEDV_BG[ID] = { id: ID, name: 'Blueprint grid', mount: mount };
})();
