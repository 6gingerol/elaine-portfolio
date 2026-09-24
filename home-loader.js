(() => {
  const homeLoader = document.getElementById('homeLoader');
  const homeLoaderText = homeLoader?.querySelector('[data-home-loader-text]');
  // The loader belongs to the landing view, not deep-linked sections.
  const isSectionView = Boolean(window.location.hash);
  let showHomeLoader = !isSectionView;

  if (showHomeLoader) {
    try {
      showHomeLoader = sessionStorage.getItem('elaine-home-loader-seen') !== '1';
      if (showHomeLoader) sessionStorage.setItem('elaine-home-loader-seen', '1');
    } catch (error) {
      // Storage can be unavailable in private browsing; the loader still works.
    }
  }

  if (!showHomeLoader && homeLoader) {
    homeLoader.remove();
    document.body.classList.remove('home-loading');
    return;
  }

  if (!homeLoader || !homeLoaderText) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const loaderMinimumDuration = prefersReducedMotion ? 2300 : 3000;
  const loaderExitDuration = prefersReducedMotion ? 550 : 1150;

  const disperseTransforms = [
    { x: -0.8, y: -0.6, rotationZ: -29 },
    { x: -0.2, y: -0.4, rotationZ: -6 },
    { x: -0.05, y: 0.1, rotationZ: 12 },
    { x: -0.05, y: -0.1, rotationZ: -9 },
    { x: -0.1, y: 0.55, rotationZ: 3 },
    { x: 0, y: -0.1, rotationZ: 9 },
    { x: 0, y: 0.15, rotationZ: -12 },
    { x: 0, y: 0.15, rotationZ: -17 },
    { x: 0, y: -0.65, rotationZ: 9 },
    { x: 0.1, y: 0.4, rotationZ: 12 },
    { x: 0, y: -0.15, rotationZ: -9 },
    { x: 0.2, y: 0.15, rotationZ: 12 },
    { x: 0.8, y: 0.6, rotationZ: 20 },
  ];

  homeLoaderText.textContent = '';
  const loaderLines = [
    ['welcome', 'to', "elaine's"],
    ['corner', 'of', 'the', 'internet'],
  ];
  let characterIndex = 0;

  loaderLines.forEach((words) => {
    const line = document.createElement('span');
    line.className = 'home-loader-line';

    words.forEach((word, wordIndex) => {
      const wordGroup = document.createElement('span');
      wordGroup.className = 'home-loader-word';

      Array.from(word).forEach((character) => {
        const letter = document.createElement('span');
        const transform = disperseTransforms[characterIndex % disperseTransforms.length];
        const exitDelay = ((characterIndex * 13) % 8) * 0.045;
        const exitX = transform.x * 1.35;
        const exitY = transform.y * 1.35;
        const exitRotation = transform.rotationZ * 1.12;

        letter.className = 'home-loader-char';
        letter.textContent = character;
        letter.style.setProperty('--loader-delay', `${characterIndex * 0.04}s`);
        letter.style.setProperty('--loader-exit-delay', `${exitDelay}s`);
        letter.style.setProperty('--loader-x', `${transform.x}em`);
        letter.style.setProperty('--loader-y', `${transform.y}em`);
        letter.style.setProperty('--loader-rotation', `${transform.rotationZ}deg`);
        letter.style.setProperty('--loader-exit-x', `${exitX}em`);
        letter.style.setProperty('--loader-exit-y', `${exitY}em`);
        letter.style.setProperty('--loader-exit-rotation', `${exitRotation}deg`);
        wordGroup.appendChild(letter);
        characterIndex += 1;
      });

      line.appendChild(wordGroup);
      if (wordIndex < words.length - 1) {
        const gap = document.createElement('span');
        gap.className = 'home-loader-gap';
        gap.setAttribute('aria-hidden', 'true');
        line.appendChild(gap);
      }
    });

    homeLoaderText.appendChild(line);
  });

  const loaderStartedAt = performance.now();
  let loaderFinished = false;

  // Let the browser paint the initial state before releasing the characters.
  // This keeps the assemble animation visible on slower and Windows browsers.
  window.requestAnimationFrame(() => {
    homeLoader.classList.remove('is-preparing');
    homeLoader.classList.add('is-ready');
  });

  function finishHomeLoader() {
    if (loaderFinished) return;
    loaderFinished = true;
    const remainingAnimation = Math.max(0, loaderMinimumDuration - (performance.now() - loaderStartedAt));

    window.setTimeout(() => {
      homeLoader.classList.add('is-exiting');
      window.setTimeout(() => {
        homeLoader.classList.add('is-done');
        document.body.classList.remove('home-loading');
        window.setTimeout(() => homeLoader.remove(), 700);
      }, loaderExitDuration);
    }, remainingAnimation);
  }

  if (document.readyState === 'complete') finishHomeLoader();
  else window.addEventListener('load', finishHomeLoader, { once: true });
  window.setTimeout(finishHomeLoader, 6000);
})();
