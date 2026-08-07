/* ============================================================
   cursor.js — portfolio cursor engine (tweakable)
   Replaces the standalone cloud cursor with a single engine that
   renders one of two modes and reads its look/feel live from the
   Tweaks panel (window.__cursor.set / the 'tweakchange' event).

   • circle (default) — a soft grey dot that trails the pointer with
       organic easing, SHRINKS on press and SPRINGS back to size on
       release (slight overshoot, like the other portfolio cursors).
       Over links / cards it opens into a hollow focus ring.
   • cloud — the original ☁ glyph that storms (⛈ + falling pixel
       drops) while the mouse is held, kept for revert/variety.

   Desktop fine-pointer only; pointer-events:none so links and text
   stay fully usable; respects prefers-reduced-motion (no trail, no
   spring overshoot, no rain — the cursor just snaps cleanly).
   ============================================================ */
(function () {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- live config (defaults work even without the Tweaks panel) ---- */
  // LOCKED_COLOR ensures the cursor stays the same light-grey across pages
  var LOCKED_COLOR = '#aeaeb2';
  var cfg = {
    mode: 'circle',     // 'circle' | 'cloud'
    size: 22,           // circle diameter (px)
    color: LOCKED_COLOR,// lighter grey fill / ring (locked)
    shrink: 0.45,       // scale at full press (0..1) — smaller = more shrink
    trail: 1.0          // follow easing 0..1 — higher = more responsive
  };

  var CLOUD = '\u2601\uFE0E'; // ☁ text presentation, never colour emoji
  var STORM = '\u26C8\uFE0E'; // ⛈
  var GLYPH_FONT = "'PP Mondwest', 'FS Mondwest', 'Pixelify Sans', system-ui, sans-serif";
  var HALO = '1px 0 #fff,-1px 0 #fff,0 1px #fff,0 -1px #fff,1px 1px #fff,-1px 1px #fff,1px -1px #fff,-1px -1px #fff';

  /* ---- styles ---- */
  var css = [
    'html.cc-on, html.cc-on * { cursor: none !important; }',
    '#cc-cursor { position: fixed; left: 0; top: 0; z-index: 99999; pointer-events: none; opacity: 0; transition: opacity .18s ease; }',
    '#cc-cursor.on { opacity: 1; }',

    /* ── circle ── */
    '#cc-cursor .cc-circle {' +
    '  position: absolute; left: 0; top: 0; border-radius: 50%;' +
    '  width: var(--cc-size, 22px); height: var(--cc-size, 22px);' +
    '  margin-left: calc(var(--cc-size, 22px) / -2);' +
    '  margin-top: calc(var(--cc-size, 22px) / -2);' +
    '  background: var(--cc-color, #6c6c70);' +
    '  box-shadow: 0 0 0 1px rgba(255,255,255,.5), 0 1px 6px rgba(0,0,0,.14);' +
    '  transition: background-color .22s ease, box-shadow .22s ease; will-change: transform;' +
    '}',
    /* over links / cards: open into a hollow ring */
    '#cc-cursor.is-link .cc-circle, #cc-cursor.is-card .cc-circle {' +
    '  background: transparent;' +
    '  box-shadow: 0 0 0 1.6px var(--cc-color, #6c6c70), 0 0 0 2.2px rgba(255,255,255,.45);' +
    '}',

    /* ── cloud glyphs ── */
    '#cc-cursor .cc-glyph {' +
    '  position: absolute; left: 0; top: 0; transform: translate(-50%, -50%);' +
    '  font-family: ' + GLYPH_FONT + '; font-weight: 400; font-style: normal; line-height: 1;' +
    '  font-size: var(--cc-glyph, 28px); color: #0b0b0c; text-shadow: ' + HALO + ';' +
    '  user-select: none; white-space: nowrap; transition: transform .16s ease, opacity .12s ease;' +
    '}',
    '#cc-cursor .cc-storm { opacity: 0; transform: translate(-50%,-50%) scale(.92); }',
    '#cc-cursor.is-rain .cc-sun { opacity: 0; transform: translate(-50%,-50%) scale(.92); }',
    '#cc-cursor.is-rain .cc-storm { opacity: 1; transform: translate(-50%,-50%) scale(1); }',
    '#cc-cursor.is-link.is-cloud .cc-glyph, #cc-cursor.is-card.is-cloud .cc-glyph { transform: translate(-50%,-53%) scale(1.1); }',
    '#cc-cursor.is-link.is-rain .cc-sun, #cc-cursor.is-card.is-rain .cc-sun { opacity: 0; }',
    '#cc-cursor .cc-rain { position: absolute; left: 0; top: 0; }',
    '#cc-cursor .cc-rain i { position: absolute; width: 2px; height: 5px; background: #0b0b0c; box-shadow: 0 0 0 1px #fff; opacity: 0; }',
    '#cc-cursor .cc-rain i:nth-child(1) { left: -9px; }',
    '#cc-cursor .cc-rain i:nth-child(2) { left: -1px; }',
    '#cc-cursor .cc-rain i:nth-child(3) { left: 7px; }',
    '#cc-cursor.is-rain .cc-rain i { animation: cc-drip .55s linear infinite; }',
    '#cc-cursor.is-rain .cc-rain i:nth-child(2) { animation-delay: .18s; }',
    '#cc-cursor.is-rain .cc-rain i:nth-child(3) { animation-delay: .36s; }',
    '@keyframes cc-drip { 0% { transform: translateY(9px); opacity: 0; } 20% { opacity: 1; } 75% { opacity: 1; } 100% { transform: translateY(24px); opacity: 0; } }',

    /* visibility by mode */
    '#cc-cursor .cc-circle { display: none; }',
    '#cc-cursor .cc-glyph, #cc-cursor .cc-rain { display: none; }',
    '#cc-cursor.is-circle .cc-circle { display: block; }',
    '#cc-cursor.is-cloud .cc-glyph, #cc-cursor.is-cloud .cc-rain { display: block; }',

    '@media (prefers-reduced-motion: reduce) {' +
    '  #cc-cursor .cc-glyph { transition: none; }' +
    '  #cc-cursor.is-rain .cc-rain i { animation: none; opacity: 0; }' +
    '}'
  ].join('\n');
  var styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  /* ---- element ---- */
  var el = document.createElement('div');
  el.id = 'cc-cursor';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML =
    '<div class="cc-circle"></div>' +
    '<div class="cc-glyph cc-sun">' + CLOUD + '</div>' +
    '<div class="cc-glyph cc-storm">' + STORM + '</div>' +
    '<div class="cc-rain"><i></i><i></i><i></i></div>';
  document.body.appendChild(el);
  document.documentElement.classList.add('cc-on');

  var circle = el.querySelector('.cc-circle');

  function applyCfg() {
    el.style.setProperty('--cc-size', cfg.size + 'px');
    // Always use the locked color so page-to-page navigation doesn't alter it
    el.style.setProperty('--cc-color', LOCKED_COLOR);
    el.style.setProperty('--cc-glyph', Math.round(cfg.size * 1.28) + 'px');
    el.classList.toggle('is-circle', cfg.mode === 'circle');
    el.classList.toggle('is-cloud', cfg.mode === 'cloud');
    if (cfg.mode !== 'cloud') el.classList.remove('is-rain', 'is-down');
  }
  applyCfg();

  /* ---- pointer follow (trailing) + scale spring ---- */
  var tx = -100, ty = -100, x = -100, y = -100, visible = false;
  var scale = 1, vScale = 0;          // spring state for the circle
  var hoverScale = 1, pressed = false;

  function ease() { return reduced ? 1 : Math.max(0.25, Math.min(1.0, cfg.trail)); }

  function frame() {
    var e = ease();
    if (e < 1) {
      x += (tx - x) * e;
      y += (ty - y) * e;
      el.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
    }

    // organic spring toward target scale (press shrink × hover grow)
    var target = (pressed ? cfg.shrink : 1) * hoverScale;
    if (reduced) {
      scale = target; vScale = 0;
    } else {
      var stiffness = 0.16, damping = 0.66;
      vScale = (vScale + (target - scale) * stiffness) * damping;
      scale += vScale;
    }
    if (cfg.mode === 'circle') circle.style.transform = 'scale(' + scale.toFixed(4) + ')';

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  /* ---- hover state (recomputed each move) ---- */
  function stateFor(t) {
    if (!(t instanceof Element)) return '';
    if (t.closest('.proj, .p-media, .pg-card, image-slot')) return 'is-card';
    if (t.closest('a, button, [role="button"], label, input, select, textarea, .menu-btn')) return 'is-link';
    return '';
  }
  function applyHover(s) {
    var isLink = s === 'is-link', isCard = s === 'is-card';
    el.classList.toggle('is-link', isLink);
    el.classList.toggle('is-card', isCard);
    hoverScale = isCard ? 1.7 : isLink ? 1.5 : 1;
  }

  window.addEventListener('mousemove', function (e) {
    tx = e.clientX; ty = e.clientY;
    if (!visible) { visible = true; x = tx; y = ty; el.classList.add('on'); }
    if (ease() >= 1) { x = tx; y = ty; el.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)'; }
    applyHover(stateFor(e.target));
  }, { passive: true });

  function reset() {
    visible = false; pressed = false;
    clearTimeout(rainT);
    el.classList.remove('on', 'is-link', 'is-card', 'is-down', 'is-rain');
    hoverScale = 1;
  }
  document.addEventListener('mouseleave', reset);
  window.addEventListener('blur', reset);

  /* ---- press: circle shrinks (spring); cloud storms ---- */
  var MIN_RAIN = 650, rainT = null, downAt = 0;
  window.addEventListener('mousedown', function () {
    pressed = true;
    if (cfg.mode === 'cloud') {
      el.classList.add('is-down', 'is-rain');
      clearTimeout(rainT); downAt = Date.now();
    }
  });
  window.addEventListener('mouseup', function () {
    pressed = false;                 // spring eases the circle back to size
    if (cfg.mode === 'cloud') {
      el.classList.remove('is-down');
      var left = Math.max(0, MIN_RAIN - (Date.now() - downAt));
      clearTimeout(rainT);
      rainT = setTimeout(function () { el.classList.remove('is-rain'); }, left);
    }
  });

  /* ---- public API + Tweaks bridge ---- */
  window.__cursor = {
    set: function (next) {
      if (!next) return;
      for (var k in next) if (next[k] != null && k in cfg) cfg[k] = next[k];
      applyCfg();
    }
  };
  window.addEventListener('tweakchange', function (e) {
    var d = e.detail || {};
    var next = {};
    if ('cursorStyle' in d) next.mode = String(d.cursorStyle).toLowerCase();
    if ('cursorSize' in d) next.size = d.cursorSize;
    if ('cursorShrink' in d) next.shrink = 1 - d.cursorShrink / 100;
    if ('cursorFeel' in d) next.trail = ({ Snappy: 0.85, Smooth: 0.70, Liquid: 0.40 })[d.cursorFeel] || cfg.trail;
    window.__cursor.set(next);
  });
})();
