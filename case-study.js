/* Shared behavior for case study pages: quiet reveal + autoplay kick. */
(function () {
  // ---- reveal ----
  function hardShow(el) { el.style.transition = 'none'; el.style.opacity = '1'; el.style.transform = 'none'; }
  var revealEls = Array.prototype.slice.call(document.querySelectorAll('.reveal-self'));
  var scheduled = new WeakSet();
  function reveal(el) {
    if (el.classList.contains('in-view')) return;
    el.classList.add('in-view');
    if (!scheduled.has(el)) { scheduled.add(el); setTimeout(function () { hardShow(el); }, 950); }
  }
  function checkReveals() {
    var vh = window.innerHeight || document.documentElement.clientHeight;
    for (var i = 0; i < revealEls.length; i++) {
      var el = revealEls[i];
      if (el.classList.contains('in-view')) continue;
      var r = el.getBoundingClientRect();
      if (r.top < vh * 0.92 && r.bottom > 0) reveal(el);
    }
  }
  checkReveals();
  window.addEventListener('scroll', checkReveals, { passive: true });
  window.addEventListener('resize', checkReveals);
  window.addEventListener('load', function () { checkReveals(); setTimeout(checkReveals, 250); });
  setTimeout(function () { revealEls.forEach(hardShow); }, 1400); // failsafe

  // ---- lazy-load videos only when they approach the viewport ----
  function materializeVideo(v) {
    var src = v.getAttribute('data-lazy-src');
    if (!src || v.getAttribute('src')) return;
    v.setAttribute('src', src);
    v.removeAttribute('data-lazy-src');
    v.autoplay = true;
    v.load();
  }

  // ---- muted videos sometimes stall despite autoplay attrs ----
  function kickVideos() {
    document.querySelectorAll('video[autoplay]').forEach(function (v) {
      v.muted = true;
      if (v.paused) { var p = v.play(); if (p) p.catch(function () {}); }
    });
  }
  window.addEventListener('load', kickVideos);
  kickVideos();
  window.addEventListener('pointermove', kickVideos, { once: true });

  // ---- heavy loops: only decode the one(s) on screen ----
  // autoplay videos pause when scrolled away; [data-play-on-visible]
  // videos don't start playing until they enter the viewport.
  // (scroll-listener pattern — IntersectionObserver is unreliable in
  // some embedded webviews, so we mirror the checkReveals approach.)
  var lazyVids = Array.prototype.slice.call(document.querySelectorAll('video[autoplay], video[data-play-on-visible], video[data-lazy-src]'));
  function checkVideos() {
    var vh = window.innerHeight || document.documentElement.clientHeight;
    lazyVids.forEach(function (v) {
      var r = v.getBoundingClientRect();
      var near = r.bottom > -120 && r.top < vh + 120;
      v.muted = true;
      if (near) {
        materializeVideo(v);
        if (v.paused) { var p = v.play(); if (p) p.catch(function () {}); }
      } else if (!v.paused) {
        v.pause();
      }
    });
  }
  checkVideos();
  window.addEventListener('scroll', checkVideos, { passive: true });
  window.addEventListener('resize', checkVideos);
  window.addEventListener('load', checkVideos);

  // ---- returning via back/forward cache can leave videos blank or frozen ----
  window.addEventListener('pageshow', function (e) {
    document.querySelectorAll('video').forEach(function (v) {
      v.muted = true;
      if (!v.getAttribute('src') && v.getAttribute('data-lazy-src')) return;
      if (e.persisted || v.readyState === 0 || v.error) {
        try { v.load(); } catch (err) {}
      }
    });
    kickVideos();
    checkVideos();
  });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') kickVideos();
  });

  // ---- mobile drawer (sidebar on case pages) ----
  var menuBtn = document.getElementById('menuBtn');
  var backdrop = document.getElementById('backdrop');
  if (menuBtn && backdrop) {
    menuBtn.addEventListener('click', function () { document.body.classList.toggle('nav-open'); });
    backdrop.addEventListener('click', function () { document.body.classList.remove('nav-open'); });
  }
})();
