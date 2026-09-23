(function () {
  'use strict';

  function setupLotties() {
    var containers = Array.from(document.querySelectorAll('[data-lottie-path]'));

    function fail(container) {
      container.classList.add('load-failed');
      container.setAttribute('aria-busy', 'false');
      var fallback = container.querySelector('.lottie-fallback');
      if (fallback) {
        fallback.hidden = false;
        fallback.textContent = 'Motion preview unavailable.';
      }
    }

    document.querySelectorAll('video[data-hover-play="true"]').forEach(function (video) {
      var hoverTarget = video.closest('.motion-project-media') || video;
      var showPreviewFrame = function () {
        if (!Number.isFinite(video.duration) || video.duration <= 0) return;
        try { video.currentTime = Math.min(1.4, Math.max(0, video.duration - 0.05)); } catch (error) {}
      };
      var play = function () {
        video.muted = true;
        if (video.readyState >= 1) video.currentTime = 0;
        var promise = video.play();
        if (promise) promise.catch(function () {});
      };
      var pause = function () {
        video.pause();
        showPreviewFrame();
      };
      video.addEventListener('loadedmetadata', showPreviewFrame);
      video.addEventListener('canplay', showPreviewFrame, { once: true });
      if (video.readyState >= 1) showPreviewFrame();
      hoverTarget.addEventListener('mouseenter', play);
      hoverTarget.addEventListener('mouseleave', pause);
      hoverTarget.addEventListener('focusin', play);
      hoverTarget.addEventListener('focusout', pause);
    });

    document.querySelectorAll('img[data-hover-gif-src]').forEach(function (image) {
      var poster = image.getAttribute('src');
      var gif = image.getAttribute('data-hover-gif-src');
      var hoverTarget = image.closest('.motion-project-media') || image;
      var play = function () {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        if (image.getAttribute('src') !== gif) image.setAttribute('src', gif);
      };
      var pause = function () {
        if (image.getAttribute('src') !== poster) image.setAttribute('src', poster);
      };
      hoverTarget.addEventListener('mouseenter', play);
      hoverTarget.addEventListener('mouseleave', pause);
      hoverTarget.addEventListener('focusin', play);
      hoverTarget.addEventListener('focusout', pause);
    });

    if (!window.lottie) {
      containers.forEach(fail);
      return;
    }

    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function load(container) {
      if (container.__lottieAnimation) return;

      var options = {
        container: container,
        renderer: 'svg',
        loop: !reducedMotion && container.dataset.lottieLoop !== 'false',
        autoplay: false,
        rendererSettings: {
          preserveAspectRatio: 'xMidYMid meet'
        }
      };
      var inlineAnimation = container.dataset.lottieGlobal && window[container.dataset.lottieGlobal];
      var frameRate = inlineAnimation && Number(inlineAnimation.fr) || 60;
      var previewFrame = function () {
        return Math.min(Math.max(0, Math.round(1.4 * frameRate)), Math.max(0, animation.totalFrames - 1));
      };
      if (inlineAnimation) {
        options.animationData = inlineAnimation;
      } else {
        options.path = container.dataset.lottiePath;
      }

      var animation;
      try {
        animation = window.lottie.loadAnimation(options);
      } catch (error) {
        fail(container);
        return;
      }

      container.__lottieAnimation = animation;
      container.setAttribute('aria-busy', 'true');

      animation.addEventListener('DOMLoaded', function () {
        container.classList.add('is-loaded');
        container.setAttribute('aria-busy', 'false');
        var fallback = container.querySelector('.lottie-fallback');
        if (fallback) fallback.hidden = true;
        animation.goToAndStop(previewFrame(), true);
      });
      animation.addEventListener('data_failed', function () { fail(container); });
      animation.addEventListener('error', function () { fail(container); });

      if (container.dataset.lottieHover === 'true') {
        var hoverTarget = container.closest('.motion-project-media') || container;
        var play = function () {
          if (!reducedMotion) animation.goToAndPlay(0, true);
        };
        var pause = function () {
          animation.pause();
          animation.goToAndStop(previewFrame(), true);
        };
        hoverTarget.addEventListener('mouseenter', play);
        hoverTarget.addEventListener('mouseleave', pause);
        hoverTarget.addEventListener('focusin', play);
        hoverTarget.addEventListener('focusout', pause);
      }
    }

    if (!('IntersectionObserver' in window)) {
      containers.forEach(load);
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        load(entry.target);
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '240px 0px' });

    containers.forEach(function (container) { observer.observe(container); });

  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupLotties, { once: true });
  } else {
    setupLotties();
  }
})();
