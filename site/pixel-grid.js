/* ============================================================
   pixel-grid.js — site footer: interactive pixel gradient
   A halftone field of small diamonds (rotated squares) that is
   dense + dark toward the top and dissolves into sparse, faint
   specks toward the bottom — leaving the centered sign-off
   ("Made by Elaine") clean and legible. Grayscale only.

   Interaction: the pointer acts like a soft light brushing over
   the field — diamonds near the cursor grow and darken, then
   ease back. The canvas is pointer-events:none and the pointer
   is tracked on the window, so it never steals clicks.

   Drives EVERY .footer-pixel-grid on the page (the homepage has
   one per section-view; case pages have one each). Also handles
   the slide-up reveal of every .home-foot. Respects
   prefers-reduced-motion (calm, static field, no pointer response).
   ============================================================ */
(function () {
  var reduced = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // one sketch factory per host element
  function makeSketch(host) {
    return function (p) {
      var w = 0, h = 0;
      var pitch = 6;                  // grid cell size
      var cols = 0, rows = 0;
      var t = 0;                      // ambient time

      // pointer state (canvas-local), smoothed
      var pxRaw = -9999, pyRaw = -9999, pInRaw = 0;
      var px = -9999, py = -9999, pInf = 0;
      var R = 130;                    // influence radius (px)

      function measure() {
        var r = host.getBoundingClientRect();
        w = Math.max(80, Math.floor(r.width));
        h = Math.max(80, Math.floor(r.height));
        pitch = w < 480 ? 5 : 6;
        R = w < 600 ? 90 : 130;
        cols = Math.ceil(w / pitch) + 1;
        rows = Math.ceil(h / pitch) + 1;
        return true;
      }

      function updatePointerLocal() {
        var r = host.getBoundingClientRect();
        pxRaw = window.__pgClientX - r.left;
        pyRaw = window.__pgClientY - r.top;
        var pad = 60;
        pInRaw = (pxRaw > -pad && pxRaw < w + pad &&
                  pyRaw > -pad && pyRaw < h + pad) ? 1 : 0;
      }

      function ss(x) { x = x < 0 ? 0 : x > 1 ? 1 : x; return x * x * (3 - 2 * x); }

      p.setup = function () {
        measure();
        var cnv = p.createCanvas(w, h);
        cnv.parent(host);
        p.noStroke();
        p.noiseSeed(7);
        if (reduced) { p.redraw(); p.noLoop(); }
      };

      function diamond(cx, cy, s) {
        p.quad(cx, cy - s, cx + s, cy, cx, cy + s, cx - s, cy);
      }

      p.draw = function () {
        p.clear();

        if (!reduced) {
          t += 0.006;
          updatePointerLocal();
          if (pInRaw) { px = px < -999 ? pxRaw : px + (pxRaw - px) * 0.25;
                        py = py < -999 ? pyRaw : py + (pyRaw - py) * 0.25; }
          pInf += (pInRaw - pInf) * 0.08;
        }

        // periodic resize check (footer can grow/appear with view changes)
        if (!reduced && p.frameCount % 30 === 0) {
          var r = host.getBoundingClientRect();
          var nw = Math.floor(r.width), nh = Math.floor(r.height);
          if (nw > 80 && (Math.abs(nw - w) > 2 || Math.abs(nh - h) > 2)) {
            measure(); p.resizeCanvas(w, h);
          }
        }

        var R2 = R * R;
        for (var gy = 0; gy < rows; gy++) {
          var cy = (gy + 0.5) * pitch;
          var vy = 1 - cy / h;                 // 1 top, 0 bottom
          vy = ss(vy * 1.12);
          if (vy <= 0.001) continue;
          for (var gx = 0; gx < cols; gx++) {
            var cx = (gx + 0.5) * pitch;
            var n = p.noise(gx * 0.14, gy * 0.14, t);
            var v = vy * (0.30 + 1.05 * n);

            if (pInf > 0.01) {
              var dx = cx - px, dy = cy - py;
              var d2 = dx * dx + dy * dy;
              if (d2 < R2 * 1.4) {
                var fall = Math.exp(-d2 / (R2 * 0.42));
                v += pInf * fall * 0.55;
              }
            }

            if (v < 0.13) continue;
            if (v > 1) v = 1;

            var sv = ss(v);
            var s = pitch * (0.16 + 0.32 * sv); // half-diagonal (small, ascii-fine)
            var gray = 150 - 70 * sv;           // soft grays, never fully black
            var a = (0.04 + 0.24 * sv) * 255;   // fainter ambient, gentle reveal
            p.fill(gray, gray, gray + 1, a);
            diamond(cx, cy, s);
          }
        }
      };

      window.addEventListener('resize', function () {
        measure();
        p.resizeCanvas(w, h);
        if (reduced) p.redraw();
      });
    };
  }

  // global pointer tracking (window-level so the pointer-events:none
  // canvas still "feels" the cursor over the footer text)
  window.__pgClientX = -9999; window.__pgClientY = -9999;
  function onMove(e) {
    var pt = e.touches ? e.touches[0] : e;
    if (!pt) return;
    window.__pgClientX = pt.clientX;
    window.__pgClientY = pt.clientY;
  }
  window.addEventListener('mousemove', onMove, { passive: true });
  window.addEventListener('touchmove', onMove, { passive: true });

  // slide-up reveal for every footer as it nears the viewport
  function revealAll() {
    var vh = window.innerHeight || document.documentElement.clientHeight;
    var foots = document.querySelectorAll('.home-foot');
    for (var i = 0; i < foots.length; i++) {
      var f = foots[i];
      if (f.classList.contains('in-view')) continue;
      var r = f.getBoundingClientRect();
      if (r.top < vh * 0.88 && r.bottom > 0) f.classList.add('in-view');
    }
  }

  function boot() {
    if (typeof p5 === 'undefined') { setTimeout(boot, 60); return; }
    var hosts = document.querySelectorAll('.footer-pixel-grid');
    if (!window.__pixelGrids) window.__pixelGrids = [];
    for (var i = 0; i < hosts.length; i++) {
      var h = hosts[i];
      if (h.__pg) continue;
      h.__pg = new p5(makeSketch(h));
      window.__pixelGrids.push(h.__pg);
    }
    revealAll();
    window.addEventListener('scroll', revealAll, { passive: true });
    window.addEventListener('resize', revealAll);
    setTimeout(revealAll, 1600); // failsafe
  }

  function destroy() {
    if (window.__pixelGrids) {
      window.__pixelGrids.forEach(function (g) { try { g.remove(); } catch (e) {} });
      window.__pixelGrids = null;
    }
    var hosts = document.querySelectorAll('.footer-pixel-grid');
    for (var i = 0; i < hosts.length; i++) hosts[i].__pg = null;
  }
  window.addEventListener('pagehide', destroy);
  window.addEventListener('pageshow', function (e) { if (e.persisted) { destroy(); boot(); } });
  boot();
})();
