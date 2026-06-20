/* ============================================================
   ascii-sketch.js — faint atmospheric background
   A near-invisible monochrome character field behind the content.
   At rest it is barely a texture; a soft local area becomes slightly
   more legible around the cursor, then fades. Grayscale only.
   Sits in #ascii-bg (fixed, pointer-events:none), so the cursor is
   tracked on window and mapped into canvas space.
   ============================================================ */
(function () {
  var FAINT = ".·:".split("");
  var NEAR  = ".·:-=+".split("");

  var sketch = function (p) {
    var host, w = 0, h = 0, rectL = 0, rectT = 0;
    var cw = 9, ch = 12, cols = 0, rows = 0;
    var mx = -9999, my = -9999, tmx = -9999, tmy = -9999;
    var t = 0, hoverT = 0, hover = 0;
    var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function measure() {
      host = document.getElementById("ascii-bg");
      if (!host) return false;
      var r = host.getBoundingClientRect();
      rectL = r.left; rectT = r.top;
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
      p.textSize(10.5);
      p.textAlign(p.LEFT, p.TOP);
      p.noStroke();
      p.frameRate(reduced ? 1 : 30);
    };

    p.draw = function () {
      p.clear();
      t += reduced ? 0 : 0.0035;

      tmx += (mx - tmx) * 0.12;
      tmy += (my - tmy) * 0.12;
      hover += (hoverT - hover) * 0.06;
      if (!reduced) hoverT *= 0.985;   // idle decay -> returns to near-invisible

      for (var j = 0; j < rows; j++) {
        for (var i = 0; i < cols; i++) {
          var x = i * cw, y = j * ch;
          var amb = p.noise(i * 0.085, j * 0.1, t);
          var lvl = (amb - 0.18) / 0.24;          // remap into visible band
          if (lvl < 0) lvl = 0; else if (lvl > 1) lvl = 1;

          // local reveal around cursor
          var dx = x - tmx, dy = (y + ch * 0.5) - tmy;
          var d2 = dx * dx + dy * dy;
          var rad = 95;
          var infl = Math.exp(-d2 / (2 * rad * rad)) * hover;

          var alpha = lvl * 14 + infl * 42;       // visible constant grain, brighter cursor reveal
          if (alpha < 1.0) continue;

          var ramp = infl > 0.12 ? NEAR : FAINT;
          var gi = Math.floor(Math.min(1, lvl * 0.7 + infl) * (ramp.length - 1));
          var gl = ramp[gi];
          if (gl === " ") continue;

          // near the cursor the field warms toward the star's gold
          var k = Math.min(1, infl * 1.7);
          p.fill(11 + (235 - 11) * k, 11 + (140 - 11) * k, 12 + (8 - 12) * k, alpha + k * 46);
          p.text(gl, x, y);
        }
      }
    };

    function onMove(e) {
      mx = e.clientX - rectL;
      my = e.clientY - rectT;
      // don't light up the field beneath text — headings, project copy, nav
      var t = e.target;
      var overText = t instanceof Element &&
        t.closest(".p-body, .p-head, .opening-head, h1, h2, h3, .about-body, .values, .info, .spine, .toc, .contact");
      if (!overText) hoverT = 1;
      if (reduced) p.redraw();
    }
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("resize", function () {
      if (!measure()) return;
      p.resizeCanvas(w, h);
      p.textFont("JetBrains Mono"); p.textSize(10.5); p.textAlign(p.LEFT, p.TOP);
    });
    window.addEventListener("scroll", function () {
      var r = host.getBoundingClientRect(); rectL = r.left; rectT = r.top;
    }, { passive: true });
  };

  /* Route-aware lifecycle: the effect lives on the home page only
     (it mounts only where a #ascii-bg host exists). It is destroyed
     on pagehide and re-initialized on pageshow so returning from a
     project page via back/forward cache always restarts it cleanly. */
  function boot() {
    if (window.__ascii) return;                                   // already running
    if (!document.getElementById("ascii-bg")) return;             // not the home page
    if (typeof p5 === "undefined") { setTimeout(boot, 60); return; }
    window.__ascii = new p5(sketch);
  }
  function destroy() {
    if (window.__ascii) {
      try { window.__ascii.remove(); } catch (e) {}
      window.__ascii = null;
    }
  }
  window.addEventListener("pagehide", destroy);
  /* watchdog: whenever the page is shown / refocused, verify the draw
     loop is actually advancing — if it froze (back/forward cache, iframe
     restore), tear down and re-initialize. */
  function ensureRunning() {
    if (!document.getElementById("ascii-bg")) return;
    var inst = window.__ascii;
    if (!inst) { boot(); return; }
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var fc = inst.frameCount;
    setTimeout(function () {
      if (window.__ascii === inst && inst.frameCount === fc) { destroy(); boot(); }
    }, 500);
  }
  window.addEventListener("pageshow", function (e) {
    if (e.persisted) { destroy(); boot(); } else { ensureRunning(); }
  });
  window.addEventListener("focus", ensureRunning);
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") ensureRunning();
  });
  boot();
})();
