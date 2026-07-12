/* ============================================================
   rain-ripple.js — homepage background atmosphere
   Diagonal rain: a very faint, slanted character-free streak field
   drifting top-right → bottom-left. Restrained background texture,
   masked away from the hero so it never competes with the headline.
   Respects prefers-reduced-motion and sits behind content with
   pointer-events:none so links and text stay fully usable.
   (The footer water surface now lives in ascii-ripple.js.)
   ============================================================ */
(function () {
  var reduced = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------- */
  /* 1 · DIAGONAL RAIN (fixed background, host #rain-bg)         */
  /* ---------------------------------------------------------- */
  var rainSketch = function (p) {
    var host, w = 0, h = 0, drops = [];
    // velocity direction: leftward + downward (top-right -> bottom-left)
    var ang = Math.atan2(1, -0.42);

    function measure() {
      host = document.getElementById("rain-bg");
      if (!host) return false;
      var r = host.getBoundingClientRect();
      w = Math.max(40, Math.floor(r.width));
      h = Math.max(40, Math.floor(r.height));
      return true;
    }
    function target() {
      return Math.round(Math.min(64, Math.max(24, w / 30)));
    }
    function mk(init) {
      return {
        x: Math.random() * (w + 200) - 60,
        y: init ? Math.random() * h : -30 - Math.random() * 160,
        len: 11 + Math.random() * 15,
        spd: 4.6 + Math.random() * 4.2,
        a: 0.03 + Math.random() * 0.05
      };
    }
    function fill() {
      var n = target();
      while (drops.length < n) drops.push(mk(drops.length ? false : true));
      if (drops.length > n) drops.length = n;
    }

    p.setup = function () {
      if (!measure()) { p.noLoop(); return; }
      var c = p.createCanvas(w, h);
      c.parent(host);
      p.noFill();
      for (var i = 0; i < target(); i++) drops.push(mk(true));
      if (reduced) { p.redraw(); p.noLoop(); } // single faint static frame
    };

    p.draw = function () {
      p.clear();
      var cx = Math.cos(ang), cy = Math.sin(ang);
      for (var i = 0; i < drops.length; i++) {
        var d = drops[i];
        p.stroke(11, 11, 12, d.a * 255);
        p.strokeWeight(1);
        p.line(d.x, d.y, d.x - cx * d.len, d.y - cy * d.len);
        if (!reduced) {
          d.x += cx * d.spd;
          d.y += cy * d.spd;
          if (d.y - d.len > h || d.x + d.len < -60) drops[i] = mk(false);
        }
      }
    };

    window.addEventListener("resize", function () {
      if (!measure()) return;
      p.resizeCanvas(w, h);
      fill();
      if (reduced) p.redraw();
    });
  };

  /* ---------------------------------------------------------- */
  /* lifecycle — mount on the home page only, survive bfcache    */
  /* ---------------------------------------------------------- */
  function boot() {
    if (typeof p5 === "undefined") { setTimeout(boot, 60); return; }
    if (!window.__rain && document.getElementById("rain-bg"))
      window.__rain = new p5(rainSketch);
  }
  function destroy() {
    if (window.__rain) { try { window.__rain.remove(); } catch (e) {} window.__rain = null; }
  }
  window.addEventListener("pagehide", destroy);
  window.addEventListener("pageshow", function (e) {
    if (e.persisted) { destroy(); boot(); }
  });
  boot();
})();
