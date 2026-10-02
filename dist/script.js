(() => {
  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const stage = document.querySelector('.hero-stage');
  const backgroundVideo = document.querySelector('.hero__video');
  const heroImage = document.querySelector('.hero__background img');
  const preloader = document.querySelector('.preloader');

  const sleep = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));
  const imageReady = heroImage.decode ? heroImage.decode().catch(() => {}) : Promise.resolve();
  const fontReady = document.fonts ? document.fonts.ready.catch(() => {}) : Promise.resolve();
  const assetsReady = Promise.race([Promise.all([imageReady, fontReady]), sleep(4500)]);

  Promise.all([assetsReady, sleep(reducedMotion.matches ? 100 : 1900)]).then(() => {
    root.classList.add('is-ready');
    window.setTimeout(() => root.classList.add('is-revealed'), reducedMotion.matches ? 0 : 1050);
    window.setTimeout(() => preloader.remove(), reducedMotion.matches ? 100 : 1350);
  });

  let videoReady = false;
  let targetTime = 0;
  let frame = 0;
  let lastSeek = 0;

  function scrub(timestamp) {
    frame = 0;
    if (!videoReady || reducedMotion.matches || document.hidden || backgroundVideo.error) return;
    const difference = targetTime - backgroundVideo.currentTime;
    if (Math.abs(difference) < 0.035) return;

    if (!backgroundVideo.seeking && timestamp - lastSeek > 36) {
      backgroundVideo.currentTime = Math.max(0, Math.min(backgroundVideo.duration - 0.05,
        backgroundVideo.currentTime + difference * 0.32));
      lastSeek = timestamp;
    }
    frame = requestAnimationFrame(scrub);
  }

  function updateScrollVideo() {
    if (!videoReady || reducedMotion.matches) return;
    const travel = Math.max(1, stage.offsetHeight - window.innerHeight);
    const progress = Math.max(0, Math.min(1, -stage.getBoundingClientRect().top / travel));
    targetTime = progress * Math.max(0, backgroundVideo.duration - 0.05);
    root.classList.toggle('video-ready', progress > 0.005);
    if (!frame) frame = requestAnimationFrame(scrub);
  }

  backgroundVideo.addEventListener('loadeddata', () => {
    if (!Number.isFinite(backgroundVideo.duration) || backgroundVideo.duration <= 0) return;
    videoReady = true;
    backgroundVideo.pause();
    updateScrollVideo();
  }, { once: true });
  window.addEventListener('scroll', updateScrollVideo, { passive: true });
  window.addEventListener('resize', updateScrollVideo, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) updateScrollVideo();
  });
  backgroundVideo.load();

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
  const dialog = document.querySelector('.tour-dialog');
  const dialogVideo = dialog.querySelector('video');
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
