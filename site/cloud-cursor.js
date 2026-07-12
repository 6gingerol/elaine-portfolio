/* ============================================================
   cloud-cursor.js — PP Mondwest cloud-glyph cursor (v2)
   The cursor IS the ☁ glyph from PP Mondwest (the headline
   font), scaled down to classic cursor size — not a redraw.
   - Default:  ☁  (~28px, ink, hairline white halo so it stays
               readable over photos/videos)
   - Press:    ⛈  + animated falling pixel drops. A quick click
               plays one short burst; HOLDING the mouse keeps
               the rain looping until release.
   - Hover (links & cards): subtle scale lift only — no glyph swap.
   Desktop fine-pointer only; pointer-events: none; fixed
   positioning + rAF easing; respects prefers-reduced-motion
   (glyph still swaps on press, drops don't animate).

   To revert to the old pixel star: swap this <script> back to
   pixel-cursor.js (kept in the project root).
   ============================================================ */
(function () {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- single global cursor scale — the ONLY place size is defined.
  // Figma export was 63px / 56×68 box; for a real cursor we match the
  // old star's ~26px footprint instead of the canvas-export values.
  var SIZE = 28;          // font-size in px → glyph renders ~25px wide
  var FONT = "'PP Mondwest', 'FS Mondwest', 'Pixelify Sans', system-ui, sans-serif";
  var INK = '#0b0b0c';
  var CLOUD = '\u2601\uFE0E'; // ☁ — text presentation, never color emoji
  var STORM = '\u26C8\uFE0E'; // ⛈

  // hairline white halo — keeps the ink glyph legible over dark media
  var HALO = '1px 0 #fff, -1px 0 #fff, 0 1px #fff, 0 -1px #fff, ' +
             '1px 1px #fff, -1px 1px #fff, 1px -1px #fff, -1px -1px #fff';

  var css = [
    'html.pix-cursor, html.pix-cursor * { cursor: none !important; }',
    '#pix-cursor { position: fixed; left: 0; top: 0; z-index: 99999; pointer-events: none; opacity: 0; transition: opacity 0.18s ease; }',
    '#pix-cursor.on { opacity: 1; }',
    '#pix-cursor .pc-glyph {' +
    '  position: absolute; left: 0; top: 0; transform: translate(-50%, -50%);' +
    '  font-family: ' + FONT + '; font-weight: 400; font-style: normal;' +
    '  font-size: ' + SIZE + 'px; line-height: 1; color: ' + INK + ';' +
    '  text-shadow: ' + HALO + ';' +
    '  user-select: none; white-space: nowrap;' +
    '  transition: transform 0.16s ease, opacity 0.12s ease;' +
    '}',
    '#pix-cursor .pc-storm { transform: translate(-50%, -50%) scale(0.92); opacity: 0; }',
    // rain state: ☁ → ⛈
    '#pix-cursor.is-rain .pc-sun { opacity: 0; transform: translate(-50%, -50%) scale(0.92); }',
    '#pix-cursor.is-rain .pc-storm { opacity: 1; transform: translate(-50%, -50%) scale(1); }',
    // hover: subtle lift only (no glyph swap)
    '#pix-cursor.is-link .pc-glyph { transform: translate(-50%, -52%) scale(1.08); }',
    '#pix-cursor.is-card .pc-glyph { transform: translate(-50%, -54%) scale(1.14); }',
    '#pix-cursor.is-link.is-rain .pc-sun, #pix-cursor.is-card.is-rain .pc-sun { opacity: 0; }',
    // press: gentle squish on whichever glyph is showing
    '#pix-cursor.is-down.is-rain .pc-storm { transform: translate(-50%, -50%) scale(0.96); }',
    // animated drops — loop while .is-rain is on (hold = keeps raining)
    '#pix-cursor .pc-rain { position: absolute; left: 0; top: 0; }',
    '#pix-cursor .pc-rain i { position: absolute; width: 2px; height: 5px; background: ' + INK + '; box-shadow: 0 0 0 1px #fff; opacity: 0; }',
    '#pix-cursor .pc-rain i:nth-child(1) { left: -9px; }',
    '#pix-cursor .pc-rain i:nth-child(2) { left: -1px; }',
    '#pix-cursor .pc-rain i:nth-child(3) { left: 7px; }',
    '#pix-cursor.is-rain .pc-rain i { animation: pc-drip 0.55s linear infinite; }',
    '#pix-cursor.is-rain .pc-rain i:nth-child(2) { animation-delay: 0.18s; }',
    '#pix-cursor.is-rain .pc-rain i:nth-child(3) { animation-delay: 0.36s; }',
    '@keyframes pc-drip {' +
    '  0%   { transform: translateY(' + SIZE * 0.3 + 'px); opacity: 0; }' +
    '  20%  { opacity: 1; }' +
    '  75%  { opacity: 1; }' +
    '  100% { transform: translateY(' + SIZE * 0.85 + 'px); opacity: 0; }' +
    '}',
    '@media (prefers-reduced-motion: reduce) {' +
    '  #pix-cursor .pc-glyph { transition: none; }' +
    '  #pix-cursor.is-rain .pc-rain i { animation: none; opacity: 0; }' +
    '}'
  ].join('\n');
  var styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  var el = document.createElement('div');
  el.id = 'pix-cursor';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML =
    '<div class="pc-glyph pc-sun">' + CLOUD + '</div>' +
    '<div class="pc-glyph pc-storm">' + STORM + '</div>' +
    '<div class="pc-rain"><i></i><i></i><i></i></div>';
  document.body.appendChild(el);
  document.documentElement.classList.add('pix-cursor');

  var tx = -100, ty = -100, x = -100, y = -100, visible = false;
  var ease = reduced ? 1 : 0.32;

  function frame() {
    x += (tx - x) * ease;
    y += (ty - y) * ease;
    el.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // single source of truth for hover state — recomputed on every move
  function stateFor(t) {
    if (!(t instanceof Element)) return '';
    if (t.closest('.proj, .p-media, .pg-card')) return 'is-card';
    if (t.closest('a, button, [role="button"], label, input, select, textarea')) return 'is-link';
    return '';
  }
  function applyState(s) {
    el.classList.toggle('is-card', s === 'is-card');
    el.classList.toggle('is-link', s === 'is-link');
  }

  window.addEventListener('mousemove', function (e) {
    tx = e.clientX; ty = e.clientY;
    if (!visible) {
      visible = true;
      x = tx; y = ty; // snap on (re)entry — no fly-in from the old position
      el.classList.add('on');
    }
    applyState(stateFor(e.target));
  }, { passive: true });

  // leaving the viewport (any edge): hide and fully reset state
  function reset() {
    visible = false;
    clearTimeout(rainT);
    el.classList.remove('on', 'is-card', 'is-link', 'is-down', 'is-rain');
  }
  document.addEventListener('mouseleave', reset);
  window.addEventListener('blur', reset);

  // press → ⛈ + rain. Hold keeps it raining; a quick click still
  // gets a minimum burst so the animation reads.
  var MIN_RAIN = 650; // ms — at least one full drop cycle
  var rainT = null, downAt = 0;

  window.addEventListener('mousedown', function () {
    el.classList.add('is-down', 'is-rain');
    clearTimeout(rainT);
    downAt = Date.now();
  });
  window.addEventListener('mouseup', function () {
    el.classList.remove('is-down');
    var left = Math.max(0, MIN_RAIN - (Date.now() - downAt));
    clearTimeout(rainT);
    rainT = setTimeout(function () { el.classList.remove('is-rain'); }, left);
  });
})();
