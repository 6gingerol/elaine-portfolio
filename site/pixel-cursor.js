/* ============================================================
   pixel-cursor.js — custom pixel-star cursor (v2)
   A flat 5-point pixel star (warm yellow, orange outline, small
   highlight — no glow) follows the pointer with a light ease.
   Over project cards it fully transforms into a minimal pixel
   ↗ pointer. Desktop fine-pointer only; never blocks events.
   State is recomputed on every mousemove and reset whenever the
   pointer leaves the viewport, so re-entry is always correct.
   ============================================================ */
(function () {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Chubby rounded 5-point star with a swoosh highlight — hand-drawn
  // silhouette (mirrored ranges), auto-outlined in orange.
  function makeStarMap() {
    var FILL = [
      [[9, 11]], [[9, 11]], [[8, 12]], [[8, 12]], [[7, 13]], [[7, 13]],
      [[2, 18]], [[0, 20]], [[0, 20]], [[1, 19]], [[2, 18]],
      [[3, 17]], [[3, 17]], [[4, 16]], [[4, 16]],
      [[4, 9], [11, 16]], [[3, 8], [12, 17]], [[3, 7], [13, 17]], [[2, 6], [14, 18]], [[3, 5], [15, 17]]
    ];
    var N = 21, R = FILL.length, g = [], x, y;
    for (y = 0; y < R; y++) {
      var row = [];
      for (x = 0; x < N; x++) row.push('.');
      FILL[y].forEach(function (rg) { for (var i = rg[0]; i <= rg[1]; i++) row[i] = 'X'; });
      g.push(row);
    }
    var out = [];
    for (y = 0; y < R; y++) {
      for (x = 0; x < N; x++) {
        if (g[y][x] !== 'X') continue;
        if (x === 0 || y === 0 || x === N - 1 || y === R - 1 ||
            g[y][x - 1] === '.' || g[y][x + 1] === '.' ||
            g[y - 1][x] === '.' || g[y + 1][x] === '.') out.push([y, x]);
      }
    }
    out.forEach(function (c) { g[c[0]][c[1]] = 'O'; });
    // swoosh highlight, upper-left: white core + light-gold halo
    [[7, 4, 8, 'W'], [7, 9, 11, 'L'], [8, 4, 7, 'W'], [8, 8, 10, 'L'], [9, 5, 8, 'L'], [10, 6, 8, 'L']]
      .forEach(function (h) {
        for (var i = h[1]; i <= h[2]; i++) if (g[h[0]][i] === 'X') g[h[0]][i] = h[3];
      });
    return g.map(function (row2) { return row2.join(''); });
  }
  var STAR = makeStarMap();
  // ---- single global cursor scale — the ONLY place size is defined.
  // All pages load this same file; do not override per-page.
  var STAR_PX = 1.25;   // star pixel size (was 1.5)
  var ARROW_PX = 1.75;  // card-hover arrow pixel size (was 2)
  // minimal pixel ↗ pointer — solid head top-right, diagonal tail
  var ARROW = [
    '...XXXXXXX',
    '....XXXXXX',
    '.....XXXXX',
    '......XXXX',
    '.....XX...',
    '....XX....',
    '...XX.....',
    '..XX......',
    '.XX.......',
    'XX........'
  ];
  var COLORS = { O: '#F2920E', X: '#FFC61E', L: '#FFE05A', W: '#FFF8CE' };
  var INK = '#0b0b0c';

  function pixelSvg(map, px, colors) {
    var rows = map.length, cols = map[0].length, r = [];
    for (var y = 0; y < rows; y++) {
      for (var x = 0; x < cols; x++) {
        var c = map[y][x];
        if (c === '.') continue;
        r.push('<rect x="' + x * px + '" y="' + y * px + '" width="' + px + '" height="' + px + '" fill="' + colors[c] + '"/>');
      }
    }
    return '<svg width="' + cols * px + '" height="' + rows * px + '" viewBox="0 0 ' + cols * px + ' ' + rows * px + '" shape-rendering="crispEdges">' + r.join('') + '</svg>';
  }

  var css = [
    'html.pix-cursor, html.pix-cursor * { cursor: none !important; }',
    '#pix-cursor { position: fixed; left: 0; top: 0; z-index: 99999; pointer-events: none; opacity: 0; transition: opacity 0.18s ease; }',
    '#pix-cursor.on { opacity: 1; }',
    '#pix-cursor .pc-star, #pix-cursor .pc-arrow { position: absolute; left: 0; top: 0; transition: transform 0.16s ease, opacity 0.13s ease; }',
    '#pix-cursor .pc-star { transform: translate(-50%, -50%) scale(1); }',
    '#pix-cursor .pc-arrow { transform: translate(-50%, -50%) scale(0.4); opacity: 0; }',
    '#pix-cursor.is-link .pc-star { transform: translate(-50%, -50%) scale(1.15); }',
    '#pix-cursor.is-card .pc-star { transform: translate(-50%, -50%) scale(0.3); opacity: 0; }',
    '#pix-cursor.is-card .pc-arrow { transform: translate(-50%, -50%) scale(1); opacity: 1; }',
    '#pix-cursor.is-down .pc-star { transform: translate(-50%, -50%) scale(0.82); }',
    '#pix-cursor.is-card.is-down .pc-arrow { transform: translate(-50%, -50%) scale(0.85); }',
    '@media (prefers-reduced-motion: reduce) { #pix-cursor .pc-star, #pix-cursor .pc-arrow { transition: none; } }'
  ].join('\n');
  var styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  var el = document.createElement('div');
  el.id = 'pix-cursor';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML =
    '<div class="pc-star">' + pixelSvg(STAR, STAR_PX, COLORS) + '</div>' +
    '<div class="pc-arrow">' + pixelSvg(ARROW, ARROW_PX, { X: INK }) + '</div>';
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
  document.addEventListener('mouseleave', function () {
    visible = false;
    el.classList.remove('on', 'is-card', 'is-link', 'is-down');
  });
  window.addEventListener('blur', function () {
    visible = false;
    el.classList.remove('on', 'is-card', 'is-link', 'is-down');
  });

  window.addEventListener('mousedown', function () { el.classList.add('is-down'); });
  window.addEventListener('mouseup', function () { el.classList.remove('is-down'); });
})();
