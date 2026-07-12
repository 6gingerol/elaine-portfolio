/* ============================================================
   rain-scene.js — homepage footer: line-drawn rain on water
   Clean, calm line illustration on the white page (NO blue, NO ASCII
   brackets). Everything is thin dark strokes:

   • Diagonal rain — fine ink threads slanting top-right → bottom-left,
     each falling to its own landing point across the basin.
   • Splashback rebound — on impact a jet rises and a droplet detaches,
     arcs above the surface and falls back, then the ripple spreads.
   • Ripples — soft, organic ELLIPTICAL line rings (side-view squash),
     gently noise-wobbled so they feel hand-drawn but stay clean;
     2–3 concentric rings each, expanding slowly and fading.
   • Subtle interaction — moving the mouse seeds gentle ripples near
     the cursor; clicking drops a stronger splash.

   Transparent canvas (clear()); pointer-events:none so links stay
   usable (events read off the window, gated to the basin rect).
   Respects prefers-reduced-motion (a calm static set of rings).
   ============================================================ */
(function () {
  var reduced = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var sketch = function (p) {
    var host, w = 0, h = 0, unit = 16;
    var drops = [], splashes = [], ripples = [];
    var lastRain = 0, nextRain = 600, lastMouse = 0, lastSplashMove = 0;
    var SLANT = 9 * Math.PI / 180;          // gentle top-right → bottom-left
    var SVX = -Math.sin(SLANT), SVY = Math.cos(SLANT);
    var RS = 0.30;                          // ellipse squash (side view)
    var RATE = 0.14;                        // ripple expansion — slow & calm
    var INK = [40, 40, 44];

    function measure() {
      host = document.getElementById('footer-rain');
      if (!host) return false;
      var r = host.getBoundingClientRect();
      w = Math.max(80, Math.floor(r.width));
      h = Math.max(80, Math.floor(r.height));
      unit = w < 480 ? 13 : w < 900 ? 15 : 17;
      return true;
    }

    /* ---- spawners ---- */
    function spawnDrop() {
      var yLand = h * (0.18 + Math.random() * 0.74);
      var x = w * (0.03 + Math.random() * 0.94);
      var fallLen = h * (0.7 + Math.random() * 0.9);
      drops.push({
        x: x, yLand: yLand,
        y: yLand - fallLen,
        spd: unit * (0.45 + Math.random() * 0.5),       // slow, drifting fall
        streak: unit * (5 + Math.random() * 7)
      });
      if (drops.length > 60) drops.shift();
    }
    function spawnSplash(x, y, str) {
      splashes.push({ x: x, y: y, born: p.millis(), str: str || 1 });
      if (splashes.length > 30) splashes.shift();
    }
    function spawnRipple(x, y, str) {
      ripples.push({
        x: x, y: y, born: p.millis(), str: str || 1,
        maxR: unit * (4.5 + Math.random() * 5.5),
        rings: 2 + (Math.random() < 0.6 ? 1 : 0),
        spd: RATE * (0.85 + Math.random() * 0.3),
        rs: RS * (0.85 + Math.random() * 0.4),     // organic per-ripple squash
        seed: Math.random() * 100
      });
      if (ripples.length > 120) ripples.shift();
    }

    /* one soft, clean elliptical ring — gently noise-wobbled so it reads
       hand-drawn but stays a continuous line (no messy brackets) */
    function ring(cx, cy, rx, a, seed, rs) {
      if (rx <= 1 || a <= 0.012) return;
      var ry = rx * (rs || RS);
      p.noFill();
      p.stroke(INK[0], INK[1], INK[2], a * 255);
      p.strokeWeight(1.1);
      var steps = Math.max(44, Math.floor(rx * 0.8));
      p.beginShape();
      for (var i = 0; i <= steps; i++) {
        var ang = (i / steps) * p.TWO_PI;
        var wob = 1 + (p.noise(Math.cos(ang) * 0.7 + (seed || 0), Math.sin(ang) * 0.7 + (seed || 0)) - 0.5) * 0.14;
        p.vertex(cx + Math.cos(ang) * rx * wob, cy + Math.sin(ang) * ry * wob);
      }
      p.endShape(p.CLOSE);
    }

    function drawRipples(now) {
      for (var i = ripples.length - 1; i >= 0; i--) {
        var rp = ripples[i];
        var age = now - rp.born;
        var R = age * rp.spd;
        var life = 1 - R / rp.maxR;
        if (life <= 0) { ripples.splice(i, 1); continue; }
        var onset = Math.min(1, age / 150);
        var fade = Math.pow(life, 1.1) * onset * rp.str;
        for (var k = 0; k < rp.rings; k++) {
          var rr = R - k * (unit * 1.0);
          if (rr <= 0) continue;
          ring(rp.x, rp.y, rr, fade * (0.5 - k * 0.13), rp.seed + k * 1.7, rp.rs);
        }
      }
    }

    function drawDrops() {
      p.stroke(INK[0], INK[1], INK[2], 0.42 * 255);
      p.strokeWeight(1);
      for (var i = drops.length - 1; i >= 0; i--) {
        var d = drops[i];
        if (!reduced) d.y += d.spd;
        p.line(d.x, d.y, d.x - SVX * d.streak, d.y - SVY * d.streak);
        if (d.y >= d.yLand) {
          spawnSplash(d.x, d.yLand, 0.85 + Math.random() * 0.4);
          drops.splice(i, 1);
        }
      }
    }

    /* splashback: a clear upward REBOUND — a jet column rises and a
       droplet detaches, arcs above the surface, then falls back; the
       ripple is released as it settles */
    function drawSplashes(now) {
      for (var i = splashes.length - 1; i >= 0; i--) {
        var s = splashes[i];
        var age = now - s.born, SPL = 430;
        if (age > SPL) {
          spawnRipple(s.x, s.y, s.str);
          if (Math.random() < 0.4) spawnRipple(s.x, s.y, s.str * 0.6);
          splashes.splice(i, 1);
          continue;
        }
        var prog = age / SPL;
        var jet = Math.sin(prog * Math.PI);
        var peak = unit * (1.8 + s.str * 1.0);
        var colTop = s.y - jet * peak;
        var a = (1 - prog) * 0.85;
        p.stroke(INK[0], INK[1], INK[2], a * 0.4 * 255); p.strokeWeight(1);
        p.line(s.x - SVX * unit * 6, s.y - SVY * unit * 6, s.x, s.y);     // stem
        p.stroke(INK[0], INK[1], INK[2], a * 255); p.strokeWeight(1);
        p.line(s.x, s.y, s.x, colTop);                                    // jet
        p.noFill();
        var dp = Math.min(1, prog * 1.18);
        var dy = s.y - Math.sin(dp * Math.PI) * peak * 1.5;
        p.ellipse(s.x, Math.min(s.y, dy), 3, 3);                          // rebound droplet
        if (prog < 0.5) {
          var sb = (1 - prog * 2) * 0.8;
          p.stroke(INK[0], INK[1], INK[2], a * sb * 255);
          p.ellipse(s.x - unit * 0.5, colTop + unit * 0.5, 2, 2);
          p.ellipse(s.x + unit * 0.5, colTop + unit * 0.5, 2, 2);
        }
      }
    }

    function staticSeed() {
      ripples = []; drops = [];
      var pts = [[0.3, 0.5], [0.6, 0.42], [0.5, 0.72], [0.78, 0.6], [0.2, 0.78]];
      for (var i = 0; i < pts.length; i++) {
        ripples.push({ x: w * pts[i][0], y: h * pts[i][1], born: -9e9,
          str: 0.85, maxR: unit * 5, rings: 3, spd: RATE,
          frozen: unit * (2 + i * 0.6), seed: i * 13.3, rs: RS });
      }
    }
    function drawStatic() {
      for (var i = 0; i < ripples.length; i++) {
        var rp = ripples[i];
        for (var k = 0; k < rp.rings; k++) {
          var rr = rp.frozen - k * unit;
          if (rr <= 0) continue;
          ring(rp.x, rp.y, rr, (0.42 - k * 0.12) * rp.str, rp.seed + k * 1.7, rp.rs);
        }
        p.stroke(INK[0], INK[1], INK[2], 0.32 * 255); p.strokeWeight(1);
        p.line(rp.x, rp.y, rp.x - SVX * unit * 5, rp.y - SVY * unit * 5);
      }
    }

    p.setup = function () {
      if (!measure()) { p.noLoop(); return; }
      var c = p.createCanvas(w, h);
      c.parent(host);
      if (reduced) { staticSeed(); p.redraw(); p.noLoop(); return; }
      for (var i = 0; i < 5; i++)
        spawnRipple(w * (0.1 + Math.random() * 0.8), h * (0.3 + Math.random() * 0.6), 0.7 + Math.random() * 0.4);
      ripples.forEach(function (r) { r.born = p.millis() - Math.random() * 1400; });
      for (var j = 0; j < 4; j++) spawnDrop();
    };

    p.draw = function () {
      p.clear();
      var now = p.millis();
      if (p.frameCount % 24 === 0) {
        var r = host.getBoundingClientRect();
        var nw = Math.floor(r.width), nh = Math.floor(r.height);
        if (nw > 80 && (Math.abs(nw - w) > 2 || Math.abs(nh - h) > 2)) { measure(); p.resizeCanvas(w, h); }
      }
      if (reduced) { drawStatic(); return; }

      // unhurried, staggered rainfall — one soft drop at a time
      if (now - lastRain > nextRain) {
        lastRain = now;
        nextRain = 340 + Math.random() * 520;
        spawnDrop();
      }

      drawRipples(now);     // rings behind
      drawSplashes(now);    // reactions
      drawDrops();          // streaks on top
    };

    window.addEventListener('resize', function () {
      if (!measure()) return;
      p.resizeCanvas(w, h);
      if (reduced) { staticSeed(); p.redraw(); }
    });

    // subtle but visible interaction (canvas is pointer-events:none, so we
    // read window events and gate to the basin rect → links stay clickable)
    if (!reduced) {
      window.addEventListener('pointermove', function (e) {
        var r = host.getBoundingClientRect();
        if (e.clientX < r.left || e.clientY < r.top || e.clientX > r.right || e.clientY > r.bottom) return;
        var x = e.clientX - r.left, y = e.clientY - r.top;
        if (e.timeStamp - lastMouse < 120) return;
        lastMouse = e.timeStamp;
        spawnRipple(x + (Math.random() - 0.5) * unit, y + (Math.random() - 0.5) * unit, 0.75);
        if (e.timeStamp - lastSplashMove > 320) {
          lastSplashMove = e.timeStamp;
          spawnSplash(x, y, 0.9);
        }
      }, { passive: true });
      window.addEventListener('click', function (e) {
        var r = host.getBoundingClientRect();
        if (e.clientX < r.left || e.clientY < r.top || e.clientX > r.right || e.clientY > r.bottom) return;
        spawnSplash(e.clientX - r.left, e.clientY - r.top, 1.4);
      }, { passive: true });
    }
  };

  function boot() {
    if (typeof p5 === 'undefined') { setTimeout(boot, 60); return; }
    if (!window.__rainScene && document.getElementById('footer-rain'))
      window.__rainScene = new p5(sketch);
  }
  function destroy() {
    if (window.__rainScene) { try { window.__rainScene.remove(); } catch (e) {} window.__rainScene = null; }
  }
  window.addEventListener('pagehide', destroy);
  window.addEventListener('pageshow', function (e) { if (e.persisted) { destroy(); boot(); } });
  boot();
})();
