import { useEffect, useRef } from 'react';
import { useMediaQuery, useReducedMotion } from '../hooks/useBrowserState.js';

export default function Cursor() {
  const dotRef = useRef(null);
  const glowRef = useRef(null);
  const reducedMotion = useReducedMotion();
  const finePointer = useMediaQuery('(hover: hover) and (pointer: fine)');

  useEffect(() => {
    if (reducedMotion || !finePointer) return;
    const dot = dotRef.current;
    const glow = glowRef.current;
    const html = document.documentElement;
    const controller = new AbortController();
    const { signal } = controller;
    let frame = 0;
    let lastTime = 0;
    let x = window.innerWidth / 2, y = window.innerHeight / 2, glowX = x, glowY = y;
    function animate(time) {
      frame = 0;
      const elapsed = lastTime ? Math.min(time - lastTime, 50) : 16;
      lastTime = time;
      const ease = 1 - Math.exp(-elapsed / 65);
      glowX += (x - glowX) * ease;
      glowY += (y - glowY) * ease;
      dot.style.translate = `${x}px ${y}px`;
      glow.style.translate = `${glowX}px ${glowY}px`;
      if (Math.abs(x - glowX) + Math.abs(y - glowY) > 0.15) frame = requestAnimationFrame(animate);
      else lastTime = 0;
    }
    function hide() {
      cancelAnimationFrame(frame);
      frame = 0;
      lastTime = 0;
      html.classList.remove('custom-cursor');
      [dot, glow].forEach(element => element.classList.remove('hover', 'click'));
    }
    document.addEventListener('pointermove', event => {
      if (document.hidden || event.pointerType === 'touch') return;
      // A native modal is in the top layer, above a custom cursor.
      if (event.target.closest('dialog')) { hide(); return; }
      html.classList.add('custom-cursor');
      x = event.clientX;
      y = event.clientY;
      const interactive = Boolean(event.target.closest('a, button, input, textarea, .t-logo'));
      [dot, glow].forEach(element => element.classList.toggle('hover', interactive));
      if (!frame) frame = requestAnimationFrame(animate);
    }, { passive: true, signal });
    document.addEventListener('pointerdown', () => [dot, glow].forEach(element => element.classList.add('click')), { signal });
    document.addEventListener('pointerup', () => [dot, glow].forEach(element => element.classList.remove('click')), { signal });
    document.addEventListener('mouseleave', hide, { signal });
    document.addEventListener('visibilitychange', hide, { signal });
    return () => { controller.abort(); hide(); };
  }, [reducedMotion, finePointer]);

  return <><div className="cursor-dot" ref={dotRef} aria-hidden="true" /><div className="cursor-glow" ref={glowRef} aria-hidden="true" /></>;
}
