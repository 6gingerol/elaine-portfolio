/*
 * footer-dotfield.js
 * A small, dependency-free halftone field for .home-foot.
 * The grid stays geometric and monochrome; only the pixels' scale,
 * opacity, ambient drift, and quiet fine-pointer repulsion vary.
 */
(function () {
  'use strict';

  var footers = Array.prototype.slice.call(document.querySelectorAll('.home-foot'));
  if (!footers.length) return;

  var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var finePointerQuery = window.matchMedia('(pointer: fine)');
  var reducedMotion = motionQuery.matches;
  /* A touchscreen PC can still have a fine mouse or trackpad pointer.
     Pointer events identify and ignore touch input below. */
  var pointerInteraction = finePointerQuery.matches;

  /* Tune these values to change the field without changing the layout. */
  var OPTIONS = {
    spacing: 14,
    dotSize: 1.15,
    cursorRadius: 112,
    repulsionStrength: 14,
    ambientSpeed: 0.00032,
    ambientDistance: 0.8,
    dotColor: ''
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function random(seed) {
    var value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
    return value - Math.floor(value);
  }

  function viewportContains(footer) {
    var rect = footer.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight;
  }

  function makeField(footer) {
    var canvas = footer.querySelector('.footer-dotfield');
    if (!canvas) return null;

    var context = canvas.getContext('2d');
    if (!context) return null;
    var copyLines = Array.prototype.slice.call(
      footer.querySelectorAll('.home-foot-note, .home-foot-copyright')
    );

    var state = {
      footer: footer,
      canvas: canvas,
      context: context,
      width: 1,
      height: 1,
      dpr: 1,
      dots: [],
      textZones: [],
      color: '#0b0b0c',
      visible: viewportContains(footer),
      frame: 0,
      pointer: { x: 0, y: 0, active: false }
    };

    function readColor() {
      var computed = window.getComputedStyle(footer);
      state.color = OPTIONS.dotColor || computed.color || '#0b0b0c';
    }

    function readTextZones() {
      var footerRect = footer.getBoundingClientRect();
      state.textZones = copyLines.map(function (line) {
        var rect = line.getBoundingClientRect();
        return {
          left: rect.left - footerRect.left - 1,
          right: rect.right - footerRect.left + 1,
          top: rect.top - footerRect.top - 1,
          bottom: rect.bottom - footerRect.top + 1
        };
      });
    }

    function isTextZone(x, y) {
      for (var i = 0; i < state.textZones.length; i += 1) {
        var zone = state.textZones[i];
        if (x >= zone.left && x <= zone.right && y >= zone.top && y <= zone.bottom) return true;
      }
      return false;
    }

    function buildDots() {
      var columns = Math.ceil(state.width / OPTIONS.spacing) + 1;
      var rows = Math.ceil(state.height / OPTIONS.spacing) + 1;
      var xStart = (state.width - (columns - 1) * OPTIONS.spacing) / 2;
      var yStart = (state.height - (rows - 1) * OPTIONS.spacing) / 2;
      var dots = [];
      var index = 0;

      for (var row = 0; row < rows; row += 1) {
        for (var column = 0; column < columns; column += 1) {
          var seed = index + 1;
          var scale = 0.78 + random(seed) * 0.34;
          var opacity = 0.16 + random(seed + 31) * 0.16;
          var phase = random(seed + 67) * Math.PI * 2;
          dots.push({
            baseX: xStart + column * OPTIONS.spacing + (random(seed + 97) - 0.5) * 0.45,
            baseY: yStart + row * OPTIONS.spacing + (random(seed + 131) - 0.5) * 0.45,
            size: OPTIONS.dotSize * scale,
            opacity: opacity,
            phase: phase,
            x: 0,
            y: 0
          });
          index += 1;
        }
      }

      state.dots = dots;
      for (var i = 0; i < state.dots.length; i += 1) {
        state.dots[i].x = state.dots[i].baseX;
        state.dots[i].y = state.dots[i].baseY;
      }
    }

    function resize() {
      var rect = footer.getBoundingClientRect();
      state.width = Math.max(1, rect.width);
      state.height = Math.max(1, rect.height);
      state.dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(state.width * state.dpr);
      canvas.height = Math.round(state.height * state.dpr);
      canvas.style.width = state.width + 'px';
      canvas.style.height = state.height + 'px';
      context.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
      readColor();
      readTextZones();
      buildDots();
      draw(0);
    }

    function draw(timestamp) {
      var ambientTime = reducedMotion ? 0 : timestamp * OPTIONS.ambientSpeed;
      context.clearRect(0, 0, state.width, state.height);
      context.fillStyle = state.color;

      for (var i = 0; i < state.dots.length; i += 1) {
        var dot = state.dots[i];
        var targetX = dot.baseX;
        var targetY = dot.baseY;

        if (!reducedMotion) {
          targetX += Math.sin(ambientTime + dot.phase) * OPTIONS.ambientDistance;
          targetY += Math.cos(ambientTime * 0.86 + dot.phase) * OPTIONS.ambientDistance;
        }

        if (pointerInteraction && state.pointer.active) {
          var dx = targetX - state.pointer.x;
          var dy = targetY - state.pointer.y;
          var distance = Math.sqrt(dx * dx + dy * dy);
          if (distance > 0 && distance < OPTIONS.cursorRadius) {
            var falloff = Math.pow(1 - distance / OPTIONS.cursorRadius, 2);
            var push = OPTIONS.repulsionStrength * falloff;
            targetX += dx / distance * push;
            targetY += dy / distance * push;
          }
        }

        var easing = reducedMotion ? 1 : 0.16;
        dot.x += (targetX - dot.x) * easing;
        dot.y += (targetY - dot.y) * easing;
        if (isTextZone(dot.x, dot.y)) continue;
        context.globalAlpha = dot.opacity;
        context.fillRect(dot.x - dot.size, dot.y - dot.size, dot.size * 2, dot.size * 2);
      }

      context.globalAlpha = 1;
    }

    function stop() {
      if (state.frame) cancelAnimationFrame(state.frame);
      state.frame = 0;
    }

    function tick(timestamp) {
      state.frame = 0;
      if (!state.visible || document.hidden) return;
      draw(timestamp);
      if (!reducedMotion) state.frame = requestAnimationFrame(tick);
    }

    function start() {
      if (!state.visible || document.hidden) return;
      if (reducedMotion) {
        draw(performance.now());
        return;
      }
      if (!state.frame) state.frame = requestAnimationFrame(tick);
    }

    if (pointerInteraction) {
      footer.addEventListener('pointermove', function (event) {
        if (event.pointerType === 'touch') return;
        var rect = footer.getBoundingClientRect();
        state.pointer.x = event.clientX - rect.left;
        state.pointer.y = event.clientY - rect.top;
        state.pointer.active = true;
        if (reducedMotion) draw(performance.now());
        else start();
      }, { passive: true });

      footer.addEventListener('pointerleave', function () {
        state.pointer.active = false;
        if (reducedMotion) draw(performance.now());
      }, { passive: true });
    }

    resize();
    return {
      state: state,
      resize: resize,
      draw: draw,
      start: start,
      stop: stop
    };
  }

  var fields = footers.map(makeField).filter(Boolean);

  /* Sidebar collapse changes the footer width without firing window.resize. */
  if ('ResizeObserver' in window) {
    var footerResizeObserver = new ResizeObserver(function (entries) {
      entries.forEach(function (entry) {
        var field = fields.find(function (candidate) {
          return candidate.state.footer === entry.target;
        });
        if (field) field.resize();
      });
    });
    fields.forEach(function (field) { footerResizeObserver.observe(field.state.footer); });
  }

  function updateVisibility() {
    fields.forEach(function (field) {
      field.state.visible = viewportContains(field.state.footer);
      if (field.state.visible) field.start();
      else field.stop();
    });
  }

  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var field = fields.find(function (candidate) {
          return candidate.state.footer === entry.target;
        });
        if (!field) return;
        field.state.visible = entry.isIntersecting;
        if (field.state.visible) {
          field.resize();
          field.start();
        }
        else field.stop();
      });
    }, { threshold: 0.01 });
    fields.forEach(function (field) { observer.observe(field.state.footer); });
  }

  window.addEventListener('resize', function () {
    fields.forEach(function (field) { field.resize(); });
    updateVisibility();
  }, { passive: true });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) fields.forEach(function (field) { field.stop(); });
    else updateVisibility();
  });

  function onMotionPreferenceChange(event) {
    reducedMotion = event.matches;
    fields.forEach(function (field) {
      field.stop();
      field.draw(0);
      field.state.pointer.active = false;
      field.start();
    });
  }

  if (motionQuery.addEventListener) motionQuery.addEventListener('change', onMotionPreferenceChange);
  else if (motionQuery.addListener) motionQuery.addListener(onMotionPreferenceChange);

  updateVisibility();
})();
