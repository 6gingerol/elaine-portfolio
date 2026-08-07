/* ============================================================
   cursor.js — portfolio cursor engine
   A simple cursor dot that follows the pointer instantly.
   Desktop fine-pointer only; pointer-events:none so links stay usable.
   ============================================================ */
(function () {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  var CURSOR_SIZE = 22;
  var CURSOR_COLOR = '#aeaeb2';

  var css = [
    'html.cc-on, html.cc-on * { cursor: none !important; }',
    '#cc-cursor {',
    '  position: fixed; left: 0; top: 0; z-index: 99999; pointer-events: none;',
    '  width: ' + CURSOR_SIZE + 'px; height: ' + CURSOR_SIZE + 'px;',
    '  margin-left: ' + (-CURSOR_SIZE / 2) + 'px;',
    '  margin-top: ' + (-CURSOR_SIZE / 2) + 'px;',
    '  border-radius: 50%;',
    '  background: ' + CURSOR_COLOR + ';',
    '  box-shadow: 0 0 0 1px rgba(255,255,255,.5), 0 1px 6px rgba(0,0,0,.14);',
    '  opacity: 0;',
    '  transition: opacity .15s, background .2s, box-shadow .2s;',
    '  will-change: transform;',
    '}',
    '#cc-cursor.on { opacity: 1; }',
    '#cc-cursor.is-link, #cc-cursor.is-card {',
    '  background: transparent;',
    '  box-shadow: 0 0 0 1.6px ' + CURSOR_COLOR + ', 0 0 0 2.2px rgba(255,255,255,.45);',
    '}'
  ].join('\n');

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  var el = document.createElement('div');
  el.id = 'cc-cursor';
  el.setAttribute('aria-hidden', 'true');
  document.body.appendChild(el);
  document.documentElement.classList.add('cc-on');

  var visible = false;

  function stateFor(t) {
    if (!(t instanceof Element)) return '';
    if (t.closest('.proj, .p-media, .pg-card, image-slot')) return 'card';
    if (t.closest('a, button, [role="button"], label, input, select, textarea, .menu-btn')) return 'link';
    return '';
  }

  window.addEventListener('mousemove', function (e) {
    el.style.transform = 'translate3d(' + e.clientX + 'px,' + e.clientY + 'px,0)';
    if (!visible) { visible = true; el.classList.add('on'); }
    var s = stateFor(e.target);
    el.classList.toggle('is-link', s === 'link');
    el.classList.toggle('is-card', s === 'card');
  }, { passive: true });

  function reset() {
    visible = false;
    el.classList.remove('on', 'is-link', 'is-card');
  }
  document.addEventListener('mouseleave', reset);
  window.addEventListener('blur', reset);
})();
