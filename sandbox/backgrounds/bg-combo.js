/* COMBO · drift + spotlight + grain — sandbox only, NOT imported by the app.
 * Cohesive preset: gradient-drift sets the mood, cursor spotlight adds the
 * command-palette glow, grain+scanlines add the terminal texture.
 * Tuned intensities (relative to each module at 1.0):
 *   drift 0.65 · spotlight 0.80 · grain 0.55
 * One shared fixed layer would be ideal; here each module keeps its own fixed
 * layer (same contract as solo use) so the combo exercises the real stack.
 * Single destroy()/setPaused()/setIntensity() fan out to all three. */
(function () {
  var ID = 'combo-drift-spot-grain';
  var PARTS = [
    { id: 'gradient-drift', intensity: 0.65 },
    { id: 'cursor-spotlight', intensity: 0.80 },
    { id: 'grain-scanlines', intensity: 0.55 }
  ];

  function mount(opts) {
    opts = opts || {};
    var master = typeof opts.intensity === 'number' ? opts.intensity : 1;
    var handles = [];
    for (var i = 0; i < PARTS.length; i++) {
      var mod = window.JEDV_BG && window.JEDV_BG[PARTS[i].id];
      if (!mod) continue; // script load order safety
      handles.push({
        h: mod.mount({ intensity: PARTS[i].intensity * master }),
        base: PARTS[i].intensity
      });
    }
    return {
      id: ID,
      layer: handles.length ? handles[0].h.layer : null,
      parts: handles.map(function (x) { return x.h; }),
      setIntensity: function (v) {
        master = Math.max(0, Math.min(1.5, v));
        handles.forEach(function (x) { x.h.setIntensity(x.base * master); });
      },
      setPaused: function (p) {
        handles.forEach(function (x) { x.h.setPaused(p); });
      },
      setProgress: function () { /* combo has no scroll-driven part */ },
      destroy: function () {
        handles.forEach(function (x) { x.h.destroy(); });
        handles = [];
      }
    };
  }

  window.JEDV_BG = window.JEDV_BG || {};
  window.JEDV_BG[ID] = { id: ID, name: 'Combo — drift + spotlight + grain', mount: mount };
})();
