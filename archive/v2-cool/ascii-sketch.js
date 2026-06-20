/* ============================================================
   ascii-sketch.js — p5.js text-mode field
   A monochrome character grid. Ambient noise drift + a ripple
   that follows the cursor when hovering the panel. Low-noise,
   interface-like. Instance mode, parented to #ascii-panel.
   ============================================================ */
(function () {
  // light -> dense ramp
  var RAMP = " ·.·:-=+*ø#".split("");
  var DENSE = " .:-=+*#%@".split("");

  var sketch = function (p) {
    var host, w = 0, h = 0;
    var cw = 9.2;          // char advance (px)
    var ch = 15;           // line height (px)
    var cols = 0, rows = 0;
    var mx = -9999, my = -9999, tmx = -9999, tmy = -9999;
    var t = 0, hover = 0, hoverT = 0;
    var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function measure() {
      host = document.getElementById("ascii-panel");
      if (!host) return false;
      var r = host.getBoundingClientRect();
      w = Math.max(40, Math.floor(r.width));
      h = Math.max(40, Math.floor(r.height));
      cols = Math.ceil(w / cw) + 1;
      rows = Math.ceil(h / ch) + 1;
      return true;
    }

    p.setup = function () {
      if (!measure()) { p.noLoop(); return; }
      var c = p.createCanvas(w, h);
      c.parent(host);
      p.textFont("JetBrains Mono");
      p.textSize(13);
      p.textAlign(p.LEFT, p.TOP);
      p.noStroke();
      p.frameRate(reduced ? 1 : 30);
    };

    var FAINT = ".·:".split("");

    p.draw = function () {
      p.clear();
      t += reduced ? 0 : 0.006;

      // smooth cursor follow + hover fade
      tmx += (mx - tmx) * 0.15;
      tmy += (my - tmy) * 0.15;
      hover += (hoverT - hover) * 0.07;

      for (var j = 0; j < rows; j++) {
        for (var i = 0; i < cols; i++) {
          var x = i * cw;
          var y = j * ch;

          // ambient field — slow, sparse
          var amb = p.noise(i * 0.09, j * 0.11, t);

          // cursor influence (only meaningful while hovering)
          var dx = x - tmx, dy = (y + ch * 0.5) - tmy;
          var d = Math.sqrt(dx * dx + dy * dy);
          var rad = 120;
          var infl = Math.exp(-(d * d) / (2 * rad * rad)) * hover;
          var ring = Math.exp(-Math.pow(d - (54 + 26 * Math.sin(t * 5)), 2) / 1100) * 0.55 * hover;

          if (infl > 0.05 || ring > 0.05) {
            // active zone: dense + accent glow
            var v = 0.32 + infl * 0.95 + ring;
            if (v > 1) v = 1;
            var gi = Math.floor(v * (DENSE.length - 1));
            var gl = DENSE[gi];
            if (gl === " ") continue;
            var mix = Math.min(1, infl * 1.25 + ring * 0.6);
            // steel -> accent glow
            var rr = 150 + (70 - 150) * mix;
            var gg = 158 + (208 - 158) * mix;
            var bb = 164 + (184 - 164) * mix;
            p.fill(rr, gg, bb, 70 + v * 150);
            p.text(gl, x, y);
          } else {
            // ambient: sparse faint texture, subtly visible at rest.
            // p5 noise clusters low (~0.1–0.45), so remap into a usable band.
            var lvl = (amb - 0.16) / 0.26;
            if (lvl < 0.16) continue;
            if (lvl > 1) lvl = 1;
            var fi = Math.floor(lvl * (FAINT.length - 1));
            p.fill(170, 178, 184, 26 + lvl * 120);
            p.text(FAINT[fi], x, y);
          }
        }
      }
    };

    p.mouseMoved = function () { mx = p.mouseX; my = p.mouseY; hoverT = 1; if (reduced) p.redraw(); };
    p.mouseDragged = function () { mx = p.mouseX; my = p.mouseY; hoverT = 1; };
    p.touchMoved = function () { mx = p.mouseX; my = p.mouseY; hoverT = 1; return false; };

    p.windowResized = function () {
      if (!measure()) return;
      p.resizeCanvas(w, h);
      p.textFont("JetBrains Mono");
      p.textSize(13);
      p.textAlign(p.LEFT, p.TOP);
    };

    // fade ripple out when leaving the panel
    document.addEventListener("DOMContentLoaded", function () {
      var hp = document.getElementById("ascii-panel");
      if (hp) {
        hp.addEventListener("mouseleave", function () { hoverT = 0; mx = -9999; my = -9999; });
        hp.addEventListener("mouseenter", function () { hoverT = 1; });
      }
    });
  };

  function boot() {
    if (typeof p5 === "undefined") { setTimeout(boot, 60); return; }
    if (!document.getElementById("ascii-panel")) { setTimeout(boot, 60); return; }
    window.__ascii = new p5(sketch);
  }
  boot();
})();
