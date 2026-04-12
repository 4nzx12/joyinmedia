/* ═══════════════════════════════════════════════
   JOYIN MEDIA — script.js
   ═══════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ────────────────────────────────────────
     1. CUSTOM CURSOR
  ──────────────────────────────────────── */
  const dot  = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let ringX  = mouseX;
  let ringY  = mouseY;

  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.left = mouseX + 'px';
    dot.style.top  = mouseY + 'px';
  });

  // Smooth ring follow
  function animateRing() {
    ringX += (mouseX - ringX) * 0.14;
    ringY += (mouseY - ringY) * 0.14;
    ring.style.left = ringX + 'px';
    ring.style.top  = ringY + 'px';
    requestAnimationFrame(animateRing);
  }
  animateRing();

  // Hover state — enlarge on interactive elements
  const hoverTargets = 'a, button, .portfolio-card, .contact-card, .arrow-btn, .theme-toggle, .nav-link';
  document.querySelectorAll(hoverTargets).forEach(el => {
    el.addEventListener('mouseenter', () => { dot.classList.add('hover'); ring.classList.add('hover'); });
    el.addEventListener('mouseleave', () => { dot.classList.remove('hover'); ring.classList.remove('hover'); });
  });

  // Click pulse
  document.addEventListener('mousedown', () => dot.classList.add('click'));
  document.addEventListener('mouseup',   () => dot.classList.remove('click'));

  // Hide cursor when mouse leaves window
  document.addEventListener('mouseleave', () => { dot.style.opacity = '0'; ring.style.opacity = '0'; });
  document.addEventListener('mouseenter', () => { dot.style.opacity = '1'; ring.style.opacity = '1'; });


  /* ────────────────────────────────────────
     2. THEME TOGGLE (Light ↔ Dark)
  ──────────────────────────────────────── */
  const themeToggle = document.getElementById('themeToggle');
  const html        = document.documentElement;
  const videoBg     = document.getElementById('videoBg');
  const videoSrc    = document.getElementById('videoSrc');

  const LIGHT_VIDEO = 'https://res.cloudinary.com/debkiwitn/video/upload/v1775921496/lightmode_background_vtahka.mp4';
  const DARK_VIDEO  = 'https://res.cloudinary.com/debkiwitn/video/upload/v1775925902/darkmode_background_1_i4zroh.mp4';

  function applyTheme(theme) {
    html.setAttribute('data-theme', theme);
    localStorage.setItem('jm-theme', theme);
    videoSrc.src = theme === 'dark' ? DARK_VIDEO : LIGHT_VIDEO;
    videoBg.load();
    videoBg.play().catch(() => {}); // autoplay policy fallback
  }

  // Initialise from saved preference or system preference
  const saved   = localStorage.getItem('jm-theme');
  const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(saved || (sysDark ? 'dark' : 'light'));

  themeToggle.addEventListener('click', () => {
    const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
  });


  /* ────────────────────────────────────────
     3. SMOOTH NAVIGATION
  ──────────────────────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const href = anchor.getAttribute('href');
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });


  /* ────────────────────────────────────────
     4. PORTFOLIO CAROUSELS
  ──────────────────────────────────────── */
  const CARD_WIDTH = 300; // px — must match CSS
  const CARD_GAP   = 12;  // px — must match CSS gap (1.2rem ≈ 19px, but we calc from DOM)

  document.querySelectorAll('.portfolio-section').forEach((section, sectionIdx) => {
    const track    = section.querySelector('.portfolio-track');
    const cards    = Array.from(section.querySelectorAll('.portfolio-card'));
    const prevBtn  = section.querySelector('.prev-btn');
    const nextBtn  = section.querySelector('.next-btn');
    const dotsWrap = section.querySelector('.carousel-dots');
    const wrap     = section.querySelector('.portfolio-track-wrap');

    let current = 0;
    let visibleCount = 1;

    // Build dots
    cards.forEach((_, i) => {
      const d = document.createElement('div');
      d.className = 'carousel-dot' + (i === 0 ? ' active' : '');
      dotsWrap.appendChild(d);
    });

    function getDots() { return Array.from(dotsWrap.querySelectorAll('.carousel-dot')); }

    function getVisibleCount() {
      const wrapWidth = wrap.offsetWidth;
      const cardEl = cards[0];
      if (!cardEl) return 1;
      const cardW = cardEl.offsetWidth;
      const gap   = parseInt(getComputedStyle(track).gap) || CARD_GAP;
      return Math.max(1, Math.floor((wrapWidth + gap) / (cardW + gap)));
    }

    function getCardStep() {
      const cardEl = cards[0];
      if (!cardEl) return CARD_WIDTH + CARD_GAP;
      return cardEl.offsetWidth + (parseInt(getComputedStyle(track).gap) || CARD_GAP);
    }

    function update(smooth = true) {
      visibleCount = getVisibleCount();
      const maxIdx = Math.max(0, cards.length - visibleCount);
      if (current > maxIdx) current = maxIdx;

      const step   = getCardStep();
      const offset = current * step;

      track.style.transition = smooth ? 'transform 0.55s cubic-bezier(0.4,0,0.2,1)' : 'none';
      track.style.transform  = `translateX(-${offset}px)`;

      // Buttons
      prevBtn.disabled = current === 0;
      nextBtn.disabled = current >= maxIdx;

      // Dots
      getDots().forEach((d, i) => d.classList.toggle('active', i === current));
    }

    prevBtn.addEventListener('click', () => { if (current > 0) { current--; update(); } });
    nextBtn.addEventListener('click', () => {
      const maxIdx = Math.max(0, cards.length - getVisibleCount());
      if (current < maxIdx) { current++; update(); }
    });

    // Dot click
    getDots().forEach((d, i) => {
      d.addEventListener('click', () => { current = i; update(); });
    });

    // Resize recalc
    window.addEventListener('resize', () => update(false));

    // Init
    update(false);

    // Touch swipe
    let touchStartX = 0;
    wrap.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
    wrap.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 50) {
        if (dx < 0) nextBtn.click();
        else        prevBtn.click();
      }
    }, { passive: true });
  });


  /* ────────────────────────────────────────
     5. GALLERY MODAL
  ──────────────────────────────────────── */
  const galleryData = {
    'photo-product':   { title: 'Product Photography',    type: 'photo',  items: ['Cosmetics', 'Footwear', 'Fragrance', 'Accessories', 'Watches', 'Apparel'] },
    'photo-model':     { title: 'Model Shoot',             type: 'photo',  items: ['Editorial 01', 'Editorial 02', 'Studio 01', 'Outdoor 01', 'Fashion 01'] },
    'photo-food':      { title: 'Food & Beverage',         type: 'photo',  items: ['Plating 01', 'Drinks 01', 'Desserts', 'Coffee', 'Flat Lay'] },
    'photo-event':     { title: 'Corporate & Events',      type: 'photo',  items: ['Conference', 'Launch Event', 'Seminar', 'Brand Activation'] },
    'video-product':   { title: 'Product Video',           type: 'video',  items: ['Hero Shot', 'Closeup Reel', 'Unboxing', 'Lifestyle Cut'] },
    'video-model':     { title: 'Model / Fashion Film',    type: 'video',  items: ['Runway Film', 'Editorial Reel', 'Lookbook'] },
    'video-commercial':{ title: 'Commercial & Ad',         type: 'video',  items: ['Brand Spot', '30-sec Ad', 'Cinematic Promo'] },
    'video-brand':     { title: 'Brand Films',             type: 'video',  items: ['Origin Story', 'Culture Doc', 'Launch Film'] },
    'design-brand':    { title: 'Brand Identity',          type: 'design', items: ['Logo System', 'Stationery', 'Brand Guidelines', 'Colour Palette'] },
    'design-social':   { title: 'Social Media Creatives',  type: 'design', items: ['Feed Post', 'Story Template', 'Carousel', 'Reel Cover'] },
    'design-print':    { title: 'Print & Packaging',       type: 'design', items: ['Brochure', 'Box Packaging', 'Poster', 'Catalogue'] },
    'design-motion':   { title: 'Motion Graphics',         type: 'video',  items: ['Title Card', 'Lower Third', 'Animated Logo', 'Kinetic Type'] },
  };

  const pexelIds = [
    '2529148','1036623','1640777','1181406','2577274',
    '1130626','3183150','3184338','196644','1779487',
    '1762851','267350','1667088','958545','3622608'
  ];

  function buildGallery(cat) {
    const data = galleryData[cat];
    if (!data) return '';
    let html = '';

    data.items.forEach((name, i) => {
      if (data.type === 'video') {
        html += `
          <div class="gallery-item-video">
            <i class="fas fa-play-circle"></i>
            <p>${name}</p>
            <video controls muted playsinline>
              <source src="https://res.cloudinary.com/debkiwitn/video/upload/v1775921496/lightmode_background_vtahka.mp4" type="video/mp4">
            </video>
          </div>`;
      } else if (data.type === 'design') {
        html += `
          <div class="gallery-item-design">
            <i class="fas fa-paint-brush"></i>
            <p>${name}</p>
            <div class="swatch"></div>
          </div>`;
      } else {
        const id = pexelIds[i % pexelIds.length];
        html += `<img
          src="https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop"
          alt="${name}" loading="lazy">`;
      }
    });

    return html;
  }

  const modal       = document.getElementById('galleryModal');
  const galleryGrid = document.getElementById('galleryGrid');
  const galleryTitle = document.getElementById('galleryTitle');
  const modalClose  = document.getElementById('modalClose');

  function openModal(cat) {
    const data = galleryData[cat];
    if (!data) return;
    galleryTitle.textContent = data.title + ' · Joyin Media';
    galleryGrid.innerHTML    = buildGallery(cat);
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.portfolio-card').forEach(card => {
    card.addEventListener('click', () => {
      const cat = card.getAttribute('data-cat');
      if (cat) openModal(cat);
    });
  });

  modalClose.addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });


  /* ────────────────────────────────────────
     6. SCROLL FADE-IN ANIMATIONS
  ──────────────────────────────────────── */
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));


  /* ────────────────────────────────────────
     7. NAVBAR SCROLL OPACITY ENHANCE
  ──────────────────────────────────────── */
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 60) {
      navbar.style.boxShadow = '0 8px 40px rgba(0,0,0,0.18)';
    } else {
      navbar.style.boxShadow = '0 4px 30px rgba(0,0,0,0.12)';
    }
  }, { passive: true });

})();