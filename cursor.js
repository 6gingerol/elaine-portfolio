/* ============================================================
   cursor.js — custom cursor via CSS cursor image
   Uses a data URI SVG as the cursor — native browser handling,
   zero JS position tracking, maximum responsiveness.
   ============================================================ */
(function () {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  var SIZE = 22;
  var COLOR = '%23aeaeb2'; // URL-encoded #aeaeb2
  var HOTSPOT = SIZE / 2;

  // Filled circle cursor
  var dotSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + SIZE + '" height="' + SIZE + '" viewBox="0 0 ' + SIZE + ' ' + SIZE + '">' +
    '<circle cx="' + HOTSPOT + '" cy="' + HOTSPOT + '" r="' + (SIZE/2 - 1) + '" fill="' + COLOR + '"/>' +
    '</svg>';

  // Hollow ring cursor for links
  var ringSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + SIZE + '" height="' + SIZE + '" viewBox="0 0 ' + SIZE + ' ' + SIZE + '">' +
    '<circle cx="' + HOTSPOT + '" cy="' + HOTSPOT + '" r="' + (SIZE/2 - 2) + '" fill="none" stroke="' + COLOR + '" stroke-width="2"/>' +
    '</svg>';

  var dotUrl = 'url("data:image/svg+xml,' + encodeURIComponent(dotSvg.replace(/%23/g, '#')) + '") ' + HOTSPOT + ' ' + HOTSPOT + ', auto';
  var ringUrl = 'url("data:image/svg+xml,' + encodeURIComponent(ringSvg.replace(/%23/g, '#')) + '") ' + HOTSPOT + ' ' + HOTSPOT + ', auto';

  var style = document.createElement('style');
  style.textContent = [
    'html.cc-on, html.cc-on * { cursor: ' + dotUrl + ' !important; }',
    'html.cc-on button, html.cc-on [role="button"],',
    'html.cc-on input, html.cc-on select, html.cc-on textarea, html.cc-on .menu-btn,',
    'html.cc-on .proj:not(.locked), html.cc-on .proj:not(.locked) .p-media,',
    'html.cc-on .pg-card, html.cc-on image-slot {',
    '  cursor: ' + ringUrl + ' !important;',
    '}',
    'html.cc-on .proj.locked, html.cc-on .proj.locked *,',
    'html.cc-on a.locked, html.cc-on a.locked * {',
    '  cursor: ' + ringUrl + ' !important;',
    '}'
  ].join('\n');
  document.head.appendChild(style);
  document.documentElement.classList.add('cc-on');
})();
