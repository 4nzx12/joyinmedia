import { useEffect } from 'react';

const revealGroups = [
  ['.hero-cta', 90],
  ['.trust-label, .trust-outer', 100],
  ['.timeline-header > *', 85],
  ['.services-section > .section-label, .services-section > .section-title', 85],
  ['.package-card', 130],
  ['.featured-section > .section-label, .featured-section > .section-title, .cs-carousel', 100],
  ['.client-proof-section > .section-label, .client-proof-section > .section-title, .logo-row, .proof-layout', 90],
  ['.contact-section > .section-label, .contact-section > .section-title, .contact-form-wrap', 100],
  ['.contact-info > .contact-card', 90],
  ['.footer-invitation > *, .footer-top > *, .footer-bottom', 75],
];

// DOM writes here are limited to visual effects and focus; React owns content/state.
export default function usePageMotion() {
  useEffect(() => {
    const root = document.getElementById('root');
    const html = document.documentElement;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const controller = new AbortController();
    const { signal } = controller;
    const navbar = root.querySelector('.navbar');
    const links = [...root.querySelectorAll('.nav-link')].map(link => ({ link, section: document.getElementById(link.hash.slice(1)), top: 0 }));
    let frame = 0;
    let pageRange = 1;

    function paint() {
      frame = 0;
      const scroll = Math.max(0, window.scrollY);
      html.style.setProperty('--scroll-progress', Math.min(1, scroll / pageRange).toFixed(4));
      navbar.classList.toggle('is-scrolled', scroll > 60);
      const active = [...links].reverse().find(item => item.top <= scroll + window.innerHeight * 0.35);
      links.forEach(item => {
        item.link.classList.toggle('is-current', item === active);
        if (item === active) item.link.setAttribute('aria-current', 'location');
        else item.link.removeAttribute('aria-current');
      });
    }
    function queue() { if (!frame) frame = requestAnimationFrame(paint); }
    function measure() {
      pageRange = Math.max(1, html.scrollHeight - window.innerHeight);
      links.forEach(item => { item.top = item.section.getBoundingClientRect().top + window.scrollY; });
      queue();
    }
    window.addEventListener('scroll', queue, { passive: true, signal });
    window.addEventListener('resize', measure, { passive: true, signal });
    window.addEventListener('load', measure, { once: true, signal });
    motion.addEventListener('change', queue, { signal });
    const resize = new ResizeObserver(measure);
    resize.observe(root);
    measure();
    document.body.classList.add('page-visible');

    root.addEventListener('click', event => {
      const anchor = event.target.closest('a[href^="#"]');
      if (!anchor || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const hash = anchor.getAttribute('href');
      const target = document.getElementById(hash.slice(1));
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: motion.matches ? 'instant' : 'smooth', block: 'start' });
      if (window.location.hash !== hash) history.pushState(null, '', hash);
      if (!target.hasAttribute('tabindex')) {
        target.setAttribute('tabindex', '-1');
        target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true, signal });
      }
      target.focus({ preventScroll: true });
    }, { signal });

    const pending = new Set();
    const animations = new Set();
    const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) reveal(entry.target); });
    }, { threshold: 0, rootMargin: '0px 0px -6% 0px' }) : null;

    function reveal(element, immediate = false) {
      if (!pending.has(element)) return;
      observer?.unobserve(element);
      pending.delete(element);
      element.removeAttribute('data-motion-pending');
      if (motion.matches || immediate) return;
      const animation = element.animate([{ opacity: 0, translate: '0 28px' }, { opacity: 1, translate: '0 0' }], {
        duration: 850, delay: Number(element.dataset.motionDelay), easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'backwards',
      });
      animations.add(animation);
      animation.finished.then(() => animations.delete(animation), () => animations.delete(animation));
    }
    if (observer && Element.prototype.animate && !motion.matches) {
      revealGroups.forEach(([selector, stagger]) => {
        root.querySelectorAll(selector).forEach((element, index) => {
          if (element.getBoundingClientRect().bottom < 0) return;
          element.dataset.motionDelay = String(Math.min(index * stagger, 300));
          element.setAttribute('data-motion-pending', '');
          pending.add(element);
          observer.observe(element);
        });
      });
    }
    document.addEventListener('focusin', event => {
      [...pending].forEach(element => {
        if (element === event.target || element.contains(event.target) || event.target.contains(element)) reveal(element, true);
      });
    }, { signal });
    motion.addEventListener('change', () => {
      if (!motion.matches) return;
      [...pending].forEach(element => reveal(element, true));
      animations.forEach(animation => animation.cancel());
    }, { signal });

    return () => {
      controller.abort();
      cancelAnimationFrame(frame);
      resize.disconnect();
      observer?.disconnect();
      pending.forEach(element => element.removeAttribute('data-motion-pending'));
      animations.forEach(animation => animation.cancel());
      document.body.classList.remove('page-visible');
      html.style.removeProperty('--scroll-progress');
    };
  }, []);
}
