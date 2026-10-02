(() => {
  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const stage = document.querySelector('.hero-stage');
  const hero = document.querySelector('.hero');
  const backgroundVideo = document.querySelector('.hero__video');
  const dialog = document.querySelector('.tour-dialog');
  const dialogVideo = dialog.querySelector('video');
  const preloader = document.querySelector('.preloader');

  const sleep = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));
  const fontReady = document.fonts ? document.fonts.ready.catch(() => {}) : Promise.resolve();
  let videoReady = false;
  let targetTime = 0;
  let frame = 0;

  function scrub() {
    frame = 0;
    if (!videoReady || document.hidden || backgroundVideo.error || backgroundVideo.seeking) return;
    if (Math.abs(targetTime - backgroundVideo.currentTime) > 0.025) {
      backgroundVideo.currentTime = targetTime;
    }
  }

  function scheduleScrub() {
    if (!frame) frame = requestAnimationFrame(scrub);
  }

  let preloaderFallback;
  function finishPreloader() {
    if (!preloader.isConnected) return;
    window.clearTimeout(preloaderFallback);
    preloader.remove();
    root.classList.add('is-revealed');
  }

  preloader.addEventListener('transitionend', (event) => {
    if (event.target === preloader && event.propertyName === 'transform') finishPreloader();
  });

  function updateScrollVideo() {
    if (!videoReady) return;
    const travel = Math.max(1, stage.offsetHeight - hero.offsetHeight);
    const progress = Math.max(0, Math.min(1, -stage.getBoundingClientRect().top / travel));
    targetTime = progress * Math.max(0, backgroundVideo.duration - 0.05);
    scheduleScrub();
  }

  async function loadVideo() {
    const response = await fetch(backgroundVideo.dataset.src, { credentials: 'same-origin' });
    if (!response.ok) throw new Error(`Video request failed: ${response.status}`);
    const bytes = await response.blob();
    if (!bytes.size) throw new Error('Video file is empty');
    const videoUrl = URL.createObjectURL(new Blob([bytes], { type: 'video/mp4' }));
    await new Promise((resolve, reject) => {
      backgroundVideo.addEventListener('loadeddata', resolve, { once: true });
      backgroundVideo.addEventListener('error', () => reject(new Error('Video could not be decoded')), { once: true });
      backgroundVideo.src = videoUrl;
      backgroundVideo.load();
    });
    if (!Number.isFinite(backgroundVideo.duration) || backgroundVideo.duration <= 0) {
      throw new Error('Video duration is unavailable');
    }
    backgroundVideo.pause();
    dialogVideo.src = videoUrl;
    videoReady = true;
    updateScrollVideo();
  }

  Promise.all([fontReady, loadVideo(), sleep(reducedMotion.matches ? 100 : 1900)]).then(() => {
    root.classList.add('is-ready');
    if (reducedMotion.matches) finishPreloader();
    else preloaderFallback = window.setTimeout(finishPreloader, 1500);
  }).catch(() => {
    const message = document.createElement('p');
    message.className = 'preloader__error';
    message.textContent = 'Video could not load. Please refresh the page.';
    preloader.append(message);
  });

  backgroundVideo.addEventListener('seeked', () => {
    if (Math.abs(targetTime - backgroundVideo.currentTime) > 0.025) scheduleScrub();
  });
  window.addEventListener('scroll', updateScrollVideo, { passive: true });
  window.addEventListener('resize', updateScrollVideo, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) updateScrollVideo();
  });

  const menuButton = document.querySelector('.menu-toggle');
  const menuLinks = document.querySelectorAll('.site-nav a');
  function setMenuOpen(open) {
    document.body.classList.toggle('menu-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  menuButton.addEventListener('click', () => setMenuOpen(!document.body.classList.contains('menu-open')));
  menuLinks.forEach((link) => link.addEventListener('click', () => setMenuOpen(false)));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setMenuOpen(false);
  });

  const tourCard = document.querySelector('.tour-card');
  const closeButton = dialog.querySelector('.tour-dialog__close');
  function openTour() {
    dialog.showModal();
    dialogVideo.currentTime = 0;
    dialogVideo.play().catch(() => {});
    closeButton.focus();
  }
  tourCard.addEventListener('click', openTour);
  document.querySelector('.site-nav a[href="#video-tour"]').addEventListener('click', (event) => {
    event.preventDefault();
    openTour();
  });
  closeButton.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => dialogVideo.pause());
})();
