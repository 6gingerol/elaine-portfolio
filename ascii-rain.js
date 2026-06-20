/* ============================================================
   ascii-rain.js — homepage footer: minimal ASCII rain
   A quiet field of monospace rain characters drifting top→bottom
   on the white page. Pure typography, grayscale only — no blue,
   no canvas illustration. Each column drops a sparse trail whose
   head is the most legible glyph and whose tail fades out.
   Sits in #footer-ascii-rain (pointer-events:none). Respects
   prefers-reduced-motion (a calm static field).
   ============================================================ */
(function () {
  var reduced = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // light → heavier rain glyphs; head uses the densest
  var GLYPHS = "'`.:|".split('');
  var INK = [11, 11, 12];

  var sketch = function (p) {
    var host, w = 0, h = 0;
    var col = 17, cols = 0;        // column pitch
    var step = 20;                  // vertical glyph pitch within a trail
    var streaks = [];

    function measure() {
      host = document.getElementById('footer-ascii-rain');
      if (!host) return false;
      var r = host.getBoundingClientRect();
      w = Math.max(80, Math.floor(r.width));
      h = Math.max(80, Math.floor(r.height));
      col = w < 480 ? 15 : w < 900 ? 16 : 18;
      cols = Math.floor(w / col);
      return true;
    }

    function mkStreak(c, init) {
      return {
        c: c,
        x: (c + 0.5) * col + (Math.random() - 0.5) * 3,
        y: init ? Math.random() * h : -step * (3 + Math.random() * 6),
        spd: 0.5 + Math.random() * 0.7,          // slow, calm drift
        len: 3 + Math.floor(Math.random() * 4),   // trail length in glyphs
        a: 0.28 + Math.random() * 0.34            // peak alpha (faint)
      };
    }

    function seed() {
      streaks = [];
      // sparse: only ~55% of columns active at any time
      for (var c = 0; c < cols; c++) {
        if (Math.random() < 0.55) streaks.push(mkStreak(c, true));
      }
    }

    p.setup = function () {
      if (!measure()) { p.noLoop(); return; }
      var cnv = p.createCanvas(w, h);
      cnv.parent(host);
      p.textFont('ui-monospace, SFMono-Regular, Menlo, Consolas, monospace');
      p.textSize(13);
      p.textAlign(p.CENTER, p.CENTER);
      p.noStroke();
      seed();
      if (reduced) { p.redraw(); p.noLoop(); }
    };

    function drawStreak(s) {
      for (var i = 0; i < s.len; i++) {
        var gy = s.y - i * step;
        if (gy < -step || gy > h + step) continue;
        var tail = 1 - i / s.len;                 // head brightest
        // soft fade as the trail nears the bottom edge
        var edge = Math.min(1, (h - gy) / (h * 0.32));
        if (edge < 0) edge = 0;
        var a = s.a * tail * edge;
        if (a < 0.012) continue;
        var gi = i === 0 ? GLYPHS.length - 1
                          : Math.max(0, GLYPHS.length - 1 - i);
        p.fill(INK[0], INK[1], INK[2], a * 255);
        p.text(GLYPHS[gi], s.x, gy);
      }
    }

    p.draw = function () {
      p.clear();
      if (!reduced && p.frameCount % 30 === 0) {
        var r = host.getBoundingClientRect();
        var nw = Math.floor(r.width), nh = Math.floor(r.height);
        if (nw > 80 && (Math.abs(nw - w) > 2 || Math.abs(nh - h) > 2)) {
          measure(); p.resizeCanvas(w, h);
        }
      }
      for (var i = 0; i < streaks.length; i++) {
        var s = streaks[i];
        drawStreak(s);
        if (!reduced) {
          s.y += s.spd;
          // recycle once the whole trail has cleared the bottom
          if (s.y - s.len * step > h + step) {
            streaks[i] = mkStreak(s.c, false);
          }
        }
      }
    };

    window.addEventListener('resize', function () {
      if (!measure()) return;
      p.resizeCanvas(w, h);
      p.textFont('ui-monospace, SFMono-Regular, Menlo, Consolas, monospace');
      p.textSize(13); p.textAlign(p.CENTER, p.CENTER);
      seed();
      if (reduced) p.redraw();
    });
  };

  function boot() {
    if (typeof p5 === 'undefined') { setTimeout(boot, 60); return; }
    if (!window.__asciiRain && document.getElementById('footer-ascii-rain'))
      window.__asciiRain = new p5(sketch);
  }
  function destroy() {
    if (window.__asciiRain) {
      try { window.__asciiRain.remove(); } catch (e) {}
      window.__asciiRain = null;
    }
  }
  window.addEventListener('pagehide', destroy);
  window.addEventListener('pageshow', function (e) { if (e.persisted) { destroy(); boot(); } });
  boot();
})();
