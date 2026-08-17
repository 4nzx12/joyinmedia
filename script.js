/* ═══════════════════════════════════════════════
   JOYIN MEDIA — script.js
   ═══════════════════════════════════════════════ */

(function () {
  'use strict';

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

  if (isMobile) {
    [dot, glow].forEach(el => { if (el) el.style.display = 'none'; });
  } else {
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let glowX  = mouseX;
    let glowY  = mouseY;

    document.addEventListener('mousemove', e => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (dot) { dot.style.left = mouseX + 'px'; dot.style.top = mouseY + 'px'; }
    });

    (function animateCursor() {
      glowX += (mouseX - glowX) * 0.14;
      glowY += (mouseY - glowY) * 0.14;

      if (glow) { glow.style.left = glowX + 'px'; glow.style.top = glowY + 'px'; }

      requestAnimationFrame(animateCursor);
    })();

    const interactiveSelector = 'a, button, .cs-card, .contact-card, .faq-item, .service-item, .team-member, .t-logo';
    document.querySelectorAll(interactiveSelector).forEach(el => {
      el.addEventListener('mouseenter', () => {
        if (dot) dot.classList.add('hover');
        if (glow) glow.classList.add('hover');
      });
      el.addEventListener('mouseleave', () => {
        if (dot) dot.classList.remove('hover');
        if (glow) glow.classList.remove('hover');
      });
    });

    document.addEventListener('mousedown', () => {
      if (dot) dot.classList.add('click');
      if (glow) glow.classList.add('click');
    });
    document.addEventListener('mouseup', () => {
      if (dot) dot.classList.remove('click');
      if (glow) glow.classList.remove('click');
    });

    document.addEventListener('mouseleave', () => {
      if (dot) dot.style.opacity = '0';
      if (glow) glow.style.opacity = '0';
    });
    document.addEventListener('mouseenter', () => {
      if (dot) dot.style.opacity = '1';
      if (glow) glow.style.opacity = '1';
    });
  }


  /* ══════════════════════════════════════
     2. THEME TOGGLE
  ══════════════════════════════════════ */
  const themeToggle = document.getElementById('themeToggle');
  const html        = document.documentElement;
  const videoBg     = document.getElementById('videoBg');
  const videoSrc    = document.getElementById('videoSrc');

  const LIGHT_VID = 'https://res.cloudinary.com/debkiwitn/video/upload/v1775921496/lightmode_background_vtahka.mp4';
  const DARK_VID  = 'https://res.cloudinary.com/debkiwitn/video/upload/v1775925902/darkmode_background_1_i4zroh.mp4';

  function applyTheme(theme) {
    html.setAttribute('data-theme', theme);
    localStorage.setItem('jm-theme', theme);
    videoSrc.src = theme === 'dark' ? DARK_VID : LIGHT_VID;
    videoBg.load();
    videoBg.play().catch(() => {});
  }

  const saved   = localStorage.getItem('jm-theme');
  const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(saved || (sysDark ? 'dark' : 'light'));

  themeToggle.addEventListener('click', () => {
    applyTheme(html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });

  /* ══════════════════════════════════════
     VIDEO + PAGE REVEAL SEQUENCE
     - Wait for video to be ready (canplaythrough) then fade video in
     - After 0.5s delay, slowly reveal the rest of the page
  ══════════════════════════════════════ */
  (function pageReveal() {
    if (!videoBg) return;

    function revealPage() {
      // show video
      document.body.classList.add('video-visible');
      // after 0.5s gap, reveal content slowly
      setTimeout(() => document.body.classList.add('page-visible'), 500);
    }

    // If video already has enough data, reveal immediately
    if (videoBg.readyState >= 3) {
      // small microtask to ensure CSS is applied
      requestAnimationFrame(() => setTimeout(revealPage, 80));
      return;
    }

    // Otherwise wait for canplaythrough or loadeddata as a fallback
    const onCanPlay = () => { revealPage(); cleanup(); };
    const onLoaded  = () => { revealPage(); cleanup(); };
    const cleanup = () => {
      videoBg.removeEventListener('canplaythrough', onCanPlay);
      videoBg.removeEventListener('loadeddata', onLoaded);
      if (timeoutId) clearTimeout(timeoutId);
    };

    videoBg.addEventListener('canplaythrough', onCanPlay);
    videoBg.addEventListener('loadeddata', onLoaded);

    // Fallback: reveal after 2.5s so we never block the page indefinitely
    const timeoutId = setTimeout(() => { revealPage(); cleanup(); }, 2500);
  })();


  /* ══════════════════════════════════════
     TRUST BAR DUPLICATION FOR INFINITE SCROLL
  ══════════════════════════════════════ */
  const trustInner = document.getElementById('trustInner');
  if (trustInner) {
    const originalHTML = trustInner.innerHTML;
    trustInner.innerHTML = originalHTML + originalHTML;

    let marqueeWidth = 0;
    let marqueeSpeed = 0.8;
    let marqueeOffset = 0;

    function updateMarqueeWidth() {
      const items = Array.from(trustInner.children);
      const half = items.length / 2;
      const gap = parseFloat(getComputedStyle(trustInner).gap || getComputedStyle(trustInner).columnGap || 0);
      const firstSetWidth = items.slice(0, half).reduce((sum, item) => sum + item.getBoundingClientRect().width, 0);
      marqueeWidth = firstSetWidth + gap * Math.max(half - 1, 0);
      trustInner.style.setProperty('--scroll-width', `${marqueeWidth}px`);
    }

    function animateMarquee() {
      marqueeOffset += marqueeSpeed;
      if (marqueeOffset >= marqueeWidth) {
        marqueeOffset -= marqueeWidth;
      }
      trustInner.style.transform = `translate3d(-${marqueeOffset}px, 0, 0)`;
      requestAnimationFrame(animateMarquee);
    }

    updateMarqueeWidth();
    requestAnimationFrame(animateMarquee);
    window.addEventListener('resize', updateMarqueeWidth, { passive: true });
  }


  /* ══════════════════════════════════════
     3. SMOOTH NAVIGATION
  ══════════════════════════════════════ */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
    });
  });


  /* ══════════════════════════════════════
     4. NAVBAR SCROLL SHADOW
  ══════════════════════════════════════ */
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.style.boxShadow = window.scrollY > 60
      ? '0 8px 40px rgba(0,0,0,0.20)'
      : '0 4px 30px rgba(0,0,0,0.10)';
  }, { passive: true });


  /* ══════════════════════════════════════
     5. SCROLL FADE-IN
  ══════════════════════════════════════ */
  const fadeObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); fadeObserver.unobserve(e.target); }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

  document.querySelectorAll('.fade-in').forEach(el => fadeObserver.observe(el));


  /* ══════════════════════════════════════
     6. CLIENT PROOF ROTATION
  ══════════════════════════════════════ */
  const randomHeights = (count = 7) => Array.from({ length: count }, () => 30 + Math.random() * 70);

  const clientStories = [
    {
      logo: 'https://res.cloudinary.com/debkiwitn/image/upload/v1786889618/ChatGPT_Image_Aug_16_2026_05_55_55_PM_xegi6i.png',
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
      logo: 'https://res.cloudinary.com/debkiwitn/image/upload/v1786889619/71593f62-fb44-49e9-a45a-7ba3accc32ed_z8cl4f.png',
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
      logo: 'https://res.cloudinary.com/debkiwitn/image/upload/v1786889619/ChatGPT_Image_Aug_16_2026_06_17_23_PM_saydo4.png',
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
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let activeClientIndex = 0;
  let rotationTimer = null;
  let isPaused = false;

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
    if (isPaused || prefersReducedMotion) return;
    stopRotation();
    rotationTimer = setTimeout(() => {
      const nextIndex = (activeClientIndex + 1) % clientStories.length;
      fadeToClient(nextIndex);
    }, 5000);
  }

  function fadeToClient(nextIndex) {
    if (prefersReducedMotion) {
      activeClientIndex = nextIndex;
      renderClient(activeClientIndex);
      startRotation();
      return;
    }

    stopRotation();

    rotatingStoryEls.forEach(el => {
      el.classList.add('is-fading');
    });

    setTimeout(() => {
      activeClientIndex = nextIndex;
      renderClient(activeClientIndex);
      requestAnimationFrame(() => {
        rotatingStoryEls.forEach(el => {
          el.classList.remove('is-fading');
        });
      });
      setTimeout(() => {
        if (!isPaused) startRotation();
      }, 250);
    }, 700);
  }

  clientButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.clientIndex);
      if (Number.isNaN(index) || index === activeClientIndex) return;
      fadeToClient(index);
    });
  });

  if (clientProofSection) {
    clientProofSection.addEventListener('mouseenter', () => {
      isPaused = true;
      stopRotation();
    });
    clientProofSection.addEventListener('mouseleave', () => {
      isPaused = false;
      startRotation();
    });
    clientProofSection.addEventListener('focusin', () => {
      isPaused = true;
      stopRotation();
    });
    clientProofSection.addEventListener('focusout', () => {
      isPaused = false;
      startRotation();
    });
  }

  renderClient(activeClientIndex);
  startRotation();

  /* ══════════════════════════════════════
     7. FEATURED WORK CAROUSEL
  ══════════════════════════════════════ */
  const featuredStage = document.getElementById('featuredStage');
  const featuredDots = document.getElementById('featuredDots');
  const prevBtn = document.querySelector('.cs-prev');
  const nextBtn = document.querySelector('.cs-next');
  let featuredItems = [];
  let activeSlide = 0;

  function setActiveSlide(index) {
    if (!featuredItems.length || !featuredStage) return;
    activeSlide = (index + featuredItems.length) % featuredItems.length;

    const cards = Array.from(featuredStage.children);
    cards.forEach((card, i) => {
      const offset = i - activeSlide;
      const abs = Math.abs(offset);
      const opacity = abs > 2 ? 0 : 1 - abs * 0.2;
      const scale = abs === 0 ? 1 : 1 - abs * 0.08;
      const translateX = offset * 230;
      const translateY = abs === 0 ? 0 : abs * 14;
      const rotateY = offset * 12;
      const zIndex = 100 - abs;

      card.style.transform = `translate3d(${translateX}px, ${translateY}px, 0) rotateY(${rotateY}deg) scale(${scale})`;
      card.style.opacity = opacity;
      card.style.zIndex = zIndex;
      card.style.filter = abs === 0 ? 'none' : 'saturate(0.85) brightness(0.85)';
      card.classList.toggle('is-active', i === activeSlide);
    });

    Array.from(featuredDots.children).forEach((dot, i) => {
      dot.classList.toggle('active', i === activeSlide);
      dot.setAttribute('aria-current', i === activeSlide ? 'true' : 'false');
    });
  }

  /* ══════════════════════════════════════
     FEATURED WORK CAROUSEL — Premium Edition
  ══════════════════════════════════════ */
  const projectsData = [
    { type: 'video', title: 'Aabis Chai', category: 'Brand Story', src: 'https://res.cloudinary.com/debkiwitn/video/upload/v1786912823/aabis_chai_video_fjrhgg.mp4', accent: '#ff6b00' },
    { type: 'video', title: 'Beatbox', category: 'Voice Over', src: 'https://res.cloudinary.com/debkiwitn/video/upload/v1786912823/beatbox_voice_over_vid_weorjx.mp4', accent: '#ff8c42' },
    { type: 'video', title: 'Model Shoot', category: 'Fashion Film', src: 'https://res.cloudinary.com/debkiwitn/video/upload/v1786912826/3_vm5fej.mp4', accent: '#ff6b00' },
    { type: 'video', title: 'Bike Edit', category: 'Action Film', src: 'https://res.cloudinary.com/debkiwitn/video/upload/v1786912982/bike_edit_pazbcb.mp4', accent: '#ff8c42' },
    { type: 'video', title: 'Card Edit', category: 'Motion Design', src: 'https://res.cloudinary.com/debkiwitn/video/upload/v1786912999/card_edko_juyg6s.mp4', accent: '#ff6b00' },
    { type: 'video', title: 'Troll Video', category: 'Comedy Edit', src: 'https://res.cloudinary.com/debkiwitn/video/upload/v1786913013/Troll_video_iixkvw.mp4', accent: '#ff8c42' },
    { type: 'video', title: 'Friends', category: 'Social Content', src: 'https://res.cloudinary.com/debkiwitn/video/upload/v1786913294/boy_and_friend_ieono1.mp4', accent: '#ff6b00' },
    { type: 'video', title: 'Shaskamaka', category: 'Product Feature', src: 'https://res.cloudinary.com/debkiwitn/video/upload/v1786913306/shaskamaka_1_chaya_1_milkshake_olbfpt.mp4', accent: '#ff8c42' },
    { type: 'video', title: 'Cafe Edit', category: 'Brand Content', src: 'https://res.cloudinary.com/debkiwitn/video/upload/v1786913313/shaskamaka_ciggerate_video_s3rs6n.mp4', accent: '#ff6b00' }
  ];

  let autoRotateTimeout;
  let isDragging = false;
  let dragStart = 0;
  let dragOffset = 0;

  function updateCarouselCards() {
    if (!featuredStage) return;
    const cards = featuredStage.querySelectorAll('.cs-card');
    const totalCards = cards.length;

    cards.forEach((card, i) => {
      const offset = ((i - activeSlide) % totalCards + totalCards) % totalCards;
      let distanceFromCenter = offset;
      if (distanceFromCenter > totalCards / 2) distanceFromCenter -= totalCards;

      const absDistance = Math.abs(distanceFromCenter);
      let scale = 1 - absDistance * 0.18;
      let blur = absDistance * 3;
      let opacity = absDistance === 0 ? 1 : 0.85 - absDistance * 0.25;
      let rotateY = distanceFromCenter * 35;
      let translateZ = -absDistance * 120;
      let zIndex = 10 - absDistance;
      let boxShadowOpacity = Math.max(0.1, 0.4 - absDistance * 0.08);

      scale = Math.max(0.45, Math.min(1.05, scale));
      opacity = Math.max(0.2, Math.min(1, opacity));
      blur = Math.min(blur, 8);

      // Spread cards horizontally with distance-based positioning, centered on active card
      const cardSpacing = 380; // pixels between each card
      const horizontalSpread = distanceFromCenter * cardSpacing;

      card.style.left = '50%';
      card.style.transform = `translateX(calc(-50% + ${horizontalSpread}px + ${dragOffset}px)) scale(${scale}) rotateY(${rotateY}deg) translateZ(${translateZ}px)`;
      card.style.filter = `blur(${blur}px)`;
      card.style.opacity = opacity;
      card.style.zIndex = Math.floor(zIndex);
      card.style.boxShadow = `0 ${20 + absDistance * 10}px ${40 + absDistance * 20}px rgba(0,0,0,${boxShadowOpacity}), 0 0 ${50 + absDistance * 20}px rgba(255,107,0,${Math.max(0, 0.08 - absDistance * 0.02)})`;

      card.classList.toggle('is-active', i === activeSlide);

      // Video autoplay logic
      const video = card.querySelector('video');
      if (video) {
        if (i === activeSlide) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      }
    });

    // Update progress indicator
    const progressEl = document.getElementById('csProgress');
    if (progressEl) {
      progressEl.innerHTML = `<span class="cs-progress-num">${String(activeSlide + 1).padStart(2, '0')}</span><div class="cs-progress-bar"><div class="cs-progress-fill" style="width: ${((activeSlide + 1) / totalCards) * 100}%"></div></div><span class="cs-progress-num">${String(totalCards).padStart(2, '0')}</span>`;
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
    autoRotateTimeout = setTimeout(() => {
      activeSlide = (activeSlide + 1) % projectsData.length;
      updateCarouselCards();
      startAutoRotate();
    }, 5000);
  }

  function buildCarousel() {
    if (!featuredStage || !featuredDots) return;

    featuredStage.innerHTML = '';
    featuredDots.innerHTML = '';

    projectsData.forEach((project, index) => {
      const card = document.createElement('article');
      card.className = 'cs-card';
      card.setAttribute('aria-label', `${project.title} – ${project.category}`);
      card.setAttribute('data-project-index', index);
      card.setAttribute('data-accent', project.accent);

      const mediaWrap = document.createElement('div');
      mediaWrap.className = 'cs-media';

      const media = document.createElement('video');
      media.src = project.src;
      media.loop = true;
      media.muted = true;
      media.playsInline = true;
      media.preload = 'metadata';
      media.className = 'cs-vid';

      mediaWrap.appendChild(media);

      const glassOverlay = document.createElement('div');
      glassOverlay.className = 'cs-glass-overlay';

      card.appendChild(mediaWrap);
      card.appendChild(glassOverlay);
      featuredStage.appendChild(card);

      card.addEventListener('click', () => openFullscreen(index));

      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'cs-dot';
      dot.setAttribute('aria-label', `Go to ${project.title}`);
      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        setActiveSlide(index);
        pauseAutoRotate();
      });
      featuredDots.appendChild(dot);
    });

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        activeSlide = (activeSlide - 1 + projectsData.length) % projectsData.length;
        updateCarouselCards();
        pauseAutoRotate();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        activeSlide = (activeSlide + 1) % projectsData.length;
        updateCarouselCards();
        pauseAutoRotate();
      });
    }

    // Drag/swipe interaction
    const viewport = document.querySelector('.cs-viewport');
    if (viewport) {
      viewport.addEventListener('pointerdown', (e) => {
        isDragging = true;
        dragStart = e.clientX || e.touches?.[0]?.clientX;
        dragOffset = 0;
        pauseAutoRotate();
      });

      document.addEventListener('pointermove', (e) => {
        if (!isDragging || !dragStart) return;
        const current = e.clientX || e.touches?.[0]?.clientX;
        dragOffset = current - dragStart;
        updateCarouselCards();
      });

      document.addEventListener('pointerup', () => {
        if (!isDragging) return;
        isDragging = false;
        const threshold = 50;
        if (Math.abs(dragOffset) > threshold) {
          if (dragOffset > 0) {
            activeSlide = (activeSlide - 1 + projectsData.length) % projectsData.length;
          } else {
            activeSlide = (activeSlide + 1) % projectsData.length;
          }
        }
        dragOffset = 0;
        updateCarouselCards();
        startAutoRotate();
      });
    }

    // Keyboard controls
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        activeSlide = (activeSlide - 1 + projectsData.length) % projectsData.length;
        updateCarouselCards();
        pauseAutoRotate();
      } else if (e.key === 'ArrowRight') {
        activeSlide = (activeSlide + 1) % projectsData.length;
        updateCarouselCards();
        pauseAutoRotate();
      } else if (e.key === 'Enter') {
        openFullscreen(activeSlide);
      } else if (e.key === 'Escape') {
        closeFullscreen();
      }
    });

    updateCarouselCards();
    startAutoRotate();
  }

  function openFullscreen(index) {
    const project = projectsData[index];
    if (!project) return;

    const modal = document.createElement('div');
    modal.className = 'cs-fullscreen';
    modal.innerHTML = `
      <div class="cs-fullscreen-wrap">
        <button class="cs-fullscreen-close" type="button" aria-label="Close">×</button>
        <button class="cs-fullscreen-prev" type="button" aria-label="Previous">←</button>
        <button class="cs-fullscreen-next" type="button" aria-label="Next">→</button>
        <div class="cs-fullscreen-media">
          <video src="${project.src}" controls autoplay loop muted playsinline></video>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('.cs-fullscreen-close').addEventListener('click', closeFullscreen);
    modal.querySelector('.cs-fullscreen-prev').addEventListener('click', () => {
      modal.remove();
      openFullscreen((index - 1 + projectsData.length) % projectsData.length);
    });
    modal.querySelector('.cs-fullscreen-next').addEventListener('click', () => {
      modal.remove();
      openFullscreen((index + 1) % projectsData.length);
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeFullscreen();
    });
  }

  function closeFullscreen() {
    const modal = document.querySelector('.cs-fullscreen');
    if (modal) modal.remove();
  }

  buildCarousel();



  /* ══════════════════════════════════════
     8. PACKAGE CARD 3D TILT
  ══════════════════════════════════════ */
  document.querySelectorAll('.package-card').forEach(card => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;
      const rotateY = (px - 0.5) * 6;
      const rotateX = (0.5 - py) * 6;

      card.style.setProperty('--tilt-x', `${rotateX}deg`);
      card.style.setProperty('--tilt-y', `${rotateY}deg`);
      card.classList.add('is-tilting');
    });

    card.addEventListener('pointerleave', () => {
      card.style.setProperty('--tilt-x', '0deg');
      card.style.setProperty('--tilt-y', '0deg');
      card.classList.remove('is-tilting');
    });

    card.addEventListener('click', () => {
      const isOpen = card.classList.contains('is-open');
      document.querySelectorAll('.package-card').forEach(item => {
        item.classList.remove('is-open');
        item.setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) {
        card.classList.add('is-open');
        card.setAttribute('aria-expanded', 'true');
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
    studio: 'https://maps.app.goo.gl/quzpLtNU751EgHiT9'
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
    { selector: '.contact-card:nth-child(4)', href: contactConfig.studio }
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

    const revealTimeline = () => {
      const rect = timelineContainer.getBoundingClientRect();
      const containerInView = rect.top < window.innerHeight * 0.9 && rect.bottom > window.innerHeight * 0.1;
      
      // Trigger animation only once when container comes into view
      if (containerInView && !animationTriggered) {
        timelineContainer.classList.add('active');
        animationTriggered = true;
      }
      
      // Show milestone dots immediately
      timelineItems.forEach((item, index) => {
        const itemRect = item.getBoundingClientRect();
        const visible = itemRect.top < window.innerHeight * 0.82 && itemRect.bottom > window.innerHeight * 0.18;
        
        if (visible) {
          item.classList.add('active');
        }
      });
    };

    revealTimeline();
    window.addEventListener('scroll', revealTimeline, { passive: true });
    window.addEventListener('resize', revealTimeline, { passive: true });
  }

})();
