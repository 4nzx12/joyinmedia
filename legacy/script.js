/* ═══════════════════════════════════════════════
   JOYIN MEDIA — script.js
   ═══════════════════════════════════════════════ */

(function () {
  'use strict';

  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');

  /* ══════════════════════════════════════
     1. CUSTOM CURSOR (desktop only)
  ══════════════════════════════════════ */
  function isMobileDevice() {
    if (navigator.userAgentData && typeof navigator.userAgentData.mobile === 'boolean') {
      return navigator.userAgentData.mobile;
    }
    const ua = navigator.userAgent || '';
    const mobileRe = /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
    if (mobileRe.test(ua)) return true;
    if (window.matchMedia) {
      try {
        if (window.matchMedia('(pointer: coarse)').matches && !window.matchMedia('(pointer: fine)').matches) return true;
      } catch (e) {}
    }
    return false;
  }

  const isMobile = isMobileDevice();
  const dot   = document.getElementById('cursorDot');
  const glow  = document.getElementById('cursorGlow');

  if (!isMobile && dot && glow) {
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let glowX  = mouseX;
    let glowY  = mouseY;
    let cursorFrame = 0;
    let lastCursorTime = 0;
    const cursorEnabled = () => finePointerQuery.matches && !motionQuery.matches && !document.hidden;

    function animateCursor(time) {
      cursorFrame = 0;
      if (!cursorEnabled()) return;
      const elapsed = lastCursorTime ? Math.min(time - lastCursorTime, 50) : 16;
      lastCursorTime = time;
      const ease = 1 - Math.exp(-elapsed / 65);
      glowX += (mouseX - glowX) * ease;
      glowY += (mouseY - glowY) * ease;
      dot.style.translate = `${mouseX}px ${mouseY}px`;
      glow.style.translate = `${glowX}px ${glowY}px`;
      if (Math.abs(mouseX - glowX) + Math.abs(mouseY - glowY) > 0.15) {
        cursorFrame = requestAnimationFrame(animateCursor);
      } else {
        lastCursorTime = 0;
      }
    }

    document.addEventListener('pointermove', e => {
      if (!cursorEnabled() || e.pointerType === 'touch') return;
      document.documentElement.classList.add('custom-cursor');
      mouseX = e.clientX;
      mouseY = e.clientY;
      const interactive = !!e.target.closest('a, button, input, textarea, .cs-card, .t-logo');
      [dot, glow].forEach(el => el.classList.toggle('hover', interactive));
      if (!cursorFrame) cursorFrame = requestAnimationFrame(animateCursor);
    }, { passive: true });

    document.addEventListener('pointerdown', () => [dot, glow].forEach(el => el.classList.add('click')));
    document.addEventListener('pointerup', () => [dot, glow].forEach(el => el.classList.remove('click')));
    const hideCursor = () => {
      cancelAnimationFrame(cursorFrame);
      cursorFrame = 0;
      lastCursorTime = 0;
      document.documentElement.classList.remove('custom-cursor');
    };
    document.addEventListener('mouseleave', hideCursor);
    document.addEventListener('visibilitychange', hideCursor);
    motionQuery.addEventListener('change', hideCursor);
    finePointerQuery.addEventListener('change', hideCursor);
  }


  /* ══════════════════════════════════════
     2. THEME TOGGLE
  ══════════════════════════════════════ */
  const themeToggle = document.getElementById('themeToggle');
  const html        = document.documentElement;
  const videoBg     = document.getElementById('videoBg');
  const videoSrc    = document.getElementById('videoSrc');
  const videoPoster = document.getElementById('videoPoster');

  const LIGHT_VID = 'https://res.cloudinary.com/syfbjskp/video/upload/v1788697354/bg_vid_light.mp4';
  const DARK_VID  = 'https://res.cloudinary.com/syfbjskp/video/upload/v1788697349/bg_vid_dark.mp4';
  const LIGHT_POSTER = 'https://res.cloudinary.com/syfbjskp/video/upload/so_0/v1788697354/bg_vid_light.jpg';
  const DARK_POSTER = 'https://res.cloudinary.com/syfbjskp/video/upload/so_0/v1788697349/bg_vid_dark.jpg';
  let backgroundRetryTimer;
  let backgroundPauseRetried = false;

  function lockBackgroundVideo() {
    // Set properties as well as HTML attributes before every playback attempt.
    videoBg.defaultMuted = true;
    videoBg.muted = true;
    videoBg.playsInline = true;
    videoBg.autoplay = true;
    videoBg.loop = true;
    videoBg.controls = false;
    videoBg.disablePictureInPicture = true;
    videoBg.disableRemotePlayback = true;
  }

  function applyTheme(theme) {
    html.setAttribute('data-theme', theme);
    try { localStorage.setItem('jm-theme', theme); } catch (e) { /* Storage may be disabled. */ }
    const source = theme === 'dark' ? DARK_VID : LIGHT_VID;
    if (videoPoster) videoPoster.src = theme === 'dark' ? DARK_POSTER : LIGHT_POSTER;
    lockBackgroundVideo();
    backgroundPauseRetried = false;
    // Preserve playback already started by the HTML autoplay attribute.
    if (videoSrc.src !== source) {
      document.body.classList.remove('video-visible');
      videoSrc.src = source;
      videoBg.load();
    }
    syncBackgroundPlayback();
  }

  function syncBackgroundPlayback() {
    lockBackgroundVideo();
    if (document.hidden) {
      videoBg.pause();
      return;
    }
    if (!videoBg.paused) return;
    const playback = videoBg.play();
    playback?.catch(() => {
      // A device policy may require a gesture. Keep the matching still frame
      // visible and retry on normal interaction, without adding a play button.
      if (videoBg.paused) document.body.classList.remove('video-visible');
    });
  }
  document.addEventListener('visibilitychange', syncBackgroundPlayback);
  window.addEventListener('pageshow', syncBackgroundPlayback);
  window.addEventListener('focus', syncBackgroundPlayback);
  videoBg.addEventListener('loadeddata', syncBackgroundPlayback);
  videoBg.addEventListener('canplay', syncBackgroundPlayback);
  videoBg.addEventListener('playing', () => {
    clearTimeout(backgroundRetryTimer);
    backgroundPauseRetried = false;
    document.body.classList.add('video-visible');
  });
  videoBg.addEventListener('pause', () => {
    document.body.classList.remove('video-visible');
    if (document.hidden || backgroundPauseRetried) return;
    backgroundPauseRetried = true;
    clearTimeout(backgroundRetryTimer);
    backgroundRetryTimer = setTimeout(syncBackgroundPlayback, 200);
  });
  videoBg.addEventListener('error', () => document.body.classList.remove('video-visible'));
  ['touchend', 'click', 'keydown'].forEach(eventName => {
    document.addEventListener(eventName, syncBackgroundPlayback, { capture: true, passive: true });
  });

  let saved;
  try { saved = localStorage.getItem('jm-theme'); } catch (e) { /* Use the system theme. */ }
  const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(saved || (sysDark ? 'dark' : 'light'));

  themeToggle.addEventListener('click', () => {
    applyTheme(html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });

  /* ══════════════════════════════════════
     VIDEO REVEAL — content never waits for a media download
  ══════════════════════════════════════ */
  (function pageReveal() {
    document.body.classList.add('page-visible');
    if (!videoBg.paused && videoBg.readyState >= 3) document.body.classList.add('video-visible');
  })();


  /* ══════════════════════════════════════
     TRUST BAR DUPLICATION FOR INFINITE SCROLL
  ══════════════════════════════════════ */
  const trustInner = document.getElementById('trustInner');
  if (trustInner) {
    const originals = [...trustInner.children];
    originals.forEach(item => {
      const clone = item.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      clone.dataset.marqueeClone = '';
      trustInner.appendChild(clone);
    });
    let marqueeAnimation;
    let marqueeDuration = 1;
    let marqueeVisible = !('IntersectionObserver' in window);
    let marqueeHovered = false;
    const syncMarquee = () => {
      if (!marqueeAnimation) return;
      if (motionQuery.matches || document.hidden || !marqueeVisible || marqueeHovered) marqueeAnimation.pause();
      else marqueeAnimation.play();
    };
    function updateMarquee() {
      const progress = marqueeAnimation ? (Number(marqueeAnimation.currentTime || 0) % marqueeDuration) / marqueeDuration : 0;
      marqueeAnimation?.cancel();
      marqueeAnimation = null;
      if (motionQuery.matches || !trustInner.animate) return;
      // Include the gap between the two copies so the loop has no jump.
      const gap = parseFloat(getComputedStyle(trustInner).columnGap) || 0;
      const distance = originals.reduce((sum, item) => sum + item.getBoundingClientRect().width + gap, 0);
      if (!distance) return;
      marqueeDuration = distance / 36 * 1000;
      marqueeAnimation = trustInner.animate([
        { transform: 'translate3d(0, 0, 0)' },
        { transform: `translate3d(-${distance}px, 0, 0)` }
      ], { duration: marqueeDuration, iterations: Infinity, easing: 'linear' });
      marqueeAnimation.currentTime = progress * marqueeDuration;
      syncMarquee();
    }
    trustInner.addEventListener('pointerenter', event => { marqueeHovered = event.pointerType !== 'touch'; syncMarquee(); });
    trustInner.addEventListener('pointerleave', () => { marqueeHovered = false; syncMarquee(); });
    document.addEventListener('visibilitychange', syncMarquee);
    motionQuery.addEventListener('change', updateMarquee);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(entries => {
        marqueeVisible = entries[0].isIntersecting;
        syncMarquee();
      }).observe(trustInner.closest('.trust-section'));
    }
    if ('ResizeObserver' in window) new ResizeObserver(updateMarquee).observe(trustInner.parentElement);
    else window.addEventListener('resize', updateMarquee, { passive: true });
    updateMarquee();
  }


  /* ══════════════════════════════════════
     3. SMOOTH NAVIGATION
  ══════════════════════════════════════ */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const hash = a.getAttribute('href');
      const target = document.getElementById(hash.slice(1));
      if (!target) return;
      e.preventDefault();
      // Keep normal browser scrolling, touch gestures, and keyboard control.
      target.scrollIntoView({ behavior: motionQuery.matches ? 'instant' : 'smooth', block: 'start' });
      if (window.location.hash !== hash) history.pushState(null, '', hash);
      if (!target.hasAttribute('tabindex')) {
        target.setAttribute('tabindex', '-1');
        target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
      }
      target.focus({ preventScroll: true });
    });
  });


  /* ══════════════════════════════════════
     4. SCROLL DEPTH, READING PROGRESS & NAVIGATION
  ══════════════════════════════════════ */
  const navbar = document.getElementById('navbar');
  const hero = document.querySelector('.hero');
  const navSections = [...document.querySelectorAll('.nav-link')].map(link => ({
    link, section: document.getElementById(link.hash.slice(1)), top: 0
  })).filter(item => item.section);
  let sceneFrame = 0;
  let pageRange = 1;
  let heroHeight = window.innerHeight;
  function paintScrollScene() {
    sceneFrame = 0;
    const scroll = Math.max(0, window.scrollY);
    html.style.setProperty('--scroll-progress', Math.min(1, scroll / pageRange).toFixed(4));
    navbar.classList.toggle('is-scrolled', scroll > 60);
    const drift = !motionQuery.matches && finePointerQuery.matches ? Math.min(scroll, heroHeight) * 0.065 : 0;
    hero.style.setProperty('--hero-drift', `${drift.toFixed(2)}px`);
    const active = [...navSections].reverse().find(item => item.top <= scroll + window.innerHeight * 0.35);
    navSections.forEach(item => {
      item.link.classList.toggle('is-current', item === active);
      if (item === active) item.link.setAttribute('aria-current', 'location');
      else item.link.removeAttribute('aria-current');
    });
  }
  function queueScrollScene() {
    if (!sceneFrame) sceneFrame = requestAnimationFrame(paintScrollScene);
  }
  function measureScrollScene() {
    pageRange = Math.max(1, html.scrollHeight - window.innerHeight);
    heroHeight = hero.offsetHeight;
    navSections.forEach(item => { item.top = item.section.getBoundingClientRect().top + window.scrollY; });
    queueScrollScene();
  }
  window.addEventListener('scroll', queueScrollScene, { passive: true });
  window.addEventListener('resize', measureScrollScene, { passive: true });
  window.addEventListener('load', measureScrollScene, { once: true });
  motionQuery.addEventListener('change', queueScrollScene);
  finePointerQuery.addEventListener('change', queueScrollScene);
  if ('ResizeObserver' in window) new ResizeObserver(measureScrollScene).observe(document.body);
  measureScrollScene();


  /* ══════════════════════════════════════
     5. STAGGERED REVEALS — independent of each component's hover transform
  ══════════════════════════════════════ */
  (function setupReveals() {
    const revealGroups = [
      ['.hero-logo, .hero-title, .hero-sub, .hero-stats, .hero-cta', 90],
      ['.trust-label, .trust-outer', 100],
      ['.timeline-header > *', 85],
      ['.services-section > .section-label, .services-section > .section-title', 85],
      ['.package-card', 130],
      ['.featured-section > .section-label, .featured-section > .section-title, .cs-carousel', 100],
      ['.about-section > .section-label, .about-section > .section-title, .about-intro', 100],
      ['.client-proof-section > .section-label, .client-proof-section > .section-title, .logo-row, .proof-layout', 90],
      ['.contact-section > .section-label, .contact-section > .section-title, .contact-form-wrap', 100],
      ['.contact-info > .contact-card', 90],
      ['.footer-invitation > *, .footer-top > *, .footer-bottom', 75]
    ];
    const pending = new Set();
    const animations = new Set();
    if (!('IntersectionObserver' in window) || !Element.prototype.animate || motionQuery.matches) return;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) reveal(entry.target);
      });
    }, { threshold: 0, rootMargin: '0px 0px -6% 0px' });

    function reveal(element, immediate = false) {
      if (!pending.has(element)) return;
      observer.unobserve(element);
      pending.delete(element);
      element.removeAttribute('data-motion-pending');
      if (motionQuery.matches || immediate) return;
      const animation = element.animate([
        { opacity: 0, translate: '0 28px' },
        { opacity: 1, translate: '0 0' }
      ], {
        duration: element.matches('.hero-logo, .hero-title') ? 1100 : 850,
        delay: Number(element.dataset.motionDelay),
        easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
        fill: 'backwards'
      });
      animations.add(animation);
      animation.finished.then(() => animations.delete(animation)).catch(() => animations.delete(animation));
    }

    revealGroups.forEach(([selector, stagger]) => {
      document.querySelectorAll(selector).forEach((element, index) => {
        // Content above a restored scroll position should already be settled.
        if (element.getBoundingClientRect().bottom < 0) return;
        element.dataset.motionDelay = String(Math.min(index * stagger, 300));
        element.setAttribute('data-motion-pending', '');
        pending.add(element);
        observer.observe(element);
      });
    });
    document.addEventListener('focusin', event => {
      [...pending].forEach(element => {
        if (element === event.target || element.contains(event.target) || event.target.contains(element)) reveal(element, true);
      });
    });
    motionQuery.addEventListener('change', () => {
      if (!motionQuery.matches) return;
      [...pending].forEach(element => reveal(element, true));
      animations.forEach(animation => animation.cancel());
      animations.clear();
    });
  })();


  /* ══════════════════════════════════════
     6. CLIENT PROOF ROTATION
  ══════════════════════════════════════ */
  const randomHeights = (count = 7) => Array.from({ length: count }, () => 30 + Math.random() * 70);

  const clientStories = [
    {
      logo: 'https://res.cloudinary.com/syfbjskp/image/upload/v1788694833/aabis_chai.png',
      name: 'Aabis Chai',
      company: 'Tea Snacks Cafe',
      quote: 'Joyin didn\'t just handle our social media. They understood what our business needed and turned it into content that actually represented us.',
      mainMetric: '1.67M+ Reach',
      secondaryOne: '80K+ Engagements',
      secondaryTwo: '45% Sales Lift',
      ringValue: '45%',
      visualHeights: randomHeights()
    },
    {
      logo: 'https://res.cloudinary.com/syfbjskp/image/upload/v1788694832/waiver.png',
      name: 'Waiver',
      company: 'Chauffeur Service',
      quote: 'The biggest difference was the way they approached our brand. They brought ideas, strategy and execution together instead of just creating posts.',
      mainMetric: '1M+ Reach',
      secondaryOne: '27K+ Engagements',
      secondaryTwo: '62% Sales Lift',
      ringValue: '62%',
      visualHeights: randomHeights()
    },
    {
      logo: 'https://res.cloudinary.com/syfbjskp/image/upload/v1788694833/beside.png',
      name: 'BESIDE',
      company: 'Educational Service',
      quote: 'Working with Joyin gave us a clear direction. We finally knew what we were communicating, who we were targeting and why we were doing it.',
      mainMetric: '400K+ Reach',
      secondaryOne: '18K+ Engagements',
      secondaryTwo: '39% Sales Lift',
      ringValue: '39%',
      visualHeights: randomHeights()
    }
  ];

  const clientButtons = Array.from(document.querySelectorAll('.client-logo'));
  const clientBrand = document.querySelector('.client-logo-image');
  const clientQuote = document.querySelector('.client-quote');
  const clientName = document.querySelector('.testimonial-name');
  const clientCompany = document.querySelector('.testimonial-company');
  const clientMainMetric = document.querySelector('.client-main-metric');
  const clientMiniOne = document.querySelector('.client-mini-one');
  const clientMiniTwo = document.querySelector('.client-mini-two');
  const clientMiniRing = document.querySelector('.client-mini-ring');
  const clientVisualBars = Array.from(document.querySelectorAll('.visual-bars span'));
  const clientProofSection = document.querySelector('.client-proof-section');
  const rotatingStoryEls = document.querySelectorAll('.client-story');
  let activeClientIndex = 0;
  let requestedClientIndex = 0;
  let rotationTimer = null;
  let clientSwapTimer = null;
  let clientInView = false;
  let clientHovered = false;

  function setActiveLogo(index) {
    clientButtons.forEach((button, buttonIndex) => {
      const isActive = buttonIndex === index;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  }

  function renderClient(index) {
    const client = clientStories[index];
    if (!client) return;

    clientBrand.src = client.logo;
    clientBrand.alt = client.name;
    clientQuote.textContent = client.quote;
    clientName.textContent = client.name;
    clientCompany.textContent = client.company;
    clientMainMetric.textContent = client.mainMetric;
    clientMiniOne.textContent = client.secondaryOne;
    clientMiniTwo.textContent = client.secondaryTwo;
    clientMiniRing.textContent = client.ringValue;

    clientVisualBars.forEach((bar, barIndex) => {
      const height = client.visualHeights[barIndex] ?? 50;
      bar.style.setProperty('--bar-height', `${height}%`);
    });

    setActiveLogo(index);
  }

  function stopRotation() {
    if (rotationTimer) {
      clearTimeout(rotationTimer);
      rotationTimer = null;
    }
  }

  function startRotation() {
    stopRotation();
    if (!clientInView || clientHovered || document.hidden || motionQuery.matches ||
        clientProofSection?.contains(document.activeElement) || clientSwapTimer) return;
    rotationTimer = setTimeout(() => {
      const nextIndex = (activeClientIndex + 1) % clientStories.length;
      fadeToClient(nextIndex);
    }, 6500);
  }

  function fadeToClient(nextIndex) {
    if (!clientStories[nextIndex]) return;
    stopRotation();
    clearTimeout(clientSwapTimer);
    clientSwapTimer = null;
    requestedClientIndex = nextIndex;
    setActiveLogo(nextIndex);

    if (motionQuery.matches) {
      activeClientIndex = nextIndex;
      renderClient(activeClientIndex);
      rotatingStoryEls.forEach(el => el.classList.remove('is-fading'));
      startRotation();
      return;
    }

    rotatingStoryEls.forEach(el => el.classList.add('is-fading'));
    clientSwapTimer = setTimeout(() => {
      clientSwapTimer = null;
      activeClientIndex = nextIndex;
      renderClient(activeClientIndex);
      rotatingStoryEls.forEach(el => el.classList.remove('is-fading'));
      startRotation();
    }, 180);
  }

  clientButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.clientIndex);
      if (Number.isNaN(index) || index === requestedClientIndex) return;
      fadeToClient(index);
    });
  });

  if (clientProofSection) {
    clientProofSection.addEventListener('mouseenter', () => {
      clientHovered = true;
      stopRotation();
    });
    clientProofSection.addEventListener('mouseleave', () => {
      clientHovered = false;
      startRotation();
    });
    clientProofSection.addEventListener('focusin', stopRotation);
    clientProofSection.addEventListener('focusout', () => {
      requestAnimationFrame(startRotation);
    });
    if (typeof IntersectionObserver === 'function') {
      new IntersectionObserver(entries => {
        clientInView = entries[0].isIntersecting;
        startRotation();
      }, { threshold: 0.12 }).observe(clientProofSection);
    }
  }

  renderClient(activeClientIndex);
  document.addEventListener('visibilitychange', startRotation);
  motionQuery.addEventListener('change', () => {
    if (motionQuery.matches && clientSwapTimer) fadeToClient(requestedClientIndex);
    startRotation();
  });

  /* ══════════════════════════════════════
     7. FEATURED WORK CAROUSEL
  ══════════════════════════════════════ */
  const featuredStage = document.getElementById('featuredStage');
  const featuredDots = document.getElementById('featuredDots');
  const prevBtn = document.querySelector('.cs-prev');
  const nextBtn = document.querySelector('.cs-next');
  let activeSlide = 0;

  function setActiveSlide(index) {
    if (!featuredStage || !projectsData.length) return;
    activeSlide = (index + projectsData.length) % projectsData.length;
    updateCarouselCards();
    syncCarouselMedia();
    startAutoRotate();
  }

  /* ══════════════════════════════════════
     FEATURED WORK CAROUSEL — Premium Edition
  ══════════════════════════════════════ */
  const projectsData = [
    { type: 'video', title: 'Onam', category: 'Festival Content', src: 'https://res.cloudinary.com/syfbjskp/video/upload/v1788701065/onam_out.mp4', accent: '#ff8c42' },
    { type: 'video', title: 'Chai Girl', category: 'Brand Presentation', src: 'https://res.cloudinary.com/syfbjskp/video/upload/v1788701071/Chai_girll_tea_presentation_1.mp4', accent: '#ff6b00' },
    { type: 'video', title: 'Boy and Friend', category: 'Social Content', src: 'https://res.cloudinary.com/syfbjskp/video/upload/v1788701074/boy_and_friend_1_1.mp4', accent: '#ff8c42' },
    { type: 'video', title: 'Disabled', category: 'Social Awareness', src: 'https://res.cloudinary.com/syfbjskp/video/upload/v1788701074/disabled_1.mp4', accent: '#ff6b00' },
    { type: 'video', title: 'Aabis Chai', category: 'Brand Content', src: 'https://res.cloudinary.com/syfbjskp/video/upload/v1788701075/aabis_chai_video_1_1.mp4', accent: '#ff8c42' },
    { type: 'video', title: 'Troll Video', category: 'Comedy Edit', src: 'https://res.cloudinary.com/syfbjskp/video/upload/v1788701076/Troll_video_1.mp4', accent: '#ff6b00' },
    { type: 'video', title: 'Making Video', category: 'Behind the Scenes', src: 'https://res.cloudinary.com/syfbjskp/video/upload/v1788701078/making_video_2_1.mp4', accent: '#ff8c42' }
  ];

  let autoRotateTimeout;
  let carouselInView = false;
  let carouselHovered = false;
  let pointerId = null;
  let isDragging = false;
  let dragStart = 0;
  let dragStartY = 0;
  let dragOffset = 0;
  let dragFrame = 0;
  let suppressClickUntil = 0;
  let fullscreenReturnFocus = null;
  let fullscreenOverflow = '';
  let fullscreenIndex = 0;
  const carousel = document.querySelector('.cs-carousel');
  const progressEl = document.getElementById('csProgress');

  function syncCarouselMedia() {
    const canPlay = carouselInView && !document.hidden && !motionQuery.matches &&
      !document.querySelector('.cs-fullscreen');
    featuredStage?.querySelectorAll('video').forEach((video, index) => {
      if (canPlay && index === activeSlide) {
        if (video.paused) video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }

  function updateCarouselCards() {
    if (!featuredStage) return;
    const cards = featuredStage.querySelectorAll('.cs-card');
    const totalCards = cards.length;
    const isMobile = window.matchMedia('(max-width: 700px)').matches;
    const cardSpacing = isMobile ? 260 : 380;
    const cardWidth = isMobile ? Math.min(240, window.innerWidth - 88) : 280;

    cards.forEach((card, i) => {
      const offset = ((i - activeSlide) % totalCards + totalCards) % totalCards;
      let distanceFromCenter = offset;
      if (distanceFromCenter > totalCards / 2) distanceFromCenter -= totalCards;

      const absDistance = Math.abs(distanceFromCenter);
      let scale = 1 - absDistance * 0.14;
      let blur = absDistance * 1.25;
      let opacity = absDistance === 0 ? 1 : 0.85 - absDistance * 0.25;
      let rotateY = distanceFromCenter * 22;
      let translateZ = -absDistance * 80;
      let zIndex = 10 - absDistance;
      let boxShadowOpacity = Math.max(0.1, 0.4 - absDistance * 0.08);

      scale = Math.max(0.45, Math.min(1.05, scale));
      // Keep the farthest cards invisible as they wrap to the opposite side.
      opacity = absDistance > 2 ? 0 : Math.max(0.2, Math.min(1, opacity));
      blur = Math.min(blur, 3);

      // Spread cards horizontally with distance-based positioning, centered on active card
      const horizontalSpread = distanceFromCenter * cardSpacing;

      card.style.width = `${cardWidth}px`;
      card.style.left = '50%';
      card.style.transform = `translateX(calc(-50% + ${horizontalSpread}px + ${dragOffset}px)) scale(${scale}) rotateY(${rotateY}deg) translateZ(${translateZ}px)`;
      card.style.filter = `blur(${blur}px)`;
      card.style.opacity = opacity;
      card.style.pointerEvents = absDistance > 2 ? 'none' : '';
      card.style.zIndex = Math.floor(zIndex);
      card.style.boxShadow = `0 ${20 + absDistance * 10}px ${40 + absDistance * 20}px rgba(0,0,0,${boxShadowOpacity}), 0 0 ${50 + absDistance * 20}px rgba(255,107,0,${Math.max(0, 0.08 - absDistance * 0.02)})`;

      card.classList.toggle('is-active', i === activeSlide);
      card.tabIndex = i === activeSlide ? 0 : -1;
    });

    // Keep the same progress nodes so their CSS transition can interpolate.
    if (progressEl) {
      const number = progressEl.querySelector('.cs-progress-num');
      const fill = progressEl.querySelector('.cs-progress-fill');
      if (number) number.textContent = String(activeSlide + 1).padStart(2, '0');
      if (fill) fill.style.width = `${((activeSlide + 1) / totalCards) * 100}%`;
    }

    // Update dots
    Array.from(featuredDots.children).forEach((dot, i) => {
      dot.classList.toggle('active', i === activeSlide);
      dot.setAttribute('aria-current', i === activeSlide ? 'true' : 'false');
    });
  }

  function pauseAutoRotate() {
    clearTimeout(autoRotateTimeout);
  }

  function startAutoRotate() {
    pauseAutoRotate();
    if (!carouselInView || carouselHovered || pointerId !== null || document.hidden ||
        motionQuery.matches || carousel?.contains(document.activeElement) ||
        document.querySelector('.cs-fullscreen')) return;
    autoRotateTimeout = setTimeout(() => {
      setActiveSlide(activeSlide + 1);
    }, 6500);
  }

  function buildCarousel() {
    if (!featuredStage || !featuredDots) return;

    featuredStage.innerHTML = '';
    featuredDots.innerHTML = '';
    if (progressEl) {
      progressEl.innerHTML = `<span class="cs-progress-num">01</span><div class="cs-progress-bar"><div class="cs-progress-fill" style="width: 0%"></div></div><span class="cs-progress-num">${String(projectsData.length).padStart(2, '0')}</span>`;
    }

    projectsData.forEach((project, index) => {
      const card = document.createElement('article');
      card.className = 'cs-card';
      card.setAttribute('role', 'button');
      card.setAttribute('aria-label', `${project.title} – ${project.category}`);
      card.setAttribute('data-project-index', index);
      card.setAttribute('data-accent', project.accent);

      const mediaWrap = document.createElement('div');
      mediaWrap.className = 'cs-media';

      const media = document.createElement(project.type === 'embed' ? 'iframe' : 'video');
      media.src = project.src;
      media.className = project.type === 'embed' ? 'cs-embed' : 'cs-vid';

      if (project.type === 'embed') {
        media.setAttribute('title', project.title);
        media.setAttribute('frameborder', '0');
        media.setAttribute('allow', 'autoplay; fullscreen');
        media.setAttribute('allowfullscreen', '');
      } else {
        media.loop = true;
        media.muted = true;
        media.playsInline = true;
        media.preload = 'metadata';
      }

      mediaWrap.appendChild(media);

      const glassOverlay = document.createElement('div');
      glassOverlay.className = 'cs-glass-overlay';

      card.appendChild(mediaWrap);
      card.appendChild(glassOverlay);
      featuredStage.appendChild(card);

      card.addEventListener('click', (event) => {
        if (performance.now() < suppressClickUntil) {
          event.preventDefault();
          return;
        }
        openFullscreen(index);
      });
      card.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openFullscreen(index);
        }
      });

      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'cs-dot';
      dot.setAttribute('aria-label', `Go to ${project.title}`);
      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        setActiveSlide(index);
      });
      featuredDots.appendChild(dot);
    });

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        setActiveSlide(activeSlide - 1);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        setActiveSlide(activeSlide + 1);
      });
    }

    // Drag/swipe interaction
    const viewport = document.querySelector('.cs-viewport');
    if (viewport) {
      viewport.addEventListener('pointerdown', (e) => {
        if (!e.isPrimary || e.button !== 0) return;
        pointerId = e.pointerId;
        dragStart = e.clientX;
        dragStartY = e.clientY;
        dragOffset = 0;
        pauseAutoRotate();
      });

      document.addEventListener('pointermove', (e) => {
        if (e.pointerId !== pointerId) return;
        const deltaX = e.clientX - dragStart;
        const deltaY = e.clientY - dragStartY;
        if (!isDragging) {
          if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 8) {
            pointerId = null;
            startAutoRotate();
            return;
          }
          if (Math.abs(deltaX) < 8) return;
          isDragging = true;
          viewport.classList.add('is-dragging');
          viewport.setPointerCapture(e.pointerId);
        }
        dragOffset = deltaX * 0.8;
        if (!dragFrame) {
          dragFrame = requestAnimationFrame(() => {
            dragFrame = 0;
            updateCarouselCards();
          });
        }
      }, { passive: true });

      const finishDrag = (e) => {
        if (e.pointerId !== pointerId) return;
        const dragged = isDragging;
        const nextIndex = activeSlide + (dragOffset > 0 ? -1 : 1);
        const shouldAdvance = dragged && e.type !== 'pointercancel' && Math.abs(dragOffset) > 42;
        pointerId = null;
        isDragging = false;
        if (dragged) {
          suppressClickUntil = performance.now() + 350;
          viewport.classList.remove('is-dragging');
        }
        if (viewport.hasPointerCapture(e.pointerId)) viewport.releasePointerCapture(e.pointerId);
        cancelAnimationFrame(dragFrame);
        dragFrame = 0;
        dragOffset = 0;
        if (dragged) setActiveSlide(shouldAdvance ? nextIndex : activeSlide);
        else startAutoRotate();
      };
      document.addEventListener('pointerup', finishDrag);
      document.addEventListener('pointercancel', finishDrag);
    }

    // Only handle carousel keys while a carousel control has focus.
    carousel?.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setActiveSlide(activeSlide - 1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setActiveSlide(activeSlide + 1);
      }
      if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && e.target.classList.contains('cs-card')) {
        featuredStage.querySelector('.cs-card.is-active')?.focus({ preventScroll: true });
      }
    });

    if (carousel) {
      carousel.addEventListener('mouseenter', () => {
        carouselHovered = true;
        pauseAutoRotate();
      });
      carousel.addEventListener('mouseleave', () => {
        carouselHovered = false;
        startAutoRotate();
      });
      carousel.addEventListener('focusin', pauseAutoRotate);
      carousel.addEventListener('focusout', () => requestAnimationFrame(startAutoRotate));
      if (typeof IntersectionObserver === 'function') {
        new IntersectionObserver(entries => {
          carouselInView = entries[0].isIntersecting;
          syncCarouselMedia();
          startAutoRotate();
        }, { threshold: 0.15 }).observe(carousel);
      }
    }
    document.addEventListener('visibilitychange', () => {
      syncCarouselMedia();
      startAutoRotate();
    });
    motionQuery.addEventListener('change', () => {
      syncCarouselMedia();
      startAutoRotate();
    });
    let carouselResizeFrame = 0;
    window.addEventListener('resize', () => {
      cancelAnimationFrame(carouselResizeFrame);
      carouselResizeFrame = requestAnimationFrame(updateCarouselCards);
    }, { passive: true });

    updateCarouselCards();
  }

  function openFullscreen(index) {
    const project = projectsData[index];
    if (!project) return;

    const existingModal = document.querySelector('.cs-fullscreen');
    if (existingModal) {
      if (!existingModal.classList.contains('is-closing')) renderFullscreenProject(existingModal, index);
      return;
    }

    fullscreenReturnFocus = document.activeElement;
    fullscreenOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    pauseAutoRotate();
    const modal = document.createElement('div');
    modal.className = 'cs-fullscreen';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.innerHTML = `
      <div class="cs-fullscreen-wrap">
        <button class="cs-fullscreen-close" type="button" aria-label="Close">×</button>
        <button class="cs-fullscreen-prev" type="button" aria-label="Previous">←</button>
        <button class="cs-fullscreen-next" type="button" aria-label="Next">→</button>
        <div class="cs-fullscreen-media"></div>
      </div>
    `;

    document.body.appendChild(modal);
    renderFullscreenProject(modal, index);
    syncCarouselMedia();

    modal.querySelector('.cs-fullscreen-close').addEventListener('click', closeFullscreen);
    modal.querySelector('.cs-fullscreen-prev').addEventListener('click', () => {
      openFullscreen((fullscreenIndex - 1 + projectsData.length) % projectsData.length);
    });
    modal.querySelector('.cs-fullscreen-next').addEventListener('click', () => {
      openFullscreen((fullscreenIndex + 1) % projectsData.length);
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeFullscreen();
    });
    modal.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeFullscreen();
      } else if (e.key === 'Tab') {
        const controls = Array.from(modal.querySelectorAll('button, video[controls], iframe'));
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      } else if (e.target.tagName !== 'VIDEO' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        e.preventDefault();
        openFullscreen((fullscreenIndex + (e.key === 'ArrowLeft' ? -1 : 1) + projectsData.length) % projectsData.length);
      }
    });
    modal.querySelector('.cs-fullscreen-close').focus({ preventScroll: true });
  }

  function renderFullscreenProject(modal, index) {
    const project = projectsData[index];
    fullscreenIndex = index;
    modal.setAttribute('aria-label', `${project.title} — ${project.category}`);
    const mediaContainer = modal.querySelector('.cs-fullscreen-media');
    mediaContainer.querySelector('video')?.pause();
    mediaContainer.innerHTML = project.type === 'embed'
      ? `<iframe src="${project.src}" title="${project.title}" frameborder="0" allow="autoplay; fullscreen" allowfullscreen></iframe>`
      : `<video src="${project.src}" controls autoplay loop muted playsinline></video>`;
    if (!motionQuery.matches && typeof mediaContainer.animate === 'function') {
      mediaContainer.animate([
        { opacity: 0, transform: 'translateY(8px) scale(0.985)' },
        { opacity: 1, transform: 'translateY(0) scale(1)' }
      ], { duration: 420, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
    }
  }

  function closeFullscreen() {
    const modal = document.querySelector('.cs-fullscreen');
    if (!modal || modal.classList.contains('is-closing')) return;
    modal.classList.add('is-closing');
    modal.querySelector('video')?.pause();
    const finishClose = () => {
      modal.remove();
      document.body.style.overflow = fullscreenOverflow;
      if (fullscreenReturnFocus?.isConnected) fullscreenReturnFocus.focus({ preventScroll: true });
      syncCarouselMedia();
      startAutoRotate();
    };
    if (motionQuery.matches || typeof modal.animate !== 'function') finishClose();
    else modal.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: 180,
      easing: 'ease-out',
      fill: 'forwards'
    }).finished.then(finishClose, finishClose);
  }

  buildCarousel();



  /* ══════════════════════════════════════
     8. PACKAGE CARD 3D TILT
  ══════════════════════════════════════ */
  document.querySelectorAll('.package-card').forEach(card => {
    let tiltFrame = 0;
    let tiltBounds;
    let tiltX = 0;
    let tiltY = 0;
    card.addEventListener('pointerenter', () => { tiltBounds = card.getBoundingClientRect(); });
    card.addEventListener('pointermove', (event) => {
      if (motionQuery.matches || !finePointerQuery.matches || event.pointerType === 'touch') return;
      const rect = tiltBounds || card.getBoundingClientRect();
      tiltY = Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width - 0.5)) * 4;
      tiltX = Math.max(-1, Math.min(1, 0.5 - (event.clientY - rect.top) / rect.height)) * 4;
      if (tiltFrame) return;
      tiltFrame = requestAnimationFrame(() => {
        tiltFrame = 0;
        card.style.setProperty('--tilt-x', `${tiltX}deg`);
        card.style.setProperty('--tilt-y', `${tiltY}deg`);
        card.classList.add('is-tilting');
      });
    }, { passive: true });

    const resetTilt = () => {
      cancelAnimationFrame(tiltFrame);
      tiltFrame = 0;
      tiltBounds = null;
      card.style.setProperty('--tilt-x', '0deg');
      card.style.setProperty('--tilt-y', '0deg');
      card.classList.remove('is-tilting');
    };
    card.addEventListener('pointerleave', resetTilt);
    card.addEventListener('pointercancel', resetTilt);
    motionQuery.addEventListener('change', resetTilt);
    finePointerQuery.addEventListener('change', resetTilt);

    card.addEventListener('click', () => {
      const isOpen = card.classList.contains('is-open');
      document.querySelectorAll('.package-card').forEach(item => {
        item.classList.remove('is-open');
        item.setAttribute('aria-expanded', 'false');
        item.querySelector('.package-card__details')?.setAttribute('aria-hidden', 'true');
      });
      if (!isOpen) {
        card.classList.add('is-open');
        card.setAttribute('aria-expanded', 'true');
        card.querySelector('.package-card__details')?.setAttribute('aria-hidden', 'false');
      }
    });
  });


  /* ══════════════════════════════════════
     8. CONTACT FORM — WhatsApp & Email
  ══════════════════════════════════════ */
  const contactConfig = {
    email: 'joyinmediahouse@gmail.com',
    whatsapp: '+91 7736700496',
    instagram: 'https://www.instagram.com/joyinmediahouse/',
    office: 'https://maps.app.goo.gl/qiC4VHdL4EsD3Nyu9'
  };

  function getFormData() {
    const name = (document.getElementById('cf-name')?.value || '').trim();
    const phone = (document.getElementById('cf-phone')?.value || '').trim();
    const message = (document.getElementById('cf-message')?.value || '').trim();
    return { name, phone, message };
  }

  function setFieldError(fieldName, message) {
    const errorEl = document.querySelector(`[data-error-for="${fieldName}"]`);
    if (!errorEl) return;
    errorEl.textContent = message || '';
  }

  function showSuccess(message) {
    const successEl = document.getElementById('formSuccess');
    if (!successEl) return;
    successEl.textContent = message;
    successEl.classList.add('show');

    clearTimeout(showSuccess.timeoutId);
    showSuccess.timeoutId = setTimeout(() => {
      successEl.classList.remove('show');
      successEl.textContent = '';
    }, 2600);
  }

  function validatePhone(phone) {
    const digits = phone.replace(/\D/g, '');
    return digits.length >= 10;
  }

  function validateForm() {
    const { name, phone, message } = getFormData();
    let isValid = true;

    if (!name) {
      setFieldError('name', 'Please enter your name.');
      isValid = false;
    } else {
      setFieldError('name', '');
    }

    if (!phone) {
      setFieldError('phone', 'Please enter your phone number.');
      isValid = false;
    } else if (!validatePhone(phone)) {
      setFieldError('phone', 'Please enter a valid phone number.');
      isValid = false;
    } else {
      setFieldError('phone', '');
    }

    if (!message) {
      setFieldError('message', 'Please tell us a little about what you need.');
      isValid = false;
    } else if (message.length < 10) {
      setFieldError('message', 'Please share a bit more detail.');
      isValid = false;
    } else {
      setFieldError('message', '');
    }

    return isValid;
  }

  function buildEmailBody({ name, phone, message }) {
    return [
      'Hi Joyin Media,',
      '',
      `Name: ${name}`,
      `Phone: ${phone}`,
      '',
      'How can we help?',
      message,
      '',
      'Looking forward to hearing from you.'
    ].join('\n');
  }

  function buildWhatsAppMessage({ name, phone, message }) {
    return [
      'New website enquiry',
      '',
      `Name: ${name}`,
      `Phone: ${phone}`,
      '',
      'Request:',
      message
    ].join('\n');
  }

  function sendEmail() {
    const formData = getFormData();
    if (!validateForm()) return;

    const subject = `New website enquiry — ${formData.name}`;
    const mailUrl = `mailto:${contactConfig.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(buildEmailBody(formData))}`;
    window.location.href = mailUrl;
    showSuccess('Your enquiry is ready to send.');
  }

  function sendWhatsApp() {
    const formData = getFormData();
    if (!validateForm()) return;

    const cleanNumber = contactConfig.whatsapp.replace(/\D/g, '') || '917736700496';
    const message = encodeURIComponent(buildWhatsAppMessage(formData));
    window.open(`https://wa.me/${cleanNumber}?text=${message}`, '_blank');
    showSuccess('Your WhatsApp message is ready to send.');
  }

  const sendEmailBtn = document.getElementById('sendEmail');
  const sendWhatsAppBtn = document.getElementById('sendWhatsApp');

  if (sendEmailBtn) {
    sendEmailBtn.addEventListener('click', sendEmail);
  }

  if (sendWhatsAppBtn) {
    sendWhatsAppBtn.addEventListener('click', sendWhatsApp);
  }

  const contactCards = document.querySelectorAll('.contact-card');
  const contactCardConfig = [
    { selector: '.contact-card:nth-child(1)', href: `mailto:${contactConfig.email}` },
    { selector: '.contact-card:nth-child(2)', href: `https://wa.me/${(contactConfig.whatsapp.replace(/\D/g, '') || '917736700496')}` },
    { selector: '.contact-card:nth-child(3)', href: contactConfig.instagram },
    { selector: '.contact-card:nth-child(4)', href: contactConfig.office }
  ];

  contactCardConfig.forEach(({ selector, href }) => {
    const card = document.querySelector(selector);
    if (card && href) {
      card.setAttribute('href', href);
    }
  });

  /* ══════════════════════════════════════
     9. HORIZONTAL PROCESS TIMELINE
     REVEAL EACH STEP IN SEQUENCE WITH WAVY LINE
  ══════════════════════════════════════ */
  const timelineItems = [...document.querySelectorAll('.timeline-item')];
  const timelineContainer = document.querySelector('.timeline-container');

  if (timelineItems.length && timelineContainer) {
    let animationTriggered = false;
    let timelineFrame = 0;

    const revealTimeline = () => {
      timelineFrame = 0;
      if (motionQuery.matches) {
        timelineContainer.classList.add('active');
        timelineItems.forEach(item => item.classList.add('active'));
        stopWatchingTimeline();
        return;
      }
      const rect = timelineContainer.getBoundingClientRect();
      const containerInView = rect.top < window.innerHeight * 0.9 && rect.bottom > window.innerHeight * 0.1;
      
      // Trigger animation only once when container comes into view
      if (containerInView && !animationTriggered) {
        timelineContainer.classList.add('active');
        animationTriggered = true;
      }
      
      // Show milestone dots immediately
      timelineItems.forEach(item => {
        if (item.classList.contains('active')) return;
        const itemRect = item.getBoundingClientRect();
        const visible = itemRect.top < window.innerHeight * 0.82 && itemRect.bottom > window.innerHeight * 0.18;
        
        if (visible) {
          item.classList.add('active');
        }
      });
      if (animationTriggered && timelineItems.every(item => item.classList.contains('active'))) stopWatchingTimeline();
    };

    const queueTimeline = () => {
      if (!timelineFrame) timelineFrame = requestAnimationFrame(revealTimeline);
    };
    function stopWatchingTimeline() {
      window.removeEventListener('scroll', queueTimeline);
      window.removeEventListener('resize', queueTimeline);
      motionQuery.removeEventListener('change', queueTimeline);
      cancelAnimationFrame(timelineFrame);
      timelineFrame = 0;
    }
    window.addEventListener('scroll', queueTimeline, { passive: true });
    window.addEventListener('resize', queueTimeline, { passive: true });
    motionQuery.addEventListener('change', queueTimeline);
    revealTimeline();
  }

})();
