/* ═══════════════════════════════════════════════
   JOYIN MEDIA — script.js
   ═══════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ══════════════════════════════════════
     1. CUSTOM CURSOR
  ══════════════════════════════════════ */
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

  (function animateRing() {
    ringX += (mouseX - ringX) * 0.13;
    ringY += (mouseY - ringY) * 0.13;
    ring.style.left = ringX + 'px';
    ring.style.top  = ringY + 'px';
    requestAnimationFrame(animateRing);
  })();

  const interactiveSelector = 'a, button, .cs-card, .contact-card, .faq-item, .service-item, .team-member, .t-logo';
  document.querySelectorAll(interactiveSelector).forEach(el => {
    el.addEventListener('mouseenter', () => { dot.classList.add('hover');  ring.classList.add('hover');  });
    el.addEventListener('mouseleave', () => { dot.classList.remove('hover'); ring.classList.remove('hover'); });
  });
  document.addEventListener('mousedown', () => dot.classList.add('click'));
  document.addEventListener('mouseup',   () => dot.classList.remove('click'));
  document.addEventListener('mouseleave', () => { dot.style.opacity = '0'; ring.style.opacity = '0'; });
  document.addEventListener('mouseenter', () => { dot.style.opacity = '1'; ring.style.opacity = '1'; });


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
     6. FAQ ACCORDION
  ══════════════════════════════════════ */
  document.querySelectorAll('.faq-item').forEach(item => {
    const btn = item.querySelector('.faq-q');
    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      // close all
      document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });


  /* ══════════════════════════════════════
     7. FEATURED WORK — CENTER STAGE CAROUSEL
  ══════════════════════════════════════ */
  (function initCarousel() {
    const stage    = document.getElementById('csStage');
    if (!stage) return;
    const cards    = Array.from(stage.querySelectorAll('.cs-card'));
    const dotsWrap = document.getElementById('csDots');
    const prevBtn  = document.getElementById('csPrev');
    const nextBtn  = document.getElementById('csNext');
    const carousel = document.getElementById('csCarousel');
    const n        = cards.length;

    let active   = Math.floor(n / 2);  // start at middle card
    let isDragging = false;
    let dragStartX = 0;
    let dragDelta  = 0;
    let isAnimating = false;

    // Build dots
    cards.forEach((_, i) => {
      const d = document.createElement('div');
      d.className = 'cs-dot' + (i === active ? ' active' : '');
      d.addEventListener('click', () => { pauseAutoPlay(); goTo(i); });
      dotsWrap.appendChild(d);
    });
    const dots = Array.from(dotsWrap.querySelectorAll('.cs-dot'));

    /* ── Card config by offset from active ── */
    function getConfig(offset, cardWidth) {
      const abs  = Math.abs(offset);
      const sign = offset >= 0 ? 1 : -1;

      if (abs === 0) return {
        x: 0, scale: 1, rotY: 0,
        blur: 0, opacity: 1, zIndex: 10, visible: true
      };
      if (abs === 1) return {
        x: sign * (cardWidth * 0.75 + 16), scale: 0.82, rotY: sign * -28,
        blur: 2, opacity: 0.85, zIndex: 7, visible: true
      };
      if (abs === 2) return {
        x: sign * (cardWidth * 1.35 + 20), scale: 0.65, rotY: sign * -45,
        blur: 4, opacity: 0.55, zIndex: 4, visible: true
      };
      if (abs === 3) return {
        x: sign * (cardWidth * 1.85 + 24), scale: 0.52, rotY: sign * -55,
        blur: 7, opacity: 0.28, zIndex: 2, visible: true
      };
      return {
        x: sign * (cardWidth * 2.2), scale: 0.4, rotY: sign * -60,
        blur: 10, opacity: 0, zIndex: 1, visible: false
      };
    }

    /* ── Apply transforms ── */
    function applyLayout(drag) {
      const cardW = cards[0] ? cards[0].offsetWidth : 280;
      drag = drag || 0;

      cards.forEach((card, i) => {
        const rawOffset = i - active;
        // Handle wrap-around for circular feel
        let offset = rawOffset;
        if (rawOffset > n / 2)  offset = rawOffset - n;
        if (rawOffset < -n / 2) offset = rawOffset + n;

        const cfg = getConfig(offset, cardW);
        const dragShift = drag ? drag * 0.35 : 0;

        card.style.transform = `
          translateX(calc(-50% + ${cfg.x + dragShift}px))
          scale(${cfg.scale})
          rotateY(${cfg.rotY}deg)
        `;
        card.style.filter   = cfg.blur > 0 ? `blur(${cfg.blur}px)` : 'none';
        card.style.opacity  = cfg.opacity;
        card.style.zIndex   = cfg.zIndex;
        card.style.visibility = cfg.visible ? 'visible' : 'hidden';

        card.classList.toggle('is-active', i === active);
      });

      // Update dots
      dots.forEach((d, i) => d.classList.toggle('active', i === active));

      // Handle video autoplay
      cards.forEach((card, i) => {
        const vid = card.querySelector('.cs-vid');
        if (!vid) return;
        if (i === active) {
          vid.play().catch(() => {});
        } else {
          vid.pause();
        }
      });
    }

    /* ── Autoplay / idle resume ── */
    const AUTO_DELAY = 2500;
    const IDLE_DELAY = 2000;
    let autoPlayTimer = null;
    let resumeTimer = null;

    function startAutoPlay() {
      stopAutoPlay();
      autoPlayTimer = window.setInterval(() => goTo(active + 1), AUTO_DELAY);
    }

    function stopAutoPlay() {
      if (autoPlayTimer !== null) {
        window.clearInterval(autoPlayTimer);
        autoPlayTimer = null;
      }
    }

    function pauseAutoPlay() {
      stopAutoPlay();
      if (resumeTimer !== null) {
        window.clearTimeout(resumeTimer);
      }
      resumeTimer = window.setTimeout(startAutoPlay, IDLE_DELAY);
    }

    /* ── Go to index ── */
    function goTo(idx) {
      if (isAnimating) return;
      active = ((idx % n) + n) % n;
      applyLayout();
    }

    /* ── Arrow buttons ── */
    prevBtn.addEventListener('click', () => { pauseAutoPlay(); goTo(active - 1); });
    nextBtn.addEventListener('click', () => { pauseAutoPlay(); goTo(active + 1); });

    /* ── Click to center ── */
    cards.forEach((card, i) => {
      card.addEventListener('click', () => {
        if (Math.abs(dragDelta) > 5) return; // ignore drag-release
        pauseAutoPlay();
        goTo(i);
      });
    });

    /* ── Drag / swipe ── */
    function onDragStart(x) {
      isDragging = true;
      dragStartX = x;
      dragDelta  = 0;
      stage.style.transition = 'none';
      cards.forEach(c => c.style.transition = 'opacity 0.3s, filter 0.3s, visibility 0.3s');
    }
    function onDragMove(x) {
      if (!isDragging) return;
      dragDelta = x - dragStartX;
      applyLayout(dragDelta);
    }
    function onDragEnd() {
      if (!isDragging) return;
      isDragging = false;
      cards.forEach(c => c.style.transition = '');

      const threshold = 60;
      if (dragDelta < -threshold) goTo(active + 1);
      else if (dragDelta > threshold) goTo(active - 1);
      else applyLayout(0);

      dragDelta = 0;
    }

    // Mouse
    carousel.addEventListener('mousedown', e => { pauseAutoPlay(); onDragStart(e.clientX); });
    window.addEventListener('mousemove',   e => { if (isDragging) onDragMove(e.clientX); });
    window.addEventListener('mouseup',     ()  => { onDragEnd(); pauseAutoPlay(); });

    // Touch
    carousel.addEventListener('touchstart', e => { pauseAutoPlay(); onDragStart(e.touches[0].clientX); }, { passive: true });
    carousel.addEventListener('touchmove',  e => onDragMove(e.touches[0].clientX),  { passive: true });
    carousel.addEventListener('touchend',   ()  => { onDragEnd(); pauseAutoPlay(); });

    // Keyboard
    document.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft')  { pauseAutoPlay(); goTo(active - 1); }
      if (e.key === 'ArrowRight') { pauseAutoPlay(); goTo(active + 1); }
    });

    // Initial render — set transition=none for first paint
    cards.forEach(c => { c.style.transition = 'none'; });
    goTo(Math.floor(n / 2));
    startAutoPlay();
    // Re-enable transitions after first frame
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        cards.forEach(c => { c.style.transition = ''; });
      });
    });

    // Resize
    window.addEventListener('resize', () => applyLayout(0));

  })(); // end initCarousel


  /* ══════════════════════════════════════
     8. CONTACT FORM — WhatsApp & Email
  ══════════════════════════════════════ */
  const WA_NUMBER  = '919895012345'; // +91 98950 12345

  function getFormData() {
    const name    = (document.getElementById('cf-name').value    || '').trim();
    const phone   = (document.getElementById('cf-phone').value   || '').trim();
    const service = (document.getElementById('cf-service').value || '').trim();
    const message = (document.getElementById('cf-message').value || '').trim();
    return { name, phone, service, message };
  }

  function validateForm() {
    const { name, message } = getFormData();
    if (!name)    { alert('Please enter your name.'); return false; }
    if (!message) { alert('Please describe your project.'); return false; }
    return true;
  }

  // WhatsApp submit
  document.getElementById('sendWhatsApp').addEventListener('click', () => {
    if (!validateForm()) return;
    const { name, phone, service, message } = getFormData();

    let text = `Hello! My name is *${name}*.`;
    if (phone)   text += `\nPhone: ${phone}`;
    if (service) text += `\n\nService Enquiry: *${service}*`;
    text += `\n\nProject Details:\n${message}`;

    const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  });

  // Email submit
  document.getElementById('sendEmail').addEventListener('click', () => {
    if (!validateForm()) return;
    const { name, phone, service, message } = getFormData();

    const subject = service
      ? `Enquiry: ${service} — ${name}`
      : `Project Enquiry from ${name}`;

    let body = `Hi Joyin Media,\n\nMy name is ${name}.`;
    if (phone)   body += `\nPhone: ${phone}`;
    if (service) body += `\nService Needed: ${service}`;
    body += `\n\nProject Details:\n${message}\n\nLooking forward to hearing from you.`;

    const mailUrl = `mailto:joyinmediahouse@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailUrl;
  });

})();
