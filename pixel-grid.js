/* ============================================================
   pixel-grid.js — site footer: interactive pixel gradient
   Halftone diamond field, dense at top, fading to bottom.
   Cursor pushes dots away like dragging through sand — dots
   drift back to their home position with springy easing.

   Drives EVERY .footer-pixel-grid on the page.
   ============================================================ */
(function () {
  var reduced = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function makeSketch(host) {
    return function (p) {
      var w = 0, h = 0;
      var pitch = 6;
      var cols = 0, rows = 0;
      var t = 0;

      // per-dot displacement (flat arrays for speed)
      var offX, offY;     // current offset from home
      var velX, velY;     // velocity
      var totalDots = 0;

      var pxRaw = -9999, pyRaw = -9999, pInRaw = 0;
      var px = -9999, py = -9999, pInf = 0;
      var R = 70;
      var pushStrength = 3.5;
      var spring = 0.028;
      var damping = 0.92;
      var massVar;

      function measure() {
        var r = host.getBoundingClientRect();
        w = Math.max(80, Math.floor(r.width));
        h = Math.max(80, Math.floor(r.height));
        pitch = w < 480 ? 5 : 6;
        R = w < 600 ? 55 : 70;
        cols = Math.ceil(w / pitch) + 1;
        rows = Math.ceil(h / pitch) + 1;
        var n = cols * rows;
        if (n !== totalDots) {
          offX = new Float32Array(n);
          offY = new Float32Array(n);
          velX = new Float32Array(n);
          velY = new Float32Array(n);
          massVar = new Float32Array(n);
          // seed variation from grid position for organic feel
          for (var i = 0; i < n; i++) {
            var gx2 = i % cols, gy2 = (i / cols) | 0;
            massVar[i] = 0.4 + 1.6 * (((gx2 * 7 + gy2 * 13 + gx2 * gy2) % 17) / 16);
          }
          totalDots = n;
        }
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
        p.frameRate(30);
      };

      function diamond(cx, cy, s) {
        p.quad(cx, cy - s, cx + s, cy, cx, cy + s, cx - s, cy);
      }

      p.draw = function () {
        p.clear();

        if (!reduced) t += 0.006;
        updatePointerLocal();
        if (pInRaw) {
          px = pxRaw;
          py = pyRaw;
        }
        pInf += (pInRaw - pInf) * 0.15;

        if (p.frameCount % 30 === 0) {
          var r = host.getBoundingClientRect();
          var nw = Math.floor(r.width), nh = Math.floor(r.height);
          if (nw > 80 && (Math.abs(nw - w) > 2 || Math.abs(nh - h) > 2)) {
            measure(); p.resizeCanvas(w, h);
          }
        }

        var R2 = R * R;
        var idx = 0;
        for (var gy = 0; gy < rows; gy++) {
          var homeY = (gy + 0.5) * pitch;
          var vy = 1 - homeY / h;
          vy = ss(vy * 1.12);

          for (var gx = 0; gx < cols; gx++) {
            var homeX = (gx + 0.5) * pitch;
            idx = gy * cols + gx;

            // cursor repulsion — per-dot mass makes each react differently
            if (pInf > 0.01) {
              var dx = homeX + offX[idx] - px;
              var dy = homeY + offY[idx] - py;
              var d2 = dx * dx + dy * dy;
              if (d2 < R2 * 1.8 && d2 > 0.1) {
                var dist = Math.sqrt(d2);
                var m = massVar[idx];
                var force = pInf * pushStrength * m * Math.exp(-d2 / (R2 * 0.35));
                velX[idx] += (dx / dist) * force;
                velY[idx] += (dy / dist) * force;
              }
            }

            // spring back — heavier dots return slower
            var m2 = massVar[idx];
            var sp = spring * (1.6 - m2 * 0.5);
            var dm = damping + (m2 - 1) * 0.015;
            velX[idx] = (velX[idx] - offX[idx] * sp) * dm;
            velY[idx] = (velY[idx] - offY[idx] * sp) * dm;
            offX[idx] += velX[idx];
            offY[idx] += velY[idx];

            if (vy <= 0.001) continue;

            var cx = homeX + offX[idx];
            var cy = homeY + offY[idx];

            var n = p.noise(gx * 0.14, gy * 0.14, t);
            var v = vy * (0.30 + 1.05 * n);

            if (v < 0.13) continue;
            if (v > 1) v = 1;

            var sv = ss(v);
            var s = pitch * (0.18 + 0.34 * sv);
            var gray = 170 - 60 * sv;
            var a = (0.12 + 0.38 * sv) * 255;
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

  window.__pgClientX = -9999; window.__pgClientY = -9999;
  function onMove(e) {
    var pt = e.touches ? e.touches[0] : e;
    if (!pt) return;
    window.__pgClientX = pt.clientX;
    window.__pgClientY = pt.clientY;
  }
  window.addEventListener('mousemove', onMove, { passive: true });
  window.addEventListener('touchmove', onMove, { passive: true });

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
    setTimeout(revealAll, 1600);
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

  function nudge() {
    if (!window.__pixelGrids) return;
    window.__pixelGrids.forEach(function (g) {
      try { g.resizeCanvas(1, 1); g.loop(); } catch (e) {}
    });
    setTimeout(function () { window.dispatchEvent(new Event('resize')); }, 80);
    setTimeout(revealAll, 200);
  }
  window.__pgNudge = nudge;

  boot();
})();
